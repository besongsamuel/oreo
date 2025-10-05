-- Seed initial data

-- Insert default platforms
INSERT INTO platforms (name, display_name, base_url, icon_url) VALUES
  ('google', 'Google Reviews', 'https://www.google.com/maps', NULL),
  ('trustpilot', 'Trustpilot', 'https://www.trustpilot.com', NULL),
  ('opentable', 'OpenTable', 'https://www.opentable.com', NULL),
  ('yelp', 'Yelp', 'https://www.yelp.com', NULL),
  ('tripadvisor', 'TripAdvisor', 'https://www.tripadvisor.com', NULL),
  ('facebook', 'Facebook', 'https://www.facebook.com', NULL)
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE platforms IS 'Seeded with default review platforms';
