// Supabase Edge Function: API Proxy Service
// Handles secure API key management and request forwarding to external AI services

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface ApiProxyRequest {
  provider: 'gemini' | 'perplexity' | 'openai'
  endpoint: string
  method: string
  headers?: Record<string, string>
  body?: any
  sessionId?: string
}

interface ApiKeyRecord {
  encrypted_key: string
  provider: string
  is_active: boolean
}

// Provider configurations
const PROVIDER_CONFIGS = {
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com',
    authHeader: 'Authorization',
    authPrefix: 'Bearer '
  },
  perplexity: {
    baseUrl: 'https://api.perplexity.ai',
    authHeader: 'Authorization',
    authPrefix: 'Bearer '
  },
  openai: {
    baseUrl: 'https://api.openai.com',
    authHeader: 'Authorization',
    authPrefix: 'Bearer '
  }
}

// Simple encryption/decryption (in production, use proper encryption)
function encryptApiKey(key: string): string {
  // In production, use proper encryption with a secret key
  return btoa(key)
}

function decryptApiKey(encryptedKey: string): string {
  // In production, use proper decryption with a secret key
  return atob(encryptedKey)
}

async function logApiUsage(
  supabase: any,
  userId: string,
  sessionId: string | undefined,
  provider: string,
  endpoint: string,
  tokensUsed: number,
  responseTimeMs: number,
  statusCode: number,
  errorMessage?: string
) {
  try {
    await supabase.from('api_usage_logs').insert({
      user_id: userId,
      session_id: sessionId,
      provider,
      endpoint,
      tokens_used: tokensUsed,
      response_time_ms: responseTimeMs,
      status_code: statusCode,
      error_message: errorMessage
    })

    // Update user API usage count
    await supabase.rpc('increment_api_usage', {
      p_user_id: userId,
      p_provider: provider,
      p_tokens: tokensUsed
    })
  } catch (error) {
    console.error('Failed to log API usage:', error)
  }
}

async function getUserApiKey(supabase: any, userId: string, provider: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('encrypted_key')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return null
    }

    return decryptApiKey(data.encrypted_key)
  } catch (error) {
    console.error('Failed to retrieve API key:', error)
    return null
  }
}

async function checkApiLimits(supabase: any, userId: string): Promise<{ allowed: boolean, usage: number, limit: number }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('current_api_usage, api_usage_limit')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return { allowed: false, usage: 0, limit: 0 }
    }

    return {
      allowed: data.current_api_usage < data.api_usage_limit,
      usage: data.current_api_usage,
      limit: data.api_usage_limit
    }
  } catch (error) {
    console.error('Failed to check API limits:', error)
    return { allowed: false, usage: 0, limit: 0 }
  }
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

    // Parse request body
    const apiRequest: ApiProxyRequest = await req.json()
    const { provider, endpoint, method, headers = {}, body, sessionId } = apiRequest

    // Validate provider
    if (!PROVIDER_CONFIGS[provider]) {
      return new Response(
        JSON.stringify({ error: 'Unsupported provider' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check API usage limits
    const limitsCheck = await checkApiLimits(supabase, user.id)
    if (!limitsCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: 'API usage limit exceeded',
          usage: limitsCheck.usage,
          limit: limitsCheck.limit
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's API key for the provider
    const apiKey = await getUserApiKey(supabase, user.id, provider)
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: `No active API key found for ${provider}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare request to external API
    const config = PROVIDER_CONFIGS[provider]
    const fullUrl = `${config.baseUrl}${endpoint}`
    
    const requestHeaders = {
      ...headers,
      [config.authHeader]: `${config.authPrefix}${apiKey}`,
      'Content-Type': 'application/json'
    }

    // Make request to external API
    const startTime = Date.now()
    let response: Response
    let tokensUsed = 0
    let errorMessage: string | undefined

    try {
      response = await fetch(fullUrl, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined
      })

      const responseData = await response.json()
      const responseTime = Date.now() - startTime

      // Extract token usage from response (provider-specific)
      if (provider === 'gemini' && responseData.usageMetadata) {
        tokensUsed = responseData.usageMetadata.totalTokenCount || 0
      } else if (provider === 'perplexity' && responseData.usage) {
        tokensUsed = responseData.usage.total_tokens || 0
      } else if (provider === 'openai' && responseData.usage) {
        tokensUsed = responseData.usage.total_tokens || 0
      }

      // Log API usage
      await logApiUsage(
        supabase,
        user.id,
        sessionId,
        provider,
        endpoint,
        tokensUsed,
        responseTime,
        response.status
      )

      return new Response(
        JSON.stringify({
          ...responseData,
          _metadata: {
            tokensUsed,
            responseTime,
            provider,
            remainingLimit: limitsCheck.limit - limitsCheck.usage - tokensUsed
          }
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } catch (error) {
      const responseTime = Date.now() - startTime
      errorMessage = error.message

      // Log failed API usage
      await logApiUsage(
        supabase,
        user.id,
        sessionId,
        provider,
        endpoint,
        0,
        responseTime,
        500,
        errorMessage
      )

      return new Response(
        JSON.stringify({
          error: 'External API request failed',
          details: errorMessage
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('API Proxy Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})