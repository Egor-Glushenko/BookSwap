CREATE TABLE IF NOT EXISTS listings (
  id SERIAL PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('Продажа', 'Обмен', 'Бесплатно')),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  genre TEXT,
  publisher TEXT,
  year INTEGER,
  isbn TEXT,
  condition TEXT NOT NULL DEFAULT 'Хорошее',
  description TEXT,
  price NUMERIC(10, 2),
  exchange_want TEXT,
  city TEXT NOT NULL,
  district TEXT,
  pickup BOOLEAN NOT NULL DEFAULT TRUE,
  delivery BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'moderation', 'archived')),
  views INTEGER NOT NULL DEFAULT 0,
  tone TEXT NOT NULL DEFAULT 'blue',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS listings_type_idx ON listings (type);
CREATE INDEX IF NOT EXISTS listings_status_idx ON listings (status);
CREATE INDEX IF NOT EXISTS listings_seller_idx ON listings (seller_id);
CREATE INDEX IF NOT EXISTS listings_created_idx ON listings (created_at DESC);
