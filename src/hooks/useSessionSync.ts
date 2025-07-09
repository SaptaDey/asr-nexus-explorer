/**
 * React Hook for Session Synchronization
 * Provides real-time session state management with conflict resolution
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  SessionSyncService, 
  SessionState, 
  StateUpdate, 
  SyncConflict, 
  SyncOptions 
} from '@/services/sync/SessionSyncService';
import { GraphData } from '@/types/asrGotTypes';

interface UseSessionSyncParams {
  sessionId: string;
  options?: Partial<SyncOptions>;
  enabled?: boolean;
}

interface UseSessionSyncReturn {
  // State
  sessionState: SessionState | null;
  isConnected: boolean;
  isSyncing: boolean;
  hasConflicts: boolean;
  conflicts: SyncConflict[];
  error: string | null;
  lastUpdate: string | null;

  // Actions
  updateSession: (updates: Partial<SessionState>, immediate?: boolean) => Promise<void>;
  updateGraph: (graphData: GraphData, immediate?: boolean) => Promise<void>;
  updateStageProgress: (stage: number, progress: number, results?: any) => Promise<void>;
  resolveConflict: (conflictId: string, resolution: 'accept_local' | 'accept_remote' | 'merge' | 'manual', mergedData?: any) => Promise<void>;
  forceSync: () => Promise<void>;
  
  // State getters
  getCurrentStage: () => number;
  getStageProgress: () => number;
  getStageResults: (stage?: number) => any;
  getActiveUsers: () => string[];
  getGraphData: () => GraphData | null;
  
  // Utilities
  clearError: () => void;
  disconnect: () => Promise<void>;
}

export function useSessionSync({
  sessionId,
  options = {},
  enabled = true
}: UseSessionSyncParams): UseSessionSyncReturn {
  // State
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  // Refs
  const syncService = useRef(new SessionSyncService());
  const isInitialized = useRef(false);

  // Computed state
  const hasConflicts = conflicts.length > 0;

  /**
   * Initialize synchronization
   */
  const initializeSync = useCallback(async () => {
    if (!enabled || isInitialized.current) return;

    try {
      setIsSyncing(true);
      setError(null);

      const initialState = await syncService.current.startSync(sessionId, options, {
        onStateUpdate: (sessionId, update) => {
          setLastUpdate(update.timestamp);
          
          // Update local state based on update type
          setSessionState(prev => {
            if (!prev) return null;
            
            switch (update.type) {
              case 'session_update':
                return { ...prev, ...update.data };
              case 'graph_update':
                return { ...prev, graphData: update.data };
              case 'stage_progress':
                return { 
                  ...prev, 
                  currentStage: update.data.stage,
                  stageProgress: update.data.progress,
                  stageResults: update.data.results ? {
                    ...prev.stageResults,
                    [`stage_${update.data.stage}`]: update.data.results
                  } : prev.stageResults
                };
              default:
                return prev;
            }
          });
        },
        
        onConflict: (sessionId, conflict) => {
          setConflicts(prev => [...prev, conflict]);
        },
        
        onSyncError: (sessionId, error) => {
          setError(error.message);
          setIsSyncing(false);
        },
        
        onConnectionChange: (sessionId, connected) => {
          setIsConnected(connected);
        }
      });

      setSessionState(initialState);
      setIsConnected(true);
      isInitialized.current = true;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize sync');
    } finally {
      setIsSyncing(false);
    }
  }, [sessionId, enabled, options]);

  /**
   * Update session state
   */
  const updateSession = useCallback(async (
    updates: Partial<SessionState>, 
    immediate: boolean = false
  ) => {
    try {
      setError(null);
      await syncService.current.updateSessionState(sessionId, updates, immediate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update session');
    }
  }, [sessionId]);

  /**
   * Update graph data
   */
  const updateGraph = useCallback(async (
    graphData: GraphData, 
    immediate: boolean = false
  ) => {
    try {
      setError(null);
      await syncService.current.updateGraphData(sessionId, graphData, immediate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update graph');
    }
  }, [sessionId]);

  /**
   * Update stage progress
   */
  const updateStageProgress = useCallback(async (
    stage: number, 
    progress: number, 
    results?: any
  ) => {
    try {
      setError(null);
      await syncService.current.updateStageProgress(sessionId, stage, progress, results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stage progress');
    }
  }, [sessionId]);

  /**
   * Resolve conflict
   */
  const resolveConflict = useCallback(async (
    conflictId: string,
    resolution: 'accept_local' | 'accept_remote' | 'merge' | 'manual',
    mergedData?: any
  ) => {
    try {
      setError(null);
      await syncService.current.resolveConflict(sessionId, conflictId, resolution, mergedData);
      
      // Remove resolved conflict from state
      setConflicts(prev => prev.filter(c => c.id !== conflictId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve conflict');
    }
  }, [sessionId]);

  /**
   * Force sync with remote
   */
  const forceSync = useCallback(async () => {
    try {
      setIsSyncing(true);
      setError(null);
      
      await syncService.current.forceSync(sessionId);
      
      // Reload state
      const newState = syncService.current.getSessionState(sessionId);
      if (newState) {
        setSessionState(newState);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to force sync');
    } finally {
      setIsSyncing(false);
    }
  }, [sessionId]);

  /**
   * Get current stage
   */
  const getCurrentStage = useCallback((): number => {
    return sessionState?.currentStage || 1;
  }, [sessionState]);

  /**
   * Get stage progress
   */
  const getStageProgress = useCallback((): number => {
    return sessionState?.stageProgress || 0;
  }, [sessionState]);

  /**
   * Get stage results
   */
  const getStageResults = useCallback((stage?: number): any => {
    if (!sessionState?.stageResults) return null;
    
    if (stage !== undefined) {
      return sessionState.stageResults[`stage_${stage}`] || null;
    }
    
    return sessionState.stageResults;
  }, [sessionState]);

  /**
   * Get active users
   */
  const getActiveUsers = useCallback((): string[] => {
    return sessionState?.activeUsers || [];
  }, [sessionState]);

  /**
   * Get graph data
   */
  const getGraphData = useCallback((): GraphData | null => {
    return sessionState?.graphData || null;
  }, [sessionState]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Disconnect from sync
   */
  const disconnect = useCallback(async () => {
    try {
      await syncService.current.stopSync(sessionId);
      setIsConnected(false);
      isInitialized.current = false;
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  }, [sessionId]);

  /**
   * Load initial conflicts
   */
  const loadConflicts = useCallback(() => {
    const existingConflicts = syncService.current.getConflicts(sessionId);
    setConflicts(existingConflicts);
  }, [sessionId]);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    if (enabled && sessionId) {
      initializeSync();
      loadConflicts();
    }

    return () => {
      if (isInitialized.current) {
        disconnect();
      }
    };
  }, [sessionId, enabled, initializeSync, loadConflicts, disconnect]);

  /**
   * Update conflicts when they change
   */
  useEffect(() => {
    if (isInitialized.current) {
      const timer = setInterval(() => {
        const currentConflicts = syncService.current.getConflicts(sessionId);
        if (currentConflicts.length !== conflicts.length) {
          setConflicts(currentConflicts);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [sessionId, conflicts.length]);

  return {
    // State
    sessionState,
    isConnected,
    isSyncing,
    hasConflicts,
    conflicts,
    error,
    lastUpdate,

    // Actions
    updateSession,
    updateGraph,
    updateStageProgress,
    resolveConflict,
    forceSync,

    // State getters
    getCurrentStage,
    getStageProgress,
    getStageResults,
    getActiveUsers,
    getGraphData,

    // Utilities
    clearError,
    disconnect
  };
}

/**
 * Hook for handling sync conflicts
 */
export function useSyncConflicts(sessionId: string) {
  const { conflicts, resolveConflict, error } = useSessionSync({ sessionId });
  const [selectedConflict, setSelectedConflict] = useState<string | null>(null);
  const [resolutionInProgress, setResolutionInProgress] = useState(false);

  /**
   * Auto-resolve conflicts based on strategy
   */
  const autoResolveConflicts = useCallback(async (
    strategy: 'prefer_local' | 'prefer_remote' | 'prefer_latest'
  ) => {
    setResolutionInProgress(true);
    
    try {
      for (const conflict of conflicts) {
        let resolution: 'accept_local' | 'accept_remote' | 'merge';
        
        switch (strategy) {
          case 'prefer_local':
            resolution = 'accept_local';
            break;
          case 'prefer_remote':
            resolution = 'accept_remote';
            break;
          case 'prefer_latest':
            // Simple strategy: prefer the data with the latest timestamp
            const localTime = new Date(conflict.local_data.lastUpdated || 0).getTime();
            const remoteTime = new Date(conflict.remote_data.lastUpdated || 0).getTime();
            resolution = localTime > remoteTime ? 'accept_local' : 'accept_remote';
            break;
          default:
            resolution = 'accept_local';
        }
        
        await resolveConflict(conflict.id, resolution);
      }
    } catch (err) {
      console.error('Failed to auto-resolve conflicts:', err);
    } finally {
      setResolutionInProgress(false);
    }
  }, [conflicts, resolveConflict]);

  /**
   * Select conflict for manual resolution
   */
  const selectConflict = useCallback((conflictId: string | null) => {
    setSelectedConflict(conflictId);
  }, []);

  /**
   * Get selected conflict details
   */
  const getSelectedConflict = useCallback(() => {
    if (!selectedConflict) return null;
    return conflicts.find(c => c.id === selectedConflict) || null;
  }, [selectedConflict, conflicts]);

  return {
    conflicts,
    selectedConflict,
    resolutionInProgress,
    error,
    autoResolveConflicts,
    selectConflict,
    getSelectedConflict,
    resolveConflict
  };
}

/**
 * Hook for monitoring sync health
 */
export function useSyncHealth(sessionId: string) {
  const { isConnected, lastUpdate, error } = useSessionSync({ sessionId });
  const [health, setHealth] = useState<'healthy' | 'warning' | 'error'>('healthy');
  const [metrics, setMetrics] = useState({
    lastSyncTime: null as string | null,
    syncLatency: 0,
    connectionUptime: 0,
    errorCount: 0
  });

  // Calculate health status
  useEffect(() => {
    if (error) {
      setHealth('error');
    } else if (!isConnected) {
      setHealth('warning');
    } else if (lastUpdate) {
      const timeSinceLastUpdate = Date.now() - new Date(lastUpdate).getTime();
      if (timeSinceLastUpdate > 60000) { // More than 1 minute
        setHealth('warning');
      } else {
        setHealth('healthy');
      }
    }
  }, [isConnected, lastUpdate, error]);

  // Update metrics
  useEffect(() => {
    setMetrics(prev => ({
      ...prev,
      lastSyncTime: lastUpdate,
      syncLatency: lastUpdate ? Date.now() - new Date(lastUpdate).getTime() : 0,
      errorCount: error ? prev.errorCount + 1 : prev.errorCount
    }));
  }, [lastUpdate, error]);

  return {
    health,
    metrics,
    isConnected,
    lastUpdate,
    error
  };
}