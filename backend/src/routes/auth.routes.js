import { Router } from 'express';
import { getCurrentUser, login, logout, register, updateCurrentUser } from '../services/auth.service.js';
import { bearerToken, requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler, unauthorized } from '../lib/errors.js';
import { rateLimit } from '../middleware/security.js';

const router = Router();

const loginLimiter = rateLimit({ windowMs: 60_000, max: 20, message: 'Слишком много попыток входа, попробуйте через минуту' });
const registerLimiter = rateLimit({ windowMs: 10 * 60_000, max: 10, message: 'Слишком много регистраций, попробуйте позже' });

router.post('/register', registerLimiter, asyncHandler(async (request, response) => {
  response.status(201).json(await register(request.body || {}));
}));

router.post('/login', loginLimiter, asyncHandler(async (request, response) => {
  response.json(await login(request.body || {}));
}));

router.post('/logout', (_request, response) => {
  logout();
  response.status(204).end();
});

router.get('/me', asyncHandler(async (request, response) => {
  const user = await getCurrentUser(bearerToken(request));
  if (!user) throw unauthorized();
  response.json({ user });
}));

router.patch('/me', requireAuth, asyncHandler(async (request, response) => {
  const user = await updateCurrentUser(request.user.id, request.body || {});
  response.json({ user });
}));

export default router;
