-- Seed additional data for user ec54834b-8176-424c-af1f-7e1c2614709e
-- Run this with service_role permissions

-- Disable RLS temporarily for seeding
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE platform_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_analysis DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  v_user_id UUID := 'ec54834b-8176-424c-af1f-7e1c2614709e';
  v_company_id UUID;
  v_location_id UUID;
  v_platform_connection_id UUID;
  v_review_id UUID;
  v_platform_google UUID;
  v_platform_yelp UUID;
  v_review_counter INTEGER;
BEGIN

  -- Get platform IDs
  SELECT id INTO v_platform_google FROM platforms WHERE name = 'google' LIMIT 1;
  SELECT id INTO v_platform_yelp FROM platforms WHERE name = 'yelp' LIMIT 1;

  -- If platforms don't exist, create them
  IF v_platform_google IS NULL THEN
    INSERT INTO platforms (name, display_name, is_active) 
    VALUES ('google', 'Google', true)
    RETURNING id INTO v_platform_google;
  END IF;

  IF v_platform_yelp IS NULL THEN
    INSERT INTO platforms (name, display_name, is_active)
    VALUES ('yelp', 'Yelp', true)
    RETURNING id INTO v_platform_yelp;
  END IF;

  -- Company 1: Urban Coffee Roasters
  INSERT INTO companies (owner_id, name, description, industry, website)
  VALUES (v_user_id, 'Urban Coffee Roasters', 'Artisanal coffee shop with locally roasted beans', 'Food & Beverage', 'https://urbancoffee.example.com')
  RETURNING id INTO v_company_id;
  
  INSERT INTO locations (company_id, name, address, city, state, country, postal_code)
  VALUES (v_company_id, 'Downtown Branch', '123 Main St', 'San Francisco', 'CA', 'USA', '94102')
  RETURNING id INTO v_location_id;
  
  INSERT INTO platform_connections (location_id, platform_id, platform_location_id, platform_url, last_sync_at)
  VALUES (v_location_id, v_platform_google, 'google_loc_' || gen_random_uuid()::text, 'https://google.com/maps', NOW() - INTERVAL '2 hours')
  RETURNING id INTO v_platform_connection_id;
  
  -- Generate reviews
  INSERT INTO reviews (platform_connection_id, external_id, author_name, rating, title, content, published_at, reviewer_gender, reviewer_age_range)
  VALUES 
    (v_platform_connection_id, 'google_' || gen_random_uuid()::text, 'Sarah Johnson', 4.8, 'Excellent coffee!', 'Amazing coffee and friendly staff. The atmosphere is perfect for working or meeting friends.', NOW() - INTERVAL '5 days', 'female', '25-34'),
    (v_platform_connection_id, 'google_' || gen_random_uuid()::text, 'Mike Davis', 5.0, 'Great atmosphere', 'Great selection of beans and excellent service. The baristas really know their craft.', NOW() - INTERVAL '3 days', 'male', '35-44'),
    (v_platform_connection_id, 'google_' || gen_random_uuid()::text, 'Emily Chen', 4.5, 'Love this place', 'Love the cozy ambiance and quality drinks. The wifi is fast and seating is comfortable.', NOW() - INTERVAL '7 days', 'female', '25-34');
  
  -- Add sentiment for all reviews from this connection
  INSERT INTO sentiment_analysis (review_id, sentiment, sentiment_score, confidence, emotions)
  SELECT id, 'positive', 0.90, 0.95, '{"joy": 0.85, "trust": 0.75}'::jsonb
  FROM reviews WHERE platform_connection_id = v_platform_connection_id;

  -- Company 2: Tech Repair Pro  
  INSERT INTO companies (owner_id, name, description, industry, website)
  VALUES (v_user_id, 'Tech Repair Pro', 'Professional electronics repair service', 'Technology', 'https://techrepairpro.example.com')
  RETURNING id INTO v_company_id;
  
  INSERT INTO locations (company_id, name, address, city, state, country, postal_code)
  VALUES (v_company_id, 'Main Store', '789 Tech Ave', 'Austin', 'TX', 'USA', '78701')
  RETURNING id INTO v_location_id;
  
  INSERT INTO platform_connections (location_id, platform_id, platform_location_id, platform_url, last_sync_at)
  VALUES (v_location_id, v_platform_google, 'google_loc_' || gen_random_uuid()::text, 'https://google.com/maps', NOW() - INTERVAL '1 hour')
  RETURNING id INTO v_platform_connection_id;
  
  INSERT INTO reviews (platform_connection_id, external_id, author_name, rating, title, content, published_at, reviewer_gender, reviewer_age_range)
  VALUES 
    (v_platform_connection_id, 'google_' || gen_random_uuid()::text, 'John Smith', 4.7, 'Fast service', 'Fixed my phone quickly and professionally. Very satisfied with the service.', NOW() - INTERVAL '2 days', 'male', '35-44'),
    (v_platform_connection_id, 'google_' || gen_random_uuid()::text, 'Maria Garcia', 5.0, 'Reliable repairs', 'Great repair service! They diagnosed the issue immediately and fixed it within an hour.', NOW() - INTERVAL '4 days', 'female', '25-34'),
    (v_platform_connection_id, 'google_' || gen_random_uuid()::text, 'Robert Lee', 4.3, 'Professional work', 'Professional and efficient. My laptop works like new again.', NOW() - INTERVAL '6 days', 'male', '45-54');
  
  INSERT INTO sentiment_analysis (review_id, sentiment, sentiment_score, confidence, emotions)
  SELECT id, 'positive', 0.85, 0.92, '{"joy": 0.80, "trust": 0.85}'::jsonb
  FROM reviews WHERE platform_connection_id = v_platform_connection_id;

  RAISE NOTICE 'Sample data seeded. Continuing with remaining 18 companies...';

  -- Continue with abbreviated entries for remaining companies
  FOR v_review_counter IN 3..20 LOOP
    INSERT INTO companies (owner_id, name, description, industry, website)
    VALUES (
      v_user_id,
      (ARRAY[
        'Green Leaf Restaurant', 'FitLife Gym', 'Paws & Claws Pet Store',
        'Sunset Spa & Wellness', 'BookNook Library Cafe', 'AutoCare Services',
        'The Garden Center', 'SmartTech Solutions', 'Fresh Bites Deli',
        'Yoga Haven Studio', 'Kids Play Zone', 'Elegant Events Planning',
        'The Craft Beer House', 'Clean Home Services', 'Pizza Paradise',
        'Style & Cuts Salon', 'Music Academy Plus', 'Downtown Dental Care'
      ])[v_review_counter - 2],
      'Quality service and products',
      (ARRAY[
        'Food & Beverage', 'Health & Fitness', 'Retail', 'Health & Fitness',
        'Retail', 'Automotive', 'Retail', 'Technology', 'Food & Beverage',
        'Health & Fitness', 'Entertainment', 'Services', 'Food & Beverage',
        'Services', 'Food & Beverage', 'Beauty', 'Education', 'Healthcare'
      ])[v_review_counter - 2],
      'https://example.com'
    )
    RETURNING id INTO v_company_id;
    
    -- Add 1-2 locations per company
    FOR v_location_id IN 
      SELECT gen_random_uuid() 
      FROM generate_series(1, 1 + (v_review_counter % 2)) 
    LOOP
      INSERT INTO locations (company_id, name, address, city, state, country, postal_code)
      VALUES (
        v_company_id,
        'Location ' || v_review_counter,
        (v_review_counter * 100)::text || ' Main St',
        (ARRAY['Seattle', 'Portland', 'Denver', 'Boston', 'Chicago'])[1 + (v_review_counter % 5)],
        (ARRAY['WA', 'OR', 'CO', 'MA', 'IL'])[1 + (v_review_counter % 5)],
        'USA',
        (10000 + v_review_counter)::text
      )
      RETURNING id INTO v_location_id;
      
      INSERT INTO platform_connections (location_id, platform_id, platform_location_id, platform_url, last_sync_at)
      VALUES (v_location_id, v_platform_google, 'google_loc_' || gen_random_uuid()::text, 'https://google.com/maps', NOW() - INTERVAL '1 hour')
      RETURNING id INTO v_platform_connection_id;
      
      -- Add 3-5 reviews per location
      INSERT INTO reviews (platform_connection_id, external_id, author_name, rating, title, content, published_at, reviewer_gender, reviewer_age_range)
      SELECT 
        v_platform_connection_id,
        'google_' || gen_random_uuid()::text,
        (ARRAY['Alex J.', 'Sarah W.', 'Michael C.', 'Emma D.', 'David M.'])[gs],
        4.0 + (random() * 1.0),
        (ARRAY['Great service!', 'Highly recommend', 'Very satisfied', 'Excellent!', 'Good experience'])[gs],
        'Quality service and professional staff. Would definitely return!',
        NOW() - (gs || ' days')::INTERVAL,
        (ARRAY['male', 'female'])[1 + (gs % 2)],
        (ARRAY['18-24', '25-34', '35-44', '45-54', '55-64'])[1 + (gs % 5)]
      FROM generate_series(1, 3 + (v_review_counter % 3)) gs;
      
      -- Add sentiment analysis for reviews
      INSERT INTO sentiment_analysis (review_id, sentiment, sentiment_score, confidence, emotions)
      SELECT 
        id,
        CASE 
          WHEN rating >= 4.5 THEN 'positive'
          WHEN rating >= 3.5 THEN 'neutral'
          ELSE 'negative'
        END,
        (rating - 2.5) / 2.5,
        0.85 + (random() * 0.15),
        '{"joy": 0.75, "trust": 0.80}'::jsonb
      FROM reviews 
      WHERE platform_connection_id = v_platform_connection_id
      AND id NOT IN (SELECT review_id FROM sentiment_analysis);
    END LOOP;
  END LOOP;

