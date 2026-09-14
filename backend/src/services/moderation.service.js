import { mapUser } from '../lib/mappers.js';
import { listingRepository } from '../repositories/listing.repository.js';
import { moderationRepository } from '../repositories/moderation.repository.js';
import { userRepository } from '../repositories/user.repository.js';

const allowedReportStatuses = ['new', 'reviewing', 'resolved', 'rejected'];
const allowedRoles = ['user', 'moderator', 'admin'];

export async function reportListing(userId, { listingId, reason }) {
  const text = String(reason || '').trim();
  if (!text) throw new Error('Укажите причину жалобы');
  const listing = await listingRepository.findById(Number(listingId));
  if (!listing) throw new Error('Объявление не найдено');
  return moderationRepository.createReport({ reporterId: userId, listingId: Number(listingId), reason: text });
}

export async function getReports() {
  return moderationRepository.findReports();
}

export async function setReportStatus(id, status) {
  if (!allowedReportStatuses.includes(status)) throw new Error('Неверный статус жалобы');
  const report = await moderationRepository.updateReportStatus(Number(id), status);
  if (!report) throw new Error('Жалоба не найдена');
  return report;
}

export async function removeListing(id) {
  const listing = await listingRepository.remove(Number(id));
  if (!listing) throw new Error('Объявление не найдено');
  return listing;
}

export async function setUserBlocked(id, isBlocked) {
  const user = await userRepository.setBlocked(id, Boolean(isBlocked));
  if (!user) throw new Error('Пользователь не найден');
  return mapUser(user);
}

export async function listUsers() {
  const users = await userRepository.findAll();
  return users.map(mapUser);
}

export async function setUserRole(id, role) {
  if (!allowedRoles.includes(role)) throw new Error('Неверная роль');
  const user = await userRepository.setRole(id, role);
  if (!user) throw new Error('Пользователь не найден');
  return mapUser(user);
}

export async function getCategories() {
  return moderationRepository.findCategories();
}

export async function createCategory(name) {
  const normalized = String(name || '').trim();
  if (!normalized) throw new Error('Укажите название категории');
  return moderationRepository.createCategory(normalized);
}

export async function deleteCategory(id) {
  await moderationRepository.deleteCategory(Number(id));
}

export async function createSellerReview(userId, { sellerId, listingId, rating, text }) {
  const value = Number(rating);
  if (!sellerId) throw new Error('Укажите продавца');
  if (!value || value < 1 || value > 5) throw new Error('Укажите оценку от 1 до 5');
  if (sellerId === userId) throw new Error('Нельзя оставить отзыв самому себе');
  return moderationRepository.createSellerReview({ authorId: userId, sellerId, listingId: listingId ? Number(listingId) : null, rating: value, text });
}

export async function getSellerReviews(sellerId) {
  return moderationRepository.findSellerReviews(sellerId);
}
