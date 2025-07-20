-- Production-Ready Query History System
-- Creates comprehensive database schema for ASR-GoT query tracking and pause-resume functionality

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Query Sessions table - Main tracking table
CREATE TABLE query_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused', 'completed', 'failed')),
  current_stage INTEGER NOT NULL DEFAULT 0,
  total_stages INTEGER NOT NULL DEFAULT 9,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NULL,
  research_context JSONB NOT NULL DEFAULT '{}',
  graph_data JSONB NOT NULL DEFAULT '{"nodes": [], "edges": [], "metadata": {}}',
  stage_results JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  user_id UUID NULL, -- For future user authentication
  tags TEXT[] NOT NULL DEFAULT '{}',
  
  -- Indexes for performance
  CONSTRAINT query_sessions_stage_check CHECK (current_stage >= 0 AND current_stage <= total_stages)
);

-- Query Figures table - Store all generated visualizations
CREATE TABLE query_figures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES query_sessions(id) ON DELETE CASCADE,
  stage INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  figure_type VARCHAR(20) NOT NULL CHECK (figure_type IN ('chart', 'graph', 'visualization', 'plot')),
  data_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT query_figures_stage_check CHECK (stage >= 0 AND stage <= 9)
);

-- Query Tables table - Store all generated data tables
CREATE TABLE query_tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES query_sessions(id) ON DELETE CASCADE,
  stage INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  data JSONB NOT NULL DEFAULT '[]',
  schema JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT query_tables_stage_check CHECK (stage >= 0 AND stage <= 9)
);

-- Create indexes for optimal query performance
CREATE INDEX idx_query_sessions_status ON query_sessions(status);
CREATE INDEX idx_query_sessions_created_at ON query_sessions(created_at DESC);
CREATE INDEX idx_query_sessions_updated_at ON query_sessions(updated_at DESC);
CREATE INDEX idx_query_sessions_tags ON query_sessions USING GIN(tags);
CREATE INDEX idx_query_sessions_search ON query_sessions USING GIN(to_tsvector('english', query));
CREATE INDEX idx_query_sessions_user_id ON query_sessions(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX idx_query_figures_session_id ON query_figures(session_id);
CREATE INDEX idx_query_figures_stage ON query_figures(stage);
CREATE INDEX idx_query_figures_created_at ON query_figures(created_at DESC);

CREATE INDEX idx_query_tables_session_id ON query_tables(session_id);
CREATE INDEX idx_query_tables_stage ON query_tables(stage);
CREATE INDEX idx_query_tables_created_at ON query_tables(created_at DESC);

-- Create storage buckets for query files
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('query-figures', 'query-figures', true),
  ('query-exports', 'query-exports', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for public access to query data
CREATE POLICY "Public read access for query figures" ON storage.objects
  FOR SELECT USING (bucket_id = 'query-figures');

CREATE POLICY "Public insert access for query figures" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'query-figures');

CREATE POLICY "Public update access for query figures" ON storage.objects
  FOR UPDATE USING (bucket_id = 'query-figures');

CREATE POLICY "Public delete access for query figures" ON storage.objects
  FOR DELETE USING (bucket_id = 'query-figures');

CREATE POLICY "Public read access for query exports" ON storage.objects
  FOR SELECT USING (bucket_id = 'query-exports');

CREATE POLICY "Public insert access for query exports" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'query-exports');

CREATE POLICY "Public update access for query exports" ON storage.objects
  FOR UPDATE USING (bucket_id = 'query-exports');

CREATE POLICY "Public delete access for query exports" ON storage.objects
  FOR DELETE USING (bucket_id = 'query-exports');

-- Row Level Security Policies (Currently open for demo, can be restricted later)
ALTER TABLE query_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_figures ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_tables ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (can be restricted based on user_id later)
CREATE POLICY "Allow all query_sessions operations" ON query_sessions FOR ALL USING (true);
CREATE POLICY "Allow all query_figures operations" ON query_figures FOR ALL USING (true);
CREATE POLICY "Allow all query_tables operations" ON query_tables FOR ALL USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_query_sessions_updated_at 
  BEFORE UPDATE ON query_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Analytics views for query insights
CREATE VIEW query_session_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_queries,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_queries,
  COUNT(*) FILTER (WHERE status = 'paused') as paused_queries,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_queries,
  AVG(CASE WHEN status = 'completed' THEN 
    EXTRACT(EPOCH FROM (completed_at - created_at))/60 
  END) as avg_completion_time_minutes,
  AVG((metadata->>'token_usage'->>'total')::integer) as avg_tokens_used
FROM query_sessions
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Popular tags view
CREATE VIEW popular_tags AS
SELECT 
  UNNEST(tags) as tag,
  COUNT(*) as usage_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count
FROM query_sessions
GROUP BY UNNEST(tags)
ORDER BY usage_count DESC;

-- Session completion rates by field
CREATE VIEW completion_rates_by_field AS
SELECT 
  research_context->>'field' as field,
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_sessions,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'completed')::numeric / COUNT(*)::numeric * 100, 
    2
  ) as completion_rate_percent
FROM query_sessions
WHERE research_context->>'field' IS NOT NULL
GROUP BY research_context->>'field'
ORDER BY completion_rate_percent DESC;