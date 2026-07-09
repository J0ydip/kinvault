const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const db = require('../db');
const authenticateToken = require('../middleware/auth');
const mediaQueue = require('../queues/mediaQueue');
const exifr = require('exifr');
const ffmpeg = require('fluent-ffmpeg');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const probeVideo = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) resolve(null); // Fail gracefully
      else resolve(metadata);
    });
  });
};

const router = express.Router();

// Define allowed mime types and extensions
const ALLOWED_MIME_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/x-msvideo': 'avi',
  'video/x-matroska': 'mkv',
  'video/quicktime': 'mov'
};

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'avi', 'mkv', 'mov'];


// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user.id;
    // The uploads directory is at the root of the project, one level up from backend
    const dir = path.join(__dirname, '../../uploads', `user_${userId}`);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = ALLOWED_MIME_TYPES[file.mimetype] || path.extname(file.originalname).toLowerCase().slice(1) || 'bin';
    cb(null, `${uniqueSuffix}.${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  if (ALLOWED_MIME_TYPES[file.mimetype] || ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only jpg, png, gif, mp4, avi, mkv, mov are allowed.'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 1024 } // 1GB limit for videos
});

// Upload route
router.post('/upload', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    const uploadedFiles = req.files;
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const savedMedia = [];
    
    // Process each uploaded file and save to DB
    for (const file of uploadedFiles) {
      const ext = path.extname(file.originalname).toLowerCase().slice(1);
      const isVideo = file.mimetype.startsWith('video/') || ['mp4', 'avi', 'mkv', 'mov'].includes(ext);
      const isImage = file.mimetype.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'heic'].includes(ext);
      
      // If the browser didn't send a proper mimetype but it's a known video extension, set it
      const normalizedMime = isVideo && !file.mimetype.startsWith('video/') 
        ? (ext === 'mp4' ? 'video/mp4' : (ext === 'mkv' ? 'video/x-matroska' : 'video/unknown')) 
        : file.mimetype;

      const initialStatus = isVideo ? 'processing' : 'ready';

      // --- Metadata Extraction ---
      let exifData = {};
      let videoDuration = null;

      if (isImage) {
        try {
          const raw = await exifr.parse(file.path, {
            tiff: true,
            exif: true,
            gps: true
          });
          if (raw) {
            exifData = {
              make: raw.Make || null,
              model: raw.Model || null,
              date_taken: raw.DateTimeOriginal || null,
              latitude: raw.latitude || null,
              longitude: raw.longitude || null,
              width: raw.ExifImageWidth || raw.ImageWidth || null,
              height: raw.ExifImageHeight || raw.ImageHeight || null,
              iso: raw.ISO || null,
              aperture: raw.FNumber || null,
              shutter_speed: raw.ExposureTime ? `1/${Math.round(1 / raw.ExposureTime)}` : null,
              focal_length: raw.FocalLength || null,
            };
          }
        } catch (exifErr) {
          console.warn('EXIF parse skipped for', file.originalname, exifErr.message);
        }
      } else if (isVideo) {
        try {
          const { exiftool } = require('exiftool-vendored');
          const etTags = await exiftool.read(file.path);
          require('fs').writeFileSync('exiftool_dump_' + Date.now() + '.json', JSON.stringify(etTags, null, 2));
          
          exifData.width = etTags.ImageWidth || etTags.SourceImageWidth || null;
          exifData.height = etTags.ImageHeight || etTags.SourceImageHeight || null;
          videoDuration = etTags.Duration || null;
          
          exifData.make = etTags.Make || etTags.AndroidManufacturer || etTags.DeviceManufacturer || null;
          exifData.model = etTags.Model || etTags.AndroidModel || etTags.DeviceModel || null;
          
          if (!exifData.make) {
            if (etTags.SamsungModel) {
              exifData.make = 'Samsung';
              exifData.model = etTags.SamsungModel;
            } else if (etTags.Author && typeof etTags.Author === 'string' && etTags.Author.toLowerCase().includes('samsung')) {
              exifData.make = 'Samsung';
              exifData.model = etTags.Author.replace(/samsung/i, '').trim();
            }
          }
          
          // ExifTool returns ExifDateTime objects, we can convert them to standard Date
          const dateTaken = etTags.DateTimeOriginal || etTags.CreateDate || etTags.MediaCreateDate || etTags.TrackCreateDate;
          if (dateTaken && dateTaken.toDate) {
            exifData.date_taken = dateTaken.toDate();
          } else if (dateTaken) {
            exifData.date_taken = new Date(dateTaken);
          }
          
          if (etTags.GPSLatitude !== undefined && etTags.GPSLongitude !== undefined) {
            exifData.latitude = parseFloat(etTags.GPSLatitude);
            exifData.longitude = parseFloat(etTags.GPSLongitude);
          }
          
        } catch (vidErr) {
          console.warn('Video ExifTool parse skipped for', file.originalname, vidErr.message);
        }
      }
      
      const insertResult = await db.query(
        `INSERT INTO media 
        (user_id, filename, original_name, file_type, size, status,
         exif_make, exif_model, exif_date_taken, exif_latitude, exif_longitude,
         exif_width, exif_height, exif_iso, exif_aperture, exif_shutter_speed, exif_focal_length, duration) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *`,
        [
          req.user.id, file.filename, file.originalname, normalizedMime, file.size, initialStatus,
          exifData.make, exifData.model, exifData.date_taken,
          exifData.latitude, exifData.longitude,
          exifData.width, exifData.height, exifData.iso,
          exifData.aperture, exifData.shutter_speed, exifData.focal_length, videoDuration
        ]
      );
      
      const mediaItem = insertResult.rows[0];
      savedMedia.push(mediaItem);
      
      // Queue video transcoding if status is 'processing'
      if (initialStatus === 'processing') {
        await mediaQueue.add('transcode', { 
          mediaId: mediaItem.id,
          userId: req.user.id,
          filename: mediaItem.filename
        });
      }
    }
    
    res.status(201).json({ message: 'Files uploaded successfully', media: savedMedia });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Get media statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        COUNT(*) as total_files, 
        COALESCE(SUM(size), 0) as total_size,
        COUNT(*) FILTER (WHERE status = 'processing') as processing_count
       FROM media 
       WHERE user_id = $1`,
      [req.user.id]
    );

    const stats = result.rows[0];
    res.json({
      total_files: parseInt(stats.total_files),
      total_size: parseInt(stats.total_size),
      processing_count: parseInt(stats.processing_count || 0)
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Server error retrieving stats' });
  }
});

