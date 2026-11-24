import { mapChat, mapMessage } from '../lib/mappers.js';
import { chatRepository } from '../repositories/chat.repository.js';
import { listingRepository } from '../repositories/listing.repository.js';
import { badRequest, forbidden, notFound } from '../lib/errors.js';
import { id as validateId, text } from '../lib/validate.js';

export async function getChats(userId) {
  const rows = await chatRepository.findByUser(userId);
  return rows.map(mapChat);
}

export async function getUnreadCount(userId) {
  return chatRepository.unreadCount(userId);
}

export async function createChat(userId, { listingId }) {
  const id = validateId(listingId);
  const listing = await listingRepository.findById(id);
  if (!listing) throw notFound('Объявление не найдено');
  if (listing.seller_id === userId) throw forbidden('Нельзя написать самому себе');

  const chat = await chatRepository.findOrCreate({
    listingId: id,
    buyerId: userId,
    sellerId: listing.seller_id
  });

  const rows = await chatRepository.findByUser(userId);
  const row = rows.find((item) => item.id === chat.id);
  if (row) return mapChat(row);

  return mapChat({
    ...chat,
    listing_title: listing.title,
    participant_id: listing.seller_id,
    participant_name: listing.seller_name,
    participant_avatar: listing.seller_avatar,
    unread: 0,
    last_message: ''
  });
}

async function loadParticipantChat(userId, chatId) {
  const chat = await chatRepository.findById(validateId(chatId));
  if (!chat) throw notFound('Чат не найден');
  if (chat.buyer_id !== userId && chat.seller_id !== userId) throw forbidden('Нет доступа к чату');
  return chat;
}

export async function getMessages(userId, chatId, { afterId = 0 } = {}) {
  await loadParticipantChat(userId, chatId);
  await chatRepository.markRead(Number(chatId), userId);
  const rows = await chatRepository.getMessages(Number(chatId), { afterId: Number(afterId) || 0 });
  return rows.map(mapMessage);
}

export async function sendMessage(userId, chatId, messageText) {
  const chat = await loadParticipantChat(userId, chatId);
  const body = text(messageText, { field: 'Сообщение', min: 1, max: 2000 });
  const message = await chatRepository.addMessage({ chatId: chat.id, senderId: userId, text: body });
  return mapMessage(message);
}

export async function getChatSummary(userId, chatId) {
  const rows = await chatRepository.findByUser(userId);
  const chat = rows.find((item) => item.id === Number(chatId));
  if (!chat) throw badRequest('Чат не найден');
  return mapChat(chat);
}
