import { query } from '../db/index.js';

const baseFields = `id, email, password_hash, name, city, role, rating, deals, bio, avatar_url, is_blocked, created_at`;

export const userRepository = {
  async findByEmail(email) {
    const result = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [email]);
    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] || null;
  },

  async findPublicById(id) {
    const result = await query(
      `SELECT ${baseFields} FROM users WHERE id = $1 LIMIT 1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async create(user) {
    const result = await query(
      `INSERT INTO users (id, email, password_hash, name, city, role, rating, deals, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, NOW()))
       RETURNING *`,
      [user.id, user.email, user.passwordHash, user.name, user.city, user.role, user.rating ?? 0, user.deals ?? 0, user.createdAt || null]
    );
    return result.rows[0];
  },

  async findAll() {
    const result = await query(`SELECT ${baseFields} FROM users ORDER BY created_at DESC`);
    return result.rows;
  },

  async countAll() {
    const result = await query('SELECT COUNT(*)::int AS count FROM users');
    return Number(result.rows[0]?.count || 0);
  },

  async updateProfile(id, { name, city, bio, avatarUrl }) {
    const result = await query(
      `UPDATE users SET
         name = COALESCE($2, name),
         city = COALESCE($3, city),
         bio = COALESCE($4, bio),
         avatar_url = COALESCE($5, avatar_url),
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, name ?? null, city ?? null, bio ?? null, avatarUrl ?? null]
    );
    return result.rows[0] || null;
  },

  async setBlocked(id, isBlocked) {
    const result = await query('UPDATE users SET is_blocked = $2, updated_at = NOW() WHERE id = $1 RETURNING *', [id, isBlocked]);
    return result.rows[0] || null;
  },

  async setRole(id, role) {
    const result = await query('UPDATE users SET role = $2, updated_at = NOW() WHERE id = $1 RETURNING *', [id, role]);
    return result.rows[0] || null;
  },

  /** Keeps users.rating in sync with the seller reviews table. */
  async recomputeRating(id) {
    await query(
      `UPDATE users SET rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM seller_reviews WHERE seller_id = $1), 0)
       WHERE id = $1`,
      [id]
    );
  },

  async incrementDeals(id) {
    await query('UPDATE users SET deals = deals + 1 WHERE id = $1', [id]);
  },

  async upsertServiceAccount(user) {
    const result = await query(
      `INSERT INTO users (id, email, password_hash, name, city, role, rating, deals, created_at, is_blocked)
       VALUES ($1, $2, $3, $4, $5, $6, 0, 0, NOW(), FALSE)
       ON CONFLICT (email)
       DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name, is_blocked = FALSE, updated_at = NOW()
       RETURNING *`,
      [user.id, user.email, user.passwordHash, user.name, user.city, user.role]
    );
    return result.rows[0];
  }
};
