-- Clean and reseed sample data
-- This migration safely clears existing seed data and creates fresh sample data

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
  -- Get the first user from auth.users
  SELECT id INTO demo_user_id FROM auth.users LIMIT 1;

  -- If no user exists, skip seeding
  IF demo_user_id IS NULL THEN
    RAISE NOTICE 'No users found in auth.users. Please sign up first before running seed data.';
    RETURN;
  END IF;

  RAISE NOTICE 'Starting cleanup and reseed for user: %', demo_user_id;

  -- Clean up existing seed data for this user (cascading deletes will handle dependencies)
  DELETE FROM companies WHERE owner_id = demo_user_id;
  
  RAISE NOTICE 'Cleanup completed. Starting fresh seed...';

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

  -- Create sample companies
  INSERT INTO companies (id, owner_id, name, description, industry, website)
  VALUES 
    (gen_random_uuid(), demo_user_id, 'The Artisan Cafe', 'A cozy neighborhood cafe serving artisanal coffee and fresh pastries', 'Restaurant & Cafe', 'https://artisancafe.example.com')
  RETURNING id INTO company1_id;

  INSERT INTO companies (id, owner_id, name, description, industry, website)
  VALUES 
    (gen_random_uuid(), demo_user_id, 'TechHub Solutions', 'Enterprise software solutions and IT consulting services', 'Technology', 'https://techhub.example.com')
  RETURNING id INTO company2_id;

  -- Create locations for Company 1 (Artisan Cafe)
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

  -- Create platform connections
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

  -- Create sample reviews for Artisan Cafe
  INSERT INTO reviews (id, platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (gen_random_uuid(), pc1_id, 'google_001', 'Sarah Mitchell', 5.0, 'Amazing coffee and atmosphere!', 'This place is a hidden gem! The espresso is perfectly crafted, and the pastries are always fresh. The staff is incredibly friendly and knowledgeable about their beans. I come here every morning before work.', NOW() - INTERVAL '2 days')
  RETURNING id INTO review1_id;

  INSERT INTO reviews (id, platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (gen_random_uuid(), pc1_id, 'google_002', 'James Chen', 4.5, 'Great spot for work', 'Perfect place to work remotely. Good wifi, plenty of outlets, and the coffee keeps me energized. Only minor complaint is it can get crowded during lunch hours.', NOW() - INTERVAL '5 days')
  RETURNING id INTO review2_id;

  INSERT INTO reviews (id, platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (gen_random_uuid(), pc1_id, 'google_003', 'Maria Rodriguez', 5.0, 'Best cafe in the city', 'I have tried every cafe in San Francisco and this is hands down the best. The attention to detail is remarkable. Their cold brew is exceptional!', NOW() - INTERVAL '1 week')
  RETURNING id INTO review3_id;

  INSERT INTO reviews (id, platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (gen_random_uuid(), pc2_id, 'yelp_001', 'John Anderson', 4.0, 'Good coffee, could improve service', 'The coffee is excellent but the service can be slow during peak times. Still worth the wait though. Their avocado toast is delicious.', NOW() - INTERVAL '3 days')
  RETURNING id INTO review4_id;

  INSERT INTO reviews (id, platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (gen_random_uuid(), pc2_id, 'yelp_002', 'Emily Thompson', 5.0, 'My favorite morning spot', 'Cannot start my day without their cappuccino. The baristas remember my order and always greet me with a smile. The atmosphere is cozy and welcoming.', NOW() - INTERVAL '1 day')
  RETURNING id INTO review5_id;

  INSERT INTO reviews (id, platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (gen_random_uuid(), pc2_id, 'yelp_003', 'David Park', 2.5, 'Overpriced and disappointing', 'Expected more given the hype. Coffee was mediocre and prices are too high for what you get. Service was rushed and inattentive.', NOW() - INTERVAL '4 days')
  RETURNING id INTO review6_id;

  INSERT INTO reviews (id, platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (gen_random_uuid(), pc3_id, 'google_004', 'Lisa Wang', 5.0, 'Neighborhood treasure', 'So glad this cafe opened in our neighborhood. Everything is top quality from the coffee to the baked goods. Great place to catch up with friends.', NOW() - INTERVAL '6 days')
  RETURNING id INTO review7_id;

  INSERT INTO reviews (id, platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (gen_random_uuid(), pc3_id, 'google_005', 'Michael Brown', 4.5, 'Excellent pastries', 'While the coffee is good, the real stars are the pastries. The croissants are buttery perfection. Highly recommend trying their seasonal specials.', NOW() - INTERVAL '8 days')
  RETURNING id INTO review8_id;

  INSERT INTO reviews (id, platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (gen_random_uuid(), pc3_id, 'google_006', 'Rachel Green', 3.5, 'Hit or miss quality', 'Some days the coffee is amazing, other days it''s just okay. Inconsistent quality is my main concern. When they get it right though, it''s fantastic.', NOW() - INTERVAL '2 weeks')
  RETURNING id INTO review9_id;

  INSERT INTO reviews (id, platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (gen_random_uuid(), pc3_id, 'google_007', 'Tom Wilson', 5.0, 'Perfect in every way', 'From the ambiance to the service to the quality of drinks, everything is perfect. This is my go-to spot for both meetings and relaxation.', NOW() - INTERVAL '3 days')
  RETURNING id INTO review10_id;

  -- Create sentiment analysis for reviews
  INSERT INTO sentiment_analysis (review_id, sentiment, sentiment_score, confidence, emotions)
  VALUES 
    (review1_id, 'positive', 0.92, 0.95, '{"joy": 0.85, "trust": 0.75, "anticipation": 0.60}'::jsonb),
    (review2_id, 'positive', 0.75, 0.88, '{"trust": 0.70, "joy": 0.55}'::jsonb),
    (review3_id, 'positive', 0.95, 0.98, '{"joy": 0.90, "trust": 0.80}'::jsonb),
    (review4_id, 'positive', 0.65, 0.82, '{"joy": 0.60, "trust": 0.50, "sadness": 0.15}'::jsonb),
    (review5_id, 'positive', 0.88, 0.92, '{"joy": 0.80, "trust": 0.75, "anticipation": 0.65}'::jsonb),
    (review6_id, 'negative', -0.68, 0.85, '{"anger": 0.55, "disgust": 0.45, "sadness": 0.40}'::jsonb),
    (review7_id, 'positive', 0.90, 0.94, '{"joy": 0.82, "trust": 0.78}'::jsonb),
    (review8_id, 'positive', 0.82, 0.90, '{"joy": 0.75, "surprise": 0.60}'::jsonb),
    (review9_id, 'neutral', 0.15, 0.70, '{"trust": 0.40, "sadness": 0.25, "joy": 0.35}'::jsonb),
    (review10_id, 'positive', 0.94, 0.96, '{"joy": 0.88, "trust": 0.85}'::jsonb);

  -- Create keywords (with conflict handling)
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
    (review1_id, keyword_food_id, 2, 0.92),
    (review1_id, keyword_ambiance_id, 1, 0.85),
    (review1_id, keyword_friendly_id, 1, 0.88),
    (review2_id, keyword_food_id, 2, 0.80),
    (review2_id, (SELECT id FROM keywords WHERE text = 'wifi'), 1, 0.90),
    (review3_id, keyword_food_id, 1, 0.95),
    (review3_id, (SELECT id FROM keywords WHERE text = 'quality'), 1, 0.92),
    (review4_id, keyword_food_id, 1, 0.85),
    (review4_id, keyword_service_id, 1, 0.70),
    (review4_id, (SELECT id FROM keywords WHERE text = 'slow'), 1, 0.75),
    (review5_id, keyword_food_id, 1, 0.90),
    (review5_id, keyword_friendly_id, 1, 0.92),
    (review5_id, (SELECT id FROM keywords WHERE text = 'cozy'), 1, 0.85),
    (review6_id, keyword_price_id, 1, 0.88),
    (review6_id, (SELECT id FROM keywords WHERE text = 'overpriced'), 1, 0.90),
    (review6_id, keyword_service_id, 1, 0.75),
    (review7_id, keyword_food_id, 1, 0.88),
    (review7_id, (SELECT id FROM keywords WHERE text = 'quality'), 1, 0.90),
    (review8_id, (SELECT id FROM keywords WHERE text = 'pastries'), 2, 0.95),
    (review8_id, keyword_delicious_id, 1, 0.92),
    (review9_id, keyword_food_id, 1, 0.70),
    (review9_id, (SELECT id FROM keywords WHERE text = 'quality'), 1, 0.65),
    (review10_id, keyword_ambiance_id, 1, 0.92),
    (review10_id, keyword_service_id, 1, 0.90),
    (review10_id, (SELECT id FROM keywords WHERE text = 'quality'), 1, 0.95);

  -- Create topics
  INSERT INTO topics (name, description)
  VALUES 
    ('Coffee Quality', 'Discussions about the quality and taste of coffee')
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO topic1_id;
  
  IF topic1_id IS NULL THEN
    SELECT id INTO topic1_id FROM topics WHERE name = 'Coffee Quality' LIMIT 1;
  END IF;

  INSERT INTO topics (name, description)
  VALUES 
    ('Service Speed', 'Comments about service efficiency and wait times')
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO topic2_id;
  
  IF topic2_id IS NULL THEN
    SELECT id INTO topic2_id FROM topics WHERE name = 'Service Speed' LIMIT 1;
  END IF;

  INSERT INTO topics (name, description)
  VALUES 
    ('Atmosphere & Ambiance', 'Reviews mentioning the environment and atmosphere')
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO topic3_id;
  
  IF topic3_id IS NULL THEN
    SELECT id INTO topic3_id FROM topics WHERE name = 'Atmosphere & Ambiance' LIMIT 1;
  END IF;

  -- Link reviews to topics
  INSERT INTO review_topics (review_id, topic_id, relevance_score)
  VALUES 
    (review1_id, topic1_id, 0.95),
    (review1_id, topic3_id, 0.85),
    (review2_id, topic1_id, 0.80),
    (review2_id, topic3_id, 0.75),
    (review3_id, topic1_id, 0.98),
    (review4_id, topic1_id, 0.85),
    (review4_id, topic2_id, 0.90),
    (review5_id, topic1_id, 0.92),
    (review5_id, topic3_id, 0.88),
    (review6_id, topic2_id, 0.85),
    (review7_id, topic1_id, 0.90),
    (review7_id, topic3_id, 0.92),
    (review8_id, topic1_id, 0.88),
    (review9_id, topic1_id, 0.75),
    (review10_id, topic3_id, 0.95),
    (review10_id, topic2_id, 0.90);

  -- Create sync logs
  INSERT INTO sync_logs (platform_connection_id, status, records_fetched, records_processed, started_at, completed_at)
  VALUES 
    (pc1_id, 'success', 50, 50, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 55 minutes'),
    (pc2_id, 'success', 35, 35, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours 50 minutes'),
    (pc3_id, 'success', 28, 28, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 55 minutes');

  RAISE NOTICE 'Seed data created successfully!';
  RAISE NOTICE 'Companies: 2';
  RAISE NOTICE 'Locations: 3';
  RAISE NOTICE 'Reviews: 10';
  RAISE NOTICE 'Keywords: 15';

END $$;
