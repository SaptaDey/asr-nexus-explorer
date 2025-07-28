/**
 * Context Compatibility Layer
 * Provides backward compatibility for existing context consumers while using the unified manager
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useAppContext, useAppAuth, useAppDatabase, useAppSession } from './AppContextManager';
import type { 
  AuthState, 
  SignUpData, 
  SignInData, 
  ProfileUpdateData,
  PasswordUpdateData,
  PasswordResetData
} from '@/services/auth/AuthService';
import { GraphData } from '@/types/asrGotTypes';

// Backward compatible AuthContext type
interface AuthContextType extends AuthState {
  profile?: any;
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  signIn: (data: SignInData) => Promise<{ success: boolean; error?: string }>;
  signInWithProvider: (provider: 'google' | 'github') => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: ProfileUpdateData) => Promise<{ success: boolean; error?: string }>;
  updateEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (data: PasswordUpdateData) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (data: PasswordResetData) => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<{ success: boolean; error?: string }>;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  getAuthHeaders: () => Record<string, string>;
}

// Backward compatible DatabaseContext type
interface DatabaseContextType {
  db: any;
  auth: any;
  collaboration: any;
  performance: any;
  dataPortability: any;
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  isInitialized: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  lastError: string | null;
  performanceMetrics: any;
  cacheHealth: any;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, metadata?: any) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
  refreshPerformanceMetrics: () => Promise<void>;
  isReady: boolean;
  getHealthStatus: () => Promise<any>;
}

// Backward compatible SessionContext type
interface SessionContextType {
  currentSession: any | null;
  sessionId: string | null;
  isSessionLoading: boolean;
  sessionError: string | null;
  graphData: GraphData | null;
  isGraphLoading: boolean;
  graphError: string | null;
  stageExecutions: any[];
  currentStage: string | null;
  isStageExecuting: boolean;
  stageError: string | null;
  hypotheses: any[];
  activeHypotheses: any[];
  hypothesisCompetition: any;
  knowledgeGaps: any[];
  gapDetector: any;
  falsifiabilityResults: any[];
  validator: any;
  abstractionLevels: any[];
  abstractionEngine: any;
  collaborators: any[];
  activeUsers: any[];
  
  createSession: (title: string, description: string, config?: any) => Promise<string>;
  loadSession: (sessionId: string) => Promise<void>;
  updateSession: (updates: any) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  updateGraph: (graphData: GraphData) => Promise<void>;
  addNode: (node: any) => Promise<void>;
  updateNode: (nodeId: string, updates: any) => Promise<void>;
  deleteNode: (nodeId: string) => Promise<void>;
  addEdge: (edge: any) => Promise<void>;
  updateEdge: (edgeId: string, updates: any) => Promise<void>;
  deleteEdge: (edgeId: string) => Promise<void>;
  executeStage: (stageId: string, parameters: any) => Promise<any>;
  getStageHistory: (stageId: string) => Promise<any[]>;
  addHypothesis: (hypothesis: any) => Promise<void>;
  updateHypothesis: (hypothesisId: string, updates: any) => Promise<void>;
  deleteHypothesis: (hypothesisId: string) => Promise<void>;
  runHypothesisCompetition: () => Promise<any>;
  detectKnowledgeGaps: () => Promise<any[]>;
  updateKnowledgeGap: (gapId: string, updates: any) => Promise<void>;
  validateHypothesis: (hypothesisId: string) => Promise<any>;
  validateAll: () => Promise<any[]>;
  buildAbstractionHierarchy: () => Promise<any>;
  updateAbstractionLevel: (levelId: string, updates: any) => Promise<void>;
  inviteCollaborator: (email: string, role: string) => Promise<void>;
  updateCollaboratorRole: (collaboratorId: string, role: string) => Promise<void>;
  removeCollaborator: (collaboratorId: string) => Promise<void>;
  clearErrors: () => void;
  refreshSession: () => Promise<void>;
  subscribeToSession: (sessionId: string) => () => void;
}

// Create contexts for backward compatibility
const CompatibilityAuthContext = createContext<AuthContextType | undefined>(undefined);
const CompatibilityDatabaseContext = createContext<DatabaseContextType | undefined>(undefined);
const CompatibilitySessionContext = createContext<SessionContextType | undefined>(undefined);

/**
 * Compatibility AuthProvider
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAppAuth();
  
  const contextValue: AuthContextType = {
    user: auth.user,
    profile: auth.profile,
    session: auth.session,
    loading: auth.loading,
    initialized: auth.initialized,
    error: auth.error,
    isAuthenticated: auth.isAuthenticated,
    
    signUp: auth.signUp,
    signIn: auth.signIn,
    signInWithProvider: auth.signInWithProvider,
    signOut: auth.signOut,
    updateProfile: auth.updateProfile,
    updateEmail: auth.updateEmail,
    updatePassword: auth.updatePassword,
    requestPasswordReset: auth.requestPasswordReset,
    refreshSession: auth.refreshSession,
    hasPermission: auth.hasPermission,
    getAuthHeaders: auth.getAuthHeaders
  };
  
  return (
    <CompatibilityAuthContext.Provider value={contextValue}>
      {children}
    </CompatibilityAuthContext.Provider>
  );
}

/**
 * Compatibility DatabaseProvider
 */
