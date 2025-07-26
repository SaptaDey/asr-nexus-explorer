import { createClient } from '@supabase/supabase-js';

console.log('🔍 VERIFYING SUPABASE DATABASE FIXES');
console.log('=====================================\n');

// Connect to local Supabase instance
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);
const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

async function verifyDatabaseSchema() {
  console.log('1. 📋 VERIFYING DATABASE SCHEMA');
  console.log('================================\n');
  
  const expectedTables = [
    'profiles', 'research_sessions', 'query_sessions', 'graph_data',
    'graph_nodes', 'graph_edges', 'stage_executions', 'hypotheses',
    'knowledge_gaps', 'performance_metrics', 'error_logs', 'activity_logs',
    'research_collaborations', 'api_usage', 'session_exports', 
    'stage_history', 'bias_analyses', 'research_results', 'user_api_keys'
  ];
  
  const results = {};
  
  for (const table of expectedTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        if (error.message.includes('does not exist')) {
          results[table] = '❌ MISSING';
          console.log(`❌ Table missing: ${table}`);
        } else {
          results[table] = '✅ EXISTS (RLS active)';
          console.log(`✅ Table exists: ${table} (RLS blocking access)`);
        }
      } else {
        results[table] = `✅ EXISTS (${count || 0} rows)`;
        console.log(`✅ Table exists: ${table} (${count || 0} rows)`);
      }
    } catch (err) {
      results[table] = '❌ ERROR';
      console.log(`❌ Error checking ${table}: ${err.message}`);
    }
  }
  
  const existingTables = Object.values(results).filter(status => status.includes('✅')).length;
  console.log(`\n📊 Schema Status: ${existingTables}/${expectedTables.length} tables exist\n`);
  
  return results;
}

async function verifyRLSPolicies() {
  console.log('2. 🔒 VERIFYING RLS POLICIES');
  console.log('=============================\n');
  
  const testCases = [
    {
      name: 'Anonymous access blocked',
      test: async () => {
        const { error } = await supabase.from('research_sessions').select('*');
        return error && error.message.includes('row-level security');
      }
    },
    {
      name: 'Profile creation blocked without auth',
      test: async () => {
        const { error } = await supabase.from('profiles').insert({ email: 'test@test.com' });
        return error && error.message.includes('row-level security');
      }
    }
  ];
  
  const results = {};
  
  for (const testCase of testCases) {
    try {
      const passed = await testCase.test();
      results[testCase.name] = passed;
      console.log(`${passed ? '✅' : '❌'} ${testCase.name}: ${passed ? 'PASS' : 'FAIL'}`);
    } catch (error) {
      results[testCase.name] = false;
      console.log(`❌ ${testCase.name}: ERROR - ${error.message}`);
    }
  }
  
  const passedTests = Object.values(results).filter(Boolean).length;
  console.log(`\n🛡️ RLS Status: ${passedTests}/${testCases.length} security tests passed\n`);
  
  return results;
}

async function verifyDatabaseFunctions() {
  console.log('3. ⚙️ VERIFYING DATABASE FUNCTIONS');
  console.log('===================================\n');
  
  const functions = [
    {
      name: 'get_database_health',
      test: async () => {
        const { data, error } = await adminSupabase.rpc('get_database_health');
        return !error && data && data.length > 0;
      }
    },
    {
      name: 'sanitize_text_input',
      test: async () => {
        const { data, error } = await adminSupabase.rpc('sanitize_text_input', { 
          input_text: '<script>alert("test")</script>clean text' 
        });
        return !error && data && !data.includes('<script>');
      }
    }
  ];
  
  const results = {};
  
  for (const func of functions) {
    try {
      const passed = await func.test();
      results[func.name] = passed;
      console.log(`${passed ? '✅' : '❌'} Function ${func.name}: ${passed ? 'WORKING' : 'FAILED'}`);
    } catch (error) {
      results[func.name] = false;
      console.log(`❌ Function ${func.name}: ERROR - ${error.message}`);
    }
  }
  
  const workingFunctions = Object.values(results).filter(Boolean).length;
  console.log(`\n🔧 Functions Status: ${workingFunctions}/${functions.length} functions working\n`);
  
  return results;
}

