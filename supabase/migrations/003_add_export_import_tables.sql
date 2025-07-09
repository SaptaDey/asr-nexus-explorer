-- Add Export/Import Tables for Data Portability
-- Migration for comprehensive data export/import functionality

-- Export templates table
CREATE TABLE export_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    options JSONB NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT FALSE
);

-- Import history table
CREATE TABLE import_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    import_type TEXT NOT NULL,
    import_format TEXT NOT NULL,
    records_processed INTEGER DEFAULT 0,
    records_imported INTEGER DEFAULT 0,
    records_skipped INTEGER DEFAULT 0,
    file_size_bytes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Import backups table (for rollback functionality)
CREATE TABLE import_backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_id UUID REFERENCES import_history(id) ON DELETE CASCADE,
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
    backup_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Data validation logs table
CREATE TABLE data_validation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('export', 'import')),
    operation_id TEXT NOT NULL,
    validation_result JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_export_templates_created_by ON export_templates(created_by);
CREATE INDEX idx_export_templates_public ON export_templates(is_public);
CREATE INDEX idx_export_templates_usage ON export_templates(usage_count DESC);

CREATE INDEX idx_import_history_session_id ON import_history(session_id);
CREATE INDEX idx_import_history_user_id ON import_history(user_id);
CREATE INDEX idx_import_history_created_at ON import_history(created_at DESC);

CREATE INDEX idx_import_backups_import_id ON import_backups(import_id);
CREATE INDEX idx_import_backups_session_id ON import_backups(session_id);
CREATE INDEX idx_import_backups_expires_at ON import_backups(expires_at);

CREATE INDEX idx_data_validation_logs_session_id ON data_validation_logs(session_id);
CREATE INDEX idx_data_validation_logs_operation ON data_validation_logs(operation_type, operation_id);

-- RLS policies
ALTER TABLE export_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_validation_logs ENABLE ROW LEVEL SECURITY;

-- Export templates policies
CREATE POLICY "Users can view public templates and own templates" ON export_templates FOR SELECT USING (
    is_public = true OR created_by = auth.uid()
);

CREATE POLICY "Users can create own templates" ON export_templates FOR INSERT WITH CHECK (
    created_by = auth.uid()
);

CREATE POLICY "Users can update own templates" ON export_templates FOR UPDATE USING (
    created_by = auth.uid()
);

CREATE POLICY "Users can delete own templates" ON export_templates FOR DELETE USING (
    created_by = auth.uid()
);

-- Import history policies
CREATE POLICY "Users can view import history of accessible sessions" ON import_history FOR SELECT USING (
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

CREATE POLICY "Users can create import history" ON import_history FOR INSERT WITH CHECK (
    user_id = auth.uid()
);

-- Import backups policies
CREATE POLICY "Users can access backups of accessible sessions" ON import_backups FOR ALL USING (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND status = 'accepted'
        )
    )
);

-- Data validation logs policies
CREATE POLICY "Users can access validation logs of accessible sessions" ON data_validation_logs FOR ALL USING (
    session_id IN (
        SELECT id FROM research_sessions WHERE 
        user_id = auth.uid() OR 
        id IN (
            SELECT session_id FROM research_collaborations 
            WHERE collaborator_id = auth.uid() AND status = 'accepted'
        )
    )
);

-- Triggers for automatic updated_at
CREATE TRIGGER update_export_templates_updated_at 
    BEFORE UPDATE ON export_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired backups
CREATE OR REPLACE FUNCTION cleanup_expired_backups()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM import_backups 
    WHERE expires_at < NOW();
END;
$$;

-- Schedule cleanup function (would need pg_cron extension)
-- SELECT cron.schedule('cleanup-expired-backups', '0 2 * * *', 'SELECT cleanup_expired_backups();');

-- Comments for documentation
COMMENT ON TABLE export_templates IS 'Reusable templates for data export configurations';
COMMENT ON TABLE import_history IS 'History of data import operations with metrics';
COMMENT ON TABLE import_backups IS 'Backup data for import rollback functionality';
COMMENT ON TABLE data_validation_logs IS 'Logs of data validation results for exports and imports';

COMMENT ON COLUMN export_templates.options IS 'Export configuration options in JSON format';
COMMENT ON COLUMN import_history.metadata IS 'Additional metadata about the import operation';
COMMENT ON COLUMN import_backups.backup_data IS 'Complete backup of session data before import';
COMMENT ON COLUMN data_validation_logs.validation_result IS 'Detailed validation results and errors';