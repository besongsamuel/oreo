-- Add platform_connection_id column to review_keywords table
ALTER TABLE review_keywords 
ADD COLUMN platform_connection_id UUID;

-- Add platform_connection_id column to review_topics table
ALTER TABLE review_topics 
ADD COLUMN platform_connection_id UUID;

-- Populate platform_connection_id for existing review_keywords
UPDATE review_keywords
SET platform_connection_id = (
    SELECT platform_connection_id 
    FROM reviews 
    WHERE reviews.id = review_keywords.review_id
);

-- Populate platform_connection_id for existing review_topics
UPDATE review_topics
SET platform_connection_id = (
    SELECT platform_connection_id 
    FROM reviews 
    WHERE reviews.id = review_topics.review_id
);

-- Make platform_connection_id NOT NULL after populating data
ALTER TABLE review_keywords 
ALTER COLUMN platform_connection_id SET NOT NULL;

ALTER TABLE review_topics 
ALTER COLUMN platform_connection_id SET NOT NULL;

-- Add foreign key constraints
ALTER TABLE review_keywords
ADD CONSTRAINT fk_review_keywords_platform_connection
FOREIGN KEY (platform_connection_id)
REFERENCES platform_connections(id)
ON DELETE CASCADE;

ALTER TABLE review_topics
ADD CONSTRAINT fk_review_topics_platform_connection
FOREIGN KEY (platform_connection_id)
REFERENCES platform_connections(id)
ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_review_keywords_platform_connection_id 
ON review_keywords(platform_connection_id);

CREATE INDEX idx_review_topics_platform_connection_id 
ON review_topics(platform_connection_id);

-- Add comments for documentation
COMMENT ON COLUMN review_keywords.platform_connection_id IS 'Foreign key to platform_connections table for efficient querying by platform connection instead of review IDs';
COMMENT ON COLUMN review_topics.platform_connection_id IS 'Foreign key to platform_connections table for efficient querying by platform connection instead of review IDs';

