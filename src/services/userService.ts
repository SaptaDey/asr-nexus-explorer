// User Management Service
// Frontend service for user authentication, profile management, and API key handling

import { supabase } from '@/integrations/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  user_id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  subscription_tier: 'free' | 'pro' | 'enterprise'
  api_usage_limit: number
  current_api_usage: number
  preferences: any
  last_login: string | null
  created_at: string
  updated_at: string
}

export interface ApiKeyInfo {
  id: string
  provider: 'gemini' | 'perplexity'
  key_name: string
  is_active: boolean
  created_at: string
  last_used: string | null
  usage_count: number
}

export interface UserRegistrationData {
  email: string
  password: string
  fullName: string
  subscriptionTier?: 'free' | 'pro' | 'enterprise'
}

export interface UserLoginData {
  email: string
  password: string
}

export interface DashboardData {
  profile: UserProfile
  recentSessions: any[]
  collections: any[]
  apiUsage: any[]
  recentFiles: any[]
}

class UserService {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  }

  // Authentication Methods
  async registerUser(userData: UserRegistrationData): Promise<{ user: any; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/user-management/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(userData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Registration failed')
      }

      return await response.json()
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  async loginUser(loginData: UserLoginData): Promise<{ user: User; session: Session; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/user-management/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Login failed')
      }

      const result = await response.json()
      
      // Store session in local Supabase client
      await supabase.auth.setSession(result.session)
      
      return result
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  async logoutUser(): Promise<void> {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  }

  // Profile Management
  async getUserProfile(): Promise<{ profile: UserProfile; apiKeys: ApiKeyInfo[]; statistics: any }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${this.baseUrl}/user-management/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch profile')
      }

      return await response.json()
    } catch (error) {
      console.error('Get profile error:', error)
      throw error
    }
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<{ profile: UserProfile; message: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${this.baseUrl}/user-management/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
      }

      return await response.json()
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    }
  }

  // API Key Management
  async getApiKeys(): Promise<{ apiKeys: ApiKeyInfo[] }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${this.baseUrl}/user-management/api-keys`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch API keys')
      }

      return await response.json()
    } catch (error) {
      console.error('Get API keys error:', error)
      throw error
    }
  }

  async addApiKey(provider: 'gemini' | 'perplexity', apiKey: string, keyName?: string): Promise<{ apiKey: ApiKeyInfo; message: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${this.baseUrl}/user-management/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ provider, apiKey, keyName })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add API key')
      }

      return await response.json()
    } catch (error) {
      console.error('Add API key error:', error)
      throw error
    }
  }

  async deleteApiKey(keyId: string): Promise<{ message: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${this.baseUrl}/user-management/api-keys?keyId=${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete API key')
      }

      return await response.json()
    } catch (error) {
      console.error('Delete API key error:', error)
      throw error
    }
  }

  // Dashboard Data
  async getDashboardData(): Promise<DashboardData> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${this.baseUrl}/user-management/dashboard`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch dashboard data')
      }

      return await response.json()
    } catch (error) {
      console.error('Get dashboard data error:', error)
      throw error
    }
  }

  // Session Management with Local Storage Fallback
  async saveSessionLocal(sessionData: any): Promise<void> {
    try {
      // Save to Supabase if authenticated
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await supabase.from('query_sessions').insert({
          user_id: session.user.id,
          ...sessionData
        })
      }
      
      // Always save to local storage as backup
      const localSessions = JSON.parse(localStorage.getItem('asr-got-sessions') || '[]')
      localSessions.unshift({ ...sessionData, timestamp: new Date().toISOString() })
      
      // Keep only last 50 sessions locally
      if (localSessions.length > 50) {
        localSessions.splice(50)
      }
      
      localStorage.setItem('asr-got-sessions', JSON.stringify(localSessions))
    } catch (error) {
      console.error('Save session error:', error)
      // Fallback to local storage only
      const localSessions = JSON.parse(localStorage.getItem('asr-got-sessions') || '[]')
      localSessions.unshift({ ...sessionData, timestamp: new Date().toISOString() })
      localStorage.setItem('asr-got-sessions', JSON.stringify(localSessions))
    }
  }

  async getSessionHistory(): Promise<any[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // Get from Supabase if authenticated
        const { data } = await supabase
          .from('query_sessions')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(100)
        
        return data || []
      }
      
      // Fallback to local storage
      return JSON.parse(localStorage.getItem('asr-got-sessions') || '[]')
    } catch (error) {
      console.error('Get session history error:', error)
      return JSON.parse(localStorage.getItem('asr-got-sessions') || '[]')
    }
  }
}

export const userService = new UserService()