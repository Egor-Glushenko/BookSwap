import { query } from '../db/index.js';

const TONES = ['blue', 'orange', 'green', 'pink', 'yellow', 'violet'];

const SELECT_FIELDS = `
  l.*,
  u.name AS seller_name,
  u.rating AS seller_rating,
  u.deals AS seller_deals,
  u.avatar_url AS seller_avatar,
  u.created_at AS seller_created_at,
  COALESCE(AVG(br.value), 0) AS avg_rating,
  COUNT(br.id)::int AS rating_count
`;

const FROM = `
  FROM listings l
  JOIN users u ON u.id = l.seller_id
  LEFT JOIN book_ratings br ON br.listing_id = l.id
`;

const ORDER_BY = {
  new: 'l.created_at DESC',
  old: 'l.created_at ASC',
  price_asc: 'l.price ASC NULLS LAST',
  price_desc: 'l.price DESC NULLS LAST',
  rating: 'avg_rating DESC, rating_count DESC',
  popular: 'l.views DESC, l.created_at DESC'
};

const EDITABLE_COLUMNS = {
  type: 'type',
  title: 'title',
  author: 'author',
  genre: 'genre',
  publisher: 'publisher',
  year: 'year',
  isbn: 'isbn',
  condition: 'condition',
  description: 'description',
  price: 'price',
  exchangeWant: 'exchange_want',
  city: 'city',
  district: 'district',
  pickup: 'pickup',
  delivery: 'delivery',
  status: 'status',
  images: 'images',
  tone: 'tone'
};

function buildFilters(filters, startingIndex = 1) {
  const conditions = [];
  const values = [];
  let index = startingIndex;
  const add = (sql, value) => {
    conditions.push(sql.replaceAll('?', `$${index++}`));
    values.push(value);
  };

  conditions.push('l.seller_id NOT IN (SELECT id FROM users WHERE is_blocked = TRUE)');
  if (filters.status !== 'all') add('l.status = ?', filters.status || 'active');
  if (filters.type && filters.type !== 'all') add('l.type = ?', filters.type);
  if (filters.sellerId) add('l.seller_id = ?', filters.sellerId);
  if (filters.excludeId) add('l.id <> ?', filters.excludeId);

  if (filters.search) {
    const pattern = `%${String(filters.search).trim().toLowerCase()}%`;
    conditions.push(`(LOWER(l.title) LIKE $${index} OR LOWER(l.author) LIKE $${index} OR LOWER(COALESCE(l.genre, '')) LIKE $${index} OR LOWER(COALESCE(l.description, '')) LIKE $${index})`);
    values.push(pattern);
    index += 1;
  }
  if (filters.genre) add('l.genre = ?', filters.genre);
  if (filters.condition) add('l.condition = ?', filters.condition);
  if (filters.city) add('LOWER(l.city) = LOWER(?)', filters.city);
  if (filters.minPrice !== undefined && filters.minPrice !== null && filters.minPrice !== '') add('l.price >= ?', Number(filters.minPrice));
  if (filters.maxPrice !== undefined && filters.maxPrice !== null && filters.maxPrice !== '') add('l.price <= ?', Number(filters.maxPrice));

  return {
    where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    values,
    nextIndex: index
  };
}

