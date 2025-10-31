-- Fix ambiguous plan_id column references in functions

-- Fix has_feature function
CREATE OR REPLACE FUNCTION has_feature(user_id UUID, feature_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan_id UUID;
  feature_exists BOOLEAN;
BEGIN
  -- Admins have all features
  IF is_admin(user_id) THEN
    RETURN true;
  END IF;
  
  user_plan_id := get_user_plan_id(user_id);
  
  SELECT EXISTS(
    SELECT 1
    FROM plan_features pf
    JOIN features f ON pf.feature_id = f.id
    WHERE pf.plan_id = user_plan_id AND f.code = feature_code
  ) INTO feature_exists;
  
  RETURN feature_exists;
END;
$$ LANGUAGE plpgsql STABLE;

-- Fix get_plan_limit function
CREATE OR REPLACE FUNCTION get_plan_limit(user_id UUID, limit_type TEXT)
RETURNS INTEGER AS $$
DECLARE
  user_plan_id UUID;
  limit_val INTEGER;
  limit_json JSONB;
BEGIN
  -- Admins have no limits
  IF is_admin(user_id) THEN
    RETURN NULL; -- NULL means unlimited
  END IF;
  
  user_plan_id := get_user_plan_id(user_id);
  
  -- Get the limit_value JSONB for the limit type
  SELECT pf.limit_value->limit_type INTO limit_json
  FROM plan_features pf
  JOIN features f ON pf.feature_id = f.id
  WHERE pf.plan_id = user_plan_id 
    AND f.code IN ('max_companies', 'max_locations_per_company', 'max_reviews_per_sync');
  
  -- Extract integer value from JSONB
  IF limit_json IS NOT NULL THEN
    limit_val := (limit_json)::TEXT::INTEGER;
  ELSE
    -- Check if user has unlimited_reviews feature
    IF limit_type = 'max_reviews_per_sync' AND has_feature(user_id, 'unlimited_reviews') THEN
      RETURN NULL; -- Unlimited
    END IF;
    limit_val := NULL;
  END IF;
  
  RETURN limit_val;
END;
$$ LANGUAGE plpgsql STABLE;

