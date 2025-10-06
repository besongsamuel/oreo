const { createClient } = require('./reviews/node_modules/@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables  
const dotenv = require('./reviews/node_modules/dotenv');
dotenv.config({ path: './reviews/.env' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Read the SQL file
    const sqlFile = fs.readFileSync(
      path.join(__dirname, 'supabase/seed_additional_data.sql'),
      'utf8'
    );

    console.log('📝 Executing SQL seed script...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlFile });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // Try alternative approach - split and execute statements
      console.log('\n🔄 Trying alternative execution method...');
      await seedDataAlternative();
    } else {
      console.log('✅ Database seeded successfully!');
      console.log(data);
    }
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

async function seedDataAlternative() {
  const userId = 'ec54834b-8176-424c-af1f-7e1c2614709e';
  
  console.log(`🔍 Seeding for user: ${userId}\n`);

  // Get platform IDs
  const { data: platforms } = await supabase
    .from('platforms')
    .select('id, name');
  
  const platformMap = {};
  platforms?.forEach(p => {
    platformMap[p.name] = p.id;
  });

  console.log('📦 Found platforms:', Object.keys(platformMap).join(', '));

  // Sample companies data
  const companies = [
    { name: 'Urban Coffee Roasters', description: 'Artisanal coffee shop', industry: 'Food & Beverage', locations: 2 },
    { name: 'Tech Repair Pro', description: 'Electronics repair service', industry: 'Technology', locations: 1 },
    { name: 'Green Leaf Restaurant', description: 'Farm-to-table dining', industry: 'Food & Beverage', locations: 3 },
    { name: 'FitLife Gym', description: '24/7 fitness center', industry: 'Health & Fitness', locations: 2 },
    { name: 'Paws & Claws Pet Store', description: 'Pet supplies and grooming', industry: 'Retail', locations: 2 },
    { name: 'Sunset Spa & Wellness', description: 'Luxury spa', industry: 'Health & Fitness', locations: 1 },
    { name: 'BookNook Library Cafe', description: 'Bookstore with coffee', industry: 'Retail', locations: 1 },
    { name: 'AutoCare Services', description: 'Auto repair and maintenance', industry: 'Automotive', locations: 2 },
    { name: 'The Garden Center', description: 'Plants and landscaping', industry: 'Retail', locations: 1 },
    { name: 'SmartTech Solutions', description: 'IT consulting', industry: 'Technology', locations: 1 },
    { name: 'Fresh Bites Deli', description: 'Gourmet sandwiches', industry: 'Food & Beverage', locations: 2 },
    { name: 'Yoga Haven Studio', description: 'Yoga classes', industry: 'Health & Fitness', locations: 1 },
    { name: 'Kids Play Zone', description: 'Indoor playground', industry: 'Entertainment', locations: 2 },
    { name: 'Elegant Events Planning', description: 'Event planning', industry: 'Services', locations: 1 },
    { name: 'The Craft Beer House', description: 'Craft brewery', industry: 'Food & Beverage', locations: 2 },
    { name: 'Clean Home Services', description: 'Professional cleaning', industry: 'Services', locations: 1 },
    { name: 'Pizza Paradise', description: 'Wood-fired pizza', industry: 'Food & Beverage', locations: 3 },
    { name: 'Style & Cuts Salon', description: 'Hair salon', industry: 'Beauty', locations: 2 },
    { name: 'Music Academy Plus', description: 'Music lessons', industry: 'Education', locations: 1 },
    { name: 'Downtown Dental Care', description: 'Family dentistry', industry: 'Healthcare', locations: 2 },
  ];

  const cities = ['San Francisco', 'Austin', 'Seattle', 'Portland', 'Denver', 'Boston', 'Chicago', 'Miami', 'Dallas', 'Phoenix'];
  const states = ['CA', 'TX', 'WA', 'OR', 'CO', 'MA', 'IL', 'FL', 'TX', 'AZ'];
  
  const reviewTemplates = [
    { title: 'Excellent service!', content: 'Amazing experience with friendly and professional staff. Highly recommended!', rating: 5.0, sentiment: 'positive', score: 0.95 },
    { title: 'Great quality', content: 'Top-notch service and quality. Will definitely come back!', rating: 5.0, sentiment: 'positive', score: 0.90 },
    { title: 'Very satisfied', content: 'Professional service and great attention to detail. Very happy with the results.', rating: 4.5, sentiment: 'positive', score: 0.85 },
    { title: 'Good experience', content: 'Good service overall. Staff was helpful and knowledgeable.', rating: 4.0, sentiment: 'positive', score: 0.75 },
    { title: 'Nice place', content: 'Pleasant experience. Clean facility and friendly atmosphere.', rating: 4.0, sentiment: 'positive', score: 0.70 },
    { title: 'Pretty good', content: 'Decent service, nothing extraordinary but gets the job done.', rating: 3.5, sentiment: 'neutral', score: 0.50 },
    { title: 'Could be better', content: 'Service was okay but there is room for improvement. Staff could be more attentive.', rating: 3.0, sentiment: 'neutral', score: 0.30 },
    { title: 'Disappointed', content: 'Expected more based on the reviews. Service was lacking and wait time was long.', rating: 2.0, sentiment: 'negative', score: -0.60 },
  ];

  const names = ['Alex Johnson', 'Sarah Williams', 'Michael Chen', 'Emma Davis', 'David Martinez', 'Lisa Anderson', 'James Wilson', 'Maria Garcia', 'Robert Brown', 'Jennifer Taylor'];
  const genders = ['male', 'female', 'male', 'female', 'male', 'female', 'male', 'female', 'male', 'female'];
  const ageRanges = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];

  let totalReviews = 0;

  for (let i = 0; i < companies.length; i++) {
    const companyData = companies[i];
    const cityIndex = i % cities.length;
    
    console.log(`\n🏢 Creating company ${i + 1}/20: ${companyData.name}`);

    // Create company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        owner_id: userId,
        name: companyData.name,
        description: companyData.description,
        industry: companyData.industry,
        website: `https://${companyData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.example.com`
      })
      .select()
      .single();

    if (companyError) {
      console.error(`❌ Error creating company: ${companyError.message}`);
      continue;
    }

    console.log(`   ✓ Company created`);

    // Create locations
    for (let j = 0; j < companyData.locations; j++) {
      const { data: location, error: locationError } = await supabase
        .from('locations')
        .insert({
          company_id: company.id,
          name: `Location ${j + 1}`,
          address: `${(j + 1) * 100} Main St`,
          city: cities[cityIndex],
          state: states[cityIndex],
          country: 'USA',
          postal_code: `${10000 + i * 100 + j}`
        })
        .select()
        .single();

      if (locationError) {
        console.error(`   ❌ Error creating location: ${locationError.message}`);
        continue;
      }

      console.log(`   ✓ Location ${j + 1} created`);

      // Create platform connection (use google by default)
      const platformId = platformMap['google'] || platformMap[Object.keys(platformMap)[0]];
      
      const { data: connection, error: connectionError } = await supabase
        .from('platform_connections')
        .insert({
          location_id: location.id,
          platform_id: platformId,
          platform_location_id: `google_loc_${Date.now()}_${i}_${j}`,
          platform_url: 'https://google.com/maps',
          last_sync_at: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
        })
        .select()
        .single();

      if (connectionError) {
        console.error(`   ❌ Error creating platform connection: ${connectionError.message}`);
        continue;
      }

      // Create 5-8 reviews per location
      const numReviews = 5 + Math.floor(Math.random() * 4);
      
      for (let k = 0; k < numReviews; k++) {
        const template = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
        const nameIndex = (i + j + k) % names.length;
        
        const reviewData = {
          platform_connection_id: connection.id,
          external_id: `google_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          author_name: names[nameIndex],
          rating: template.rating + (Math.random() * 0.3 - 0.15),
          title: template.title,
          content: template.content,
          published_at: new Date(Date.now() - Math.random() * 86400000 * 60).toISOString(),
          reviewer_gender: genders[nameIndex],
          reviewer_age_range: ageRanges[Math.floor(Math.random() * ageRanges.length)]
        };

        const { data: review, error: reviewError } = await supabase
          .from('reviews')
          .insert(reviewData)
          .select()
          .single();

        if (reviewError) {
          console.error(`   ❌ Error creating review: ${reviewError.message}`);
          continue;
        }

        // Add sentiment analysis
        const { error: sentimentError } = await supabase
          .from('sentiment_analysis')
          .insert({
            review_id: review.id,
            sentiment: template.sentiment,
            sentiment_score: template.score + (Math.random() * 0.1 - 0.05),
            confidence: 0.85 + Math.random() * 0.15,
            emotions: { joy: Math.random(), trust: Math.random(), anticipation: Math.random() }
          });

        if (sentimentError) {
          console.error(`   ❌ Error creating sentiment: ${sentimentError.message}`);
        }

        totalReviews++;
      }

      console.log(`   ✓ ${numReviews} reviews created for location ${j + 1}`);
    }
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`📊 Summary:`);
  console.log(`   - Companies: ${companies.length}`);
  console.log(`   - Total reviews: ${totalReviews}`);
}

// Run the seeding
seedDatabase();
