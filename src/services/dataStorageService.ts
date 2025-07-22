// Data Storage Service
// Comprehensive data persistence for research sessions, visualizations, and files

import { supabase } from '@/integrations/supabase/client'
import type { AsrGotState } from '@/types/asrGotTypes'

export interface StoredResearchSession {
  id: string
  query: string
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed'
  current_stage: number
  total_stages: number
  created_at: string
  updated_at: string
  completed_at: string | null
  research_context: any
  graph_data: any
  stage_results: any
  metadata: any
  user_id: string | null
  tags: string[]
}

export interface StoredVisualization {
  id: string
  session_id: string
  stage: number
  title: string
  description: string
  figure_type: string
  data_url: string
  file_path: string
  metadata: any
  created_at: string
}

export interface StoredFile {
  id: string
  user_id: string
  session_id: string
  file_name: string
  file_type: string
  file_size: number
  storage_path: string
  file_category: 'visualization' | 'data' | 'report' | 'upload'
  metadata: any
  created_at: string
  is_public: boolean
}

export interface ResearchCollection {
  id: string
  user_id: string
  name: string
  description: string
  color: string
  is_public: boolean
  session_ids: string[]
  created_at: string
  updated_at: string
}

class DataStorageService {
  // Research Session Management
  async saveResearchSession(sessionData: Partial<AsrGotState>, sessionId?: string): Promise<string> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const sessionRecord = {
        id: sessionId || crypto.randomUUID(),
        query: sessionData.userQuery || '',
        status: sessionData.isProcessing ? 'running' : sessionData.isCompleted ? 'completed' : 'pending',
        current_stage: sessionData.currentStage || 1,
        total_stages: 9,
        research_context: {
          researchContext: sessionData.researchContext,
          userPreferences: sessionData.userPreferences,
          parameters: sessionData.parameters
        },
        graph_data: {
          nodes: sessionData.graphData?.nodes || [],
          edges: sessionData.graphData?.edges || [],
          metadata: sessionData.graphData?.metadata || {}
        },
        stage_results: sessionData.stageResults || {},
        metadata: {
          exportedFiles: sessionData.exportedFiles || [],
          processingMode: sessionData.processingMode,
          apiCredentials: sessionData.apiCredentials ? 'configured' : 'not_configured'
        },
        user_id: session?.user?.id || null,
        tags: this.extractTagsFromQuery(sessionData.userQuery || '')
      }