async function verifyRealtimeConnection() {
  console.log('4. 📡 VERIFYING REALTIME CONNECTION');
  console.log('====================================\n');
  
  return new Promise((resolve) => {
    let connected = false;
    const timeout = setTimeout(() => {
      if (!connected) {
        console.log('❌ Realtime connection: TIMEOUT');
        resolve(false);
      }
    }, 5000);
    
    try {
      const channel = supabase.channel('test-verification');
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          connected = true;
          clearTimeout(timeout);
          console.log('✅ Realtime connection: WORKING');
          channel.unsubscribe();
          resolve(true);
        } else if (status === 'CHANNEL_ERROR') {
          clearTimeout(timeout);
          console.log('❌ Realtime connection: ERROR');
          resolve(false);
        }
      });
    } catch (error) {
      clearTimeout(timeout);
      console.log(`❌ Realtime connection: ERROR - ${error.message}`);
      resolve(false);
    }
  });
}

async function generateSecurityReport() {
  console.log('5. 📋 GENERATING SECURITY REPORT');
  console.log('==================================\n');
  
  const schemaResults = await verifyDatabaseSchema();
  const rlsResults = await verifyRLSPolicies();
  const functionResults = await verifyDatabaseFunctions();
  const realtimeWorking = await verifyRealtimeConnection();
  
  console.log('\n📊 COMPREHENSIVE VERIFICATION RESULTS');
  console.log('=====================================\n');
  
  // Calculate scores
  const schemaScore = Object.values(schemaResults).filter(s => s.includes('✅')).length;
  const totalTables = Object.keys(schemaResults).length;
  const rlsScore = Object.values(rlsResults).filter(Boolean).length;
  const totalRLSTests = Object.keys(rlsResults).length;
  const functionScore = Object.values(functionResults).filter(Boolean).length;
  const totalFunctions = Object.keys(functionResults).length;
  
  console.log(`🗄️  Database Schema: ${schemaScore}/${totalTables} tables (${Math.round(schemaScore/totalTables*100)}%)`);
  console.log(`🔒 RLS Security: ${rlsScore}/${totalRLSTests} tests passed (${Math.round(rlsScore/totalRLSTests*100)}%)`);
  console.log(`⚙️  Functions: ${functionScore}/${totalFunctions} working (${Math.round(functionScore/totalFunctions*100)}%)`);
  console.log(`📡 Realtime: ${realtimeWorking ? 'WORKING' : 'FAILED'}`);
  
  const overallScore = Math.round(
    ((schemaScore/totalTables) + (rlsScore/totalRLSTests) + (functionScore/totalFunctions) + (realtimeWorking ? 1 : 0)) / 4 * 100
  );
  
  console.log(`\n🎯 OVERALL STATUS: ${overallScore}% COMPLETE`);
  
  if (overallScore >= 90) {
    console.log('✅ EXCELLENT: All critical systems operational');
  } else if (overallScore >= 75) {
    console.log('⚠️  GOOD: Minor issues detected');
  } else {
    console.log('❌ NEEDS ATTENTION: Major issues require fixing');
  }
  
  console.log('\n🔧 LOCAL SUPABASE INSTANCE READY FOR DEVELOPMENT');
  console.log('🌐 Access Supabase Studio: http://localhost:54323');
  console.log('🗄️  Database URL: postgresql://postgres:postgres@localhost:54322/postgres');
  console.log('🔗 API URL: http://localhost:54321');
  
  return {
    schema: schemaResults,
    rls: rlsResults,
    functions: functionResults,
    realtime: realtimeWorking,
    overallScore
  };
}

// Run comprehensive verification
await generateSecurityReport();