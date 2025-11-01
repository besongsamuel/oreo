# Platform Logo Scraper

This script scrapes platform logos from https://zembratech.com/supported-platforms/, downloads them, uploads to Supabase storage, and updates the database.

## Prerequisites

- Node.js installed (v16+)
- Supabase project configured
- Storage bucket `platform_company_logos` created (see migration)

## Setup

1. Install dependencies:

```bash
cd scripts
npm install
```

2. Create `.env` file:

```bash
cp .env.example .env
```

3. Fill in your Supabase credentials in `.env`:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Important**: The service role key has admin privileges. Keep it secure and never commit it to version control.

## Usage

### Command Line

Run the script:

```bash
node fetch-platform-logos.js
```

Or using npm:

```bash
npm run fetch-logos
```

### VS Code

You can also run the script directly from VS Code:

1. Open the Run and Debug panel (Ctrl+Shift+D / Cmd+Shift+D)
2. Select "Run Platform Logo Scraper (from .env)" from the dropdown
3. Press F5 or click the play button

The VS Code launch configuration will:

- Use environment variables from `scripts/.env` file (recommended)
- Or use workspace environment variables if available

**Note**: Make sure your `.env` file exists in the `scripts/` directory with your Supabase credentials.

## What It Does

1. Fetches all active platforms from your database
2. Scrapes the Zembra supported platforms page
3. For each platform:
   - Matches Zembra platform name to database platform
   - Downloads the logo image
   - Uploads to Supabase storage bucket `platform_company_logos`
   - Updates `platforms.icon_url` with the public URL

## Storage Structure

Platform logos are stored with the platform name as the file key:

- `google.png`
- `facebook.svg`
- `yelp.png`
- etc.

## Output

The script provides:

- Progress indicators for each platform
- Success/failure status for each operation
- Summary report with statistics
- List of unmatched platforms (for manual review)

## Error Handling

The script will:

- Skip platforms that can't be matched
- Continue processing if one platform fails
- Log all errors for review
- Provide a comprehensive summary at the end

## Rate Limiting

The script includes a 500ms delay between requests to avoid overwhelming the Zembra server.
