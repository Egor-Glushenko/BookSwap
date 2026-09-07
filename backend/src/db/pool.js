import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export const query = (text, values) => pool.query(text, values);
