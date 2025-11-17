-- Function to get average rating for a location
-- This calculates the average rating directly in the database, avoiding the 1000 review limit
CREATE OR REPLACE FUNCTION get_location_rating_stats(location_uuid UUID)
RETURNS TABLE(
  average_rating NUMERIC
) AS $$
  SELECT COALESCE(ROUND(AVG(r.rating), 2), 0) as average_rating
  FROM reviews r
  INNER JOIN platform_connections pc ON r.platform_connection_id = pc.id
  WHERE pc.location_id = location_uuid;
$$ LANGUAGE SQL STABLE;

-- Add comment
COMMENT ON FUNCTION get_location_rating_stats IS 'Returns the average rating for a given location, calculated directly in the database to handle locations with more than 1000 reviews. Returns 0 if no reviews exist.';

