import { randomUUID } from 'node:crypto';
import { timingSafeEqual } from 'node:crypto';
import { config } from '../config/env.js';
import { signToken, verifyToken } from '../lib/jwt.js';
import { mapUser } from '../lib/mappers.js';
import { userRepository } from '../repositories/user.repository.js';
import { hashPassword, verifyPassword } from '../lib/password.js';

function validateCredentials(email, password) {
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Введите корректный email');
  if (password.length < 8) throw new Error('Пароль должен содержать не менее 8 символов');
}

function createToken(user) {
  const token = signToken({ sub: user.id, role: user.role });
  return { token, user: mapUser(user) };
}

function safeEquals(left, right) {
  const leftBuffer = Buffer.from(String(left || ''));
  const rightBuffer = Buffer.from(String(right || ''));
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

async function tryServiceLogin(loginValue, passwordValue) {
  const loginText = String(loginValue || '').trim();
  const passwordText = String(passwordValue || '');
  const serviceAccounts = [
    {
      login: config.adminLogin,
      password: config.adminPassword,
      role: 'admin',
      email: 'admin@bookswap.local',
      name: 'Администратор'
    },
    {
      login: config.moderatorLogin,
      password: config.moderatorPassword,
      role: 'moderator',
      email: 'moderator@bookswap.local',
      name: 'Модератор'
    }
  ];

  const matched = serviceAccounts.find((account) => (
    safeEquals(loginText, account.login) && safeEquals(passwordText, account.password)
  ));
  if (!matched) return null;

  const user = await userRepository.upsertServiceAccount({
    id: randomUUID(),
    email: matched.email,
    passwordHash: hashPassword(randomUUID()),
    name: matched.name,
    city: 'Платформа',
    role: matched.role
  });
  return createToken(user);
}

export async function register({ email, password, name, city }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  validateCredentials(normalizedEmail, String(password || ''));
  if (await userRepository.findByEmail(normalizedEmail)) throw new Error('Этот email уже зарегистрирован');
  const user = await userRepository.create({
    id: randomUUID(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    name: String(name || '').trim() || normalizedEmail.split('@')[0],
    city: String(city || '').trim() || 'Не указан',
    role: 'user',
    rating: 0,
    deals: 0,
    createdAt: new Date().toISOString()
  });
  return createToken(user);
}

export async function login({ email, password }) {
  const serviceSession = await tryServiceLogin(email, password);
  if (serviceSession) return serviceSession;

  const user = await userRepository.findByEmail(String(email || '').trim().toLowerCase());
  if (!user || !verifyPassword(String(password || ''), user.password_hash)) {
    throw new Error('Неверный email или пароль');
  }
  if (user.role !== 'user') throw new Error('Для этой роли используйте специальный логин и пароль');
  if (user.is_blocked) throw new Error('Аккаунт заблокирован');
  return createToken(user);
}

export async function getCurrentUser(token) {
  const payload = verifyToken(token);
  if (!payload?.sub) return null;
  const user = await userRepository.findById(payload.sub);
  return user ? mapUser(user) : null;
}

export function logout() {
  // JWT is stateless — client removes the token
}
