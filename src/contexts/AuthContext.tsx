/**
 * Authentication Context Provider
 * Provides authentication state and methods throughout the React app
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { 
  AuthState, 
  SignUpData, 
  SignInData, 
  ProfileUpdateData,
  PasswordUpdateData,
  PasswordResetData
} from '@/services/auth/AuthService';

interface AuthContextType extends AuthState {
  // Profile shortcut for easier access
  profile?: any; // Direct access to user.profile
  
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth();

  // Add profile shortcut to the context value
  const contextValue: AuthContextType = {
    ...auth,
    profile: auth.user?.profile
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 */
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * Higher-order component for protected routes
 */
interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requirePermission?: string;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requirePermission,
  fallback,
  loadingFallback
}: ProtectedRouteProps) {
  const { user, session, loading, initialized, hasPermission } = useAuthContext();

  // Show loading while auth is initializing
  if (!initialized || loading) {
    return loadingFallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check authentication requirement
  const isAuthenticated = !!user && !!session;
  if (requireAuth && !isAuthenticated) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please sign in to access this page.</p>
        </div>
      </div>
    );
  }

  // Check permission requirement
  if (requirePermission && !hasPermission(requirePermission)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Component for conditional rendering based on auth state
 */
interface AuthGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
  requirePermission?: string;
  showWhenLoading?: boolean;
}

export function AuthGate({
  children,
  fallback,
  requireAuth = true,
  requirePermission,
  showWhenLoading = false
}: AuthGateProps) {
  const { user, session, loading, initialized, hasPermission } = useAuthContext();

  // Handle loading state
  if (!initialized || loading) {
    return showWhenLoading ? <>{children}</> : (fallback || null);
  }

  // Check authentication
  const isAuthenticated = !!user && !!session;
  if (requireAuth && !isAuthenticated) {
    return fallback || null;
  }

  // Check permission
  if (requirePermission && !hasPermission(requirePermission)) {
    return fallback || null;
  }

  return <>{children}</>;
}

/**
 * Component that only renders for authenticated users
 */
interface AuthenticatedOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthenticatedOnly({ children, fallback }: AuthenticatedOnlyProps) {
  return (
    <AuthGate requireAuth={true} fallback={fallback}>
      {children}
    </AuthGate>
  );
}

/**
 * Component that only renders for unauthenticated users
 */
interface UnauthenticatedOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function UnauthenticatedOnly({ children, fallback }: UnauthenticatedOnlyProps) {
  const { user, session, loading, initialized } = useAuthContext();

  if (!initialized || loading) {
    return fallback || null;
  }

  const isAuthenticated = !!user && !!session;
  
  return isAuthenticated ? (fallback || null) : <>{children}</>;
}

/**
 * Component for user profile display
 */
interface UserProfileProps {
  className?: string;
  showEmail?: boolean;
  showInstitution?: boolean;
  showAvatar?: boolean;
  avatarSize?: 'sm' | 'md' | 'lg';
}

export function UserProfile({
  className = '',
  showEmail = false,
  showInstitution = false,
  showAvatar = true,
  avatarSize = 'md'
}: UserProfileProps) {
  const { user } = useAuthContext();

  if (!user || !user.profile) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg'
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {showAvatar && (
        <div className={`${sizeClasses[avatarSize]} rounded-full bg-primary/10 flex items-center justify-center overflow-hidden`}>
          {user.profile.avatar_url ? (
            <img 
              src={user.profile.avatar_url} 
              alt={user.profile.full_name || 'User'}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-medium text-primary">
              {(user.profile.full_name || user.email || 'U').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        {user.profile.full_name && (
          <p className="font-medium text-gray-900 truncate">
            {user.profile.full_name}
          </p>
        )}
        
        {showEmail && (
          <p className="text-sm text-gray-500 truncate">
            {user.email}
          </p>
        )}
        
        {showInstitution && user.profile.institution && (
          <p className="text-sm text-gray-500 truncate">
            {user.profile.institution}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Component for authentication status indicator
 */
interface AuthStatusProps {
  className?: string;
}

export function AuthStatus({ className = '' }: AuthStatusProps) {
  const { user, session, loading } = useAuthContext();

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-600">Connecting...</span>
      </div>
    );
  }

  const isAuthenticated = !!user && !!session;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}></div>
      <span className="text-sm text-gray-600">
        {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
      </span>
    </div>
  );
}

// Export the context for direct access if needed
export { AuthContext };