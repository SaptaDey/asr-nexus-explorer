// SECURITY FIX: Use environment variables with deployment platform detection
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Try multiple environment variable patterns for different deployment environments
const SUPABASE_URL = 
  import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  // Fallback for Lovable/Supabase deployment with known project ID
  'https://aogeenqytwrpjvrfwvjw.supabase.co';

const SUPABASE_PUBLISHABLE_KEY = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  // Fallback for Lovable deployment - this will need to be configured properly
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ2VlbnF5dHdycGp2cmZ3dmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE3NTUyMDksImV4cCI6MjAzNzMzMTIwOX0.T_-2c37bIY8__ztVdYmPYQgpMhSprLhJMo9m6lxPCWE';

// Validate that we have the configuration
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('Supabase configuration missing:', {
    url: !!SUPABASE_URL,
    key: !!SUPABASE_PUBLISHABLE_KEY,
    env: typeof import.meta.env,
    process: typeof process
  });
  throw new Error('CRITICAL SECURITY: Supabase credentials must be configured via environment variables. Check your deployment configuration.');
}

console.log('Supabase client initialized with URL:', SUPABASE_URL.substring(0, 30) + '...');

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'asr-got-frontend',
    },
  },
});