import { mapListing } from '../lib/mappers.js';
import { listingRepository } from '../repositories/listing.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { badRequest, forbidden, notFound } from '../lib/errors.js';
import { boolean, id as validateId, integer, money, oneOf, optionalText, text, url } from '../lib/validate.js';
import { invalidateSitemapCache } from '../seo/index.js';

export const LISTING_TYPES = ['Продажа', 'Обмен', 'Бесплатно'];
export const LISTING_CONDITIONS = ['Новое', 'Отличное', 'Хорошее', 'Удовлетворительное'];
export const LISTING_STATUSES = ['active', 'moderation', 'archived', 'sold'];
export const TONES = ['blue', 'orange', 'green', 'pink', 'yellow', 'violet'];

const SORT_ALIASES = {
  new: 'new',
  'Сначала новые': 'new',
  price_asc: 'price_asc',
  'По цене': 'price_asc',
  price_desc: 'price_desc',
  rating: 'rating',
  'По рейтингу': 'rating',
  popular: 'popular',
  'По популярности': 'popular'
};

const normalizePrice = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

export function parseListingFilters(query = {}) {
  return {
    type: LISTING_TYPES.includes(query.type) ? query.type : undefined,
    search: String(query.query || '').trim().slice(0, 120) || undefined,
    sort: SORT_ALIASES[query.sort] || 'new',
    genre: String(query.genre || '').trim().slice(0, 80) || undefined,
    condition: LISTING_CONDITIONS.includes(query.condition) ? query.condition : undefined,
    city: String(query.city || '').trim().slice(0, 80) || undefined,
    minPrice: normalizePrice(query.minPrice),
    maxPrice: normalizePrice(query.maxPrice),
    sellerId: query.sellerId || undefined
  };
}

export async function listListings(filters, pagination) {
  const { rows, total } = await listingRepository.findAll(filters, pagination);
  return { data: rows.map(mapListing), total };
}

export async function getListing(listingId, { viewerId } = {}) {
  const listingIdValue = validateId(listingId);
  const row = await listingRepository.findById(listingIdValue);
  if (!row) throw notFound('Объявление не найдено');

  const isOwner = viewerId && row.seller_id === viewerId;
  if (!isOwner) {
    await listingRepository.incrementViews(listingIdValue);
    row.views = Number(row.views || 0) + 1;
  }
  return mapListing(row);
}

export async function getSimilarListings(listingId, limit = 4) {
  const row = await listingRepository.findById(validateId(listingId));
  if (!row) throw notFound('Объявление не найдено');
  const rows = await listingRepository.findSimilar(row, limit);
  return rows.map(mapListing);
}

function validateListingPayload(payload, { partial = false } = {}) {
  const data = {};

  const assignText = (key, options) => {
    if (partial && payload[key] === undefined) return;
    data[key] = text(payload[key], { field: options.field, min: options.min || 1, max: options.max, required: options.required ?? true });
    if (!data[key] && options.optional) data[key] = '';
  };

  if (!partial || payload.type !== undefined) {
    data.type = oneOf(payload.type, LISTING_TYPES, 'Тип объявления');
  }

  if (!partial || payload.title !== undefined) assignText('title', { field: 'Название книги', max: 160 });
  if (!partial || payload.author !== undefined) assignText('author', { field: 'Автор', max: 120 });
  if (!partial || payload.city !== undefined) assignText('city', { field: 'Город', max: 80 });

  if (!partial || payload.condition !== undefined) {
    data.condition = oneOf(payload.condition || 'Хорошее', LISTING_CONDITIONS, 'Состояние');
  }

  if (payload.genre !== undefined) data.genre = optionalText(payload.genre, { field: 'Жанр', max: 80 }) || null;
  if (payload.publisher !== undefined) data.publisher = optionalText(payload.publisher, { field: 'Издательство', max: 120 }) || null;
  if (payload.district !== undefined) data.district = optionalText(payload.district, { field: 'Район', max: 80 }) || null;
  if (payload.description !== undefined) data.description = optionalText(payload.description, { field: 'Описание', max: 2000 }) || null;
  if (payload.exchangeWant !== undefined) data.exchangeWant = optionalText(payload.exchangeWant, { field: 'Пожелания к обмену', max: 400 }) || null;
  if (payload.isbn !== undefined) data.isbn = optionalText(payload.isbn, { field: 'ISBN', max: 24 }) || null;

  if (payload.year !== undefined) {
    data.year = payload.year === '' || payload.year === null
      ? null
      : integer(payload.year, { field: 'Год издания', min: 1400, max: new Date().getFullYear() + 1 });
  }

  if (payload.price !== undefined) {
    data.price = payload.price === '' || payload.price === null
      ? null
      : money(payload.price, { field: 'Цена', min: 1, max: 1_000_000 });
  }

  if (payload.images !== undefined) {
    const list = Array.isArray(payload.images) ? payload.images.slice(0, 3) : [];
    data.images = list.map((item) => url(item, { field: 'Фото' })).filter(Boolean);
  }

  if (payload.tone !== undefined) data.tone = oneOf(payload.tone || 'blue', TONES, 'Обложка');
  if (payload.pickup !== undefined) data.pickup = boolean(payload.pickup, true);
  if (payload.delivery !== undefined) data.delivery = boolean(payload.delivery, false);

  return data;
}

