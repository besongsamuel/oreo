-- Tables for AI analysis: sentiment, keywords, topics

-- Sentiment analysis
CREATE TABLE IF NOT EXISTS sentiment_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID UNIQUE NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
  sentiment_score DECIMAL(5, 4) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
  confidence DECIMAL(5, 4) CHECK (confidence >= 0 AND confidence <= 1),
  emotions JSONB DEFAULT '{}'::jsonb,
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE sentiment_analysis IS 'AI-generated sentiment analysis for reviews';
COMMENT ON COLUMN sentiment_analysis.sentiment_score IS 'Score from -1.0 (negative) to 1.0 (positive)';
COMMENT ON COLUMN sentiment_analysis.emotions IS 'Emotion scores: {"joy": 0.8, "anger": 0.1, etc.}';

-- Keywords
CREATE TABLE IF NOT EXISTS keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT UNIQUE NOT NULL,
  normalized_text TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  category TEXT CHECK (category IN ('service', 'food', 'ambiance', 'price', 'quality', 'cleanliness', 'staff', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE keywords IS 'Extracted keywords/phrases from reviews';

-- Review keywords (many-to-many)
CREATE TABLE IF NOT EXISTS review_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  frequency INTEGER DEFAULT 1,
  relevance_score DECIMAL(5, 4) CHECK (relevance_score >= 0 AND relevance_score <= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, keyword_id)
);

COMMENT ON TABLE review_keywords IS 'Many-to-many relationship between reviews and keywords';

-- Topics
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('satisfaction', 'dissatisfaction', 'neutral')),
  description TEXT,
  keywords TEXT[],
  occurrence_count INTEGER DEFAULT 0,
  sentiment_distribution JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE topics IS 'Recurring topics identified across reviews';
COMMENT ON COLUMN topics.sentiment_distribution IS 'Distribution: {"positive": 45, "negative": 30, "neutral": 25}';

-- Review topics (many-to-many)
CREATE TABLE IF NOT EXISTS review_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  relevance_score DECIMAL(5, 4) CHECK (relevance_score >= 0 AND relevance_score <= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, topic_id)
);

COMMENT ON TABLE review_topics IS 'Many-to-many relationship between reviews and topics';
