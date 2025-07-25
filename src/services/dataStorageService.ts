/**
 * Data Storage Service with Comprehensive Validation
 * Provides secure data persistence for research sessions, visualizations, and files
 * Includes extensive validation and sanitization for all data operations
 */

import { supabase } from '@/integrations/supabase/client'
import type { AsrGotState } from '@/types/asrGotTypes'
import { sanitizeHTML, validateInput } from '@/utils/securityUtils'
import { securityLogger, SecurityEventType, SecurityEventSeverity } from '@/services/securityEventLogger'

// Validation schemas and interfaces
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  sanitizedData?: any
}

export interface DataValidationOptions {
  strictMode?: boolean
  sanitizeHtml?: boolean
  validateStructure?: boolean
  logViolations?: boolean
}

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
  private readonly MAX_QUERY_LENGTH = 10000
  private readonly MAX_DESCRIPTION_LENGTH = 5000
  private readonly MAX_TITLE_LENGTH = 500
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
  private readonly ALLOWED_FILE_TYPES = [
    'image/png', 'image/jpeg', 'image/svg+xml', 'image/webp',
    'application/json', 'text/html', 'text/plain', 'text/csv',
    'application/pdf', 'application/vnd.ms-excel'
  ]

  /**
   * Comprehensive data validation for research sessions
   */
  private validateResearchSession(sessionData: Partial<AsrGotState>, options: DataValidationOptions = {}): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      sanitizedData: { ...sessionData }
    }

    try {
      // Validate and sanitize user query
      if (sessionData.userQuery) {
        if (sessionData.userQuery.length > this.MAX_QUERY_LENGTH) {
          result.errors.push(`Query exceeds maximum length of ${this.MAX_QUERY_LENGTH} characters`)
          result.isValid = false
        } else {
          try {
            result.sanitizedData.userQuery = validateInput(sessionData.userQuery, 'query')
          } catch (error) {
            result.errors.push(`Invalid query format: ${error instanceof Error ? error.message : 'Unknown error'}`)
            result.isValid = false
          }
        }
      }

      // Validate research context
      if (sessionData.researchContext) {
        if (typeof sessionData.researchContext !== 'string') {
          result.errors.push('Research context must be a string')
          result.isValid = false
        } else if (sessionData.researchContext.length > this.MAX_DESCRIPTION_LENGTH) {
          result.errors.push(`Research context exceeds maximum length of ${this.MAX_DESCRIPTION_LENGTH} characters`)
          result.isValid = false
        } else if (options.sanitizeHtml) {
          result.sanitizedData.researchContext = sanitizeHTML(sessionData.researchContext)
        }
      }

      // Validate graph data structure
      if (sessionData.graphData) {
        const graphValidation = this.validateGraphData(sessionData.graphData)
        if (!graphValidation.isValid) {
          result.errors.push(...graphValidation.errors)
          result.warnings.push(...graphValidation.warnings)
          result.isValid = false
        } else {
          result.sanitizedData.graphData = graphValidation.sanitizedData
        }
      }

      // Validate stage results
      if (sessionData.stageResults) {
        const stageValidation = this.validateStageResults(sessionData.stageResults)
        if (!stageValidation.isValid) {
          result.errors.push(...stageValidation.errors)
          result.warnings.push(...stageValidation.warnings)
          result.isValid = false
        } else {
          result.sanitizedData.stageResults = stageValidation.sanitizedData
        }
      }

      // Validate processing state
      if (sessionData.currentStage !== undefined) {
        if (!Number.isInteger(sessionData.currentStage) || sessionData.currentStage < 1 || sessionData.currentStage > 9) {
          result.errors.push('Current stage must be an integer between 1 and 9')
          result.isValid = false
        }
      }

      // Validate parameters
      if (sessionData.parameters) {
        const paramValidation = this.validateParameters(sessionData.parameters)
        if (!paramValidation.isValid) {
          result.errors.push(...paramValidation.errors)
          result.warnings.push(...paramValidation.warnings)
          result.isValid = false
        }
      }

      // Log validation violations if enabled
      if (options.logViolations && (!result.isValid || result.warnings.length > 0)) {
        securityLogger.logEvent({
          event_type: SecurityEventType.DATA_VALIDATION,
          severity: result.isValid ? SecurityEventSeverity.WARNING : SecurityEventSeverity.ERROR,
          details: {
            validation_type: 'research_session',
            errors: result.errors,
            warnings: result.warnings,
            data_size: JSON.stringify(sessionData).length
          }
        })
      }

    } catch (error) {
      result.errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      result.isValid = false
    }

    return result
  }

  /**
   * Validate graph data structure
   */
  private validateGraphData(graphData: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      sanitizedData: { ...graphData }
    }

    if (!graphData || typeof graphData !== 'object') {
      result.errors.push('Graph data must be an object')
      result.isValid = false
      return result
    }

    // Validate nodes
    if (graphData.nodes) {
      if (!Array.isArray(graphData.nodes)) {
        result.errors.push('Graph nodes must be an array')
        result.isValid = false
      } else {
        result.sanitizedData.nodes = graphData.nodes.map((node: any, index: number) => {
          if (!node || typeof node !== 'object') {
            result.warnings.push(`Node at index ${index} is invalid`)
            return null
          }

          const sanitizedNode = { ...node }

          // Validate node ID
          if (!node.id || typeof node.id !== 'string') {
            result.warnings.push(`Node at index ${index} has invalid ID`)
            sanitizedNode.id = `node_${index}_${Date.now()}`
          }

          // Sanitize node label
          if (node.label && typeof node.label === 'string') {
            sanitizedNode.label = sanitizeHTML(node.label)
          }

          // Validate confidence if present
          if (node.confidence !== undefined) {
            if (Array.isArray(node.confidence)) {
              sanitizedNode.confidence = node.confidence.map((val: any) => 
                typeof val === 'number' && val >= 0 && val <= 1 ? val : 0
              )
            } else if (typeof node.confidence === 'number') {
              sanitizedNode.confidence = Math.max(0, Math.min(1, node.confidence))
            }
          }

          return sanitizedNode
        }).filter(Boolean)
      }
    }

    // Validate edges
    if (graphData.edges) {
      if (!Array.isArray(graphData.edges)) {
        result.errors.push('Graph edges must be an array')
        result.isValid = false
      } else {
        result.sanitizedData.edges = graphData.edges.map((edge: any, index: number) => {
          if (!edge || typeof edge !== 'object') {
            result.warnings.push(`Edge at index ${index} is invalid`)
            return null
          }

          const sanitizedEdge = { ...edge }

          // Validate edge ID
          if (!edge.id || typeof edge.id !== 'string') {
            sanitizedEdge.id = `edge_${index}_${Date.now()}`
          }

          // Validate source and target
          if (!edge.source || typeof edge.source !== 'string') {
            result.warnings.push(`Edge at index ${index} has invalid source`)
            return null
          }
          if (!edge.target || typeof edge.target !== 'string') {
            result.warnings.push(`Edge at index ${index} has invalid target`)
            return null
          }

          // Validate confidence
          if (edge.confidence !== undefined && typeof edge.confidence === 'number') {
            sanitizedEdge.confidence = Math.max(0, Math.min(1, edge.confidence))
          }

          return sanitizedEdge
        }).filter(Boolean)
      }
    }

    return result
  }

  /**
   * Validate stage results
   */
  private validateStageResults(stageResults: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      sanitizedData: {}
    }

    if (!stageResults || typeof stageResults !== 'object') {
      result.errors.push('Stage results must be an object')
      result.isValid = false
      return result
    }

    for (const [stageKey, stageData] of Object.entries(stageResults)) {
      if (typeof stageData === 'string') {
        // Sanitize HTML content in stage results
        result.sanitizedData[stageKey] = sanitizeHTML(stageData)
      } else if (typeof stageData === 'object' && stageData !== null) {
        // Recursively validate nested objects
        result.sanitizedData[stageKey] = this.sanitizeObjectValues(stageData)
      } else {
        result.sanitizedData[stageKey] = stageData
      }
    }

    return result
  }

  /**
   * Validate ASR-GoT parameters
   */
  private validateParameters(parameters: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      sanitizedData: { ...parameters }
    }

    if (!parameters || typeof parameters !== 'object') {
      result.errors.push('Parameters must be an object')
      result.isValid = false
      return result
    }

    // Validate specific parameter ranges
    const parameterRules = {
      'P1.1': { min: 1, max: 100, type: 'number' },
      'P1.2': { min: 0, max: 1, type: 'number' },
      'P1.3': { type: 'boolean' },
      'P1.4': { min: 1, max: 20, type: 'number' },
      'P1.5': { type: 'string', maxLength: 1000 }
    }

    for (const [key, value] of Object.entries(parameters)) {
      const rule = parameterRules[key as keyof typeof parameterRules]
      if (rule) {
        if (rule.type === 'number' && typeof value === 'number') {
          if (rule.min !== undefined && value < rule.min) {
            result.warnings.push(`Parameter ${key} is below minimum value ${rule.min}`)
            result.sanitizedData[key] = rule.min
          }
          if (rule.max !== undefined && value > rule.max) {
            result.warnings.push(`Parameter ${key} exceeds maximum value ${rule.max}`)
            result.sanitizedData[key] = rule.max
          }
        } else if (rule.type === 'string' && typeof value === 'string') {
          if (rule.maxLength && value.length > rule.maxLength) {
            result.warnings.push(`Parameter ${key} exceeds maximum length`)
            result.sanitizedData[key] = value.substring(0, rule.maxLength)
          }
          result.sanitizedData[key] = sanitizeHTML(value)
        } else if (rule.type === 'boolean' && typeof value !== 'boolean') {
          result.warnings.push(`Parameter ${key} should be boolean`)
          result.sanitizedData[key] = Boolean(value)
        }
      }
    }

    return result
  }

  /**
   * Validate file data
   */
  private validateFileData(fileName: string, fileType: string, fileSize: number, category: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    // Validate file name
    if (!fileName || typeof fileName !== 'string') {
      result.errors.push('File name is required and must be a string')
      result.isValid = false
    } else if (fileName.length > this.MAX_TITLE_LENGTH) {
      result.errors.push(`File name exceeds maximum length of ${this.MAX_TITLE_LENGTH} characters`)
      result.isValid = false
    } else if (!/^[a-zA-Z0-9._-]+$/.test(fileName.replace(/\s/g, '_'))) {
      result.warnings.push('File name contains special characters that may cause issues')
    }

    // Validate file type
    if (!fileType || typeof fileType !== 'string') {
      result.errors.push('File type is required')
      result.isValid = false
    } else if (!this.ALLOWED_FILE_TYPES.includes(fileType)) {
      result.errors.push(`File type ${fileType} is not allowed`)
      result.isValid = false
    }

    // Validate file size
    if (typeof fileSize !== 'number' || fileSize < 0) {
      result.errors.push('File size must be a non-negative number')
      result.isValid = false
    } else if (fileSize > this.MAX_FILE_SIZE) {
      result.errors.push(`File size exceeds maximum limit of ${this.MAX_FILE_SIZE} bytes`)
      result.isValid = false
    }

    // Validate category
    const allowedCategories = ['visualization', 'data', 'report', 'upload']
    if (!allowedCategories.includes(category)) {
      result.errors.push(`Invalid file category: ${category}`)
      result.isValid = false
    }

    return result
  }

  /**
   * Sanitize object values recursively
   */
  private sanitizeObjectValues(obj: any): any {
    if (typeof obj === 'string') {
      return sanitizeHTML(obj)
    } else if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObjectValues(item))
    } else if (obj && typeof obj === 'object') {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObjectValues(value)
      }
      return sanitized
    }
    return obj
  }

  // Research Session Management
  async saveResearchSession(sessionData: Partial<AsrGotState>, sessionId?: string): Promise<string> {
    try {
      // Validate and sanitize session data
      const validation = this.validateResearchSession(sessionData, {
        strictMode: true,
        sanitizeHtml: true,
        validateStructure: true,
        logViolations: true
      })

      if (!validation.isValid) {
        throw new Error(`Session validation failed: ${validation.errors.join(', ')}`)
      }

      // Use sanitized data
      const sanitizedData = validation.sanitizedData as Partial<AsrGotState>
      
      const { data: { session } } = await supabase.auth.getSession()
      
      const sessionRecord = {
        id: sessionId || crypto.randomUUID(),
        query: sanitizedData.userQuery || '',
        status: sanitizedData.isProcessing ? 'running' : sanitizedData.isCompleted ? 'completed' : 'pending',
        current_stage: sanitizedData.currentStage || 1,
        total_stages: 9,
        research_context: {
          researchContext: sanitizedData.researchContext,
          userPreferences: sanitizedData.userPreferences,
          parameters: sanitizedData.parameters
        },
        graph_data: sanitizedData.graphData || {
          nodes: [],
          edges: [],
          metadata: {}
        },
        stage_results: sanitizedData.stageResults || {},
        metadata: {
          exportedFiles: sanitizedData.exportedFiles || [],
          processingMode: sanitizedData.processingMode,
          apiCredentials: sanitizedData.apiCredentials ? 'configured' : 'not_configured',
          validationWarnings: validation.warnings
        },
        user_id: session?.user?.id || null,
        tags: this.extractTagsFromQuery(sanitizedData.userQuery || '')
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
      // Validate file data
      const validation = this.validateFileData(fileName, fileType, fileSize, category)
      if (!validation.isValid) {
        throw new Error(`File validation failed: ${validation.errors.join(', ')}`)
      }

      // Log validation warnings
      if (validation.warnings.length > 0) {
        securityLogger.logEvent({
          event_type: SecurityEventType.DATA_VALIDATION,
          severity: SecurityEventSeverity.WARNING,
          details: {
            validation_type: 'file_data',
            warnings: validation.warnings,
            file_name: fileName,
            file_type: fileType,
            file_size: fileSize
          }
        })
      }

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

  /**
   * Public validation method for external use
   */
  public validateData(data: any, type: 'session' | 'file' | 'visualization', options: DataValidationOptions = {}): ValidationResult {
    switch (type) {
      case 'session':
        return this.validateResearchSession(data, options)
      case 'file':
        if (data.fileName && data.fileType && data.fileSize !== undefined && data.category) {
          return this.validateFileData(data.fileName, data.fileType, data.fileSize, data.category)
        } else {
          return {
            isValid: false,
            errors: ['Missing required file properties: fileName, fileType, fileSize, category'],
            warnings: []
          }
        }
      case 'visualization':
        return this.validateGraphData(data)
      default:
        return {
          isValid: false,
          errors: [`Unknown validation type: ${type}`],
          warnings: []
        }
    }
  }

  /**
   * Get validation statistics
   */
  public getValidationStats(): {
    totalValidations: number
    failedValidations: number
    warningCount: number
  } {
    // This would be implemented with actual statistics tracking
    return {
      totalValidations: 0,
      failedValidations: 0,
      warningCount: 0
    }
  }

  /**
   * Sanitize data for export
   */
  public sanitizeForExport(data: any): any {
    return this.sanitizeObjectValues(data)
  }
}

export const dataStorageService = new DataStorageService()