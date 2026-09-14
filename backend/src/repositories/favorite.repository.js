import { query } from '../db/pool.js';

export const favoriteRepository = {
  async findByUser(userId) {
    const result = await query(
      'SELECT listing_id FROM favorites WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows.map((row) => row.listing_id);
  },

  async toggle(userId, listingId) {
    const existing = await query(
      'SELECT 1 FROM favorites WHERE user_id = $1 AND listing_id = $2',
      [userId, listingId]
    );
    if (existing.rows.length) {
      await query('DELETE FROM favorites WHERE user_id = $1 AND listing_id = $2', [userId, listingId]);
      return false;
    }
    await query('INSERT INTO favorites (user_id, listing_id) VALUES ($1, $2)', [userId, listingId]);
    return true;
  }
};
