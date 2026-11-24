import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../lib/errors.js';
import {
  createCategory,
  createSellerReview,
  deleteCategory,
  getCategories,
  getModerationListings,
  getPlatformStats,
  getReports,
  getSellerReviews,
  listUsers,
  reportListing,
  setReportStatus,
  setUserBlocked,
  setUserRole
} from '../services/moderation.service.js';
import { archiveListing } from '../services/listing.service.js';

const router = Router();

// Public catalogue metadata and user-generated feedback.
router.get('/categories', asyncHandler(async (_request, response) => {
  response.json({ data: await getCategories() });
}));

router.get('/reviews/:sellerId', asyncHandler(async (request, response) => {
  response.json(await getSellerReviews(request.params.sellerId));
}));

router.post('/reports', requireAuth, asyncHandler(async (request, response) => {
  response.status(201).json({ data: await reportListing(request.user.id, request.body || {}) });
}));

router.post('/reviews', requireAuth, asyncHandler(async (request, response) => {
  response.status(201).json({ data: await createSellerReview(request.user.id, request.body || {}) });
}));

// Everything below requires a moderator or administrator session.
router.use(requireAuth, requireRole('moderator'));

router.get('/stats', asyncHandler(async (_request, response) => {
  response.json(await getPlatformStats());
}));

router.get('/listings', asyncHandler(async (request, response) => {
  response.json(await getModerationListings(request.query.status));
}));

router.get('/reports', asyncHandler(async (request, response) => {
  response.json({ data: await getReports(request.query.status) });
}));

router.patch('/reports/:id(\\d+)', asyncHandler(async (request, response) => {
  response.json({ data: await setReportStatus(request.params.id, request.body?.status) });
}));

router.delete('/listings/:id(\\d+)', asyncHandler(async (request, response) => {
  response.json({
    data: await archiveListing({
      listingId: request.params.id,
      userId: request.user.id,
      isStaffUser: true
    })
  });
}));

router.patch('/users/:id/block', asyncHandler(async (request, response) => {
  response.json({ data: await setUserBlocked(request.params.id, request.body?.isBlocked) });
}));

router.post('/categories', asyncHandler(async (request, response) => {
  response.status(201).json({ data: await createCategory(request.body?.name) });
}));

router.delete('/categories/:id(\\d+)', asyncHandler(async (request, response) => {
  await deleteCategory(request.params.id);
  response.status(204).end();
}));

// Administrator-only endpoints.
router.get('/users', requireRole('admin'), asyncHandler(async (_request, response) => {
  response.json({ data: await listUsers() });
}));

router.patch('/users/:id/role', requireRole('admin'), asyncHandler(async (request, response) => {
  response.json({ data: await setUserRole(request.params.id, request.body?.role) });
}));

export default router;
