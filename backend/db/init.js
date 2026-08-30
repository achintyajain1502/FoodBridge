// Run with: npm run db:init
// Reads schema.sql and executes it against the configured database.
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

async function init() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  try {
    await pool.query(sql);
    console.log('✅ Database schema created successfully.');
  } catch (err) {
    console.error('❌ Failed to initialize schema:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

init();
