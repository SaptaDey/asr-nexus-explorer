-- ASR-GoT Framework - Initial Database Schema
-- Comprehensive database schema for Advanced Scientific Reasoning - Graph-of-Thoughts framework

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    research_interests TEXT[],
    expertise_areas TEXT[],
    institution TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Research sessions table
CREATE TABLE research_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    research_question TEXT,
    status TEXT CHECK (status IN ('draft', 'active', 'completed', 'archived')) DEFAULT 'draft',
    current_stage INTEGER DEFAULT 1 CHECK (current_stage >= 1 AND current_stage <= 9),
    graph_data JSONB,
    stage_results JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Graph nodes table for efficient querying and analysis
CREATE TABLE graph_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
    node_id TEXT NOT NULL, -- Original node ID from graph
    label TEXT NOT NULL,
    node_type TEXT NOT NULL,
    confidence NUMERIC[] NOT NULL,
    position JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, node_id)
);

-- Graph edges table
CREATE TABLE graph_edges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
    edge_id TEXT NOT NULL, -- Original edge ID from graph
    source_node_id TEXT NOT NULL,
    target_node_id TEXT NOT NULL,
    edge_type TEXT NOT NULL,
    confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    bidirectional BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, edge_id),
    FOREIGN KEY (session_id, source_node_id) REFERENCES graph_nodes(session_id, node_id),
    FOREIGN KEY (session_id, target_node_id) REFERENCES graph_nodes(session_id, node_id)
);

-- Stage execution history
CREATE TABLE stage_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
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

-- Hypothesis tracking
CREATE TABLE hypotheses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
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

-- Knowledge gaps identified during research
CREATE TABLE knowledge_gaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
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

-- Collaboration and sharing
CREATE TABLE research_collaborations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
    collaborator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('owner', 'editor', 'viewer', 'commenter')) NOT NULL,
    invited_by UUID REFERENCES profiles(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'revoked')) DEFAULT 'pending',
    UNIQUE(session_id, collaborator_id)
);

-- API credentials (encrypted)
CREATE TABLE api_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- 'gemini', 'openai', etc.
    encrypted_api_key TEXT NOT NULL,
    key_name TEXT,
    usage_limits JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

-- Performance metrics tracking
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
    operation_type TEXT NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    memory_usage_mb NUMERIC,
    cpu_usage_percent NUMERIC,
    throughput NUMERIC,
    error_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Error logs and system health
CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES research_sessions(id) ON DELETE SET NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
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

-- Export history
CREATE TABLE export_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    export_type TEXT NOT NULL, -- 'json', 'csv', 'pdf', 'graphml', etc.
    export_format TEXT NOT NULL,
    file_size_bytes INTEGER,
    download_count INTEGER DEFAULT 0,
    storage_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Research templates for reusability
CREATE TABLE research_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    template_data JSONB NOT NULL,
    category TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time activity tracking
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    activity_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX idx_research_sessions_user_id ON research_sessions(user_id);
CREATE INDEX idx_research_sessions_status ON research_sessions(status);
CREATE INDEX idx_research_sessions_created_at ON research_sessions(created_at DESC);

CREATE INDEX idx_graph_nodes_session_id ON graph_nodes(session_id);
CREATE INDEX idx_graph_nodes_node_id ON graph_nodes(session_id, node_id);
CREATE INDEX idx_graph_nodes_type ON graph_nodes(node_type);

CREATE INDEX idx_graph_edges_session_id ON graph_edges(session_id);
CREATE INDEX idx_graph_edges_source ON graph_edges(session_id, source_node_id);
CREATE INDEX idx_graph_edges_target ON graph_edges(session_id, target_node_id);
CREATE INDEX idx_graph_edges_type ON graph_edges(edge_type);

CREATE INDEX idx_stage_executions_session_id ON stage_executions(session_id);
CREATE INDEX idx_stage_executions_stage_number ON stage_executions(session_id, stage_number);
CREATE INDEX idx_stage_executions_status ON stage_executions(status);

CREATE INDEX idx_hypotheses_session_id ON hypotheses(session_id);
CREATE INDEX idx_hypotheses_confidence ON hypotheses(confidence DESC);
CREATE INDEX idx_hypotheses_status ON hypotheses(status);

CREATE INDEX idx_knowledge_gaps_session_id ON knowledge_gaps(session_id);
CREATE INDEX idx_knowledge_gaps_priority ON knowledge_gaps(priority DESC);
CREATE INDEX idx_knowledge_gaps_status ON knowledge_gaps(status);

CREATE INDEX idx_collaborations_session_id ON research_collaborations(session_id);
CREATE INDEX idx_collaborations_collaborator_id ON research_collaborations(collaborator_id);
CREATE INDEX idx_collaborations_status ON research_collaborations(status);

CREATE INDEX idx_api_credentials_user_id ON api_credentials(user_id);
CREATE INDEX idx_api_credentials_provider ON api_credentials(provider);
CREATE INDEX idx_api_credentials_active ON api_credentials(is_active);

CREATE INDEX idx_performance_metrics_session_id ON performance_metrics(session_id);
CREATE INDEX idx_performance_metrics_operation_type ON performance_metrics(operation_type);
CREATE INDEX idx_performance_metrics_created_at ON performance_metrics(created_at DESC);

CREATE INDEX idx_error_logs_session_id ON error_logs(session_id);
CREATE INDEX idx_error_logs_severity ON error_logs(severity);
CREATE INDEX idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);

