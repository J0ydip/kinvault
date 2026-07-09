const db = require('./index');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const probeVideo = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) resolve(null);
      else resolve(metadata);
    });
  });
};

async function fix() {
  const res = await db.query("SELECT id, user_id, filename FROM media WHERE file_type LIKE 'video/%' AND status = 'ready'");
  for (let row of res.rows) {
    const filePath = path.join(__dirname, '../uploads', 'user_' + row.user_id, row.filename);
    try {
      const vMeta = await probeVideo(filePath);
      if (vMeta) {
        let width = null;
        let height = null;
        let duration = vMeta.format?.duration || null;
        let make = null;
        let model = null;
        let latitude = null;
        let longitude = null;
        let dateTaken = null;
        
        const stream = vMeta.streams.find(s => s.codec_type === 'video');
        if (stream) {
          width = stream.width || null;
          height = stream.height || null;
        }

        const tags = vMeta.format?.tags || {};
        make = tags.make || tags['com.apple.quicktime.make'] || null;
        model = tags.model || tags['com.apple.quicktime.model'] || null;
        if (tags.creation_time) dateTaken = new Date(tags.creation_time);

        const locString = tags.location || tags['location-eng'] || tags['com.apple.quicktime.location.ISO6709'];
        if (locString) {
          const match = locString.match(/^([+-]\d+\.?\d*)([+-]\d+\.?\d*)/);
          if (match) {
            latitude = parseFloat(match[1]);
            longitude = parseFloat(match[2]);
          }
        }

        await db.query(
          `UPDATE media SET 
            exif_width=$1, exif_height=$2, duration=$3, 
            exif_make=$4, exif_model=$5, exif_latitude=$6, exif_longitude=$7,
            exif_date_taken = COALESCE(exif_date_taken, $8)
           WHERE id=$9`, 
          [width, height, duration, make, model, latitude, longitude, dateTaken, row.id]
        );
        console.log('Fixed video metadata', row.filename);
      }
    } catch (e) {
      console.log('Failed for', row.filename, e.message);
    }
  }
  process.exit(0);
}
fix();
