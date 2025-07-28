-- ASR-GoT Complete Clean Schema
-- This creates all necessary tables and applies the complete security fixes

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    research_interests TEXT[],
    expertise_areas TEXT[],
    institution TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    api_usage_limit INTEGER DEFAULT 1000,
    current_api_usage INTEGER DEFAULT 0,
    preferences JSONB DEFAULT '{}',
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create research_sessions table
CREATE TABLE IF NOT EXISTS research_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    research_question TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    current_stage INTEGER DEFAULT 1,
    graph_data JSONB,
    stage_results JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create query_sessions table (for compatibility)
CREATE TABLE IF NOT EXISTS query_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    research_question TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    current_stage INTEGER DEFAULT 1,
    graph_data JSONB,
    stage_results JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create graph_data table
CREATE TABLE IF NOT EXISTS graph_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
    nodes JSONB NOT NULL DEFAULT '[]',
    edges JSONB NOT NULL DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id)
);

-- Create all other required tables
CREATE TABLE IF NOT EXISTS graph_nodes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
    node_id TEXT NOT NULL DEFAULT '',
    label TEXT NOT NULL DEFAULT '',
    node_type TEXT NOT NULL DEFAULT '',
    confidence NUMERIC[] DEFAULT ARRAY[0.5, 0.5, 0.5, 0.5],
    position JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS graph_edges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
    edge_id TEXT NOT NULL DEFAULT '',
    source_node_id TEXT NOT NULL DEFAULT '',
    target_node_id TEXT NOT NULL DEFAULT '',
    edge_type TEXT NOT NULL DEFAULT '',
    confidence NUMERIC DEFAULT 0.5,
    bidirectional BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stage_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
    stage_number INTEGER,
    stage_name TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
    input_data JSONB,
    output_data JSONB,
    results JSONB,
    execution_time_ms INTEGER,
    duration_ms INTEGER,
    error_message TEXT,
    confidence_score NUMERIC,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hypotheses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
    hypothesis_text TEXT NOT NULL,
    hypothesis_type TEXT,
    confidence NUMERIC DEFAULT 0.5,
    supporting_evidence JSONB,
    contradicting_evidence JSONB,
    falsifiability_score NUMERIC,
    competition_results JSONB,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'validated', 'refuted', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_gaps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
    gap_type TEXT,
    description TEXT NOT NULL,
    priority NUMERIC DEFAULT 0.5,
    fillability NUMERIC DEFAULT 0.5,
    related_nodes TEXT[],
    research_recommendations JSONB,
    status TEXT DEFAULT 'identified' CHECK (status IN ('identified', 'researching', 'filled', 'unfillable')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
    operation_type TEXT,
    execution_time_ms INTEGER,
    memory_usage_mb NUMERIC,
    cpu_usage_percent NUMERIC,
    throughput NUMERIC,
    error_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES research_sessions(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    error_type TEXT,
    error_code TEXT,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    context JSONB,
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES research_sessions(id) ON DELETE SET NULL,
    action_type TEXT,
    table_name TEXT,
    record_id UUID,
    action_details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS research_collaborations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    collaborator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    permission_level TEXT DEFAULT 'view' CHECK (permission_level IN ('view', 'edit', 'admin')),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'revoked'))
);

CREATE TABLE IF NOT EXISTS api_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    api_provider TEXT,
    endpoint TEXT,
    tokens_used INTEGER DEFAULT 0,
    cost_usd NUMERIC DEFAULT 0,
    request_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session_exports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    export_format TEXT CHECK (export_format IN ('pdf', 'html', 'json', 'csv')),
    file_path TEXT,
    file_size INTEGER,
    export_status TEXT DEFAULT 'processing' CHECK (export_status IN ('processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS stage_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
    stage_number INTEGER,
    stage_name TEXT,
    execution_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bias_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
    bias_type TEXT,
    severity NUMERIC DEFAULT 0.5,
    description TEXT,
    recommendations JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS research_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
    result_type TEXT,
    findings JSONB,
    confidence_score NUMERIC DEFAULT 0.5,
    statistical_significance NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('gemini', 'perplexity', 'openai')),
    encrypted_key TEXT NOT NULL,
    key_name TEXT,
    is_active BOOLEAN DEFAULT true,
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_data ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;