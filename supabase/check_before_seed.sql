-- Diagnostic script - Run this FIRST in Supabase SQL Editor
-- This will check if your database is ready for seeding

SELECT '=== CHECKING DATABASE READINESS FOR SEED DATA ===' as status;

-- 1. Check for users
SELECT 
  '1. USER CHECK' as step,
  COUNT(*) as user_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Users exist - seeding will work'
    ELSE '❌ NO USERS - Please sign up at /auth/signup first!'
  END as result
FROM auth.users;

-- 2. Check for existing companies
SELECT 
  '2. COMPANIES CHECK' as step,
  COUNT(*) as company_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '⚠️  Companies exist - seed migration may fail due to duplicates'
    ELSE '✅ No companies - ready for seeding'
  END as result
FROM companies;

-- 3. Check for existing reviews
SELECT 
  '3. REVIEWS CHECK' as step,
  COUNT(*) as review_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '⚠️  Reviews exist - seed migration may create duplicates'
    ELSE '✅ No reviews - ready for seeding'
  END as result
FROM reviews;

-- 4. Check for platforms (required for seeding)
SELECT 
  '4. PLATFORMS CHECK' as step,
  COUNT(*) as platform_count,
  string_agg(name, ', ') as available_platforms,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ Platforms exist - ready for seeding'
    ELSE '❌ Missing platforms - run migration 20250105000010 first'
  END as result
FROM platforms;

-- Summary
SELECT '=== SUMMARY ===' as status;

SELECT 
  CASE 
    WHEN 
      (SELECT COUNT(*) FROM auth.users) > 0 AND
      (SELECT COUNT(*) FROM platforms) >= 3 AND
      (SELECT COUNT(*) FROM companies) = 0
    THEN '✅ READY TO SEED - You can now run the seed migration!'
    WHEN (SELECT COUNT(*) FROM auth.users) = 0
    THEN '❌ SIGN UP REQUIRED - Please create a user at /auth/signup first'
    WHEN (SELECT COUNT(*) FROM platforms) < 3
    THEN '❌ PLATFORMS MISSING - Run: supabase db push (for migration 20250105000010)'
    WHEN (SELECT COUNT(*) FROM companies) > 0
    THEN '⚠️  DATA EXISTS - Seed migration may fail. Consider clearing existing data first.'
    ELSE '❓ UNKNOWN STATE - Check errors above'
  END as recommendation;
