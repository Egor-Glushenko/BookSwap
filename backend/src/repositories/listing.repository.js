import { query } from '../db/pool.js';

const TONES = ['blue', 'orange', 'green', 'pink', 'yellow', 'violet'];

export const listingRepository = {
  async findAll({ type, query: search, sort, sellerId, status = 'active', genre, condition, city, minPrice, maxPrice } = {}) {
    const conditions = ['l.status = $1'];
    const values = [status];
    let idx = 2;

    if (type && type !== 'Все') {
      conditions.push(`l.type = $${idx++}`);
      values.push(type);
    }
    if (search) {
      conditions.push(`(LOWER(l.title) LIKE $${idx} OR LOWER(l.author) LIKE $${idx} OR LOWER(l.genre) LIKE $${idx})`);
      values.push(`%${search.toLowerCase()}%`);
      idx++;
    }
    if (sellerId) {
      conditions.push(`l.seller_id = $${idx++}`);
      values.push(sellerId);
    }
    if (genre && genre !== 'Все жанры') {
      conditions.push(`l.genre = $${idx++}`);
      values.push(genre);
    }
    if (condition && condition !== 'Любое состояние') {
      conditions.push(`l.condition = $${idx++}`);
      values.push(condition);
    }
    if (city) {
      conditions.push(`LOWER(l.city) = LOWER($${idx++})`);
      values.push(city);
    }
    if (minPrice) {
      conditions.push(`l.price >= $${idx++}`);
      values.push(Number(minPrice));
    }
    if (maxPrice) {
      conditions.push(`l.price <= $${idx++}`);
      values.push(Number(maxPrice));
    }

    let orderBy = 'l.created_at DESC';
    if (sort === 'По цене') orderBy = 'l.price ASC NULLS LAST';
    else if (sort === 'По рейтингу') orderBy = 'avg_rating DESC NULLS LAST';

    const result = await query(
      `SELECT l.*,
              u.name AS seller_name, u.rating AS seller_rating, u.deals AS seller_deals,
              COALESCE(AVG(br.value), 0) AS avg_rating,
              COUNT(br.id)::int AS rating_count
       FROM listings l
       JOIN users u ON u.id = l.seller_id
       LEFT JOIN book_ratings br ON br.listing_id = l.id
       WHERE ${conditions.join(' AND ')}
       GROUP BY l.id, u.id
       ORDER BY ${orderBy}`,
      values
    );
    return result.rows;
  },

  async findById(id) {
    const result = await query(
      `SELECT l.*,
              u.name AS seller_name, u.rating AS seller_rating, u.deals AS seller_deals,
              COALESCE(AVG(br.value), 0) AS avg_rating,
              COUNT(br.id)::int AS rating_count
       FROM listings l
       JOIN users u ON u.id = l.seller_id
       LEFT JOIN book_ratings br ON br.listing_id = l.id
       WHERE l.id = $1
       GROUP BY l.id, u.id`,
      [id]
    );
    return result.rows[0] || null;
  },

  async create(data) {
    const tone = TONES[Math.floor(Math.random() * TONES.length)];
    const result = await query(
      `INSERT INTO listings
         (seller_id, type, title, author, genre, publisher, year, isbn, condition,
          description, price, exchange_want, city, district, pickup, delivery, status, tone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING *`,
      [
        data.sellerId, data.type, data.title, data.author, data.genre || null,
        data.publisher || null, data.year || null, data.isbn || null, data.condition,
        data.description || null, data.price ?? null, data.exchangeWant || null,
        data.city, data.district || null, data.pickup ?? true, data.delivery ?? false,
        data.status || 'active', tone
      ]
    );
    return result.rows[0];
  },

  async incrementViews(id) {
    await query('UPDATE listings SET views = views + 1 WHERE id = $1', [id]);
  },

  async remove(id) {
    const result = await query("UPDATE listings SET status = 'archived' WHERE id = $1 RETURNING *", [id]);
    return result.rows[0] || null;
  },

  async findBest({ genre, minRatings = 1, limit = 100 } = {}) {
    const conditions = ['l.status = $1'];
    const values = ['active'];
    let idx = 2;

    if (genre && genre !== 'Все жанры') {
      conditions.push(`l.genre = $${idx++}`);
      values.push(genre);
    }

    values.push(minRatings, limit);

    const result = await query(
      `SELECT l.title, l.author, l.genre, l.tone,
              COALESCE(AVG(br.value), 0) AS avg_rating,
              COUNT(br.id)::int AS rating_count,
              MIN(l.id) AS listing_id
       FROM listings l
       LEFT JOIN book_ratings br ON br.listing_id = l.id
       WHERE ${conditions.join(' AND ')}
       GROUP BY l.title, l.author, l.genre, l.tone
       HAVING COUNT(br.id) >= $${idx++}
       ORDER BY avg_rating DESC, rating_count DESC
       LIMIT $${idx}`,
      values
    );
    return result.rows;
  }
};
