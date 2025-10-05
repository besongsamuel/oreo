-- Row Level Security Policies

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- COMPANIES POLICIES
-- ============================================================================

CREATE POLICY "Users can view own companies" ON companies
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create companies" ON companies
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own companies" ON companies
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own companies" ON companies
  FOR DELETE USING (auth.uid() = owner_id);

-- ============================================================================
-- LOCATIONS POLICIES
-- ============================================================================

CREATE POLICY "Users can view locations of own companies" ON locations
  FOR SELECT USING (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can create locations for own companies" ON locations
  FOR INSERT WITH CHECK (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can update locations of own companies" ON locations
  FOR UPDATE USING (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can delete locations of own companies" ON locations
  FOR DELETE USING (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

-- ============================================================================
-- PLATFORMS POLICIES (public read)
-- ============================================================================

CREATE POLICY "Anyone authenticated can view platforms" ON platforms
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PLATFORM_CONNECTIONS POLICIES
-- ============================================================================

CREATE POLICY "Users can view platform connections of own locations" ON platform_connections
  FOR SELECT USING (
    location_id IN (
      SELECT l.id FROM locations l
      JOIN companies c ON c.id = l.company_id
      WHERE c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create platform connections for own locations" ON platform_connections
  FOR INSERT WITH CHECK (
    location_id IN (
      SELECT l.id FROM locations l
      JOIN companies c ON c.id = l.company_id
      WHERE c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update platform connections of own locations" ON platform_connections
  FOR UPDATE USING (
    location_id IN (
      SELECT l.id FROM locations l
      JOIN companies c ON c.id = l.company_id
      WHERE c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete platform connections of own locations" ON platform_connections
  FOR DELETE USING (
    location_id IN (
      SELECT l.id FROM locations l
      JOIN companies c ON c.id = l.company_id
      WHERE c.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- REVIEWS POLICIES
-- ============================================================================

CREATE POLICY "Users can view reviews of own companies" ON reviews
  FOR SELECT USING (
    platform_connection_id IN (
      SELECT pc.id FROM platform_connections pc
      JOIN locations l ON l.id = pc.location_id
      JOIN companies c ON c.id = l.company_id
      WHERE c.owner_id = auth.uid()
    )
  );

CREATE POLICY "System can insert reviews" ON reviews
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- SENTIMENT_ANALYSIS POLICIES
-- ============================================================================

CREATE POLICY "Users can view sentiment analysis of own reviews" ON sentiment_analysis
  FOR SELECT USING (
    review_id IN (
      SELECT r.id FROM reviews r
      JOIN platform_connections pc ON pc.id = r.platform_connection_id
      JOIN locations l ON l.id = pc.location_id
      JOIN companies c ON c.id = l.company_id
      WHERE c.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- KEYWORDS POLICIES (public read for authenticated users)
-- ============================================================================

CREATE POLICY "Authenticated users can view keywords" ON keywords
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- REVIEW_KEYWORDS POLICIES
-- ============================================================================

CREATE POLICY "Users can view review keywords of own reviews" ON review_keywords
  FOR SELECT USING (
    review_id IN (
      SELECT r.id FROM reviews r
      JOIN platform_connections pc ON pc.id = r.platform_connection_id
      JOIN locations l ON l.id = pc.location_id
      JOIN companies c ON c.id = l.company_id
      WHERE c.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- TOPICS POLICIES
-- ============================================================================

CREATE POLICY "Users can view topics of own companies" ON topics
  FOR SELECT USING (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can manage topics of own companies" ON topics
  FOR ALL USING (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

-- ============================================================================
-- REVIEW_TOPICS POLICIES
-- ============================================================================

CREATE POLICY "Users can view review topics of own reviews" ON review_topics
  FOR SELECT USING (
    review_id IN (
      SELECT r.id FROM reviews r
      JOIN platform_connections pc ON pc.id = r.platform_connection_id
      JOIN locations l ON l.id = pc.location_id
      JOIN companies c ON c.id = l.company_id
      WHERE c.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- REPORTS POLICIES
-- ============================================================================

CREATE POLICY "Users can view reports of own companies" ON reports
  FOR SELECT USING (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can create reports for own companies" ON reports
  FOR INSERT WITH CHECK (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can update reports of own companies" ON reports
  FOR UPDATE USING (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

-- ============================================================================
-- REPORT_SCHEDULES POLICIES
-- ============================================================================

CREATE POLICY "Users can manage report schedules of own companies" ON report_schedules
  FOR ALL USING (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

-- ============================================================================
-- SYNC_LOGS POLICIES
-- ============================================================================

CREATE POLICY "Users can view sync logs of own platform connections" ON sync_logs
  FOR SELECT USING (
    platform_connection_id IN (
      SELECT pc.id FROM platform_connections pc
      JOIN locations l ON l.id = pc.location_id
      JOIN companies c ON c.id = l.company_id
      WHERE c.owner_id = auth.uid()
    )
  );
