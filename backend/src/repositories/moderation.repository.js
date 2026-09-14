import { query } from '../db/pool.js';

export const moderationRepository = {
  async createReport({ reporterId, listingId, reason }) {
    const result = await query(
      `INSERT INTO reports (reporter_id, listing_id, reason)
       VALUES ($1, $2, $3) RETURNING *`,
      [reporterId, listingId, reason]
    );
    return result.rows[0];
  },
  async findReports() {
    const result = await query(
      `SELECT r.*, l.title AS listing_title, l.seller_id, seller.name AS seller_name, u.name AS reporter_name
       FROM reports r
       JOIN users u ON u.id = r.reporter_id
       LEFT JOIN listings l ON l.id = r.listing_id
       LEFT JOIN users seller ON seller.id = l.seller_id
       ORDER BY r.created_at DESC`
    );
    return result.rows;
  },
  async updateReportStatus(id, status) {
    const result = await query('UPDATE reports SET status = $2 WHERE id = $1 RETURNING *', [id, status]);
    return result.rows[0] || null;
  },
  async findCategories() {
    const result = await query('SELECT * FROM categories ORDER BY name ASC');
    return result.rows;
  },
  async createCategory(name) {
    const result = await query(
      `INSERT INTO categories (name) VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING *`,
      [name]
    );
    return result.rows[0];
  },
  async deleteCategory(id) {
    await query('DELETE FROM categories WHERE id = $1', [id]);
  },
  async createSellerReview({ authorId, sellerId, listingId, rating, text }) {
    const result = await query(
      `INSERT INTO seller_reviews (author_id, seller_id, listing_id, rating, text)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [authorId, sellerId, listingId || null, rating, text || null]
    );
    return result.rows[0];
  },
  async findSellerReviews(sellerId) {
    const result = await query(
      `SELECT sr.*, u.name AS author_name
       FROM seller_reviews sr
       JOIN users u ON u.id = sr.author_id
       WHERE sr.seller_id = $1
       ORDER BY sr.created_at DESC`,
      [sellerId]
    );
    return result.rows;
  }
};
