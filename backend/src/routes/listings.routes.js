import { Router } from 'express';
import { optionalAuth, requireAuth, isStaff } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../lib/errors.js';
import { paginated, parsePagination } from '../lib/pagination.js';
import {
  archiveListing,
  createListing,
  getBestBooks,
  getFilterFacets,
  getListing,
  getSimilarListings,
  getUserListings,
  listListings,
  parseListingFilters,
  setListingStatus,
  updateListing
} from '../services/listing.service.js';

const router = Router();

router.get('/', asyncHandler(async (request, response) => {
  const pagination = parsePagination(request.query);
  const filters = parseListingFilters(request.query);
  const { data, total } = await listListings(filters, pagination);
  response.json(paginated(data, { ...pagination, total }));
}));

router.get('/filters', asyncHandler(async (_request, response) => {
  response.json(await getFilterFacets());
}));

router.get('/best', asyncHandler(async (request, response) => {
  const data = await getBestBooks({ genre: request.query.genre, period: request.query.period || 'all' });
  response.json({ data, total: data.length });
}));

router.get('/mine', requireAuth, asyncHandler(async (request, response) => {
  const data = await getUserListings(request.user.id, request.query.status || 'all');
  response.json({ data, total: data.length });
}));

router.get('/:id(\\d+)', optionalAuth, asyncHandler(async (request, response) => {
  const data = await getListing(request.params.id, { viewerId: request.user?.id });
  response.json({ data });
}));

router.get('/:id(\\d+)/similar', asyncHandler(async (request, response) => {
  const data = await getSimilarListings(request.params.id, 4);
  response.json({ data, total: data.length });
}));

router.post('/', requireAuth, asyncHandler(async (request, response) => {
  const data = await createListing(request.user.id, request.body || {});
  response.status(201).json({ data });
}));

router.patch('/:id(\\d+)', requireAuth, asyncHandler(async (request, response) => {
  const data = await updateListing({
    listingId: request.params.id,
    userId: request.user.id,
    isStaffUser: isStaff(request.user),
    payload: request.body || {}
  });
  response.json({ data });
}));

router.patch('/:id(\\d+)/status', requireAuth, asyncHandler(async (request, response) => {
  const data = await setListingStatus({
    listingId: request.params.id,
    userId: request.user.id,
    isStaffUser: isStaff(request.user),
    status: request.body?.status
  });
  response.json({ data });
}));

router.delete('/:id(\\d+)', requireAuth, asyncHandler(async (request, response) => {
  response.json({
    data: await archiveListing({
      listingId: request.params.id,
      userId: request.user.id,
      isStaffUser: isStaff(request.user)
    })
  });
}));

export default router;
