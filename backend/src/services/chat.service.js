import { mapChat, mapMessage } from '../lib/mappers.js';
import { chatRepository } from '../repositories/chat.repository.js';
import { listingRepository } from '../repositories/listing.repository.js';
import { userRepository } from '../repositories/user.repository.js';

export async function getChats(userId) {
  const rows = await chatRepository.findByUser(userId);
  return rows.map(mapChat);
}

export async function createChat(userId, { listingId }) {
  const listing = await listingRepository.findById(Number(listingId));
  if (!listing) throw new Error('Объявление не найдено');
  if (listing.seller_id === userId) throw new Error('Нельзя написать самому себе');

  const chat = await chatRepository.findOrCreate({
    listingId: Number(listingId),
    buyerId: userId,
    sellerId: listing.seller_id
  });

  const rows = await chatRepository.findByUser(userId);
  const row = rows.find((item) => item.id === chat.id);
  return mapChat(row || { ...chat, listing_title: listing.title, participant_name: listing.seller_name, unread: 0, last_message: '' });
}

export async function getMessages(userId, chatId) {
  const chat = await chatRepository.findById(Number(chatId));
  if (!chat) throw new Error('Чат не найден');
  if (chat.buyer_id !== userId && chat.seller_id !== userId) throw new Error('Нет доступа к чату');

  await chatRepository.markRead(Number(chatId), userId);
  const rows = await chatRepository.getMessages(Number(chatId));
  return rows.map(mapMessage);
}

export async function sendMessage(userId, chatId, text) {
  const trimmed = String(text || '').trim();
  if (!trimmed || trimmed.length > 2000) throw new Error('Сообщение должно быть от 1 до 2000 символов');

  const chat = await chatRepository.findById(Number(chatId));
  if (!chat) throw new Error('Чат не найден');
  if (chat.buyer_id !== userId && chat.seller_id !== userId) throw new Error('Нет доступа к чату');

  const message = await chatRepository.addMessage({
    chatId: Number(chatId),
    senderId: userId,
    text: trimmed
  });
  return mapMessage(message);
}

export async function startChatWithSeller(userId, listingId) {
  return createChat(userId, { listingId });
}
