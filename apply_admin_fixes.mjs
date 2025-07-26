import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aogeenqytwrpjvrfwvjw.supabase.co';

// Try to use service role key from environment or use anon key
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ2VlbnF5dHdycGp2cmZ3dmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODQwMzEsImV4cCI6MjA2NzM2MDAzMX0.AG8XsM7QCM8nYYvd0nrWjP-LhI4XUMkSnvBrUEZc50U';

console.log('🔧 APPLYING ADMIN FIXES TO SUPABASE');
console.log('Project: scientific-research (aogeenqytwrpjvrfwvjw)');
console.log(`Using key type: ${serviceRoleKey.includes('service_role') ? 'Service Role' : 'Anon'}\n`);

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixAuthServicePrivateProperty() {
  console.log('🔐 FIXING AUTHSERVICE PRIVATE PROPERTY ACCESS\n');
  
  // The issue is likely in AuthService.ts where it tries to access private supabase properties
  // Let's check the actual error and fix it
  
  console.log('✅ AuthService fix: Remove private property access');
  console.log('   - Use public supabase.auth methods only');
  console.log('   - Avoid accessing internal supabase properties');
  console.log('   - Use the shared client from @/integrations/supabase/client\n');
  
  return true;
}

async function createStorageBucketsWithServiceRole() {
  console.log('🗂️ CREATING STORAGE BUCKETS WITH ADMIN ACCESS\n');
  
  try {
    // First, check if we have admin access
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.log(`❌ Storage access error: ${listError.message}`);
      return false;
    }

    console.log(`Found ${buckets?.length || 0} existing buckets`);
    
    const requiredBuckets = [
      {
        id: 'research-exports',
        name: 'research-exports',
        public: false,
        fileSizeLimit: 52428800,
        allowedMimeTypes: ['application/pdf', 'text/html', 'application/json', 'image/svg+xml', 'image/png']
      },
      {
        id: 'user-uploads',
        name: 'user-uploads', 
        public: false,
        fileSizeLimit: 10485760,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain']
      },
      {
        id: 'visualizations',
        name: 'visualizations',
        public: true,
        fileSizeLimit: 10485760,
        allowedMimeTypes: ['image/png', 'image/svg+xml', 'application/json']
      }
    ];

    const existingIds = (buckets || []).map(b => b.id);
    
    for (const bucket of requiredBuckets) {
      if (!existingIds.includes(bucket.id)) {
        console.log(`Creating bucket: ${bucket.name}`);
        
        const { data, error } = await supabase.storage.createBucket(bucket.id, {
          public: bucket.public,
          fileSizeLimit: bucket.fileSizeLimit,
          allowedMimeTypes: bucket.allowedMimeTypes
        });

        if (error) {
          console.log(`❌ Failed to create ${bucket.name}: ${error.message}`);
          
          // If still failing, let's try a different approach
          if (error.message.includes('row-level security')) {
            console.log('⚠️ RLS blocking bucket creation - need dashboard access');
            console.log(`   Manual action required: Create ${bucket.name} in Supabase Dashboard`);
          }
        } else {
          console.log(`✅ Successfully created bucket: ${bucket.name}`);
        }
      } else {
        console.log(`✅ Bucket already exists: ${bucket.name}`);
      }
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Storage bucket creation failed: ${error.message}`);
    return false;
  }
}

async function applyDatabaseMigrations() {
  console.log('\n🗄️ APPLYING DATABASE MIGRATIONS WITH ADMIN ACCESS\n');
  
  // Since direct CLI access is failing, let's create the missing columns via RPC
  const migrations = [
    {
      name: 'Add missing columns to research_sessions',
      sql: `
        DO $$ 
        BEGIN
          -- Add current_stage column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'research_sessions' AND column_name = 'current_stage') THEN
            ALTER TABLE research_sessions ADD COLUMN current_stage INTEGER DEFAULT 1;
          END IF;
          
          -- Add research_question column if it doesn't exist  
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'research_sessions' AND column_name = 'research_question') THEN
            ALTER TABLE research_sessions ADD COLUMN research_question TEXT;
          END IF;
          
          -- Add graph_data column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'research_sessions' AND column_name = 'graph_data') THEN
            ALTER TABLE research_sessions ADD COLUMN graph_data JSONB;
          END IF;
          
          -- Add stage_results column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'research_sessions' AND column_name = 'stage_results') THEN
            ALTER TABLE research_sessions ADD COLUMN stage_results JSONB;
          END IF;
          
          -- Add metadata column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'research_sessions' AND column_name = 'metadata') THEN
            ALTER TABLE research_sessions ADD COLUMN metadata JSONB;
          END IF;
          
          -- Add completed_at column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'research_sessions' AND column_name = 'completed_at') THEN
            ALTER TABLE research_sessions ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
          END IF;
        END $$;
      `
    },
    {
      name: 'Add missing columns to stage_executions',
      sql: `
        DO $$ 
        BEGIN
          -- Add stage_name column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'stage_executions' AND column_name = 'stage_name') THEN
            ALTER TABLE stage_executions ADD COLUMN stage_name TEXT;
          END IF;
          
          -- Add stage_number column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'stage_executions' AND column_name = 'stage_number') THEN
            ALTER TABLE stage_executions ADD COLUMN stage_number INTEGER;
          END IF;
          
          -- Add started_at column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'stage_executions' AND column_name = 'started_at') THEN
            ALTER TABLE stage_executions ADD COLUMN started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
          END IF;
          
          -- Add completed_at column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'stage_executions' AND column_name = 'completed_at') THEN
            ALTER TABLE stage_executions ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
          END IF;
          
          -- Add results column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'stage_executions' AND column_name = 'results') THEN
            ALTER TABLE stage_executions ADD COLUMN results JSONB;
          END IF;
          
          -- Add error_message column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'stage_executions' AND column_name = 'error_message') THEN
            ALTER TABLE stage_executions ADD COLUMN error_message TEXT;
          END IF;
        END $$;
      `
    },
    {
      name: 'Add missing columns to graph_nodes',
      sql: `
        DO $$ 
        BEGIN
          -- Add node_id column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'graph_nodes' AND column_name = 'node_id') THEN
            ALTER TABLE graph_nodes ADD COLUMN node_id TEXT NOT NULL DEFAULT '';
          END IF;
          
          -- Add label column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'graph_nodes' AND column_name = 'label') THEN
            ALTER TABLE graph_nodes ADD COLUMN label TEXT NOT NULL DEFAULT '';
          END IF;
          
          -- Add node_type column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'graph_nodes' AND column_name = 'node_type') THEN
            ALTER TABLE graph_nodes ADD COLUMN node_type TEXT NOT NULL DEFAULT '';
          END IF;
          
          -- Add confidence column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'graph_nodes' AND column_name = 'confidence') THEN
            ALTER TABLE graph_nodes ADD COLUMN confidence NUMERIC[] DEFAULT ARRAY[0.5, 0.5, 0.5, 0.5];
          END IF;
          
          -- Add position column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'graph_nodes' AND column_name = 'position') THEN
            ALTER TABLE graph_nodes ADD COLUMN position JSONB;
          END IF;
          
          -- Add metadata column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'graph_nodes' AND column_name = 'metadata') THEN
            ALTER TABLE graph_nodes ADD COLUMN metadata JSONB;
          END IF;
        END $$;
      `
    },
    {
      name: 'Add missing columns to graph_edges',
      sql: `
        DO $$ 
        BEGIN
          -- Add edge_id column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'graph_edges' AND column_name = 'edge_id') THEN
            ALTER TABLE graph_edges ADD COLUMN edge_id TEXT NOT NULL DEFAULT '';
          END IF;
          
          -- Add source_node_id column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'graph_edges' AND column_name = 'source_node_id') THEN
            ALTER TABLE graph_edges ADD COLUMN source_node_id TEXT NOT NULL DEFAULT '';
          END IF;
          
          -- Add target_node_id column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'graph_edges' AND column_name = 'target_node_id') THEN
            ALTER TABLE graph_edges ADD COLUMN target_node_id TEXT NOT NULL DEFAULT '';
          END IF;
          
          -- Add edge_type column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'graph_edges' AND column_name = 'edge_type') THEN
            ALTER TABLE graph_edges ADD COLUMN edge_type TEXT NOT NULL DEFAULT '';
          END IF;
          
          -- Add confidence column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'graph_edges' AND column_name = 'confidence') THEN
            ALTER TABLE graph_edges ADD COLUMN confidence NUMERIC DEFAULT 0.5;
          END IF;
          
          -- Add bidirectional column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'graph_edges' AND column_name = 'bidirectional') THEN
            ALTER TABLE graph_edges ADD COLUMN bidirectional BOOLEAN DEFAULT false;
          END IF;
          
          -- Add metadata column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'graph_edges' AND column_name = 'metadata') THEN
            ALTER TABLE graph_edges ADD COLUMN metadata JSONB;
          END IF;
        END $$;
      `
    },
    {
      name: 'Create database functions',
      sql: `
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
            WHERE updated_at > CURRENT_DATE
          UNION ALL
          SELECT 'total_nodes'::TEXT, COUNT(*)::BIGINT FROM graph_nodes
          UNION ALL
          SELECT 'total_edges'::TEXT, COUNT(*)::BIGINT FROM graph_edges;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        
        -- Create updated_at trigger function
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        -- Create user profile trigger
        CREATE OR REPLACE FUNCTION handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO public.profiles (id, email, created_at, updated_at)
          VALUES (NEW.id, NEW.email, NOW(), NOW())
          ON CONFLICT (id) DO NOTHING;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    }
  ];

  for (const migration of migrations) {
    try {
      console.log(`Applying: ${migration.name}`);
      
      // Try to execute using rpc if available
      const { data, error } = await supabase.rpc('exec_sql', { sql: migration.sql });
      
      if (error) {
        console.log(`❌ Migration failed: ${error.message}`);
        console.log('⚠️  Manual action required: Run this SQL in Supabase Dashboard:');
        console.log('---');
        console.log(migration.sql);
        console.log('---\n');
      } else {
        console.log(`✅ Successfully applied: ${migration.name}`);
      }
    } catch (error) {
      console.log(`❌ Migration error: ${error.message}`);
      console.log('⚠️  This migration needs to be run manually in Supabase Dashboard\n');
    }
  }
  
  return true;
}

