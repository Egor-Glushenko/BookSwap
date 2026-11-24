import { config } from './config/env.js';
import { databaseHealth, databaseKind, getDriver } from './db/index.js';
import { runMigrations } from './db/migrate.js';
import { logger } from './lib/logger.js';
import { seedDatabase } from './scripts/seed.js';

/**
 * Prepares a usable database for any entry point (server, tests, scripts):
 * connects, applies migrations and, in demo mode, fills an empty database
 * with sample content.
 */
export async function bootstrapDatabase({ seed = config.seedDemo } = {}) {
  await getDriver();
  const migrations = await runMigrations();

  if (seed) {
    const result = await seedDatabase();
    if (result.seeded) {
      logger.info('demo data seeded', { users: result.users, listings: result.listings });
    }
  }

  if (config.isProduction && config.usesDefaultJwtSecret) {
    logger.warn('JWT_SECRET is using the development default — set a real secret in production');
  }
  if (config.isProduction && config.demoMode) {
    logger.warn('DATABASE_URL is not set — the API is using the embedded PGlite database');
  }

  return { migrations, database: databaseKind(), healthy: await databaseHealth() };
}
