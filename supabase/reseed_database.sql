-- Simple reseed script - Run this directly in Supabase SQL Editor
-- This will clean up and recreate all seed data

DO $$
DECLARE
  demo_user_id UUID;
  company1_id UUID;
  company2_id UUID;
  location1_id UUID;
  location2_id UUID;
  location3_id UUID;
  google_id UUID;
  yelp_id UUID;
  pc1_id UUID;
  pc2_id UUID;
  pc3_id UUID;
  r1_id UUID; r2_id UUID; r3_id UUID; r4_id UUID; r5_id UUID;
  r6_id UUID; r7_id UUID; r8_id UUID; r9_id UUID; r10_id UUID;
  kw_coffee UUID; kw_service UUID; kw_atm UUID; kw_price UUID;
  kw_friendly UUID; kw_delicious UUID;
BEGIN
  -- Get current user
  SELECT id INTO demo_user_id FROM auth.users ORDER BY created_at DESC LIMIT 1;
  
  IF demo_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found. Please sign up first.';
  END IF;

  -- CLEANUP: Delete all existing data for this user
  DELETE FROM companies WHERE owner_id = demo_user_id;
  
  RAISE NOTICE 'Cleaned up existing data for user %', demo_user_id;

  -- Get platform IDs
  SELECT id INTO google_id FROM platforms WHERE name = 'google' LIMIT 1;
  SELECT id INTO yelp_id FROM platforms WHERE name = 'yelp' LIMIT 1;

  -- Create companies
  INSERT INTO companies (owner_id, name, description, industry, website)
  VALUES (demo_user_id, 'The Artisan Cafe', 'A cozy neighborhood cafe', 'Restaurant & Cafe', 'https://artisancafe.example.com')
  RETURNING id INTO company1_id;

  INSERT INTO companies (owner_id, name, description, industry, website)
  VALUES (demo_user_id, 'TechHub Solutions', 'Enterprise software solutions', 'Technology', 'https://techhub.example.com')
  RETURNING id INTO company2_id;

  -- Create locations
  INSERT INTO locations (company_id, name, address, city, state, country, postal_code)
  VALUES (company1_id, 'Downtown Location', '123 Main Street', 'San Francisco', 'CA', 'USA', '94102')
  RETURNING id INTO location1_id;

  INSERT INTO locations (company_id, name, address, city, state, country, postal_code)
  VALUES (company1_id, 'Westside Branch', '456 Ocean Avenue', 'San Francisco', 'CA', 'USA', '94127')
  RETURNING id INTO location2_id;

  INSERT INTO locations (company_id, name, address, city, state, country, postal_code)
  VALUES (company2_id, 'Headquarters', '789 Tech Boulevard', 'Palo Alto', 'CA', 'USA', '94301')
  RETURNING id INTO location3_id;

  -- Create platform connections
  INSERT INTO platform_connections (location_id, platform_id, platform_location_id, platform_url)
  VALUES (location1_id, google_id, 'GOOGLE_LOC_1', 'https://maps.google.com/cafe-downtown')
  RETURNING id INTO pc1_id;

  INSERT INTO platform_connections (location_id, platform_id, platform_location_id, platform_url)
  VALUES (location1_id, yelp_id, 'YELP_LOC_1', 'https://yelp.com/biz/artisan-cafe')
  RETURNING id INTO pc2_id;

  INSERT INTO platform_connections (location_id, platform_id, platform_location_id, platform_url)
  VALUES (location2_id, google_id, 'GOOGLE_LOC_2', 'https://maps.google.com/cafe-westside')
  RETURNING id INTO pc3_id;

  -- Create reviews
  INSERT INTO reviews (platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (pc1_id, 'r1', 'Sarah Mitchell', 5.0, 'Amazing coffee!', 'This place is a hidden gem! The espresso is perfectly crafted.', NOW() - INTERVAL '2 days')
  RETURNING id INTO r1_id;

  INSERT INTO reviews (platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (pc1_id, 'r2', 'James Chen', 4.5, 'Great spot for work', 'Perfect place to work remotely. Good wifi and coffee.', NOW() - INTERVAL '5 days')
  RETURNING id INTO r2_id;

  INSERT INTO reviews (platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (pc1_id, 'r3', 'Maria Rodriguez', 5.0, 'Best cafe in the city', 'Hands down the best. Their cold brew is exceptional!', NOW() - INTERVAL '1 week')
  RETURNING id INTO r3_id;

  INSERT INTO reviews (platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (pc2_id, 'r4', 'John Anderson', 4.0, 'Good coffee', 'The coffee is excellent. Service can be slow during peak times.', NOW() - INTERVAL '3 days')
  RETURNING id INTO r4_id;

  INSERT INTO reviews (platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (pc2_id, 'r5', 'Emily Thompson', 5.0, 'My favorite spot', 'Cannot start my day without their cappuccino. Staff is wonderful!', NOW() - INTERVAL '1 day')
  RETURNING id INTO r5_id;

  INSERT INTO reviews (platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (pc2_id, 'r6', 'David Park', 2.5, 'Overpriced', 'Expected more given the hype. Coffee was mediocre and prices are high.', NOW() - INTERVAL '4 days')
  RETURNING id INTO r6_id;

  INSERT INTO reviews (platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (pc3_id, 'r7', 'Lisa Wang', 5.0, 'Neighborhood treasure', 'So glad this cafe opened here. Everything is top quality!', NOW() - INTERVAL '6 days')
  RETURNING id INTO r7_id;

  INSERT INTO reviews (platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (pc3_id, 'r8', 'Michael Brown', 4.5, 'Excellent pastries', 'The pastries are the real stars. Croissants are buttery perfection.', NOW() - INTERVAL '8 days')
  RETURNING id INTO r8_id;

  INSERT INTO reviews (platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (pc3_id, 'r9', 'Rachel Green', 3.5, 'Hit or miss', 'Some days amazing, other days just okay. Inconsistent quality.', NOW() - INTERVAL '2 weeks')
  RETURNING id INTO r9_id;

  INSERT INTO reviews (platform_connection_id, external_id, author_name, rating, title, content, published_at)
  VALUES (pc3_id, 'r10', 'Tom Wilson', 5.0, 'Perfect in every way', 'Everything is perfect. My go-to spot for meetings and relaxation.', NOW() - INTERVAL '3 days')
  RETURNING id INTO r10_id;

  -- Create sentiment analysis
  INSERT INTO sentiment_analysis (review_id, sentiment, sentiment_score, confidence)
  VALUES 
    (r1_id, 'positive', 0.92, 0.95),
    (r2_id, 'positive', 0.75, 0.88),
    (r3_id, 'positive', 0.95, 0.98),
    (r4_id, 'positive', 0.65, 0.82),
    (r5_id, 'positive', 0.88, 0.92),
    (r6_id, 'negative', -0.68, 0.85),
    (r7_id, 'positive', 0.90, 0.94),
    (r8_id, 'positive', 0.82, 0.90),
    (r9_id, 'neutral', 0.15, 0.70),
    (r10_id, 'positive', 0.94, 0.96);

  -- Create keywords
  INSERT INTO keywords (text, normalized_text, category)
  VALUES 
    ('coffee', 'coffee', 'food'),
    ('service', 'service', 'service'),
    ('atmosphere', 'atmosphere', 'ambiance'),
    ('price', 'price', 'price'),
    ('friendly', 'friendly', 'staff'),
    ('delicious', 'delicious', 'food'),
    ('pastries', 'pastries', 'food'),
    ('wifi', 'wifi', 'ambiance'),
    ('cozy', 'cozy', 'ambiance'),
    ('quality', 'quality', 'quality')
  ON CONFLICT (text) DO NOTHING;

  -- Get keyword IDs
  SELECT id INTO kw_coffee FROM keywords WHERE text = 'coffee' LIMIT 1;
  SELECT id INTO kw_service FROM keywords WHERE text = 'service' LIMIT 1;
  SELECT id INTO kw_atm FROM keywords WHERE text = 'atmosphere' LIMIT 1;
  SELECT id INTO kw_price FROM keywords WHERE text = 'price' LIMIT 1;
  SELECT id INTO kw_friendly FROM keywords WHERE text = 'friendly' LIMIT 1;
  SELECT id INTO kw_delicious FROM keywords WHERE text = 'delicious' LIMIT 1;

  -- Link reviews to keywords
  INSERT INTO review_keywords (review_id, keyword_id, frequency, relevance_score)
  VALUES 
    (r1_id, kw_coffee, 2, 0.92),
    (r1_id, kw_atm, 1, 0.85),
    (r2_id, kw_coffee, 2, 0.80),
    (r3_id, kw_coffee, 1, 0.95),
    (r4_id, kw_coffee, 1, 0.85),
    (r4_id, kw_service, 1, 0.70),
    (r5_id, kw_coffee, 1, 0.90),
    (r5_id, kw_friendly, 1, 0.92),
    (r6_id, kw_price, 1, 0.88),
    (r7_id, kw_coffee, 1, 0.88),
    (r8_id, kw_delicious, 1, 0.92),
    (r9_id, kw_coffee, 1, 0.70),
    (r10_id, kw_atm, 1, 0.92);

  -- Create topics for company1 (topics are company-specific)
  INSERT INTO topics (company_id, name, description, category)
  VALUES (company1_id, 'Coffee Quality', 'Quality and taste of coffee drinks', 'satisfaction');

  INSERT INTO topics (company_id, name, description, category)
  VALUES (company1_id, 'Service Speed', 'Speed and efficiency of service', 'neutral');

  INSERT INTO topics (company_id, name, description, category)
  VALUES (company1_id, 'Atmosphere', 'Ambiance and environment', 'satisfaction');

  RAISE NOTICE 'SUCCESS! Created 2 companies, 3 locations, 10 reviews, and 3 topics for user %', demo_user_id;
END $$;
