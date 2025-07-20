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

  // WebSocket and persistence services
  const webSocket = useWebSocket();
  const persistence = useSessionPersistence();

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

  // Initialize WebSocket connection
  useEffect(() => {
    setIsConnected(webSocket.isConnected());
    
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
  }, [webSocket]);

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
    
    toast.info('ASR-GoT Framework reset. Ready for new research.');
  }, [currentSessionId, queryHistorySessionId, webSocket, persistence]);

  const updateStageResults = useCallback(async (stageIndex: number, result: string, metadata?: { executionTime?: number; tokenUsage?: number; apiCalls?: { gemini?: number; perplexity?: number } }) => {
    setStageResults(prev => {
      const newResults = [...prev];
      newResults[stageIndex] = result;
      return newResults;
    });

    // Track stage completion in Query History
    if (queryHistorySessionId && result && result.trim()) {
      await queryHistoryIntegration.trackStageCompletion(
        stageIndex,
        result,
        graphData,
        metadata
      );
      console.log(`✅ Stage ${stageIndex + 1} tracked in Query History`);
    }
  }, [queryHistorySessionId, graphData]);

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
    lastSaveTime: autoStorage.lastSaveTime
  };
};