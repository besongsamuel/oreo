-- Tables for storing reviews collected from platforms

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_connection_id UUID NOT NULL REFERENCES platform_connections(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  author_name TEXT,
  author_avatar_url TEXT,
  rating DECIMAL(3, 2) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  title TEXT,
  content TEXT,
  language TEXT DEFAULT 'en',
  translated_content TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  reply_content TEXT,
  reply_at TIMESTAMPTZ,
  reviewer_gender TEXT CHECK (reviewer_gender IN ('male', 'female', 'other', 'unknown')),
  reviewer_age_range TEXT CHECK (reviewer_age_range IN ('18-24', '25-34', '35-44', '45-54', '55-64', '65+', 'unknown')),
  has_media BOOLEAN DEFAULT false,
  media_urls JSONB DEFAULT '[]'::jsonb,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform_connection_id, external_id)
);

COMMENT ON TABLE reviews IS 'Individual reviews collected from various platforms';
COMMENT ON COLUMN reviews.rating IS 'Rating from 0.00 to 5.00';
COMMENT ON COLUMN reviews.language IS 'ISO 639-1 language code';
COMMENT ON COLUMN reviews.translated_content IS 'AI-translated content if original is not in default language';
COMMENT ON COLUMN reviews.raw_data IS 'Original API response from platform';

-- Sync logs (track data collection operations)
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_connection_id UUID NOT NULL REFERENCES platform_connections(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  reviews_fetched INTEGER DEFAULT 0,
  reviews_new INTEGER DEFAULT 0,
  reviews_updated INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE sync_logs IS 'Audit trail for platform sync operations';
