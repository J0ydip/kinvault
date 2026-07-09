const express = require('express');
const db = require('../db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// GET /api/albums - List user's albums with cover media (most recent media)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        a.id, a.name, a.description, a.created_at,
        COUNT(am.media_id) as media_count,
        (
          SELECT m.thumbnail 
          FROM album_media am2 
          JOIN media m ON am2.media_id = m.id 
          WHERE am2.album_id = a.id 
          ORDER BY am2.added_at DESC 
          LIMIT 1
        ) as cover_thumbnail,
        (
          SELECT m.filename 
          FROM album_media am2 
          JOIN media m ON am2.media_id = m.id 
          WHERE am2.album_id = a.id 
          ORDER BY am2.added_at DESC 
          LIMIT 1
        ) as cover_filename
      FROM albums a
      LEFT JOIN album_media am ON a.id = am.album_id
      WHERE a.user_id = $1
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching albums:', error);
    res.status(500).json({ error: 'Failed to fetch albums' });
  }
});

// POST /api/albums - Create a new album
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Album name is required' });

    const result = await db.query(
      'INSERT INTO albums (user_id, name, description) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, name, description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating album:', error);
    res.status(500).json({ error: 'Failed to create album' });
  }
});

// GET /api/albums/:id - Get specific album and its media
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const albumResult = await db.query(
      'SELECT * FROM albums WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (albumResult.rows.length === 0) {
      return res.status(404).json({ error: 'Album not found' });
    }

    const mediaResult = await db.query(`
      SELECT m.*, am.added_at
      FROM media m
      JOIN album_media am ON m.id = am.media_id
      WHERE am.album_id = $1 AND m.user_id = $2
      ORDER BY am.added_at DESC
    `, [req.params.id, req.user.id]);

    res.json({
      ...albumResult.rows[0],
      media: mediaResult.rows
    });
  } catch (error) {
    console.error('Error fetching album:', error);
    res.status(500).json({ error: 'Failed to fetch album' });
  }
});

// PUT /api/albums/:id - Update album details
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Ensure the album belongs to the user
    const checkResult = await db.query('SELECT id FROM albums WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (checkResult.rows.length === 0) return res.status(404).json({ error: 'Album not found' });

    const result = await db.query(
      'UPDATE albums SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating album:', error);
    res.status(500).json({ error: 'Failed to update album' });
  }
});

// DELETE /api/albums/:id - Delete album
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM albums WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Album not found' });

    res.json({ success: true, message: 'Album deleted' });
  } catch (error) {
    console.error('Error deleting album:', error);
    res.status(500).json({ error: 'Failed to delete album' });
  }
});

// POST /api/albums/:id/media - Add media items to album
router.post('/:id/media', authenticateToken, async (req, res) => {
  try {
    const { mediaIds } = req.body;
    if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
      return res.status(400).json({ error: 'An array of mediaIds is required' });
    }

    // Ensure the album belongs to the user
    const albumCheck = await db.query('SELECT id FROM albums WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (albumCheck.rows.length === 0) return res.status(404).json({ error: 'Album not found' });

    // Ensure all media belongs to the user
    const placeholders = mediaIds.map((_, i) => `$${i + 2}`).join(',');
    const mediaCheck = await db.query(
      `SELECT id FROM media WHERE user_id = $1 AND id IN (${placeholders})`,
      [req.user.id, ...mediaIds]
    );

    const validMediaIds = mediaCheck.rows.map(row => row.id);
    if (validMediaIds.length === 0) return res.status(400).json({ error: 'No valid media items found' });

    // Insert ignoring duplicates (ON CONFLICT DO NOTHING)
    let valuesClause = [];
    let queryParams = [req.params.id];
    let paramIndex = 2;
    
    validMediaIds.forEach(mediaId => {
      valuesClause.push(`($1, $${paramIndex})`);
      queryParams.push(mediaId);
      paramIndex++;
    });

    await db.query(`
      INSERT INTO album_media (album_id, media_id)
      VALUES ${valuesClause.join(', ')}
      ON CONFLICT (album_id, media_id) DO NOTHING
    `, queryParams);

    res.json({ success: true, added: validMediaIds.length });
  } catch (error) {
    console.error('Error adding media to album:', error);
    res.status(500).json({ error: 'Failed to add media to album' });
  }
});

// DELETE /api/albums/:id/media/:mediaId - Remove a single media item from album
router.delete('/:id/media/:mediaId', authenticateToken, async (req, res) => {
  try {
    // Check if album is owned by user
    const albumCheck = await db.query('SELECT id FROM albums WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (albumCheck.rows.length === 0) return res.status(404).json({ error: 'Album not found' });

    await db.query(
      'DELETE FROM album_media WHERE album_id = $1 AND media_id = $2',
      [req.params.id, req.params.mediaId]
    );

    res.json({ success: true, message: 'Media removed from album' });
  } catch (error) {
    console.error('Error removing media from album:', error);
    res.status(500).json({ error: 'Failed to remove media from album' });
  }
});

module.exports = router;
