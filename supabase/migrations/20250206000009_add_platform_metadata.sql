-- Add short_description columns to platforms table
-- These will be populated with data from Zembra website

ALTER TABLE platforms 
ADD COLUMN IF NOT EXISTS short_description_en TEXT,
ADD COLUMN IF NOT EXISTS short_description_fr TEXT;

COMMENT ON COLUMN platforms.short_description_en IS 'Short English description of the platform (extracted from Zembra website)';
COMMENT ON COLUMN platforms.short_description_fr IS 'Short French description of the platform (extracted from Zembra website)';
COMMENT ON COLUMN platforms.icon_url IS 'Platform logo/image URL (extracted from Zembra website)';

