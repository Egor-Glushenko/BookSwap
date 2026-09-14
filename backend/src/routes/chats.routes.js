import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { createChat, getChats, getMessages, sendMessage } from '../services/chat.service.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const data = await getChats(req.user.id);
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const data = await createChat(req.user.id, req.body);
    res.status(201).json({ data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id/messages', requireAuth, async (req, res) => {
  try {
    const data = await getMessages(req.user.id, req.params.id);
    res.json({ data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/messages', requireAuth, async (req, res) => {
  try {
    const data = await sendMessage(req.user.id, req.params.id, req.body.text);
    res.status(201).json({ data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