// Get all user media
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const validSortFields = {
      'newest': 'created_at DESC',
      'oldest': 'created_at ASC',
      'largest': 'size DESC',
      'smallest': 'size ASC'
    };

    const sortParam = req.query.sort || 'newest';
    const orderByClause = validSortFields[sortParam] || validSortFields['newest'];

    const mediaResult = await db.query(
      `SELECT * FROM media WHERE user_id = $1 ORDER BY ${orderByClause} LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    const countResult = await db.query(
      'SELECT COUNT(*) FROM media WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      media: mediaResult.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit
    });
  } catch (error) {
    console.error('Fetch media error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single media item
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const mediaResult = await db.query(
      'SELECT * FROM media WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (mediaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    res.json(mediaResult.rows[0]);
  } catch (error) {
    console.error('Fetch single media error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk delete media items
router.delete('/bulk', authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided' });
    }

    // Verify all media items belong to user
    const mediaResult = await db.query(
      'SELECT * FROM media WHERE id = ANY($1) AND user_id = $2',
      [ids, req.user.id]
    );

    if (mediaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // Delete files from disk
    const userDir = path.join(__dirname, '../../../uploads', `user_${req.user.id}`);
    
    for (const media of mediaResult.rows) {
      const filePath = path.join(userDir, media.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      if (media.thumbnail) {
        const thumbPath = path.join(userDir, media.thumbnail);
        if (fs.existsSync(thumbPath)) {
          fs.unlinkSync(thumbPath);
        }
      }
    }

    // Delete from DB
    const validIds = mediaResult.rows.map(m => m.id);
    await db.query('DELETE FROM media WHERE id = ANY($1)', [validIds]);

    res.json({ message: 'Media items deleted successfully', count: validIds.length });
  } catch (error) {
    console.error('Bulk delete media error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete media item
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if media exists and belongs to user
    const mediaResult = await db.query(
      'SELECT * FROM media WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (mediaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const media = mediaResult.rows[0];

    // Delete from disk
    const filePath = path.join(__dirname, '../../../uploads', `user_${req.user.id}`, media.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete thumbnail if exists
    if (media.thumbnail) {
      const thumbPath = path.join(__dirname, '../../../uploads', `user_${req.user.id}`, media.thumbnail);
      if (fs.existsSync(thumbPath)) {
        fs.unlinkSync(thumbPath);
      }
    }

    // Delete from DB
    await db.query('DELETE FROM media WHERE id = $1', [req.params.id]);

    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check transcoding status
router.get('/:id/status', authenticateToken, async (req, res) => {
  try {
    const mediaResult = await db.query(
      'SELECT status FROM media WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (mediaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    res.json({ status: mediaResult.rows[0].status });
  } catch (error) {
    console.error('Fetch media status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Toggle favorite status
router.post('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const { is_favorite } = req.body;
    
    if (typeof is_favorite !== 'boolean') {
      return res.status(400).json({ error: 'is_favorite must be a boolean' });
    }

    const result = await db.query(
      'UPDATE media SET is_favorite = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [is_favorite, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
