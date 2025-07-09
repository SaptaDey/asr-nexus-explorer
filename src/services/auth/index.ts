/**
 * Authentication Services Export Index
 * Central export point for all authentication-related services, hooks, and components
 */

// Core authentication service
export { AuthService, authService } from './AuthService';

// React hooks
export { 
  useAuth, 
  useProfile, 
  useAuthForm, 
  useAuthGuard, 
  useSessionMonitor, 
  useUserActivity 
} from '@/hooks/useAuth';

// React context and components
export { 
  AuthProvider, 
  useAuthContext, 
  ProtectedRoute, 
  AuthGate, 
  AuthenticatedOnly, 
  UnauthenticatedOnly, 
  UserProfile, 
  AuthStatus,
  AuthContext
} from '@/contexts/AuthContext';

// Type exports
export type {
  AuthUser,
  AuthState,
  SignUpData,
  SignInData,
  ProfileUpdateData,
  PasswordUpdateData,
  PasswordResetData
} from './AuthService';