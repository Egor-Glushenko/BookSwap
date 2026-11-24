import { mkdirSync } from 'node:fs';
import { config } from '../config/env.js';

/**
 * Single database entry point.
 *
 * Production uses a normal `pg` connection pool (DATABASE_URL). Local
 * development and the public demo can run without any database server: PGlite
 * is a real PostgreSQL compiled to WebAssembly and persists to .data/pglite.
 */
let driver = null;
let connecting = null;

async function createPostgresDriver() {
  const { default: pg } = await import('pg');
  const pool = new pg.Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseNeedsSsl ? { rejectUnauthorized: false } : undefined,
    max: Number(process.env.PG_POOL_SIZE || 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000
  });

  pool.on('error', (error) => console.error('[db] idle client error', error.message));

  return {
    kind: 'postgres',
    async query(text, values) {
      return pool.query(text, values);
    },
    async exec(sql) {
      return pool.query(sql);
    },
    async close() {
      await pool.end();
    }
  };
}

async function createPgliteDriver() {
  const { PGlite } = await import('@electric-sql/pglite');
  // PGlite creates the final directory itself but not the parent chain.
  if (!/^(memory|idb):/i.test(config.dataDir)) mkdirSync(config.dataDir, { recursive: true });
  const db = new PGlite(config.dataDir);
  await db.waitReady;

  return {
    kind: 'pglite',
    async query(text, values) {
      const result = await db.query(text, values);
      return { rows: result.rows, rowCount: result.affectedRows ?? result.rows.length };
    },
    async exec(sql) {
      return db.exec(sql);
    },
    async close() {
      await db.close();
    }
  };
}

export async function getDriver() {
  if (driver) return driver;
  if (!connecting) {
    connecting = (config.databaseUrl ? createPostgresDriver() : createPgliteDriver())
      .then((created) => {
        driver = created;
        return created;
      })
      .finally(() => {
        connecting = null;
      });
  }
  return connecting;
}

export async function query(text, values) {
  const db = await getDriver();
  return db.query(text, values);
}

export async function exec(sql) {
  const db = await getDriver();
  return db.exec(sql);
}

export async function databaseHealth() {
  try {
    await query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

export function databaseKind() {
  return driver?.kind || (config.databaseUrl ? 'postgres' : 'pglite');
}

export async function closeDatabase() {
  if (!driver) return;
  const current = driver;
  driver = null;
  await current.close();
}
