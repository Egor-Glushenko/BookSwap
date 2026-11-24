import { ratingRepository } from '../repositories/rating.repository.js';
import { listingRepository } from '../repositories/listing.repository.js';
import { mapRating } from '../lib/mappers.js';
import { badRequest, forbidden, notFound } from '../lib/errors.js';
import { id as validateId, integer, optionalText } from '../lib/validate.js';

export async function rateBook(userId, listingId, { value, review }) {
  const id = validateId(listingId);
  const listing = await listingRepository.findRawById(id);
  if (!listing) throw notFound('Объявление не найдено');
  if (listing.seller_id === userId) throw forbidden('Нельзя оценивать собственное объявление');

  const rating = integer(value, { field: 'Оценка', min: 1, max: 5 });
  const reviewText = optionalText(review, { field: 'Отзыв', max: 600 }) || null;

  await ratingRepository.upsert({ userId, listingId: id, value: rating, review: reviewText });
  const stats = await ratingRepository.getStats(id);
  return { listingId: id, value: rating, avg: stats.avg.toFixed(1), count: stats.count };
}

export async function getUserRating(userId, listingId) {
  return ratingRepository.getUserRating(userId, validateId(listingId));
}

export async function getBookRatings(listingId) {
  const id = validateId(listingId);
  const [rows, stats] = await Promise.all([
    ratingRepository.findByListing(id),
    ratingRepository.getStats(id)
  ]);
  return { data: rows.map(mapRating), avg: stats.avg.toFixed(1), count: stats.count };
}

export async function assertRatable(listingId) {
  const listing = await listingRepository.findRawById(validateId(listingId));
  if (!listing) throw badRequest('Объявление не найдено');
  return listing;
}
