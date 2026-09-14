import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { createListing, getBestBooks, getListing, getListings, getUserListings } from '../services/listing.service.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const data = await getListings({
      type: req.query.type,
      query: req.query.query,
      sort: req.query.sort,
      genre: req.query.genre,
      condition: req.query.condition,
      city: req.query.city,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice
    });
    res.json({ data, total: data.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/mine', requireAuth, async (req, res) => {
  try {
    const data = await getUserListings(req.user.id);
    res.json({ data, total: data.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const data = await getListing(Number(req.params.id));
    if (!data) return res.status(404).json({ error: 'Объявление не найдено' });
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const data = await createListing(req.user.id, req.body);
    res.status(201).json({ data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export { getBestBooks };
export default router;
