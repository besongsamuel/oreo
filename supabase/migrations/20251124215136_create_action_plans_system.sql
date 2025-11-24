-- Action Plans System
-- Creates new action_plans, action_plan_items, and action_plan_item_notes tables
-- Migrates existing objective_action_plans data
-- Adds status computation and RLS policies

-- Enable pgcrypto extension for hash functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create action_plans table
CREATE TABLE IF NOT EXISTS action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('objective', 'sentiment')),
  source_id UUID, -- objective_id when source_type='objective', null when source_type='sentiment'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  plan_markdown TEXT NOT NULL,
  input_hash TEXT NOT NULL UNIQUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE action_plans IS 'AI-generated action plans with structured items';
COMMENT ON COLUMN action_plans.company_id IS 'Company this action plan belongs to';
COMMENT ON COLUMN action_plans.source_type IS 'Type of action plan: objective or sentiment';
COMMENT ON COLUMN action_plans.source_id IS 'ID of source (objective_id for objective plans, null for sentiment)';
COMMENT ON COLUMN action_plans.name IS 'AI-generated name for the action plan';
COMMENT ON COLUMN action_plans.description IS 'AI-generated description for the action plan';
COMMENT ON COLUMN action_plans.plan_markdown IS 'Original markdown-formatted action plan';
COMMENT ON COLUMN action_plans.input_hash IS 'Hash of input parameters to prevent duplicates';
COMMENT ON COLUMN action_plans.metadata IS 'Additional metadata (year, timespan, filters, etc.)';
COMMENT ON COLUMN action_plans.status IS 'Computed status based on item statuses';

-- 2. Create action_plan_items table
CREATE TABLE IF NOT EXISTS action_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_plan_id UUID NOT NULL REFERENCES action_plans(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'completed')),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE action_plan_items IS 'Individual action items within an action plan';
COMMENT ON COLUMN action_plan_items.topic IS 'Topic/group this item belongs to';
COMMENT ON COLUMN action_plan_items.order_index IS 'Order within the topic';

