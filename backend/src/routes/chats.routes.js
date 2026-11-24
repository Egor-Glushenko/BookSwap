import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../lib/errors.js';
import { createChat, getChats, getMessages, getUnreadCount, sendMessage } from '../services/chat.service.js';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(async (request, response) => {
  response.json({ data: await getChats(request.user.id) });
}));

router.get('/unread-count', asyncHandler(async (request, response) => {
  response.json({ count: await getUnreadCount(request.user.id) });
}));

router.post('/', asyncHandler(async (request, response) => {
  response.status(201).json({ data: await createChat(request.user.id, request.body || {}) });
}));

router.get('/:id(\\d+)/messages', asyncHandler(async (request, response) => {
  const data = await getMessages(request.user.id, request.params.id, { afterId: request.query.after });
  response.json({ data });
}));

router.post('/:id(\\d+)/messages', asyncHandler(async (request, response) => {
  response.status(201).json({ data: await sendMessage(request.user.id, request.params.id, request.body?.text) });
}));

export default router;
