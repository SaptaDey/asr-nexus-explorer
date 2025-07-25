-- CRITICAL SECURITY FIX: Secure all database functions
-- This migration adds SECURITY DEFINER and search_path protection to all functions

-- Fix update_updated_at_column function (most common)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Recreate all triggers that use this function
CREATE TRIGGER update_query_sessions_updated_at 
  BEFORE UPDATE ON query_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_research_sessions_updated_at 
  BEFORE UPDATE ON research_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_graph_nodes_updated_at 
  BEFORE UPDATE ON graph_nodes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_graph_edges_updated_at 
  BEFORE UPDATE ON graph_edges 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hypotheses_updated_at 
  BEFORE UPDATE ON hypotheses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_gaps_updated_at 
  BEFORE UPDATE ON knowledge_gaps 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_credentials_updated_at 
  BEFORE UPDATE ON api_credentials 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_research_templates_updated_at 
  BEFORE UPDATE ON research_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Fix increment_api_usage function
CREATE OR REPLACE FUNCTION increment_api_usage(
  p_user_id UUID,
  p_model TEXT,
  p_operation TEXT,
  p_token_count INTEGER
) RETURNS VOID AS $$
BEGIN
  -- Update user_analytics table
  INSERT INTO user_analytics (
    user_id,
    total_api_calls,
    api_calls_by_model,
    api_calls_by_operation,
    total_tokens_used,
    last_api_call,
    updated_at
  ) VALUES (
    p_user_id,
    1,
    jsonb_build_object(p_model, 1),
    jsonb_build_object(p_operation, 1),
    p_token_count,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_api_calls = user_analytics.total_api_calls + 1,
    api_calls_by_model = user_analytics.api_calls_by_model || 
      jsonb_build_object(p_model, COALESCE((user_analytics.api_calls_by_model->p_model)::integer, 0) + 1),
    api_calls_by_operation = user_analytics.api_calls_by_operation || 
      jsonb_build_object(p_operation, COALESCE((user_analytics.api_calls_by_operation->p_operation)::integer, 0) + 1),
    total_tokens_used = user_analytics.total_tokens_used + p_token_count,
    last_api_call = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Fix reset_monthly_api_usage function
CREATE OR REPLACE FUNCTION reset_monthly_api_usage() 
RETURNS VOID AS $$
BEGIN
  UPDATE user_analytics
  SET 
    total_api_calls = 0,
    api_calls_by_model = '{}'::jsonb,
    api_calls_by_operation = '{}'::jsonb,
    total_tokens_used = 0,
    updated_at = NOW()
  WHERE EXTRACT(DAY FROM NOW()) = 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Fix cleanup_expired_backups function
CREATE OR REPLACE FUNCTION cleanup_expired_backups()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM export_backups
  WHERE expires_at < NOW()
  RETURNING count(*) INTO deleted_count;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Fix is_cache_entry_expired function
CREATE OR REPLACE FUNCTION is_cache_entry_expired(entry_timestamp TIMESTAMPTZ, entry_ttl INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN entry_timestamp + (entry_ttl || ' seconds')::INTERVAL < NOW();
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = '';

-- Fix cleanup_expired_cache_entries function
CREATE OR REPLACE FUNCTION cleanup_expired_cache_entries()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM cache_entries
  WHERE is_cache_entry_expired(created_at, ttl);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Fix get_cache_statistics function
CREATE OR REPLACE FUNCTION get_cache_statistics()
RETURNS TABLE(
  total_entries BIGINT,
  total_size_bytes BIGINT,
  expired_entries BIGINT,
  active_entries BIGINT,
  avg_ttl_seconds NUMERIC,
  oldest_entry TIMESTAMPTZ,
  newest_entry TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_entries,
    SUM(LENGTH(value::text))::BIGINT as total_size_bytes,
    COUNT(*) FILTER (WHERE is_cache_entry_expired(created_at, ttl))::BIGINT as expired_entries,
    COUNT(*) FILTER (WHERE NOT is_cache_entry_expired(created_at, ttl))::BIGINT as active_entries,
    AVG(ttl)::NUMERIC as avg_ttl_seconds,
    MIN(created_at) as oldest_entry,
    MAX(created_at) as newest_entry
  FROM cache_entries;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Fix get_top_cache_keys function
CREATE OR REPLACE FUNCTION get_top_cache_keys(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  cache_key TEXT,
  entry_count BIGINT,
  total_size_bytes BIGINT,
  avg_ttl_seconds NUMERIC,
  last_updated TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    key as cache_key,
    COUNT(*)::BIGINT as entry_count,
    SUM(LENGTH(value::text))::BIGINT as total_size_bytes,
    AVG(ttl)::NUMERIC as avg_ttl_seconds,
    MAX(updated_at) as last_updated
  FROM cache_entries
  GROUP BY key
  ORDER BY entry_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Fix calculate_confidence_vector function
CREATE OR REPLACE FUNCTION calculate_confidence_vector(
    p_empirical_support DECIMAL,
    p_theoretical_basis DECIMAL,
    p_methodological_rigor DECIMAL,
    p_consensus_alignment DECIMAL
) RETURNS DECIMAL[] AS $$
BEGIN
    RETURN ARRAY[
        p_empirical_support,
        p_theoretical_basis,
        p_methodological_rigor,
        p_consensus_alignment
    ];
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = '';

-- Fix update_botanical_metadata function
CREATE OR REPLACE FUNCTION update_botanical_metadata(
    p_node_id UUID,
    p_growth_stage TEXT,
    p_is_pruned BOOLEAN DEFAULT FALSE
) RETURNS VOID AS $$
BEGIN
    UPDATE tree_nodes
    SET 
        botanical_metadata = botanical_metadata || 
        jsonb_build_object(
            'growth_stage', p_growth_stage,
            'is_pruned', p_is_pruned,
            'last_updated', NOW()
        ),
        updated_at = NOW()
    WHERE id = p_node_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Add security comment
COMMENT ON SCHEMA public IS 'All functions in this schema use SECURITY DEFINER with restricted search_path for security.';