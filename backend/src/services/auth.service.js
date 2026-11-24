import { randomUUID, timingSafeEqual } from 'node:crypto';
import { config } from '../config/env.js';
import { signToken, verifyToken } from '../lib/jwt.js';
import { mapUser } from '../lib/mappers.js';
import { userRepository } from '../repositories/user.repository.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { email as validateEmail, optionalText, password as validatePassword, text } from '../lib/validate.js';
import { conflict, unauthorized } from '../lib/errors.js';

function createToken(user) {
  const token = signToken({ sub: user.id, role: user.role });
  return { token, user: mapUser(user, { includeEmail: true }) };
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
    { login: config.adminLogin, password: config.adminPassword, role: 'admin', email: 'admin@bookswap.local', name: 'Администратор' },
    { login: config.moderatorLogin, password: config.moderatorPassword, role: 'moderator', email: 'moderator@bookswap.local', name: 'Модератор' }
  ];

  const matched = serviceAccounts.find(
    (account) => safeEquals(loginText, account.login) && safeEquals(passwordText, account.password)
  );
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
  const normalizedEmail = validateEmail(email);
  const validatedPassword = validatePassword(password);
  const displayName = optionalText(name, { field: 'Имя', max: 80 }) || normalizedEmail.split('@')[0];
  const cityName = optionalText(city, { field: 'Город', max: 80 }) || 'Не указан';

  if (await userRepository.findByEmail(normalizedEmail)) throw conflict('Этот email уже зарегистрирован');

  const user = await userRepository.create({
    id: randomUUID(),
    email: normalizedEmail,
    passwordHash: hashPassword(validatedPassword),
    name: displayName,
    city: cityName,
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
    throw unauthorized('Неверный email или пароль');
  }
  if (user.role !== 'user') throw unauthorized('Для этой роли используйте специальный логин и пароль');
  if (user.is_blocked) throw unauthorized('Аккаунт заблокирован');
  return createToken(user);
}

export async function getCurrentUser(token) {
  const payload = verifyToken(token);
  if (!payload?.sub) return null;
  const user = await userRepository.findById(payload.sub);
  if (!user || user.is_blocked) return null;
  return mapUser(user, { includeEmail: true });
}

export async function updateCurrentUser(userId, payload) {
  const patch = {};
  if (payload.name !== undefined) patch.name = text(payload.name, { field: 'Имя', max: 80 });
  if (payload.city !== undefined) patch.city = text(payload.city, { field: 'Город', max: 80 });
  if (payload.bio !== undefined) patch.bio = optionalText(payload.bio, { field: 'О себе', max: 400 });
  if (payload.avatarUrl !== undefined) patch.avatarUrl = String(payload.avatarUrl || '') || null;

  const user = await userRepository.updateProfile(userId, patch);
  if (!user) throw unauthorized();
  return mapUser(user, { includeEmail: true });
}

export function logout() {
  // JWT is stateless: the client drops the token.
}
