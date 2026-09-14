import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { getBestBooks } from '../services/listing.service.js';
import { getUserRating, rateBook } from '../services/rating.service.js';

const router = Router();

router.get('/best', async (req, res) => {
  try {
    const data = await getBestBooks({ genre: req.query.genre, period: req.query.period || 'all' });
    res.json({ data, total: data.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/rating', requireAuth, async (req, res) => {
  try {
    const result = await rateBook(req.user.id, req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id/rating', requireAuth, async (req, res) => {
  try {
    const value = await getUserRating(req.user.id, req.params.id);
    res.json({ value });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
