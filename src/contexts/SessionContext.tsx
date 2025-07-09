/**
 * Session Context Provider
 * Manages ASR-GoT research sessions with database integration
 */

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useDatabase } from './DatabaseContext';
import { GraphData } from '@/types/asrGotTypes';
import { HypothesisCompetitionFramework } from '@/services/reasoning/HypothesisCompetitionFramework';
import { KnowledgeGapDetector } from '@/services/analysis/KnowledgeGapDetector';
import { FalsifiabilityValidator } from '@/services/validation/FalsifiabilityValidator';
import { HierarchicalAbstractionEngine } from '@/services/abstraction/HierarchicalAbstractionEngine';

interface SessionContextType {
  // Session state
  currentSession: any | null;
  sessionId: string | null;
  isSessionLoading: boolean;
  sessionError: string | null;
  
  // Graph state
  graphData: GraphData | null;
  isGraphLoading: boolean;
  graphError: string | null;
  
  // Stage execution state
  stageExecutions: any[];
  currentStage: string | null;
  isStageExecuting: boolean;
  stageError: string | null;
  
  // Hypothesis state
  hypotheses: any[];
  activeHypotheses: any[];
  hypothesisCompetition: HypothesisCompetitionFramework | null;
  
  // Knowledge gaps
  knowledgeGaps: any[];
  gapDetector: KnowledgeGapDetector | null;
  
  // Validation state
  falsifiabilityResults: any[];
  validator: FalsifiabilityValidator | null;
  
  // Abstraction state
  abstractionLevels: any[];
  abstractionEngine: HierarchicalAbstractionEngine | null;
  
  // Collaboration state
  collaborators: any[];
  activeUsers: any[];
  
  // Actions
  createSession: (title: string, description: string, config?: any) => Promise<string>;
  loadSession: (sessionId: string) => Promise<void>;
  updateSession: (updates: any) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  
  // Graph actions
  updateGraph: (graphData: GraphData) => Promise<void>;
  addNode: (node: any) => Promise<void>;
  updateNode: (nodeId: string, updates: any) => Promise<void>;
  deleteNode: (nodeId: string) => Promise<void>;
  addEdge: (edge: any) => Promise<void>;
  updateEdge: (edgeId: string, updates: any) => Promise<void>;
  deleteEdge: (edgeId: string) => Promise<void>;
  
  // Stage actions
  executeStage: (stageId: string, parameters: any) => Promise<any>;
  getStageHistory: (stageId: string) => Promise<any[]>;
  
  // Hypothesis actions
  addHypothesis: (hypothesis: any) => Promise<void>;
  updateHypothesis: (hypothesisId: string, updates: any) => Promise<void>;
  deleteHypothesis: (hypothesisId: string) => Promise<void>;
  runHypothesisCompetition: () => Promise<any>;
  
  // Knowledge gap actions
  detectKnowledgeGaps: () => Promise<any[]>;
  updateKnowledgeGap: (gapId: string, updates: any) => Promise<void>;
  
  // Validation actions
  validateHypothesis: (hypothesisId: string) => Promise<any>;
  validateAll: () => Promise<any[]>;
  
  // Abstraction actions
  buildAbstractionHierarchy: () => Promise<any>;
  updateAbstractionLevel: (levelId: string, updates: any) => Promise<void>;
  
  // Collaboration actions
  inviteCollaborator: (email: string, role: string) => Promise<void>;
  updateCollaboratorRole: (collaboratorId: string, role: string) => Promise<void>;
  removeCollaborator: (collaboratorId: string) => Promise<void>;
  
  // Utilities
  clearErrors: () => void;
  refreshSession: () => Promise<void>;
  subscribeToSession: (sessionId: string) => () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const { db, collaboration, performance, isReady } = useDatabase();
  
  // Session state
  const [currentSession, setCurrentSession] = useState<any | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  
  // Graph state
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isGraphLoading, setIsGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState<string | null>(null);
  
  // Stage execution state
  const [stageExecutions, setStageExecutions] = useState<any[]>([]);
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [isStageExecuting, setIsStageExecuting] = useState(false);
  const [stageError, setStageError] = useState<string | null>(null);
  
