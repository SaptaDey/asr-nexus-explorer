-- Create error logging table for ASR-GoT application
-- This enables Claude Code to access and debug production issues

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Error Classification
  error_type VARCHAR(50) NOT NULL, -- 'javascript', 'network', 'database', 'auth', 'validation'
  severity VARCHAR(20) NOT NULL DEFAULT 'error', -- 'error', 'warning', 'critical', 'info'
  category VARCHAR(100), -- 'circular_import', 'api_failure', 'render_error', etc.
  
  -- Error Details
  message TEXT NOT NULL,
  stack TEXT,
  error_code VARCHAR(50),
  
  -- Context Information
  url TEXT,
  user_agent TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id VARCHAR(100),
  
  -- Technical Context
  component_name VARCHAR(200),
  function_name VARCHAR(200),
  line_number INTEGER,
  column_number INTEGER,
  
  -- ASR-GoT Specific Context
  stage_id VARCHAR(20), -- Current ASR-GoT stage when error occurred
  research_session_id UUID,
  parameter_set JSONB, -- P1.0-P1.29 parameters active when error occurred
  
  -- Browser/Environment Context
  browser_info JSONB,
  screen_resolution VARCHAR(20),
  viewport_size VARCHAR(20),
  
  -- Request Context (for API errors)
  request_url TEXT,
  request_method VARCHAR(10),
  request_headers JSONB,
  response_status INTEGER,
  response_body TEXT,
  
  -- Additional Metadata
  metadata JSONB,
  tags TEXT[], -- For easier filtering and grouping
  
  -- Resolution Tracking
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT
);

-- Indexes for performance
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_type_severity ON error_logs(error_type, severity);
CREATE INDEX idx_error_logs_category ON error_logs(category);
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX idx_error_logs_stage_id ON error_logs(stage_id);
CREATE INDEX idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX idx_error_logs_tags ON error_logs USING GIN(tags);

-- Create a view for easy Claude Code access
CREATE OR REPLACE VIEW error_summary AS
SELECT 
  id,
  created_at,
  error_type,
  severity,
  category,
  message,
  url,
  component_name,
  stage_id,
  resolved,
  tags
FROM error_logs
ORDER BY created_at DESC;

-- Create a view for recent critical errors
CREATE OR REPLACE VIEW recent_critical_errors AS
SELECT *
FROM error_logs
WHERE severity = 'critical' 
  AND created_at >= NOW() - INTERVAL '24 hours'
  AND resolved = FALSE
ORDER BY created_at DESC;

-- RLS Policies for security
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all error logs (for debugging)
CREATE POLICY "Allow authenticated users to read error logs" ON error_logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow the application to insert error logs
CREATE POLICY "Allow error log insertion" ON error_logs
  FOR INSERT WITH CHECK (true);

-- Allow users to update their own error logs resolution status
CREATE POLICY "Allow users to update error resolution" ON error_logs
  FOR UPDATE USING (auth.uid() = resolved_by OR auth.role() = 'service_role');

-- Grant permissions for the views
GRANT SELECT ON error_summary TO authenticated;
GRANT SELECT ON recent_critical_errors TO authenticated;

-- Create a function for Claude Code to get error patterns
CREATE OR REPLACE FUNCTION get_error_patterns(
  hours_back INTEGER DEFAULT 24,
  min_occurrences INTEGER DEFAULT 3
)
RETURNS TABLE (
  error_pattern TEXT,
  occurrence_count BIGINT,
  latest_occurrence TIMESTAMP WITH TIME ZONE,
  affected_components TEXT[],
  affected_stages TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(category, error_type) as error_pattern,
    COUNT(*) as occurrence_count,
    MAX(created_at) as latest_occurrence,
    ARRAY_AGG(DISTINCT component_name) FILTER (WHERE component_name IS NOT NULL) as affected_components,
    ARRAY_AGG(DISTINCT stage_id) FILTER (WHERE stage_id IS NOT NULL) as affected_stages
  FROM error_logs
  WHERE created_at >= NOW() - INTERVAL '1 hour' * hours_back
  GROUP BY COALESCE(category, error_type)
  HAVING COUNT(*) >= min_occurrences
  ORDER BY occurrence_count DESC, latest_occurrence DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;