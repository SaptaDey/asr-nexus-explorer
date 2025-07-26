import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://aogeenqytwrpjvrfwvjw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ2VlbnF5dHdycGp2cmZ3dmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODQwMzEsImV4cCI6MjA2NzM2MDAzMX0.AG8XsM7QCM8nYYvd0nrWjP-LhI4XUMkSnvBrUEZc50U';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyBasicSecurity() {
  console.log('🔒 Applying basic RLS policies...\n');
  
  try {
    // Basic RLS policies that can be applied with anon key
    const policies = [
      {
        name: 'Enable RLS on profiles',
        sql: 'ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;'
      },
      {
        name: 'Enable RLS on research_sessions',
        sql: 'ALTER TABLE research_sessions ENABLE ROW LEVEL SECURITY;'
      },
      {
        name: 'Users can view their own profile',
        sql: `
          CREATE POLICY "Users can view their own profile" 
          ON profiles FOR SELECT 
          USING (auth.uid() = id);
        `
      },
      {
        name: 'Users can update their own profile',
        sql: `
          CREATE POLICY "Users can update their own profile" 
          ON profiles FOR UPDATE 
          USING (auth.uid() = id);
        `
      },
      {
        name: 'Users can view their own sessions',
        sql: `
          CREATE POLICY "Users can view their own sessions" 
          ON research_sessions FOR SELECT 
          USING (auth.uid() = user_id);
        `
      }
    ];
    
    for (const policy of policies) {
      try {
        console.log(`Applying: ${policy.name}`);
        // Note: This might not work with anon key for DDL operations
        const result = await supabase.rpc('exec_sql', { sql: policy.sql });
        if (result.error) {
          console.log(`❌ Failed: ${result.error.message}`);
        } else {
          console.log(`✅ Success: ${policy.name}`);
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

async function checkCurrentPolicies() {
  console.log('📋 Checking current RLS policies...\n');
  
  try {
    // Try to check if RLS is enabled
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('RLS might be enabled - getting permission error:', error.message);
    } else {
      console.log('Profiles table accessible, RLS might not be fully configured');
    }
    
    // Try to access research_sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('research_sessions')
      .select('*')
      .limit(1);
    
    if (sessionsError) {
      console.log('Research sessions - getting permission error:', sessionsError.message);
    } else {
      console.log('Research sessions table accessible');
    }
    
  } catch (error) {
    console.error('Check failed:', error);
  }
}

async function createStorageBuckets() {
  console.log('🗂️ Setting up storage buckets...\n');
  
  const buckets = [
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
  
  for (const bucket of buckets) {
    try {
      console.log(`Creating bucket: ${bucket.name}`);
      const { data, error } = await supabase.storage.createBucket(bucket.id, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes
      });
      
      if (error && !error.message.includes('already exists')) {
        console.log(`❌ Failed to create ${bucket.name}: ${error.message}`);
      } else {
        console.log(`✅ Bucket ${bucket.name} ready`);
      }
    } catch (error) {
      console.log(`❌ Error creating ${bucket.name}: ${error.message}`);
    }
  }
}

// Run the setup
console.log('🚀 Starting backend organization...\n');

await checkCurrentPolicies();
await createStorageBuckets();
await applyBasicSecurity();

console.log('\n✨ Backend organization complete!');