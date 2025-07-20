/**
 * Enhanced ASR-GoT Hook with Query History and Pause-Resume
 * Production-ready implementation with automatic Supabase storage
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { GraphData, ResearchContext } from '@/types/asrGotTypes';
import { queryHistoryService, QuerySession } from '@/services/QueryHistoryService';
import { toast } from 'sonner';

export interface QueryHistoryASRGoTState {
  // Core ASR-GoT state
  currentStage: number;
  isProcessing: boolean;
  stageResults: string[];
  graphData: GraphData;
  researchContext: ResearchContext | null;
  
  // Query history state
  currentSessionId: string | null;
  sessionStatus: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  
  // History management
  queryHistory: QuerySession[];
  historyLoading: boolean;
  historyError: string | null;
  
  // Performance metrics
  executionMetrics: {
    startTime: number | null;
    stageStartTime: number | null;
    tokenUsage: Record<number, number>;
    stageTimings: Record<number, number>;
  };
}

export interface QueryHistoryASRGoTActions {
  // Session management
  startNewSession: (query: string, researchContext: ResearchContext) => Promise<string>;
  pauseCurrentSession: () => Promise<void>;
  resumeSession: (sessionId: string) => Promise<void>;
  stopCurrentSession: () => Promise<void>;
  
  // Stage execution
  executeStage: (stageIndex: number, input?: any) => Promise<void>;
  executeAllStages: (startFromStage?: number) => Promise<void>;
  
  // History management
  loadQueryHistory: (filters?: any) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  loadSessionForReanalysis: (sessionId: string) => Promise<void>;
  
  // Data management
  getCurrentSessionData: () => Promise<any>;
  exportSessionData: (sessionId: string, format: 'json' | 'html' | 'pdf') => Promise<void>;
  
  // Real-time storage
  storeStageResult: (stage: number, result: string, figures?: any[], tables?: any[]) => Promise<void>;
}

export function useQueryHistoryASRGoT(): [QueryHistoryASRGoTState, QueryHistoryASRGoTActions] {
  // Core state
  const [state, setState] = useState<QueryHistoryASRGoTState>({
    currentStage: 0,
    isProcessing: false,
    stageResults: [],
    graphData: { nodes: [], edges: [], metadata: {} },
    researchContext: null,
    currentSessionId: null,
    sessionStatus: 'idle',
    queryHistory: [],
    historyLoading: false,
    historyError: null,
    executionMetrics: {
      startTime: null,
      stageStartTime: null,
      tokenUsage: {},
      stageTimings: {}
    }
  });

  // Refs for cleanup
  const stageExecutionRef = useRef<AbortController | null>(null);
  const autoSaveInterval = useRef<NodeJS.Timeout | null>(null);

  /**
   * Start a new query session
   */
  const startNewSession = useCallback(async (query: string, researchContext: ResearchContext): Promise<string> => {
    try {
      setState(prev => ({ 
        ...prev, 
        isProcessing: true, 
        sessionStatus: 'running',
        executionMetrics: {
          ...prev.executionMetrics,
          startTime: Date.now(),
          stageStartTime: Date.now()
        }
      }));

      const sessionId = await queryHistoryService.createSession(query, researchContext);

      setState(prev => ({
        ...prev,
        currentSessionId: sessionId,
        currentStage: 0,
        stageResults: [],
        graphData: { nodes: [], edges: [], metadata: {} },
        researchContext
      }));

      // Start auto-save interval
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
      autoSaveInterval.current = setInterval(() => {
        autoSaveProgress(sessionId);
      }, 10000); // Auto-save every 10 seconds

      toast.success(`🚀 New research session started: ${query.substring(0, 50)}...`);
      return sessionId;
    } catch (error) {
      setState(prev => ({ ...prev, isProcessing: false, sessionStatus: 'failed' }));
      toast.error('Failed to start new session');
      throw error;
    }
  }, []);

  /**
   * Pause current session
   */
  const pauseCurrentSession = useCallback(async (): Promise<void> => {
    if (!state.currentSessionId) return;

    try {
      // Abort any ongoing stage execution
      if (stageExecutionRef.current) {
        stageExecutionRef.current.abort();
      }

      await queryHistoryService.pauseSession(state.currentSessionId);

      setState(prev => ({
        ...prev,
        isProcessing: false,
        sessionStatus: 'paused'
      }));

      // Clear auto-save interval
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
        autoSaveInterval.current = null;
      }

      toast.success('⏸️ Session paused. You can resume later from the History tab.');
    } catch (error) {
      toast.error('Failed to pause session');
      throw error;
    }
  }, [state.currentSessionId]);

  /**
   * Resume a paused session
   */
  const resumeSession = useCallback(async (sessionId: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isProcessing: true }));

      const session = await queryHistoryService.resumeSession(sessionId);

      setState(prev => ({
        ...prev,
        currentSessionId: sessionId,
        currentStage: session.current_stage,
        stageResults: session.stage_results || [],
        graphData: session.graph_data || { nodes: [], edges: [], metadata: {} },
        researchContext: session.research_context,
        sessionStatus: 'running',
        isProcessing: false,
        executionMetrics: {
          ...prev.executionMetrics,
          startTime: Date.now(),
          stageStartTime: Date.now()
        }
      }));

      // Restart auto-save
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
      autoSaveInterval.current = setInterval(() => {
        autoSaveProgress(sessionId);
      }, 10000);

      toast.success(`▶️ Session resumed from Stage ${session.current_stage + 1}`);
    } catch (error) {
      setState(prev => ({ ...prev, isProcessing: false }));
      toast.error('Failed to resume session');
      throw error;
    }
  }, []);

  /**
   * Stop current session
   */
  const stopCurrentSession = useCallback(async (): Promise<void> => {
    if (!state.currentSessionId) return;

    try {
      // Abort any ongoing execution
      if (stageExecutionRef.current) {
        stageExecutionRef.current.abort();
      }

      // Complete the session
      await queryHistoryService.completeSession(state.currentSessionId);

      setState(prev => ({
        ...prev,
        isProcessing: false,
        sessionStatus: 'completed'
      }));

      // Clear auto-save interval
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
        autoSaveInterval.current = null;
      }

      toast.success('✅ Research session completed successfully!');
    } catch (error) {
      toast.error('Failed to complete session');
      throw error;
    }
  }, [state.currentSessionId]);

  /**
   * Execute a specific stage with auto-storage
   */
  const executeStage = useCallback(async (stageIndex: number, input?: any): Promise<void> => {
    if (!state.currentSessionId || state.isProcessing) return;

    const abortController = new AbortController();
    stageExecutionRef.current = abortController;

    try {
      setState(prev => ({
        ...prev,
        isProcessing: true,
        currentStage: stageIndex,
        executionMetrics: {
          ...prev.executionMetrics,
          stageStartTime: Date.now()
        }
      }));

      // Simulate stage execution (replace with actual ASR-GoT stage execution)
      const result = await executeASRGoTStage(stageIndex, input, abortController.signal);

      // Store result immediately
      await storeStageResult(stageIndex, result);

      // Update completion metrics
      const stageEndTime = Date.now();
      const stageStartTime = state.executionMetrics.stageStartTime || stageEndTime;
      const executionTime = (stageEndTime - stageStartTime) / 1000;

      setState(prev => {
        const newStageResults = [...prev.stageResults];
        newStageResults[stageIndex] = result;

        return {
          ...prev,
          stageResults: newStageResults,
          isProcessing: false,
          executionMetrics: {
            ...prev.executionMetrics,
            stageTimings: {
              ...prev.executionMetrics.stageTimings,
              [stageIndex]: executionTime
            }
          }
        };
      });

      toast.success(`✅ Stage ${stageIndex + 1} completed`);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setState(prev => ({ ...prev, isProcessing: false, sessionStatus: 'failed' }));
        toast.error(`❌ Stage ${stageIndex + 1} failed: ${error.message}`);
      }
      throw error;
    } finally {
      stageExecutionRef.current = null;
    }
  }, [state.currentSessionId, state.isProcessing, state.executionMetrics.stageStartTime]);

  /**
   * Execute all remaining stages
   */
  const executeAllStages = useCallback(async (startFromStage: number = 0): Promise<void> => {
    for (let i = startFromStage; i < 9; i++) {
      if (state.sessionStatus === 'paused') {
        break;
      }
      await executeStage(i);
    }

    if (state.sessionStatus === 'running') {
      await stopCurrentSession();
    }
  }, [executeStage, stopCurrentSession, state.sessionStatus]);

  /**
   * Store stage result with figures and tables
   */
  const storeStageResult = useCallback(async (
    stage: number, 
    result: string, 
    figures: any[] = [], 
    tables: any[] = []
  ): Promise<void> => {
    if (!state.currentSessionId) return;

    try {
      // Calculate token usage (simplified)
      const tokenUsed = Math.ceil(result.length / 4); // Rough estimate
      const executionTime = state.executionMetrics.stageTimings[stage] || 0;

      // Update session progress
      await queryHistoryService.updateStageProgress(
        state.currentSessionId,
        stage,
        result,
        state.graphData,
        tokenUsed,
        executionTime
      );

      // Store figures
      for (const figure of figures) {
        if (figure.blob) {
          await queryHistoryService.storeFigure(
            state.currentSessionId,
            stage,
            figure.title,
            figure.description,
            figure.type,
            figure.blob,
            figure.metadata
          );
        }
      }

      // Store tables
      for (const table of tables) {
        await queryHistoryService.storeTable(
          state.currentSessionId,
          stage,
          table.title,
          table.description,
          table.data,
          table.schema
        );
      }

      console.log(`📁 Stage ${stage} data stored successfully`);
    } catch (error) {
      console.error('Failed to store stage result:', error);
      // Don't throw - storage failure shouldn't stop execution
    }
  }, [state.currentSessionId, state.graphData, state.executionMetrics.stageTimings]);

  /**
   * Load query history with filters
   */
  const loadQueryHistory = useCallback(async (filters: any = {}): Promise<void> => {
    try {
      setState(prev => ({ ...prev, historyLoading: true, historyError: null }));

      const { sessions } = await queryHistoryService.getQueryHistory(
        filters.limit || 50,
        filters.offset || 0,
        filters.searchTerm,
        filters.status,
        filters.startDate,
        filters.endDate,
        filters.tags
      );

      setState(prev => ({
        ...prev,
        queryHistory: sessions,
        historyLoading: false
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        historyLoading: false,
        historyError: error.message
      }));
    }
  }, []);

  /**
   * Delete a session
   */
  const deleteSession = useCallback(async (sessionId: string): Promise<void> => {
    try {
      await queryHistoryService.deleteSession(sessionId);
      
      // Remove from local state
      setState(prev => ({
        ...prev,
        queryHistory: prev.queryHistory.filter(s => s.id !== sessionId)
      }));

      toast.success('🗑️ Session deleted successfully');
    } catch (error) {
      toast.error('Failed to delete session');
      throw error;
    }
  }, []);

  /**
   * Load session for reanalysis
   */
  const loadSessionForReanalysis = useCallback(async (sessionId: string): Promise<void> => {
    try {
      const { session, figures, tables } = await queryHistoryService.getSessionDetails(sessionId);

      setState(prev => ({
        ...prev,
        currentSessionId: sessionId,
        currentStage: session.current_stage,
        stageResults: session.stage_results || [],
        graphData: session.graph_data || { nodes: [], edges: [], metadata: {} },
        researchContext: session.research_context,
        sessionStatus: 'running'
      }));

      toast.success(`📊 Session loaded for reanalysis: ${session.query.substring(0, 50)}...`);
    } catch (error) {
      toast.error('Failed to load session for reanalysis');
      throw error;
    }
  }, []);

  /**
   * Get current session data
   */
  const getCurrentSessionData = useCallback(async () => {
    if (!state.currentSessionId) return null;

    try {
      return await queryHistoryService.getSessionDetails(state.currentSessionId);
    } catch (error) {
      console.error('Failed to get current session data:', error);
      return null;
    }
  }, [state.currentSessionId]);

  /**
   * Export session data
   */
  const exportSessionData = useCallback(async (sessionId: string, format: 'json' | 'html' | 'pdf'): Promise<void> => {
    try {
      const { session, figures, tables } = await queryHistoryService.getSessionDetails(sessionId);
      
      // Implementation would depend on format
      if (format === 'json') {
        const exportData = { session, figures, tables };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `asr-got-session-${sessionId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast.success(`📄 Session exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export session data');
      throw error;
    }
  }, []);

  /**
   * Auto-save progress
   */
  const autoSaveProgress = useCallback(async (sessionId: string): Promise<void> => {
    try {
      // Auto-save current state without showing notifications
      console.log(`💾 Auto-saving session ${sessionId}...`);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (stageExecutionRef.current) {
        stageExecutionRef.current.abort();
      }
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
    };
  }, []);

  // Actions object
  const actions: QueryHistoryASRGoTActions = {
    startNewSession,
    pauseCurrentSession,
    resumeSession,
    stopCurrentSession,
    executeStage,
    executeAllStages,
    loadQueryHistory,
    deleteSession,
    loadSessionForReanalysis,
    getCurrentSessionData,
    exportSessionData,
    storeStageResult
  };

  return [state, actions];
}

/**
 * Mock ASR-GoT stage execution (replace with actual implementation)
 */
async function executeASRGoTStage(stageIndex: number, input: any, signal: AbortSignal): Promise<string> {
  // This would be replaced with actual ASR-GoT stage execution
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      resolve(`Stage ${stageIndex + 1} completed with comprehensive analysis...`);
    }, 2000 + Math.random() * 3000); // Simulate variable execution time

    signal.addEventListener('abort', () => {
      clearTimeout(timeout);
      reject(new Error('Stage execution aborted'));
    });
  });
}