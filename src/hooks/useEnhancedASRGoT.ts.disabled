// Enhanced ASR-GoT Hook with Full Backend Integration
// Combines all backend services for comprehensive session management

import { useState, useEffect, useCallback } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { dataStorageService } from '@/services/dataStorageService'
import { enhancedApiService } from '@/services/enhancedApiService'
import { apiProxyService } from '@/services/apiProxyService'
import type { AsrGotState, APICredentials } from '@/types/asrGotTypes'
import { createInitialGraphData, createInitialResearchContext } from '@/utils/asrGotUtils'
import { completeASRGoTParameters } from '@/config/asrGotParameters'
import { AsrGotStageEngine } from '@/services/AsrGotStageEngine'
import { toast } from 'sonner'

interface UseEnhancedASRGoTReturn extends AsrGotState {
  // Session Management
  currentSessionId: string | null
  isPaused: boolean
  lastSaveTime: Date | null
  autoSaveEnabled: boolean
  
  // Actions
  startNewSession: (query: string) => Promise<void>
  pauseSession: () => Promise<void>
  resumeSession: () => Promise<void>
  saveSession: () => Promise<string>
  loadSession: (sessionId: string) => Promise<void>
  resetSession: () => void
  
  // API Integration
  updateApiCredentials: (credentials: APICredentials) => void
  hasBackendApiKeys: () => Promise<{ [key: string]: boolean }>
  getUsageStats: () => Promise<any>
  
  // Stage Execution
  executeStage: (stageNumber: number) => Promise<void>
  executeAllStages: () => Promise<void>
  
  // Export and Visualization
  exportResults: () => Promise<void>
  saveVisualization: (title: string, data: any, stage: number) => Promise<void>
}

