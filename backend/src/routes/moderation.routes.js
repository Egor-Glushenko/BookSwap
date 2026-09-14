import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import {
  createCategory,
  createSellerReview,
  deleteCategory,
  getCategories,
  getReports,
  getSellerReviews,
  listUsers,
  removeListing,
  reportListing,
  setReportStatus,
  setUserBlocked,
  setUserRole
} from '../services/moderation.service.js';

const router = Router();

router.get('/categories', async (_req, res) => {
  try {
    res.json({ data: await getCategories() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reports', requireAuth, async (req, res) => {
  try {
    res.status(201).json({ data: await reportListing(req.user.id, req.body) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/reviews/:sellerId', async (req, res) => {
  try {
    res.json({ data: await getSellerReviews(req.params.sellerId) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reviews', requireAuth, async (req, res) => {
  try {
    res.status(201).json({ data: await createSellerReview(req.user.id, req.body) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.use(requireAuth, requireRole('moderator'));

router.get('/reports', async (_req, res) => {
  try {
    res.json({ data: await getReports() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/reports/:id', async (req, res) => {
  try {
    res.json({ data: await setReportStatus(req.params.id, req.body.status) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/listings/:id', async (req, res) => {
  try {
    res.json({ data: await removeListing(req.params.id) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/users/:id/block', async (req, res) => {
  try {
    res.json({ data: await setUserBlocked(req.params.id, req.body.isBlocked) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/categories', async (req, res) => {
  try {
    res.status(201).json({ data: await createCategory(req.body.name) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await deleteCategory(req.params.id);
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/users', requireRole('admin'), async (_req, res) => {
  try {
    res.json({ data: await listUsers() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/users/:id/role', requireRole('admin'), async (req, res) => {
  try {
    res.json({ data: await setUserRole(req.params.id, req.body.role) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
