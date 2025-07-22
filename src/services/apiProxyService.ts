// API Proxy Service
// Frontend service for making API calls through the secure backend proxy

import { supabase } from '@/integrations/supabase/client'

export interface ApiProxyRequest {
  provider: 'gemini' | 'perplexity' | 'openai'
  endpoint: string
  method: string
  headers?: Record<string, string>
  body?: any
  sessionId?: string
}

export interface ApiProxyResponse {
  data: any
  _metadata: {
    tokensUsed: number
    responseTime: number
    provider: string
    remainingLimit: number
  }
}

class ApiProxyService {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  }

  async makeApiCall(request: ApiProxyRequest): Promise<ApiProxyResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Authentication required for API proxy')
      }

      const response = await fetch(`${this.baseUrl}/api-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const error = await response.json()
        
        if (response.status === 429) {
          throw new Error(`API usage limit exceeded. Used: ${error.usage}/${error.limit}`)
        }
        
        throw new Error(error.error || 'API request failed')
      }

      return await response.json()
    } catch (error) {
      console.error('API Proxy error:', error)
      throw error
    }
  }

  // Gemini API calls
  async callGemini(endpoint: string, data: any, sessionId?: string): Promise<any> {
    const response = await this.makeApiCall({
      provider: 'gemini',
      endpoint,
      method: 'POST',
      body: data,
      sessionId
    })
    return response.data || response
  }

  // Perplexity API calls
  async callPerplexity(endpoint: string, data: any, sessionId?: string): Promise<any> {
    const response = await this.makeApiCall({
      provider: 'perplexity',
      endpoint,
      method: 'POST',
      body: data,
      sessionId
    })
    return response.data || response
  }

  // OpenAI API calls (if needed)
  async callOpenAI(endpoint: string, data: any, sessionId?: string): Promise<any> {
    const response = await this.makeApiCall({
      provider: 'openai',
      endpoint,
      method: 'POST',
      body: data,
      sessionId
    })
    return response.data || response
  }

  // Check if user has API keys configured
  async hasApiKeys(): Promise<{ [key: string]: boolean }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return { gemini: false, perplexity: false, openai: false }
      }

      const { data } = await supabase
        .from('user_api_keys')
        .select('provider, is_active')
        .eq('user_id', session.user.id)
        .eq('is_active', true)

      const apiKeys = { gemini: false, perplexity: false, openai: false }
      if (data) {
        data.forEach(key => {
          apiKeys[key.provider as keyof typeof apiKeys] = true
        })
      }

      return apiKeys
    } catch (error) {
      console.error('Check API keys error:', error)
      return { gemini: false, perplexity: false, openai: false }
    }
  }

  // Get user's API usage statistics
  async getUsageStats(): Promise<{
    currentUsage: number
    limit: number
    usagePercentage: number
    recentActivity: any[]
  }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Authentication required')
      }

      // Get current usage from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_api_usage, api_usage_limit')
        .eq('user_id', session.user.id)
        .single()

      // Get recent API activity
      const { data: recentActivity } = await supabase
        .from('api_usage_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      const currentUsage = profile?.current_api_usage || 0
      const limit = profile?.api_usage_limit || 1000
      const usagePercentage = limit > 0 ? (currentUsage / limit) * 100 : 0

      return {
        currentUsage,
        limit,
        usagePercentage: Math.round(usagePercentage),
        recentActivity: recentActivity || []
      }
    } catch (error) {
      console.error('Get usage stats error:', error)
      throw error
    }
  }
}

export const apiProxyService = new ApiProxyService()