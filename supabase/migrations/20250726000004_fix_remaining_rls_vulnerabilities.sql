-- CRITICAL SECURITY FIX: Fix remaining RLS policy authorization bypasses
-- Date: July 26, 2025 
-- Issues: graph_data and profiles tables have complete authorization bypass with qual:true policies

-- =================================================================
-- FIX GRAPH_DATA TABLE AUTHORIZATION BYPASS
-- =================================================================

-- Drop the dangerous bypass policy
DROP POLICY IF EXISTS "Allow all graph_data operations" ON graph_data;

-- Create secure session-based policies for graph_data
CREATE POLICY "Users can view graph data of own sessions" ON graph_data
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM query_sessions 
    WHERE query_sessions.id = graph_data.session_id 
    AND query_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert graph data for own sessions" ON graph_data
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM query_sessions 
    WHERE query_sessions.id = graph_data.session_id 
    AND query_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update graph data of own sessions" ON graph_data
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM query_sessions 
    WHERE query_sessions.id = graph_data.session_id 
    AND query_sessions.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM query_sessions 
    WHERE query_sessions.id = graph_data.session_id 
    AND query_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete graph data of own sessions" ON graph_data
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM query_sessions 
    WHERE query_sessions.id = graph_data.session_id 
    AND query_sessions.user_id = auth.uid()
  )
);

-- =================================================================
-- FIX PROFILES TABLE AUTHORIZATION BYPASS
-- =================================================================

-- Drop the dangerous bypass policy
DROP POLICY IF EXISTS "Allow all profiles operations" ON profiles;

-- Create secure user-scoped policies for profiles
CREATE POLICY "Users can view own profile" ON profiles 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles 
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON profiles 
FOR DELETE USING (auth.uid() = user_id);

-- =================================================================
-- SECURITY VERIFICATION
-- =================================================================

-- Verify RLS is enabled on both tables
ALTER TABLE graph_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Log security fix
INSERT INTO public.migration_log (migration_name, applied_at, description) 
VALUES (
  '20250726000004_fix_remaining_rls_vulnerabilities',
  NOW(),
  'CRITICAL SECURITY FIX: Fixed remaining RLS authorization bypass vulnerabilities in graph_data and profiles tables. Replaced qual:true policies with proper user-scoped restrictions.'
) ON CONFLICT (migration_name) DO UPDATE SET 
  applied_at = NOW(),
  description = EXCLUDED.description;