// EMERGENCY SECURITY MIGRATION RUNNER
// This directly executes the RLS policies using the Supabase client

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://aogeenqytwrpjvrfwvjw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ2VlbnF5dHdycGp2cmZ3dmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODQwMzEsImV4cCI6MjA2NzM2MDAzMX0.AG8XsM7QCM8nYYvd0nrWjP-LhI4XUMkSnvBrUEZc50U";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function applyEmergencySecurityFix() {
  console.log('🚨 APPLYING EMERGENCY SECURITY POLICIES...');
  
  const applied = [];
  const errors = [];

  // Enable RLS on all tables
  const rlsCommands = [
    'ALTER TABLE query_sessions ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE query_figures ENABLE ROW LEVEL SECURITY;',  
    'ALTER TABLE query_tables ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE graph_data ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE stage_executions ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE research_sessions ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;'
  ];

  for (const sql of rlsCommands) {
    try {
      console.log(`Executing: ${sql}`);
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) {
        console.warn(`⚠️ Warning: ${error.message}`);
        errors.push(`${sql}: ${error.message}`);
      } else {
        applied.push(sql);
        console.log('✅ Success');
      }
    } catch (err) {
      console.error(`❌ Error: ${err}`);
      errors.push(`${sql}: ${err}`);
    }
  }

  // Create strict RLS policies
  const policies = [
    // QUERY_SESSIONS
    `CREATE POLICY "query_sessions_select" ON query_sessions FOR SELECT USING (auth.uid() = user_id);`,
    `CREATE POLICY "query_sessions_insert" ON query_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);`,
    `CREATE POLICY "query_sessions_update" ON query_sessions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`,
    `CREATE POLICY "query_sessions_delete" ON query_sessions FOR DELETE USING (auth.uid() = user_id);`,
    
    // RESEARCH_SESSIONS
    `CREATE POLICY "research_sessions_select" ON research_sessions FOR SELECT USING (auth.uid() = user_id);`,
    `CREATE POLICY "research_sessions_insert" ON research_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);`,
    `CREATE POLICY "research_sessions_update" ON research_sessions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`,
    `CREATE POLICY "research_sessions_delete" ON research_sessions FOR DELETE USING (auth.uid() = user_id);`,
    
    // PROFILES
    `CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = user_id);`,
    `CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);`,
    `CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`,
    `CREATE POLICY "profiles_delete" ON profiles FOR DELETE USING (auth.uid() = user_id);`,
  ];

  for (const sql of policies) {
    try {
      console.log(`Creating policy: ${sql.substring(0, 60)}...`);
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) {
        console.warn(`⚠️ Policy warning: ${error.message}`);
        errors.push(`Policy: ${error.message}`);
      } else {
        applied.push(`Policy created`);
        console.log('✅ Policy created');
      }
    } catch (err) {
      console.error(`❌ Policy error: ${err}`);
      errors.push(`Policy: ${err}`);
    }
  }

  console.log(`\n📊 RESULTS:`);
  console.log(`✅ Applied: ${applied.length}`);
  console.log(`❌ Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORS:');
    errors.forEach(error => console.log(`  - ${error}`));
  }
}

applyEmergencySecurityFix().catch(console.error);