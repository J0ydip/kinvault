const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'kinvault',
  password: 'password',
  port: 5432,
});

async function addLensColumn() {
  try {
    await pool.query('ALTER TABLE media ADD COLUMN exif_lens_model VARCHAR;');
    console.log('Column added');
  } catch (err) {
    if (err.code === '42701') {
      console.log('Column already exists');
    } else {
      console.error(err);
    }
  } finally {
    await pool.end();
  }
}

addLensColumn();
