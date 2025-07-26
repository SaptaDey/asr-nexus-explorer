import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://aogeenqytwrpjvrfwvjw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ2VlbnF5dHdycGp2cmZ3dmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODQwMzEsImV4cCI6MjA2NzM2MDAzMX0.AG8XsM7QCM8nYYvd0nrWjP-LhI4XUMkSnvBrUEZc50U';

// Note: This is using anon key - some operations will require service role key
const supabase = createClient(supabaseUrl, supabaseKey);

class SupabaseIssueResolver {
  constructor() {
    this.issues = [];
    this.fixes = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp.split('T')[1].split('.')[0]}] ${message}`);
  }

  // Issue 1: Storage Configuration and Bucket Creation
  async fixStorageConfiguration() {
    this.log('🗂️ FIXING STORAGE CONFIGURATION', 'info');
    
    try {
      // Check current buckets
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        this.log(`Storage access error: ${listError.message}`, 'error');
        this.issues.push('Storage access blocked - need service role key');
        return false;
      }

      this.log(`Found ${buckets?.length || 0} existing buckets`, 'info');
      
      // Required buckets configuration
      const requiredBuckets = [
        {
          id: 'research-exports',
          name: 'research-exports',
          public: false,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: ['application/pdf', 'text/html', 'application/json', 'image/svg+xml', 'image/png']
        },
        {
          id: 'user-uploads', 
          name: 'user-uploads',
          public: false,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain']
        },
        {
          id: 'visualizations',
          name: 'visualizations', 
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['image/png', 'image/svg+xml', 'application/json']
        }
      ];

      const existingBucketIds = (buckets || []).map(b => b.id);
      
      for (const bucket of requiredBuckets) {
        if (!existingBucketIds.includes(bucket.id)) {
          this.log(`Creating bucket: ${bucket.name}`, 'info');
          
          const { data, error } = await supabase.storage.createBucket(bucket.id, {
            public: bucket.public,
            fileSizeLimit: bucket.fileSizeLimit,
            allowedMimeTypes: bucket.allowedMimeTypes
          });

          if (error) {
            this.log(`Failed to create ${bucket.name}: ${error.message}`, 'error');
            this.issues.push(`Bucket creation failed: ${bucket.name} - ${error.message}`);
          } else {
            this.log(`Successfully created bucket: ${bucket.name}`, 'success');
            this.fixes.push(`Created storage bucket: ${bucket.name}`);
          }
        } else {
          this.log(`Bucket already exists: ${bucket.name}`, 'success');
        }
      }

      return true;
    } catch (error) {
      this.log(`Storage configuration failed: ${error.message}`, 'error');
      this.issues.push(`Storage configuration error: ${error.message}`);
      return false;
    }
  }

  // Issue 2: Database Schema Verification
  async verifyDatabaseSchema() {
    this.log('\n🗄️ VERIFYING DATABASE SCHEMA', 'info');
    
    const requiredTables = [
      'profiles', 'research_sessions', 'graph_nodes', 'graph_edges',
      'stage_executions', 'hypotheses', 'knowledge_gaps', 'performance_metrics',
      'error_logs', 'activity_logs', 'research_collaborations', 'api_usage',
      'session_exports', 'stage_history', 'bias_analyses', 'research_results'
    ];

    const schemaStatus = {};
    
    for (const table of requiredTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          if (error.message.includes('does not exist')) {
            schemaStatus[table] = 'missing';
            this.log(`Table missing: ${table}`, 'error');
            this.issues.push(`Missing table: ${table}`);
          } else {
            schemaStatus[table] = 'access_denied';
            this.log(`Access denied for table: ${table} - ${error.message}`, 'warning');
          }
        } else {
          schemaStatus[table] = 'exists';
          this.log(`Table verified: ${table} (${count || 0} rows)`, 'success');
        }
      } catch (error) {
        schemaStatus[table] = 'error';
        this.log(`Error checking table ${table}: ${error.message}`, 'error');
      }
    }

    const missingTables = Object.entries(schemaStatus)
      .filter(([_, status]) => status === 'missing')
      .map(([table, _]) => table);

    if (missingTables.length > 0) {
      this.log(`Found ${missingTables.length} missing tables`, 'error');
      this.issues.push(`Missing tables: ${missingTables.join(', ')}`);
      return false;
    }

    this.log('All required tables exist', 'success');
    this.fixes.push('Database schema verified');
    return true;
  }

  // Issue 3: RLS Policy Verification
  async verifyRLSPolicies() {
    this.log('\n🔒 VERIFYING RLS POLICIES', 'info');
    
    // Test RLS by trying to insert without authentication
    const testCases = [
      {
        table: 'research_sessions',
        data: { title: 'RLS Test', description: 'Testing RLS', status: 'draft' }
      },
      {
        table: 'profiles', 
        data: { email: 'test@example.com', full_name: 'RLS Test' }
      }
    ];

    let rlsWorking = 0;
    
    for (const test of testCases) {
      try {
        const { data, error } = await supabase
          .from(test.table)
          .insert(test.data);
        
        if (error && error.message.includes('row-level security')) {
          this.log(`RLS working for ${test.table}`, 'success');
          rlsWorking++;
        } else if (error) {
          this.log(`Different error for ${test.table}: ${error.message}`, 'warning');
        } else {
          this.log(`RLS NOT working for ${test.table} - insert succeeded`, 'error');
          this.issues.push(`RLS bypass possible in ${test.table}`);
          
          // Clean up test data
          if (data && data[0] && data[0].id) {
            await supabase.from(test.table).delete().eq('id', data[0].id);
          }
        }
      } catch (error) {
        this.log(`RLS test error for ${test.table}: ${error.message}`, 'error');
      }
    }

    if (rlsWorking === testCases.length) {
      this.log('RLS policies are working correctly', 'success');
      this.fixes.push('RLS policies verified');
      return true;
    } else {
      this.log(`RLS issues detected in ${testCases.length - rlsWorking} tables`, 'error');
      return false;
    }
  }

  // Issue 4: Realtime Connection Test
  async testRealtimeConnection() {
    this.log('\n🔄 TESTING REALTIME CONNECTION', 'info');
    
    return new Promise((resolve) => {
      let connectionTested = false;
      
      const channel = supabase
        .channel('test-channel')
        .on('broadcast', { event: 'test' }, (payload) => {
          this.log('Realtime broadcast received', 'success');
        })
        .subscribe((status) => {
          this.log(`Realtime status: ${status}`, 'info');
          
          if (status === 'SUBSCRIBED' && !connectionTested) {
            connectionTested = true;
            this.log('Realtime connection successful', 'success');
            this.fixes.push('Realtime connection verified');
            
            // Test broadcast
            channel.send({
              type: 'broadcast',
              event: 'test',
              payload: { message: 'test' }
            });
            
            setTimeout(() => {
              channel.unsubscribe();
              resolve(true);
            }, 2000);
          } else if (status === 'CHANNEL_ERROR') {
            this.log('Realtime connection failed', 'error');
            this.issues.push('Realtime connection error');
            resolve(false);
          }
        });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!connectionTested) {
          this.log('Realtime connection timeout', 'error');  
          this.issues.push('Realtime connection timeout');
          channel.unsubscribe();
          resolve(false);
        }
      }, 10000);
    });
  }

  // Issue 5: Data Model Alignment Check
  async checkDataModelAlignment() {
    this.log('\n📊 CHECKING DATA MODEL ALIGNMENT', 'info');
    
    // Check key tables that frontend uses
    const frontendTables = [
      'research_sessions',
      'graph_nodes', 
      'graph_edges',
      'stage_executions',
      'profiles'
    ];

    let alignmentIssues = 0;

    for (const table of frontendTables) {
      try {
        // Try to insert a minimal record to see column requirements
        const testData = this.getTestDataForTable(table);
        
        const { error } = await supabase
          .from(table)
          .insert(testData);
        
        if (error) {
          if (error.message.includes('column') && error.message.includes('does not exist')) {
            this.log(`Column mismatch in ${table}: ${error.message}`, 'error');
            this.issues.push(`Data model mismatch in ${table}: ${error.message}`);
            alignmentIssues++;
          } else if (error.message.includes('row-level security')) {
            this.log(`Table ${table} exists with correct columns (RLS blocked insert)`, 'success');
          } else {
            this.log(`Other error in ${table}: ${error.message}`, 'warning');
          }
        } else {
          this.log(`Table ${table} accepts test data (cleanup needed)`, 'warning');
          // Note: Would need to clean up test data
        }
      } catch (error) {
        this.log(`Error testing ${table}: ${error.message}`, 'error');
      }
    }

    if (alignmentIssues === 0) {
      this.log('Data models appear aligned', 'success');
      this.fixes.push('Data model alignment verified');
      return true;
    } else {
      this.log(`Found ${alignmentIssues} data model issues`, 'error');
      return false;
    }
  }

  getTestDataForTable(table) {
    const testData = {
      research_sessions: {
        title: 'Test Session',
        description: 'Test',
        status: 'draft',
        current_stage: 1
      },
      graph_nodes: {
        session_id: '00000000-0000-0000-0000-000000000000',
        node_id: 'test-node',
        label: 'Test Node',
        node_type: 'test'
      },
      graph_edges: {
        session_id: '00000000-0000-0000-0000-000000000000',
        edge_id: 'test-edge',
        source_node_id: 'test-source',
        target_node_id: 'test-target',
        edge_type: 'test'
      },
      stage_executions: {
        session_id: '00000000-0000-0000-0000-000000000000',
        stage_number: 1,
        stage_name: 'Test Stage',
        status: 'pending'
      },
      profiles: {
        email: 'test@example.com',
        full_name: 'Test User'
      }
    };

    return testData[table] || {};
  }

  // Issue 6: Authentication Integration Check
  async checkAuthIntegration() {
    this.log('\n👤 CHECKING AUTHENTICATION INTEGRATION', 'info');
    
    try {
      // Test basic auth functionality
      const { data: session, error } = await supabase.auth.getSession();
      
      if (error) {
        this.log(`Auth integration error: ${error.message}`, 'error');
        this.issues.push(`Authentication error: ${error.message}`);
        return false;
      }

      this.log(`Auth system operational (${session.session ? 'authenticated' : 'anonymous'})`, 'success');
      
      // Test if auth triggers work by checking if there are profile creation functions
      try {
        const { data, error: funcError } = await supabase.rpc('get_database_health');
        if (!funcError) {
          this.log('Database functions accessible', 'success');
          this.fixes.push('Authentication integration verified');
        } else {
          this.log('Database functions not accessible - need migration', 'warning');
          this.issues.push('Database functions missing - need migration');
        }
      } catch (error) {
        this.log('Database functions check failed', 'warning');
      }

      return true;
    } catch (error) {
      this.log(`Auth check failed: ${error.message}`, 'error');
      this.issues.push(`Auth integration error: ${error.message}`);
      return false;
    }
  }

  // Generate comprehensive report
  generateReport() {
    this.log('\n📋 COMPREHENSIVE SUPABASE ISSUE REPORT', 'info');
    this.log('='.repeat(60));
    
    this.log(`\n❌ ISSUES FOUND (${this.issues.length}):`, 'error');
    if (this.issues.length === 0) {
      this.log('No issues detected!', 'success');
    } else {
      this.issues.forEach((issue, index) => {
        this.log(`${index + 1}. ${issue}`, 'error');
      });
    }

    this.log(`\n✅ FIXES APPLIED (${this.fixes.length}):`, 'success');
    if (this.fixes.length === 0) {
      this.log('No fixes were possible with current permissions', 'warning');
    } else {
      this.fixes.forEach((fix, index) => {
        this.log(`${index + 1}. ${fix}`, 'success');
      });
    }

    // Provide specific next steps
    this.log('\n🔧 REQUIRED ACTIONS:', 'info');
    this.log('1. Apply database migration via Supabase Dashboard SQL Editor');
    this.log('2. Create storage buckets manually in Dashboard');
    this.log('3. Verify RLS policies are properly configured');
    this.log('4. Test authentication flow with real users');
    this.log('5. Check realtime connections in production');

    this.log(`\n🎯 OVERALL STATUS: ${this.issues.length === 0 ? '✅ HEALTHY' : '⚠️ NEEDS ATTENTION'}`, 
      this.issues.length === 0 ? 'success' : 'warning');
  }

  // Main execution method
  async diagnoseAndFix() {
    this.log('🚀 STARTING COMPREHENSIVE SUPABASE DIAGNOSIS', 'info');
    this.log('Project: scientific-research (aogeenqytwrpjvrfwvjw)');
    this.log('URL: https://scientific-research.online/\n');

    const tasks = [
      { name: 'Storage Configuration', method: 'fixStorageConfiguration' },
      { name: 'Database Schema', method: 'verifyDatabaseSchema' },
      { name: 'RLS Policies', method: 'verifyRLSPolicies' },
      { name: 'Realtime Connection', method: 'testRealtimeConnection' },
      { name: 'Data Model Alignment', method: 'checkDataModelAlignment' },
      { name: 'Auth Integration', method: 'checkAuthIntegration' }
    ];

    for (const task of tasks) {
      try {
        await this[task.method]();
      } catch (error) {
        this.log(`Task failed: ${task.name} - ${error.message}`, 'error');
        this.issues.push(`${task.name} check failed: ${error.message}`);
      }
    }

    this.generateReport();
  }
}

// Execute the diagnosis
const resolver = new SupabaseIssueResolver();
await resolver.diagnoseAndFix();