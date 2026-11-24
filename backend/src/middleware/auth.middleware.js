import { verifyToken } from '../lib/jwt.js';
import { userRepository } from '../repositories/user.repository.js';
import { mapUser } from '../lib/mappers.js';

export function bearerToken(request) {
  const header = request.headers.authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1].trim() : '';
}

async function resolveUser(request) {
  const token = bearerToken(request);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload?.sub) return null;
  const user = await userRepository.findById(payload.sub);
  if (!user) return null;
  return mapUser(user, { includeEmail: true });
}

/** Attaches request.user when a valid token is present, never rejects. */
export async function optionalAuth(request, _response, next) {
  try {
    const user = await resolveUser(request);
    if (user && !user.isBlocked) request.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/** Requires a valid, non-blocked account. */
export async function requireAuth(request, _response, next) {
  try {
    const user = await resolveUser(request);
    if (!user) {
      request.user = null;
      return next(Object.assign(new Error('Необходима авторизация'), { status: 401 }));
    }
    if (user.isBlocked) {
      return next(Object.assign(new Error('Аккаунт заблокирован'), { status: 403 }));
    }
    request.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/** Allows the listed roles; administrators always pass. */
export function requireRole(...roles) {
  return (request, _response, next) => {
    if (!request.user) return next(Object.assign(new Error('Необходима авторизация'), { status: 401 }));
    if (request.user.role === 'admin' || roles.includes(request.user.role)) return next();
    return next(Object.assign(new Error('Недостаточно прав'), { status: 403 }));
  };
}

export function isStaff(user) {
  return Boolean(user && (user.role === 'admin' || user.role === 'moderator'));
}
