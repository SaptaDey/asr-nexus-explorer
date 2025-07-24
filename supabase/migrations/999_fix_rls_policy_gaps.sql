-- Fix RLS Policy Gaps
-- This migration addresses missing RLS policies that could cause "new row violates row-level security policy" errors

-- Error logs policies - allow users to insert errors
CREATE POLICY "Users can insert error logs" ON error_logs FOR INSERT WITH CHECK (
    user_id = auth.uid() OR session_id IS NULL
);

CREATE POLICY "Users can update error logs of accessible sessions" ON error_logs FOR UPDATE USING (
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

-- Performance metrics policies - add specific INSERT policy
CREATE POLICY "Users can insert performance metrics for accessible sessions" ON performance_metrics FOR INSERT WITH CHECK (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND role IN ('owner', 'editor') AND status = 'accepted'
        )
    )
);

-- Activity logs policies - add specific INSERT policy
CREATE POLICY "Users can insert activity logs for accessible sessions" ON activity_logs FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND status = 'accepted'
        )
    )
);

-- Graph nodes and edges policies - split FOR ALL into specific policies for better control
DROP POLICY IF EXISTS "Users can access graph nodes of accessible sessions" ON graph_nodes;
DROP POLICY IF EXISTS "Users can access graph edges of accessible sessions" ON graph_edges;

-- Graph nodes - specific policies
CREATE POLICY "Users can select graph nodes of accessible sessions" ON graph_nodes FOR SELECT USING (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND status = 'accepted'
        )
    )
);

CREATE POLICY "Users can insert graph nodes to accessible sessions" ON graph_nodes FOR INSERT WITH CHECK (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND role IN ('owner', 'editor') AND status = 'accepted'
        )
    )
);

CREATE POLICY "Users can update graph nodes of accessible sessions" ON graph_nodes FOR UPDATE USING (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND role IN ('owner', 'editor') AND status = 'accepted'
        )
    )
);

CREATE POLICY "Users can delete graph nodes of accessible sessions" ON graph_nodes FOR DELETE USING (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND role IN ('owner', 'editor') AND status = 'accepted'
        )
    )
);

-- Graph edges - specific policies
CREATE POLICY "Users can select graph edges of accessible sessions" ON graph_edges FOR SELECT USING (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND status = 'accepted'
        )
    )
);

CREATE POLICY "Users can insert graph edges to accessible sessions" ON graph_edges FOR INSERT WITH CHECK (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND role IN ('owner', 'editor') AND status = 'accepted'
        )
    )
);

CREATE POLICY "Users can update graph edges of accessible sessions" ON graph_edges FOR UPDATE USING (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND role IN ('owner', 'editor') AND status = 'accepted'
        )
    )
);

CREATE POLICY "Users can delete graph edges of accessible sessions" ON graph_edges FOR DELETE USING (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND role IN ('owner', 'editor') AND status = 'accepted'
        )
    )
);

-- Stage executions policies - split FOR ALL and add specific INSERT check
DROP POLICY IF EXISTS "Users can access stage executions of accessible sessions" ON stage_executions;

CREATE POLICY "Users can select stage executions of accessible sessions" ON stage_executions FOR SELECT USING (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND status = 'accepted'
        )
    )
);

CREATE POLICY "Users can insert stage executions to accessible sessions" ON stage_executions FOR INSERT WITH CHECK (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND role IN ('owner', 'editor') AND status = 'accepted'
        )
    )
);

CREATE POLICY "Users can update stage executions of accessible sessions" ON stage_executions FOR UPDATE USING (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND role IN ('owner', 'editor') AND status = 'accepted'
        )
    )
);

-- Similar fixes for other tables with FOR ALL policies
DROP POLICY IF EXISTS "Users can access hypotheses of accessible sessions" ON hypotheses;
DROP POLICY IF EXISTS "Users can access knowledge gaps of accessible sessions" ON knowledge_gaps;
DROP POLICY IF EXISTS "Users can access performance metrics of accessible sessions" ON performance_metrics;
DROP POLICY IF EXISTS "Users can access activity logs of accessible sessions" ON activity_logs;

