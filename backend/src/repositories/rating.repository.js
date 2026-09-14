import { query } from '../db/pool.js';

export const ratingRepository = {
  async upsert({ userId, listingId, value, review }) {
    const result = await query(
      `INSERT INTO book_ratings (user_id, listing_id, value, review)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, listing_id)
       DO UPDATE SET value = EXCLUDED.value, review = EXCLUDED.review
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
    return result.rows[0];
  },

  async getUserRating(userId, listingId) {
    const result = await query(
      'SELECT value FROM book_ratings WHERE user_id = $1 AND listing_id = $2',
      [userId, listingId]
    );
    return result.rows[0]?.value || null;
  }
};
