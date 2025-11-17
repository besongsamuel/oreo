-- Populate platform_location_id for existing sentiment_analysis records
-- and set the column to NOT NULL

-- Update existing records by joining through reviews -> platform_connections
UPDATE sentiment_analysis sa
SET platform_location_id = pc.platform_location_id
FROM reviews r
JOIN platform_connections pc ON r.platform_connection_id = pc.id
WHERE sa.review_id = r.id
  AND sa.platform_location_id IS NULL;

-- Set column to NOT NULL after population
ALTER TABLE sentiment_analysis
ALTER COLUMN platform_location_id SET NOT NULL;

