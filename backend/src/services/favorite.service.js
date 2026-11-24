import { favoriteRepository } from '../repositories/favorite.repository.js';
import { listingRepository } from '../repositories/listing.repository.js';
import { mapListing } from '../lib/mappers.js';
import { notFound } from '../lib/errors.js';
import { id as validateId } from '../lib/validate.js';

export async function getFavorites(userId) {
  const rows = await favoriteRepository.findListingsByUser(userId);
  return { ids: rows.map((row) => row.id), data: rows.map(mapListing) };
}

export async function toggleFavorite(userId, listingId) {
  const id = validateId(listingId);
  const listing = await listingRepository.findRawById(id);
  if (!listing) throw notFound('Объявление не найдено');
  const favorite = await favoriteRepository.toggle(userId, id);
  const count = await favoriteRepository.countByUser(userId);
  return { listingId: id, favorite, count };
}
