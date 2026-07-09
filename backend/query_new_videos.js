const db = require('./db');

async function run() {
  try {
    const res = await db.query("SELECT id, filename, status FROM media WHERE file_type LIKE 'video/%' ORDER BY created_at DESC LIMIT 5");
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
