const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = require('../src/config/db');

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@foodbridge.local';
  const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(12).toString('base64url');
  const passwordHash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, is_verified)
     VALUES ($1, $2, $3, 'admin', TRUE)
     ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name,
           password_hash = EXCLUDED.password_hash,
           role = 'admin',
           is_verified = TRUE
     RETURNING id, email, role, is_verified`,
    ['FoodBridge Administrator', email, passwordHash]
  );

  console.log(JSON.stringify({ ...result.rows[0], password }, null, 2));
}

createAdmin()
  .catch((error) => {
    console.error(`Could not create Admin: ${error.message || error.code || 'check backend/.env and PostgreSQL'}`);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
