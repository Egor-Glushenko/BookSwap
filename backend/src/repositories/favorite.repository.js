import { query } from '../db/index.js';

export const favoriteRepository = {
  async findByUser(userId) {
    const result = await query(
      'SELECT listing_id FROM favorites WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows.map((row) => row.listing_id);
  },

  async findListingsByUser(userId) {
    const result = await query(
      `SELECT l.*,
              u.name AS seller_name,
              u.rating AS seller_rating,
              u.deals AS seller_deals,
              u.avatar_url AS seller_avatar,
              u.created_at AS seller_created_at,
              COALESCE(AVG(br.value), 0) AS avg_rating,
              COUNT(br.id)::int AS rating_count
       FROM favorites f
       JOIN listings l ON l.id = f.listing_id
       JOIN users u ON u.id = l.seller_id
       LEFT JOIN book_ratings br ON br.listing_id = l.id
       WHERE f.user_id = $1 AND l.status <> 'archived'
       GROUP BY l.id, u.id, f.created_at
       ORDER BY f.created_at DESC`,
      [userId]
    );
    return result.rows;
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
  },

  async countByUser(userId) {
    const result = await query('SELECT COUNT(*)::int AS count FROM favorites WHERE user_id = $1', [userId]);
    return Number(result.rows[0]?.count || 0);
  }
};
