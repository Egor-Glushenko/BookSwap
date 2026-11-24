import { fileURLToPath } from 'node:url';

const backendRoot = fileURLToPath(new URL('../../', import.meta.url));
const projectRoot = fileURLToPath(new URL('../../../', import.meta.url));

const bool = (value, fallback = false) => {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const number = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeOrigin = (origin) => origin.trim().replace(/\/+$/, '');
const configuredOrigins = (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

const databaseUrl = process.env.DATABASE_URL?.trim() || '';
const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

// Render/Heroku style URLs require TLS; a local PostgreSQL almost never does.
const databaseNeedsSsl = process.env.PGSSLMODE
  ? process.env.PGSSLMODE !== 'disable'
  : /sslmode=(require|verify-ca|verify-full)/i.test(databaseUrl) || bool(process.env.PGSSL, false);

const jwtSecret = process.env.JWT_SECRET || 'bookswap-dev-secret-change-in-production';

export const config = {
  nodeEnv,
  isProduction,
  backendRoot,
  projectRoot,
  port: number(process.env.PORT, 4000),
  allowedOrigins: configuredOrigins,
  allowAllOrigins: configuredOrigins.includes('*'),
  trustProxy: bool(process.env.TRUST_PROXY, isProduction),

  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  usesDefaultJwtSecret: jwtSecret === 'bookswap-dev-secret-change-in-production',

  adminLogin: process.env.ADMIN_LOGIN || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin-change-me',
  moderatorLogin: process.env.MODERATOR_LOGIN || 'moderator',
  moderatorPassword: process.env.MODERATOR_PASSWORD || 'moderator-change-me',

  // When DATABASE_URL is absent the API boots against an embedded PostgreSQL
  // (PGlite, WASM) stored in .data/pglite so the project runs with zero setup.
  databaseUrl,
  databaseNeedsSsl,
  demoMode: !databaseUrl,
  dataDir: process.env.DATA_DIR || fileURLToPath(new URL('../../../.data/pglite/', import.meta.url)),
  seedDemo: bool(process.env.SEED_DEMO, !databaseUrl),

  uploadDir: process.env.UPLOAD_DIR || fileURLToPath(new URL('../../uploads/', import.meta.url)),
  maxUploadBytes: number(process.env.MAX_UPLOAD_BYTES, 5 * 1024 * 1024),
  uploadsPublicPath: '/uploads',

  publicSiteUrl: normalizeOrigin(process.env.PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:5173'),
  publicSiteUrlConfigured: Boolean(process.env.PUBLIC_SITE_URL || process.env.SITE_URL),
  frontendDist: process.env.FRONTEND_DIST || fileURLToPath(new URL('../../../frontend/dist/', import.meta.url)),

  requestLimit: process.env.JSON_LIMIT || '256kb',
  loginRateLimit: number(process.env.LOGIN_RATE_LIMIT, 20)
};

export const DATABASE_KIND = databaseUrl ? 'postgres' : 'pglite';
