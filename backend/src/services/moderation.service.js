import { mapCategory, mapListing, mapReport, mapSellerReview, mapUser } from '../lib/mappers.js';
import { listingRepository } from '../repositories/listing.repository.js';
import { moderationRepository } from '../repositories/moderation.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { badRequest, conflict, forbidden, notFound } from '../lib/errors.js';
import { chatRepository } from '../repositories/chat.repository.js';
import { id as validateId, oneOf, optionalText, text, uuid } from '../lib/validate.js';
import { LISTING_STATUSES } from './listing.service.js';

const REPORT_STATUSES = ['new', 'reviewing', 'resolved', 'rejected'];
const ROLES = ['user', 'moderator', 'admin'];

export async function reportListing(userId, { listingId, reason }) {
  const id = validateId(listingId);
  const reportReason = text(reason, { field: 'Причина жалобы', min: 5, max: 600 });
  const listing = await listingRepository.findRawById(id);
  if (!listing) throw notFound('Объявление не найдено');
  if (listing.seller_id === userId) throw badRequest('Нельзя пожаловаться на своё объявление');

  const duplicate = await moderationRepository.findRecentReport({ reporterId: userId, listingId: id });
  if (duplicate) throw conflict('Жалоба на это объявление уже отправлена');

  const report = await moderationRepository.createReport({ reporterId: userId, listingId: id, reason: reportReason });
  return { id: report.id, status: report.status };
}

export async function getReports(status = 'all') {
  const rows = await moderationRepository.findReports({ status: REPORT_STATUSES.includes(status) ? status : 'all' });
  return rows.map(mapReport);
}

export async function setReportStatus(id, status) {
  oneOf(status, REPORT_STATUSES, 'Статус жалобы');
  const report = await moderationRepository.updateReportStatus(validateId(id), status);
  if (!report) throw notFound('Жалоба не найдена');
  return mapReport({ ...report, listing_title: '', reporter_name: '', seller_name: '' });
}

export async function getCategories() {
  const rows = await moderationRepository.findCategories();
  return rows.map(mapCategory);
}

export async function createCategory(name) {
  const normalized = text(name, { field: 'Название категории', max: 80 });
  const category = await moderationRepository.createCategory(normalized);
  return mapCategory(category);
}

export async function deleteCategory(id) {
  const removed = await moderationRepository.deleteCategory(validateId(id));
  if (!removed) throw notFound('Категория не найдена');
}

export async function listUsers() {
  const rows = await userRepository.findAll();
  return rows.map((row) => mapUser(row, { includeEmail: true }));
}

export async function setUserBlocked(id, isBlocked) {
  const user = await userRepository.setBlocked(uuid(id, 'Пользователь'), Boolean(isBlocked));
  if (!user) throw notFound('Пользователь не найден');
  return mapUser(user, { includeEmail: true });
}

export async function setUserRole(id, role) {
  oneOf(role, ROLES, 'Роль');
  const user = await userRepository.setRole(uuid(id, 'Пользователь'), role);
  if (!user) throw notFound('Пользователь не найден');
  return mapUser(user, { includeEmail: true });
}

export async function createSellerReview(userId, { sellerId, listingId, rating, text: reviewText }) {
  const seller = uuid(sellerId, 'Продавец');
  if (seller === userId) throw badRequest('Нельзя оставить отзыв самому себе');

  const value = Number(rating);
  if (!Number.isFinite(value) || value < 1 || value > 5) throw badRequest('Укажите оценку от 1 до 5');

  const target = await userRepository.findById(seller);
  if (!target) throw notFound('Продавец не найден');

  const listing = listingId ? validateId(listingId) : null;

  // A review describes a deal: require at least one dialogue between the users.
  const interacted = await chatRepository.existsBetween({
    firstUserId: userId,
    secondUserId: seller,
    listingId: listing
  });
  if (!interacted) throw forbidden('Отзыв можно оставить после переписки с продавцом');

  const existing = await moderationRepository.findSellerReviewByAuthor({
    authorId: userId,
    sellerId: seller,
    listingId: listing
  });
  if (existing) throw conflict('Вы уже оставили отзыв об этой сделке');

  const row = await moderationRepository.createSellerReview({
    authorId: userId,
    sellerId: seller,
    listingId: listing,
    rating: Math.round(value * 10) / 10,
    text: optionalText(reviewText, { field: 'Отзыв', max: 600 }) || null
  });

  await userRepository.recomputeRating(seller);
  return mapSellerReview({ ...row, author_name: '', listing_title: '' });
}

export async function getSellerReviews(sellerId) {
  const seller = uuid(sellerId, 'Продавец');
  const [rows, stats] = await Promise.all([
    moderationRepository.findSellerReviews(seller),
    moderationRepository.sellerReviewStats(seller)
  ]);
  return {
    data: rows.map(mapSellerReview),
    avg: stats.avg ? stats.avg.toFixed(1) : '0.0',
    count: stats.count
  };
}

export async function getPlatformStats() {
  const [platform, reportsByStatus] = await Promise.all([
    moderationRepository.platformStats(),
    moderationRepository.reportStats()
  ]);
  return { ...platform, reportsByStatus };
}

export async function getModerationListings(status = 'all') {
  const allowed = ['all', ...LISTING_STATUSES].includes(status) ? status : 'all';
  const { rows, total } = await listingRepository.findAll({ status: allowed, sort: 'new' }, { limit: 30, offset: 0 });
  return { data: rows.map(mapListing), total };
}
