-- Apply comprehensive security policies and functions

-- Create comprehensive RLS policies
-- PROFILES: Strict user isolation
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RESEARCH SESSIONS: Complete user data isolation
CREATE POLICY "Users can view own sessions" ON research_sessions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON research_sessions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON research_sessions 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON research_sessions 
  FOR DELETE USING (auth.uid() = user_id);

-- QUERY SESSIONS: Complete user data isolation (for compatibility)
CREATE POLICY "Users can view own query sessions" ON query_sessions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own query sessions" ON query_sessions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own query sessions" ON query_sessions 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own query sessions" ON query_sessions 
  FOR DELETE USING (auth.uid() = user_id);

-- GRAPH DATA: Session-based access control
CREATE POLICY "Users can view graph data from their sessions" ON graph_data 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM research_sessions 
      WHERE research_sessions.id = graph_data.session_id 
      AND research_sessions.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM query_sessions 
      WHERE query_sessions.id = graph_data.session_id 
      AND query_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can modify graph data in their sessions" ON graph_data 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM research_sessions 
      WHERE research_sessions.id = graph_data.session_id 
      AND research_sessions.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM query_sessions 
      WHERE query_sessions.id = graph_data.session_id 
      AND query_sessions.user_id = auth.uid()
    )
  );

-- Session-based policies for related tables
CREATE POLICY "Users can view nodes from their sessions" ON graph_nodes 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM research_sessions 
      WHERE research_sessions.id = graph_nodes.session_id 
      AND research_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can modify nodes in their sessions" ON graph_nodes 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM research_sessions 
      WHERE research_sessions.id = graph_nodes.session_id 
      AND research_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view edges from their sessions" ON graph_edges 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM research_sessions 
      WHERE research_sessions.id = graph_edges.session_id 
      AND research_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can modify edges in their sessions" ON graph_edges 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM research_sessions 
      WHERE research_sessions.id = graph_edges.session_id 
      AND research_sessions.user_id = auth.uid()
    )
  );

-- STAGE EXECUTIONS: Session-based isolation
CREATE POLICY "Users can view stage executions from their sessions" ON stage_executions 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM research_sessions 
      WHERE research_sessions.id = stage_executions.session_id 
      AND research_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can modify stage executions in their sessions" ON stage_executions 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM research_sessions 
      WHERE research_sessions.id = stage_executions.session_id 
      AND research_sessions.user_id = auth.uid()
    )
  );

-- ERROR LOGS: User-specific with admin override
CREATE POLICY "Users can view their own error logs" ON error_logs 
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create error logs" ON error_logs 
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ACTIVITY LOGS: User-specific tracking
CREATE POLICY "Users can view their own activity" ON activity_logs 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can log user activity" ON activity_logs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- API USAGE: User-specific tracking
CREATE POLICY "Users can view their API usage" ON api_usage 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can track API usage" ON api_usage 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Apply policies to other tables  
CREATE POLICY "Users can view hypotheses from their sessions" ON hypotheses 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM research_sessions 
      WHERE research_sessions.id = hypotheses.session_id 
      AND research_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can modify hypotheses in their sessions" ON hypotheses 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM research_sessions 
      WHERE research_sessions.id = hypotheses.session_id 
      AND research_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view performance metrics from their sessions" ON performance_metrics 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM research_sessions 
      WHERE research_sessions.id = performance_metrics.session_id 
      AND research_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create performance metrics" ON performance_metrics 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM research_sessions 
      WHERE research_sessions.id = performance_metrics.session_id 
      AND research_sessions.user_id = auth.uid()
    )
  );