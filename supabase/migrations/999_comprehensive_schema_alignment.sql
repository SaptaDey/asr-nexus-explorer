-- Comprehensive Schema Alignment Migration
-- Aligns database schema with application expectations
-- Fills gaps between simplified production schema and comprehensive application schema

-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add missing columns to existing query_sessions table to align with research_sessions schema
ALTER TABLE query_sessions 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS research_question TEXT,
ADD COLUMN IF NOT EXISTS stage_results_v2 JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS metadata_v2 JSONB DEFAULT '{}';

-- Create graph_data table if it doesn't exist (for storing complete graph structures)
CREATE TABLE IF NOT EXISTS graph_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    nodes JSONB DEFAULT '[]',
    edges JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id)
);

-- Add foreign key constraint if the table was just created
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'graph_data_session_id_fkey'
    ) THEN
        ALTER TABLE graph_data 
        ADD CONSTRAINT graph_data_session_id_fkey 
        FOREIGN KEY (session_id) REFERENCES query_sessions(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create stage_executions table (missing from current schema)
CREATE TABLE IF NOT EXISTS stage_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES query_sessions(id) ON DELETE CASCADE,
    stage_number INTEGER NOT NULL CHECK (stage_number >= 1 AND stage_number <= 9),
    stage_name TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')) DEFAULT 'pending',
    input_data JSONB,
    output_data JSONB,
    execution_time_ms INTEGER,
    error_message TEXT,
    confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 1),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hypotheses table (missing from current schema)
CREATE TABLE IF NOT EXISTS hypotheses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES query_sessions(id) ON DELETE CASCADE,
    hypothesis_text TEXT NOT NULL,
    hypothesis_type TEXT NOT NULL,
    confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    supporting_evidence JSONB DEFAULT '[]',
    contradicting_evidence JSONB DEFAULT '[]',
    falsifiability_score NUMERIC CHECK (falsifiability_score >= 0 AND falsifiability_score <= 1),
    competition_results JSONB DEFAULT '{}',
    status TEXT CHECK (status IN ('active', 'validated', 'refuted', 'archived')) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create knowledge_gaps table (missing from current schema)
