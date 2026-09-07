export const config = {
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  sessionTtlMs: 1000 * 60 * 60 * 24 * 30
};
