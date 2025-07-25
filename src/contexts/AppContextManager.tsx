/**
 * Application Context Manager
 * Centralized context management to resolve provider conflicts and dependencies
 */

import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { GraphData, ResearchContext, ASRGoTParameters } from '@/types/asrGotTypes';
import { AuthService, AuthUser, AuthState } from '@/services/auth/AuthService';
import { DatabaseService } from '@/services/database/DatabaseService';
import { CollaborationService } from '@/services/collaboration/CollaborationService';
import { InitializationService, InitializationState } from '@/services/initialization/InitializationService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Unified context type combining all application state
interface AppContextType {
  // Authentication state (from AuthContext)
  auth: {
    user: AuthUser | null;
    profile: any;
    session: any;
    loading: boolean;
    initialized: boolean;
    isAuthenticated: boolean;
    error: string | null;
    
    // Auth actions
    signUp: (email: string, password: string, metadata?: any) => Promise<{ success: boolean; error?: string }>;
    signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signInWithProvider: (provider: 'google' | 'github') => Promise<{ success: boolean; error?: string }>;
    signOut: () => Promise<{ success: boolean; error?: string }>;
    updateProfile: (data: any) => Promise<{ success: boolean; error?: string }>;
    updateEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
    updatePassword: (data: any) => Promise<{ success: boolean; error?: string }>;
    requestPasswordReset: (data: any) => Promise<{ success: boolean; error?: string }>;
    refreshSession: () => Promise<{ success: boolean; error?: string }>;
    hasPermission: (permission: string) => boolean;
    getAuthHeaders: () => Record<string, string>;
    clearError: () => void;
  };
  
  // Database state (from DatabaseContext)
  database: {
    service: DatabaseService;
    collaboration: CollaborationService;
    isInitialized: boolean;
    connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
    lastError: string | null;
    performanceMetrics: any;
    cacheHealth: any;
    isReady: boolean;
    
    // Database actions
    getHealthStatus: () => Promise<any>;
    refreshPerformanceMetrics: () => Promise<void>;
  };
  
  // Session state (from SessionContext)
  session: {
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
    
    // Session actions
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
    
    // Utilities
    clearErrors: () => void;
    refreshSession: () => Promise<void>;
  };
  
