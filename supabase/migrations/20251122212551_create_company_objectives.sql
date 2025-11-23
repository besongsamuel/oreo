-- Company Objectives Feature
-- Tables for tracking company objectives and their progress

-- Main Objectives Table
CREATE TABLE IF NOT EXISTS company_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  target_rating DECIMAL(3, 2) CHECK (target_rating >= 0 AND target_rating <= 5),
  target_sentiment_score DECIMAL(5, 4) CHECK (target_sentiment_score >= -1 AND target_sentiment_score <= 1),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'achieved', 'overdue')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

COMMENT ON TABLE company_objectives IS 'Company objectives with target ratings and sentiment scores';
COMMENT ON COLUMN company_objectives.target_rating IS 'Target average rating (0.00 to 5.00)';
COMMENT ON COLUMN company_objectives.target_sentiment_score IS 'Target sentiment score (-1.0 to 1.0)';

-- Keyword/Topic Objectives Table
CREATE TABLE IF NOT EXISTS objective_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID NOT NULL REFERENCES company_objectives(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('keyword', 'topic')),
  target_id UUID NOT NULL, -- References keywords.id or topics.id
  target_rating DECIMAL(3, 2) NOT NULL CHECK (target_rating >= 0 AND target_rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(objective_id, target_type, target_id)
);

COMMENT ON TABLE objective_targets IS 'Specific keyword or topic targets for objectives';
COMMENT ON COLUMN objective_targets.target_id IS 'References keywords.id or topics.id depending on target_type';

-- Constraint: Maximum 3 keyword objectives and 3 topic objectives per objective
CREATE OR REPLACE FUNCTION check_objective_targets_limit()
RETURNS TRIGGER AS $$
DECLARE
  keyword_count INTEGER;
  topic_count INTEGER;
BEGIN
  IF NEW.target_type = 'keyword' THEN
    SELECT COUNT(*) INTO keyword_count
    FROM objective_targets
    WHERE objective_id = NEW.objective_id AND target_type = 'keyword';
    
    IF keyword_count >= 3 THEN
      RAISE EXCEPTION 'Maximum of 3 keyword objectives allowed per objective';
    END IF;
  END IF;
  
  IF NEW.target_type = 'topic' THEN
    SELECT COUNT(*) INTO topic_count
    FROM objective_targets
    WHERE objective_id = NEW.objective_id AND target_type = 'topic';
    
    IF topic_count >= 3 THEN
      RAISE EXCEPTION 'Maximum of 3 topic objectives allowed per objective';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_objective_targets_limit
  BEFORE INSERT ON objective_targets
  FOR EACH ROW
  EXECUTE FUNCTION check_objective_targets_limit();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_company_objectives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_objectives_updated_at
  BEFORE UPDATE ON company_objectives
  FOR EACH ROW
  EXECUTE FUNCTION update_company_objectives_updated_at();

