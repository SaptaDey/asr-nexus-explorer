// Core ASR-GoT State Management
import { useState, useCallback, useEffect } from 'react';
import { GraphData, ASRGoTParameters, ResearchContext } from '@/types/asrGotTypes';
import { completeASRGoTParameters } from '@/config/asrGotParameters';
import { createInitialGraphData, createInitialResearchContext } from '@/utils/asrGotUtils';
import { eventBroadcaster } from '@/services/EventBroadcaster';
import { useWebSocket } from '@/services/WebSocketService';
import { useSessionPersistence } from '@/services/SessionPersistence';
import { useAutoStorage } from './useAutoStorage';
import { queryHistoryIntegration } from '@/services/QueryHistoryIntegrationService';
import { memoryManager, useMemoryManager } from '@/services/memory/MemoryManager';
import { toast } from "sonner";

export const useASRGoTState = () => {
  const [currentStage, setCurrentStage] = useState(0);
  const [graphData, setGraphData] = useState<GraphData>(createInitialGraphData);
  const [parameters, setParameters] = useState<ASRGoTParameters>(completeASRGoTParameters);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stageResults, setStageResults] = useState<string[]>([]);
  const [researchContext, setResearchContext] = useState<ResearchContext>(createInitialResearchContext);
  const [finalReport, setFinalReport] = useState<string>('');
  const [previousGraphData, setPreviousGraphData] = useState<GraphData>(createInitialGraphData);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [queryHistorySessionId, setQueryHistorySessionId] = useState<string | null>(null);
  const [isRestored, setIsRestored] = useState(false);

  // WebSocket and persistence services
  const webSocket = useWebSocket();
  const persistence = useSessionPersistence();
  
  // Memory management
  const memoryUtils = useMemoryManager();

  // Auto-storage for Query History system
  const autoStorage = useAutoStorage(
    queryHistorySessionId,
    currentStage,
    stageResults,
    graphData,
    researchContext,
    {
      enabled: true,
      saveInterval: 10000, // 10 seconds
      saveOnStageComplete: true,
      includeProgressIndicators: true
    }
  );

  // Initialize WebSocket connection and restore session
  useEffect(() => {
    setIsConnected(webSocket.isConnected());
    
    // Restore session state on initial load
    const restoreSession = async () => {
      if (isRestored) return;
      
      try {
        // Check for last active session in localStorage
        const lastSessionId = localStorage.getItem('asr-got-last-session');
        if (lastSessionId) {
          console.log('Restoring session:', lastSessionId);
          
          const restored = await loadSession(lastSessionId);
          if (restored) {
            toast.success('✅ Session restored from previous browser session');
          }
        }
        
        // Check for browser session storage
        const sessionData = sessionStorage.getItem('asr-got-current-session');
        if (sessionData && !lastSessionId) {
          try {
            const data = JSON.parse(sessionData);
            if (data.sessionId && data.timestamp) {
              // Only restore if session is less than 24 hours old
              const now = Date.now();
              const sessionTime = new Date(data.timestamp).getTime();
              const hoursSinceSession = (now - sessionTime) / (1000 * 60 * 60);
              
              if (hoursSinceSession < 24) {
                const restored = await loadSession(data.sessionId);
                if (restored) {
                  toast.success('✅ Session restored from browser session');
                }
              } else {
                sessionStorage.removeItem('asr-got-current-session');
              }
            }
          } catch (error) {
            console.warn('Failed to parse session storage data:', error);
            sessionStorage.removeItem('asr-got-current-session');
          }
        }
      } catch (error) {
        console.warn('Session restoration failed:', error);
      } finally {
        setIsRestored(true);
      }
    };
    
    restoreSession();
    
    // Subscribe to WebSocket events
    const unsubscribeGraphUpdate = webSocket.on('graph-updated', (data) => {
      console.log('Received graph update:', data);
      // Handle real-time graph updates from other clients
    });
    
    const unsubscribeStageTransition = webSocket.on('stage-transitioned', (data) => {
      console.log('Received stage transition:', data);
      if (data.success) {
        setCurrentStage(data.toStage);
        toast.info(`Stage advanced to ${data.toStage + 1}/9`);
      }
    });
    
    return () => {
      unsubscribeGraphUpdate();
      unsubscribeStageTransition();
    };
  }, [webSocket, isRestored]);

  // Broadcast graph updates when graph data changes
  useEffect(() => {
    if (graphData.nodes.length > 0 || graphData.edges.length > 0) {
      const changes = {
        nodesAdded: Math.max(0, graphData.nodes.length - previousGraphData.nodes.length),
        edgesAdded: Math.max(0, graphData.edges.length - previousGraphData.edges.length),
        nodesModified: 0, // Could be calculated by comparing node content
        edgesModified: 0   // Could be calculated by comparing edge content
      };

      // Broadcast locally
      eventBroadcaster.broadcastGraphUpdate(
        currentStage,
        graphData.nodes.length,
        graphData.edges.length,
        changes
      );

      // Broadcast via WebSocket if connected and session exists
      if (currentSessionId && webSocket.isConnected()) {
        webSocket.emitGraphUpdate(currentSessionId, 'graph-data-update', {
          graphData,
          changes,
          timestamp: new Date().toISOString()
        });
      }

      // Auto-save to backend
      if (currentSessionId) {
        persistence.autoSave(currentSessionId, { 
          graphData, 
          currentStage,
          stageResults,
          researchContext 
        });
      }

      setPreviousGraphData(graphData);
    }
  }, [graphData, currentStage, previousGraphData, currentSessionId, webSocket, persistence]);

  // Memory-aware session state persistence
  useEffect(() => {
    if (currentSessionId && isRestored) {
      const sessionState = {
        sessionId: currentSessionId,
        currentStage,
        stageResults,
        researchContext,
        graphData,
        metadata: {
          created: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          size: 0,
          compressed: false
        },
        timestamp: new Date().toISOString(),
        lastSaved: Date.now()
      };

      // Check memory pressure before saving
      const memoryStatus = memoryUtils.getStatus();
      
      if (memoryStatus.pressure === 'critical') {
        // Emergency: save only essential data
        const essentialState = {
          sessionId: currentSessionId,
          currentStage,
          stageResults: stageResults.slice(-3), // Keep only last 3 results
          researchContext: {
            topic: researchContext.topic,
            field: researchContext.field
          },
          graphData: {
            nodes: graphData.nodes.slice(0, 100), // Limit nodes
            edges: graphData.edges.slice(0, 200) // Limit edges
          },
          timestamp: new Date().toISOString()
        };
        
        try {
          sessionStorage.setItem('asr-got-current-session', JSON.stringify(essentialState));
          toast.warning('⚠️ Critical memory usage - saved essential data only');
        } catch (error) {
          toast.error('Failed to save session - storage full');
        }
        return;
      }

      // Optimize data before saving if memory pressure is high
      let dataToSave = sessionState;
      if (memoryStatus.pressure === 'high' || memoryStatus.pressure === 'medium') {
        // Optimize large data structures
        if (graphData.nodes.length > 500) {
          dataToSave.graphData = {
            ...graphData,
            nodes: graphData.nodes.slice(0, 500),
            edges: graphData.edges.slice(0, 1000)
          };
          toast.info('📊 Large graph data optimized for memory efficiency');
        }
        
        // Compress long stage results
        if (stageResults.some(result => result && result.length > 10000)) {
          dataToSave.stageResults = stageResults.map(result => 
            result && result.length > 10000 ? result.substring(0, 10000) + '...[truncated]' : result
          );
          toast.info('📝 Long stage results compressed to save memory');
        }
      }

      // Update session storage with current state
      try {
        sessionStorage.setItem('asr-got-current-session', JSON.stringify(dataToSave));
        
        // Debounced localStorage update to avoid too many writes
        const timeoutId = setTimeout(() => {
          try {
            localStorage.setItem('asr-got-session-state', JSON.stringify(dataToSave));
          } catch (error) {
            console.warn('Failed to save to localStorage:', error);
            // Try to optimize and save again
            memoryUtils.optimize().then(() => {
              try {
                localStorage.setItem('asr-got-session-state', JSON.stringify(dataToSave));
              } catch (retryError) {
                toast.error('Storage full - please clear browser data');
              }
            });
          }
        }, 1000);

        return () => clearTimeout(timeoutId);
      } catch (error) {
        console.error('Failed to save session state:', error);
        toast.error('Failed to save session state - storage may be full');
      }
    }
  }, [currentSessionId, currentStage, stageResults, researchContext, graphData, isRestored, memoryUtils]);

  // Handle browser close/refresh to save state
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (currentSessionId && (currentStage > 0 || stageResults.length > 0)) {
        // Save final state before page unload
        const finalState = {
          sessionId: currentSessionId,
          currentStage,
          stageResults,
          researchContext,
          graphData,
          timestamp: new Date().toISOString(),
          lastSaved: Date.now(),
          unloadSave: true
        };

        sessionStorage.setItem('asr-got-current-session', JSON.stringify(finalState));
        localStorage.setItem('asr-got-session-state', JSON.stringify(finalState));
        
        // Show confirmation if research is in progress
        if (isProcessing || (currentStage > 0 && currentStage < 8)) {
          event.preventDefault();
          event.returnValue = 'You have research in progress. Are you sure you want to leave?';
          return event.returnValue;
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentSessionId, currentStage, stageResults, researchContext, graphData, isProcessing]);

  // Create new session
  const createSession = useCallback(async (topic: string, field: string) => {
    try {
      const { sessionId } = await persistence.createSession({ topic, field });
      setCurrentSessionId(sessionId);
      
      // Create Query History session
      const query = `${topic} - ${field}`;
      const context = { topic, field };
      const historySessionId = await autoStorage.createNewSession(query, context);
      setQueryHistorySessionId(historySessionId);
      
      // Initialize Query History integration
      if (historySessionId) {
        await queryHistoryIntegration.initializeSession(query, context);
      }
      
      if (webSocket.isConnected()) {
        webSocket.joinSession(sessionId);
      }
      
      // Persist session for recovery across browser refreshes
      localStorage.setItem('asr-got-last-session', sessionId);
      sessionStorage.setItem('asr-got-current-session', JSON.stringify({
        sessionId,
        timestamp: new Date().toISOString(),
        topic,
        field
      }));
      
      setResearchContext({ topic, field });
      toast.success('🚀 Research session created with auto-storage enabled');
      return sessionId;
    } catch (error) {
      toast.error('Failed to create session');
      console.error('Session creation failed:', error);
      return null;
    }
  }, [persistence, webSocket, autoStorage]);

  // Load existing session
  const loadSession = useCallback(async (sessionId: string) => {
    try {
      const { session } = await persistence.loadSession(sessionId);
      
      setCurrentSessionId(sessionId);
      setCurrentStage(session.currentStage);
      setGraphData(session.graphData as GraphData);
      setParameters(session.parameters as ASRGoTParameters);
      setStageResults(session.stageResults as string[]);
      setResearchContext(session.researchContext as ResearchContext);
      
      if (webSocket.isConnected()) {
        webSocket.joinSession(sessionId);
      }
      
      // Update session persistence markers
      localStorage.setItem('asr-got-last-session', sessionId);
      sessionStorage.setItem('asr-got-current-session', JSON.stringify({
        sessionId,
        timestamp: new Date().toISOString(),
        topic: session.researchContext?.topic || '',
        field: session.researchContext?.field || ''
      }));
      
      toast.success('Session loaded successfully');
      return session;
    } catch (error) {
      toast.error('Failed to load session');
      console.error('Session loading failed:', error);
      return null;
    }
  }, [persistence, webSocket]);

  // Manual stage advancement
  const advanceStage = useCallback(() => {
    if (currentStage < 8) {
      const newStage = currentStage + 1;
      
      // Broadcast locally
      eventBroadcaster.broadcastStageTransition(currentStage, newStage, true);
      
      // Broadcast via WebSocket
      if (currentSessionId && webSocket.isConnected()) {
        webSocket.emitStageTransition(currentSessionId, currentStage, newStage, true);
      }
      
      setCurrentStage(newStage);
    }
  }, [currentStage, currentSessionId, webSocket]);

  const resetFramework = useCallback(() => {
    setCurrentStage(0);
    setGraphData(createInitialGraphData());
    setStageResults([]);
    setResearchContext(createInitialResearchContext());
    setFinalReport('');
    
    // Clear session
    if (currentSessionId) {
      webSocket.leaveSession();
      setCurrentSessionId(null);
      persistence.clearAutoSave();
    }

    // Clear Query History session
    if (queryHistorySessionId) {
      setQueryHistorySessionId(null);
    }
    
    // Clear persistence markers
    localStorage.removeItem('asr-got-last-session');
    sessionStorage.removeItem('asr-got-current-session');
    
    toast.info('ASR-GoT Framework reset. Ready for new research.');
  }, [currentSessionId, queryHistorySessionId, webSocket, persistence]);

  const updateStageResults = useCallback(async (stageIndex: number, result: string, metadata?: { executionTime?: number; tokenUsage?: number; apiCalls?: { gemini?: number; perplexity?: number } }) => {
    // Check memory before adding large results
    const memoryStatus = memoryUtils.getStatus();
    let processedResult = result;
    
    // Optimize result if memory pressure is high
    if (memoryStatus.pressure === 'high' || memoryStatus.pressure === 'critical') {
      if (result && result.length > 5000) {
        processedResult = result.substring(0, 5000) + '\n\n[Result truncated due to memory constraints]';
        toast.warning(`Stage ${stageIndex + 1} result truncated to manage memory usage`);
      }
    }
    
    setStageResults(prev => {
      const newResults = [...prev];
      newResults[stageIndex] = processedResult;
      
      // If we have too many results, optimize older ones
      if (newResults.length > 9 && memoryStatus.pressure !== 'low') {
        for (let i = 0; i < newResults.length - 3; i++) {
          if (newResults[i] && newResults[i].length > 2000) {
            newResults[i] = newResults[i].substring(0, 2000) + '\n[Compressed to save memory]';
          }
        }
      }
      
      return newResults;
    });

    // Track stage completion in Query History
    if (queryHistorySessionId && processedResult && processedResult.trim()) {
      await queryHistoryIntegration.trackStageCompletion(
        stageIndex,
        processedResult,
        graphData,
        metadata
      );
      console.log(`✅ Stage ${stageIndex + 1} tracked in Query History`);
    }
  }, [queryHistorySessionId, graphData, memoryUtils]);

  // Calculate progress based on completed stages (stages with results)
  const completedStages = stageResults.filter(result => result && result.trim().length > 0).length;
  const stageProgress = (completedStages / 9) * 100;

  // Pause and resume functionality
  const pauseSession = useCallback(async () => {
    if (queryHistorySessionId) {
      await autoStorage.pauseSession();
      await queryHistoryIntegration.pauseCurrentSession();
    }
  }, [queryHistorySessionId, autoStorage]);

  const resumeFromHistory = useCallback(async (historySessionId: string) => {
    try {
      const { session, shouldContinueFromStage } = await queryHistoryIntegration.resumeSession(historySessionId);
      
      // Restore state from Query History session
      setQueryHistorySessionId(historySessionId);
      setCurrentStage(shouldContinueFromStage);
      setResearchContext(session.research_context);
      setStageResults(session.stage_results || []);
      
      if (session.graph_data) {
        setGraphData(session.graph_data);
      }
      
      toast.success(`✅ Session resumed from Stage ${shouldContinueFromStage + 1}`);
      return true;
    } catch (error) {
      toast.error('Failed to resume session');
      console.error('Resume failed:', error);
      return false;
    }
  }, []);

  // Complete session
  const completeSession = useCallback(async () => {
    if (queryHistorySessionId) {
      await autoStorage.completeSession();
      await queryHistoryIntegration.completeCurrentSession();
    }
  }, [queryHistorySessionId, autoStorage]);

  return {
    // State
    currentStage,
    graphData,
    parameters,
    isProcessing,
    stageResults,
    researchContext,
    finalReport,
    stageProgress,
    isRestored,
    
    // Setters
    setCurrentStage,
    setGraphData,
    setParameters,
    setIsProcessing,
    setStageResults,
    setResearchContext,
    setFinalReport,
    
    // Actions
    advanceStage,
    resetFramework,
    updateStageResults,
    
    // Session management
    createSession,
    loadSession,
    currentSessionId,
    queryHistorySessionId,
    
    // Query History functionality
    pauseSession,
    resumeFromHistory,
    completeSession,
    
    // Auto-storage methods
    forceSave: autoStorage.forceSave,
    queueFigureForSaving: autoStorage.queueFigureForSaving,
    queueTableForSaving: autoStorage.queueTableForSaving,
    
    // Connection status
    isConnected,
    
    // Computed
    isComplete: currentStage >= 8,
    hasResults: stageResults.length > 0,
    canExportHtml: finalReport.length > 0,
    isAutoSaveEnabled: autoStorage.isAutoSaveEnabled,
    lastSaveTime: autoStorage.lastSaveTime,
    
    // Session persistence
    hasActiveSession: currentSessionId !== null,
    isSessionRestored: isRestored && currentSessionId !== null,
    
    // Memory management
    memoryMetrics: memoryUtils.getMetrics(),
    memoryStatus: memoryUtils.getStatus(),
    optimizeMemory: memoryUtils.optimize,
    updateMemoryMetrics: memoryUtils.updateMetrics
  };
};