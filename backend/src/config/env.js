const normalizeOrigin = (origin) => origin.trim().replace(/\/$/, '');
const configuredOrigins = (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

export const config = {
  port: Number(process.env.PORT || 4000),
  allowedOrigins: configuredOrigins,
  sessionTtlMs: 1000 * 60 * 60 * 24 * 30
};