  // Hypothesis state
  const [hypotheses, setHypotheses] = useState<any[]>([]);
  const [activeHypotheses, setActiveHypotheses] = useState<any[]>([]);
  const [hypothesisCompetition, setHypothesisCompetition] = useState<HypothesisCompetitionFramework | null>(null);
  
  // Knowledge gaps
  const [knowledgeGaps, setKnowledgeGaps] = useState<any[]>([]);
  const [gapDetector, setGapDetector] = useState<KnowledgeGapDetector | null>(null);
  
  // Validation state
  const [falsifiabilityResults, setFalsifiabilityResults] = useState<any[]>([]);
  const [validator, setValidator] = useState<FalsifiabilityValidator | null>(null);
  
  // Abstraction state
  const [abstractionLevels, setAbstractionLevels] = useState<any[]>([]);
  const [abstractionEngine, setAbstractionEngine] = useState<HierarchicalAbstractionEngine | null>(null);
  
  // Collaboration state
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);

  /**
   * Initialize ASR-GoT services for session
   */
  const initializeSessionServices = useCallback(async (sessionId: string) => {
    try {
      // Initialize hypothesis competition framework
      const competitionFramework = new HypothesisCompetitionFramework();
      await competitionFramework.initialize();
      setHypothesisCompetition(competitionFramework);
      
      // Initialize knowledge gap detector
      const gapDetector = new KnowledgeGapDetector();
      await gapDetector.initialize();
      setGapDetector(gapDetector);
      
      // Initialize falsifiability validator
      const validator = new FalsifiabilityValidator();
      await validator.initialize();
      setValidator(validator);
      
      // Initialize abstraction engine
      const abstractionEngine = new HierarchicalAbstractionEngine();
      await abstractionEngine.initialize();
      setAbstractionEngine(abstractionEngine);
      
    } catch (error) {
      console.error('Failed to initialize session services:', error);
      setSessionError('Failed to initialize session services');
    }
  }, []);

  /**
   * Create new research session
   */
  const createSession = useCallback(async (
    title: string, 
    description: string, 
    config?: any
  ): Promise<string> => {
    if (!isReady) throw new Error('Database not ready');
    
    try {
      setIsSessionLoading(true);
      setSessionError(null);
      
      const session = await db.createResearchSession({
        title,
        description,
        config: config || {}
      });
      
      setCurrentSession(session);
      setSessionId(session.id);
      
      // Initialize session services
      await initializeSessionServices(session.id);
      
      return session.id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create session';
      setSessionError(errorMessage);
      throw error;
    } finally {
      setIsSessionLoading(false);
    }
  }, [db, isReady, initializeSessionServices]);

  /**
   * Load existing research session
   */
  const loadSession = useCallback(async (sessionId: string): Promise<void> => {
    if (!isReady) throw new Error('Database not ready');
    
    try {
      setIsSessionLoading(true);
      setSessionError(null);
      
      // Use performance-optimized session loading
      const sessionData = await performance.getOptimizedSessionData(sessionId);
      
      setCurrentSession(sessionData.session);
      setSessionId(sessionId);
      setGraphData(sessionData.graphData);
      setStageExecutions(sessionData.stageExecutions || []);
      setHypotheses(sessionData.hypotheses || []);
      setKnowledgeGaps(sessionData.knowledgeGaps || []);
      
      // Initialize session services
      await initializeSessionServices(sessionId);
      
      // Load collaborators
      const collaboratorData = await collaboration.getSessionCollaborators(sessionId);
      setCollaborators(collaboratorData);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load session';
      setSessionError(errorMessage);
      throw error;
    } finally {
      setIsSessionLoading(false);
    }
  }, [db, performance, collaboration, isReady, initializeSessionServices]);

  /**
   * Update session
   */
  const updateSession = useCallback(async (updates: any): Promise<void> => {
    if (!sessionId || !isReady) return;
    
    try {
      const updatedSession = await db.updateResearchSession(sessionId, updates);
      setCurrentSession(updatedSession);
      
      // Invalidate cache for this session
      await performance.invalidateCache({ sessionId });
      
    } catch (error) {
      setSessionError(error instanceof Error ? error.message : 'Failed to update session');
      throw error;
    }
  }, [db, performance, sessionId, isReady]);

  /**
   * Delete session
   */
  const deleteSession = useCallback(async (sessionId: string): Promise<void> => {
    if (!isReady) return;
    
    try {
      await db.deleteResearchSession(sessionId);
      
      // Clear session state if it's the current session
      if (sessionId === sessionId) {
        setCurrentSession(null);
        setSessionId(null);
        setGraphData(null);
        setStageExecutions([]);
        setHypotheses([]);
        setKnowledgeGaps([]);
        setCollaborators([]);
      }
      
      // Invalidate cache
      await performance.invalidateCache({ sessionId });
      
    } catch (error) {
      setSessionError(error instanceof Error ? error.message : 'Failed to delete session');
      throw error;
    }
  }, [db, performance, isReady]);

  /**
   * Update graph data
   */
  const updateGraph = useCallback(async (graphData: GraphData): Promise<void> => {
    if (!sessionId || !isReady) return;
    
    try {
      setIsGraphLoading(true);
      setGraphError(null);
      
      await db.saveGraphData(sessionId, graphData);
      setGraphData(graphData);
      
      // Invalidate graph cache
      await performance.invalidateCache({ 
        sessionId, 
        tags: ['graph'] 
      });
      
    } catch (error) {
      setGraphError(error instanceof Error ? error.message : 'Failed to update graph');
      throw error;
    } finally {
      setIsGraphLoading(false);
    }
  }, [db, performance, sessionId, isReady]);

  /**
   * Add hypothesis
   */
  const addHypothesis = useCallback(async (hypothesis: any): Promise<void> => {
    if (!sessionId || !hypothesisCompetition) return;
    
    try {
      const newHypothesis = await hypothesisCompetition.registerHypothesis(hypothesis);
      setHypotheses(prev => [...prev, newHypothesis]);
      
      // Update active hypotheses
      const active = await hypothesisCompetition.getActiveHypotheses();
      setActiveHypotheses(active);
      
    } catch (error) {
      setSessionError(error instanceof Error ? error.message : 'Failed to add hypothesis');
      throw error;
    }
  }, [hypothesisCompetition, sessionId]);

  /**
   * Run hypothesis competition
   */
  const runHypothesisCompetition = useCallback(async (): Promise<any> => {
    if (!hypothesisCompetition) throw new Error('Hypothesis competition not initialized');
    
    try {
      const results = await hypothesisCompetition.runCompetition();
      
      // Update active hypotheses
      const active = await hypothesisCompetition.getActiveHypotheses();
      setActiveHypotheses(active);
      
      return results;
    } catch (error) {
      setSessionError(error instanceof Error ? error.message : 'Failed to run hypothesis competition');
      throw error;
    }
  }, [hypothesisCompetition]);

  /**
   * Detect knowledge gaps
   */
  const detectKnowledgeGaps = useCallback(async (): Promise<any[]> => {
    if (!gapDetector || !graphData) return [];
    
    try {
      const gaps = await gapDetector.detectKnowledgeGaps(graphData);
      setKnowledgeGaps(gaps);
      return gaps;
    } catch (error) {
      setSessionError(error instanceof Error ? error.message : 'Failed to detect knowledge gaps');
      throw error;
    }
  }, [gapDetector, graphData]);

  /**
   * Validate hypothesis
   */
  const validateHypothesis = useCallback(async (hypothesisId: string): Promise<any> => {
    if (!validator) throw new Error('Validator not initialized');
    
    try {
      const hypothesis = hypotheses.find(h => h.id === hypothesisId);
      if (!hypothesis) throw new Error('Hypothesis not found');
      
      const result = await validator.assessFalsifiability(hypothesis);
      
      // Update results
      setFalsifiabilityResults(prev => [
        ...prev.filter(r => r.hypothesisId !== hypothesisId),
        { hypothesisId, result }
      ]);
      
      return result;
    } catch (error) {
      setSessionError(error instanceof Error ? error.message : 'Failed to validate hypothesis');
      throw error;
    }
  }, [validator, hypotheses]);

  /**
   * Build abstraction hierarchy
   */
  const buildAbstractionHierarchy = useCallback(async (): Promise<any> => {
    if (!abstractionEngine || !graphData) return null;
    
    try {
      const hierarchy = await abstractionEngine.buildHierarchicalAbstraction(graphData);
      setAbstractionLevels(hierarchy.levels);
      return hierarchy;
    } catch (error) {
      setSessionError(error instanceof Error ? error.message : 'Failed to build abstraction hierarchy');
      throw error;
    }
  }, [abstractionEngine, graphData]);

  /**
   * Execute stage
   */
  const executeStage = useCallback(async (stageId: string, parameters: any): Promise<any> => {
    if (!sessionId || !isReady) return;
    
    try {
      setIsStageExecuting(true);
      setStageError(null);
      setCurrentStage(stageId);
      
      const result = await db.executeStage(sessionId, stageId, parameters);
      
      // Update stage executions
      setStageExecutions(prev => [...prev, result]);
      
      return result;
    } catch (error) {
      setStageError(error instanceof Error ? error.message : 'Failed to execute stage');
      throw error;
    } finally {
      setIsStageExecuting(false);
      setCurrentStage(null);
    }
  }, [db, sessionId, isReady]);

  /**
   * Invite collaborator
   */
  const inviteCollaborator = useCallback(async (email: string, role: string): Promise<void> => {
    if (!sessionId) return;
    
    try {
      await collaboration.inviteUser(sessionId, email, role);
      
      // Refresh collaborators
      const collaboratorData = await collaboration.getSessionCollaborators(sessionId);
      setCollaborators(collaboratorData);
      
    } catch (error) {
      setSessionError(error instanceof Error ? error.message : 'Failed to invite collaborator');
      throw error;
    }
  }, [collaboration, sessionId]);

  /**
   * Subscribe to real-time session updates
   */
  const subscribeToSession = useCallback((sessionId: string) => {
    if (!collaboration) return () => {};
    
    return collaboration.subscribeToSession(sessionId, (update) => {
      switch (update.type) {
        case 'user_joined':
          setActiveUsers(prev => [...prev, update.user]);
          break;
        case 'user_left':
          setActiveUsers(prev => prev.filter(u => u.id !== update.user.id));
          break;
        case 'graph_updated':
          setGraphData(update.graphData);
          break;
        case 'hypothesis_added':
          setHypotheses(prev => [...prev, update.hypothesis]);
          break;
        default:
          break;
      }
    });
  }, [collaboration]);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setSessionError(null);
    setGraphError(null);
    setStageError(null);
  }, []);

  /**
   * Refresh session data
   */
  const refreshSession = useCallback(async (): Promise<void> => {
    if (!sessionId) return;
    await loadSession(sessionId);
  }, [sessionId, loadSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hypothesisCompetition) {
        hypothesisCompetition.cleanup();
      }
    };
  }, [hypothesisCompetition]);

  // Implement additional action methods (simplified for brevity)
  const addNode = useCallback(async (node: any) => {
    if (!graphData) return;
    const updatedGraph = {
      ...graphData,
      nodes: [...graphData.nodes, node]
    };
    await updateGraph(updatedGraph);
  }, [graphData, updateGraph]);

  const updateNode = useCallback(async (nodeId: string, updates: any) => {
    if (!graphData) return;
    const updatedGraph = {
      ...graphData,
      nodes: graphData.nodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      )
    };
    await updateGraph(updatedGraph);
  }, [graphData, updateGraph]);

  const deleteNode = useCallback(async (nodeId: string) => {
    if (!graphData) return;
    const updatedGraph = {
      ...graphData,
      nodes: graphData.nodes.filter(node => node.id !== nodeId),
      edges: graphData.edges.filter(edge => 
        edge.source !== nodeId && edge.target !== nodeId
      )
    };
    await updateGraph(updatedGraph);
  }, [graphData, updateGraph]);

  const addEdge = useCallback(async (edge: any) => {
    if (!graphData) return;
    const updatedGraph = {
      ...graphData,
      edges: [...graphData.edges, edge]
    };
    await updateGraph(updatedGraph);
  }, [graphData, updateGraph]);

  const updateEdge = useCallback(async (edgeId: string, updates: any) => {
    if (!graphData) return;
    const updatedGraph = {
      ...graphData,
      edges: graphData.edges.map(edge => 
        edge.id === edgeId ? { ...edge, ...updates } : edge
      )
    };
    await updateGraph(updatedGraph);
  }, [graphData, updateGraph]);

  const deleteEdge = useCallback(async (edgeId: string) => {
    if (!graphData) return;
    const updatedGraph = {
      ...graphData,
      edges: graphData.edges.filter(edge => edge.id !== edgeId)
    };
    await updateGraph(updatedGraph);
  }, [graphData, updateGraph]);

  const contextValue: SessionContextType = {
    // Session state
    currentSession,
    sessionId,
    isSessionLoading,
    sessionError,
    
    // Graph state
    graphData,
    isGraphLoading,
    graphError,
    
    // Stage execution state
    stageExecutions,
    currentStage,
    isStageExecuting,
    stageError,
    
    // Hypothesis state
    hypotheses,
    activeHypotheses,
    hypothesisCompetition,
    
    // Knowledge gaps
    knowledgeGaps,
    gapDetector,
    
    // Validation state
    falsifiabilityResults,
    validator,
    
    // Abstraction state
    abstractionLevels,
    abstractionEngine,
    
    // Collaboration state
    collaborators,
    activeUsers,
    
    // Actions
    createSession,
    loadSession,
    updateSession,
    deleteSession,
    
    // Graph actions
    updateGraph,
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    updateEdge,
    deleteEdge,
    
    // Stage actions
    executeStage,
    getStageHistory: async (stageId: string) => db.getStageHistory(sessionId!, stageId),
    
    // Hypothesis actions
    addHypothesis,
    updateHypothesis: async (hypothesisId: string, updates: any) => {
      setHypotheses(prev => prev.map(h => 
        h.id === hypothesisId ? { ...h, ...updates } : h
      ));
    },
    deleteHypothesis: async (hypothesisId: string) => {
      setHypotheses(prev => prev.filter(h => h.id !== hypothesisId));
    },
    runHypothesisCompetition,
    
    // Knowledge gap actions
    detectKnowledgeGaps,
    updateKnowledgeGap: async (gapId: string, updates: any) => {
      setKnowledgeGaps(prev => prev.map(g => 
        g.id === gapId ? { ...g, ...updates } : g
      ));
    },
    
    // Validation actions
    validateHypothesis,
    validateAll: async () => {
      const results = await Promise.all(
        hypotheses.map(h => validateHypothesis(h.id))
      );
      return results;
    },
    
    // Abstraction actions
    buildAbstractionHierarchy,
    updateAbstractionLevel: async (levelId: string, updates: any) => {
      setAbstractionLevels(prev => prev.map(l => 
        l.id === levelId ? { ...l, ...updates } : l
      ));
    },
    
    // Collaboration actions
    inviteCollaborator,
    updateCollaboratorRole: async (collaboratorId: string, role: string) => {
      await collaboration.updateCollaboratorRole(sessionId!, collaboratorId, role);
      const collaboratorData = await collaboration.getSessionCollaborators(sessionId!);
      setCollaborators(collaboratorData);
    },
    removeCollaborator: async (collaboratorId: string) => {
      await collaboration.removeCollaborator(sessionId!, collaboratorId);
      const collaboratorData = await collaboration.getSessionCollaborators(sessionId!);
      setCollaborators(collaboratorData);
    },
    
    // Utilities
    clearErrors,
    refreshSession,
    subscribeToSession
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

/**
 * Hook to use session context
 */
export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

/**
 * Hook for graph operations only
 */
export function useGraph() {
  const { 
    graphData, 
    isGraphLoading, 
    graphError, 
    updateGraph, 
    addNode, 
    updateNode, 
    deleteNode, 
    addEdge, 
    updateEdge, 
    deleteEdge 
  } = useSession();
  
  return {
    graphData,
    isGraphLoading,
    graphError,
    updateGraph,
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    updateEdge,
    deleteEdge
  };
}

/**
 * Hook for hypothesis operations only
 */
export function useHypotheses() {
  const {
    hypotheses,
    activeHypotheses,
    hypothesisCompetition,
    addHypothesis,
    updateHypothesis,
    deleteHypothesis,
    runHypothesisCompetition,
    validateHypothesis,
    validateAll
  } = useSession();
  
  return {
    hypotheses,
    activeHypotheses,
    hypothesisCompetition,
    addHypothesis,
    updateHypothesis,
    deleteHypothesis,
    runHypothesisCompetition,
    validateHypothesis,
    validateAll
  };
}