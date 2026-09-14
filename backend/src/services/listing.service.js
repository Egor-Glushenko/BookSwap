import { mapListing } from '../lib/mappers.js';
import { listingRepository } from '../repositories/listing.repository.js';
import { userRepository } from '../repositories/user.repository.js';

function rowToListing(row) {
  const seller = { name: row.seller_name, rating: row.seller_rating, deals: row.seller_deals };
  const ratingStats = { avg: row.avg_rating, count: row.rating_count };
  return mapListing(row, seller, ratingStats);
}

export async function getListings(filters) {
  const rows = await listingRepository.findAll(filters);
  return rows.map(rowToListing);
}

export async function getListing(id) {
  const row = await listingRepository.findById(id);
  if (!row) return null;
  await listingRepository.incrementViews(id);
  return rowToListing({ ...row, views: Number(row.views) + 1 });
}

export async function createListing(userId, data) {
  if (!data.title?.trim()) throw new Error('Укажите название книги');
  if (!data.author?.trim()) throw new Error('Укажите автора');
  if (!data.city?.trim()) throw new Error('Укажите город');
  if (!['Продажа', 'Обмен', 'Бесплатно'].includes(data.type)) throw new Error('Неверный тип объявления');
  if (data.type === 'Продажа' && (!data.price || Number(data.price) <= 0)) {
    throw new Error('Укажите цену для продажи');
  }

  const row = await listingRepository.create({
    sellerId: userId,
    type: data.type,
    title: data.title.trim(),
    author: data.author.trim(),
    genre: data.genre,
    publisher: data.publisher,
    year: data.year ? Number(data.year) : null,
    isbn: data.isbn,
    condition: data.condition || 'Хорошее',
    description: data.description,
    price: data.type === 'Продажа' ? Number(data.price) : null,
    exchangeWant: data.type === 'Обмен' ? data.exchangeWant : null,
    city: data.city.trim(),
    district: data.district,
    pickup: data.pickup,
    delivery: data.delivery,
    status: 'active'
  });

  const seller = await userRepository.findById(userId);
  return mapListing(row, seller, { avg: 0, count: 0 });
}

export async function getUserListings(userId) {
  const rows = await listingRepository.findAll({ sellerId: userId, status: 'active' });
  return rows.map(rowToListing);
}

export async function getBestBooks({ genre, period }) {
  void period;
  const rows = await listingRepository.findBest({ genre, minRatings: 1, limit: 100 });
  return rows.map((row) => ({
    id: row.listing_id,
    title: row.title,
    author: row.author,
    genre: row.genre || '',
    tone: row.tone || 'blue',
    rating: Number(row.avg_rating).toFixed(1),
    reviews: row.rating_count,
    type: 'Продажа',
    price: '',
    city: '',
    condition: ''
  }));
}
