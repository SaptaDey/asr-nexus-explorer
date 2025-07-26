import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aogeenqytwrpjvrfwvjw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ2VlbnF5dHdycGp2cmZ3dmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODQwMzEsImV4cCI6MjA2NzM2MDAzMX0.AG8XsM7QCM8nYYvd0nrWjP-LhI4XUMkSnvBrUEZc50U';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableColumns() {
  console.log('🔍 Checking actual table column structures...\n');

  const tablesToCheck = [
    'research_sessions',
    'stage_executions', 
    'graph_nodes',
    'graph_edges'
  ];

  for (const table of tablesToCheck) {
    console.log(`\n📋 Checking ${table}:`);
    
    // Try different test insertions to reveal column names
    const testCases = [
      { current_stage: 1 },
      { stage_name: 'test' },
      { stage_number: 1 },
      { title: 'test' },
      { description: 'test' },
      { status: 'draft' },
      { node_id: 'test' },
      { edge_id: 'test' },
      { label: 'test' },
      { node_type: 'test' },
      { edge_type: 'test' },
      { source_node_id: 'test' },
      { target_node_id: 'test' }
    ];

    const validColumns = [];
    const invalidColumns = [];

    for (const testData of testCases) {
      try {
        const { error } = await supabase
          .from(table)
          .insert(testData);
        
        if (error) {
          if (error.message.includes('does not exist')) {
            const columnName = Object.keys(testData)[0];
            invalidColumns.push(columnName);
            console.log(`  ❌ Column missing: ${columnName}`);
          } else if (error.message.includes('violates')) {
            const columnName = Object.keys(testData)[0];
            validColumns.push(columnName);
            console.log(`  ✅ Column exists: ${columnName} (RLS blocked)`);
          } else {
            console.log(`  ⚠️ Other error for ${Object.keys(testData)[0]}: ${error.message}`);
          }
        } else {
          const columnName = Object.keys(testData)[0];
          validColumns.push(columnName);
          console.log(`  ✅ Column exists: ${columnName} (insert succeeded - cleanup needed)`);
        }
      } catch (err) {
        console.log(`  ❌ Error testing ${Object.keys(testData)[0]}: ${err.message}`);
      }
    }

    console.log(`\n  Summary for ${table}:`);
    console.log(`    Valid columns: ${validColumns.join(', ') || 'none detected'}`);
    console.log(`    Missing columns: ${invalidColumns.join(', ') || 'none detected'}`);
  }
}

// Also check what tables actually exist
async function listExistingTables() {
  console.log('\n🗂️ Verifying table existence:\n');

  const expectedTables = [
    'profiles', 'research_sessions', 'graph_nodes', 'graph_edges',
    'stage_executions', 'hypotheses', 'knowledge_gaps', 'performance_metrics',
    'error_logs', 'activity_logs', 'research_collaborations', 'api_usage',
    'session_exports', 'stage_history', 'bias_analyses', 'research_results'
  ];

  for (const table of expectedTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`❌ Table missing: ${table}`);
        } else {
          console.log(`✅ Table exists: ${table} (${count || 0} rows)`);
        }
      } else {
        console.log(`✅ Table exists: ${table} (${count || 0} rows)`);
      }
    } catch (err) {
      console.log(`❌ Error checking ${table}: ${err.message}`);
    }
  }
}

await listExistingTables();
await checkTableColumns();

console.log('\n🔧 Based on findings, will generate corrected schema...');