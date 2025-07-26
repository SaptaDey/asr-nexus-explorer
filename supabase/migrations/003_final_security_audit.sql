-- Final security audit and production fixes

-- Create comprehensive audit logging
CREATE OR REPLACE FUNCTION audit_user_action()
RETURNS TRIGGER AS $$
BEGIN
  -- Log all significant user actions
  INSERT INTO activity_logs (
    user_id,
    session_id,
    action_type,
    table_name,
    record_id,
    action_details,
    created_at
  ) VALUES (
    auth.uid(),
    COALESCE(NEW.session_id, OLD.session_id),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'old', CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
      'new', CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
    ),
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to critical tables
DROP TRIGGER IF EXISTS audit_research_sessions ON research_sessions;
CREATE TRIGGER audit_research_sessions
  AFTER INSERT OR UPDATE OR DELETE ON research_sessions
  FOR EACH ROW EXECUTE FUNCTION audit_user_action();

DROP TRIGGER IF EXISTS audit_graph_data ON graph_data;
CREATE TRIGGER audit_graph_data
  AFTER INSERT OR UPDATE OR DELETE ON graph_data
  FOR EACH ROW EXECUTE FUNCTION audit_user_action();

-- Function to detect suspicious activity
CREATE OR REPLACE FUNCTION detect_suspicious_activity(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
  risk_level TEXT,
  risk_reason TEXT,
  action_count BIGINT,
  time_window TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Detect rapid session creation (potential abuse)
  SELECT 
    'HIGH'::TEXT as risk_level,
    'Rapid session creation detected'::TEXT as risk_reason,
    COUNT(*)::BIGINT as action_count,
    'last_hour'::TEXT as time_window
  FROM research_sessions 
  WHERE user_id = user_uuid 
    AND created_at > NOW() - INTERVAL '1 hour'
  GROUP BY user_id
  HAVING COUNT(*) > 20
  
  UNION ALL
  
  -- Detect excessive API usage
  SELECT 
    'MEDIUM'::TEXT as risk_level,
    'High API usage detected'::TEXT as risk_reason,
    COUNT(*)::BIGINT as action_count,
    'last_hour'::TEXT as time_window
  FROM api_usage 
  WHERE user_id = user_uuid 
    AND created_at > NOW() - INTERVAL '1 hour'
  GROUP BY user_id
  HAVING COUNT(*) > 1000
  
  UNION ALL
  
  -- Detect multiple failed attempts
  SELECT 
    'HIGH'::TEXT as risk_level,
    'Multiple errors detected'::TEXT as risk_reason,
    COUNT(*)::BIGINT as action_count,
    'last_10_minutes'::TEXT as time_window
  FROM error_logs 
  WHERE user_id = user_uuid 
    AND created_at > NOW() - INTERVAL '10 minutes'
    AND severity IN ('high', 'critical')
  GROUP BY user_id
  HAVING COUNT(*) > 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  action_type TEXT,
  time_window INTERVAL DEFAULT INTERVAL '1 hour',
  max_actions INTEGER DEFAULT 100
)
RETURNS BOOLEAN AS $$
DECLARE
  action_count INTEGER;
BEGIN
  -- Count recent actions by the current user
  SELECT COUNT(*) INTO action_count
  FROM activity_logs
  WHERE user_id = auth.uid()
    AND action_type = check_rate_limit.action_type
    AND created_at > NOW() - time_window;
  
  -- Return false if limit exceeded
  IF action_count >= max_actions THEN
    -- Log rate limit violation
    INSERT INTO error_logs (
      user_id, error_type, error_message, severity, created_at
    ) VALUES (
      auth.uid(), 'RATE_LIMIT_EXCEEDED', 
      format('Rate limit exceeded for action: %s (%s actions in %s)', 
        action_type, action_count, time_window),
      'medium', NOW()
    );
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced profile security with data validation
CREATE OR REPLACE FUNCTION secure_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate and sanitize profile data
  NEW.full_name := sanitize_text_input(NEW.full_name);
  NEW.institution := sanitize_text_input(NEW.institution);
  
  -- Ensure user can only update their own profile
  IF auth.uid() != NEW.id THEN
    RAISE EXCEPTION 'Access denied: Cannot modify other user profiles';
  END IF;
  
  -- Log profile changes
  INSERT INTO activity_logs (
    user_id, action_type, table_name, record_id, 
    action_details, created_at
  ) VALUES (
    auth.uid(), 'PROFILE_UPDATE', 'profiles', NEW.id,
    jsonb_build_object('fields_changed', 
      CASE 
        WHEN OLD.full_name != NEW.full_name THEN jsonb_build_array('full_name')
        ELSE jsonb_build_array()
      END
    ),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS secure_profile_trigger ON profiles;
CREATE TRIGGER secure_profile_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION secure_profile_update();

-- Create performance indexes for production
CREATE INDEX IF NOT EXISTS idx_research_sessions_user_id ON research_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_research_sessions_status ON research_sessions(status);
CREATE INDEX IF NOT EXISTS idx_research_sessions_created_at ON research_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_sessions_user_id ON query_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_graph_data_session_id ON graph_data(session_id);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_session_id ON graph_nodes(session_id);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_node_type ON graph_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_graph_edges_session_id ON graph_edges(session_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_source_target ON graph_edges(source_node_id, target_node_id);
CREATE INDEX IF NOT EXISTS idx_stage_executions_session_id ON stage_executions(session_id);
CREATE INDEX IF NOT EXISTS idx_stage_executions_status ON stage_executions(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);

-- Grant secure permissions
GRANT EXECUTE ON FUNCTION detect_suspicious_activity(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit(TEXT, INTERVAL, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION sanitize_text_input(TEXT) TO authenticated;

-- Final security validation
DO $$
DECLARE
  table_record RECORD;
  tables_without_rls TEXT[] := ARRAY[]::TEXT[];
BEGIN
  FOR table_record IN 
    SELECT schemaname, tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  LOOP
    -- Check if RLS is enabled
    IF NOT EXISTS (
      SELECT 1 FROM pg_class 
      WHERE relname = table_record.tablename 
      AND relrowsecurity = true
    ) THEN
      tables_without_rls := array_append(tables_without_rls, table_record.tablename);
    END IF;
  END LOOP;
  
  -- Log any tables without RLS
  IF array_length(tables_without_rls, 1) > 0 THEN
    INSERT INTO error_logs (
      error_type, error_message, severity, created_at
    ) VALUES (
      'SECURITY_WARNING', 
      format('Tables without RLS: %s', array_to_string(tables_without_rls, ', ')),
      'high', NOW()
    );
  END IF;
END $$;