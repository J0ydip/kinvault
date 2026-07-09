const db = require('./index');

async function run() {
  try {
    const res = await db.query("SELECT id, filename, exif_make, exif_model, exif_date_taken, status FROM media WHERE id IN (48, 49)");
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
