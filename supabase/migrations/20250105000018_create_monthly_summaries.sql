-- Create monthly summaries table for paid users

CREATE TABLE IF NOT EXISTS monthly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Format: "2025-01"
  total_reviews INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),
  sentiment_breakdown JSONB,
  top_keywords JSONB,
  top_topics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, month_year)
);

COMMENT ON TABLE monthly_summaries IS 'Monthly aggregated review summaries for paid users';
COMMENT ON COLUMN monthly_summaries.month_year IS 'Format: YYYY-MM';
COMMENT ON COLUMN monthly_summaries.sentiment_breakdown IS 'JSON with positive, neutral, negative counts';
COMMENT ON COLUMN monthly_summaries.top_keywords IS 'JSON array of top keywords';
COMMENT ON COLUMN monthly_summaries.top_topics IS 'JSON array of top topics';

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_monthly_summaries_company_id ON monthly_summaries(company_id);
CREATE INDEX IF NOT EXISTS idx_monthly_summaries_month_year ON monthly_summaries(month_year);