/** Keeps type/price/exchange-wish consistent for both create and update. */
function applyTypeRules(data, { type, price }) {
  if (type === 'Продажа') {
    if (price === null || price === undefined || Number(price) <= 0) {
      throw badRequest('Укажите цену для продажи');
    }
    data.price = price;
  } else {
    data.price = null;
  }
  if (type !== 'Обмен') data.exchangeWant = null;
  return data;
}

export async function createListing(userId, payload) {
  const data = applyTypeRules(validateListingPayload(payload), {
    type: payload.type,
    price: payload.price === '' ? null : payload.price
  });

  const row = await listingRepository.create({
    sellerId: userId,
    ...data,
    status: 'active'
  });
  invalidateSitemapCache();

  const seller = await userRepository.findById(userId);
  return mapListing({
    ...row,
    seller_name: seller?.name,
    seller_rating: seller?.rating,
    seller_deals: seller?.deals,
    seller_avatar: seller?.avatar_url,
    seller_created_at: seller?.created_at,
    avg_rating: 0,
    rating_count: 0
  });
}

export async function updateListing({ listingId, userId, isStaffUser, payload }) {
  const current = await listingRepository.findRawById(validateId(listingId));
  if (!current) throw notFound('Объявление не найдено');
  if (current.seller_id !== userId && !isStaffUser) throw forbidden('Можно редактировать только свои объявления');

  const patch = validateListingPayload(payload, { partial: true });
  const nextType = patch.type ?? current.type;
  const nextPrice = patch.price !== undefined ? patch.price : (current.price === null ? null : Number(current.price));

  applyTypeRules(patch, { type: nextType, price: nextPrice });

  await listingRepository.update(current.id, patch);
  invalidateSitemapCache();
  const full = await listingRepository.findById(current.id);
  return mapListing(full);
}

export async function setListingStatus({ listingId, userId, isStaffUser, status }) {
  const current = await listingRepository.findRawById(validateId(listingId));
  if (!current) throw notFound('Объявление не найдено');
  if (current.seller_id !== userId && !isStaffUser) throw forbidden('Можно изменять только свои объявления');

  const allowed = isStaffUser ? LISTING_STATUSES : ['active', 'sold', 'archived'];
  oneOf(status, allowed, 'Статус');

  const row = await listingRepository.setStatus(current.id, status);
  invalidateSitemapCache();
  if (status === 'sold' && current.status !== 'sold') {
    await userRepository.incrementDeals(current.seller_id);
  }
  const full = await listingRepository.findById(row.id);
  return mapListing(full);
}

export async function archiveListing({ listingId, userId, isStaffUser }) {
  const current = await listingRepository.findRawById(validateId(listingId));
  if (!current) throw notFound('Объявление не найдено');
  if (current.seller_id !== userId && !isStaffUser) throw forbidden('Можно удалять только свои объявления');
  await listingRepository.setStatus(current.id, 'archived');
  invalidateSitemapCache();
  return { id: current.id, status: 'archived' };
}

export async function getUserListings(userId, status = 'all') {
  const allowedStatus = ['all', ...LISTING_STATUSES].includes(status) ? status : 'all';
  const { rows } = await listingRepository.findAll(
    { sellerId: userId, status: allowedStatus, sort: 'new' },
    { limit: 100, offset: 0 }
  );
  return rows.map(mapListing);
}

export async function getBestBooks({ genre, period = 'all' } = {}) {
  const rows = await listingRepository.findBest({ genre, period, limit: 10 });
  return rows.map((row) => ({
    id: row.listing_id,
    title: row.title,
    author: row.author,
    genre: row.genre || '',
    tone: row.tone || 'blue',
    rating: Number(row.avg_rating).toFixed(1),
    reviews: Number(row.rating_count),
    type: 'Продажа',
    price: '',
    city: '',
    condition: ''
  }));
}

export async function getFilterFacets() {
  return listingRepository.facets();
}