      if (sessionId) {
        // Update existing session
        const { data, error } = await supabase
          .from('query_sessions')
          .update(sessionRecord)
          .eq('id', sessionId)
          .select()
          .single()

        if (error) throw error
        return data.id
      } else {
        // Create new session
        const { data, error } = await supabase
          .from('query_sessions')
          .insert(sessionRecord)
          .select()
          .single()

        if (error) throw error
        return data.id
      }
    } catch (error) {
      console.error('Save research session error:', error)
      // Fallback to local storage
      this.saveSessionToLocalStorage(sessionData, sessionId)
      return sessionId || crypto.randomUUID()
    }
  }

  async loadResearchSession(sessionId: string): Promise<AsrGotState | null> {
    try {
      const { data, error } = await supabase
        .from('query_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (error || !data) {
        // Try local storage fallback
        return this.loadSessionFromLocalStorage(sessionId)
      }

      // Convert database format back to AsrGotState format
      return {
        userQuery: data.query,
        isProcessing: data.status === 'running',
        isCompleted: data.status === 'completed',
        currentStage: data.current_stage,
        researchContext: data.research_context?.researchContext || '',
        userPreferences: data.research_context?.userPreferences || {},
        parameters: data.research_context?.parameters || {},
        graphData: data.graph_data || { nodes: [], edges: [], metadata: {} },
        stageResults: data.stage_results || {},
        exportedFiles: data.metadata?.exportedFiles || [],
        processingMode: data.metadata?.processingMode || 'automatic',
        apiCredentials: data.metadata?.apiCredentials === 'configured' ? {} : null
      } as AsrGotState
    } catch (error) {
      console.error('Load research session error:', error)
      return this.loadSessionFromLocalStorage(sessionId)
    }
  }

  async getResearchSessions(limit: number = 50): Promise<StoredResearchSession[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      let query = supabase
        .from('query_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (session) {
        query = query.eq('user_id', session.user.id)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Get research sessions error:', error)
      return this.getSessionsFromLocalStorage()
    }
  }

  // Visualization Management
  async saveVisualization(
    sessionId: string,
    stage: number,
    title: string,
    description: string,
    figureType: string,
    dataUrl: string,
    filePath: string,
    metadata: any = {}
  ): Promise<string> {
    try {
      const visualization = {
        session_id: sessionId,
        stage,
        title,
        description,
        figure_type: figureType,
        data_url: dataUrl,
        file_path: filePath,
        metadata
      }

      const { data, error } = await supabase
        .from('query_figures')
        .insert(visualization)
        .select()
        .single()

      if (error) throw error

      // Also save file reference
      await this.saveFileReference(
        sessionId,
        filePath.split('/').pop() || title,
        'image/png',
        0,
        filePath,
        'visualization',
        metadata
      )

      return data.id
    } catch (error) {
      console.error('Save visualization error:', error)
      throw error
    }
  }

  async getSessionVisualizations(sessionId: string): Promise<StoredVisualization[]> {
    try {
      const { data, error } = await supabase
        .from('query_figures')
        .select('*')
        .eq('session_id', sessionId)
        .order('stage', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Get session visualizations error:', error)
      return []
    }
  }

  // File Storage Management
  async saveFileReference(
    sessionId: string,
    fileName: string,
    fileType: string,
    fileSize: number,
    storagePath: string,
    category: 'visualization' | 'data' | 'report' | 'upload',
    metadata: any = {},
    isPublic: boolean = false
  ): Promise<string> {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const fileRecord = {
        user_id: session?.user?.id || '',
        session_id: sessionId,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        storage_path: storagePath,
        file_category: category,
        metadata,
        is_public: isPublic
      }

      const { data, error } = await supabase
        .from('user_file_storage')
        .insert(fileRecord)
        .select()
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('Save file reference error:', error)
      throw error
    }
  }

  async getSessionFiles(sessionId: string): Promise<StoredFile[]> {
    try {
      const { data, error } = await supabase
        .from('user_file_storage')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Get session files error:', error)
      return []
    }
  }

  // Research Collections Management
  async createCollection(name: string, description: string, color: string = '#3498db'): Promise<string> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Authentication required')

      const collection = {
        user_id: session.user.id,
        name,
        description,
        color,
        is_public: false,
        session_ids: []
      }

      const { data, error } = await supabase
        .from('research_collections')
        .insert(collection)
        .select()
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('Create collection error:', error)
      throw error
    }
  }

  async addSessionToCollection(collectionId: string, sessionId: string): Promise<void> {
    try {
      // Get current collection
      const { data: collection, error: fetchError } = await supabase
        .from('research_collections')
        .select('session_ids')
        .eq('id', collectionId)
        .single()

      if (fetchError) throw fetchError

      // Add session ID if not already present
      const sessionIds = collection.session_ids || []
      if (!sessionIds.includes(sessionId)) {
        sessionIds.push(sessionId)

        const { error: updateError } = await supabase
          .from('research_collections')
          .update({ session_ids: sessionIds })
          .eq('id', collectionId)

        if (updateError) throw updateError
      }
    } catch (error) {
      console.error('Add session to collection error:', error)
      throw error
    }
  }

  async getUserCollections(): Promise<ResearchCollection[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return []

      const { data, error } = await supabase
        .from('research_collections')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Get user collections error:', error)
      return []
    }
  }

  // Local Storage Fallback Methods
  private saveSessionToLocalStorage(sessionData: Partial<AsrGotState>, sessionId?: string): void {
    try {
      const sessions = JSON.parse(localStorage.getItem('asr-got-sessions') || '[]')
      const id = sessionId || crypto.randomUUID()
      const timestamp = new Date().toISOString()

      const sessionRecord = {
        id,
        timestamp,
        ...sessionData
      }

      const existingIndex = sessions.findIndex((s: any) => s.id === id)
      if (existingIndex >= 0) {
        sessions[existingIndex] = sessionRecord
      } else {
        sessions.unshift(sessionRecord)
      }

      // Keep only last 100 sessions
      if (sessions.length > 100) {
        sessions.splice(100)
      }

      localStorage.setItem('asr-got-sessions', JSON.stringify(sessions))
    } catch (error) {
      console.error('Save to local storage error:', error)
    }
  }

  private loadSessionFromLocalStorage(sessionId: string): AsrGotState | null {
    try {
      const sessions = JSON.parse(localStorage.getItem('asr-got-sessions') || '[]')
      const session = sessions.find((s: any) => s.id === sessionId)
      return session || null
    } catch (error) {
      console.error('Load from local storage error:', error)
      return null
    }
  }

  private getSessionsFromLocalStorage(): StoredResearchSession[] {
    try {
      const sessions = JSON.parse(localStorage.getItem('asr-got-sessions') || '[]')
      return sessions.map((s: any) => ({
        ...s,
        created_at: s.timestamp,
        updated_at: s.timestamp,
        user_id: null,
        tags: this.extractTagsFromQuery(s.userQuery || '')
      }))
    } catch (error) {
      console.error('Get sessions from local storage error:', error)
      return []
    }
  }

  private extractTagsFromQuery(query: string): string[] {
    const tags: string[] = []
    
    // Extract research field indicators
    const fields = ['medicine', 'biology', 'chemistry', 'physics', 'psychology', 'oncology', 'dermatology', 'immunology']
    fields.forEach(field => {
      if (query.toLowerCase().includes(field)) {
        tags.push(field)
      }
    })

    // Extract common research terms
    const terms = ['analysis', 'review', 'study', 'research', 'investigation', 'survey', 'experiment']
    terms.forEach(term => {
      if (query.toLowerCase().includes(term)) {
        tags.push(term)
      }
    })

    return [...new Set(tags)] // Remove duplicates
  }
}

export const dataStorageService = new DataStorageService()