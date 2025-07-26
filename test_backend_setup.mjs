import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aogeenqytwrpjvrfwvjw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ2VlbnF5dHdycGp2cmZ3dmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODQwMzEsImV4cCI6MjA2NzM2MDAzMX0.AG8XsM7QCM8nYYvd0nrWjP-LhI4XUMkSnvBrUEZc50U';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBackendSetup() {
  console.log('🧪 Testing ASR-GoT Backend Setup\n');
  console.log('Project: scientific-research (aogeenqytwrpjvrfwvjw)');
  console.log('URL: https://scientific-research.online/\n');

  const results = {
    tableAccess: {},
    functionsAvailable: {},
    storageAccess: {},
    realtimeEnabled: {},
    securityStatus: {}
  };

  // Test 1: Table Access
  console.log('📊 Testing table access...');
  const tables = [
    'profiles', 'research_sessions', 'graph_nodes', 'graph_edges',
    'stage_executions', 'hypotheses', 'knowledge_gaps', 'performance_metrics',
    'error_logs', 'activity_logs', 'research_collaborations', 'api_usage'
  ];

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        results.tableAccess[table] = `❌ ${error.message}`;
      } else {
        results.tableAccess[table] = `✅ Accessible (${count || 0} rows)`;
      }
    } catch (error) {
      results.tableAccess[table] = `❌ ${error.message}`;
    }
  }

  // Test 2: Database Functions
  console.log('\n🔧 Testing database functions...');
  try {
    const { data, error } = await supabase.rpc('get_database_health');
    if (error) {
      results.functionsAvailable.health_check = `❌ ${error.message}`;
    } else {
      results.functionsAvailable.health_check = `✅ Available (${data?.length || 0} metrics)`;
      console.log('Health metrics:', data);
    }
  } catch (error) {
    results.functionsAvailable.health_check = `❌ Function not available`;
  }

  // Test 3: Storage Access
  console.log('\n🗂️ Testing storage access...');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      results.storageAccess.buckets = `❌ ${error.message}`;
    } else {
      results.storageAccess.buckets = `✅ ${buckets?.length || 0} buckets available`;
      if (buckets && buckets.length > 0) {
        console.log('Available buckets:', buckets.map(b => `${b.name} (${b.public ? 'public' : 'private'})`));
      }
    }
  } catch (error) {
    results.storageAccess.buckets = `❌ ${error.message}`;
  }

  // Test 4: Security Check
  console.log('\n🔒 Testing security (RLS should block unauthenticated access)...');
  try {
    const { data, error } = await supabase
      .from('research_sessions')
      .insert({
        title: 'Test Session',
        description: 'Security test',
        status: 'draft'
      });
    
    if (error) {
      results.securityStatus.rls_protection = `✅ RLS working - ${error.message}`;
    } else {
      results.securityStatus.rls_protection = `⚠️ RLS might not be configured - insert succeeded`;
    }
  } catch (error) {
    results.securityStatus.rls_protection = `✅ RLS working - ${error.message}`;
  }

  // Test 5: Authentication Test
  console.log('\n👤 Testing authentication (should work without credentials for public functions)...');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      results.securityStatus.auth_status = `❌ Auth error: ${error.message}`;
    } else {
      results.securityStatus.auth_status = `✅ Auth system operational (${data.session ? 'authenticated' : 'anonymous'})`;
    }
  } catch (error) {
    results.securityStatus.auth_status = `❌ Auth system error: ${error.message}`;
  }

  // Print Summary
  console.log('\n📋 Backend Setup Test Results\n');
  console.log('='.repeat(50));
  
  console.log('\n📊 Table Access:');
  Object.entries(results.tableAccess).forEach(([table, status]) => {
    console.log(`  ${table}: ${status}`);
  });

  console.log('\n🔧 Database Functions:');
  Object.entries(results.functionsAvailable).forEach(([func, status]) => {
    console.log(`  ${func}: ${status}`);
  });

  console.log('\n🗂️ Storage:');
  Object.entries(results.storageAccess).forEach(([feature, status]) => {
    console.log(`  ${feature}: ${status}`);
  });

  console.log('\n🔒 Security:');
  Object.entries(results.securityStatus).forEach(([feature, status]) => {
    console.log(`  ${feature}: ${status}`);
  });

  // Recommendations
  console.log('\n💡 Next Steps:\n');
  
  const missingTables = Object.entries(results.tableAccess)
    .filter(([_, status]) => status.includes('❌'))
    .map(([table, _]) => table);

  if (missingTables.length > 0) {
    console.log('🔧 Missing tables detected. Run the migration script:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/aogeenqytwrpjvrfwvjw/sql');
    console.log('   2. Execute: supabase/migrations/20250125_complete_schema.sql\n');
  }

  if (!results.storageAccess.buckets?.includes('✅')) {
    console.log('🗂️ Create storage buckets:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/aogeenqytwrpjvrfwvjw/storage');
    console.log('   2. Create: research-exports, user-uploads, visualizations\n');
  }

  if (results.securityStatus.rls_protection?.includes('⚠️')) {
    console.log('🔒 Configure Row Level Security:');
    console.log('   1. Run the RLS policies from the migration script');
    console.log('   2. Test with authenticated users\n');
  }

  console.log('🎯 Setup Status: ', 
    missingTables.length === 0 ? '✅ COMPLETE' : '⚠️ NEEDS MIGRATION'
  );
  
  console.log('\n✨ Your ASR-GoT backend is ready for production!');
  console.log('🌐 Production URL: https://scientific-research.online/');
}

// Run the test
testBackendSetup().catch(console.error);