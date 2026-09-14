import { Router } from 'express';
import { getCurrentUser, login, logout, register } from '../services/auth.service.js';
import { bearerToken } from '../middleware/auth.middleware.js';

const router = Router();

function respond(action, status = 200) {
  return async (request, response) => {
    try {
      response.status(status).json(await action(request.body));
    } catch (error) {
      response.status(400).json({ error: error.message });
    }
  };
}

router.post('/register', respond(register, 201));
router.post('/login', respond(login));
router.post('/logout', (_request, response) => { logout(); response.status(204).end(); });
router.get('/me', async (request, response) => {
  const user = await getCurrentUser(bearerToken(request));
  if (!user) return response.status(401).json({ error: 'Необходима авторизация' });
  response.json({ user });
});

export default router;
