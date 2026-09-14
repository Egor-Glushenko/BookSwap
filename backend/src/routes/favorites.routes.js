import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { getFavorites, toggleFavorite } from '../services/favorite.service.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const data = await getFavorites(req.user.id);
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:listingId', requireAuth, async (req, res) => {
  try {
    const result = await toggleFavorite(req.user.id, req.params.listingId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
