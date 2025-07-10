-- Create tree_states table for storing botanical tree data
CREATE TABLE tree_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    research_topic TEXT NOT NULL,
    current_stage INTEGER NOT NULL DEFAULT 0,
    graph_data JSONB NOT NULL,
    botanical_metadata JSONB NOT NULL DEFAULT '{
        "evidence_deltas": {},
        "confidence_vectors": {},
        "disciplinary_mappings": {},
        "impact_scores": {},
        "bias_flags": {},
        "quality_assessments": {}
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_stage CHECK (current_stage >= 0 AND current_stage <= 9)
);

-- Create tree_evolution_logs table for tracking tree changes
CREATE TABLE tree_evolution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tree_id UUID NOT NULL REFERENCES tree_states(id) ON DELETE CASCADE,
    stage INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action TEXT NOT NULL,
    data JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    CONSTRAINT valid_action CHECK (action IN (
        'node_added', 
        'node_updated', 
        'edge_added', 
        'confidence_updated', 
        'evidence_added'
    ))
);

-- Create indexes for performance
CREATE INDEX idx_tree_states_user_id ON tree_states(user_id);
CREATE INDEX idx_tree_states_updated_at ON tree_states(updated_at DESC);
CREATE INDEX idx_tree_states_current_stage ON tree_states(current_stage);
CREATE INDEX idx_tree_evolution_logs_tree_id ON tree_evolution_logs(tree_id);
CREATE INDEX idx_tree_evolution_logs_timestamp ON tree_evolution_logs(timestamp DESC);
CREATE INDEX idx_tree_evolution_logs_action ON tree_evolution_logs(action);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_tree_states_updated_at 
    BEFORE UPDATE ON tree_states 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE tree_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE tree_evolution_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tree_states
CREATE POLICY "Users can view their own trees" 
    ON tree_states FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trees" 
    ON tree_states FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trees" 
    ON tree_states FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trees" 
    ON tree_states FOR DELETE 
    USING (auth.uid() = user_id);

-- Create RLS policies for tree_evolution_logs
CREATE POLICY "Users can view evolution logs for their trees" 
    ON tree_evolution_logs FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM tree_states 
            WHERE id = tree_evolution_logs.tree_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create evolution logs for their trees" 
    ON tree_evolution_logs FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tree_states 
            WHERE id = tree_evolution_logs.tree_id 
            AND user_id = auth.uid()
        )
    );

-- Create view for tree statistics
CREATE VIEW tree_statistics AS
SELECT 
    ts.id,
    ts.user_id,
    ts.research_topic,
    ts.current_stage,
    ts.created_at,
    ts.updated_at,
    JSONB_ARRAY_LENGTH(ts.graph_data->'nodes') as node_count,
    JSONB_ARRAY_LENGTH(ts.graph_data->'edges') as edge_count,
    COUNT(tel.id) as evolution_count,
    MAX(tel.timestamp) as last_evolution
FROM tree_states ts
LEFT JOIN tree_evolution_logs tel ON ts.id = tel.tree_id
GROUP BY ts.id, ts.user_id, ts.research_topic, ts.current_stage, ts.created_at, ts.updated_at, ts.graph_data;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON tree_states TO authenticated;
GRANT SELECT, INSERT ON tree_evolution_logs TO authenticated;
GRANT SELECT ON tree_statistics TO authenticated;

-- Create function to calculate confidence vectors
CREATE OR REPLACE FUNCTION calculate_confidence_vector(
    evidence_nodes JSONB,
    edge_weights JSONB DEFAULT '{}'
) RETURNS JSONB AS $$
DECLARE
    empirical_score NUMERIC := 0;
    theoretical_score NUMERIC := 0;
    methodological_score NUMERIC := 0;
    consensus_score NUMERIC := 0;
    node_count INTEGER := 0;
    result JSONB;
