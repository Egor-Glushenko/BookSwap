import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { query, pool } from '../db/pool.js';

const migrationsDir = fileURLToPath(new URL('../../migrations', import.meta.url));

try {
  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = await readFile(join(migrationsDir, file), 'utf8');
    await query(sql);
    console.log(`Migration ${file} completed`);
  }
  console.log('All migrations completed');
} finally {
  await pool.end();
}
