import { verifyToken } from '../lib/jwt.js';
import { userRepository } from '../repositories/user.repository.js';
import { mapUser } from '../lib/mappers.js';

export function bearerToken(request) {
  return request.headers.authorization?.replace(/^Bearer\s+/i, '') || '';
}

export async function requireAuth(request, response, next) {
  const payload = verifyToken(bearerToken(request));
  if (!payload?.sub) return response.status(401).json({ error: 'Необходима авторизация' });
  const user = await userRepository.findById(payload.sub);
  if (!user) return response.status(401).json({ error: 'Необходима авторизация' });
  if (user.is_blocked) return response.status(403).json({ error: 'Аккаунт заблокирован' });
  request.user = mapUser(user);
  next();
}

export function requireRole(...roles) {
  return (request, response, next) => {
    if (!request.user) return response.status(401).json({ error: 'Необходима авторизация' });
    if (request.user.role === 'admin' || roles.includes(request.user.role)) return next();
    return response.status(403).json({ error: 'Недостаточно прав' });
  };
}
