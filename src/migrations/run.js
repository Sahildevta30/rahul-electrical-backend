require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });

async function run() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const seed   = fs.readFileSync(path.join(__dirname, 'seed.sql'),   'utf8');
  try {
    console.log('⏳ Running schema migrations...');
    await pool.query(schema);
    console.log('✅ Schema applied');
    console.log('⏳ Seeding data...');
    await pool.query(seed);
    console.log('✅ Seed data inserted');
    console.log('\n🚀 Database ready for Rahul Electrical Works!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}
run();
