-- Function to count reviews without sentiment analysis for a company
CREATE OR REPLACE FUNCTION get_unprocessed_reviews_count(company_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(r.id)::INTEGER
  FROM reviews r
  INNER JOIN platform_connections pc ON r.platform_connection_id = pc.id
  INNER JOIN locations l ON pc.location_id = l.id
  LEFT JOIN sentiment_analysis sa ON r.id = sa.review_id
  WHERE l.company_id = company_uuid
  AND sa.review_id IS NULL;
$$ LANGUAGE SQL STABLE;

-- Function to get reviews without sentiment analysis for a company
CREATE OR REPLACE FUNCTION get_unprocessed_reviews(company_uuid UUID)
RETURNS TABLE(
  id UUID,
  content TEXT,
  rating NUMERIC,
  platform_connection_id UUID
) AS $$
  SELECT r.id, r.content, r.rating, r.platform_connection_id
  FROM reviews r
  INNER JOIN platform_connections pc ON r.platform_connection_id = pc.id
  INNER JOIN locations l ON pc.location_id = l.id
  LEFT JOIN sentiment_analysis sa ON r.id = sa.review_id
  WHERE l.company_id = company_uuid
  AND sa.review_id IS NULL
  ORDER BY r.published_at DESC
  LIMIT 100;
$$ LANGUAGE SQL STABLE;

-- Add comments
COMMENT ON FUNCTION get_unprocessed_reviews_count IS 'Returns the count of reviews without sentiment analysis for a given company';
COMMENT ON FUNCTION get_unprocessed_reviews IS 'Returns up to 100 reviews without sentiment analysis for a given company (batch processing)';

