import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { loginAs, loginStaff, startTestServer } from './helpers.js';

let server;
let request;
let moderator;
let admin;
let anna;

before(async () => {
  server = await startTestServer();
  request = server.request;
  moderator = await loginStaff(request, 'moderator');
  admin = await loginStaff(request, 'admin');
  anna = await loginAs(request);
});

after(async () => {
  await server.close();
});

describe('moderation access control', () => {
  test('rejects unauthenticated and regular users', async () => {
    assert.equal((await request('/moderation/reports')).status, 401);
    assert.equal((await request('/moderation/reports', { token: anna.token })).status, 403);
    assert.equal((await request('/moderation/stats', { token: anna.token })).status, 403);
  });

  test('keeps the users list admin-only', async () => {
    assert.equal((await request('/moderation/users', { token: moderator.token })).status, 403);
    assert.equal((await request('/moderation/users', { token: admin.token })).status, 200);
  });
});

describe('moderation workspace', () => {
  test('returns platform stats', async () => {
    const result = await request('/moderation/stats', { token: moderator.token });
    assert.equal(result.status, 200);
    assert.ok(result.data.users >= 8);
    assert.ok(result.data.listings >= 28);
    assert.ok('openReports' in result.data);
  });

  test('lists reports and changes their status', async () => {
    const result = await request('/moderation/reports', { token: moderator.token });
    assert.equal(result.status, 200);
    assert.ok(result.data.data.length >= 2);
    const report = result.data.data[0];

    const updated = await request(`/moderation/reports/${report.id}`, {
      method: 'PATCH',
      token: moderator.token,
      body: { status: 'resolved' }
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.data.data.status, 'resolved');

    const invalid = await request(`/moderation/reports/${report.id}`, {
      method: 'PATCH',
      token: moderator.token,
      body: { status: 'closed' }
    });
    assert.equal(invalid.status, 400);
  });

  test('manages categories', async () => {
    const created = await request('/moderation/categories', {
      method: 'POST',
      token: moderator.token,
      body: { name: 'Комиксы и манга' }
    });
    assert.equal(created.status, 201);
    assert.equal(created.data.data.name, 'Комиксы и манга');

    const list = await request('/moderation/categories');
    assert.ok(list.data.data.some((category) => category.name === 'Комиксы и манга'));

    const removed = await request(`/moderation/categories/${created.data.data.id}`, {
      method: 'DELETE',
      token: moderator.token
    });
    assert.equal(removed.status, 204);
  });

  test('archives reported listings and hides them from the feed', async () => {
    const listings = await request('/moderation/listings?status=active', { token: moderator.token });
    assert.equal(listings.status, 200);
    const target = listings.data.data.find((book) => book.id > 20);

    const removed = await request(`/moderation/listings/${target.id}`, { method: 'DELETE', token: moderator.token });
    assert.equal(removed.status, 200);

    const feed = await request('/listings?limit=48');
    assert.ok(!feed.data.data.some((book) => book.id === target.id));
  });

  test('blocks users and prevents them from signing in', async () => {
    const users = await request('/moderation/users', { token: admin.token });
    const pavel = users.data.data.find((user) => user.email === 'pavel@bookswap.local');
    assert.ok(pavel);

    const blocked = await request(`/moderation/users/${pavel.id}/block`, {
      method: 'PATCH',
      token: moderator.token,
      body: { isBlocked: true }
    });
    assert.equal(blocked.status, 200);
    assert.equal(blocked.data.data.isBlocked, true);

    const loginAttempt = await request('/auth/login', {
      method: 'POST',
      body: { email: 'pavel@bookswap.local', password: 'demo12345' }
    });
    assert.equal(loginAttempt.status, 401);

    // Blocked sellers disappear from the public catalogue and search.
    const hidden = await request('/listings?limit=48');
    assert.ok(!hidden.data.data.some((book) => book.sellerId === pavel.id));
    const hiddenBySeller = await request(`/listings?sellerId=${pavel.id}&limit=48`);
    assert.equal(hiddenBySeller.data.data.length, 0);

    const unblocked = await request(`/moderation/users/${pavel.id}/block`, {
      method: 'PATCH',
      token: moderator.token,
      body: { isBlocked: false }
    });
    assert.equal(unblocked.data.data.isBlocked, false);

    const restored = await request('/listings?limit=48');
    assert.ok(restored.data.data.some((book) => book.sellerId === pavel.id));
  });

  test('lets an administrator promote and demote a moderator', async () => {
    const users = await request('/moderation/users', { token: admin.token });
    const elena = users.data.data.find((user) => user.email === 'elena@bookswap.local');

    const promoted = await request(`/moderation/users/${elena.id}/role`, {
      method: 'PATCH',
      token: admin.token,
      body: { role: 'moderator' }
    });
    assert.equal(promoted.status, 200);
    assert.equal(promoted.data.data.role, 'moderator');

    const demoted = await request(`/moderation/users/${elena.id}/role`, {
      method: 'PATCH',
      token: admin.token,
      body: { role: 'user' }
    });
    assert.equal(demoted.data.data.role, 'user');

    const invalid = await request(`/moderation/users/${elena.id}/role`, {
      method: 'PATCH',
      token: admin.token,
      body: { role: 'owner' }
    });
    assert.equal(invalid.status, 400);
  });
});