CREATE TABLE IF NOT EXISTS knowledge_gaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES query_sessions(id) ON DELETE CASCADE,
    gap_type TEXT NOT NULL,
    description TEXT NOT NULL,
    priority NUMERIC NOT NULL CHECK (priority >= 0 AND priority <= 1),
    fillability NUMERIC NOT NULL CHECK (fillability >= 0 AND fillability <= 1),
    related_nodes TEXT[],
    research_recommendations JSONB DEFAULT '[]',
    status TEXT CHECK (status IN ('identified', 'researching', 'filled', 'unfillable')) DEFAULT 'identified',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create performance_metrics table (missing from current schema)
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES query_sessions(id) ON DELETE CASCADE,
    operation_type TEXT NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    memory_usage_mb NUMERIC,
    cpu_usage_percent NUMERIC,
    throughput NUMERIC,
    error_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create error_logs table (missing from current schema)
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES query_sessions(id) ON DELETE SET NULL,
    user_id UUID,
    error_type TEXT NOT NULL,
    error_code TEXT,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    context JSONB DEFAULT '{}',
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table if it doesn't exist (simplified version)
CREATE TABLE IF NOT EXISTS profiles (
    id STRING PRIMARY KEY,
    user_id STRING NOT NULL,
    email STRING,
    full_name STRING,
    avatar_url STRING,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance optimization (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_query_sessions_user_id ON query_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_query_sessions_status_v2 ON query_sessions(status);
CREATE INDEX IF NOT EXISTS idx_query_sessions_created_at_v2 ON query_sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_graph_data_session_id ON graph_data(session_id);
CREATE INDEX IF NOT EXISTS idx_graph_data_created_at ON graph_data(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stage_executions_session_id ON stage_executions(session_id);
CREATE INDEX IF NOT EXISTS idx_stage_executions_stage_number ON stage_executions(session_id, stage_number);
CREATE INDEX IF NOT EXISTS idx_stage_executions_status ON stage_executions(status);

CREATE INDEX IF NOT EXISTS idx_hypotheses_session_id ON hypotheses(session_id);
CREATE INDEX IF NOT EXISTS idx_hypotheses_confidence ON hypotheses(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_hypotheses_status ON hypotheses(status);

CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_session_id ON knowledge_gaps(session_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_priority ON knowledge_gaps(priority DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_status ON knowledge_gaps(status);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_session_id ON performance_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_operation_type ON performance_metrics(operation_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_session_id ON error_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Enable Row Level Security for new tables
ALTER TABLE graph_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hypotheses ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (permissive for now - can be tightened later)
CREATE POLICY IF NOT EXISTS "Allow all graph_data operations" ON graph_data FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all stage_executions operations" ON stage_executions FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all hypotheses operations" ON hypotheses FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all knowledge_gaps operations" ON knowledge_gaps FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all performance_metrics operations" ON performance_metrics FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all error_logs operations" ON error_logs FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all profiles operations" ON profiles FOR ALL USING (true);

-- Create or update updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at timestamps (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_graph_data_updated_at') THEN
        CREATE TRIGGER update_graph_data_updated_at 
        BEFORE UPDATE ON graph_data 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_hypotheses_updated_at') THEN
        CREATE TRIGGER update_hypotheses_updated_at 
        BEFORE UPDATE ON hypotheses 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_knowledge_gaps_updated_at') THEN
        CREATE TRIGGER update_knowledge_gaps_updated_at 
        BEFORE UPDATE ON knowledge_gaps 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
        CREATE TRIGGER update_profiles_updated_at 
        BEFORE UPDATE ON profiles 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Storage buckets for ASR-GoT analyses (create if they don't exist)
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('asr-got-analyses', 'asr-got-analyses', false),
    ('asr-got-visualizations', 'asr-got-visualizations', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for ASR-GoT buckets
DO $$
BEGIN
    -- Analysis storage policies (private)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Analysis storage access') THEN
        CREATE POLICY "Analysis storage access" ON storage.objects
        FOR ALL USING (bucket_id = 'asr-got-analyses');
    END IF;
    
    -- Visualization storage policies (public read)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read visualizations') THEN
        CREATE POLICY "Public read visualizations" ON storage.objects
        FOR SELECT USING (bucket_id = 'asr-got-visualizations');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public insert visualizations') THEN
        CREATE POLICY "Public insert visualizations" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'asr-got-visualizations');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public update visualizations') THEN
        CREATE POLICY "Public update visualizations" ON storage.objects
        FOR UPDATE USING (bucket_id = 'asr-got-visualizations');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public delete visualizations') THEN
        CREATE POLICY "Public delete visualizations" ON storage.objects
        FOR DELETE USING (bucket_id = 'asr-got-visualizations');
    END IF;
END $$;

-- Add table comments for documentation
COMMENT ON TABLE graph_data IS 'Complete graph data structures for ASR-GoT sessions';
COMMENT ON TABLE stage_executions IS 'Execution history of ASR-GoT 9-stage pipeline';
COMMENT ON TABLE hypotheses IS 'Research hypotheses with validation tracking';
COMMENT ON TABLE knowledge_gaps IS 'Identified gaps in knowledge with research priorities';
COMMENT ON TABLE performance_metrics IS 'System performance tracking and optimization data';
COMMENT ON TABLE error_logs IS 'Comprehensive error tracking and debugging information';

-- Migration completion marker
INSERT INTO schema_migrations (version, migrated_at) 
VALUES ('999_comprehensive_schema_alignment', NOW())
ON CONFLICT (version) DO UPDATE SET migrated_at = NOW();

-- Create schema_migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    migrated_at TIMESTAMPTZ DEFAULT NOW()
);