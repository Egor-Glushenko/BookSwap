import { createApp } from './app.js';
import { bootstrapDatabase } from './bootstrap.js';
import { config } from './config/env.js';
import { databaseKind, closeDatabase } from './db/index.js';
import { logger } from './lib/logger.js';

const { migrations, database } = await bootstrapDatabase();
const app = await createApp();

const server = app.listen(config.port, () => {
  logger.info('BookSwap API started', {
    port: config.port,
    env: config.nodeEnv,
    database,
    demoMode: config.demoMode,
    migrations: migrations.length,
    docs: `http://localhost:${config.port}/api`
  });
  if (config.demoMode) {
    logger.info('demo mode: embedded PGlite database, demo accounts use password demo12345', {
      accounts: ['anna@bookswap.local', 'ivan@bookswap.local']
    });
  }
});

server.on('error', (error) => {
  logger.error('server error', { error: error.message });
  process.exitCode = 1;
});

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info('shutting down', { signal });
  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export { app, server, databaseKind };