-- 3. Create action_plan_item_notes table
CREATE TABLE IF NOT EXISTS action_plan_item_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_plan_item_id UUID NOT NULL REFERENCES action_plan_items(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE action_plan_item_notes IS 'Notes added by users to action plan items';

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_action_plans_company_id ON action_plans(company_id);
CREATE INDEX IF NOT EXISTS idx_action_plans_input_hash ON action_plans(input_hash);
CREATE INDEX IF NOT EXISTS idx_action_plans_source_type_id ON action_plans(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_action_plans_status ON action_plans(status);

CREATE INDEX IF NOT EXISTS idx_action_plan_items_action_plan_id ON action_plan_items(action_plan_id);
CREATE INDEX IF NOT EXISTS idx_action_plan_items_status ON action_plan_items(status);
CREATE INDEX IF NOT EXISTS idx_action_plan_items_topic ON action_plan_items(action_plan_id, topic, order_index);

CREATE INDEX IF NOT EXISTS idx_action_plan_item_notes_item_id ON action_plan_item_notes(action_plan_item_id);

-- 5. Create function to compute action_plan status
CREATE OR REPLACE FUNCTION compute_action_plan_status(plan_id UUID)
RETURNS TEXT AS $$
DECLARE
  item_count INTEGER;
  completed_count INTEGER;
  in_progress_count INTEGER;
BEGIN
  -- Get total item count
  SELECT COUNT(*) INTO item_count
  FROM action_plan_items
  WHERE action_plan_id = plan_id;

  -- If no items, return 'new'
  IF item_count = 0 THEN
    RETURN 'new';
  END IF;

  -- Count completed items
  SELECT COUNT(*) INTO completed_count
  FROM action_plan_items
  WHERE action_plan_id = plan_id AND status = 'completed';

  -- Count in_progress items
  SELECT COUNT(*) INTO in_progress_count
  FROM action_plan_items
  WHERE action_plan_id = plan_id AND status = 'in_progress';

  -- If all items are completed, return 'completed'
  IF completed_count = item_count THEN
    RETURN 'completed';
  END IF;

  -- If any item is in_progress, return 'in_progress'
  IF in_progress_count > 0 THEN
    RETURN 'in_progress';
  END IF;

  -- Otherwise, return 'new'
  RETURN 'new';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION compute_action_plan_status IS 'Computes action plan status based on item statuses';

-- 6. Create trigger function to update action_plan status
CREATE OR REPLACE FUNCTION update_action_plan_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the action_plan status and updated_at
  UPDATE action_plans
  SET 
    status = compute_action_plan_status(COALESCE(NEW.action_plan_id, OLD.action_plan_id)),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.action_plan_id, OLD.action_plan_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_action_plan_status IS 'Trigger function to update action_plan status when items change';

-- 7. Create triggers
CREATE TRIGGER update_action_plan_status_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON action_plan_items
  FOR EACH ROW
  EXECUTE FUNCTION update_action_plan_status();

-- 8. Enable RLS
ALTER TABLE action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_plan_item_notes ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for action_plans
-- Users can view action plans of their own companies
CREATE POLICY "Users can view action plans of own companies" ON action_plans
  FOR SELECT USING (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

-- Users can create action plans for their own companies
CREATE POLICY "Users can create action plans for own companies" ON action_plans
  FOR INSERT WITH CHECK (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

-- Users can update action plans of their own companies
CREATE POLICY "Users can update action plans of own companies" ON action_plans
  FOR UPDATE USING (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

-- Users can delete action plans of their own companies
CREATE POLICY "Users can delete action plans of own companies" ON action_plans
  FOR DELETE USING (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

-- Admin full access for action_plans
CREATE POLICY "admin_full_access_action_plans"
  ON action_plans
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 10. RLS Policies for action_plan_items
-- Users can view items of action plans they can view
CREATE POLICY "Users can view items of accessible action plans" ON action_plan_items
  FOR SELECT USING (
    action_plan_id IN (
      SELECT id FROM action_plans
      WHERE company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
    )
  );

-- Users can create items for action plans they can modify
CREATE POLICY "Users can create items for accessible action plans" ON action_plan_items
  FOR INSERT WITH CHECK (
    action_plan_id IN (
      SELECT id FROM action_plans
      WHERE company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
    )
  );

-- Users can update items of action plans they can modify
CREATE POLICY "Users can update items of accessible action plans" ON action_plan_items
  FOR UPDATE USING (
    action_plan_id IN (
      SELECT id FROM action_plans
      WHERE company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
    )
  );

-- Users can delete items of action plans they can modify
CREATE POLICY "Users can delete items of accessible action plans" ON action_plan_items
  FOR DELETE USING (
    action_plan_id IN (
      SELECT id FROM action_plans
      WHERE company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
    )
  );

-- Admin full access for action_plan_items
CREATE POLICY "admin_full_access_action_plan_items"
  ON action_plan_items
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 11. RLS Policies for action_plan_item_notes
-- Users can view notes of items they can view
CREATE POLICY "Users can view notes of accessible items" ON action_plan_item_notes
  FOR SELECT USING (
    action_plan_item_id IN (
      SELECT id FROM action_plan_items
      WHERE action_plan_id IN (
        SELECT id FROM action_plans
        WHERE company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
      )
    )
  );

-- Users can create notes for items they can view
CREATE POLICY "Users can create notes for accessible items" ON action_plan_item_notes
  FOR INSERT WITH CHECK (
    action_plan_item_id IN (
      SELECT id FROM action_plan_items
      WHERE action_plan_id IN (
        SELECT id FROM action_plans
        WHERE company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
      )
    )
    AND created_by = auth.uid()
  );

-- Users can update their own notes
CREATE POLICY "Users can update own notes" ON action_plan_item_notes
  FOR UPDATE USING (
    created_by = auth.uid()
    AND action_plan_item_id IN (
      SELECT id FROM action_plan_items
      WHERE action_plan_id IN (
        SELECT id FROM action_plans
        WHERE company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
      )
    )
  );

-- Users can delete their own notes
CREATE POLICY "Users can delete own notes" ON action_plan_item_notes
  FOR DELETE USING (
    created_by = auth.uid()
    AND action_plan_item_id IN (
      SELECT id FROM action_plan_items
      WHERE action_plan_id IN (
        SELECT id FROM action_plans
        WHERE company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
      )
    )
  );

-- Admin full access for action_plan_item_notes
CREATE POLICY "admin_full_access_action_plan_item_notes"
  ON action_plan_item_notes
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- 12. Migrate existing objective_action_plans data
DO $$
DECLARE
  old_plan RECORD;
  company_uuid UUID;
  input_hash_value TEXT;
  metadata_json JSONB;
BEGIN
  FOR old_plan IN 
    SELECT oap.*, co.company_id
    FROM objective_action_plans oap
    JOIN company_objectives co ON oap.objective_id = co.id
  LOOP
    -- Build metadata
    metadata_json := jsonb_build_object(
      'year', old_plan.year,
      'timespan', old_plan.timespan,
      'migrated', true
    );

    -- Generate input hash (objective_id + year + timespan, since we don't have review_ids in old data)
    -- For migrated plans, we'll use a hash that includes the old plan id to ensure uniqueness
    -- Use md5 as a simpler alternative (built-in, no extension needed)
    -- For production, this will be SHA-256 from the edge functions
    input_hash_value := md5(
      old_plan.objective_id::text || '|' || old_plan.year::text || '|' || old_plan.timespan || '|' || old_plan.id::text
    );

    -- Insert into action_plans
    INSERT INTO action_plans (
      company_id,
      source_type,
      source_id,
      name,
      description,
      plan_markdown,
      input_hash,
      metadata,
      status,
      created_at
    ) VALUES (
      old_plan.company_id,
      'objective',
      old_plan.objective_id,
      'Action Plan for ' || old_plan.year || ' ' || old_plan.timespan, -- Default name
      'Migrated action plan from objective', -- Default description
      old_plan.plan,
      input_hash_value,
      metadata_json,
      'new', -- All migrated plans start as 'new' since they have no items
      old_plan.created_at
    )
    ON CONFLICT (input_hash) DO NOTHING; -- Skip if hash already exists
  END LOOP;
END $$;

-- 13. Add updated_at trigger for action_plans
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_action_plans_updated_at
  BEFORE UPDATE ON action_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_action_plan_items_updated_at
  BEFORE UPDATE ON action_plan_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_action_plan_item_notes_updated_at
  BEFORE UPDATE ON action_plan_item_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

