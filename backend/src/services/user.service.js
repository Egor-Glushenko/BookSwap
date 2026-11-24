import { mapListing, mapSellerReview, mapUser } from '../lib/mappers.js';
import { listingRepository } from '../repositories/listing.repository.js';
import { moderationRepository } from '../repositories/moderation.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { favoriteRepository } from '../repositories/favorite.repository.js';
import { notFound } from '../lib/errors.js';
import { uuid } from '../lib/validate.js';

export async function getPublicProfile(sellerId) {
  const id = uuid(sellerId, 'Пользователь');
  const user = await userRepository.findPublicById(id);
  if (!user) throw notFound('Пользователь не найден');
  if (user.is_blocked) throw notFound('Пользователь не найден');

  const [listingsResult, reviews, stats] = await Promise.all([
    listingRepository.findAll({ sellerId: id, status: 'active', sort: 'new' }, { limit: 30, offset: 0 }),
    moderationRepository.findSellerReviews(id, 20),
    moderationRepository.sellerReviewStats(id)
  ]);

  return {
    user: mapUser(user),
    listings: listingsResult.rows.map(mapListing),
    listingsTotal: listingsResult.total,
    reviews: reviews.map(mapSellerReview),
    reviewStats: { avg: stats.avg ? stats.avg.toFixed(1) : '0.0', count: stats.count },
    favoritesCount: await favoriteRepository.countByUser(id)
  };
}
