-- ===================================================================
-- ASR-GoT SUPABASE COMPLETE FIX SCRIPT
-- Execute this in Supabase Dashboard SQL Editor
-- Project: scientific-research (aogeenqytwrpjvrfwvjw)
-- URL: https://supabase.com/dashboard/project/aogeenqytwrpjvrfwvjw/sql
-- ===================================================================

-- 1. ADD MISSING COLUMNS TO EXISTING TABLES
-- ===================================================================

-- Add missing columns to research_sessions
DO $$ 
BEGIN
  -- Add current_stage column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'research_sessions' AND column_name = 'current_stage') THEN
    ALTER TABLE research_sessions ADD COLUMN current_stage INTEGER DEFAULT 1;
  END IF;
  
  -- Add research_question column if it doesn't exist  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'research_sessions' AND column_name = 'research_question') THEN
    ALTER TABLE research_sessions ADD COLUMN research_question TEXT;
  END IF;
  
  -- Add graph_data column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'research_sessions' AND column_name = 'graph_data') THEN
    ALTER TABLE research_sessions ADD COLUMN graph_data JSONB;
  END IF;
  
  -- Add stage_results column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'research_sessions' AND column_name = 'stage_results') THEN
    ALTER TABLE research_sessions ADD COLUMN stage_results JSONB;
  END IF;
  
  -- Add metadata column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'research_sessions' AND column_name = 'metadata') THEN
    ALTER TABLE research_sessions ADD COLUMN metadata JSONB;
  END IF;
  
  -- Add completed_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'research_sessions' AND column_name = 'completed_at') THEN
    ALTER TABLE research_sessions ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add missing columns to stage_executions
DO $$ 
BEGIN
  -- Add stage_name column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'stage_executions' AND column_name = 'stage_name') THEN
    ALTER TABLE stage_executions ADD COLUMN stage_name TEXT;
  END IF;
  
  -- Add stage_number column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'stage_executions' AND column_name = 'stage_number') THEN
    ALTER TABLE stage_executions ADD COLUMN stage_number INTEGER;
  END IF;
  
  -- Add started_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'stage_executions' AND column_name = 'started_at') THEN
    ALTER TABLE stage_executions ADD COLUMN started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  -- Add completed_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'stage_executions' AND column_name = 'completed_at') THEN
    ALTER TABLE stage_executions ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add results column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'stage_executions' AND column_name = 'results') THEN
    ALTER TABLE stage_executions ADD COLUMN results JSONB;
  END IF;
  
  -- Add error_message column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'stage_executions' AND column_name = 'error_message') THEN
    ALTER TABLE stage_executions ADD COLUMN error_message TEXT;
  END IF;
  
  -- Add duration_ms column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'stage_executions' AND column_name = 'duration_ms') THEN
    ALTER TABLE stage_executions ADD COLUMN duration_ms INTEGER;
  END IF;
END $$;

-- Add missing columns to graph_nodes
DO $$ 
BEGIN
  -- Add node_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'graph_nodes' AND column_name = 'node_id') THEN
    ALTER TABLE graph_nodes ADD COLUMN node_id TEXT NOT NULL DEFAULT '';
  END IF;
  
  -- Add label column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'graph_nodes' AND column_name = 'label') THEN
    ALTER TABLE graph_nodes ADD COLUMN label TEXT NOT NULL DEFAULT '';
  END IF;
  
  -- Add node_type column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'graph_nodes' AND column_name = 'node_type') THEN
    ALTER TABLE graph_nodes ADD COLUMN node_type TEXT NOT NULL DEFAULT '';
  END IF;
  
  -- Add confidence column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'graph_nodes' AND column_name = 'confidence') THEN
    ALTER TABLE graph_nodes ADD COLUMN confidence NUMERIC[] DEFAULT ARRAY[0.5, 0.5, 0.5, 0.5];
  END IF;
  
  -- Add position column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'graph_nodes' AND column_name = 'position') THEN
    ALTER TABLE graph_nodes ADD COLUMN position JSONB;
  END IF;
  
  -- Add metadata column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'graph_nodes' AND column_name = 'metadata') THEN
    ALTER TABLE graph_nodes ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- Add missing columns to graph_edges
