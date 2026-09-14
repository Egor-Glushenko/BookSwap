import { query } from '../db/pool.js';

export const userRepository = {
  async findByEmail(email) {
    const result = await query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email.toLowerCase()]);
    return result.rows[0] || null;
  },
  async findById(id) {
    const result = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] || null;
  },
  async create(user) {
    const result = await query(
      `INSERT INTO users (id, email, password_hash, name, city, role, rating, deals, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [user.id, user.email, user.passwordHash, user.name, user.city, user.role, user.rating, user.deals, user.createdAt]
    );
    return result.rows[0];
  },
  async findAll() {
    const result = await query('SELECT * FROM users ORDER BY created_at DESC');
    return result.rows;
  },
  async setBlocked(id, isBlocked) {
    const result = await query('UPDATE users SET is_blocked = $2 WHERE id = $1 RETURNING *', [id, isBlocked]);
    return result.rows[0] || null;
  },
  async setRole(id, role) {
    const result = await query('UPDATE users SET role = $2 WHERE id = $1 RETURNING *', [id, role]);
    return result.rows[0] || null;
  },
  async upsertServiceAccount(user) {
    const result = await query(
      `INSERT INTO users (id, email, password_hash, name, city, role, rating, deals, created_at, is_blocked)
       VALUES ($1, $2, $3, $4, $5, $6, 0, 0, NOW(), FALSE)
       ON CONFLICT (email)
       DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name, is_blocked = FALSE
       RETURNING *`,
      [user.id, user.email, user.passwordHash, user.name, user.city, user.role]
    );
    return result.rows[0];
  }
};
