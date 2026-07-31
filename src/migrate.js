const fs = require("fs");
const path = require("path");
const pool = require("./config/db");

const MIGRATIONS_DIR = path.join(__dirname, "..", "migrations");

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function getAppliedMigrations() {
  const result = await pool.query("SELECT name FROM schema_migrations");
  return new Set(result.rows.map((r) => r.name));
}

async function runMigrations() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log("No migrations directory found, skipping migrations.");
    return;
  }

  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`✅ Migration applied: ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`❌ Migration failed: ${file}`, err.message);
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = { runMigrations };