DO $$ 
BEGIN
  -- Add edge_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'graph_edges' AND column_name = 'edge_id') THEN
    ALTER TABLE graph_edges ADD COLUMN edge_id TEXT NOT NULL DEFAULT '';
  END IF;
  
  -- Add source_node_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'graph_edges' AND column_name = 'source_node_id') THEN
    ALTER TABLE graph_edges ADD COLUMN source_node_id TEXT NOT NULL DEFAULT '';
  END IF;
  
  -- Add target_node_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'graph_edges' AND column_name = 'target_node_id') THEN
    ALTER TABLE graph_edges ADD COLUMN target_node_id TEXT NOT NULL DEFAULT '';
  END IF;
  
  -- Add edge_type column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'graph_edges' AND column_name = 'edge_type') THEN
    ALTER TABLE graph_edges ADD COLUMN edge_type TEXT NOT NULL DEFAULT '';
  END IF;
  
  -- Add confidence column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'graph_edges' AND column_name = 'confidence') THEN
    ALTER TABLE graph_edges ADD COLUMN confidence NUMERIC DEFAULT 0.5;
  END IF;
  
  -- Add bidirectional column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'graph_edges' AND column_name = 'bidirectional') THEN
    ALTER TABLE graph_edges ADD COLUMN bidirectional BOOLEAN DEFAULT false;
  END IF;
  
  -- Add metadata column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'graph_edges' AND column_name = 'metadata') THEN
    ALTER TABLE graph_edges ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- 2. ENSURE ALL TABLES HAVE REQUIRED FOREIGN KEYS AND CONSTRAINTS
-- ===================================================================

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
  -- Add user_id foreign key to research_sessions if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'research_sessions_user_id_fkey' 
                AND table_name = 'research_sessions') THEN
    -- First add the column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'research_sessions' AND column_name = 'user_id') THEN
      ALTER TABLE research_sessions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
  
  -- Add session_id foreign key to graph_nodes if it doesn't exist  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'graph_nodes' AND column_name = 'session_id') THEN
    ALTER TABLE graph_nodes ADD COLUMN session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE;
  END IF;
  
  -- Add session_id foreign key to graph_edges if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'graph_edges' AND column_name = 'session_id') THEN
    ALTER TABLE graph_edges ADD COLUMN session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE;
  END IF;
  
  -- Add session_id foreign key to stage_executions if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'stage_executions' AND column_name = 'session_id') THEN
    ALTER TABLE stage_executions ADD COLUMN session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. CREATE ESSENTIAL DATABASE FUNCTIONS
-- ===================================================================

-- Create health check function
CREATE OR REPLACE FUNCTION get_database_health()
RETURNS TABLE (
  metric_name TEXT,
  metric_value BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'total_users'::TEXT, COUNT(*)::BIGINT FROM auth.users
  UNION ALL
  SELECT 'total_sessions'::TEXT, COUNT(*)::BIGINT FROM research_sessions
  UNION ALL
  SELECT 'active_sessions_today'::TEXT, COUNT(*)::BIGINT FROM research_sessions 
    WHERE updated_at > CURRENT_DATE
  UNION ALL
  SELECT 'total_nodes'::TEXT, COUNT(*)::BIGINT FROM graph_nodes
  UNION ALL
  SELECT 'total_edges'::TEXT, COUNT(*)::BIGINT FROM graph_edges
  UNION ALL
  SELECT 'errors_last_24h'::TEXT, COUNT(*)::BIGINT FROM error_logs 
    WHERE created_at > NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create user profile trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CREATE TRIGGERS
-- ===================================================================

-- Add updated_at triggers to all relevant tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_research_sessions_updated_at ON research_sessions;
CREATE TRIGGER update_research_sessions_updated_at 
  BEFORE UPDATE ON research_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_graph_nodes_updated_at ON graph_nodes;
CREATE TRIGGER update_graph_nodes_updated_at 
  BEFORE UPDATE ON graph_nodes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_graph_edges_updated_at ON graph_edges;
CREATE TRIGGER update_graph_edges_updated_at 
  BEFORE UPDATE ON graph_edges 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 5. STRENGTHEN RLS POLICIES
-- ===================================================================

-- Ensure RLS is enabled on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hypotheses ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE bias_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_results ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own sessions" ON research_sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON research_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON research_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON research_sessions;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own sessions" ON research_sessions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON research_sessions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON research_sessions 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON research_sessions 
  FOR DELETE USING (auth.uid() = user_id);

-- Session-based policies for related tables
CREATE POLICY "Users can view nodes from their sessions" ON graph_nodes 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM research_sessions 
      WHERE research_sessions.id = graph_nodes.session_id 
      AND research_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create nodes in their sessions" ON graph_nodes 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM research_sessions 
      WHERE research_sessions.id = graph_nodes.session_id 
      AND research_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update nodes in their sessions" ON graph_nodes 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM research_sessions 
      WHERE research_sessions.id = graph_nodes.session_id 
      AND research_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete nodes from their sessions" ON graph_nodes 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM research_sessions 
      WHERE research_sessions.id = graph_nodes.session_id 
      AND research_sessions.user_id = auth.uid()
    )
  );

