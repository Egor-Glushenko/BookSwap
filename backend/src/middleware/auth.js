import { verifyToken } from '../lib/jwt.js';

export function requireAuth(request, response, next) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
  const payload = verifyToken(token);
  if (!payload) return response.status(401).json({ error: 'Необходима авторизация' });
  request.user = payload;
  next();
}
