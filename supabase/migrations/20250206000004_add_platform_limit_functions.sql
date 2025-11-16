-- Create database functions for checking platform limits

-- Function to get user's platform limit
CREATE OR REPLACE FUNCTION get_user_platform_limit(user_id UUID)
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
  
  -- Get the limit_value JSONB for max_platforms
  SELECT pf.limit_value->'max_platforms' INTO limit_json
  FROM plan_features pf
  JOIN features f ON pf.feature_id = f.id
  WHERE pf.plan_id = user_plan_id 
    AND f.code = 'max_platforms';
  
  -- Extract integer value from JSONB
  IF limit_json IS NOT NULL THEN
    limit_val := (limit_json)::TEXT::INTEGER;
  ELSE
    limit_val := 3; -- Default to free plan limit
  END IF;
  
  RETURN limit_val;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_platform_limit(UUID) IS 'Returns the maximum number of platforms a user can select based on their plan';

-- Function to check if user can add another platform
CREATE OR REPLACE FUNCTION check_platform_limit(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  max_platforms INTEGER;
  current_count INTEGER;
BEGIN
  -- Admins have no limits
  IF is_admin(user_id) THEN
    RETURN true;
  END IF;
  
  -- Get max platforms limit
  max_platforms := get_user_platform_limit(user_id);
  
  -- If NULL or unlimited, allow
  IF max_platforms IS NULL THEN
    RETURN true;
  END IF;
  
  -- Count current selected platforms
  SELECT COUNT(*) INTO current_count
  FROM user_platforms
  WHERE user_id = check_platform_limit.user_id;
  
  -- Check if under limit
  RETURN current_count < max_platforms;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_platform_limit(UUID) IS 'Returns true if user can add another platform based on plan limits';








