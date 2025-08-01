// SIMPLIFIED: Stable Supabase client configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use environment variables with fallback values
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://aogeenqytwrpjvrfwvjw.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ2VlbnF5dHdycGp2cmZ3dmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE3NTUyMDksImV4cCI6MjAzNzMzMTIwOX0.T_-2c37bIY8__ztVdYmPYQgpMhSprLhJMo9m6lxPCWE';

console.log('🔧 Supabase client: Initializing with stable configuration');

// Create client with stable configuration to prevent auth/connection errors
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true, // Keep session persistence
    autoRefreshToken: true, // Keep auto refresh enabled
    detectSessionInUrl: true, // Keep URL session detection
  },
  global: {
    headers: {
      'X-Client-Info': 'asr-got-stable',
    },
  },
});

console.log('🔧 Supabase client created with stable configuration');