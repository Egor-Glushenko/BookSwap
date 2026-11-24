import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { loginAs, startTestServer } from './helpers.js';

let server;
let request;
let anna;
let maria;
let ivan;

before(async () => {
  server = await startTestServer();
  request = server.request;
  anna = await loginAs(request, 'anna@bookswap.local');
  maria = await loginAs(request, 'maria@bookswap.local');
  ivan = await loginAs(request, 'ivan@bookswap.local');
});

after(async () => {
  await server.close();
});

describe('favorites', () => {
  test('returns ids and full cards for the account area', async () => {
    const result = await request('/favorites', { token: anna.token });
    assert.equal(result.status, 200);
    assert.ok(Array.isArray(result.data.ids));
    assert.ok(result.data.data.length === result.data.ids.length);
    if (result.data.data.length) assert.ok(result.data.data[0].title);
  });

  test('toggles a favourite on and off', async () => {
    const listing = await request('/listings?limit=1');
    const id = listing.data.data[0].id;

    const first = await request(`/favorites/${id}`, { method: 'POST', token: maria.token });
    assert.equal(first.status, 200);
    assert.equal(typeof first.data.favorite, 'boolean');
    const expected = !first.data.favorite;

    const second = await request(`/favorites/${id}`, { method: 'POST', token: maria.token });
    assert.equal(second.data.favorite, expected);
  });

  test('requires authentication', async () => {
    const result = await request('/favorites');
    assert.equal(result.status, 401);
  });
});

describe('book ratings', () => {
  test('lets a reader rate a book and updates the aggregate', async () => {
    const listings = await request('/listings?limit=48');
    const target = listings.data.data.find((book) => book.sellerId !== anna.user.id && book.type === 'Продажа');

    const result = await request(`/books/${target.id}/rating`, {
      method: 'POST',
      token: anna.token,
      body: { value: 5, review: 'Отличная книга, спасибо продавцу.' }
    });
    assert.equal(result.status, 200);
    assert.equal(result.data.value, 5);
    assert.ok(Number(result.data.avg) >= 1);

    const own = await request(`/books/${listings.data.data[0].id}/rating`, {
      method: 'POST',
      token: anna.token,
      body: { value: 5 }
    });
    if (listings.data.data[0].sellerId === anna.user.id) assert.equal(own.status, 403);

    const invalid = await request(`/books/${target.id}/rating`, {
      method: 'POST',
      token: anna.token,
      body: { value: 9 }
    });
    assert.equal(invalid.status, 400);
  });

  test('returns the rating of the current reader', async () => {
    const listings = await request('/listings?limit=48');
    const target = listings.data.data.find((book) => book.sellerId !== anna.user.id && book.reviews > 0);
    const result = await request(`/books/${target.id}/rating`, { token: anna.token });
    assert.equal(result.status, 200);
    assert.ok('value' in result.data);
  });
});

describe('chats', () => {
  test('creates a chat with the seller and exchanges messages', async () => {
    const listing = await request('/listings/1');
    const sellerId = listing.data.data.sellerId;
    assert.equal(sellerId, anna.user.id);

    const created = await request('/chats', { method: 'POST', token: maria.token, body: { listingId: 1 } });
    assert.equal(created.status, 201);
    const chatId = created.data.data.id;
    assert.equal(created.data.data.participantId, sellerId);

    const sent = await request(`/chats/${chatId}/messages`, {
      method: 'POST',
      token: maria.token,
      body: { text: 'Здравствуйте, книга ещё доступна?' }
    });
    assert.equal(sent.status, 201);
    assert.equal(sent.data.data.text, 'Здравствуйте, книга ещё доступна?');

    const messages = await request(`/chats/${chatId}/messages`, { token: maria.token });
    assert.equal(messages.status, 200);
    assert.ok(messages.data.data.length >= 1);

    const unread = await request('/chats/unread-count', { token: anna.token });
    assert.equal(unread.status, 200);
    assert.ok(unread.data.count >= 1);

    const annaChats = await request('/chats', { token: anna.token });
    const chat = annaChats.data.data.find((item) => item.id === chatId);
    assert.ok(chat);
    assert.ok(chat.unread >= 1);

    await request(`/chats/${chatId}/messages`, { token: anna.token });
    const afterRead = await request('/chats/unread-count', { token: anna.token });
    assert.equal(afterRead.data.count, 0);
  });

  test('rejects empty messages, self-chats and foreign chats', async () => {
    const chat = await request('/chats', { method: 'POST', token: maria.token, body: { listingId: 1 } });
    const chatId = chat.data.data.id;

    const empty = await request(`/chats/${chatId}/messages`, { method: 'POST', token: maria.token, body: { text: '   ' } });
    assert.equal(empty.status, 400);

    const tooLong = await request(`/chats/${chatId}/messages`, {
      method: 'POST',
      token: maria.token,
      body: { text: 'а'.repeat(2001) }
    });
    assert.equal(tooLong.status, 400);

    const selfChat = await request('/chats', { method: 'POST', token: anna.token, body: { listingId: 1 } });
    assert.equal(selfChat.status, 403);

    const foreign = await request(`/chats/${chatId}/messages`, { token: ivan.token });
    assert.equal(foreign.status, 403);
  });
});

