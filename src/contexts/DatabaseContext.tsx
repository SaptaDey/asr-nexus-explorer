/**
 * Database Context Provider
 * Provides centralized database state management for the ASR-GoT application
 */

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { DatabaseService } from '@/services/database/DatabaseService';
import { AuthService } from '@/services/auth/AuthService';
import { CollaborationService } from '@/services/collaboration/CollaborationService';
import { performanceOptimizationService } from '@/services/optimization/PerformanceOptimizationService';
import { dataExportImportService } from '@/services/data/DataExportImportService';
import { User } from '@supabase/supabase-js';

interface DatabaseContextType {
  // Core services
  db: DatabaseService;
  auth: AuthService;
  collaboration: CollaborationService;
  performance: typeof performanceOptimizationService;
  dataPortability: typeof dataExportImportService;
  
  // Authentication state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  
  // Database state
  isInitialized: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  lastError: string | null;
  
  // Performance state
  performanceMetrics: any;
  cacheHealth: any;
  
  // Actions
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, metadata?: any) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
  refreshPerformanceMetrics: () => Promise<void>;
  
  // Utilities
  isReady: boolean;
  getHealthStatus: () => Promise<any>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

interface DatabaseProviderProps {
  children: ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  // Service instances
  const [db] = useState(() => new DatabaseService());
  const [auth] = useState(() => new AuthService());
  const [collaboration] = useState(() => new CollaborationService());
  
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Database state
  const [isInitialized, setIsInitialized] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('connecting');
  const [lastError, setLastError] = useState<string | null>(null);
  
  // Performance state
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [cacheHealth, setCacheHealth] = useState<any>(null);

  /**
   * Initialize database services
   */
  const initializeServices = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      
      // Initialize core database service
      await db.initialize();
      
      // Initialize performance optimization
      await performanceOptimizationService.initialize();
      
      // Initialize data export/import service
      await dataExportImportService.initialize();
      
      setIsInitialized(true);
      setConnectionStatus('connected');
      setLastError(null);
    } catch (error) {
      console.error('Database initialization failed:', error);
      setConnectionStatus('error');
      setLastError(error instanceof Error ? error.message : 'Database initialization failed');
    }
  }, [db]);

  /**
   * Set up authentication state listener
   */
  useEffect(() => {
    const { data: { subscription } } = auth.supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            setUser(session.user);
            setIsAuthenticated(true);
            setAuthError(null);
            
            // Initialize user-specific services
            await collaboration.initialize(session.user.id);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setIsAuthenticated(false);
            setAuthError(null);
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          setAuthError(error instanceof Error ? error.message : 'Authentication error');
        } finally {
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [auth.supabase.auth, collaboration]);

  /**
   * Initialize services on mount
   */
  useEffect(() => {
    initializeServices();
  }, [initializeServices]);

  /**
   * Sign in user
   */
  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      const result = await auth.signIn(email, password);
      
      if (result.error) {
        setAuthError(result.error.message);
        return false;
      }
      
      return true;
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Sign in failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [auth]);

  /**
   * Sign up user
   */
  const signUp = useCallback(async (
    email: string, 
    password: string, 
    metadata?: any
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      const result = await auth.signUp(email, password, metadata);
      
      if (result.error) {
        setAuthError(result.error.message);
        return false;
      }
      
      return true;
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Sign up failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [auth]);

  /**
   * Sign out user
   */
  const signOut = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      await auth.signOut();
      
      // Clean up services
      await collaboration.cleanup();
      await performanceOptimizationService.shutdown();
    } catch (error) {
      console.error('Sign out error:', error);
      setAuthError(error instanceof Error ? error.message : 'Sign out failed');
    } finally {
      setIsLoading(false);
    }
  }, [auth, collaboration]);

  /**
   * Clear authentication error
   */
  const clearError = useCallback(() => {
    setAuthError(null);
    setLastError(null);
  }, []);

  /**
   * Refresh performance metrics
   */
  const refreshPerformanceMetrics = useCallback(async () => {
    try {
      const [insights, health] = await Promise.all([
        performanceOptimizationService.getPerformanceInsights(),
        performanceOptimizationService.cache.getHealth()
      ]);
      
      setPerformanceMetrics(insights);
      setCacheHealth(health);
    } catch (error) {
      console.error('Failed to refresh performance metrics:', error);
    }
  }, []);

  /**
   * Get overall health status
   */
  const getHealthStatus = useCallback(async () => {
    try {
      const [dbHealth, cacheHealth, performanceHealth] = await Promise.all([
        db.getHealthStatus(),
        performanceOptimizationService.cache.getHealth(),
        performanceOptimizationService.getPerformanceInsights()
      ]);

      return {
        database: dbHealth,
        cache: cacheHealth,
        performance: performanceHealth,
        overall: connectionStatus === 'connected' && isInitialized ? 'healthy' : 'unhealthy'
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        database: { status: 'error' },
        cache: { status: 'error' },
        performance: { health: { status: 'error' } },
        overall: 'error'
      };
    }
  }, [db, connectionStatus, isInitialized]);

  /**
   * Refresh performance metrics periodically
   */
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      refreshPerformanceMetrics();
      
      const interval = setInterval(refreshPerformanceMetrics, 60000); // Every minute
      return () => clearInterval(interval);
    }
  }, [isInitialized, isAuthenticated, refreshPerformanceMetrics]);

  const contextValue: DatabaseContextType = {
    // Core services
    db,
    auth,
    collaboration,
    performance: performanceOptimizationService,
    dataPortability: dataExportImportService,
    
    // Authentication state
    user,
    isAuthenticated,
    isLoading,
    authError,
    
    // Database state
    isInitialized,
    connectionStatus,
    lastError,
    
    // Performance state
    performanceMetrics,
    cacheHealth,
    
    // Actions
    signIn,
    signUp,
    signOut,
    clearError,
    refreshPerformanceMetrics,
    
    // Utilities
    isReady: isInitialized && connectionStatus === 'connected',
    getHealthStatus
  };

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
}

/**
 * Hook to use database context
 */
export function useDatabase(): DatabaseContextType {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}

/**
 * Hook for authentication only
 */
export function useAuth() {
  const { user, isAuthenticated, isLoading, authError, signIn, signUp, signOut, clearError } = useDatabase();
  return { user, isAuthenticated, isLoading, authError, signIn, signUp, signOut, clearError };
}

/**
 * Hook for performance monitoring
 */
export function usePerformance() {
  const { 
    performance, 
    performanceMetrics, 
    cacheHealth, 
    refreshPerformanceMetrics,
    getHealthStatus 
  } = useDatabase();
  
  return { 
    performance, 
    performanceMetrics, 
    cacheHealth, 
    refreshPerformanceMetrics,
    getHealthStatus 
  };
}

/**
 * Hook for collaboration features
 */
export function useCollaboration() {
  const { collaboration, user, isAuthenticated } = useDatabase();
  return { collaboration, user, isAuthenticated };
}

/**
 * Hook for data portability
 */
export function useDataPortability() {
  const { dataPortability, isAuthenticated } = useDatabase();
  return { dataPortability, isAuthenticated };
}