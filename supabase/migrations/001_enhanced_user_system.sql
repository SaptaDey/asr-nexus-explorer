-- Enhanced User System with API Management and Data Storage
-- Migration: 001_enhanced_user_system.sql

-- Enable Row Level Security
ALTER DATABASE "aogeenqytwrpjvrfwvjw" SET row_security = on;

-- Create enhanced profiles table (extend existing)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS api_usage_limit INTEGER DEFAULT 1000;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_api_usage INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Create user_api_keys table for secure API key storage
CREATE TABLE IF NOT EXISTS user_api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('gemini', 'perplexity', 'openai')),
    encrypted_key TEXT NOT NULL,
    key_name TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    UNIQUE(user_id, provider, key_name)
);

-- Create api_usage_logs table for tracking API calls
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES query_sessions(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    cost_estimate DECIMAL(10,6) DEFAULT 0,
    response_time_ms INTEGER,
    status_code INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_file_storage table for tracking uploaded/generated files
CREATE TABLE IF NOT EXISTS user_file_storage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES query_sessions(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT,
    storage_path TEXT NOT NULL,
    file_category TEXT CHECK (file_category IN ('visualization', 'data', 'report', 'upload')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_public BOOLEAN DEFAULT false
);

-- Create research_collections table for organizing saved research
CREATE TABLE IF NOT EXISTS research_collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3498db',
    is_public BOOLEAN DEFAULT false,
    session_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_dashboard_settings table for personalized dashboards
CREATE TABLE IF NOT EXISTS user_dashboard_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    widget_layout JSONB DEFAULT '[]',
    theme_preferences JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create query_bookmarks table for saving favorite queries
CREATE TABLE IF NOT EXISTS query_bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES query_sessions(id) ON DELETE CASCADE,
    bookmark_name TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_provider ON user_api_keys(provider);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_session_id ON api_usage_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_file_storage_user_id ON user_file_storage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_file_storage_session_id ON user_file_storage(session_id);
CREATE INDEX IF NOT EXISTS idx_research_collections_user_id ON research_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_query_bookmarks_user_id ON query_bookmarks(user_id);

-- Create Row Level Security policies

-- Profiles RLS (extend existing)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- User API Keys RLS
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own API keys" ON user_api_keys
    FOR ALL USING (auth.uid() = user_id);

-- API Usage Logs RLS
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own API usage" ON api_usage_logs
    FOR SELECT USING (auth.uid() = user_id);

-- User File Storage RLS
ALTER TABLE user_file_storage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own files" ON user_file_storage
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public files are viewable" ON user_file_storage
    FOR SELECT USING (is_public = true);

-- Research Collections RLS
ALTER TABLE research_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own collections" ON research_collections
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public collections are viewable" ON research_collections
    FOR SELECT USING (is_public = true);

-- User Dashboard Settings RLS
ALTER TABLE user_dashboard_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own dashboard" ON user_dashboard_settings
    FOR ALL USING (auth.uid() = user_id);

-- Query Bookmarks RLS
ALTER TABLE query_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own bookmarks" ON query_bookmarks
    FOR ALL USING (auth.uid() = user_id);

-- Create functions for API usage tracking
CREATE OR REPLACE FUNCTION increment_api_usage(
    p_user_id UUID,
    p_provider TEXT,
    p_tokens INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE profiles 
    SET current_api_usage = current_api_usage + p_tokens
    WHERE user_id = p_user_id;
    
    UPDATE user_api_keys 
    SET usage_count = usage_count + 1,
        last_used = NOW()
    WHERE user_id = p_user_id AND provider = p_provider AND is_active = true;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to reset monthly API usage
CREATE OR REPLACE FUNCTION reset_monthly_api_usage() RETURNS VOID AS $$
BEGIN
    UPDATE profiles 
    SET current_api_usage = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_api_keys_updated_at ON user_api_keys;
CREATE TRIGGER update_user_api_keys_updated_at 
    BEFORE UPDATE ON user_api_keys 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_research_collections_updated_at ON research_collections;
CREATE TRIGGER update_research_collections_updated_at 
    BEFORE UPDATE ON research_collections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_dashboard_settings_updated_at ON user_dashboard_settings;
CREATE TRIGGER update_user_dashboard_settings_updated_at 
    BEFORE UPDATE ON user_dashboard_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for analytics
CREATE OR REPLACE VIEW user_api_usage_summary AS
SELECT 
    u.id as user_id,
    p.full_name,
    p.subscription_tier,
    p.current_api_usage,
    p.api_usage_limit,
    ROUND((p.current_api_usage::DECIMAL / p.api_usage_limit::DECIMAL) * 100, 2) as usage_percentage,
    COUNT(DISTINCT qs.id) as total_sessions,
    COUNT(DISTINCT CASE WHEN qs.status = 'completed' THEN qs.id END) as completed_sessions,
    SUM(aul.tokens_used) as total_tokens_used,
    SUM(aul.cost_estimate) as total_cost
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN query_sessions qs ON u.id = qs.user_id
LEFT JOIN api_usage_logs aul ON u.id = aul.user_id
GROUP BY u.id, p.full_name, p.subscription_tier, p.current_api_usage, p.api_usage_limit;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;