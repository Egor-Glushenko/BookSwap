import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec, query } from '../db/index.js';

export const migrationsDir = fileURLToPath(new URL('../../migrations', import.meta.url));

async function ensureMigrationsTable() {
  await exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

/**
 * Applies every not-yet-applied migration in filename order.
 * Migrations are idempotent, so a legacy database that predates the
 * schema_migrations table simply re-runs them once.
 */
export async function runMigrations({ quiet = false } = {}) {
  await ensureMigrationsTable();
  const files = (await readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();
  const applied = new Set(
    (await query('SELECT filename FROM schema_migrations')).rows.map((row) => row.filename)
  );

  const executed = [];
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(join(migrationsDir, file), 'utf8');
    await exec(sql);
    await query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
    executed.push(file);
    if (!quiet) console.log(`Migration ${file} applied`);
  }
  if (!quiet) console.log(executed.length ? `Applied ${executed.length} migration(s)` : 'Database schema is up to date');
  return executed;
}
