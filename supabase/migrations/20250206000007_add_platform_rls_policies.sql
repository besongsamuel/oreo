-- Enable RLS on new platform tables
ALTER TABLE supported_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_platforms ENABLE ROW LEVEL SECURITY;

-- RLS policies for supported_platforms
-- All authenticated users can read active platforms
CREATE POLICY "Anyone can view active supported platforms"
  ON supported_platforms
  FOR SELECT
  USING (is_active = true);

-- Admins can view all platforms (active and inactive)
CREATE POLICY "Admins can view all supported platforms"
  ON supported_platforms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS policies for user_platforms
-- Users can view their own platform selections
CREATE POLICY "Users can view their own platform selections"
  ON user_platforms
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own platform selections
CREATE POLICY "Users can insert their own platform selections"
  ON user_platforms
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own platform selections
CREATE POLICY "Users can delete their own platform selections"
  ON user_platforms
  FOR DELETE
  USING (user_id = auth.uid());

-- Admins can view all user platform selections
CREATE POLICY "Admins can view all user platform selections"
  ON user_platforms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can insert platform selections for any user
CREATE POLICY "Admins can insert platform selections for any user"
  ON user_platforms
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can delete platform selections for any user
CREATE POLICY "Admins can delete platform selections for any user"
  ON user_platforms
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );









