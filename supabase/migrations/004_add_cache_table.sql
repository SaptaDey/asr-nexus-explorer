-- Add Cache Table for Performance Optimization
-- Migration for database-backed cache persistence

-- Cache entries table for disk persistence
CREATE TABLE cache_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    ttl INTEGER NOT NULL, -- TTL in milliseconds
    access_count INTEGER DEFAULT 0,
    size INTEGER DEFAULT 0, -- Size in bytes
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes for cache operations
CREATE INDEX idx_cache_entries_key ON cache_entries(key);
CREATE INDEX idx_cache_entries_timestamp ON cache_entries(timestamp);
CREATE INDEX idx_cache_entries_ttl ON cache_entries(timestamp, ttl);
CREATE INDEX idx_cache_entries_access_count ON cache_entries(access_count DESC);
CREATE INDEX idx_cache_entries_size ON cache_entries(size DESC);

-- Partial indexes for common queries
CREATE INDEX idx_cache_entries_session_id ON cache_entries(((metadata->>'sessionId')::text)) WHERE metadata->>'sessionId' IS NOT NULL;
CREATE INDEX idx_cache_entries_user_id ON cache_entries(((metadata->>'userId')::text)) WHERE metadata->>'userId' IS NOT NULL;
CREATE INDEX idx_cache_entries_priority ON cache_entries(((metadata->>'priority')::text));
CREATE INDEX idx_cache_entries_tags ON cache_entries USING GIN ((metadata->'tags'));

-- Function to check if cache entry is expired
CREATE OR REPLACE FUNCTION is_cache_entry_expired(entry_timestamp TIMESTAMPTZ, entry_ttl INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN (EXTRACT(EPOCH FROM NOW()) * 1000) > (EXTRACT(EPOCH FROM entry_timestamp) * 1000) + entry_ttl;
END;
$$;

-- Function to cleanup expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache_entries()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM cache_entries 
    WHERE is_cache_entry_expired(timestamp, ttl);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Function to get cache statistics
CREATE OR REPLACE FUNCTION get_cache_statistics()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    stats JSONB;
    total_entries INTEGER;
    total_size BIGINT;
    expired_entries INTEGER;
    avg_access_count NUMERIC;
BEGIN
    SELECT 
        COUNT(*),
        COALESCE(SUM(size), 0),
        COUNT(*) FILTER (WHERE is_cache_entry_expired(timestamp, ttl)),
        COALESCE(AVG(access_count), 0)
    INTO 
        total_entries,
        total_size,
        expired_entries,
        avg_access_count
    FROM cache_entries;
    
    stats := jsonb_build_object(
        'totalEntries', total_entries,
        'totalSize', total_size,
        'expiredEntries', expired_entries,
        'activeEntries', total_entries - expired_entries,
        'averageAccessCount', avg_access_count,
        'lastUpdated', NOW()
    );
    
    RETURN stats;
END;
$$;

-- Function to get top cache keys by access count
CREATE OR REPLACE FUNCTION get_top_cache_keys(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
    key TEXT,
    access_count INTEGER,
    size INTEGER,
    last_accessed TIMESTAMPTZ,
    is_expired BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ce.key,
        ce.access_count,
        ce.size,
        ce.updated_at as last_accessed,
        is_cache_entry_expired(ce.timestamp, ce.ttl) as is_expired
    FROM cache_entries ce
    ORDER BY ce.access_count DESC
    LIMIT limit_count;
END;
$$;

-- Trigger to update the updated_at timestamp
CREATE TRIGGER update_cache_entries_updated_at 
    BEFORE UPDATE ON cache_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS policies for cache entries
ALTER TABLE cache_entries ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to access their own cache entries
CREATE POLICY "Users can access their own cache entries" ON cache_entries FOR ALL USING (
    (metadata->>'userId')::text = auth.uid()::text
    OR 
    (metadata->>'sessionId')::text IN (
        SELECT id::text FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id::text IN (
            SELECT session_id::text FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND status = 'accepted'
        )
    )
);

-- Policy to allow system cache entries (no user/session metadata)
CREATE POLICY "Allow system cache entries" ON cache_entries FOR ALL USING (
    metadata->>'userId' IS NULL AND metadata->>'sessionId' IS NULL
);

-- View for cache performance monitoring
CREATE VIEW cache_performance_view AS
SELECT 
    key,
    access_count,
    size,
    timestamp,
    ttl,
    is_cache_entry_expired(timestamp, ttl) as is_expired,
    metadata->>'priority' as priority,
    metadata->>'sessionId' as session_id,
    metadata->>'userId' as user_id,
    metadata->'tags' as tags,
    (metadata->>'compressed')::boolean as is_compressed,
    (metadata->>'encrypted')::boolean as is_encrypted,
    updated_at as last_accessed
FROM cache_entries
ORDER BY access_count DESC;

-- Schedule automatic cleanup (requires pg_cron extension)
-- This would need to be enabled manually if pg_cron is available
/*
SELECT cron.schedule(
    'cache-cleanup',
    '0 */6 * * *', -- Every 6 hours
    'SELECT cleanup_expired_cache_entries();'
);
*/

-- Comments for documentation
COMMENT ON TABLE cache_entries IS 'Persistent cache storage for performance optimization';
COMMENT ON COLUMN cache_entries.key IS 'Unique cache key identifier';
COMMENT ON COLUMN cache_entries.value IS 'Cached value in JSON format';
COMMENT ON COLUMN cache_entries.timestamp IS 'When the cache entry was created';
COMMENT ON COLUMN cache_entries.ttl IS 'Time to live in milliseconds';
COMMENT ON COLUMN cache_entries.access_count IS 'Number of times this entry has been accessed';
COMMENT ON COLUMN cache_entries.size IS 'Estimated size of the cached value in bytes';
COMMENT ON COLUMN cache_entries.metadata IS 'Additional metadata including user, session, tags, and flags';

COMMENT ON FUNCTION is_cache_entry_expired(TIMESTAMPTZ, INTEGER) IS 'Check if a cache entry has expired based on timestamp and TTL';
COMMENT ON FUNCTION cleanup_expired_cache_entries() IS 'Remove all expired cache entries and return count of deleted entries';
COMMENT ON FUNCTION get_cache_statistics() IS 'Get comprehensive cache statistics';
COMMENT ON FUNCTION get_top_cache_keys(INTEGER) IS 'Get top cache keys ordered by access count';

COMMENT ON VIEW cache_performance_view IS 'Performance monitoring view for cache entries with computed fields';