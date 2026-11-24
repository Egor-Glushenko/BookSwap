import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../lib/errors.js';
import { getFavorites, toggleFavorite } from '../services/favorite.service.js';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(async (request, response) => {
  response.json(await getFavorites(request.user.id));
}));

router.post('/:listingId(\\d+)', asyncHandler(async (request, response) => {
  response.json(await toggleFavorite(request.user.id, request.params.listingId));
}));

export default router;
