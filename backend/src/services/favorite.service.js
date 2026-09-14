import { favoriteRepository } from '../repositories/favorite.repository.js';

export async function getFavorites(userId) {
  return favoriteRepository.findByUser(userId);
}

export async function toggleFavorite(userId, listingId) {
  const favorite = await favoriteRepository.toggle(userId, Number(listingId));
  return { listingId: Number(listingId), favorite };
}
