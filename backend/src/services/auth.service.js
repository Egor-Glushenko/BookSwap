import { randomUUID } from 'node:crypto';
import { config } from '../config/env.js';
import { sessionRepository } from '../data/store.js';
import { userRepository } from '../repositories/user.repository.js';
import { hashPassword, verifyPassword } from '../lib/password.js';

const publicUser = ({ passwordHash, ...user }) => user;

function validateCredentials(email, password) {
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Введите корректный email');
  if (password.length < 8) throw new Error('Пароль должен содержать не менее 8 символов');
}

function createSession(user) {
  const token = randomUUID();
  sessionRepository.create(token, { userId: user.id, expiresAt: Date.now() + config.sessionTtlMs });
  return { token, user: publicUser(user) };
}

export async function register({ email, password, name, city }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  validateCredentials(normalizedEmail, String(password || ''));
  if (await userRepository.findByEmail(normalizedEmail)) throw new Error('Этот email уже зарегистрирован');
  const user = await userRepository.create({
    id: randomUUID(), email: normalizedEmail, passwordHash: hashPassword(password),
    name: String(name || '').trim() || normalizedEmail.split('@')[0], city: String(city || '').trim() || 'Не указан',
    role: 'user', rating: 0, deals: 0, createdAt: new Date().toISOString()
  });
  return createSession(user);
}

export async function login({ email, password }) {
  const user = await userRepository.findByEmail(String(email || '').trim());
  if (!user || !verifyPassword(String(password || ''), user.passwordHash)) throw new Error('Неверный email или пароль');
  return createSession(user);
}

export async function getCurrentUser(token) {
  const session = sessionRepository.find(token);
  if (!session || session.expiresAt < Date.now()) return null;
  return userRepository.findById(session.userId);
}

export function logout(token) { if (token) sessionRepository.remove(token); }
