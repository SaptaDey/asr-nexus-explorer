/**
 * EMERGENCY SECURITY MIGRATION RUNNER
 * Executes critical RLS policy fixes for Task #41
 */

import { securityMigration } from './SecurityMigration';

export async function runEmergencySecurityFix(): Promise<void> {
  console.log('🚨 RUNNING EMERGENCY SECURITY MIGRATION...');
  console.log('⚠️ This will apply critical RLS policies to prevent authorization bypass');
  
  try {
    // Apply security policies
    const result = await securityMigration.applySecurityPolicies();
    
    console.log('\n📊 MIGRATION RESULTS:');
    console.log(`✅ Applied: ${result.applied.length} policies`);
    console.log(`❌ Errors: ${result.errors.length} issues`);
    
    if (result.applied.length > 0) {
      console.log('\n✅ APPLIED POLICIES:');
      result.applied.forEach(policy => console.log(`  - ${policy}`));
    }
    
    if (result.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    // Verify the policies work
    console.log('\n🔍 VERIFYING SECURITY POLICIES...');
    const verification = await securityMigration.verifyRLSPolicies();
    
    console.log('\n🔒 SECURITY VERIFICATION:');
    console.log(`✅ Secured tables: ${verification.tablesSecured.length}`);
    console.log(`❌ Vulnerabilities: ${verification.vulnerabilities.length}`);
    
    if (verification.tablesSecured.length > 0) {
      console.log('\n✅ SECURED TABLES:');
      verification.tablesSecured.forEach(table => console.log(`  - ${table}`));
    }
    
    if (verification.vulnerabilities.length > 0) {
      console.log('\n❌ REMAINING VULNERABILITIES:');
      verification.vulnerabilities.forEach(vuln => console.log(`  - ${vuln}`));
    }
    
    if (verification.recommendations.length > 0) {
      console.log('\n📋 RECOMMENDATIONS:');
      verification.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }
    
    const success = result.success && verification.vulnerabilities.length === 0;
    
    if (success) {
      console.log('\n🎉 SECURITY MIGRATION COMPLETED SUCCESSFULLY!');
      console.log('🔒 All tables are now protected with Row Level Security');
    } else {
      console.log('\n⚠️ SECURITY MIGRATION COMPLETED WITH ISSUES');
      console.log('🔧 Manual intervention may be required');
    }
    
  } catch (error) {
    console.error('\n💥 CRITICAL ERROR in security migration:', error);
    throw error;
  }
}

// Auto-run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runEmergencySecurityFix().catch(console.error);
}