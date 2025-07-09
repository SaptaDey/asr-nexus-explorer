-- Add Graph Snapshots Table for Versioning
-- Migration for graph snapshots and versioning functionality

-- Graph snapshots table for version control
CREATE TABLE graph_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
    snapshot_name TEXT NOT NULL,
    graph_data JSONB NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX idx_graph_snapshots_session_id ON graph_snapshots(session_id);
CREATE INDEX idx_graph_snapshots_created_by ON graph_snapshots(created_by);
CREATE INDEX idx_graph_snapshots_created_at ON graph_snapshots(created_at DESC);
CREATE INDEX idx_graph_snapshots_name ON graph_snapshots(session_id, snapshot_name);

-- RLS policies for graph snapshots
ALTER TABLE graph_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access snapshots of accessible sessions" ON graph_snapshots FOR ALL USING (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND status = 'accepted'
        )
    )
);

-- Comments for documentation
COMMENT ON TABLE graph_snapshots IS 'Graph snapshots for version control and backup';
COMMENT ON COLUMN graph_snapshots.snapshot_name IS 'User-defined name for the snapshot';
COMMENT ON COLUMN graph_snapshots.graph_data IS 'Complete graph data at the time of snapshot';
COMMENT ON COLUMN graph_snapshots.metadata IS 'Additional metadata about the snapshot';