CREATE TABLE IF NOT EXISTS book_ratings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  value NUMERIC(2, 1) NOT NULL CHECK (value >= 1 AND value <= 5),
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS book_ratings_listing_idx ON book_ratings (listing_id);