-- Function to get keyword current rating
CREATE OR REPLACE FUNCTION get_keyword_current_rating(
  p_company_id UUID,
  p_keyword_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS DECIMAL(3, 2) AS $$
DECLARE
  avg_rating DECIMAL(3, 2);
BEGIN
  SELECT COALESCE(AVG(r.rating), 0) INTO avg_rating
  FROM reviews r
  INNER JOIN review_keywords rk ON r.id = rk.review_id
  INNER JOIN platform_connections pc ON r.platform_connection_id = pc.id
  INNER JOIN locations l ON pc.location_id = l.id
  WHERE l.company_id = p_company_id
    AND rk.keyword_id = p_keyword_id
    AND r.published_at::DATE >= p_start_date
    AND r.published_at::DATE <= p_end_date;
  
  RETURN COALESCE(avg_rating, 0);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_keyword_current_rating(UUID, UUID, DATE, DATE) IS 'Gets average rating for a keyword within a date range for a company';

-- Function to get topic current rating
CREATE OR REPLACE FUNCTION get_topic_current_rating(
  p_company_id UUID,
  p_topic_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS DECIMAL(3, 2) AS $$
DECLARE
  avg_rating DECIMAL(3, 2);
BEGIN
  SELECT COALESCE(AVG(r.rating), 0) INTO avg_rating
  FROM reviews r
  INNER JOIN review_topics rt ON r.id = rt.review_id
  INNER JOIN platform_connections pc ON r.platform_connection_id = pc.id
  INNER JOIN locations l ON pc.location_id = l.id
  WHERE l.company_id = p_company_id
    AND rt.topic_id = p_topic_id
    AND r.published_at::DATE >= p_start_date
    AND r.published_at::DATE <= p_end_date;
  
  RETURN COALESCE(avg_rating, 0);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_topic_current_rating(UUID, UUID, DATE, DATE) IS 'Gets average rating for a topic within a date range for a company';

-- Function to calculate objective progress
CREATE OR REPLACE FUNCTION calculate_objective_progress(p_objective_id UUID)
RETURNS DECIMAL(5, 2) AS $$
DECLARE
  v_objective company_objectives%ROWTYPE;
  v_current_rating DECIMAL(3, 2);
  v_current_sentiment DECIMAL(5, 4);
  v_rating_progress DECIMAL(5, 2) := 0;
  v_sentiment_progress DECIMAL(5, 2) := 0;
  v_keyword_progress DECIMAL(5, 2) := 0;
  v_topic_progress DECIMAL(5, 2) := 0;
  v_total_targets INTEGER := 0;
  v_progress_sum DECIMAL(5, 2) := 0;
  rec RECORD;
BEGIN
  -- Get objective details
  SELECT * INTO v_objective
  FROM company_objectives
  WHERE id = p_objective_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Calculate general rating progress
  IF v_objective.target_rating IS NOT NULL THEN
    SELECT COALESCE(AVG(r.rating), 0) INTO v_current_rating
    FROM reviews r
    INNER JOIN platform_connections pc ON r.platform_connection_id = pc.id
    INNER JOIN locations l ON pc.location_id = l.id
    WHERE l.company_id = v_objective.company_id
      AND r.published_at::DATE >= v_objective.start_date
      AND r.published_at::DATE <= v_objective.end_date;
    
    IF v_objective.target_rating > 0 THEN
      v_rating_progress := LEAST((v_current_rating / v_objective.target_rating) * 100, 100);
      v_total_targets := v_total_targets + 1;
      v_progress_sum := v_progress_sum + v_rating_progress;
    END IF;
  END IF;
  
  -- Calculate general sentiment progress
  IF v_objective.target_sentiment_score IS NOT NULL THEN
    SELECT COALESCE(AVG(sa.sentiment_score), 0) INTO v_current_sentiment
    FROM sentiment_analysis sa
    INNER JOIN reviews r ON sa.review_id = r.id
    INNER JOIN platform_connections pc ON r.platform_connection_id = pc.id
    INNER JOIN locations l ON pc.location_id = l.id
    WHERE l.company_id = v_objective.company_id
      AND r.published_at::DATE >= v_objective.start_date
      AND r.published_at::DATE <= v_objective.end_date;
    
    -- Normalize sentiment score (-1 to 1) to 0-2 range for calculation
    IF v_objective.target_sentiment_score > -1 THEN
      v_sentiment_progress := LEAST(((v_current_sentiment + 1) / (v_objective.target_sentiment_score + 1)) * 100, 100);
      v_total_targets := v_total_targets + 1;
      v_progress_sum := v_progress_sum + v_sentiment_progress;
    END IF;
  END IF;
  
  -- Calculate keyword/topic progress
  FOR rec IN
    SELECT 
      ot.target_type,
      ot.target_id,
      ot.target_rating,
      CASE 
        WHEN ot.target_type = 'keyword' THEN
          get_keyword_current_rating(v_objective.company_id, ot.target_id, v_objective.start_date, v_objective.end_date)
        ELSE 0
      END as current_rating_keyword,
      CASE 
        WHEN ot.target_type = 'topic' THEN
          get_topic_current_rating(v_objective.company_id, ot.target_id, v_objective.start_date, v_objective.end_date)
        ELSE 0
      END as current_rating_topic
    FROM objective_targets ot
    WHERE ot.objective_id = p_objective_id
  LOOP
    IF rec.target_type = 'keyword' AND rec.current_rating_keyword > 0 AND rec.target_rating > 0 THEN
      v_keyword_progress := LEAST((rec.current_rating_keyword / rec.target_rating) * 100, 100);
      v_total_targets := v_total_targets + 1;
      v_progress_sum := v_progress_sum + v_keyword_progress;
    ELSIF rec.target_type = 'topic' AND rec.current_rating_topic > 0 AND rec.target_rating > 0 THEN
      v_topic_progress := LEAST((rec.current_rating_topic / rec.target_rating) * 100, 100);
      v_total_targets := v_total_targets + 1;
      v_progress_sum := v_progress_sum + v_topic_progress;
    END IF;
  END LOOP;
  
  -- Return average progress
  IF v_total_targets > 0 THEN
    RETURN v_progress_sum / v_total_targets;
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_objective_progress(UUID) IS 'Calculates overall progress percentage for an objective based on all targets';

-- Function to update objective status based on dates and progress
CREATE OR REPLACE FUNCTION update_objective_status()
RETURNS TRIGGER AS $$
DECLARE
  v_progress DECIMAL(5, 2);
  v_current_date DATE;
  v_new_status TEXT;
BEGIN
  v_current_date := CURRENT_DATE;
  v_progress := calculate_objective_progress(NEW.id);
  
  -- Determine status based on progress and dates
  IF v_progress >= 100 THEN
    v_new_status := 'achieved';
  ELSIF v_current_date < NEW.start_date THEN
    v_new_status := 'not_started';
  ELSIF v_current_date > NEW.end_date AND v_progress < 100 THEN
    v_new_status := 'overdue';
  ELSIF v_progress > 0 THEN
    v_new_status := 'in_progress';
  ELSE
    v_new_status := 'not_started';
  END IF;
  
  -- Only update if status changed
  IF NEW.status != v_new_status THEN
    NEW.status := v_new_status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update status on insert/update
CREATE TRIGGER update_objective_status_trigger
  BEFORE INSERT OR UPDATE ON company_objectives
  FOR EACH ROW
  EXECUTE FUNCTION update_objective_status();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_objectives_company_id_end_date 
  ON company_objectives(company_id, end_date);

CREATE INDEX IF NOT EXISTS idx_company_objectives_status_priority 
  ON company_objectives(status, priority);

CREATE INDEX IF NOT EXISTS idx_objective_targets_objective_id 
  ON objective_targets(objective_id);

CREATE INDEX IF NOT EXISTS idx_objective_targets_target_type_id 
  ON objective_targets(target_type, target_id);

-- Enable RLS
ALTER TABLE company_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE objective_targets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_objectives
-- Users can view objectives of their own companies
CREATE POLICY "Users can view objectives of own companies" ON company_objectives
  FOR SELECT USING (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

-- Users can create objectives for their own companies
CREATE POLICY "Users can create objectives for own companies" ON company_objectives
  FOR INSERT WITH CHECK (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

-- Users can update objectives of their own companies
CREATE POLICY "Users can update objectives of own companies" ON company_objectives
  FOR UPDATE USING (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

-- Users can delete objectives of their own companies
CREATE POLICY "Users can delete objectives of own companies" ON company_objectives
  FOR DELETE USING (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

-- Admin full access for company_objectives
CREATE POLICY "admin_full_access_company_objectives"
  ON company_objectives
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- RLS Policies for objective_targets
-- Users can view targets of objectives they can view
CREATE POLICY "Users can view targets of accessible objectives" ON objective_targets
  FOR SELECT USING (
    objective_id IN (
      SELECT id FROM company_objectives
      WHERE company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
    )
  );

-- Users can create targets for objectives they can modify
CREATE POLICY "Users can create targets for accessible objectives" ON objective_targets
  FOR INSERT WITH CHECK (
    objective_id IN (
      SELECT id FROM company_objectives
      WHERE company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
    )
  );

-- Users can update targets of objectives they can modify
CREATE POLICY "Users can update targets of accessible objectives" ON objective_targets
  FOR UPDATE USING (
    objective_id IN (
      SELECT id FROM company_objectives
      WHERE company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
    )
  );

-- Users can delete targets of objectives they can modify
CREATE POLICY "Users can delete targets of accessible objectives" ON objective_targets
  FOR DELETE USING (
    objective_id IN (
      SELECT id FROM company_objectives
      WHERE company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
    )
  );

-- Admin full access for objective_targets
CREATE POLICY "admin_full_access_objective_targets"
  ON objective_targets
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

