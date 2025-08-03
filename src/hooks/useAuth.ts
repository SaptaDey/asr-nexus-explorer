/**
 * React Hooks for Authentication
 * Provides easy integration of authentication features in React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  AuthService, 
  AuthState, 
  AuthUser, 
  SignUpData, 
  SignInData, 
  ProfileUpdateData,
  PasswordUpdateData,
  PasswordResetData
} from '@/services/auth/AuthService';
import { Session, AuthError } from '@supabase/supabase-js';

interface UseAuthReturn extends AuthState {
  // Actions
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  signIn: (data: SignInData) => Promise<{ success: boolean; error?: string }>;
  signInWithProvider: (provider: 'google' | 'github') => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: ProfileUpdateData) => Promise<{ success: boolean; error?: string }>;
  updateEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (data: PasswordUpdateData) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (data: PasswordResetData) => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<{ success: boolean; error?: string }>;
  
  // Utility methods
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  getAuthHeaders: () => Record<string, string>;
}

/**
 * Main authentication hook
 */
export function useAuth(): UseAuthReturn {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    initialized: false
  });

  const authService = useRef(new AuthService());

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = authService.current.onAuthStateChange((newState) => {
      setAuthState(newState);
    });

    return unsubscribe;
  }, []);

  /**
   * Sign up new user
   */
  const signUp = useCallback(async (data: SignUpData) => {
    try {
      console.log('useAuth: signUp called');
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign up timeout - please check your connection')), 30000)
      );
      
      const signUpPromise = authService.current.signUp(data);
      
      const result = await Promise.race([signUpPromise, timeoutPromise]) as any;
      
      if (result.error) {
        console.error('useAuth: Sign up failed with error:', result.error);
        return { success: false, error: result.error.message };
      }

      console.log('useAuth: Sign up successful');
      return { success: true };
    } catch (error) {
      console.error('useAuth: Sign up caught error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sign up failed' 
      };
    }
  }, []);

  /**
   * Sign in user
   */
  const signIn = useCallback(async (data: SignInData) => {
    try {
      console.log('useAuth: signIn called');
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign in timeout - please check your connection')), 30000)
      );
      
      const signInPromise = authService.current.signIn(data);
      
      const result = await Promise.race([signInPromise, timeoutPromise]) as any;
      
      if (result.error) {
        console.error('useAuth: Sign in failed with error:', result.error);
        return { success: false, error: result.error.message };
      }

      console.log('useAuth: Sign in successful');
      return { success: true };
    } catch (error) {
      console.error('useAuth: Sign in caught error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sign in failed' 
      };
    }
  }, []);

  /**
   * Sign in with OAuth provider
   */
  const signInWithProvider = useCallback(async (provider: 'google' | 'github') => {
    try {
      const result = await authService.current.signInWithProvider(provider);
      
      if (result.error) {
        return { success: false, error: result.error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'OAuth sign in failed' 
      };
    }
  }, []);

  /**
   * Sign out user
   */
  const signOut = useCallback(async () => {
    try {
      const result = await authService.current.signOut();
      
      if (result.error) {
        return { success: false, error: result.error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sign out failed' 
      };
    }
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (data: ProfileUpdateData) => {
    try {
      const result = await authService.current.updateProfile(data);
      
      if (result.error) {
        return { success: false, error: result.error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Profile update failed' 
      };
    }
  }, []);

  /**
   * Update user email
   */
  const updateEmail = useCallback(async (email: string) => {
    try {
      const result = await authService.current.updateEmail(email);
      
      if (result.error) {
        return { success: false, error: result.error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Email update failed' 
      };
    }
  }, []);

  /**
   * Update user password
   */
  const updatePassword = useCallback(async (data: PasswordUpdateData) => {
    try {
      const result = await authService.current.updatePassword(data);
      
      if (result.error) {
        return { success: false, error: result.error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Password update failed' 
      };
    }
  }, []);

  /**
   * Request password reset
   */
  const requestPasswordReset = useCallback(async (data: PasswordResetData) => {
    try {
      const result = await authService.current.requestPasswordReset(data);
      
      if (result.error) {
        return { success: false, error: result.error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Password reset request failed' 
      };
    }
  }, []);

  /**
   * Refresh session
   */
  const refreshSession = useCallback(async () => {
    try {
      const result = await authService.current.refreshSession();
      
      if (result.error) {
        return { success: false, error: result.error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Session refresh failed' 
      };
    }
  }, []);

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = authService.current.isAuthenticated();

  /**
   * Check if user has permission
   */
  const hasPermission = useCallback((permission: string) => {
    return authService.current.hasPermission(permission);
  }, []);

  /**
   * Get auth headers
   */
  const getAuthHeaders = useCallback(() => {
    return authService.current.getAuthHeaders();
  }, []);

  return {
    ...authState,
    signUp,
    signIn,
    signInWithProvider,
    signOut,
    updateProfile,
    updateEmail,
    updatePassword,
    requestPasswordReset,
    refreshSession,
    isAuthenticated,
    hasPermission,
    getAuthHeaders
  };
}

/**
 * Hook for managing user profile
 */
export function useProfile() {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profile = user?.profile;

  /**
   * Update profile with error handling
   */
  const updateProfileWithState = useCallback(async (data: ProfileUpdateData) => {
    try {
      setLoading(true);
      setError(null);

      const result = await updateProfile(data);
      
      if (!result.success) {
        setError(result.error || 'Profile update failed');
        return false;
      }

      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Profile update failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [updateProfile]);

  return {
    profile,
    loading,
    error,
    updateProfile: updateProfileWithState,
    clearError: () => setError(null)
  };
}

/**
 * Hook for authentication form state management
 */
export function useAuthForm(type: 'signin' | 'signup' | 'reset') {
  const { signIn, signUp, requestPasswordReset } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      let result;
      
      switch (type) {
        case 'signin':
          result = await signIn(data as SignInData);
          break;
        case 'signup':
          result = await signUp(data as SignUpData);
          break;
        case 'reset':
          result = await requestPasswordReset(data as PasswordResetData);
          break;
        default:
          throw new Error('Invalid form type');
      }

      if (!result.success) {
        setError(result.error || 'Operation failed');
        return false;
      }

      setSuccess(true);
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Operation failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [type, signIn, signUp, requestPasswordReset]);

  return {
    loading,
    error,
    success,
    handleSubmit,
    clearError: () => setError(null),
    clearSuccess: () => setSuccess(false)
  };
}

/**
 * Hook for protected routes
 */
export function useAuthGuard(options: {
  requireAuth?: boolean;
  requirePermission?: string;
  redirectTo?: string;
} = {}) {
  const { user, session, loading, initialized, hasPermission } = useAuth();
  const { requireAuth = true, requirePermission, redirectTo = '/signin' } = options;

  const isAuthenticated = !!user && !!session;
  const hasRequiredPermission = requirePermission ? hasPermission(requirePermission) : true;

  const shouldRedirect = 
    initialized && 
    !loading && 
    requireAuth && 
    (!isAuthenticated || !hasRequiredPermission);

  return {
    isAuthenticated,
    hasRequiredPermission,
    shouldRedirect,
    redirectTo,
    loading: loading || !initialized,
    user
  };
}

/**
 * Hook for session monitoring
 */
export function useSessionMonitor() {
  const { session, refreshSession } = useAuth();
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  // Monitor session expiry
  useEffect(() => {
    if (!session || !session.expires_at) {
      setSessionExpiry(null);
      setIsExpired(false);
      return;
    }

    const expiryDate = new Date(session.expires_at * 1000);
    setSessionExpiry(expiryDate);

    // Check if already expired
    if (Date.now() > expiryDate.getTime()) {
      setIsExpired(true);
      return;
    }

    // Set up expiry check
    const checkExpiry = () => {
      if (Date.now() > expiryDate.getTime()) {
        setIsExpired(true);
      }
    };

    const interval = setInterval(checkExpiry, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [session]);

  /**
   * Extend session
   */
  const extendSession = useCallback(async () => {
    try {
      const result = await refreshSession();
      if (result.success) {
        setIsExpired(false);
      }
      return result;
    } catch (error) {
      return { success: false, error: 'Session extension failed' };
    }
  }, [refreshSession]);

  return {
    sessionExpiry,
    isExpired,
    timeUntilExpiry: sessionExpiry ? sessionExpiry.getTime() - Date.now() : null,
    extendSession
  };
}

/**
 * Hook for user activity tracking
 */
export function useUserActivity() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authService = useRef(new AuthService());

  /**
   * Load user activities
   */
  const loadActivities = useCallback(async (limit = 50) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const result = await authService.current.getUserActivityLogs(limit);
      
      if (result.error) {
        setError(result.error.message);
        return;
      }

      setActivities(result.activities);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load activities when user changes
  useEffect(() => {
    if (user) {
      loadActivities();
    } else {
      setActivities([]);
    }
  }, [user, loadActivities]);

  return {
    activities,
    loading,
    error,
    loadActivities,
    clearError: () => setError(null)
  };
}