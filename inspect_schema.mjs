import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aogeenqytwrpjvrfwvjw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ2VlbnF5dHdycGp2cmZ3dmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODQwMzEsImV4cCI6MjA2NzM2MDAzMX0.AG8XsM7QCM8nYYvd0nrWjP-LhI4XUMkSnvBrUEZc50U';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTableStructure(tableName) {
  console.log(`\n🔍 Inspecting table: ${tableName}`);
  
  try {
    // Try to get one record to see the structure
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ Error accessing ${tableName}: ${error.message}`);
      return null;
    }
    
    if (!data || data.length === 0) {
      // Table exists but is empty, try to get column info by attempting an insert with wrong data
      try {
        const { error: insertError } = await supabase
          .from(tableName)
          .insert({ invalid_column: 'test' });
        
        if (insertError) {
          console.log(`📋 ${tableName} schema hint: ${insertError.message}`);
        }
      } catch (e) {
        // Expected to fail
      }
      
      console.log(`✅ ${tableName}: Table exists but empty`);
      return { exists: true, empty: true };
    }
    
    console.log(`✅ ${tableName}: Has ${data.length} records`);
    console.log('Sample data structure:', Object.keys(data[0]));
    return { exists: true, empty: false, columns: Object.keys(data[0]) };
    
  } catch (error) {
    console.log(`❌ Failed to inspect ${tableName}: ${error.message}`);
    return null;
  }
}

async function comprehensiveSchemaAnalysis() {
  console.log('🔬 Comprehensive Database Schema Analysis\n');
  
  const tables = [
    'profiles',
    'research_sessions', 
    'graph_nodes',
    'graph_edges',
    'stage_executions',
    'hypotheses',
    'knowledge_gaps',
    'performance_metrics',
    'error_logs',
    'activity_logs',
    'research_collaborations',
    'api_usage',
    'session_exports',
    'query_sessions',
    'query_figures', 
    'query_tables',
    'graph_data',
    'stage_history',
    'bias_analyses',
    'research_results'
  ];
  
  const schemaInfo = {};
  
  for (const table of tables) {
    const info = await inspectTableStructure(table);
    schemaInfo[table] = info;
  }
  
  // Generate corrected schema
  console.log('\n📝 Generating corrected schema based on analysis...');
  
  return schemaInfo;
}

async function createCorrectedMigration(schemaInfo) {
  console.log('\n🔧 Creating corrected migration script...\n');
  
  // Based on the typical ASR-GoT schema from the codebase
  const correctedSchema = `
-- ASR-GoT Corrected Backend Organization
-- Based on actual database inspection

-- Enable RLS on all existing tables
${Object.keys(schemaInfo).map(table => 
  schemaInfo[table]?.exists ? `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;` : `-- ${table} not found`
).join('\n')}

-- Create missing tables if needed
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  research_interests TEXT[],
  expertise_areas TEXT[],
  institution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS research_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Basic RLS Policies
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own sessions" ON research_sessions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON research_sessions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON research_sessions 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON research_sessions 
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_research_sessions_updated_at ON research_sessions;
CREATE TRIGGER update_research_sessions_updated_at 
  BEFORE UPDATE ON research_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_research_sessions_user_id ON research_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_research_sessions_status ON research_sessions(status);
CREATE INDEX IF NOT EXISTS idx_research_sessions_created_at ON research_sessions(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE research_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create health check function
CREATE OR REPLACE FUNCTION get_database_health()
RETURNS TABLE (
  metric_name TEXT,
  metric_value BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'total_users'::TEXT, COUNT(*)::BIGINT FROM auth.users
  UNION ALL
  SELECT 'total_sessions'::TEXT, COUNT(*)::BIGINT FROM research_sessions
  UNION ALL
  SELECT 'active_sessions_today'::TEXT, COUNT(*)::BIGINT FROM research_sessions 
    WHERE updated_at > CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  return correctedSchema;
}

// Run the analysis
const schemaInfo = await comprehensiveSchemaAnalysis();
const correctedMigration = await createCorrectedMigration(schemaInfo);

console.log('\n📄 Corrected Migration Script:');
console.log(correctedMigration);

console.log('\n✅ Analysis complete! Use the generated migration script in Supabase Dashboard SQL Editor.');