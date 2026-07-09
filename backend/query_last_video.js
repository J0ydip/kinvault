const db = require('./db');

async function run() {
  try {
    const res = await db.query("SELECT * FROM media WHERE file_type LIKE 'video/%' AND original_name != 'sample_960x400_ocean_with_audio.mkv' ORDER BY created_at DESC LIMIT 1");
    console.log(res.rows[0]);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
