# 🌱 Seed Data Instructions

The CLI is having issues showing the full error. Let's run the seed directly in Supabase SQL Editor for better visibility.

## Steps to Seed Your Database

### 1. **Go to Supabase SQL Editor**

- Open your Supabase project dashboard
- Click on **SQL Editor** in the left sidebar

### 2. **Copy the Seed Migration**

Open this file and copy ALL contents:

```
/Users/besongsamuel/Workspace/oreo/supabase/migrations/20250105000014_seed_sample_data.sql
```

### 3. **Paste and Run**

- Paste the entire SQL into the SQL Editor
- Click the **RUN** button (or press Cmd/Ctrl + Enter)

### 4. **Check Results**

You should see either:

- ✅ **SUCCESS**: "Sample data seeded successfully" messages
- ❌ **ERROR**: Clear error message showing exactly what's wrong

## If You See "No users found"

You need to sign up first:

1. Start your app:

   ```bash
   cd /Users/besongsamuel/Workspace/oreo/reviews
   npm start
   ```

2. Navigate to: `http://localhost:3000/auth/signup`

3. Create an account with:

   - Email: anything@example.com
   - Password: (at least 6 characters)

4. Then go back and run the seed SQL again

## After Successful Seeding

You'll have:

- ✅ 2 Companies (The Artisan Cafe, TechHub Solutions)
- ✅ 3 Locations
- ✅ 10 Reviews with realistic content
- ✅ 10 Sentiment analyses
- ✅ 15 Keywords
- ✅ 3 Topics

## Verify It Worked

Run this in SQL Editor:

```sql
SELECT
  (SELECT COUNT(*) FROM companies) as companies,
  (SELECT COUNT(*) FROM reviews) as reviews,
  (SELECT COUNT(*) FROM keywords) as keywords,
  (SELECT COUNT(*) FROM topics) as topics;
```

Should show:

- companies: 2
- reviews: 10
- keywords: 15
- topics: 3

## View in Your App

1. Go to: `http://localhost:3000/dashboard`
2. You should see:
   - **Total Reviews**: 10
   - **Average Rating**: ~4.3
   - **Recent Reviews** list with actual content
   - **Top Keywords** showing "coffee", "quality", "service", etc.

---

**Need Help?** If you get any errors in the SQL Editor, copy the exact error message and I can help fix it!