-- Similar policies for graph_edges
CREATE POLICY "Users can view edges from their sessions" ON graph_edges 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM research_sessions 
      WHERE research_sessions.id = graph_edges.session_id 
      AND research_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create edges in their sessions" ON graph_edges 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM research_sessions 
      WHERE research_sessions.id = graph_edges.session_id 
      AND research_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update edges in their sessions" ON graph_edges 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM research_sessions 
      WHERE research_sessions.id = graph_edges.session_id 
      AND research_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete edges from their sessions" ON graph_edges 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM research_sessions 
      WHERE research_sessions.id = graph_edges.session_id 
      AND research_sessions.user_id = auth.uid()
    )
  );

-- 6. CREATE PERFORMANCE INDEXES
-- ===================================================================

-- Research sessions indexes
CREATE INDEX IF NOT EXISTS idx_research_sessions_user_id ON research_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_research_sessions_status ON research_sessions(status);
CREATE INDEX IF NOT EXISTS idx_research_sessions_created_at ON research_sessions(created_at DESC);

-- Graph nodes indexes
CREATE INDEX IF NOT EXISTS idx_graph_nodes_session_id ON graph_nodes(session_id);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_node_type ON graph_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_node_id ON graph_nodes(session_id, node_id);

-- Graph edges indexes
CREATE INDEX IF NOT EXISTS idx_graph_edges_session_id ON graph_edges(session_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_source_target ON graph_edges(source_node_id, target_node_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_edge_id ON graph_edges(session_id, edge_id);

-- Stage executions indexes
CREATE INDEX IF NOT EXISTS idx_stage_executions_session_id ON stage_executions(session_id);
CREATE INDEX IF NOT EXISTS idx_stage_executions_status ON stage_executions(status);
CREATE INDEX IF NOT EXISTS idx_stage_executions_stage_number ON stage_executions(stage_number);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_session_id ON activity_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- API usage indexes
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at DESC);

-- Error logs indexes
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);

-- 7. ENABLE REALTIME FOR KEY TABLES
-- ===================================================================

-- Enable realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE research_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE graph_nodes;
ALTER PUBLICATION supabase_realtime ADD TABLE graph_edges;
ALTER PUBLICATION supabase_realtime ADD TABLE stage_executions;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- 8. CREATE USEFUL VIEWS FOR ANALYTICS
-- ===================================================================

-- User research statistics view
CREATE OR REPLACE VIEW user_research_stats AS
SELECT 
  u.id as user_id,
  COUNT(DISTINCT rs.id) as total_sessions,
  COUNT(DISTINCT CASE WHEN rs.status = 'completed' THEN rs.id END) as completed_sessions,
  COUNT(DISTINCT gn.id) as total_nodes,
  COUNT(DISTINCT ge.id) as total_edges,
  MAX(rs.created_at) as last_session_date
FROM auth.users u
LEFT JOIN research_sessions rs ON u.id = rs.user_id
LEFT JOIN graph_nodes gn ON rs.id = gn.session_id
LEFT JOIN graph_edges ge ON rs.id = ge.session_id
GROUP BY u.id;

-- Session summaries view
CREATE OR REPLACE VIEW session_summaries AS
SELECT 
  rs.id,
  rs.user_id,
  rs.title,
  rs.status,
  rs.created_at,
  rs.updated_at,
  COUNT(DISTINCT gn.id) as node_count,
  COUNT(DISTINCT ge.id) as edge_count,
  COUNT(DISTINCT se.id) as stage_count,
  MAX(se.stage_number) as current_stage
FROM research_sessions rs
LEFT JOIN graph_nodes gn ON rs.id = gn.session_id
LEFT JOIN graph_edges ge ON rs.id = ge.session_id
LEFT JOIN stage_executions se ON rs.id = se.session_id
GROUP BY rs.id, rs.user_id, rs.title, rs.status, rs.created_at, rs.updated_at;

-- 9. GRANT PROPER PERMISSIONS
-- ===================================================================

-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions on tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions on sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 10. ADD HELPFUL COMMENTS
-- ===================================================================

COMMENT ON TABLE profiles IS 'User profiles with research preferences and settings';
COMMENT ON TABLE research_sessions IS 'Main research sessions containing ASR-GoT analyses';
COMMENT ON TABLE graph_nodes IS 'Nodes in the research knowledge graph';
COMMENT ON TABLE graph_edges IS 'Edges connecting nodes in the knowledge graph';
COMMENT ON TABLE stage_executions IS 'Execution history for the 9-stage ASR-GoT pipeline';

-- ===================================================================
-- SCRIPT COMPLETE!
-- 
-- After running this script:
-- 1. Create storage buckets manually in Storage section:
--    - research-exports (private, 50MB, PDF/HTML/JSON/SVG/PNG)
--    - user-uploads (private, 10MB, images/documents)
--    - visualizations (public, 10MB, images/JSON)
-- 
-- 2. Test the application:
--    - Sign up a new user
--    - Create a research session
--    - Verify data isolation works
--    - Test realtime features
--
-- 3. Monitor in Dashboard:
--    - Check RLS policies are working
--    - Verify indexes are created
--    - Test database functions
-- ===================================================================