export const listingRepository = {
  async findAll(filters = {}, { limit = 12, offset = 0 } = {}) {
    const built = buildFilters(filters);
    const values = [...built.values];
    let index = built.nextIndex;
    const orderBy = ORDER_BY[filters.sort] || ORDER_BY.new;

    const rowsResult = await query(
      `SELECT ${SELECT_FIELDS} ${FROM} ${built.where} GROUP BY l.id, u.id ORDER BY ${orderBy} LIMIT $${index++} OFFSET $${index}`,
      [...values, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS count FROM listings l ${built.where}`,
      built.values
    );

    return { rows: rowsResult.rows, total: Number(countResult.rows[0]?.count || 0) };
  },

  async findById(id) {
    const result = await query(
      `SELECT ${SELECT_FIELDS} ${FROM}
       WHERE l.id = $1 AND l.seller_id NOT IN (SELECT id FROM users WHERE is_blocked = TRUE)
       GROUP BY l.id, u.id`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findRawById(id) {
    const result = await query('SELECT * FROM listings WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findSimilar(listing, limit = 4) {
    const result = await query(
      `SELECT ${SELECT_FIELDS} ${FROM}
       WHERE l.status = 'active' AND l.id <> $1
         AND l.seller_id NOT IN (SELECT id FROM users WHERE is_blocked = TRUE)
         AND (l.genre = $2 OR LOWER(l.author) = LOWER($3))
       GROUP BY l.id, u.id
       ORDER BY (l.genre = $2) DESC, avg_rating DESC, l.created_at DESC
       LIMIT $4`,
      [listing.id, listing.genre || '', listing.author || '', limit]
    );
    return result.rows;
  },

  async create(data) {
    const tone = data.tone || TONES[Math.floor(Math.random() * TONES.length)];
    const result = await query(
      `INSERT INTO listings
         (seller_id, type, title, author, genre, publisher, year, isbn, condition,
          description, price, exchange_want, city, district, pickup, delivery, status, tone, images)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       RETURNING *`,
      [
        data.sellerId, data.type, data.title, data.author, data.genre || null,
        data.publisher || null, data.year || null, data.isbn || null, data.condition,
        data.description || null, data.price ?? null, data.exchangeWant || null,
        data.city, data.district || null, data.pickup ?? true, data.delivery ?? false,
        data.status || 'active', tone, data.images || []
      ]
    );
    return result.rows[0];
  },

  async update(id, patch) {
    const assignments = [];
    const values = [];
    let index = 1;
    for (const [key, column] of Object.entries(EDITABLE_COLUMNS)) {
      if (!(key in patch) || patch[key] === undefined) continue;
      assignments.push(`${column} = $${index++}`);
      values.push(patch[key]);
    }
    if (!assignments.length) return this.findRawById(id);
    assignments.push('updated_at = NOW()');
    values.push(id);
    const result = await query(
      `UPDATE listings SET ${assignments.join(', ')} WHERE id = $${index} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async setStatus(id, status) {
    const result = await query(
      `UPDATE listings SET status = $2, updated_at = NOW(),
          sold_at = CASE WHEN $2 = 'sold' THEN NOW() ELSE NULL END
       WHERE id = $1 RETURNING *`,
      [id, status]
    );
    return result.rows[0] || null;
  },

  async incrementViews(id) {
    await query('UPDATE listings SET views = views + 1 WHERE id = $1', [id]);
  },

  async findBest({ genre, period = 'all', limit = 10 } = {}) {
    const conditions = [
      "l.status = 'active'",
      'l.seller_id NOT IN (SELECT id FROM users WHERE is_blocked = TRUE)'
    ];
    const values = [];
    let index = 1;

    if (genre) {
      conditions.push(`l.genre = $${index++}`);
      values.push(genre);
    }
    if (period === 'month' || period === 'year') {
      const interval = period === 'month' ? '30 days' : '365 days';
      conditions.push(`l.created_at >= NOW() - INTERVAL '${interval}'`);
    }
    values.push(limit);

    const result = await query(
      `SELECT l.title, l.author, l.genre, l.tone,
              COALESCE(AVG(br.value), 0) AS avg_rating,
              COUNT(br.id)::int AS rating_count,
              MIN(l.id) AS listing_id
       FROM listings l
       LEFT JOIN book_ratings br ON br.listing_id = l.id
       WHERE ${conditions.join(' AND ')}
       GROUP BY l.title, l.author, l.genre, l.tone
       HAVING COUNT(br.id) >= 1
       ORDER BY avg_rating DESC, rating_count DESC
       LIMIT $${index}`,
      values
    );
    return result.rows;
  },

  async facets() {
    const visible = "seller_id NOT IN (SELECT id FROM users WHERE is_blocked = TRUE)";
    const [types, genres, cities, conditions, bounds] = await Promise.all([
      query(`SELECT type, COUNT(*)::int AS count FROM listings WHERE status = 'active' AND ${visible} GROUP BY type`),
      query(`SELECT genre, COUNT(*)::int AS count FROM listings WHERE status = 'active' AND ${visible} AND genre IS NOT NULL AND genre <> '' GROUP BY genre ORDER BY count DESC, genre ASC LIMIT 20`),
      query(`SELECT city, COUNT(*)::int AS count FROM listings WHERE status = 'active' AND ${visible} GROUP BY city ORDER BY count DESC, city ASC LIMIT 20`),
      query(`SELECT condition, COUNT(*)::int AS count FROM listings WHERE status = 'active' AND ${visible} GROUP BY condition ORDER BY count DESC`),
      query(`SELECT MIN(price) AS min, MAX(price) AS max, COUNT(*)::int AS total FROM listings WHERE status = 'active' AND ${visible}`)
    ]);

    return {
      types: Object.fromEntries(types.rows.map((row) => [row.type, Number(row.count)])),
      genres: genres.rows.map((row) => ({ name: row.genre, count: Number(row.count) })),
      cities: cities.rows.map((row) => ({ name: row.city, count: Number(row.count) })),
      conditions: conditions.rows.map((row) => ({ name: row.condition, count: Number(row.count) })),
      priceMin: bounds.rows[0]?.min === null ? 0 : Number(bounds.rows[0]?.min || 0),
      priceMax: Math.ceil(Number(bounds.rows[0]?.max || 0)),
      total: Number(bounds.rows[0]?.total || 0)
    };
  },

  async countByStatus(status) {
    const result = await query('SELECT COUNT(*)::int AS count FROM listings WHERE ($1 = \'all\' OR status = $1)', [status]);
    return Number(result.rows[0]?.count || 0);
  }
};
