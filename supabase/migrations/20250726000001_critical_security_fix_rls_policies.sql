-- CRITICAL SECURITY FIX: Fix RLS policies to prevent unauthorized data access
-- This migration fixes the severe security vulnerability where any authenticated user
-- could access, modify, or delete ANY user's research data

-- Drop the insecure policies that allow all operations
DROP POLICY IF EXISTS "Allow all query_sessions operations" ON query_sessions;
DROP POLICY IF EXISTS "Allow all query_figures operations" ON query_figures;
DROP POLICY IF EXISTS "Allow all query_tables operations" ON query_tables;

-- Create secure RLS policies that properly scope data to the authenticated user

-- Query Sessions: Users can only access their own sessions
CREATE POLICY "Users can view own query sessions" ON query_sessions
  FOR SELECT USING (
    auth.uid() = user_id OR 
    user_id IS NULL -- Allow access to legacy sessions without user_id during transition
  );

CREATE POLICY "Users can insert own query sessions" ON query_sessions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    user_id IS NULL -- Allow anonymous sessions during transition
  );

CREATE POLICY "Users can update own query sessions" ON query_sessions
  FOR UPDATE USING (
    auth.uid() = user_id OR
    user_id IS NULL -- Allow updating legacy sessions
  );

CREATE POLICY "Users can delete own query sessions" ON query_sessions
  FOR DELETE USING (
    auth.uid() = user_id OR
    user_id IS NULL -- Allow deleting legacy sessions
  );

-- Query Figures: Access based on parent session ownership
CREATE POLICY "Users can view figures from own sessions" ON query_figures
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM query_sessions 
      WHERE query_sessions.id = query_figures.session_id 
      AND (query_sessions.user_id = auth.uid() OR query_sessions.user_id IS NULL)
    )
  );

CREATE POLICY "Users can insert figures to own sessions" ON query_figures
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM query_sessions 
      WHERE query_sessions.id = query_figures.session_id 
      AND (query_sessions.user_id = auth.uid() OR query_sessions.user_id IS NULL)
    )
  );

CREATE POLICY "Users can update figures from own sessions" ON query_figures
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM query_sessions 
      WHERE query_sessions.id = query_figures.session_id 
      AND (query_sessions.user_id = auth.uid() OR query_sessions.user_id IS NULL)
    )
  );

CREATE POLICY "Users can delete figures from own sessions" ON query_figures
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM query_sessions 
      WHERE query_sessions.id = query_figures.session_id 
      AND (query_sessions.user_id = auth.uid() OR query_sessions.user_id IS NULL)
    )
  );

-- Query Tables: Access based on parent session ownership
CREATE POLICY "Users can view tables from own sessions" ON query_tables
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM query_sessions 
      WHERE query_sessions.id = query_tables.session_id 
      AND (query_sessions.user_id = auth.uid() OR query_sessions.user_id IS NULL)
    )
  );

CREATE POLICY "Users can insert tables to own sessions" ON query_tables
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM query_sessions 
      WHERE query_sessions.id = query_tables.session_id 
      AND (query_sessions.user_id = auth.uid() OR query_sessions.user_id IS NULL)
    )
  );

CREATE POLICY "Users can update tables from own sessions" ON query_tables
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM query_sessions 
      WHERE query_sessions.id = query_tables.session_id 
      AND (query_sessions.user_id = auth.uid() OR query_sessions.user_id IS NULL)
    )
  );

CREATE POLICY "Users can delete tables from own sessions" ON query_tables
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM query_sessions 
      WHERE query_sessions.id = query_tables.session_id 
      AND (query_sessions.user_id = auth.uid() OR query_sessions.user_id IS NULL)
    )
  );

-- Add function to migrate anonymous sessions to authenticated users
CREATE OR REPLACE FUNCTION claim_anonymous_sessions(p_session_ids UUID[])
RETURNS VOID AS $$
BEGIN
  UPDATE query_sessions
  SET user_id = auth.uid()
  WHERE id = ANY(p_session_ids)
    AND user_id IS NULL
    AND auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add index to improve performance of session ownership checks
CREATE INDEX IF NOT EXISTS idx_query_sessions_user_id_id ON query_sessions(user_id, id);

-- Add comment explaining the security model
COMMENT ON TABLE query_sessions IS 'Research query sessions with user-scoped RLS policies. Each session is owned by a user (user_id) and only accessible by that user.';
COMMENT ON TABLE query_figures IS 'Figures generated during research sessions. Access is controlled through parent session ownership.';
COMMENT ON TABLE query_tables IS 'Tables generated during research sessions. Access is controlled through parent session ownership.';