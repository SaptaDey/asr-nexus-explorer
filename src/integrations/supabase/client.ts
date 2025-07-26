// EMERGENCY FIX: Simplified Supabase client with disabled realtime to prevent errors
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Emergency configuration with minimal connectivity
const SUPABASE_URL = 'https://aogeenqytwrpjvrfwvjw.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ2VlbnF5dHdycGp2cmZ3dmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE3NTUyMDksImV4cCI6MjAzNzMzMTIwOX0.T_-2c37bIY8__ztVdYmPYQgpMhSprLhJMo9m6lxPCWE';

console.log('🔧 Emergency Supabase client: Initializing with minimal connectivity');

// Create client with DISABLED realtime to prevent WebSocket connection errors
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: false, // Disable session persistence to prevent auth errors
    autoRefreshToken: false, // Disable auto refresh to prevent 401 errors
    detectSessionInUrl: false, // Disable URL session detection
  },
  realtime: {
    // CRITICAL: Disable realtime to prevent WebSocket connection flood
    disabled: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'asr-got-emergency-mode',
    },
  },
});

console.log('🔧 Emergency Supabase client created with disabled realtime');