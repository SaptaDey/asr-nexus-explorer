import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aogeenqytwrpjvrfwvjw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ2VlbnF5dHdycGp2cmZ3dmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODQwMzEsImV4cCI6MjA2NzM2MDAzMX0.AG8XsM7QCM8nYYvd0nrWjP-LhI4XUMkSnvBrUEZc50U';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    // Try to get counts from known tables
    const knownTables = [
      'profiles', 'research_sessions', 'graph_nodes', 'graph_edges',
      'stage_executions', 'hypotheses', 'knowledge_gaps', 'performance_metrics',
      'error_logs', 'activity_logs', 'research_collaborations', 'api_usage',
      'session_exports', 'query_sessions', 'query_figures', 'query_tables',
      'graph_data', 'stage_history', 'bias_analyses', 'research_results'
    ];
    
    console.log('Checking database tables...\n');
    
    const existingTables = [];
    
    for (const table of knownTables) {
      try {
        const result = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!result.error) {
          existingTables.push(table);
          console.log(`✓ Table: ${table} - Exists (${result.count || 0} rows)`);
        }
      } catch (e) {
        // Table might not exist
      }
    }
    
    console.log(`\nFound ${existingTables.length} tables in the database.`);
    
    // Check storage buckets
    console.log('\nChecking storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (!bucketsError && buckets) {
      console.log('\nStorage buckets:');
      for (const bucket of buckets) {
        console.log(`- ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      }
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkSchema();