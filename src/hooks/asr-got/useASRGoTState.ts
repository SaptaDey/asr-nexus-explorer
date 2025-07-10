// Core ASR-GoT State Management
import { useState, useCallback, useEffect } from 'react';
import { GraphData, ASRGoTParameters, ResearchContext } from '@/types/asrGotTypes';
import { completeASRGoTParameters } from '@/config/asrGotParameters';
import { createInitialGraphData, createInitialResearchContext } from '@/utils/asrGotUtils';
import { eventBroadcaster } from '@/services/EventBroadcaster';
import { useWebSocket } from '@/services/WebSocketService';
import { useSessionPersistence } from '@/services/SessionPersistence';
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

  // WebSocket and persistence services
  const webSocket = useWebSocket();
  const persistence = useSessionPersistence();

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
      
      if (webSocket.isConnected()) {
        webSocket.joinSession(sessionId);
      }
      
      setResearchContext({ topic, field });
      toast.success('New research session created');
      return sessionId;
    } catch (error) {
      toast.error('Failed to create session');
      console.error('Session creation failed:', error);
      return null;
    }
  }, [persistence, webSocket]);

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
    
    toast.info('ASR-GoT Framework reset. Ready for new research.');
  }, [currentSessionId, webSocket, persistence]);

  const updateStageResults = useCallback((stageIndex: number, result: string) => {
    setStageResults(prev => {
      const newResults = [...prev];
      newResults[stageIndex] = result;
      return newResults;
    });
  }, []);

  const stageProgress = (currentStage / 9) * 100;

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
    
    // Connection status
    isConnected,
    
    // Computed
    isComplete: currentStage >= 8,
    hasResults: stageResults.length > 0,
    canExportHtml: finalReport.length > 0
  };
};