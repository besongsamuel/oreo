-- Add INSERT policy for sync_logs table
-- Allows authenticated users to create sync logs for platform connections
-- that belong to companies they own

CREATE POLICY "Users can create sync logs for own platform connections" ON sync_logs
  FOR INSERT WITH CHECK (
    platform_connection_id IN (
      SELECT pc.id FROM platform_connections pc
      JOIN locations l ON l.id = pc.location_id
      JOIN companies c ON c.id = l.company_id
      WHERE c.owner_id = auth.uid()
    )
  );