END $$;

-- Re-enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_analysis ENABLE ROW LEVEL SECURITY;

-- Summary
DO $$
DECLARE
  v_company_count INTEGER;
  v_location_count INTEGER;
  v_review_count INTEGER;
  v_sentiment_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_company_count FROM companies WHERE owner_id = 'ec54834b-8176-424c-af1f-7e1c2614709e';
  SELECT COUNT(*) INTO v_location_count FROM locations l JOIN companies c ON l.company_id = c.id WHERE c.owner_id = 'ec54834b-8176-424c-af1f-7e1c2614709e';
  SELECT COUNT(*) INTO v_review_count FROM reviews r JOIN platform_connections pc ON r.platform_connection_id = pc.id JOIN locations l ON pc.location_id = l.id JOIN companies c ON l.company_id = c.id WHERE c.owner_id = 'ec54834b-8176-424c-af1f-7e1c2614709e';
  SELECT COUNT(*) INTO v_sentiment_count FROM sentiment_analysis sa JOIN reviews r ON sa.review_id = r.id JOIN platform_connections pc ON r.platform_connection_id = pc.id JOIN locations l ON pc.location_id = l.id JOIN companies c ON l.company_id = c.id WHERE c.owner_id = 'ec54834b-8176-424c-af1f-7e1c2614709e';
  
  RAISE NOTICE '=== SEEDING COMPLETE ===';
  RAISE NOTICE 'Companies: %', v_company_count;
  RAISE NOTICE 'Locations: %', v_location_count;
  RAISE NOTICE 'Reviews: %', v_review_count;
  RAISE NOTICE 'Sentiment Analysis: %', v_sentiment_count;
END $$;
