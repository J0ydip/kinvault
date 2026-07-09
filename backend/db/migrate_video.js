const db = require('./index');

async function migrate() {
  console.log('Running video duration migration...');
  try {
    await db.query(`
      ALTER TABLE media
      ADD COLUMN IF NOT EXISTS duration REAL
    `);
    console.log('Migration complete! Added duration column.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
