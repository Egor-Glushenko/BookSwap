import { Router } from 'express';
import { getCurrentUser, login, logout, register } from '../services/auth.service.js';

const router = Router();
const bearerToken = (request) => request.headers.authorization?.replace(/^Bearer\s+/i, '');

function respond(action) {
  return async (request, response) => {
    try { response.status(action === register ? 201 : 200).json(await action(request.body)); }
    catch (error) { response.status(400).json({ error: error.message }); }
  };
}

router.post('/register', respond(register));
router.post('/login', respond(login));
router.post('/logout', (request, response) => { logout(bearerToken(request)); response.status(204).end(); });
router.get('/me', async (request, response) => {
  const user = await getCurrentUser(bearerToken(request));
  if (!user) return response.status(401).json({ error: 'Необходима авторизация' });
  const { passwordHash, ...safeUser } = user;
  response.json({ user: safeUser });
});

export default router;
