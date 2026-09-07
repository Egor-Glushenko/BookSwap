/**
 * Temporary repository for the MVP. The API is deliberately isolated from the
 * storage implementation so this module can be replaced with PostgreSQL
 * repositories without changing routes or services.
 */
const sessions = new Map();

export const sessionRepository = {
  create: (token, session) => sessions.set(token, session),
  find: (token) => sessions.get(token) || null,
  remove: (token) => sessions.delete(token)
};
