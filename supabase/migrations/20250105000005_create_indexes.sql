-- Create indexes for optimal query performance

-- Companies
CREATE INDEX IF NOT EXISTS idx_companies_owner ON companies(owner_id);

-- Locations
CREATE INDEX IF NOT EXISTS idx_locations_company ON locations(company_id);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);
CREATE INDEX IF NOT EXISTS idx_locations_country ON locations(country);

-- Platform connections
CREATE INDEX IF NOT EXISTS idx_platform_connections_location ON platform_connections(location_id);
CREATE INDEX IF NOT EXISTS idx_platform_connections_platform ON platform_connections(platform_id);
CREATE INDEX IF NOT EXISTS idx_platform_connections_active ON platform_connections(is_active) WHERE is_active = true;

-- Reviews
CREATE INDEX IF NOT EXISTS idx_reviews_platform_connection ON reviews(platform_connection_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_published_at ON reviews(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_language ON reviews(language);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Sentiment analysis
CREATE INDEX IF NOT EXISTS idx_sentiment_review ON sentiment_analysis(review_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_type ON sentiment_analysis(sentiment);
CREATE INDEX IF NOT EXISTS idx_sentiment_score ON sentiment_analysis(sentiment_score);

-- Keywords
CREATE INDEX IF NOT EXISTS idx_keywords_normalized ON keywords(normalized_text);
CREATE INDEX IF NOT EXISTS idx_keywords_category ON keywords(category);
CREATE INDEX IF NOT EXISTS idx_keywords_language ON keywords(language);

-- Review keywords
CREATE INDEX IF NOT EXISTS idx_review_keywords_review ON review_keywords(review_id);
CREATE INDEX IF NOT EXISTS idx_review_keywords_keyword ON review_keywords(keyword_id);
CREATE INDEX IF NOT EXISTS idx_review_keywords_relevance ON review_keywords(relevance_score DESC);

-- Topics
CREATE INDEX IF NOT EXISTS idx_topics_company ON topics(company_id);
CREATE INDEX IF NOT EXISTS idx_topics_category ON topics(category);
CREATE INDEX IF NOT EXISTS idx_topics_occurrence ON topics(occurrence_count DESC);
CREATE INDEX IF NOT EXISTS idx_topics_active ON topics(is_active) WHERE is_active = true;

-- Review topics
CREATE INDEX IF NOT EXISTS idx_review_topics_review ON review_topics(review_id);
CREATE INDEX IF NOT EXISTS idx_review_topics_topic ON review_topics(topic_id);

-- Reports
CREATE INDEX IF NOT EXISTS idx_reports_company ON reports(company_id);
CREATE INDEX IF NOT EXISTS idx_reports_location ON reports(location_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by);
CREATE INDEX IF NOT EXISTS idx_reports_period ON reports(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);

-- Report schedules
CREATE INDEX IF NOT EXISTS idx_report_schedules_company ON report_schedules(company_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_active ON report_schedules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run ON report_schedules(next_run_at) WHERE is_active = true;

-- Sync logs
CREATE INDEX IF NOT EXISTS idx_sync_logs_platform_connection ON sync_logs(platform_connection_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON sync_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);