describe('reports and seller reviews', () => {
  test('accepts a report once and refuses duplicates', async () => {
    const listings = await request('/listings?limit=48');
    const target = listings.data.data.find((book) => book.sellerId !== maria.user.id);

    const created = await request('/moderation/reports', {
      method: 'POST',
      token: maria.token,
      body: { listingId: target.id, reason: 'Описание не соответствует реальному состоянию книги.' }
    });
    assert.equal(created.status, 201);

    const duplicate = await request('/moderation/reports', {
      method: 'POST',
      token: maria.token,
      body: { listingId: target.id, reason: 'Ещё раз то же самое.' }
    });
    assert.equal(duplicate.status, 409);

    const own = await request('/moderation/reports', {
      method: 'POST',
      token: anna.token,
      body: { listingId: 1, reason: 'Пожаловаться на собственное объявление.' }
    });
    assert.equal(own.status, 400);
  });

  test('creates a seller review and recalculates the seller rating', async () => {
    const reviewer = await request('/auth/register', {
      method: 'POST',
      body: { email: 'reviewer@example.com', password: 'strongpass123', name: 'Проверяющий Покупатель' }
    });
    const reviewerToken = reviewer.data.token;
    const before = await request(`/users/${ivan.user.id}`);

    // A review describes a real deal, so a dialogue must exist first.
    const withoutChat = await request('/moderation/reviews', {
      method: 'POST',
      token: reviewerToken,
      body: { sellerId: ivan.user.id, rating: 5 }
    });
    assert.equal(withoutChat.status, 403);

    const catalog = await request('/listings?limit=48');
    const sellerListing = catalog.data.data.find((book) => book.sellerId === ivan.user.id);
    assert.ok(sellerListing, 'expected a listing from ivan');
    await request('/chats', { method: 'POST', token: reviewerToken, body: { listingId: sellerListing.id } });

    const created = await request('/moderation/reviews', {
      method: 'POST',
      token: reviewerToken,
      body: { sellerId: ivan.user.id, listingId: sellerListing.id, rating: 5, text: 'Быстрая встреча, книга как на фото.' }
    });
    assert.equal(created.status, 201);

    const afterReview = await request(`/users/${ivan.user.id}`);
    assert.ok(afterReview.data.reviewStats.count >= before.data.reviewStats.count);
    assert.ok(Number(afterReview.data.user.rating) >= 1);

    const duplicate = await request('/moderation/reviews', {
      method: 'POST',
      token: reviewerToken,
      body: { sellerId: ivan.user.id, rating: 4 }
    });
    assert.equal(duplicate.status, 409);

    const self = await request('/moderation/reviews', {
      method: 'POST',
      token: ivan.token,
      body: { sellerId: ivan.user.id, rating: 5 }
    });
    assert.equal(self.status, 400);
  });

  test('lists reviews publicly', async () => {
    const result = await request(`/moderation/reviews/${ivan.user.id}`);
    assert.equal(result.status, 200);
    assert.ok(result.data.data.length >= 1);
    assert.ok(result.data.data[0].author);
  });
});
