-- Add missing tables identified in extensive_errors.md
-- These tables are referenced in the code but don't exist in the database

-- =====================================================
-- USER API KEYS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gemini', 'perplexity', 'openai')),
  encrypted_key TEXT NOT NULL,
  key_hint TEXT, -- Last 4 characters of the key for identification
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, provider)
);

-- Create index for performance
CREATE INDEX idx_user_api_keys_user_provider ON user_api_keys(user_id, provider);
CREATE INDEX idx_user_api_keys_active ON user_api_keys(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_api_keys
CREATE POLICY "Users can view own API keys" ON user_api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API keys" ON user_api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys" ON user_api_keys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys" ON user_api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- API USAGE LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES query_sessions(id) ON DELETE SET NULL,
  provider TEXT NOT NULL CHECK (provider IN ('gemini', 'perplexity', 'openai')),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  request_tokens INTEGER,
  response_tokens INTEGER,
  total_tokens INTEGER,
  cost_usd DECIMAL(10, 6),
  status_code INTEGER,
  error_message TEXT,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX idx_api_usage_logs_user_created ON api_usage_logs(user_id, created_at DESC);
CREATE INDEX idx_api_usage_logs_session ON api_usage_logs(session_id);
CREATE INDEX idx_api_usage_logs_provider ON api_usage_logs(provider, created_at DESC);

-- Enable RLS
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_usage_logs
CREATE POLICY "Users can view own API usage logs" ON api_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert API usage logs" ON api_usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- RESEARCH COLLECTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS research_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  session_ids UUID[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_research_collections_user ON research_collections(user_id);
CREATE INDEX idx_research_collections_public ON research_collections(is_public) WHERE is_public = true;
CREATE INDEX idx_research_collections_tags ON research_collections USING GIN(tags);

-- Enable RLS
ALTER TABLE research_collections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for research_collections
CREATE POLICY "Users can view own collections" ON research_collections
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own collections" ON research_collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections" ON research_collections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections" ON research_collections
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- QUERY BOOKMARKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS query_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES query_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  query_text TEXT NOT NULL,
  query_params JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_query_bookmarks_user ON query_bookmarks(user_id, created_at DESC);
CREATE INDEX idx_query_bookmarks_session ON query_bookmarks(session_id);
CREATE INDEX idx_query_bookmarks_favorite ON query_bookmarks(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_query_bookmarks_tags ON query_bookmarks USING GIN(tags);

-- Enable RLS
ALTER TABLE query_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for query_bookmarks
CREATE POLICY "Users can view own bookmarks" ON query_bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks" ON query_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmarks" ON query_bookmarks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" ON query_bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- ADD TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_user_api_keys_updated_at 
  BEFORE UPDATE ON user_api_keys 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_research_collections_updated_at 
  BEFORE UPDATE ON research_collections 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_query_bookmarks_updated_at 
  BEFORE UPDATE ON query_bookmarks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to safely update API key last used timestamp
CREATE OR REPLACE FUNCTION update_api_key_usage(
  p_user_id UUID,
  p_provider TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE user_api_keys
  SET 
    last_used_at = NOW(),
    usage_count = usage_count + 1
  WHERE user_id = p_user_id AND provider = p_provider AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Function to get user's active API providers
CREATE OR REPLACE FUNCTION get_user_active_providers(p_user_id UUID)
RETURNS TABLE(provider TEXT, is_active BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uk.provider,
    uk.is_active
  FROM user_api_keys uk
  WHERE uk.user_id = p_user_id AND uk.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Log migration
INSERT INTO public.migration_log (migration_name, applied_at, description) 
VALUES (
  '20250726000005_add_missing_tables',
  NOW(),
  'Added missing tables: user_api_keys, api_usage_logs, research_collections, query_bookmarks with proper RLS policies and indexes'
) ON CONFLICT (migration_name) DO UPDATE SET 
  applied_at = NOW(),
  description = EXCLUDED.description;