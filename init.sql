-- ASR-GoT Database Initialization Script

-- Create database if not exists (handled by Docker)
-- CREATE DATABASE IF NOT EXISTS asr_nexus_db;

-- Create user and grant permissions (handled by Docker)
-- CREATE USER IF NOT EXISTS 'asr_user'@'%' IDENTIFIED BY 'secure_password_123';
-- GRANT ALL PRIVILEGES ON asr_nexus_db.* TO 'asr_user'@'%';

-- Additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_research_sessions_user_id ON research_sessions(userId);
CREATE INDEX IF NOT EXISTS idx_research_sessions_created_at ON research_sessions(createdAt);
CREATE INDEX IF NOT EXISTS idx_research_sessions_updated_at ON research_sessions(updatedAt);
CREATE INDEX IF NOT EXISTS idx_research_sessions_current_stage ON research_sessions(currentStage);

CREATE INDEX IF NOT EXISTS idx_graph_nodes_session_id ON graph_nodes(sessionId);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_type ON graph_nodes(type);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_created_at ON graph_nodes(createdAt);

CREATE INDEX IF NOT EXISTS idx_graph_edges_session_id ON graph_edges(sessionId);
CREATE INDEX IF NOT EXISTS idx_graph_edges_source_id ON graph_edges(sourceId);
CREATE INDEX IF NOT EXISTS idx_graph_edges_target_id ON graph_edges(targetId);
CREATE INDEX IF NOT EXISTS idx_graph_edges_type ON graph_edges(type);

CREATE INDEX IF NOT EXISTS idx_session_events_session_id ON session_events(sessionId);
CREATE INDEX IF NOT EXISTS idx_session_events_type ON session_events(type);
CREATE INDEX IF NOT EXISTS idx_session_events_timestamp ON session_events(timestamp);

CREATE INDEX IF NOT EXISTS idx_api_usage_session_id ON api_usage(sessionId);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(userId);
CREATE INDEX IF NOT EXISTS idx_api_usage_service ON api_usage(service);
CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp ON api_usage(timestamp);

CREATE INDEX IF NOT EXISTS idx_bias_audit_results_session_id ON bias_audit_results(sessionId);
CREATE INDEX IF NOT EXISTS idx_bias_audit_results_category ON bias_audit_results(category);
CREATE INDEX IF NOT EXISTS idx_bias_audit_results_status ON bias_audit_results(status);

CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp);

-- Create a view for session analytics
CREATE OR REPLACE VIEW session_analytics AS
SELECT 
    rs.id,
    rs.topic,
    rs.field,
    rs.currentStage,
    rs.isComplete,
    rs.createdAt,
    rs.updatedAt,
    COUNT(DISTINCT gn.id) as node_count,
    COUNT(DISTINCT ge.id) as edge_count,
    COUNT(DISTINCT se.id) as event_count,
    COALESCE(SUM(au.cost), 0) as total_cost,
    COALESCE(SUM(au.tokens), 0) as total_tokens
FROM research_sessions rs
LEFT JOIN graph_nodes gn ON rs.id = gn.sessionId
LEFT JOIN graph_edges ge ON rs.id = ge.sessionId  
LEFT JOIN session_events se ON rs.id = se.sessionId
LEFT JOIN api_usage au ON rs.id = au.sessionId
GROUP BY rs.id, rs.topic, rs.field, rs.currentStage, rs.isComplete, rs.createdAt, rs.updatedAt;

-- Insert initial system metrics
INSERT INTO system_metrics (activeUsers, activeSessions, totalNodes, totalEdges, apiCalls)
VALUES (0, 0, 0, 0, '{"gemini": 0, "sonar": 0}')
ON CONFLICT DO NOTHING;