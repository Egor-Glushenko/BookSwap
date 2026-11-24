import { closeDatabase } from '../db/index.js';
import { runMigrations } from '../db/migrate.js';

try {
  await runMigrations();
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
