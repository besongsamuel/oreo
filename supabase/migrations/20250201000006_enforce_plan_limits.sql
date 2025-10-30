-- Create triggers to enforce company and location limits

-- Function to check company limit before insert
CREATE OR REPLACE FUNCTION check_company_limit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user can create another company
  IF NOT check_company_limit(NEW.owner_id) THEN
    RAISE EXCEPTION 'Company limit reached. Please upgrade your plan to add more companies.'
      USING ERRCODE = 'P0001';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_company_limit_trigger() IS 'Trigger function to enforce company creation limits';

-- Function to check location limit before insert
CREATE OR REPLACE FUNCTION check_location_limit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if company can have another location
  IF NOT check_location_limit(NEW.company_id) THEN
    RAISE EXCEPTION 'Location limit reached for this company. Please upgrade your plan to add more locations.'
      USING ERRCODE = 'P0001';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_location_limit_trigger() IS 'Trigger function to enforce location creation limits';

-- Create trigger on companies table
DROP TRIGGER IF EXISTS enforce_company_limit ON companies;
CREATE TRIGGER enforce_company_limit
  BEFORE INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION check_company_limit_trigger();

-- Create trigger on locations table
DROP TRIGGER IF EXISTS enforce_location_limit ON locations;
CREATE TRIGGER enforce_location_limit
  BEFORE INSERT ON locations
  FOR EACH ROW
  EXECUTE FUNCTION check_location_limit_trigger();

COMMENT ON TRIGGER enforce_company_limit ON companies IS 'Enforces company creation limits based on subscription plan';
COMMENT ON TRIGGER enforce_location_limit ON locations IS 'Enforces location creation limits based on subscription plan';

