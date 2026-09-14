import { ratingRepository } from '../repositories/rating.repository.js';

export async function rateBook(userId, listingId, { value, review }) {
  const rating = Math.min(5, Math.max(1, Number(value)));
  if (!rating) throw new Error('Укажите оценку от 1 до 5');
  await ratingRepository.upsert({ userId, listingId: Number(listingId), value: rating, review });
  const stats = await ratingRepository.getStats(Number(listingId));
  return { listingId: Number(listingId), value: rating, avg: Number(stats.avg).toFixed(1), count: stats.count };
}

export async function getUserRating(userId, listingId) {
  return ratingRepository.getUserRating(userId, Number(listingId));
}
