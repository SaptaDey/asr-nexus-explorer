// SIMPLIFIED: Stable Supabase client configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use environment variables with fallback values
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://aogeenqytwrpjvrfwvjw.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ2VlbnF5dHdycGp2cmZ3dmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE3NTUyMDksImV4cCI6MjAzNzMzMTIwOX0.T_-2c37bIY8__ztVdYmPYQgpMhSprLhJMo9m6lxPCWE';

console.log('🔧 Supabase client: Initializing with stable configuration');

// Create client with stable configuration and enhanced error handling
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true, // Keep session persistence
    autoRefreshToken: true, // Keep auto refresh enabled
    detectSessionInUrl: true, // Keep URL session detection
  },
  realtime: {
    // Make realtime connections more resilient
    params: {
      eventsPerSecond: 2, // Reduce event frequency to prevent overload
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'asr-got-stable',
    },
  },
});

console.log('🔧 Supabase client created with stable configuration');

// Test connection on initialization with enhanced error handling and non-blocking approach
const connectionTestStart = performance.now();
supabase.auth.getSession().then(({ data, error }) => {
  const connectionTime = performance.now() - connectionTestStart;
  
  if (error) {
    console.warn('⚠️ Supabase connection test failed (non-blocking):', {
      error: error.message, // Only log message, not full error object
      duration: `${connectionTime.toFixed(2)}ms`
    });
    // Don't throw error - let app continue loading
  } else {
    console.log('✅ Supabase connection test successful:', {
      hasSession: !!data?.session,
      duration: `${connectionTime.toFixed(2)}ms`,
      timestamp: new Date().toISOString()
    });
  }
}).catch(err => {
  const connectionTime = performance.now() - connectionTestStart;
  console.warn('⚠️ Supabase connection test error (non-blocking):', {
    error: err.message || 'Connection failed', // Only log message
    duration: `${connectionTime.toFixed(2)}ms`
  });
  // Don't throw error - let app continue loading
});