-- Verification script for seed data
-- Run this after executing the seed migration to verify everything worked correctly

-- =============================================================================
-- SEED DATA VERIFICATION REPORT
-- =============================================================================

\echo '\n=== SEED DATA VERIFICATION REPORT ==='
\echo '====================================\n'

-- Check if any users exist
\echo '\n1. USER CHECK'
\echo '-------------'
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Users found: ' || COUNT(*)::TEXT
    ELSE '❌ No users found - please sign up first!'
  END as user_status
FROM auth.users;

-- Check profiles
\echo '\n2. PROFILES'
\echo '-----------'
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN full_name IS NOT NULL THEN 1 END) as profiles_with_names
FROM profiles;

-- Check companies
\echo '\n3. COMPANIES'
\echo '------------'
SELECT 
  id,
  name,
  industry,
  (SELECT COUNT(*) FROM locations WHERE company_id = c.id) as location_count
FROM companies c
ORDER BY created_at DESC;

-- Check locations
\echo '\n4. LOCATIONS'
\echo '------------'
SELECT 
  l.name,
  l.city,
  c.name as company_name,
  (SELECT COUNT(*) FROM platform_connections WHERE location_id = l.id) as platform_count
FROM locations l
JOIN companies c ON c.id = l.company_id
ORDER BY c.name, l.name;

-- Check platform connections
\echo '\n5. PLATFORM CONNECTIONS'
\echo '----------------------'
SELECT 
  p.display_name as platform,
  l.name as location,
  pc.last_sync_at,
  (SELECT COUNT(*) FROM reviews WHERE platform_connection_id = pc.id) as review_count
FROM platform_connections pc
JOIN platforms p ON p.id = pc.platform_id
JOIN locations l ON l.id = pc.location_id
ORDER BY p.display_name, l.name;

-- Check reviews summary
\echo '\n6. REVIEWS SUMMARY'
\echo '------------------'
SELECT 
  COUNT(*) as total_reviews,
  ROUND(AVG(rating), 2) as avg_rating,
  MIN(rating) as min_rating,
  MAX(rating) as max_rating,
  COUNT(DISTINCT author_name) as unique_authors,
  MIN(published_at)::DATE as earliest_review,
  MAX(published_at)::DATE as latest_review
FROM reviews;

-- Check sentiment distribution
\echo '\n7. SENTIMENT ANALYSIS'
\echo '--------------------'
SELECT 
  sentiment,
  COUNT(*) as count,
  ROUND(AVG(sentiment_score), 3) as avg_score,
  ROUND(AVG(confidence), 3) as avg_confidence
FROM sentiment_analysis
GROUP BY sentiment
ORDER BY 
  CASE sentiment
    WHEN 'positive' THEN 1
    WHEN 'neutral' THEN 2
    WHEN 'negative' THEN 3
    ELSE 4
  END;

-- Check keywords
\echo '\n8. KEYWORDS'
\echo '-----------'
SELECT 
  category,
  COUNT(*) as keyword_count,
  COUNT(DISTINCT rk.review_id) as reviews_tagged
FROM keywords k
LEFT JOIN review_keywords rk ON rk.keyword_id = k.id
GROUP BY category
ORDER BY keyword_count DESC;

-- Check top keywords
\echo '\n9. TOP 10 KEYWORDS'
\echo '------------------'
SELECT 
  k.text as keyword,
  k.category,
  COUNT(rk.id) as mentions,
  ROUND(AVG(rk.relevance_score), 3) as avg_relevance
FROM keywords k
JOIN review_keywords rk ON rk.keyword_id = k.id
GROUP BY k.id, k.text, k.category
ORDER BY mentions DESC
LIMIT 10;

-- Check topics
\echo '\n10. TOPICS'
\echo '----------'
SELECT 
  t.name,
  t.category,
  t.occurrence_count,
  t.sentiment_distribution
FROM topics t
ORDER BY t.occurrence_count DESC;

-- Check company stats (from view)
\echo '\n11. COMPANY STATISTICS'
\echo '---------------------'
SELECT 
  company_name,
  total_locations,
  total_reviews,
  average_rating,
  positive_reviews,
  negative_reviews,
  neutral_reviews
FROM company_stats
ORDER BY total_reviews DESC;

-- Check sync logs
\echo '\n12. SYNC LOGS'
\echo '-------------'
SELECT 
  p.display_name as platform,
  sl.status,
  sl.reviews_fetched,
  sl.reviews_new,
  sl.completed_at::TIMESTAMP(0) as completed_at
FROM sync_logs sl
JOIN platform_connections pc ON pc.id = sl.platform_connection_id
JOIN platforms p ON p.id = pc.platform_id
ORDER BY sl.completed_at DESC;

-- Overall health check
\echo '\n13. OVERALL HEALTH CHECK'
\echo '-----------------------'
SELECT 
  'Companies' as entity,
  COUNT(*)::TEXT as count,
  CASE WHEN COUNT(*) >= 2 THEN '✅' ELSE '❌' END as status
FROM companies
UNION ALL
SELECT 
  'Locations',
  COUNT(*)::TEXT,
  CASE WHEN COUNT(*) >= 3 THEN '✅' ELSE '❌' END
FROM locations
UNION ALL
SELECT 
  'Platform Connections',
  COUNT(*)::TEXT,
  CASE WHEN COUNT(*) >= 4 THEN '✅' ELSE '❌' END
FROM platform_connections
UNION ALL
SELECT 
  'Reviews',
  COUNT(*)::TEXT,
  CASE WHEN COUNT(*) >= 10 THEN '✅' ELSE '❌' END
FROM reviews
UNION ALL
SELECT 
  'Sentiment Analyses',
  COUNT(*)::TEXT,
  CASE WHEN COUNT(*) >= 10 THEN '✅' ELSE '❌' END
FROM sentiment_analysis
UNION ALL
SELECT 
  'Keywords',
  COUNT(*)::TEXT,
  CASE WHEN COUNT(*) >= 10 THEN '✅' ELSE '❌' END
FROM keywords
UNION ALL
SELECT 
  'Topics',
  COUNT(*)::TEXT,
  CASE WHEN COUNT(*) >= 3 THEN '✅' ELSE '❌' END
FROM topics;

\echo '\n=== END OF VERIFICATION REPORT ===\n'

-- Return summary message
SELECT 
  CASE 
    WHEN 
      (SELECT COUNT(*) FROM companies) >= 2 AND
      (SELECT COUNT(*) FROM locations) >= 3 AND
      (SELECT COUNT(*) FROM reviews) >= 10 AND
      (SELECT COUNT(*) FROM sentiment_analysis) >= 10
    THEN '✅ ✅ ✅  SEED DATA VERIFIED SUCCESSFULLY!  ✅ ✅ ✅'
    ELSE '❌ SEED DATA INCOMPLETE - Check report above for details'
  END as verification_result;

\echo '\nTo view dashboard data, run:'
\echo '  SELECT * FROM company_stats;'
\echo '  SELECT * FROM recent_reviews LIMIT 10;'
\echo '  SELECT * FROM top_keywords LIMIT 10;'
\echo ''
