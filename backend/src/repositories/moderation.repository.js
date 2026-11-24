import { query } from '../db/index.js';

export const moderationRepository = {
  async createReport({ reporterId, listingId, reason }) {
    const result = await query(
      `INSERT INTO reports (reporter_id, listing_id, reason)
       VALUES ($1, $2, $3) RETURNING *`,
      [reporterId, listingId, reason]
    );
    return result.rows[0];
  },

  async findRecentReport({ reporterId, listingId }) {
    const result = await query(
      `SELECT * FROM reports
       WHERE reporter_id = $1 AND listing_id = $2
         AND status IN ('new', 'reviewing')
         AND created_at > NOW() - INTERVAL '1 day'
       LIMIT 1`,
      [reporterId, listingId]
    );
    return result.rows[0] || null;
  },

  async findReports({ status } = {}) {
    const result = await query(
      `SELECT r.*, l.title AS listing_title, l.seller_id,
              seller.name AS seller_name, u.name AS reporter_name
       FROM reports r
       JOIN users u ON u.id = r.reporter_id
       LEFT JOIN listings l ON l.id = r.listing_id
       LEFT JOIN users seller ON seller.id = l.seller_id
       WHERE ($1 = 'all' OR r.status = $1)
       ORDER BY r.created_at DESC
       LIMIT 200`,
      [status || 'all']
    );
    return result.rows;
  },

  async updateReportStatus(id, status) {
    const result = await query('UPDATE reports SET status = $2 WHERE id = $1 RETURNING *', [id, status]);
    return result.rows[0] || null;
  },

  async reportStats() {
    const result = await query('SELECT status, COUNT(*)::int AS count FROM reports GROUP BY status');
    return Object.fromEntries(result.rows.map((row) => [row.status, Number(row.count)]));
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
    const result = await query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  },

  async createSellerReview({ authorId, sellerId, listingId, rating, text }) {
    const result = await query(
      `INSERT INTO seller_reviews (author_id, seller_id, listing_id, rating, text)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [authorId, sellerId, listingId || null, rating, text || null]
    );
    return result.rows[0];
  },

  async findSellerReviewByAuthor({ authorId, sellerId, listingId }) {
    const result = await query(
      `SELECT * FROM seller_reviews
       WHERE author_id = $1 AND seller_id = $2 AND ($3::int IS NULL OR listing_id = $3::int)
       LIMIT 1`,
      [authorId, sellerId, listingId || null]
    );
    return result.rows[0] || null;
  },

  async findSellerReviews(sellerId, limit = 30) {
    const result = await query(
      `SELECT sr.*, u.name AS author_name, u.avatar_url AS author_avatar, l.title AS listing_title
       FROM seller_reviews sr
       JOIN users u ON u.id = sr.author_id
       LEFT JOIN listings l ON l.id = sr.listing_id
       WHERE sr.seller_id = $1
       ORDER BY sr.created_at DESC
       LIMIT $2`,
      [sellerId, limit]
    );
    return result.rows;
  },

  async sellerReviewStats(sellerId) {
    const result = await query(
      `SELECT COALESCE(AVG(rating), 0) AS avg, COUNT(*)::int AS count
       FROM seller_reviews WHERE seller_id = $1`,
      [sellerId]
    );
    const row = result.rows[0] || { avg: 0, count: 0 };
    return { avg: Number(row.avg), count: Number(row.count) };
  },

  async platformStats() {
    const [users, listings, reports, reviews, messages] = await Promise.all([
      query('SELECT COUNT(*)::int AS count FROM users'),
      query("SELECT COUNT(*)::int AS count, COUNT(*) FILTER (WHERE status = 'active')::int AS active FROM listings"),
      query("SELECT COUNT(*)::int AS count FROM reports WHERE status IN ('new', 'reviewing')"),
      query('SELECT COUNT(*)::int AS count FROM seller_reviews'),
      query('SELECT COUNT(*)::int AS count FROM messages')
    ]);
    return {
      users: Number(users.rows[0]?.count || 0),
      listings: Number(listings.rows[0]?.count || 0),
      activeListings: Number(listings.rows[0]?.active || 0),
      openReports: Number(reports.rows[0]?.count || 0),
      reviews: Number(reviews.rows[0]?.count || 0),
      messages: Number(messages.rows[0]?.count || 0)
    };
  }
};
