require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function resetPassword() {
  const hash = await bcrypt.hash('Admin@1234', 10);
  const result = await pool.query(
    "UPDATE users SET password_hash = $1 WHERE email = 'rahulelecworks@gmail.com' RETURNING email, role",
    [hash]
  );
  console.log('Password updated successfully!');
  console.log('User:', result.rows);
  process.exit(0);
}

resetPassword().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});