  // Global application state
  app: {
    isInitialized: boolean;
    initializationError: string | null;
    initializationState: InitializationState | null;
    theme: 'light' | 'dark';
    language: string;
    
    // App actions
    setTheme: (theme: 'light' | 'dark') => void;
    setLanguage: (language: string) => void;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppContextManagerProps {
  children: ReactNode;
}

export function AppContextManager({ children }: AppContextManagerProps) {
  // Authentication state
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authSession, setAuthSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Database state
  const [databaseService] = useState(() => DatabaseService.getInstance());
  const [collaborationService] = useState(() => new CollaborationService());
  const [isDatabaseInitialized, setIsDatabaseInitialized] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('connecting');
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>({});
  const [cacheHealth, setCacheHealth] = useState<any>({});
  
  // Session state
  const [currentSession, setCurrentSession] = useState<any | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isGraphLoading, setIsGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [stageExecutions, setStageExecutions] = useState<any[]>([]);
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [isStageExecuting, setIsStageExecuting] = useState(false);
  const [stageError, setStageError] = useState<string | null>(null);
  
  // App state
  const [isAppInitialized, setIsAppInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [initializationState, setInitializationState] = useState<InitializationState | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState('en');
  
  // Initialize application using the initialization service
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setAuthLoading(true);
        const initService = InitializationService.getInstance();
        
        // Subscribe to initialization state changes
        const unsubscribe = initService.subscribe((state) => {
          setInitializationState(state);
          
          // Update auth state based on initialization phase
          if (state.phases.get('auth')?.status === 'completed') {
            setAuthInitialized(true);
          }
          
          // Update database state based on initialization phase
          if (state.phases.get('database')?.status === 'completed') {
            setIsDatabaseInitialized(true);
            setConnectionStatus('connected');
          } else if (state.phases.get('database')?.status === 'failed') {
            setConnectionStatus('error');
            setDatabaseError(state.phases.get('database')?.error || 'Database initialization failed');
          }
          
          // Update app state when initialization is complete
          if (state.isComplete) {
            setIsAppInitialized(true);
            setAuthLoading(false);
            
            if (state.hasErrors) {
              setInitializationError('Some services failed to initialize properly');
              toast.warning('⚠️ ASR-GoT Framework initialized with warnings');
            } else {
              toast.success('🚀 ASR-GoT Framework initialized successfully');
            }
          }
        });
        
        // Start initialization process
        const success = await initService.initialize();
        
        if (!success) {
          setInitializationError('Critical initialization failure');
          setAuthLoading(false);
        }
        
        // Set up auth state change listener after initialization
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state change:', event, session);
            
            if (session) {
              setAuthSession(session);
              setAuthUser(session.user as AuthUser);
            } else {
              setAuthSession(null);
              setAuthUser(null);
            }
          }
        );
        
        return () => {
          unsubscribe();
          subscription.unsubscribe();
        };
        
      } catch (error) {
        console.error('App initialization error:', error);
        setInitializationError(error instanceof Error ? error.message : 'Application initialization failed');
        setAuthLoading(false);
      }
    };
    
    initializeApp();
  }, []);
  
  // Load performance metrics after database is initialized
  useEffect(() => {
    const loadMetrics = async () => {
      if (isDatabaseInitialized && connectionStatus === 'connected') {
        try {
          const metrics = await databaseService.getPerformanceMetrics();
          setPerformanceMetrics(metrics);
        } catch (error) {
          console.warn('Failed to load performance metrics:', error);
        }
      }
    };
    
    loadMetrics();
  }, [isDatabaseInitialized, connectionStatus, databaseService]);
  
  // Authentication actions
  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      setAuthError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign up failed';
      setAuthError(message);
      return { success: false, error: message };
    }
  };
  
  const signIn = async (email: string, password: string) => {
    try {
      setAuthError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      setAuthError(message);
      return { success: false, error: message };
    }
  };
  
  const signOut = async () => {
    try {
      setAuthError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear session state
      setCurrentSession(null);
      setSessionId(null);
      setGraphData(null);
      setStageExecutions([]);
      
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign out failed';
      setAuthError(message);
      return { success: false, error: message };
    }
  };
  
  // Session actions
  const createSession = async (title: string, description: string, config?: any): Promise<string> => {
    if (!isDatabaseInitialized) throw new Error('Database not ready');
    
    try {
      setIsSessionLoading(true);
      setSessionError(null);
      
      const session = await databaseService.createResearchSession({
        title,
        description,
        config: config || {}
      });
      
      setCurrentSession(session);
      setSessionId(session.id);
      
      return session.id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create session';
      setSessionError(errorMessage);
      throw error;
    } finally {
      setIsSessionLoading(false);
    }
  };
  
  const loadSession = async (sessionId: string): Promise<void> => {
    if (!isDatabaseInitialized) throw new Error('Database not ready');
    
    try {
      setIsSessionLoading(true);
      setSessionError(null);
      
      const sessionData = await databaseService.getResearchSession(sessionId);
      
      setCurrentSession(sessionData.session);
      setSessionId(sessionId);
      setGraphData(sessionData.graphData);
      setStageExecutions(sessionData.stageExecutions || []);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load session';
      setSessionError(errorMessage);
      throw error;
    } finally {
      setIsSessionLoading(false);
    }
  };
  
  const updateGraph = async (newGraphData: GraphData): Promise<void> => {
    if (!sessionId || !isDatabaseInitialized) return;
    
    try {
      setIsGraphLoading(true);
      setGraphError(null);
      
      await databaseService.saveGraphData(sessionId, newGraphData);
      setGraphData(newGraphData);
      
    } catch (error) {
      setGraphError(error instanceof Error ? error.message : 'Failed to update graph');
      throw error;
    } finally {
      setIsGraphLoading(false);
    }
  };
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AppContextType>(() => ({
    auth: {
      user: authUser,
      profile: authUser?.user_metadata,
      session: authSession,
      loading: authLoading,
      initialized: authInitialized,
      isAuthenticated: !!authUser,
      error: authError,
      
      signUp,
      signIn,
      signInWithProvider: async (provider) => ({ success: false, error: 'Not implemented' }),
      signOut,
      updateProfile: async (data) => ({ success: false, error: 'Not implemented' }),
      updateEmail: async (email) => ({ success: false, error: 'Not implemented' }),
      updatePassword: async (data) => ({ success: false, error: 'Not implemented' }),
      requestPasswordReset: async (data) => ({ success: false, error: 'Not implemented' }),
      refreshSession: async () => ({ success: false, error: 'Not implemented' }),
      hasPermission: (permission) => false,
      getAuthHeaders: () => ({
        'Authorization': authSession?.access_token ? `Bearer ${authSession.access_token}` : ''
      }),
      clearError: () => setAuthError(null)
    },
    
    database: {
      service: databaseService,
      collaboration: collaborationService,
      isInitialized: isDatabaseInitialized,
      connectionStatus,
      lastError: databaseError,
      performanceMetrics,
      cacheHealth,
      isReady: isDatabaseInitialized && connectionStatus === 'connected',
      
      getHealthStatus: async () => ({}),
      refreshPerformanceMetrics: async () => {}
    },
    
    session: {
      currentSession,
      sessionId,
      isSessionLoading,
      sessionError,
      graphData,
      isGraphLoading,
      graphError,
      stageExecutions,
      currentStage,
      isStageExecuting,
      stageError,
      
      createSession,
      loadSession,
      updateSession: async (updates) => {},
      deleteSession: async (sessionId) => {},
      updateGraph,
      addNode: async (node) => {},
      updateNode: async (nodeId, updates) => {},
      deleteNode: async (nodeId) => {},
      addEdge: async (edge) => {},
      updateEdge: async (edgeId, updates) => {},
      deleteEdge: async (edgeId) => {},
      executeStage: async (stageId, parameters) => ({}),
      clearErrors: () => {
        setSessionError(null);
        setGraphError(null);
        setStageError(null);
      },
      refreshSession: async () => {
        if (sessionId) await loadSession(sessionId);
      }
    },
    
    app: {
      isInitialized: isAppInitialized,
      initializationError,
      initializationState,
      theme,
      language,
      setTheme,
      setLanguage
    }
  }), [
    authUser, authSession, authLoading, authInitialized, authError,
    databaseService, collaborationService, isDatabaseInitialized, connectionStatus, databaseError,
    currentSession, sessionId, isSessionLoading, sessionError, graphData, isGraphLoading, graphError,
    stageExecutions, currentStage, isStageExecuting, stageError,
    isAppInitialized, initializationError, initializationState, theme, language,
    performanceMetrics, cacheHealth
  ]);
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Hook to access the unified app context
 */
export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextManager');
  }
  return context;
}

/**
 * Individual context hooks for specific functionality
 */
export function useAppAuth() {
  const { auth } = useAppContext();
  return auth;
}

export function useAppDatabase() {
  const { database } = useAppContext();
  return database;
}

export function useAppSession() {
  const { session } = useAppContext();
  return session;
}

export function useAppState() {
  const { app } = useAppContext();
  return app;
}