import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../lib/errors.js';
import { getBestBooks } from '../services/listing.service.js';
import { getBookRatings, getUserRating, rateBook } from '../services/rating.service.js';

const router = Router();

router.get('/best', asyncHandler(async (request, response) => {
  const data = await getBestBooks({ genre: request.query.genre, period: request.query.period || 'all' });
  response.json({ data, total: data.length });
}));

router.get('/:id(\\d+)/ratings', asyncHandler(async (request, response) => {
  response.json(await getBookRatings(request.params.id));
}));

router.post('/:id(\\d+)/rating', requireAuth, asyncHandler(async (request, response) => {
  response.json(await rateBook(request.user.id, request.params.id, request.body || {}));
}));

router.get('/:id(\\d+)/rating', requireAuth, asyncHandler(async (request, response) => {
  response.json({ value: await getUserRating(request.user.id, request.params.id) });
}));

export default router;
