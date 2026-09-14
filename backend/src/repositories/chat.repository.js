import { query } from '../db/pool.js';

export const chatRepository = {
  async findByUser(userId) {
    const result = await query(
      `SELECT c.*,
              l.title AS listing_title,
              CASE WHEN c.buyer_id = $1 THEN su.name ELSE bu.name END AS participant_name,
              (SELECT text FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
              (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
              (SELECT COUNT(*)::int FROM messages m
               WHERE m.chat_id = c.id AND m.sender_id != $1 AND m.read_at IS NULL) AS unread
       FROM chats c
       JOIN listings l ON l.id = c.listing_id
       JOIN users bu ON bu.id = c.buyer_id
       JOIN users su ON su.id = c.seller_id
       WHERE c.buyer_id = $1 OR c.seller_id = $1
       ORDER BY COALESCE(
         (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1),
         c.created_at
       ) DESC`,
      [userId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await query('SELECT * FROM chats WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findOrCreate({ listingId, buyerId, sellerId }) {
    const existing = await query(
      'SELECT * FROM chats WHERE listing_id = $1 AND buyer_id = $2',
      [listingId, buyerId]
    );
    if (existing.rows[0]) return existing.rows[0];

    const result = await query(
      `INSERT INTO chats (listing_id, buyer_id, seller_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [listingId, buyerId, sellerId]
    );
    return result.rows[0];
  },

  async getMessages(chatId) {
    const result = await query(
      'SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC',
      [chatId]
    );
    return result.rows;
  },

  async addMessage({ chatId, senderId, text }) {
    const result = await query(
      `INSERT INTO messages (chat_id, sender_id, text)
       VALUES ($1, $2, $3) RETURNING *`,
      [chatId, senderId, text]
    );
    return result.rows[0];
  },

  async markRead(chatId, userId) {
    await query(
      `UPDATE messages SET read_at = NOW()
       WHERE chat_id = $1 AND sender_id != $2 AND read_at IS NULL`,
      [chatId, userId]
    );
  }
};