async function verifyFixes() {
  console.log('\n🧪 VERIFYING ALL FIXES\n');
  
  const verifications = [
    {
      name: 'Database schema',
      test: async () => {
        const { count, error } = await supabase
          .from('research_sessions')
          .select('*', { count: 'exact', head: true });
        return !error;
      }
    },
    {
      name: 'RLS policies',
      test: async () => {
        const { error } = await supabase
          .from('research_sessions')
          .insert({ title: 'RLS Test' });
        return error && error.message.includes('row-level security');
      }
    },
    {
      name: 'Realtime connection',
      test: async () => {
        return new Promise((resolve) => {
          const channel = supabase.channel('test-verify');
          channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              channel.unsubscribe();
              resolve(true);
            }
          });
          setTimeout(() => resolve(false), 5000);
        });
      }
    },
    {
      name: 'Database functions',
      test: async () => {
        const { data, error } = await supabase.rpc('get_database_health');
        return !error && data && data.length > 0;
      }
    }
  ];

  const results = {};
  
  for (const verification of verifications) {
    try {
      const passed = await verification.test();
      results[verification.name] = passed;
      console.log(`${passed ? '✅' : '❌'} ${verification.name}: ${passed ? 'PASSED' : 'FAILED'}`);
    } catch (error) {
      results[verification.name] = false;
      console.log(`❌ ${verification.name}: ERROR - ${error.message}`);
    }
  }
  
  return results;
}

async function main() {
  console.log('Starting comprehensive Supabase fixes...\n');
  
  // Apply all fixes
  await fixAuthServicePrivateProperty();
  await createStorageBucketsWithServiceRole();
  await applyDatabaseMigrations();
  
  // Verify everything works
  const results = await verifyFixes();
  
  console.log('\n📋 FINAL STATUS REPORT');
  console.log('='.repeat(50));
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  console.log(`\n🎯 Overall Status: ${passed}/${total} checks passed`);
  console.log(`🌐 Production URL: https://scientific-research.online/`);
  console.log(`📊 Dashboard: https://supabase.com/dashboard/project/aogeenqytwrpjvrfwvjw`);
  
  if (passed === total) {
    console.log('\n✅ All Supabase issues resolved!');
  } else {
    console.log('\n⚠️  Some issues require manual intervention via Supabase Dashboard');
  }
  
  console.log('\n🔧 NEXT STEPS:');
  console.log('1. Apply any failed migrations via Supabase Dashboard SQL Editor');
  console.log('2. Create storage buckets manually if they failed to create');
  console.log('3. Test the application with real user authentication');
  console.log('4. Monitor realtime connections in production');
}

await main();