export function useEnhancedASRGoT(): UseEnhancedASRGoTReturn {
  // Core State
  const [state, setState] = useState<AsrGotState>({
    userQuery: '',
    isProcessing: false,
    isCompleted: false,
    currentStage: 0,
    researchContext: createInitialResearchContext(),
    userPreferences: {},
    parameters: completeASRGoTParameters,
    graphData: createInitialGraphData(),
    stageResults: {},
    exportedFiles: [],
    processingMode: 'automatic',
    apiCredentials: null
  })

  // Session Management State
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [stageEngine] = useState(() => new AsrGotStageEngine())

  const { user } = useAuthContext()

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !user || isPaused || !state.isProcessing || !currentSessionId) return

    const autoSaveInterval = setInterval(async () => {
      try {
        await saveSession()
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }, 30000) // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [autoSaveEnabled, user, isPaused, state.isProcessing, currentSessionId])

  // Initialize API service with local credentials
  useEffect(() => {
    if (state.apiCredentials) {
      enhancedApiService.setLocalCredentials(state.apiCredentials)
    }
  }, [state.apiCredentials])

  const updateState = useCallback((updates: Partial<AsrGotState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const startNewSession = useCallback(async (query: string) => {
    try {
      const sessionId = crypto.randomUUID()
      setCurrentSessionId(sessionId)
      setIsPaused(false)
      
      updateState({
        userQuery: query,
        isProcessing: false,
        isCompleted: false,
        currentStage: 0,
        researchContext: createInitialResearchContext(),
        graphData: createInitialGraphData(),
        stageResults: {},
        exportedFiles: []
      })

      // Save initial session state
      if (user) {
        await dataStorageService.saveResearchSession(state, sessionId)
        setLastSaveTime(new Date())
      }

      toast.success('New research session started')
    } catch (error: any) {
      console.error('Failed to start new session:', error)
      toast.error(error.message || 'Failed to start new session')
    }
  }, [user, state, updateState])

  const pauseSession = useCallback(async () => {
    try {
      setIsPaused(true)
      updateState({ isProcessing: false })
      
      if (currentSessionId && user) {
        await dataStorageService.saveResearchSession({
          ...state,
          isProcessing: false
        }, currentSessionId)
        setLastSaveTime(new Date())
      }

      toast.info('Session paused and saved')
    } catch (error: any) {
      console.error('Failed to pause session:', error)
      toast.error(error.message || 'Failed to pause session')
    }
  }, [currentSessionId, user, state, updateState])

  const resumeSession = useCallback(async () => {
    try {
      setIsPaused(false)
      toast.info('Session resumed')
    } catch (error: any) {
      console.error('Failed to resume session:', error)
      toast.error(error.message || 'Failed to resume session')
    }
  }, [])

  const saveSession = useCallback(async (): Promise<string> => {
    try {
      if (!currentSessionId) {
        throw new Error('No active session to save')
      }

      const sessionId = await dataStorageService.saveResearchSession(state, currentSessionId)
      setLastSaveTime(new Date())
      
      return sessionId
    } catch (error: any) {
      console.error('Failed to save session:', error)
      throw error
    }
  }, [currentSessionId, state])

  const loadSession = useCallback(async (sessionId: string) => {
    try {
      const sessionData = await dataStorageService.loadResearchSession(sessionId)
      if (!sessionData) {
        throw new Error('Session not found')
      }

      setState(sessionData)
      setCurrentSessionId(sessionId)
      setIsPaused(sessionData.isProcessing === false && sessionData.currentStage > 0)
      setLastSaveTime(new Date())

      // Update API service with loaded credentials
      if (sessionData.apiCredentials) {
        enhancedApiService.setLocalCredentials(sessionData.apiCredentials)
      }
    } catch (error: any) {
      console.error('Failed to load session:', error)
      throw error
    }
  }, [])

  const resetSession = useCallback(() => {
    setState({
      userQuery: '',
      isProcessing: false,
      isCompleted: false,
      currentStage: 0,
      researchContext: createInitialResearchContext(),
      userPreferences: {},
      parameters: completeASRGoTParameters,
      graphData: createInitialGraphData(),
      stageResults: {},
      exportedFiles: [],
      processingMode: 'automatic',
      apiCredentials: state.apiCredentials // Keep API credentials
    })
    setCurrentSessionId(null)
    setIsPaused(false)
    setLastSaveTime(null)
  }, [state.apiCredentials])

  const updateApiCredentials = useCallback((credentials: APICredentials) => {
    updateState({ apiCredentials: credentials })
    enhancedApiService.setLocalCredentials(credentials)
  }, [updateState])

  const hasBackendApiKeys = useCallback(async () => {
    return await enhancedApiService.hasBackendApiKeys()
  }, [])

  const getUsageStats = useCallback(async () => {
    return await enhancedApiService.getUsageStats()
  }, [])

  const executeStage = useCallback(async (stageNumber: number) => {
    if (isPaused) {
      toast.warning('Session is paused. Resume to continue execution.')
      return
    }

    try {
      updateState({ isProcessing: true, currentStage: stageNumber })

      // Use enhanced API service for stage execution
      const stageResult = await stageEngine.executeStage(
        stageNumber,
        state,
        {
          callGemini: (prompt) => enhancedApiService.callGemini(prompt, { sessionId: currentSessionId }),
          callPerplexity: (query) => enhancedApiService.callPerplexity(query, { sessionId: currentSessionId })
        }
      )

      // Update state with stage results
      updateState({
        stageResults: {
          ...state.stageResults,
          [stageNumber]: stageResult
        },
        graphData: stageResult.graphData || state.graphData,
        currentStage: stageNumber + 1,
        isCompleted: stageNumber >= 8,
        isProcessing: stageNumber < 8
      })

      // Auto-save after stage completion
      if (currentSessionId && user) {
        await saveSession()
      }

      // Save visualizations if any were generated
      if (stageResult.visualizations) {
        for (const viz of stageResult.visualizations) {
          await saveVisualization(viz.title, viz.data, stageNumber)
        }
      }

      toast.success(`Stage ${stageNumber + 1} completed successfully`)
    } catch (error: any) {
      console.error(`Stage ${stageNumber + 1} execution failed:`, error)
      updateState({ isProcessing: false })
      toast.error(error.message || `Stage ${stageNumber + 1} execution failed`)
    }
  }, [isPaused, state, currentSessionId, user, stageEngine, updateState, saveSession])

  const executeAllStages = useCallback(async () => {
    try {
      for (let stage = state.currentStage; stage < 9; stage++) {
        if (isPaused) {
          toast.info('Execution paused by user')
          break
        }
        await executeStage(stage)
      }
    } catch (error: any) {
      console.error('Failed to execute all stages:', error)
      toast.error(error.message || 'Failed to execute all stages')
    }
  }, [state.currentStage, isPaused, executeStage])

  const exportResults = useCallback(async () => {
    try {
      if (!state.isCompleted) {
        throw new Error('Cannot export incomplete research')
      }

      // Generate comprehensive report
      const reportHtml = await stageEngine.generateFinalReport(state)
      
      // Save to file storage if user is authenticated
      if (currentSessionId && user) {
        await dataStorageService.saveFileReference(
          currentSessionId,
          'Final_Report.html',
          'text/html',
          reportHtml.length,
          `./reports/${currentSessionId}_final_report.html`,
          'report',
          { generatedAt: new Date().toISOString() }
        )
      }

      // Download file
      const blob = new Blob([reportHtml], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ASR-GoT_Report_${new Date().toISOString().slice(0, 10)}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Research report exported successfully')
    } catch (error: any) {
      console.error('Failed to export results:', error)
      toast.error(error.message || 'Failed to export results')
    }
  }, [state.isCompleted, state, currentSessionId, user, stageEngine])

  const saveVisualization = useCallback(async (title: string, data: any, stage: number) => {
    try {
      if (!currentSessionId) return

      // Convert data to image or save as JSON
      const dataUrl = typeof data === 'string' ? data : JSON.stringify(data)
      const filePath = `./visualizations/${currentSessionId}_stage_${stage}_${title.replace(/\s+/g, '_')}.json`

      await dataStorageService.saveVisualization(
        currentSessionId,
        stage,
        title,
        `Stage ${stage + 1} visualization: ${title}`,
        'visualization',
        dataUrl,
        filePath,
        { stage, title, generatedAt: new Date().toISOString() }
      )
    } catch (error) {
      console.error('Failed to save visualization:', error)
    }
  }, [currentSessionId])

  return {
    ...state,
    currentSessionId,
    isPaused,
    lastSaveTime,
    autoSaveEnabled,
    startNewSession,
    pauseSession,
    resumeSession,
    saveSession,
    loadSession,
    resetSession,
    updateApiCredentials,
    hasBackendApiKeys,
    getUsageStats,
    executeStage,
    executeAllStages,
    exportResults,
    saveVisualization
  }
}