import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aogeenqytwrpjvrfwvjw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ2VlbnF5dHdycGp2cmZ3dmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODQwMzEsImV4cCI6MjA2NzM2MDAzMX0.AG8XsM7QCM8nYYvd0nrWjP-LhI4XUMkSnvBrUEZc50U';

const supabase = createClient(supabaseUrl, supabaseKey);

async function organizeDatabaseStructure() {
  console.log('🗃️ Organizing database structure...\n');
  
  // Test basic operations that don't require admin privileges
  const operations = [
    {
      name: 'Test profile access',
      action: async () => {
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        return { count, error };
      }
    },
    {
      name: 'Test research sessions access',
      action: async () => {
        const { count, error } = await supabase
          .from('research_sessions')
          .select('*', { count: 'exact', head: true });
        return { count, error };
      }
    },
    {
      name: 'Test graph nodes access',
      action: async () => {
        const { count, error } = await supabase
          .from('graph_nodes')
          .select('*', { count: 'exact', head: true });
        return { count, error };
      }
    },
    {
      name: 'Test storage bucket access',
      action: async () => {
        const { data, error } = await supabase.storage.listBuckets();
        return { data, error };
      }
    }
  ];
  
  for (const op of operations) {
    try {
      console.log(`Testing: ${op.name}`);
      const result = await op.action();
      
      if (result.error) {
        console.log(`❌ ${op.name}: ${result.error.message}`);
      } else {
        if (result.count !== undefined) {
          console.log(`✅ ${op.name}: ${result.count} rows`);
        } else if (result.data) {
          console.log(`✅ ${op.name}: ${result.data.length} items`);
        } else {
          console.log(`✅ ${op.name}: Success`);
        }
      }
    } catch (error) {
      console.log(`❌ ${op.name}: ${error.message}`);
    }
  }
  
  // Create some sample data to test the structure
  console.log('\n📝 Testing data operations...');
  
  try {
    // Try to insert a test session (this will fail if RLS is properly configured)
    const { data: testSession, error: sessionError } = await supabase
      .from('research_sessions')
      .insert({
        title: 'Test Session',
        description: 'Testing database structure',
        status: 'draft',
        current_stage: 1
      })
      .select()
      .single();
    
    if (sessionError) {
      console.log('❌ Cannot insert session (good - RLS might be working):', sessionError.message);
    } else {
      console.log('⚠️ Successfully inserted session without auth - RLS needs configuration');
      
      // Clean up test data
      await supabase
        .from('research_sessions')
        .delete()
        .eq('id', testSession.id);
    }
    
  } catch (error) {
    console.log('❌ Database operation failed:', error.message);
  }
}

async function checkDatabaseHealth() {
  console.log('\n🏥 Checking database health...\n');
  
  const healthChecks = [
    {
      name: 'Total users',
      query: () => supabase.from('profiles').select('*', { count: 'exact', head: true })
    },
    {
      name: 'Research sessions',
      query: () => supabase.from('research_sessions').select('*', { count: 'exact', head: true })
    },
    {
      name: 'Graph nodes',
      query: () => supabase.from('graph_nodes').select('*', { count: 'exact', head: true })  
    },
    {
      name: 'Graph edges',
      query: () => supabase.from('graph_edges').select('*', { count: 'exact', head: true })
    },
    {
      name: 'Stage executions',
      query: () => supabase.from('stage_executions').select('*', { count: 'exact', head: true })
    },
    {
      name: 'Activity logs',
      query: () => supabase.from('activity_logs').select('*', { count: 'exact', head: true })
    }
  ];
  
  const healthReport = {};
  
  for (const check of healthChecks) {
    try {
      const { count, error } = await check.query();
      if (error) {
        healthReport[check.name] = `Error: ${error.message}`;
        console.log(`❌ ${check.name}: ${error.message}`);
      } else {
        healthReport[check.name] = count || 0;
        console.log(`✅ ${check.name}: ${count || 0} records`);
      }
    } catch (error) {
      healthReport[check.name] = `Error: ${error.message}`;
      console.log(`❌ ${check.name}: ${error.message}`);
    }
  }
  
  return healthReport;
}

async function suggestImprovements() {
  console.log('\n💡 Backend optimization suggestions:\n');
  
  const suggestions = [
    '🔒 Enable Row Level Security (RLS) on all tables',
    '📝 Create proper RLS policies for user data isolation', 
    '🗂️ Set up storage buckets for file uploads',
    '⚡ Add database indexes for better performance',
    '🔍 Create database views for common queries',
    '🔧 Set up database functions and triggers',
    '📊 Implement monitoring and health checks',
    '🚀 Configure realtime subscriptions',
    '🔐 Set up proper authentication flows',
    '📈 Add analytics and usage tracking'
  ];
  
  suggestions.forEach(suggestion => console.log(suggestion));
  
  console.log('\n📋 Next steps:');
  console.log('1. Access Supabase Dashboard: https://supabase.com/dashboard/project/aogeenqytwrpjvrfwvjw');
  console.log('2. Go to SQL Editor and run the migration file');
  console.log('3. Enable RLS policies manually');
  console.log('4. Create storage buckets and policies');
  console.log('5. Test the application with proper authentication');
}

// Run the organization
console.log('🚀 ASR-GoT Backend Organization\n');
console.log('Project: scientific-research (aogeenqytwrpjvrfwvjw)');
console.log('URL: https://scientific-research.online/\n');

await organizeDatabaseStructure();
const healthReport = await checkDatabaseHealth();
await suggestImprovements();

console.log('\n✨ Backend analysis complete!');
console.log('\n📊 Health Summary:', JSON.stringify(healthReport, null, 2));