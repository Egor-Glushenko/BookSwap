import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { query, pool } from '../db/pool.js';

const migrationUrl = new URL('../../migrations/001_users.sql', import.meta.url);
try {
  await query(await readFile(fileURLToPath(migrationUrl), 'utf8'));
  console.log('Database migration 001_users completed');
} finally {
  await pool.end();
}
