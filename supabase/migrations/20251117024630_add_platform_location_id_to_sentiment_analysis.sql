-- Add platform_location_id column to sentiment_analysis table
-- This allows direct querying by platform location instead of going through review_id

ALTER TABLE sentiment_analysis
ADD COLUMN platform_location_id TEXT;

COMMENT ON COLUMN sentiment_analysis.platform_location_id IS 'Platform-specific location identifier from platform_connections table. Enables direct querying without joining through reviews.';

-- Create index for query performance
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_platform_location_id 
ON sentiment_analysis(platform_location_id);

