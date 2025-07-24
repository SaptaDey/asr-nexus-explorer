// SECURITY TEST SCRIPT
// Tests the authorization fixes

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://aogeenqytwrpjvrfwvjw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ2VlbnF5dHdycGp2cmZ3dmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODQwMzEsImV4cCI6MjA2NzM2MDAzMX0.AG8XsM7QCM8nYYvd0nrWjP-LhI4XUMkSnvBrUEZc50U";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testUnauthorizedAccess() {
  console.log('🚨 TESTING SECURITY VULNERABILITIES...');
  
  const vulnerabilities = [];
  const secured = [];

  try {
    // Test 1: Try to access query_sessions without authentication
    console.log('\n1. Testing unauthenticated access to query_sessions...');
    const { data: sessions, error: sessionError } = await supabase
      .from('query_sessions')
      .select('*')
      .limit(5);

    console.log('Data:', sessions?.length || 0, 'Error:', sessionError?.message || 'none');
    
    if (sessions && sessions.length > 0) {
      vulnerabilities.push('❌ CRITICAL: query_sessions allows unauthenticated access');
      console.log(`❌ Found ${sessions.length} sessions without authentication!`);
    } else if (sessionError && (sessionError.message.includes('RLS') || sessionError.message.includes('policy'))) {
      secured.push('✅ query_sessions properly secured with RLS');
      console.log('✅ Access properly blocked by RLS');
    } else if (!sessions || sessions.length === 0) {
      if (sessionError) {
        secured.push('✅ query_sessions access blocked (with error)');
        console.log('✅ Access blocked - no data returned');
      } else {
        vulnerabilities.push('⚠️ query_sessions: Empty result, RLS status unclear');
        console.log('⚠️ Empty result - could mean no data or blocked access');
      }
    } else {
      vulnerabilities.push('⚠️ query_sessions status unclear');
      console.log(`⚠️ Unclear result: ${sessionError?.message}`);
    }

    // Test 2: Try to access query_figures without authentication
    console.log('\n2. Testing unauthenticated access to query_figures...');
    const { data: figures, error: figuresError } = await supabase
      .from('query_figures')
      .select('*')
      .limit(5);

    if (figures && figures.length > 0) {
      vulnerabilities.push('❌ CRITICAL: query_figures allows unauthenticated access');
      console.log(`Found ${figures.length} figures without authentication!`);
    } else if (figuresError && (figuresError.message.includes('RLS') || figuresError.message.includes('policy'))) {
      secured.push('✅ query_figures properly secured with RLS');
      console.log('✅ Access properly blocked by RLS');
    } else {
      vulnerabilities.push('⚠️ query_figures status unclear');
      console.log(`⚠️ Unclear result: ${figuresError?.message}`);
    }

    // Test 3: Try to access research_sessions without authentication
    console.log('\n3. Testing unauthenticated access to research_sessions...');
    const { data: research, error: researchError } = await supabase
      .from('research_sessions')
      .select('*')
      .limit(5);

    if (research && research.length > 0) {
      vulnerabilities.push('❌ CRITICAL: research_sessions allows unauthenticated access');
      console.log(`Found ${research.length} research sessions without authentication!`);
    } else if (researchError && (researchError.message.includes('RLS') || researchError.message.includes('policy'))) {
      secured.push('✅ research_sessions properly secured with RLS');
      console.log('✅ Access properly blocked by RLS');
    } else {
      vulnerabilities.push('⚠️ research_sessions status unclear');
      console.log(`⚠️ Unclear result: ${researchError?.message}`);
    }

    // Test 4: Try to access profiles without authentication
    console.log('\n4. Testing unauthenticated access to profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (profiles && profiles.length > 0) {
      vulnerabilities.push('❌ CRITICAL: profiles allows unauthenticated access');
      console.log(`Found ${profiles.length} profiles without authentication!`);
    } else if (profilesError && (profilesError.message.includes('RLS') || profilesError.message.includes('policy'))) {
      secured.push('✅ profiles properly secured with RLS');
      console.log('✅ Access properly blocked by RLS');
    } else {
      vulnerabilities.push('⚠️ profiles status unclear');
      console.log(`⚠️ Unclear result: ${profilesError?.message}`);
    }

  } catch (error) {
    console.error('Test error:', error);
  }

  // Print summary
  console.log('\n📊 SECURITY TEST RESULTS:');
  console.log(`✅ Secured: ${secured.length} tables`);
  console.log(`❌ Vulnerable: ${vulnerabilities.length} issues`);
  
  if (secured.length > 0) {
    console.log('\n✅ SECURED TABLES:');
    secured.forEach(item => console.log(`  ${item}`));
  }
  
  if (vulnerabilities.length > 0) {
    console.log('\n❌ VULNERABILITIES FOUND:');
    vulnerabilities.forEach(vuln => console.log(`  ${vuln}`));
    console.log('\n🚨 CRITICAL: Apply RLS policies immediately!');
    console.log('📋 See CRITICAL_SECURITY_RLS_POLICIES.md for instructions');
  } else {
    console.log('\n🎉 NO VULNERABILITIES FOUND - DATABASE IS SECURE!');
  }
}

testUnauthorizedAccess().catch(console.error);