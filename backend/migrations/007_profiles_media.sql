-- Profiles, media, lifecycle statuses and the indexes the marketplace queries need.

ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE listings ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE listings ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ;

-- A listing can leave the feed as sold/exchanged, not only be archived.
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_status_check;
ALTER TABLE listings ADD CONSTRAINT listings_status_check
  CHECK (status IN ('active', 'moderation', 'archived', 'sold'));

CREATE INDEX IF NOT EXISTS listings_genre_idx ON listings (genre);
CREATE INDEX IF NOT EXISTS listings_condition_idx ON listings (condition);
CREATE INDEX IF NOT EXISTS listings_city_lower_idx ON listings (LOWER(city));
CREATE INDEX IF NOT EXISTS listings_views_idx ON listings (views DESC);
CREATE INDEX IF NOT EXISTS listings_status_created_idx ON listings (status, created_at DESC);
CREATE INDEX IF NOT EXISTS book_ratings_user_idx ON book_ratings (user_id);
CREATE INDEX IF NOT EXISTS chats_buyer_idx ON chats (buyer_id);
CREATE INDEX IF NOT EXISTS chats_seller_idx ON chats (seller_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS seller_reviews_seller_idx ON seller_reviews (seller_id, created_at DESC);

-- Default catalogue filters. They are editable from the moderation panel.
INSERT INTO categories (name) VALUES
  ('Фантастика и фэнтези'),
  ('Бизнес и экономика'),
  ('Классика'),
  ('Научпоп'),
  ('Современная проза'),
  ('Детские книги'),
  ('Учебная литература'),
  ('Поэзия'),
  ('Биографии и мемуары'),
  ('Искусство и дизайн')
ON CONFLICT (name) DO NOTHING;
