-- Create database functions for checking plan limits and features

-- Function to get user's plan ID
CREATE OR REPLACE FUNCTION get_user_plan_id(user_id UUID)
RETURNS UUID AS $$
DECLARE
  plan_id UUID;
BEGIN
  SELECT subscription_plan_id INTO plan_id
  FROM profiles
  WHERE id = user_id;
  
  -- Default to free plan if no plan assigned
  IF plan_id IS NULL THEN
    SELECT id INTO plan_id FROM subscription_plans WHERE name = 'free';
  END IF;
  
  RETURN plan_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_plan_id(UUID) IS 'Returns the subscription plan ID for a given user, defaults to free plan';

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = user_id;
  
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_admin(UUID) IS 'Returns true if the user has admin role';

-- Function to check if user's plan has a specific feature
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

COMMENT ON FUNCTION has_feature(UUID, TEXT) IS 'Returns true if the user plan has the specified feature';

-- Function to get plan limit value for a specific limit type
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

COMMENT ON FUNCTION get_plan_limit(UUID, TEXT) IS 'Returns the limit value for a specific limit type, or NULL if unlimited';

-- Function to check if user can create another company
CREATE OR REPLACE FUNCTION check_company_limit(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  max_companies INTEGER;
  current_count INTEGER;
BEGIN
  -- Admins have no limits
  IF is_admin(user_id) THEN
    RETURN true;
  END IF;
  
  -- Get max companies limit
  max_companies := get_plan_limit(user_id, 'max_companies');
  
  -- If NULL or unlimited, allow
  IF max_companies IS NULL THEN
    RETURN true;
  END IF;
  
  -- Count current companies
  SELECT COUNT(*) INTO current_count
  FROM companies
  WHERE owner_id = user_id;
  
  -- Check if under limit
  RETURN current_count < max_companies;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_company_limit(UUID) IS 'Returns true if user can create another company based on plan limits';

-- Function to check if company can have another location
CREATE OR REPLACE FUNCTION check_location_limit(company_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  owner_user_id UUID;
  max_locations INTEGER;
  current_count INTEGER;
BEGIN
  -- Get company owner
  SELECT owner_id INTO owner_user_id
  FROM companies
  WHERE id = company_id;
  
  IF owner_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Admins have no limits
  IF is_admin(owner_user_id) THEN
    RETURN true;
  END IF;
  
  -- Get max locations per company limit
  max_locations := get_plan_limit(owner_user_id, 'max_locations_per_company');
  
  -- If NULL or unlimited, allow
  IF max_locations IS NULL THEN
    RETURN true;
  END IF;
  
  -- Count current locations for this company
  SELECT COUNT(*) INTO current_count
  FROM locations
  WHERE company_id = check_location_limit.company_id AND is_active = true;
  
  -- Check if under limit
  RETURN current_count < max_locations;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_location_limit(UUID) IS 'Returns true if company can have another location based on plan limits';

