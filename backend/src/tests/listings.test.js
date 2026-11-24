import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { loginAs, startTestServer } from './helpers.js';

let server;
let request;
let anna;

before(async () => {
  server = await startTestServer();
  request = server.request;
  anna = await loginAs(request);
});

after(async () => {
  await server.close();
});

describe('catalogue', () => {
  test('paginates the feed and reports totals', async () => {
    const first = await request('/listings?limit=5&page=1');
    assert.equal(first.status, 200);
    assert.equal(first.data.data.length, 5);
    assert.ok(first.data.total >= 28);
    assert.equal(first.data.page, 1);
    assert.ok(first.data.pages >= 6);

    const second = await request('/listings?limit=5&page=2');
    const firstIds = first.data.data.map((book) => book.id);
    const secondIds = second.data.data.map((book) => book.id);
    assert.equal(secondIds.length, 5);
    assert.ok(secondIds.every((id) => !firstIds.includes(id)));
  });

  test('filters by type, genre, city, price and search', async () => {
    const exchanges = await request('/listings?type=Обмен&limit=48');
    assert.ok(exchanges.data.data.length > 0);
    assert.ok(exchanges.data.data.every((book) => book.type === 'Обмен'));

    const search = await request('/listings?query=Дюна');
    assert.ok(search.data.data.some((book) => book.title.includes('Дюна')));

    const cheap = await request('/listings?maxPrice=400&limit=48');
    assert.ok(cheap.data.data.length > 0);
    assert.ok(cheap.data.data.every((book) => book.priceValue === null || book.priceValue <= 400));

    const city = await request('/listings?city=Казань&limit=48');
    assert.ok(city.data.data.every((book) => book.city === 'Казань'));

    const genre = await request('/listings?genre=Классика&limit=48');
    assert.ok(genre.data.data.length > 0);
    assert.ok(genre.data.data.every((book) => book.genre === 'Классика'));
  });

  test('sorts by price ascending', async () => {
    const result = await request('/listings?sort=price_asc&limit=10');
    const prices = result.data.data.map((book) => book.priceValue).filter((price) => typeof price === 'number');
    const sorted = [...prices].sort((a, b) => a - b);
    assert.deepEqual(prices, sorted);
  });

  test('returns facets for the filter sidebar', async () => {
    const result = await request('/listings/filters');
    assert.equal(result.status, 200);
    assert.ok(result.data.total > 0);
    assert.ok(result.data.genres.length > 0);
    assert.ok(result.data.cities.length > 0);
    assert.ok(result.data.types['Продажа'] > 0);
  });

  test('returns a single listing and counts a view', async () => {
    const before = await request('/listings/1');
    assert.equal(before.status, 200);
    assert.equal(before.data.data.title, 'Мастер и Маргарита');
    const afterView = await request('/listings/1');
    assert.equal(afterView.data.data.views, before.data.data.views + 1);

    const missing = await request('/listings/99999');
    assert.equal(missing.status, 404);
  });

  test('returns similar listings of the same genre or author', async () => {
    const result = await request('/listings/1/similar');
    assert.equal(result.status, 200);
    assert.ok(result.data.data.length > 0);
    assert.ok(result.data.data.every((book) => book.id !== 1));
  });

  test('ranks the best rated books', async () => {
    const result = await request('/books/best');
    assert.equal(result.status, 200);
    assert.ok(result.data.data.length > 0);
    const ratings = result.data.data.map((book) => Number(book.rating));
    assert.deepEqual(ratings, [...ratings].sort((a, b) => b - a));
  });

  test('exposes public book reviews', async () => {
    const result = await request('/books/1/ratings');
    assert.equal(result.status, 200);
    assert.ok(Array.isArray(result.data.data));
    assert.ok(Number(result.data.count) >= 0);
  });
});

describe('listing lifecycle', () => {
  test('requires authentication and validates the payload', async () => {
    const anonymous = await request('/listings', { method: 'POST', body: { title: 'Без входа' } });
    assert.equal(anonymous.status, 401);

    const invalidType = await request('/listings', {
      method: 'POST',
      token: anna.token,
      body: { type: 'Аренда', title: 'Книга', author: 'Автор', city: 'Москва', condition: 'Хорошее' }
    });
    assert.equal(invalidType.status, 400);

    const missingPrice = await request('/listings', {
      method: 'POST',
      token: anna.token,
      body: { type: 'Продажа', title: 'Книга', author: 'Автор', city: 'Москва', condition: 'Хорошее' }
    });
    assert.equal(missingPrice.status, 400);

    const missingTitle = await request('/listings', {
      method: 'POST',
      token: anna.token,
      body: { type: 'Обмен', author: 'Автор', city: 'Москва', condition: 'Хорошее' }
    });
    assert.equal(missingTitle.status, 400);
  });

  test('creates, edits, sells and archives an own listing', async () => {
    const created = await request('/listings', {
      method: 'POST',
      token: anna.token,
      body: {
        type: 'Продажа',
        title: 'Тень горы',
        author: 'Грегори Дэвид Робертс',
        genre: 'Современная проза',
        condition: 'Отличное',
        price: '640',
        city: 'Москва',
        district: 'Хамовники',
        description: 'Продолжение «Шантарама», прочитано один раз.',
        pickup: true,
        delivery: false
      }
    });
    assert.equal(created.status, 201);
    assert.equal(created.data.data.price, '640 ₽');
    const listingId = created.data.data.id;

    const updated = await request(`/listings/${listingId}`, {
      method: 'PATCH',
      token: anna.token,
      body: { title: 'Тень горы (новая)', price: 590 }
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.data.data.title, 'Тень горы (новая)');
    assert.equal(updated.data.data.price, '590 ₽');

    const sold = await request(`/listings/${listingId}/status`, {
      method: 'PATCH',
      token: anna.token,
      body: { status: 'sold' }
    });
    assert.equal(sold.status, 200);
    assert.equal(sold.data.data.status, 'sold');

    const archived = await request(`/listings/${listingId}`, { method: 'DELETE', token: anna.token });
    assert.equal(archived.status, 200);
    assert.equal(archived.data.data.status, 'archived');

    const feed = await request('/listings?limit=48');
    assert.ok(!feed.data.data.some((book) => book.id === listingId));
  });

  test('does not let a user edit someone else listing', async () => {
    const otherListing = await request('/listings?limit=48');
    const listing = otherListing.data.data.find((book) => book.sellerId !== anna.user.id);
    assert.ok(listing, 'expected a listing from another seller');
    const result = await request(`/listings/${listing.id}`, {
      method: 'PATCH',
      token: anna.token,
      body: { title: 'Угнанное название' }
    });
    assert.equal(result.status, 403);
  });

  test('lists only own listings in the account area', async () => {
    const result = await request('/listings/mine', { token: anna.token });
    assert.equal(result.status, 200);
    assert.ok(result.data.data.every((book) => book.sellerId === anna.user.id));
  });
});
