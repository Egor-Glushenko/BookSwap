import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../lib/errors.js';
import { getPublicProfile } from '../services/user.service.js';
import { updateCurrentUser } from '../services/auth.service.js';

const router = Router();

router.get('/me', requireAuth, asyncHandler(async (request, response) => {
  response.json({ user: request.user });
}));

router.patch('/me', requireAuth, asyncHandler(async (request, response) => {
  const user = await updateCurrentUser(request.user.id, request.body || {});
  response.json({ user });
}));

router.get('/:id', asyncHandler(async (request, response) => {
  response.json(await getPublicProfile(request.params.id));
}));

export default router;
