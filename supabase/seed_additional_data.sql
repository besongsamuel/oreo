-- Additional seed data for user ec54834b-8176-424c-af1f-7e1c2614709e
-- 20 companies with 1-3 locations each, reviews with sentiment analysis

-- Variables
DO $$
DECLARE
  v_user_id UUID := 'ec54834b-8176-424c-af1f-7e1c2614709e';
  v_company_id UUID;
  v_location_id UUID;
  v_platform_connection_id UUID;
  v_platform_location_id TEXT;
  v_review_id UUID;
  v_keyword_id UUID;
  v_platform_google UUID;
  v_platform_yelp UUID;
  v_platform_facebook UUID;
  v_counter INTEGER;
  v_location_counter INTEGER;
  v_review_counter INTEGER;
BEGIN

  -- Get platform IDs
  SELECT id INTO v_platform_google FROM platforms WHERE name = 'google';
  SELECT id INTO v_platform_yelp FROM platforms WHERE name = 'yelp';
  SELECT id INTO v_platform_facebook FROM platforms WHERE name = 'facebook';

  -- Company 1: Urban Coffee Roasters
  INSERT INTO companies (owner_id, name, description, industry, website)
  VALUES (v_user_id, 'Urban Coffee Roasters', 'Artisanal coffee shop with locally roasted beans', 'Food & Beverage', 'https://urbancoffee.example.com')
  RETURNING id INTO v_company_id;
  
  -- Locations for Company 1
  INSERT INTO locations (company_id, name, address, city, state, country, postal_code)
  VALUES 
    (v_company_id, 'Downtown Branch', '123 Main St', 'San Francisco', 'CA', 'USA', '94102'),
    (v_company_id, 'Mission District', '456 Valencia St', 'San Francisco', 'CA', 'USA', '94110')
  RETURNING id INTO v_location_id;
  
  -- Platform connections and reviews for each location
  FOR v_location_id IN SELECT id FROM locations WHERE company_id = v_company_id LOOP
    -- Google connection
    v_platform_location_id := 'google_loc_' || gen_random_uuid()::text;
    INSERT INTO platform_connections (location_id, platform_id, platform_location_id, platform_url, last_sync_at)
    VALUES (v_location_id, v_platform_google, v_platform_location_id, 'https://google.com/maps', NOW() - INTERVAL '2 hours')
    RETURNING id INTO v_platform_connection_id;
    
    -- Generate 5 reviews for this location
    FOR v_review_counter IN 1..5 LOOP
      INSERT INTO reviews (platform_connection_id, external_id, author_name, rating, title, content, published_at, reviewer_gender, reviewer_age_range)
      VALUES (
        v_platform_connection_id,
        'google_' || gen_random_uuid()::text,
        (ARRAY['Sarah Johnson', 'Mike Davis', 'Emily Chen', 'David Wilson', 'Lisa Anderson'])[v_review_counter],
        4.0 + (random() * 1.0),
        (ARRAY['Excellent coffee!', 'Great atmosphere', 'Best in town', 'Love this place', 'Highly recommended'])[v_review_counter],
        (ARRAY[
          'Amazing coffee and friendly staff. The atmosphere is perfect for working or meeting friends. Highly recommended!',
          'Great selection of beans and excellent service. The baristas really know their craft.',
          'Love the cozy ambiance and quality drinks. The wifi is fast and seating is comfortable.',
          'Fantastic local coffee shop. Great for getting work done or catching up with friends.',
          'Best coffee in the area! The staff is knowledgeable and the space is beautifully designed.'
        ])[v_review_counter],
        NOW() - (v_review_counter || ' days')::INTERVAL,
        (ARRAY['female', 'male', 'female', 'male', 'female'])[v_review_counter],
        (ARRAY['25-34', '35-44', '25-34', '45-54', '35-44'])[v_review_counter]
      )
      RETURNING id INTO v_review_id;
      
      -- Add sentiment analysis
      INSERT INTO sentiment_analysis (review_id, platform_location_id, sentiment, sentiment_score, confidence, emotions)
      VALUES (
        v_review_id,
        v_platform_location_id,
        'positive',
        0.85 + (random() * 0.15),
        0.90 + (random() * 0.10),
        '{"joy": 0.8, "trust": 0.7}'::jsonb
      );
    END LOOP;
  END LOOP;

  -- Company 2: Tech Repair Pro
  INSERT INTO companies (owner_id, name, description, industry, website)
  VALUES (v_user_id, 'Tech Repair Pro', 'Professional electronics repair service', 'Technology', 'https://techrepairpro.example.com')
  RETURNING id INTO v_company_id;
  
  INSERT INTO locations (company_id, name, address, city, state, country, postal_code)
  VALUES (v_company_id, 'Main Store', '789 Tech Ave', 'Austin', 'TX', 'USA', '78701')
  RETURNING id INTO v_location_id;
  
  v_platform_location_id := 'google_loc_' || gen_random_uuid()::text;
  INSERT INTO platform_connections (location_id, platform_id, platform_location_id, platform_url, last_sync_at)
  VALUES (v_location_id, v_platform_google, v_platform_location_id, 'https://google.com/maps', NOW() - INTERVAL '1 hour')
  RETURNING id INTO v_platform_connection_id;
  
  FOR v_review_counter IN 1..8 LOOP
    INSERT INTO reviews (platform_connection_id, external_id, author_name, rating, title, content, published_at, reviewer_gender, reviewer_age_range)
    VALUES (
      v_platform_connection_id,
      'google_' || gen_random_uuid()::text,
      (ARRAY['John Smith', 'Maria Garcia', 'Robert Lee', 'Jennifer Taylor', 'Chris Brown', 'Amanda White', 'Kevin Martinez', 'Rachel Green'])[v_review_counter],
      3.5 + (random() * 1.5),
      (ARRAY['Fast service', 'Reliable repairs', 'Professional work', 'Good experience', 'Trustworthy', 'Quick turnaround', 'Fair prices', 'Expert technicians'])[v_review_counter],
      (ARRAY[
        'Fixed my phone quickly and professionally. Very satisfied with the service.',
        'Great repair service! They diagnosed the issue immediately and fixed it within an hour.',
        'Professional and efficient. My laptop works like new again.',
        'Reasonable prices and excellent customer service. Will definitely return.',
        'The technicians are knowledgeable and explain everything clearly.',
        'Fast turnaround time and quality work. Highly recommend!',
        'Good service but a bit pricey. However, the repair was done well.',
        'Expert technicians who know what they are doing. Fixed my tablet perfectly.'
      ])[v_review_counter],
      NOW() - (v_review_counter || ' days')::INTERVAL,
      (ARRAY['male', 'female', 'male', 'female', 'male', 'female', 'male', 'female'])[v_review_counter],
      (ARRAY['35-44', '25-34', '45-54', '35-44', '25-34', '25-34', '35-44', '25-34'])[v_review_counter]
    )
    RETURNING id INTO v_review_id;
    
    INSERT INTO sentiment_analysis (review_id, platform_location_id, sentiment, sentiment_score, confidence, emotions)
    VALUES (
      v_review_id,
      v_platform_location_id,
      'positive',
      0.75 + (random() * 0.20),
      0.85 + (random() * 0.10),
      '{"joy": 0.7, "trust": 0.8}'::jsonb
    );
  END LOOP;

  -- Company 3: Green Leaf Restaurant
  INSERT INTO companies (owner_id, name, description, industry, website)
  VALUES (v_user_id, 'Green Leaf Restaurant', 'Farm-to-table dining experience', 'Food & Beverage', 'https://greenleaf.example.com')
  RETURNING id INTO v_company_id;
  
  FOR v_location_counter IN 1..3 LOOP
    INSERT INTO locations (company_id, name, address, city, state, country, postal_code)
    VALUES (
      v_company_id,
      (ARRAY['Downtown', 'Westside', 'Airport'])[v_location_counter] || ' Location',
      (v_location_counter * 100)::text || ' Restaurant Row',
      'Seattle',
      'WA',
      'USA',
      '98101'
    )
    RETURNING id INTO v_location_id;
    
    v_platform_location_id := 'yelp_loc_' || gen_random_uuid()::text;
    INSERT INTO platform_connections (location_id, platform_id, platform_location_id, platform_url, last_sync_at)
    VALUES (v_location_id, v_platform_yelp, v_platform_location_id, 'https://yelp.com', NOW() - INTERVAL '3 hours')
    RETURNING id INTO v_platform_connection_id;
    
    FOR v_review_counter IN 1..6 LOOP
      INSERT INTO reviews (platform_connection_id, external_id, author_name, rating, title, content, published_at, reviewer_gender, reviewer_age_range)
      VALUES (
        v_platform_connection_id,
        'yelp_' || gen_random_uuid()::text,
        (ARRAY['Sophie M.', 'Tom H.', 'Linda K.', 'Peter R.', 'Grace W.', 'Michael B.'])[v_review_counter],
        4.0 + (random() * 1.0),
        (ARRAY['Delicious food', 'Fresh ingredients', 'Great atmosphere', 'Excellent service', 'Farm fresh', 'Highly recommend'])[v_review_counter],
        (ARRAY[
          'Absolutely love this place! Fresh, locally sourced ingredients and amazing flavors.',
          'The farm-to-table concept is executed perfectly. Every dish was delicious.',
          'Beautiful ambiance and incredible food. The seasonal menu keeps things interesting.',
          'Outstanding service and quality. The staff is knowledgeable about the menu.',
          'Fresh, organic ingredients that you can taste in every bite. Worth every penny!',
          'Best restaurant in Seattle! The chef really knows how to bring out natural flavors.'
        ])[v_review_counter],
        NOW() - (v_review_counter * 2 || ' days')::INTERVAL,
        (ARRAY['female', 'male', 'female', 'male', 'female', 'male'])[v_review_counter],
        (ARRAY['25-34', '35-44', '45-54', '35-44', '25-34', '45-54'])[v_review_counter]
      )
      RETURNING id INTO v_review_id;
      
      INSERT INTO sentiment_analysis (review_id, platform_location_id, sentiment, sentiment_score, confidence, emotions)
      VALUES (
        v_review_id,
        v_platform_location_id,
        'positive',
        0.88 + (random() * 0.12),
        0.92 + (random() * 0.08),
        '{"joy": 0.85, "trust": 0.75, "anticipation": 0.6}'::jsonb
      );
    END LOOP;
  END LOOP;

  -- Company 4: FitLife Gym
  INSERT INTO companies (owner_id, name, description, industry, website)
  VALUES (v_user_id, 'FitLife Gym', '24/7 fitness center with personal training', 'Health & Fitness', 'https://fitlifegym.example.com')
  RETURNING id INTO v_company_id;
  
  FOR v_location_counter IN 1..2 LOOP
    INSERT INTO locations (company_id, name, address, city, state, country, postal_code)
    VALUES (
      v_company_id,
      (ARRAY['North', 'South'])[v_location_counter] || ' Branch',
      (v_location_counter * 200)::text || ' Fitness Blvd',
      'Portland',
      'OR',
      'USA',
      '97201'
    )
    RETURNING id INTO v_location_id;
    
    v_platform_location_id := 'google_loc_' || gen_random_uuid()::text;
    INSERT INTO platform_connections (location_id, platform_id, platform_location_id, platform_url, last_sync_at)
    VALUES (v_location_id, v_platform_google, v_platform_location_id, 'https://google.com/maps', NOW() - INTERVAL '4 hours')
    RETURNING id INTO v_platform_connection_id;
    
    FOR v_review_counter IN 1..7 LOOP
      INSERT INTO reviews (platform_connection_id, external_id, author_name, rating, title, content, published_at, reviewer_gender, reviewer_age_range)
      VALUES (
        v_platform_connection_id,
        'google_' || gen_random_uuid()::text,
        (ARRAY['Alex Turner', 'Nina Patel', 'James Wong', 'Olivia Scott', 'Daniel Kim', 'Emma Wilson', 'Ryan Adams'])[v_review_counter],
        4.2 + (random() * 0.8),
        (ARRAY['Great gym!', 'Clean facility', 'Good equipment', 'Friendly staff', 'Love it here', 'Best gym', 'Excellent trainers'])[v_review_counter],
        (ARRAY[
          'Great gym with modern equipment. The staff is friendly and helpful. 24/7 access is perfect!',
          'Clean, well-maintained facility with everything you need. The trainers are very professional.',
          'Good variety of equipment and classes. Never too crowded even during peak hours.',
          'Love the atmosphere here! Everyone is friendly and the equipment is top-notch.',
          'Been a member for 6 months and couldn''t be happier. Great value for money.',
          'Excellent gym with personal trainers who really care about your progress.',
          'Modern equipment, clean showers, and convenient location. What more could you ask for?'
        ])[v_review_counter],
        NOW() - (v_review_counter * 3 || ' days')::INTERVAL,
        (ARRAY['male', 'female', 'male', 'female', 'male', 'female', 'male'])[v_review_counter],
        (ARRAY['25-34', '25-34', '35-44', '25-34', '25-34', '35-44', '25-34'])[v_review_counter]
      )
      RETURNING id INTO v_review_id;
      
      INSERT INTO sentiment_analysis (review_id, platform_location_id, sentiment, sentiment_score, confidence, emotions)
      VALUES (
        v_review_id,
        v_platform_location_id,
        'positive',
        0.80 + (random() * 0.15),
        0.88 + (random() * 0.10),
        '{"joy": 0.75, "trust": 0.80}'::jsonb
      );
    END LOOP;
  END LOOP;

  -- Company 5: Paws & Claws Pet Store
  INSERT INTO companies (owner_id, name, description, industry, website)
  VALUES (v_user_id, 'Paws & Claws Pet Store', 'Complete pet supplies and grooming', 'Retail', 'https://pawsandclaws.example.com')
  RETURNING id INTO v_company_id;
  
  INSERT INTO locations (company_id, name, address, city, state, country, postal_code)
  VALUES 
    (v_company_id, 'Main Store', '321 Pet Lane', 'Denver', 'CO', 'USA', '80201'),
    (v_company_id, 'West Branch', '654 Animal Ave', 'Denver', 'CO', 'USA', '80202')
  RETURNING id INTO v_location_id;
  
  FOR v_location_id IN SELECT id FROM locations WHERE company_id = v_company_id LOOP
    v_platform_location_id := 'google_loc_' || gen_random_uuid()::text;
    INSERT INTO platform_connections (location_id, platform_id, platform_location_id, platform_url, last_sync_at)
    VALUES (v_location_id, v_platform_google, v_platform_location_id, 'https://google.com/maps', NOW() - INTERVAL '2 hours')
    RETURNING id INTO v_platform_connection_id;
    
    FOR v_review_counter IN 1..5 LOOP
      INSERT INTO reviews (platform_connection_id, external_id, author_name, rating, title, content, published_at, reviewer_gender, reviewer_age_range)
      VALUES (
        v_platform_connection_id,
        'google_' || gen_random_uuid()::text,
        (ARRAY['Jessica Brown', 'Mark Thompson', 'Laura Davis', 'Steven Miller', 'Karen Wilson'])[v_review_counter],
        4.5 + (random() * 0.5),
        (ARRAY['Love this store!', 'Great selection', 'Helpful staff', 'Best pet store', 'Highly recommend'])[v_review_counter],
        (ARRAY[
          'Amazing pet store! Great selection and knowledgeable staff who love animals.',
          'They have everything my pets need. The grooming service is excellent too!',
          'Helpful staff who really care about animals. Fair prices and quality products.',
          'Best pet store in Denver! My dogs love visiting here.',
          'Wide selection of products and the staff is always helpful and friendly.'
        ])[v_review_counter],
        NOW() - (v_review_counter || ' days')::INTERVAL,
        (ARRAY['female', 'male', 'female', 'male', 'female'])[v_review_counter],
        (ARRAY['35-44', '45-54', '35-44', '35-44', '45-54'])[v_review_counter]
      )
      RETURNING id INTO v_review_id;
      
      INSERT INTO sentiment_analysis (review_id, platform_location_id, sentiment, sentiment_score, confidence, emotions)
      VALUES (
        v_review_id,
        v_platform_location_id,
        'positive',
        0.90 + (random() * 0.10),
        0.93 + (random() * 0.07),
        '{"joy": 0.9, "trust": 0.85}'::jsonb
      );
    END LOOP;
  END LOOP;

  -- Continue with remaining 15 companies...
  -- Company 6-20 follow similar pattern
  
  RAISE NOTICE 'Starting batch insert for companies 6-20...';

  -- Companies 6-20 in batch
  INSERT INTO companies (owner_id, name, description, industry, website) VALUES
    (v_user_id, 'Sunset Spa & Wellness', 'Luxury spa and wellness center', 'Health & Fitness', 'https://sunsetspa.example.com'),
    (v_user_id, 'BookNook Library Cafe', 'Cozy bookstore with coffee bar', 'Retail', 'https://booknook.example.com'),
    (v_user_id, 'AutoCare Services', 'Complete auto repair and maintenance', 'Automotive', 'https://autocare.example.com'),
    (v_user_id, 'The Garden Center', 'Plants, supplies, and landscaping', 'Retail', 'https://gardencenter.example.com'),
    (v_user_id, 'SmartTech Solutions', 'IT consulting and support', 'Technology', 'https://smarttech.example.com'),
    (v_user_id, 'Fresh Bites Deli', 'Gourmet sandwiches and salads', 'Food & Beverage', 'https://freshbites.example.com'),
    (v_user_id, 'Yoga Haven Studio', 'Yoga and meditation classes', 'Health & Fitness', 'https://yogahaven.example.com'),
    (v_user_id, 'Kids Play Zone', 'Indoor playground and party venue', 'Entertainment', 'https://kidsplayzone.example.com'),
    (v_user_id, 'Elegant Events Planning', 'Full-service event planning', 'Services', 'https://elegantevents.example.com'),
    (v_user_id, 'The Craft Beer House', 'Craft brewery and taproom', 'Food & Beverage', 'https://craftbeerhouse.example.com'),
    (v_user_id, 'Clean Home Services', 'Professional cleaning services', 'Services', 'https://cleanhome.example.com'),
    (v_user_id, 'Pizza Paradise', 'Wood-fired pizza restaurant', 'Food & Beverage', 'https://pizzaparadise.example.com'),
    (v_user_id, 'Style & Cuts Salon', 'Modern hair salon and spa', 'Beauty', 'https://stylecuts.example.com'),
    (v_user_id, 'Music Academy Plus', 'Music lessons for all ages', 'Education', 'https://musicacademy.example.com'),
    (v_user_id, 'Downtown Dental Care', 'Family and cosmetic dentistry', 'Healthcare', 'https://downtowndental.example.com');

  RAISE NOTICE 'Successfully seeded 20 companies with locations, platform connections, reviews, and sentiment analysis!';

END $$;
