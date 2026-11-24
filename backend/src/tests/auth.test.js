import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { loginAs, startTestServer } from './helpers.js';

let server;
let request;

before(async () => {
  server = await startTestServer();
  request = server.request;
});

after(async () => {
  await server.close();
});

describe('authentication', () => {
  test('registers a new account and returns a usable token', async () => {
    const result = await request('/auth/register', {
      method: 'POST',
      body: { email: 'new.reader@example.com', password: 'strongpass123', name: 'Новый Читатель', city: 'Тверь' }
    });
    assert.equal(result.status, 201);
    assert.ok(result.data.token);
    assert.equal(result.data.user.email, 'new.reader@example.com');
    assert.equal(result.data.user.role, 'user');

    const me = await request('/auth/me', { token: result.data.token });
    assert.equal(me.status, 200);
    assert.equal(me.data.user.name, 'Новый Читатель');
  });

  test('rejects weak passwords and invalid emails', async () => {
    const weak = await request('/auth/register', { method: 'POST', body: { email: 'weak@example.com', password: '123' } });
    assert.equal(weak.status, 400);

    const invalid = await request('/auth/register', { method: 'POST', body: { email: 'not-an-email', password: 'strongpass123' } });
    assert.equal(invalid.status, 400);
  });

  test('rejects duplicate registrations', async () => {
    const result = await request('/auth/register', {
      method: 'POST',
      body: { email: 'anna@bookswap.local', password: 'strongpass123' }
    });
    assert.equal(result.status, 409);
  });

  test('rejects wrong credentials without leaking which field failed', async () => {
    const result = await request('/auth/login', { method: 'POST', body: { email: 'anna@bookswap.local', password: 'wrongpass1' } });
    assert.equal(result.status, 401);
    assert.equal(result.data.error, 'Неверный email или пароль');
  });

  test('protects private endpoints', async () => {
    const me = await request('/auth/me');
    assert.equal(me.status, 401);
    const update = await request('/auth/me', { method: 'PATCH', body: { name: 'Hacker' } });
    assert.equal(update.status, 401);
  });

  test('updates the profile of the current user', async () => {
    const session = await loginAs(request);
    const result = await request('/auth/me', {
      method: 'PATCH',
      token: session.token,
      body: { name: 'Анна С.', city: 'Москва', bio: 'Книги — это лучшее наследство.' }
    });
    assert.equal(result.status, 200);
    assert.equal(result.data.user.name, 'Анна С.');
    assert.equal(result.data.user.bio, 'Книги — это лучшее наследство.');
  });

  test('issues staff sessions only for the configured credentials', async () => {
    const admin = await request('/auth/login', { method: 'POST', body: { email: 'admin', password: 'admin-change-me' } });
    assert.equal(admin.status, 200);
    assert.equal(admin.data.user.role, 'admin');

    const moderator = await request('/auth/login', { method: 'POST', body: { email: 'moderator', password: 'moderator-change-me' } });
    assert.equal(moderator.status, 200);
    assert.equal(moderator.data.user.role, 'moderator');

    const impersonation = await request('/auth/login', { method: 'POST', body: { email: 'anna@bookswap.local', password: 'admin-change-me' } });
    assert.equal(impersonation.status, 401);
  });

  test('returns the public profile of a seller with listings and review stats', async () => {
    const listings = await request('/listings?limit=1');
    const sellerId = listings.data.data[0].sellerId;
    const profile = await request(`/users/${sellerId}`);
    assert.equal(profile.status, 200);
    assert.equal(profile.data.user.id, sellerId);
    assert.ok(Array.isArray(profile.data.listings));
    assert.ok(profile.data.reviewStats.count >= 1);
  });
});
