-- Manual Seed Data Script
-- Run this directly in Supabase SQL Editor to see error messages
-- This will create sample data for testing

-- First, check if we have any users
DO $$
DECLARE
  user_count INT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  IF user_count = 0 THEN
    RAISE EXCEPTION 'No users found! Please sign up at least one user first at /auth/signup';
  ELSE
    RAISE NOTICE 'Found % user(s) in the database', user_count;
  END IF;
END $$;

-- Now run the seed data (copy the content from the migration file)
-- This is a simplified version that's easier to debug

SELECT 'Starting seed process...' as status;

-- You can now copy and run the content of 20250105000014_seed_sample_data.sql
-- Or use the Supabase dashboard to run it

SELECT 
  COUNT(*) as total_users,
  (SELECT COUNT(*) FROM companies) as total_companies,
  (SELECT COUNT(*) FROM reviews) as total_reviews
FROM auth.users;
