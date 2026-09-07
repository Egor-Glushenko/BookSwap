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
  }
};
