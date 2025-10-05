# Supabase Seed Data Migration

## Overview

The migration `20250105000014_seed_sample_data.sql` creates comprehensive sample data for testing and demonstration purposes. It automatically seeds your database with realistic review data once you have at least one authenticated user.

## What Gets Seeded

### 1. **Companies** (2 companies)

- **The Artisan Cafe** - A restaurant/cafe business
  - Industry: Restaurant & Cafe
  - 2 locations (Downtown and Westside)
- **TechHub Solutions** - A technology company
  - Industry: Technology
  - 1 location (Headquarters)

### 2. **Locations** (3 locations)

- Downtown Location (San Francisco)
- Westside Branch (San Francisco)
- Headquarters (Palo Alto)

### 3. **Platform Connections** (4 connections)

- Google Reviews for both Artisan Cafe locations
- Yelp for Downtown location
- Trustpilot for TechHub Solutions

### 4. **Reviews** (10 reviews)

All reviews are for The Artisan Cafe:

- **7 Positive reviews** (4.5-5.0 stars)
- **2 Neutral reviews** (3.5-4.0 stars)
- **1 Negative review** (2.5 stars)

Reviews include realistic content covering topics like:

- Coffee quality
- Service speed
- Atmosphere
- Pricing
- Pastries and food

### 5. **Sentiment Analysis** (10 analyses)

Each review has AI-style sentiment analysis including:

- Sentiment classification (positive/negative/neutral)
- Sentiment scores (-1.0 to 1.0)
- Confidence levels
- Emotion breakdowns (joy, trust, anger, etc.)

### 6. **Keywords** (15 keywords)

Categorized keywords extracted from reviews:

- **Food**: coffee, delicious, pastries
- **Service**: service, fast, slow, friendly
- **Ambiance**: atmosphere, wifi, cozy, crowded
- **Price**: price, overpriced
- **Quality**: quality, clean

### 7. **Topics** (3 topics)

Recurring themes identified across reviews:

- **Coffee Quality** (satisfaction) - 8 occurrences
- **Service Speed** (dissatisfaction) - 3 occurrences
- **Pricing** (neutral) - 2 occurrences

### 8. **Sync Logs** (3 logs)

Audit trail showing successful platform syncs

## Prerequisites

⚠️ **Important**: You must have at least one user signed up in your Supabase project before running this migration.

### How to Create a User

1. **Option 1: Sign up through your app**

   ```bash
   # Start your app
   cd reviews
   npm start

   # Navigate to /auth/signup and create an account
   ```

2. **Option 2: Use Supabase Dashboard**

   - Go to Authentication > Users
   - Click "Add user"
   - Enter email and password

3. **Option 3: Use Supabase CLI**
   ```bash
   # Create a test user
   supabase auth signup --email test@example.com --password testpass123
   ```

## Running the Migration

### Method 1: Supabase CLI (Recommended)

```bash
# Navigate to project root
cd /Users/besongsamuel/Workspace/oreo

# Apply the migration
supabase db push

# Or apply specific migration
supabase migration up
```

### Method 2: Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `20250105000014_seed_sample_data.sql`
4. Paste and run the SQL

### Method 3: Direct SQL

```bash
# Using psql
psql -h your-project.supabase.co -U postgres -d postgres -f supabase/migrations/20250105000014_seed_sample_data.sql
```

## Verification

After running the migration, you should see:

```sql
-- Check companies
SELECT COUNT(*) FROM companies; -- Should be 2+

-- Check reviews
SELECT COUNT(*) FROM reviews; -- Should be 10+

-- Check sentiment analysis
SELECT sentiment, COUNT(*)
FROM sentiment_analysis
GROUP BY sentiment;
-- Should show: positive: 7, neutral: 2, negative: 1

-- View dashboard data
SELECT * FROM company_stats;
SELECT * FROM recent_reviews LIMIT 5;
SELECT * FROM top_keywords LIMIT 10;
```

## What You'll See in the Dashboard

After seeding, your dashboard will display:

### Stats Cards

- **Total Reviews**: 10
- **Average Rating**: ~4.3
- **Positive Reviews**: 7
- **Negative Reviews**: 1

### Recent Reviews

List of 5 most recent reviews with:

- Author names
- Ratings (2.5 to 5.0)
- Review content
- Sentiment labels
- Platform sources

### Top Keywords

Frequently mentioned keywords:

- coffee (8 mentions)
- quality (5 mentions)
- service (4 mentions)
- atmosphere (3 mentions)
- etc.

### Companies Page

- The Artisan Cafe (2 locations, 10 reviews, 4.3★)
- TechHub Solutions (1 location, 0 reviews)

## Customization

### Adding More Data

To add more sample data, you can modify the migration or create a new one:

```sql
-- Example: Add more reviews
INSERT INTO reviews (platform_connection_id, external_id, author_name, rating, title, content, published_at)
VALUES
  (
    (SELECT id FROM platform_connections LIMIT 1),
    'custom_001',
    'Your Name',
    5.0,
    'Great experience',
    'Detailed review content here...',
    NOW()
  );
```

### Resetting Seed Data

To remove seed data and start fresh:

```sql
-- WARNING: This will delete ALL data
TRUNCATE reviews CASCADE;
TRUNCATE companies CASCADE;
TRUNCATE keywords CASCADE;
TRUNCATE topics CASCADE;
```

## Troubleshooting

### Error: "No users found in auth.users"

**Solution**: Sign up at least one user first through your app or Supabase dashboard.

### Error: "duplicate key value violates unique constraint"

**Solution**: The migration has already been run. To re-seed:

```sql
-- Delete existing seed data first
DELETE FROM companies WHERE name IN ('The Artisan Cafe', 'TechHub Solutions');
-- Then re-run the migration
```

### Data Not Appearing in Dashboard

**Checklist**:

1. ✅ Verify user is logged in
2. ✅ Check that seeded data belongs to logged-in user
3. ✅ Verify RLS policies are correct
4. ✅ Check browser console for errors

## Integration with Your App

The seeded data works seamlessly with your React app:

- **Dashboard**: Shows aggregated stats from `company_stats` view
- **Companies**: Lists companies from `companies` table
- **Recent Reviews**: Pulls from `recent_reviews` view
- **Top Keywords**: Displays from `top_keywords` view

All views and data are filtered by `owner_id` to ensure users only see their own data.

## Notes

- All seed data is owned by the first user in `auth.users`
- Timestamps are relative to migration run time
- External IDs are prefixed with platform name (e.g., 'google_001')
- Sentiment scores are realistic AI-style values
- Keywords are properly categorized for analysis
- Topics include occurrence counts and sentiment distributions

## Next Steps

After seeding:

1. ✅ Log in to your app
2. ✅ Navigate to Dashboard to see stats
3. ✅ Check Companies page to see The Artisan Cafe
4. ✅ View individual reviews and their sentiment
5. ✅ Explore keywords and topics
6. 🎉 Start building features with real data!

---

**Migration File**: `supabase/migrations/20250105000014_seed_sample_data.sql`  
**Created**: January 5, 2025  
**Compatible with**: Supabase PostgreSQL 15+
