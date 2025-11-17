-- Comprehensive seed data for testing and demonstration
-- This migration creates sample data for companies, locations, reviews, and analysis

-- Note: This assumes you have at least one user in auth.users
-- The script will use the first available user as the owner
-- If no users exist, you'll need to sign up first

DO $$
DECLARE
  demo_user_id UUID;
  company1_id UUID;
  company2_id UUID;
  location1_id UUID;
  location2_id UUID;
  location3_id UUID;
  google_platform_id UUID;
  yelp_platform_id UUID;
  trustpilot_platform_id UUID;
  pc1_id UUID;
  pc2_id UUID;
  pc3_id UUID;
  review1_id UUID;
  review2_id UUID;
  review3_id UUID;
  review4_id UUID;
  review5_id UUID;
  review6_id UUID;
  review7_id UUID;
  review8_id UUID;
  review9_id UUID;
  review10_id UUID;
  keyword_food_id UUID;
  keyword_service_id UUID;
  keyword_ambiance_id UUID;
  keyword_price_id UUID;
  keyword_clean_id UUID;
  keyword_fast_id UUID;
  keyword_friendly_id UUID;
  keyword_delicious_id UUID;
  topic1_id UUID;
  topic2_id UUID;
  topic3_id UUID;
BEGIN
  -- Get the first user from auth.users (or create a demo profile if needed)
  SELECT id INTO demo_user_id FROM auth.users LIMIT 1;

  -- If no user exists, we'll skip seeding (user needs to sign up first)
  IF demo_user_id IS NULL THEN
    RAISE NOTICE 'No users found in auth.users. Please sign up first before running seed data.';
    RETURN;
  END IF;

  -- Ensure the user has a profile
  INSERT INTO profiles (id, email, full_name, company_name, role)
  SELECT 
    demo_user_id,
    au.email,
    'Demo User',
    'Demo Company',
    'admin'
  FROM auth.users au
  WHERE au.id = demo_user_id
  ON CONFLICT (id) DO UPDATE 
  SET full_name = COALESCE(profiles.full_name, 'Demo User'),
      company_name = COALESCE(profiles.company_name, 'Demo Company');

  -- Get platform IDs
  SELECT id INTO google_platform_id FROM platforms WHERE name = 'google';
  SELECT id INTO yelp_platform_id FROM platforms WHERE name = 'yelp';
  SELECT id INTO trustpilot_platform_id FROM platforms WHERE name = 'trustpilot';

  -- Create sample companies (one at a time to capture IDs)
  INSERT INTO companies (id, owner_id, name, description, industry, website)
  VALUES 
    (gen_random_uuid(), demo_user_id, 'The Artisan Cafe', 'A cozy neighborhood cafe serving artisanal coffee and fresh pastries', 'Restaurant & Cafe', 'https://artisancafe.example.com')
  RETURNING id INTO company1_id;

  INSERT INTO companies (id, owner_id, name, description, industry, website)
  VALUES 
    (gen_random_uuid(), demo_user_id, 'TechHub Solutions', 'Enterprise software solutions and IT consulting services', 'Technology', 'https://techhub.example.com')
  RETURNING id INTO company2_id;

  -- Create locations for Company 1 (Artisan Cafe) - one at a time
  INSERT INTO locations (id, company_id, name, address, city, state, country, postal_code, latitude, longitude, phone, email)
  VALUES 
    (gen_random_uuid(), company1_id, 'Downtown Location', '123 Main Street', 'San Francisco', 'CA', 'USA', '94102', 37.7749, -122.4194, '+1-415-555-0101', 'downtown@artisancafe.com')
  RETURNING id INTO location1_id;

  INSERT INTO locations (id, company_id, name, address, city, state, country, postal_code, latitude, longitude, phone, email)
  VALUES 
    (gen_random_uuid(), company1_id, 'Westside Branch', '456 Ocean Avenue', 'San Francisco', 'CA', 'USA', '94127', 37.7369, -122.4572, '+1-415-555-0102', 'westside@artisancafe.com')
  RETURNING id INTO location2_id;

  -- Create location for Company 2 (TechHub Solutions)
  INSERT INTO locations (id, company_id, name, address, city, state, country, postal_code, latitude, longitude, phone, email)
  VALUES 
    (gen_random_uuid(), company2_id, 'Headquarters', '789 Tech Boulevard', 'Palo Alto', 'CA', 'USA', '94301', 37.4419, -122.1430, '+1-650-555-0201', 'info@techhub.com')
  RETURNING id INTO location3_id;

  -- Create platform connections (one at a time)
  INSERT INTO platform_connections (id, location_id, platform_id, platform_location_id, platform_url, last_sync_at)
  VALUES 
    (gen_random_uuid(), location1_id, google_platform_id, 'CHIJd8BlQ2BZwokRAFUEcm_qrcA', 'https://maps.google.com/artisan-cafe-downtown', NOW() - INTERVAL '2 hours')
  RETURNING id INTO pc1_id;

  INSERT INTO platform_connections (id, location_id, platform_id, platform_location_id, platform_url, last_sync_at)
  VALUES 
    (gen_random_uuid(), location1_id, yelp_platform_id, 'artisan-cafe-sf-downtown', 'https://yelp.com/biz/artisan-cafe-sf', NOW() - INTERVAL '3 hours')
  RETURNING id INTO pc2_id;

  INSERT INTO platform_connections (id, location_id, platform_id, platform_location_id, platform_url, last_sync_at)
  VALUES 
    (gen_random_uuid(), location2_id, google_platform_id, 'CHIJd8BlQ2BZwokRAFUEcm_qrcB', 'https://maps.google.com/artisan-cafe-westside', NOW() - INTERVAL '1 hour')
  RETURNING id INTO pc3_id;

  -- Create sample reviews for Artisan Cafe (one at a time to capture IDs)
  -- Review 1
  INSERT INTO reviews (id, platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (gen_random_uuid(), pc1_id, 'google_001', 'Sarah Mitchell', 5.0, 'Amazing coffee and atmosphere!', 'This place is a hidden gem! The espresso is perfectly crafted, and the pastries are always fresh. The staff is incredibly friendly and knowledgeable about their beans. I come here every morning before work.', NOW() - INTERVAL '2 days')
  RETURNING id INTO review1_id;

  -- Review 2
  INSERT INTO reviews (id, platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (gen_random_uuid(), pc1_id, 'google_002', 'James Chen', 4.5, 'Great spot for work', 'Perfect place to work remotely. Good wifi, plenty of outlets, and the coffee keeps me energized. Only minor complaint is it can get crowded during lunch hours.', NOW() - INTERVAL '5 days')
  RETURNING id INTO review2_id;

  -- Review 3
  INSERT INTO reviews (id, platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (gen_random_uuid(), pc1_id, 'google_003', 'Maria Rodriguez', 5.0, 'Best cafe in the city', 'I have tried every cafe in San Francisco and this is hands down the best. The attention to detail is remarkable. Their cold brew is exceptional!', NOW() - INTERVAL '1 week')
  RETURNING id INTO review3_id;

  -- Review 4
  INSERT INTO reviews (id, platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (gen_random_uuid(), pc2_id, 'yelp_001', 'John Anderson', 4.0, 'Good coffee, could improve service', 'The coffee is excellent but the service can be slow during peak times. Still worth the wait though. Their avocado toast is delicious.', NOW() - INTERVAL '3 days')
  RETURNING id INTO review4_id;

  -- Review 5
  INSERT INTO reviews (id, platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (gen_random_uuid(), pc2_id, 'yelp_002', 'Emily Thompson', 5.0, 'My favorite morning spot', 'Cannot start my day without their cappuccino. The baristas remember my order and always greet me with a smile. The atmosphere is cozy and welcoming.', NOW() - INTERVAL '1 day')
  RETURNING id INTO review5_id;

  -- Review 6
  INSERT INTO reviews (id, platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (gen_random_uuid(), pc2_id, 'yelp_003', 'David Park', 2.5, 'Overpriced and disappointing', 'Expected more given the hype. Coffee was mediocre and prices are too high for what you get. Service was rushed and inattentive.', NOW() - INTERVAL '4 days')
  RETURNING id INTO review6_id;

  -- Review 7
  INSERT INTO reviews (id, platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (gen_random_uuid(), pc3_id, 'google_004', 'Lisa Wang', 5.0, 'Neighborhood treasure', 'So glad this cafe opened in our neighborhood. Everything is top quality from the coffee to the baked goods. Great place to catch up with friends.', NOW() - INTERVAL '6 days')
  RETURNING id INTO review7_id;

  -- Review 8
  INSERT INTO reviews (id, platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (gen_random_uuid(), pc3_id, 'google_005', 'Michael Brown', 4.5, 'Excellent pastries', 'While the coffee is good, the real stars are the pastries. The croissants are buttery perfection. Highly recommend trying their seasonal specials.', NOW() - INTERVAL '8 days')
  RETURNING id INTO review8_id;

  -- Review 9
  INSERT INTO reviews (id, platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (gen_random_uuid(), pc3_id, 'google_006', 'Rachel Green', 3.5, 'Hit or miss quality', 'Some days the coffee is amazing, other days it''s just okay. Inconsistent quality is my main concern. When they get it right though, it''s fantastic.', NOW() - INTERVAL '2 weeks')
  RETURNING id INTO review9_id;

  -- Review 10
  INSERT INTO reviews (id, platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (gen_random_uuid(), pc3_id, 'google_007', 'Tom Wilson', 5.0, 'Perfect in every way', 'From the ambiance to the service to the quality of drinks, everything is perfect. This is my go-to spot for both meetings and relaxation.', NOW() - INTERVAL '3 days')
  RETURNING id INTO review10_id;

  -- Create sentiment analysis for reviews
  INSERT INTO sentiment_analysis (review_id, platform_location_id, sentiment, sentiment_score, confidence, emotions)
  VALUES 
    (review1_id, 'CHIJd8BlQ2BZwokRAFUEcm_qrcA', 'positive', 0.92, 0.95, '{"joy": 0.85, "trust": 0.75, "anticipation": 0.60}'::jsonb),
    (review2_id, 'CHIJd8BlQ2BZwokRAFUEcm_qrcA', 'positive', 0.75, 0.88, '{"trust": 0.70, "joy": 0.55}'::jsonb),
    (review3_id, 'CHIJd8BlQ2BZwokRAFUEcm_qrcA', 'positive', 0.95, 0.98, '{"joy": 0.90, "trust": 0.80}'::jsonb),
    (review4_id, 'artisan-cafe-sf-downtown', 'positive', 0.65, 0.82, '{"joy": 0.60, "trust": 0.50, "sadness": 0.15}'::jsonb),
    (review5_id, 'artisan-cafe-sf-downtown', 'positive', 0.88, 0.92, '{"joy": 0.80, "trust": 0.75, "anticipation": 0.65}'::jsonb),
    (review6_id, 'artisan-cafe-sf-downtown', 'negative', -0.68, 0.85, '{"anger": 0.55, "disgust": 0.45, "sadness": 0.40}'::jsonb),
    (review7_id, 'CHIJd8BlQ2BZwokRAFUEcm_qrcB', 'positive', 0.90, 0.94, '{"joy": 0.82, "trust": 0.78}'::jsonb),
    (review8_id, 'CHIJd8BlQ2BZwokRAFUEcm_qrcB', 'positive', 0.82, 0.90, '{"joy": 0.75, "surprise": 0.60}'::jsonb),
    (review9_id, 'CHIJd8BlQ2BZwokRAFUEcm_qrcB', 'neutral', 0.15, 0.70, '{"trust": 0.40, "sadness": 0.25, "joy": 0.35}'::jsonb),
    (review10_id, 'CHIJd8BlQ2BZwokRAFUEcm_qrcB', 'positive', 0.94, 0.96, '{"joy": 0.88, "trust": 0.85}'::jsonb);

  -- Create keywords (insert all at once, then retrieve IDs)
  INSERT INTO keywords (text, normalized_text, category)
  VALUES 
    ('coffee', 'coffee', 'food'),
    ('service', 'service', 'service'),
    ('atmosphere', 'atmosphere', 'ambiance'),
    ('price', 'price', 'price'),
    ('clean', 'clean', 'cleanliness'),
    ('fast', 'fast', 'service'),
    ('friendly', 'friendly', 'staff'),
    ('delicious', 'delicious', 'food'),
    ('pastries', 'pastries', 'food'),
    ('wifi', 'wifi', 'ambiance'),
    ('cozy', 'cozy', 'ambiance'),
    ('quality', 'quality', 'quality'),
    ('slow', 'slow', 'service'),
    ('overpriced', 'overpriced', 'price'),
    ('crowded', 'crowded', 'ambiance')
  ON CONFLICT (text) DO NOTHING;

  -- Get keyword IDs
  SELECT id INTO keyword_food_id FROM keywords WHERE text = 'coffee' LIMIT 1;
  SELECT id INTO keyword_service_id FROM keywords WHERE text = 'service' LIMIT 1;
  SELECT id INTO keyword_ambiance_id FROM keywords WHERE text = 'atmosphere' LIMIT 1;
  SELECT id INTO keyword_price_id FROM keywords WHERE text = 'price' LIMIT 1;
  SELECT id INTO keyword_clean_id FROM keywords WHERE text = 'clean' LIMIT 1;
  SELECT id INTO keyword_fast_id FROM keywords WHERE text = 'fast' LIMIT 1;
  SELECT id INTO keyword_friendly_id FROM keywords WHERE text = 'friendly' LIMIT 1;
  SELECT id INTO keyword_delicious_id FROM keywords WHERE text = 'delicious' LIMIT 1;

  -- Link reviews to keywords
  INSERT INTO review_keywords (review_id, keyword_id, frequency, relevance_score)
  VALUES 
    -- Review 1
    (review1_id, keyword_food_id, 2, 0.92),
    (review1_id, keyword_ambiance_id, 1, 0.85),
    (review1_id, keyword_friendly_id, 1, 0.88),
    -- Review 2
    (review2_id, keyword_food_id, 2, 0.80),
    (review2_id, (SELECT id FROM keywords WHERE text = 'wifi'), 1, 0.90),
    -- Review 3
    (review3_id, keyword_food_id, 1, 0.95),
    (review3_id, (SELECT id FROM keywords WHERE text = 'quality'), 1, 0.92),
    -- Review 4
    (review4_id, keyword_food_id, 1, 0.85),
    (review4_id, keyword_service_id, 1, 0.70),
    (review4_id, (SELECT id FROM keywords WHERE text = 'slow'), 1, 0.75),
    -- Review 5
    (review5_id, keyword_food_id, 1, 0.90),
    (review5_id, keyword_friendly_id, 1, 0.92),
    (review5_id, (SELECT id FROM keywords WHERE text = 'cozy'), 1, 0.85),
    -- Review 6
    (review6_id, keyword_price_id, 1, 0.88),
    (review6_id, (SELECT id FROM keywords WHERE text = 'overpriced'), 1, 0.90),
    (review6_id, keyword_service_id, 1, 0.75),
    -- Review 7
    (review7_id, keyword_food_id, 1, 0.88),
    (review7_id, (SELECT id FROM keywords WHERE text = 'quality'), 1, 0.90),
    -- Review 8
    (review8_id, (SELECT id FROM keywords WHERE text = 'pastries'), 2, 0.95),
    (review8_id, keyword_delicious_id, 1, 0.92),
    -- Review 9
    (review9_id, keyword_food_id, 1, 0.70),
    (review9_id, (SELECT id FROM keywords WHERE text = 'quality'), 1, 0.65),
    -- Review 10
    (review10_id, keyword_ambiance_id, 1, 0.90),
    (review10_id, keyword_service_id, 1, 0.88),
    (review10_id, (SELECT id FROM keywords WHERE text = 'quality'), 1, 0.92);

  -- Create topics (one at a time)
  INSERT INTO topics (id, company_id, name, category, description, keywords, occurrence_count, sentiment_distribution)
  VALUES 
    (gen_random_uuid(), company1_id, 'Coffee Quality', 'satisfaction', 'Customers consistently praise the quality of coffee and brewing techniques', ARRAY['coffee', 'espresso', 'quality', 'fresh'], 8, '{"positive": 7, "negative": 0, "neutral": 1}'::jsonb)
  RETURNING id INTO topic1_id;

  INSERT INTO topics (id, company_id, name, category, description, keywords, occurrence_count, sentiment_distribution)
  VALUES 
    (gen_random_uuid(), company1_id, 'Service Speed', 'dissatisfaction', 'Some customers experience slow service during peak hours', ARRAY['service', 'slow', 'wait', 'crowded'], 3, '{"positive": 1, "negative": 2, "neutral": 0}'::jsonb)
  RETURNING id INTO topic2_id;

  INSERT INTO topics (id, company_id, name, category, description, keywords, occurrence_count, sentiment_distribution)
  VALUES 
    (gen_random_uuid(), company1_id, 'Pricing', 'neutral', 'Mixed opinions on pricing, some find it reasonable for quality, others find it expensive', ARRAY['price', 'expensive', 'value'], 2, '{"positive": 0, "negative": 1, "neutral": 1}'::jsonb)
  RETURNING id INTO topic3_id;

  -- Link reviews to topics
  INSERT INTO review_topics (review_id, topic_id, relevance_score)
  VALUES 
    (review1_id, topic1_id, 0.95),
    (review2_id, topic1_id, 0.80),
    (review3_id, topic1_id, 0.92),
    (review4_id, topic1_id, 0.75),
    (review4_id, topic2_id, 0.82),
    (review5_id, topic1_id, 0.88),
    (review6_id, topic3_id, 0.90),
    (review6_id, topic2_id, 0.70),
    (review7_id, topic1_id, 0.85),
    (review8_id, topic1_id, 0.90),
    (review9_id, topic1_id, 0.65),
    (review10_id, topic1_id, 0.92);

  -- Create sync logs
  INSERT INTO sync_logs (platform_connection_id, status, reviews_fetched, reviews_new, reviews_updated, started_at, completed_at)
  VALUES 
    (pc1_id, 'success', 3, 3, 0, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours' + INTERVAL '45 seconds'),
    (pc2_id, 'success', 3, 3, 0, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours' + INTERVAL '52 seconds'),
    (pc3_id, 'success', 4, 4, 0, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour' + INTERVAL '38 seconds');

  RAISE NOTICE 'Sample data seeded successfully for user: %', demo_user_id;
  RAISE NOTICE 'Created companies: % and %', company1_id, company2_id;
  RAISE NOTICE 'Created % locations, % platform connections, and 10 reviews', 3, 4;
  
END $$;

-- Verify the seeded data
DO $$
DECLARE
  review_count INTEGER;
  company_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO review_count FROM reviews;
  SELECT COUNT(*) INTO company_count FROM companies;
  
  RAISE NOTICE 'Verification: Found % companies and % reviews in database', company_count, review_count;
END $$;

COMMENT ON COLUMN reviews.external_id IS 'Platform-specific review ID (seeded with sample data)';
