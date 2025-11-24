-- Remove target_sentiment_score from company_objectives
-- This removes the sentiment score target feature from objectives

-- 1. Drop the column
ALTER TABLE company_objectives DROP COLUMN IF EXISTS target_sentiment_score;

-- 2. Remove comment
COMMENT ON TABLE company_objectives IS 'Company objectives with target ratings';

-- 3. Update calculate_objective_progress function to remove sentiment calculation
CREATE OR REPLACE FUNCTION calculate_objective_progress(p_objective_id UUID)
RETURNS DECIMAL(5, 2) AS $$
DECLARE
  v_objective company_objectives%ROWTYPE;
  v_current_rating DECIMAL(3, 2);
  v_rating_progress DECIMAL(5, 2) := 0;
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
  
  -- Calculate average progress
  IF v_total_targets > 0 THEN
    RETURN v_progress_sum / v_total_targets;
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_objective_progress(UUID) IS 'Calculates overall progress for an objective based on rating and keyword/topic targets';

