# Database Migrations

This folder contains SQL migration files that run **automatically** every time
the backend server starts (see `src/migrate.js`, hooked into `src/server.js`).

## How it works
1. On startup, the server checks a `schema_migrations` table to see which
   migration files have already run.
2. Any `.sql` file in this folder that hasn't run yet gets executed, in
   filename order, and is recorded so it never runs twice.
3. No manual step needed — just push to GitHub and Render redeploys +
   applies the migration automatically.

## Adding a new migration
1. Create a new file here named `00X_short_description.sql` (next number
   after the highest existing one).
2. Write plain SQL — e.g. `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...`,
   `CREATE TABLE IF NOT EXISTS ...`.
3. Prefer `IF NOT EXISTS` / `IF EXISTS` guards so the migration is safe to
   re-run if needed.
4. Commit and push. Check Render logs after deploy for
   `✅ Migration applied: 00X_....sql`.

## Fresh database setup
`schema.sql` in the repo root is only for setting up a brand-new, empty
database from scratch (e.g. a new Neon project). It is NOT kept in sync
automatically with the migrations folder — after running `schema.sql` on a
fresh database, all files in this folder should be marked as already
applied (insert their filenames into `schema_migrations`) or simply let
them run once naturally on first deploy against that database.
