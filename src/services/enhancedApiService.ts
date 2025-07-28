// Enhanced API Service with Backend Integration
// Replaces direct API calls with secure backend proxy calls

import { apiProxyService } from './apiProxyService'
import { userService } from './userService'
import type { APICredentials } from '@/types/asrGotTypes'

interface ApiCallOptions {
  sessionId?: string
  useProxy?: boolean
  fallbackToLocal?: boolean
}

class EnhancedApiService {
  private localCredentials: APICredentials | null = null

  // Set local credentials as fallback
  setLocalCredentials(credentials: APICredentials) {
    this.localCredentials = credentials
  }

  // Check if we should use proxy or local credentials
  private async shouldUseProxy(): Promise<boolean> {
    try {
      const apiKeys = await apiProxyService.hasApiKeys()
      const user = await userService.getCurrentUser()
      
      // Use proxy if user is authenticated and has backend API keys
      return !!user && (apiKeys.gemini || apiKeys.perplexity || apiKeys.openai)
    } catch (error) {
      return false
    }
  }

  // Gemini API calls
  async callGemini(
    prompt: string, 
    options: ApiCallOptions = {}
  ): Promise<any> {
    const useProxy = options.useProxy ?? await this.shouldUseProxy()

    if (useProxy) {
      try {
        return await apiProxyService.callGemini(
          '/v1beta/models/gemini-1.5-pro-latest:generateContent',
          {
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 6000,
            }
          },
          options.sessionId
        )
      } catch (error) {
        if (options.fallbackToLocal && this.localCredentials?.geminiKey) {
          console.warn('Proxy failed, falling back to local API call')
          return await this.callGeminiDirect(prompt)
        }
        throw error
      }
    } else if (this.localCredentials?.geminiKey) {
      return await this.callGeminiDirect(prompt)
    } else {
      throw new Error('No Gemini API key available. Please configure API keys in settings.')
    }
  }

  // Perplexity API calls
  async callPerplexity(
    query: string,
    options: ApiCallOptions = {}
  ): Promise<any> {
    const useProxy = options.useProxy ?? await this.shouldUseProxy()

    if (useProxy) {
      try {
        return await apiProxyService.callPerplexity(
          '/chat/completions',
          {
            model: 'llama-3.1-sonar-large-128k-online',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful research assistant. Provide comprehensive, well-sourced information.'
              },
              {
                role: 'user',
                content: query
              }
            ],
            max_tokens: 3000,
            temperature: 0.7,
            return_citations: true,
            return_images: false
          },
          options.sessionId
        )
      } catch (error) {
        if (options.fallbackToLocal && this.localCredentials?.perplexityKey) {
          console.warn('Proxy failed, falling back to local API call')
          return await this.callPerplexityDirect(query)
        }
        throw error
      }
    } else if (this.localCredentials?.perplexityKey) {
      return await this.callPerplexityDirect(query)
    } else {
      throw new Error('No Perplexity API key available. Please configure API keys in settings.')
    }
  }

  // Direct Gemini API call (fallback)
  private async callGeminiDirect(prompt: string): Promise<any> {
    if (!this.localCredentials?.geminiKey) {
      throw new Error('No local Gemini API key available')
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${this.localCredentials.geminiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 6000,
          }
        })
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`)
    }

    return await response.json()
  }

  // Direct Perplexity API call (fallback)
  private async callPerplexityDirect(query: string): Promise<any> {
    if (!this.localCredentials?.perplexityKey) {
      throw new Error('No local Perplexity API key available')
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.localCredentials.perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful research assistant. Provide comprehensive, well-sourced information.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 3000,
        temperature: 0.7,
        return_citations: true,
        return_images: false
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Perplexity API error: ${error.error?.message || 'Unknown error'}`)
    }

    return await response.json()
  }

  // Extract response text from API responses
  extractGeminiResponse(response: any): string {
    try {
      return response.candidates?.[0]?.content?.parts?.[0]?.text || ''
    } catch (error) {
      console.error('Error extracting Gemini response:', error)
      return ''
    }
  }

  extractPerplexityResponse(response: any): string {
    try {
      return response.choices?.[0]?.message?.content || ''
    } catch (error) {
      console.error('Error extracting Perplexity response:', error)
      return ''
    }
  }

  // Get usage statistics
  async getUsageStats() {
    try {
      return await apiProxyService.getUsageStats()
    } catch (error) {
      console.error('Failed to get usage stats:', error)
      return null
    }
  }

  // Check if user has backend API keys configured
  async hasBackendApiKeys() {
    try {
      return await apiProxyService.hasApiKeys()
    } catch (error) {
      console.error('Failed to check backend API keys:', error)
      return { gemini: false, perplexity: false, openai: false }
    }
  }

  // Batch API calls with automatic load balancing
  async batchCall(
    calls: Array<{
      provider: 'gemini' | 'perplexity'
      prompt: string
      sessionId?: string
    }>,
    options: { maxConcurrent?: number; retryOnFailure?: boolean } = {}
  ): Promise<Array<{ success: boolean; data?: any; error?: string }>> {
    const maxConcurrent = options.maxConcurrent || 3
    const retryOnFailure = options.retryOnFailure ?? true
    const results: Array<{ success: boolean; data?: any; error?: string }> = []

    // Process calls in batches
    for (let i = 0; i < calls.length; i += maxConcurrent) {
      const batch = calls.slice(i, i + maxConcurrent)
      
      const batchPromises = batch.map(async (call) => {
        try {
          let result
          if (call.provider === 'gemini') {
            result = await this.callGemini(call.prompt, { 
              sessionId: call.sessionId,
              fallbackToLocal: retryOnFailure 
            })
          } else {
            result = await this.callPerplexity(call.prompt, { 
              sessionId: call.sessionId,
              fallbackToLocal: retryOnFailure 
            })
          }
          return { success: true, data: result }
        } catch (error: any) {
          return { success: false, error: error.message }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // Add delay between batches to respect rate limits
      if (i + maxConcurrent < calls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return results
  }
}

export const enhancedApiService = new EnhancedApiService()