-- Migrate existing users to have access to the 5 current platforms
-- Assign: facebook, google, yelp, tripadvisor, opentable

DO $$
DECLARE
  facebook_platform_id UUID;
  google_platform_id UUID;
  yelp_platform_id UUID;
  tripadvisor_platform_id UUID;
  opentable_platform_id UUID;
  user_record RECORD;
BEGIN
  -- Get platform IDs from supported_platforms table
  SELECT id INTO facebook_platform_id FROM supported_platforms WHERE name = 'facebook';
  SELECT id INTO google_platform_id FROM supported_platforms WHERE name = 'google';
  SELECT id INTO yelp_platform_id FROM supported_platforms WHERE name = 'yelp';
  SELECT id INTO tripadvisor_platform_id FROM supported_platforms WHERE name = 'tripadvisor';
  SELECT id INTO opentable_platform_id FROM supported_platforms WHERE name = 'opentable';
  
  -- Only proceed if all platforms exist
  IF facebook_platform_id IS NOT NULL AND 
     google_platform_id IS NOT NULL AND 
     yelp_platform_id IS NOT NULL AND 
     tripadvisor_platform_id IS NOT NULL AND 
     opentable_platform_id IS NOT NULL THEN
    
    -- Loop through all existing users
    FOR user_record IN SELECT id FROM profiles LOOP
      -- Insert the 5 platforms for each user (ignore duplicates)
      INSERT INTO user_platforms (user_id, platform_id)
      VALUES
        (user_record.id, facebook_platform_id),
        (user_record.id, google_platform_id),
        (user_record.id, yelp_platform_id),
        (user_record.id, tripadvisor_platform_id),
        (user_record.id, opentable_platform_id)
      ON CONFLICT (user_id, platform_id) DO NOTHING;
    END LOOP;
  END IF;
END $$;










