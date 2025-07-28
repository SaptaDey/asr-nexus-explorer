// Supabase Edge Function: User Management Service
// Handles user registration, login, profile management, and API key storage

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface UserRegistrationRequest {
  email: string
  password: string
  fullName: string
  subscriptionTier?: 'free' | 'pro' | 'enterprise'
}

interface UserLoginRequest {
  email: string
  password: string
}

interface ApiKeyRequest {
  provider: 'gemini' | 'perplexity' | 'openai'
  apiKey: string
  keyName?: string
}

interface UserProfileUpdate {
  fullName?: string
  preferences?: any
  avatarUrl?: string
}

// Simple encryption for API keys (use proper encryption in production)
function encryptApiKey(key: string): string {
  return btoa(key)
}

function decryptApiKey(encryptedKey: string): string {
  return atob(encryptedKey)
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const action = url.pathname.split('/').pop()

    switch (action) {
      case 'register':
        return await handleUserRegistration(req, supabase)
      case 'login':
        return await handleUserLogin(req, supabase)
      case 'profile':
        return await handleProfileManagement(req, supabase)
      case 'api-keys':
        return await handleApiKeyManagement(req, supabase)
      case 'dashboard':
        return await handleDashboardData(req, supabase)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('User Management Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleUserRegistration(req: Request, supabase: any) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { email, password, fullName, subscriptionTier = 'free' }: UserRegistrationRequest = await req.json()

  // Validate input
  if (!email || !password || !fullName) {
    return new Response(
      JSON.stringify({ error: 'Email, password, and full name are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Create user account
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    })

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        email: email,
        full_name: fullName,
        subscription_tier: subscriptionTier,
        api_usage_limit: subscriptionTier === 'free' ? 1000 : subscriptionTier === 'pro' ? 10000 : 100000
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Continue even if profile creation fails
    }

    // Create default dashboard settings
    const { error: dashboardError } = await supabase
      .from('user_dashboard_settings')
      .insert({
        user_id: authData.user.id,
        widget_layout: [
          { id: 'recent-sessions', position: { x: 0, y: 0, w: 6, h: 4 } },
          { id: 'api-usage', position: { x: 6, y: 0, w: 6, h: 4 } },
          { id: 'collections', position: { x: 0, y: 4, w: 12, h: 6 } }
        ],
        theme_preferences: { theme: 'light', primaryColor: '#3498db' },
        notification_settings: { email: true, browser: true, research_complete: true }
      })

    if (dashboardError) {
      console.error('Dashboard settings creation error:', dashboardError)
    }

    return new Response(
      JSON.stringify({
        user: {
          id: authData.user.id,
          email: authData.user.email,
          fullName: fullName,
          subscriptionTier: subscriptionTier
        },
        message: 'User registered successfully'
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Registration error:', error)
    return new Response(
      JSON.stringify({ error: 'Registration failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleUserLogin(req: Request, supabase: any) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { email, password }: UserLoginRequest = await req.json()

  if (!email || !password) {
    return new Response(
      JSON.stringify({ error: 'Email and password are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update last login time
    await supabase
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('user_id', data.user.id)

    return new Response(
      JSON.stringify({
        user: data.user,
        session: data.session,
        message: 'Login successful'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Login error:', error)
    return new Response(
      JSON.stringify({ error: 'Login failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleProfileManagement(req: Request, supabase: any) {
  // Get user from JWT token
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Authorization header required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  )

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid authorization token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (req.method === 'GET') {
    // Get user profile and statistics
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const { data: apiKeys } = await supabase
      .from('user_api_keys')
      .select('provider, key_name, is_active, created_at, last_used, usage_count')
      .eq('user_id', user.id)

    const { data: sessionStats } = await supabase
      .from('query_sessions')
      .select('status')
      .eq('user_id', user.id)

    const totalSessions = sessionStats?.length || 0
    const completedSessions = sessionStats?.filter(s => s.status === 'completed').length || 0
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0

    return new Response(
      JSON.stringify({
        profile,
        apiKeys,
        statistics: {
          totalSessions,
          completedSessions,
          completionRate: Math.round(completionRate)
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } else if (req.method === 'PUT') {
    // Update user profile
    const updates: UserProfileUpdate = await req.json()

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ profile: data, message: 'Profile updated successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleApiKeyManagement(req: Request, supabase: any) {
  // Get user from JWT token
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Authorization header required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  )

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid authorization token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (req.method === 'GET') {
    // Get user's API keys (without exposing the actual keys)
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('id, provider, key_name, is_active, created_at, last_used, usage_count')
      .eq('user_id', user.id)

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ apiKeys: data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } else if (req.method === 'POST') {
    // Add new API key
    const { provider, apiKey, keyName }: ApiKeyRequest = await req.json()

    if (!provider || !apiKey) {
      return new Response(
        JSON.stringify({ error: 'Provider and API key are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data, error } = await supabase
      .from('user_api_keys')
      .insert({
        user_id: user.id,
        provider,
        encrypted_key: encryptApiKey(apiKey),
        key_name: keyName || `${provider}-key-${Date.now()}`
      })
      .select('id, provider, key_name, is_active, created_at')
      .single()

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ apiKey: data, message: 'API key added successfully' }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } else if (req.method === 'DELETE') {
    // Delete API key
    const url = new URL(req.url)
    const keyId = url.searchParams.get('keyId')

    if (!keyId) {
      return new Response(
        JSON.stringify({ error: 'Key ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { error } = await supabase
      .from('user_api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', user.id)

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ message: 'API key deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleDashboardData(req: Request, supabase: any) {
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get user from JWT token
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Authorization header required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  )

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid authorization token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Get comprehensive dashboard data
    const [profileData, sessionsData, collectionsData, usageData, filesData] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('query_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('research_collections').select('*').eq('user_id', user.id),
      supabase.from('api_usage_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('user_file_storage').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
    ])

    return new Response(
      JSON.stringify({
        profile: profileData.data,
        recentSessions: sessionsData.data || [],
        collections: collectionsData.data || [],
        apiUsage: usageData.data || [],
        recentFiles: filesData.data || []
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Dashboard data error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch dashboard data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}