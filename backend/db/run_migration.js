require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running EXIF migration...');
    await client.query(`ALTER TABLE media ADD COLUMN IF NOT EXISTS exif_make VARCHAR`);
    await client.query(`ALTER TABLE media ADD COLUMN IF NOT EXISTS exif_model VARCHAR`);
    await client.query(`ALTER TABLE media ADD COLUMN IF NOT EXISTS exif_date_taken TIMESTAMP`);
    await client.query(`ALTER TABLE media ADD COLUMN IF NOT EXISTS exif_latitude DOUBLE PRECISION`);
    await client.query(`ALTER TABLE media ADD COLUMN IF NOT EXISTS exif_longitude DOUBLE PRECISION`);
    await client.query(`ALTER TABLE media ADD COLUMN IF NOT EXISTS exif_width INTEGER`);
    await client.query(`ALTER TABLE media ADD COLUMN IF NOT EXISTS exif_height INTEGER`);
    await client.query(`ALTER TABLE media ADD COLUMN IF NOT EXISTS exif_iso INTEGER`);
    await client.query(`ALTER TABLE media ADD COLUMN IF NOT EXISTS exif_aperture DOUBLE PRECISION`);
    await client.query(`ALTER TABLE media ADD COLUMN IF NOT EXISTS exif_shutter_speed VARCHAR`);
    await client.query(`ALTER TABLE media ADD COLUMN IF NOT EXISTS exif_focal_length DOUBLE PRECISION`);
    console.log('Migration complete! All EXIF columns added.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
