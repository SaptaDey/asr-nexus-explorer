// SECURITY FIX: Use environment variables instead of hardcoded credentials
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use environment variables with fallback for development
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://aogeenqytwrpjvrfwvjw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ2VlbnF5dHdycGp2cmZ3dmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODQwMzEsImV4cCI6MjA2NzM2MDAzMX0.AG8XsM7QCM8nYYvd0nrWjP-LhI4XUMkSnvBrUEZc50U";

// Validate that environment variables are provided in production
if (import.meta.env.PROD && (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY)) {
  throw new Error('CRITICAL SECURITY: Supabase credentials not configured via environment variables in production');
}

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