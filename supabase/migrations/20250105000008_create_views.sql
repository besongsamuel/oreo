-- Useful views for dashboard and analytics

-- Company statistics view
CREATE OR REPLACE VIEW company_stats AS
SELECT 
  c.id as company_id,
  c.name as company_name,
  c.owner_id,
  COUNT(DISTINCT l.id) as total_locations,
  COUNT(DISTINCT pc.id) as total_platform_connections,
  COUNT(DISTINCT r.id) as total_reviews,
  ROUND(AVG(r.rating), 2) as average_rating,
  COUNT(CASE WHEN sa.sentiment = 'positive' THEN 1 END) as positive_reviews,
  COUNT(CASE WHEN sa.sentiment = 'negative' THEN 1 END) as negative_reviews,
  COUNT(CASE WHEN sa.sentiment = 'neutral' THEN 1 END) as neutral_reviews,
  MAX(r.published_at) as latest_review_date,
  MIN(r.published_at) as earliest_review_date
FROM companies c
LEFT JOIN locations l ON l.company_id = c.id
LEFT JOIN platform_connections pc ON pc.location_id = l.id
LEFT JOIN reviews r ON r.platform_connection_id = pc.id
LEFT JOIN sentiment_analysis sa ON sa.review_id = r.id
GROUP BY c.id, c.name, c.owner_id;

COMMENT ON VIEW company_stats IS 'Aggregated statistics for each company';

-- Location statistics view
CREATE OR REPLACE VIEW location_stats AS
SELECT 
  l.id as location_id,
  l.name as location_name,
  l.company_id,
  l.city,
  l.country,
  COUNT(DISTINCT pc.id) as platform_count,
  COUNT(DISTINCT r.id) as total_reviews,
  ROUND(AVG(r.rating), 2) as average_rating,
  COUNT(CASE WHEN sa.sentiment = 'positive' THEN 1 END) as positive_reviews,
  COUNT(CASE WHEN sa.sentiment = 'negative' THEN 1 END) as negative_reviews,
  COUNT(CASE WHEN sa.sentiment = 'neutral' THEN 1 END) as neutral_reviews,
  MAX(r.published_at) as latest_review_date,
  MAX(pc.last_sync_at) as last_sync_date
FROM locations l
LEFT JOIN platform_connections pc ON pc.location_id = l.id
LEFT JOIN reviews r ON r.platform_connection_id = pc.id
LEFT JOIN sentiment_analysis sa ON sa.review_id = r.id
WHERE l.is_active = true
GROUP BY l.id, l.name, l.company_id, l.city, l.country;

COMMENT ON VIEW location_stats IS 'Aggregated statistics for each location';

-- Platform performance view
CREATE OR REPLACE VIEW platform_performance AS
SELECT 
  p.id as platform_id,
  p.display_name as platform_name,
  c.id as company_id,
  c.name as company_name,
  COUNT(DISTINCT r.id) as total_reviews,
  ROUND(AVG(r.rating), 2) as average_rating,
  COUNT(CASE WHEN sa.sentiment = 'positive' THEN 1 END) as positive_count,
  COUNT(CASE WHEN sa.sentiment = 'negative' THEN 1 END) as negative_count,
  MAX(r.published_at) as latest_review_date
FROM platforms p
JOIN platform_connections pc ON pc.platform_id = p.id
JOIN locations l ON l.id = pc.location_id
JOIN companies c ON c.id = l.company_id
LEFT JOIN reviews r ON r.platform_connection_id = pc.id
LEFT JOIN sentiment_analysis sa ON sa.review_id = r.id
GROUP BY p.id, p.display_name, c.id, c.name;

COMMENT ON VIEW platform_performance IS 'Review statistics by platform and company';

-- Recent reviews view
CREATE OR REPLACE VIEW recent_reviews AS
SELECT 
  r.id,
  r.rating,
  r.title,
  r.content,
  r.author_name,
  r.published_at,
  r.language,
  sa.sentiment,
  sa.sentiment_score,
  l.name as location_name,
  l.city,
  c.name as company_name,
  c.id as company_id,
  c.owner_id,
  p.display_name as platform_name
FROM reviews r
JOIN platform_connections pc ON pc.id = r.platform_connection_id
JOIN platforms p ON p.id = pc.platform_id
JOIN locations l ON l.id = pc.location_id
JOIN companies c ON c.id = l.company_id
LEFT JOIN sentiment_analysis sa ON sa.review_id = r.id
ORDER BY r.published_at DESC;

COMMENT ON VIEW recent_reviews IS 'All reviews with related information for easy querying';

-- Top keywords view
CREATE OR REPLACE VIEW top_keywords AS
SELECT 
  k.id as keyword_id,
  k.text as keyword_text,
  k.category,
  c.id as company_id,
  c.name as company_name,
  COUNT(rk.id) as occurrence_count,
  ROUND(AVG(rk.relevance_score), 4) as avg_relevance
FROM keywords k
JOIN review_keywords rk ON rk.keyword_id = k.id
JOIN reviews r ON r.id = rk.review_id
JOIN platform_connections pc ON pc.id = r.platform_connection_id
JOIN locations l ON l.id = pc.location_id
JOIN companies c ON c.id = l.company_id
GROUP BY k.id, k.text, k.category, c.id, c.name
ORDER BY occurrence_count DESC;

COMMENT ON VIEW top_keywords IS 'Most frequent keywords by company';
