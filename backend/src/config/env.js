const normalizeOrigin = (origin) => origin.trim().replace(/\/$/, '');
const configuredOrigins = (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

export const config = {
  port: Number(process.env.PORT || 4000),
  allowedOrigins: configuredOrigins,
  jwtSecret: process.env.JWT_SECRET || 'bookswap-dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  adminLogin: process.env.ADMIN_LOGIN || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin-change-me',
  moderatorLogin: process.env.MODERATOR_LOGIN || 'moderator',
  moderatorPassword: process.env.MODERATOR_PASSWORD || 'moderator-change-me'
};