BEGIN
    -- Count evidence nodes
    SELECT JSONB_ARRAY_LENGTH(evidence_nodes) INTO node_count;
    
    IF node_count = 0 THEN
        RETURN jsonb_build_object(
            'vector', jsonb_build_array(0.5, 0.5, 0.5, 0.5),
            'aggregated', 0.5,
            'metadata', jsonb_build_object(
                'evidence_count', 0,
                'quality_score', 0
            )
        );
    END IF;
    
    -- Calculate empirical support
    SELECT AVG(
        CASE 
            WHEN node->'metadata'->>'evidence_quality' = 'high' THEN 0.8
            WHEN node->'metadata'->>'evidence_quality' = 'medium' THEN 0.6
            ELSE 0.4
        END
    ) INTO empirical_score
    FROM jsonb_array_elements(evidence_nodes) AS node;
    
    -- Calculate theoretical basis
    SELECT AVG(
        CASE 
            WHEN node->'metadata'->>'peer_review_status' = 'peer-reviewed' THEN 0.7
            WHEN node->'metadata'->>'peer_review_status' = 'preprint' THEN 0.5
            ELSE 0.3
        END
    ) INTO theoretical_score
    FROM jsonb_array_elements(evidence_nodes) AS node;
    
    -- Calculate methodological rigor
    SELECT AVG(
        COALESCE((node->'metadata'->>'statistical_power')::NUMERIC, 0.5)
    ) INTO methodological_score
    FROM jsonb_array_elements(evidence_nodes) AS node;
    
    -- Calculate consensus alignment
    SELECT AVG(
        COALESCE((node->'metadata'->>'publication_rank')::NUMERIC, 0.5)
    ) INTO consensus_score
    FROM jsonb_array_elements(evidence_nodes) AS node;
    
    -- Build result
    result := jsonb_build_object(
        'vector', jsonb_build_array(
            empirical_score,
            theoretical_score,
            methodological_score,
            consensus_score
        ),
        'aggregated', (empirical_score + theoretical_score + methodological_score + consensus_score) / 4,
        'metadata', jsonb_build_object(
            'evidence_count', node_count,
            'quality_score', (empirical_score + theoretical_score) / 2
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to update botanical metadata
CREATE OR REPLACE FUNCTION update_botanical_metadata(
    tree_id UUID,
    node_id TEXT,
    new_metadata JSONB
) RETURNS BOOLEAN AS $$
DECLARE
    current_botanical_metadata JSONB;
    updated_botanical_metadata JSONB;
BEGIN
    -- Get current botanical metadata
    SELECT botanical_metadata INTO current_botanical_metadata
    FROM tree_states
    WHERE id = tree_id AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update botanical metadata
    updated_botanical_metadata := current_botanical_metadata;
    
    -- Update confidence vectors
    IF new_metadata ? 'confidence_vector' THEN
        updated_botanical_metadata := jsonb_set(
            updated_botanical_metadata,
            array['confidence_vectors', node_id],
            new_metadata->'confidence_vector'
        );
    END IF;
    
    -- Update evidence deltas
    IF new_metadata ? 'confidence_delta' THEN
        updated_botanical_metadata := jsonb_set(
            updated_botanical_metadata,
            array['evidence_deltas', node_id],
            new_metadata->'confidence_delta'
        );
    END IF;
    
    -- Update impact scores
    IF new_metadata ? 'impact_score' THEN
        updated_botanical_metadata := jsonb_set(
            updated_botanical_metadata,
            array['impact_scores', node_id],
            new_metadata->'impact_score'
        );
    END IF;
    
    -- Update disciplinary mappings
    IF new_metadata ? 'disciplinary_tag' THEN
        updated_botanical_metadata := jsonb_set(
            updated_botanical_metadata,
            array['disciplinary_mappings', node_id],
            new_metadata->'disciplinary_tag'
        );
    END IF;
    
    -- Update bias flags
    IF new_metadata ? 'bias_flags' THEN
        updated_botanical_metadata := jsonb_set(
            updated_botanical_metadata,
            array['bias_flags', node_id],
            new_metadata->'bias_flags'
        );
    END IF;
    
    -- Save updated metadata
    UPDATE tree_states
    SET botanical_metadata = updated_botanical_metadata
    WHERE id = tree_id AND user_id = auth.uid();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_confidence_vector TO authenticated;
GRANT EXECUTE ON FUNCTION update_botanical_metadata TO authenticated;

-- Create indexes on JSONB fields for performance
CREATE INDEX idx_tree_states_graph_data_nodes ON tree_states USING GIN ((graph_data->'nodes'));
CREATE INDEX idx_tree_states_botanical_metadata ON tree_states USING GIN (botanical_metadata);
CREATE INDEX idx_tree_evolution_logs_data ON tree_evolution_logs USING GIN (data);

-- Add comments for documentation
COMMENT ON TABLE tree_states IS 'Stores botanical tree visualization states for ASR-GoT research framework';
COMMENT ON TABLE tree_evolution_logs IS 'Tracks evolution of botanical trees through research stages';
COMMENT ON FUNCTION calculate_confidence_vector IS 'Calculates multi-dimensional confidence vectors for evidence nodes';
COMMENT ON FUNCTION update_botanical_metadata IS 'Updates botanical metadata for tree nodes with proper validation';