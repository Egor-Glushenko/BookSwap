import { query } from '../db/index.js';

export const ratingRepository = {
  async upsert({ userId, listingId, value, review }) {
    const result = await query(
      `INSERT INTO book_ratings (user_id, listing_id, value, review)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, listing_id)
       DO UPDATE SET value = EXCLUDED.value, review = EXCLUDED.review, created_at = NOW()
       RETURNING *`,
      [userId, listingId, value, review || null]
    );
    return result.rows[0];
  },

  async getStats(listingId) {
    const result = await query(
      `SELECT COALESCE(AVG(value), 0) AS avg, COUNT(*)::int AS count
       FROM book_ratings WHERE listing_id = $1`,
      [listingId]
    );
    const row = result.rows[0] || { avg: 0, count: 0 };
    return { avg: Number(row.avg), count: Number(row.count) };
  },

  async getUserRating(userId, listingId) {
    const result = await query(
      'SELECT value FROM book_ratings WHERE user_id = $1 AND listing_id = $2',
      [userId, listingId]
    );
    return result.rows[0]?.value ? Number(result.rows[0].value) : null;
  },

  async findByListing(listingId, limit = 20) {
    const result = await query(
      `SELECT br.*, u.name AS author_name, u.avatar_url AS author_avatar
       FROM book_ratings br
       JOIN users u ON u.id = br.user_id
       WHERE br.listing_id = $1
       ORDER BY br.created_at DESC
       LIMIT $2`,
      [listingId, limit]
    );
    return result.rows;
  }
};
