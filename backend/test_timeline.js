const db = require('./db');

async function test() {
  try {
    const res = await db.query(`SELECT 
         EXTRACT(YEAR FROM COALESCE(exif_date_taken, created_at))::INTEGER as year,
         EXTRACT(MONTH FROM COALESCE(exif_date_taken, created_at))::INTEGER as month,
         COUNT(*) as count
       FROM media 
       GROUP BY year, month
       ORDER BY year DESC, month DESC`);
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
test();