CREATE INDEX idx_export_history_session_id ON export_history(session_id);
CREATE INDEX idx_export_history_user_id ON export_history(user_id);
CREATE INDEX idx_export_history_created_at ON export_history(created_at DESC);

CREATE INDEX idx_activity_logs_session_id ON activity_logs(session_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hypotheses ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Research sessions policies
CREATE POLICY "Users can view own research sessions" ON research_sessions FOR SELECT USING (
    user_id = auth.uid() OR 
    id IN (
        SELECT session_id FROM research_collaborations 
        WHERE collaborator_id = auth.uid() AND status = 'accepted'
    )
);

CREATE POLICY "Users can create research sessions" ON research_sessions FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own research sessions" ON research_sessions FOR UPDATE USING (
    user_id = auth.uid() OR 
    id IN (
        SELECT session_id FROM research_collaborations 
        WHERE collaborator_id = auth.uid() AND role IN ('owner', 'editor') AND status = 'accepted'
    )
);

CREATE POLICY "Users can delete own research sessions" ON research_sessions FOR DELETE USING (user_id = auth.uid());

-- Graph nodes and edges policies (inherit from session access)
CREATE POLICY "Users can access graph nodes of accessible sessions" ON graph_nodes FOR ALL USING (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND status = 'accepted'
        )
    )
);

CREATE POLICY "Users can access graph edges of accessible sessions" ON graph_edges FOR ALL USING (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND status = 'accepted'
        )
    )
);

-- Similar policies for other session-related tables
CREATE POLICY "Users can access stage executions of accessible sessions" ON stage_executions FOR ALL USING (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND status = 'accepted'
        )
    )
);

CREATE POLICY "Users can access hypotheses of accessible sessions" ON hypotheses FOR ALL USING (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND status = 'accepted'
        )
    )
);

CREATE POLICY "Users can access knowledge gaps of accessible sessions" ON knowledge_gaps FOR ALL USING (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND status = 'accepted'
        )
    )
);

CREATE POLICY "Users can access performance metrics of accessible sessions" ON performance_metrics FOR ALL USING (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND status = 'accepted'
        )
    )
);

CREATE POLICY "Users can access activity logs of accessible sessions" ON activity_logs FOR ALL USING (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND status = 'accepted'
        )
    )
);

-- API credentials policies
CREATE POLICY "Users can access own API credentials" ON api_credentials FOR ALL USING (user_id = auth.uid());

-- Research collaborations policies
CREATE POLICY "Users can view collaborations where they are involved" ON research_collaborations FOR SELECT USING (
    collaborator_id = auth.uid() OR 
    session_id IN (SELECT id FROM research_sessions WHERE user_id = auth.uid())
);

CREATE POLICY "Session owners can manage collaborations" ON research_collaborations FOR ALL USING (
    session_id IN (SELECT id FROM research_sessions WHERE user_id = auth.uid())
);

-- Export history policies
CREATE POLICY "Users can access export history of accessible sessions" ON export_history FOR ALL USING (
    user_id = auth.uid() OR
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND status = 'accepted'
        )
    )
);

-- Research templates policies
CREATE POLICY "Users can view public templates and own templates" ON research_templates FOR SELECT USING (
    is_public = true OR creator_id = auth.uid()
);

CREATE POLICY "Users can create own templates" ON research_templates FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update own templates" ON research_templates FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Users can delete own templates" ON research_templates FOR DELETE USING (creator_id = auth.uid());

-- Error logs policies (allow users to view errors related to their sessions)
CREATE POLICY "Users can view error logs of accessible sessions" ON error_logs FOR SELECT USING (
    user_id = auth.uid() OR
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND status = 'accepted'
        )
    )
);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_research_sessions_updated_at BEFORE UPDATE ON research_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_graph_nodes_updated_at BEFORE UPDATE ON graph_nodes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_graph_edges_updated_at BEFORE UPDATE ON graph_edges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hypotheses_updated_at BEFORE UPDATE ON hypotheses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_knowledge_gaps_updated_at BEFORE UPDATE ON knowledge_gaps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_credentials_updated_at BEFORE UPDATE ON api_credentials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_research_templates_updated_at BEFORE UPDATE ON research_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
    RETURN new;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Comments for documentation
COMMENT ON TABLE profiles IS 'User profiles with research interests and expertise';
COMMENT ON TABLE research_sessions IS 'Main research sessions following ASR-GoT framework';
COMMENT ON TABLE graph_nodes IS 'Individual nodes in research graphs with metadata';
COMMENT ON TABLE graph_edges IS 'Connections between nodes with confidence scores';
COMMENT ON TABLE stage_executions IS 'Execution history of ASR-GoT 9-stage pipeline';
COMMENT ON TABLE hypotheses IS 'Research hypotheses with validation tracking';
COMMENT ON TABLE knowledge_gaps IS 'Identified gaps in knowledge with research priorities';
COMMENT ON TABLE research_collaborations IS 'Collaboration permissions for research sessions';
COMMENT ON TABLE api_credentials IS 'Encrypted API credentials for external services';
COMMENT ON TABLE performance_metrics IS 'System performance tracking and optimization data';
COMMENT ON TABLE error_logs IS 'Comprehensive error tracking and debugging information';
COMMENT ON TABLE export_history IS 'History of data exports with download tracking';
COMMENT ON TABLE research_templates IS 'Reusable research templates and methodologies';
COMMENT ON TABLE activity_logs IS 'Real-time activity tracking for collaboration';