export function DatabaseProvider({ children }: { children: ReactNode }) {
  const database = useAppDatabase();
  const auth = useAppAuth();
  
  const contextValue: DatabaseContextType = {
    db: database.service,
    auth: auth,
    collaboration: database.collaboration,
    performance: {},
    dataPortability: {},
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.loading,
    authError: auth.error,
    isInitialized: database.isInitialized,
    connectionStatus: database.connectionStatus,
    lastError: database.lastError,
    performanceMetrics: database.performanceMetrics,
    cacheHealth: database.cacheHealth,
    isReady: database.isReady,
    
    signIn: async (email: string, password: string) => {
      const result = await auth.signIn(email, password);
      return result.success;
    },
    signUp: async (email: string, password: string, metadata?: any) => {
      const result = await auth.signUp(email, password, metadata);
      return result.success;
    },
    signOut: async () => {
      await auth.signOut();
    },
    clearError: auth.clearError,
    refreshPerformanceMetrics: database.refreshPerformanceMetrics,
    getHealthStatus: database.getHealthStatus
  };
  
  return (
    <CompatibilityDatabaseContext.Provider value={contextValue}>
      {children}
    </CompatibilityDatabaseContext.Provider>
  );
}

/**
 * Compatibility SessionProvider
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const session = useAppSession();
  const database = useAppDatabase();
  
  const contextValue: SessionContextType = {
    currentSession: session.currentSession,
    sessionId: session.sessionId,
    isSessionLoading: session.isSessionLoading,
    sessionError: session.sessionError,
    graphData: session.graphData,
    isGraphLoading: session.isGraphLoading,
    graphError: session.graphError,
    stageExecutions: session.stageExecutions,
    currentStage: session.currentStage,
    isStageExecuting: session.isStageExecuting,
    stageError: session.stageError,
    
    // Mock values for backward compatibility
    hypotheses: [],
    activeHypotheses: [],
    hypothesisCompetition: null,
    knowledgeGaps: [],
    gapDetector: null,
    falsifiabilityResults: [],
    validator: null,
    abstractionLevels: [],
    abstractionEngine: null,
    collaborators: [],
    activeUsers: [],
    
    createSession: session.createSession,
    loadSession: session.loadSession,
    updateSession: session.updateSession,
    deleteSession: session.deleteSession,
    updateGraph: session.updateGraph,
    addNode: session.addNode,
    updateNode: session.updateNode,
    deleteNode: session.deleteNode,
    addEdge: session.addEdge,
    updateEdge: session.updateEdge,
    deleteEdge: session.deleteEdge,
    executeStage: session.executeStage,
    
    // Mock implementations for backward compatibility
    getStageHistory: async () => [],
    addHypothesis: async () => {},
    updateHypothesis: async () => {},
    deleteHypothesis: async () => {},
    runHypothesisCompetition: async () => ({}),
    detectKnowledgeGaps: async () => [],
    updateKnowledgeGap: async () => {},
    validateHypothesis: async () => ({}),
    validateAll: async () => [],
    buildAbstractionHierarchy: async () => ({}),
    updateAbstractionLevel: async () => {},
    inviteCollaborator: async () => {},
    updateCollaboratorRole: async () => {},
    removeCollaborator: async () => {},
    subscribeToSession: () => () => {},
    
    clearErrors: session.clearErrors,
    refreshSession: session.refreshSession
  };
  
  // Show loading state while database is connecting
  if (database.connectionStatus === 'connecting' || database.connectionStatus === 'disconnected') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Initializing ASR-GoT Framework</h2>
          <p className="text-gray-600">Connecting to database services...</p>
        </div>
      </div>
    );
  }
  
  // Show error state if database connection failed
  if (database.connectionStatus === 'error') {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-red-800 mb-2">Database Connection Failed</h2>
          <p className="text-red-600 mb-4">Unable to connect to database. Please check your configuration.</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <CompatibilitySessionContext.Provider value={contextValue}>
      {children}
    </CompatibilitySessionContext.Provider>
  );
}

/**
 * Backward compatible hooks
 */
export function useAuthContext(): AuthContextType {
  const context = useContext(CompatibilityAuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export function useDatabase(): DatabaseContextType {
  const context = useContext(CompatibilityDatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}

export function useSession(): SessionContextType {
  const context = useContext(CompatibilitySessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

// Renamed export to avoid conflicts
export function useDatabaseAuth() {
  const { user, isAuthenticated, isLoading, authError, signIn, signUp, signOut, clearError } = useDatabase();
  return { user, isAuthenticated, isLoading, authError, signIn, signUp, signOut, clearError };
}

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