-- Hypotheses specific policies
CREATE POLICY "Users can select hypotheses of accessible sessions" ON hypotheses FOR SELECT USING (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND status = 'accepted'
        )
    )
);

CREATE POLICY "Users can insert hypotheses to accessible sessions" ON hypotheses FOR INSERT WITH CHECK (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND role IN ('owner', 'editor') AND status = 'accepted'
        )
    )
);

CREATE POLICY "Users can update hypotheses of accessible sessions" ON hypotheses FOR UPDATE USING (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND role IN ('owner', 'editor') AND status = 'accepted'
        )
    )
);

-- Knowledge gaps specific policies
CREATE POLICY "Users can select knowledge gaps of accessible sessions" ON knowledge_gaps FOR SELECT USING (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND status = 'accepted'
        )
    )
);

CREATE POLICY "Users can insert knowledge gaps to accessible sessions" ON knowledge_gaps FOR INSERT WITH CHECK (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND role IN ('owner', 'editor') AND status = 'accepted'
        )
    )
);

CREATE POLICY "Users can update knowledge gaps of accessible sessions" ON knowledge_gaps FOR UPDATE USING (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND role IN ('owner', 'editor') AND status = 'accepted'
        )
    )
);

-- Performance metrics specific policies (SELECT already exists, add others)
CREATE POLICY "Users can select performance metrics of accessible sessions" ON performance_metrics FOR SELECT USING (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND status = 'accepted'
        )
    )
);

-- Export history policies - ensure all operations are covered
DROP POLICY IF EXISTS "Users can access export history of accessible sessions" ON export_history;

CREATE POLICY "Users can select export history of accessible sessions" ON export_history FOR SELECT USING (
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

CREATE POLICY "Users can insert export history for accessible sessions" ON export_history FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND status = 'accepted'
        )
    )
);

CREATE POLICY "Users can update own export history" ON export_history FOR UPDATE USING (user_id = auth.uid());

-- Research collaborations - ensure proper INSERT policy
CREATE POLICY "Users can insert collaborations for own sessions" ON research_collaborations FOR INSERT WITH CHECK (
    session_id IN (SELECT id FROM research_sessions WHERE user_id = auth.uid())
);

-- Add missing DELETE policies where needed
CREATE POLICY "Users can delete hypotheses of accessible sessions" ON hypotheses FOR DELETE USING (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND role IN ('owner', 'editor') AND status = 'accepted'
        )
    )
);

CREATE POLICY "Users can delete knowledge gaps of accessible sessions" ON knowledge_gaps FOR DELETE USING (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND role IN ('owner', 'editor') AND status = 'accepted'
        )
    )
);

-- Function to safely check user access to sessions (for reuse in policies)
CREATE OR REPLACE FUNCTION user_can_access_session(session_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM research_sessions WHERE 
        id = session_uuid AND (
            user_id = auth.uid() OR 
            id IN (
                SELECT session_id FROM research_collaborations 
                WHERE collaborator_id = auth.uid() AND status = 'accepted'
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can edit session
CREATE OR REPLACE FUNCTION user_can_edit_session(session_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM research_sessions WHERE 
        id = session_uuid AND (
            user_id = auth.uid() OR 
            id IN (
                SELECT session_id FROM research_collaborations 
                WHERE collaborator_id = auth.uid() AND role IN ('owner', 'editor') AND status = 'accepted'
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments explaining the RLS policy structure
COMMENT ON POLICY "Users can select graph nodes of accessible sessions" ON graph_nodes IS 'Allows read access to graph nodes for session owners and collaborators';
COMMENT ON POLICY "Users can insert graph nodes to accessible sessions" ON graph_nodes IS 'Allows creating graph nodes for session owners and editors only';
COMMENT ON POLICY "Users can insert error logs" ON error_logs IS 'Allows users to report errors for their sessions or global errors';
COMMENT ON FUNCTION user_can_access_session(UUID) IS 'Helper function to check if user has any access to a session';
COMMENT ON FUNCTION user_can_edit_session(UUID) IS 'Helper function to check if user has edit access to a session';