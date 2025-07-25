/**
 * Protected Route Component
 * SECURITY: Enforces authentication for sensitive routes
 */

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { sessionManager } from '@/services/sessionManager';
import { securityLogger, SecurityEventType, SecurityEventSeverity } from '@/services/securityEventLogger';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { User } from '@supabase/supabase-js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'USER' | 'RESEARCHER' | 'PREMIUM' | 'ADMIN' | 'SUPER_ADMIN';
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole = 'USER',
  redirectTo = '/auth'
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          setAuthError('Authentication system error');
          return;
        }

        if (!session?.user) {
          // No authenticated user
          securityLogger.logEvent({
            event_type: SecurityEventType.ACCESS_DENIED,
            severity: SecurityEventSeverity.WARNING,
            details: {
              reason: 'no_authentication',
              attempted_route: location.pathname,
              timestamp: new Date().toISOString()
            }
          });
          
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        // Validate session security
        const sessionInfo = await sessionManager.getSessionInfo();
        if (!sessionInfo?.isValid) {
          securityLogger.logEvent({
            event_type: SecurityEventType.SESSION_EXPIRED,
            severity: SecurityEventSeverity.WARNING,
            user_id: session.user.id,
            details: {
              reason: 'invalid_session',
              attempted_route: location.pathname
            }
          });
          
          // Force logout for invalid session
          await supabase.auth.signOut();
          if (mounted) {
            setAuthError('Session expired. Please log in again.');
            setUser(null);
            setLoading(false);
          }
          return;
        }

        // Check session risk level
        if (sessionInfo.riskLevel === 'high') {
          securityLogger.logEvent({
            event_type: SecurityEventType.ANOMALY_DETECTED,
            severity: SecurityEventSeverity.CRITICAL,
            user_id: session.user.id,
            details: {
              reason: 'high_risk_session',
              attempted_route: location.pathname,
              recommended_action: 'require_reauthentication'
            }
          });
          
          if (mounted) {
            setAuthError('Security verification required. Please log in again.');
            setUser(null);
            setLoading(false);
          }
          return;
        }

        // TODO: Implement role-based authorization check
        // For now, allow all authenticated users
        // In production, check user role against requiredRole

        // Log successful access
        securityLogger.logEvent({
          event_type: SecurityEventType.ACCESS_GRANTED,
          severity: SecurityEventSeverity.INFO,
          user_id: session.user.id,
          details: {
            route: location.pathname,
            required_role: requiredRole,
            session_risk: sessionInfo.riskLevel
          }
        });

        if (mounted) {
          setUser(session.user);
          setLoading(false);
        }

      } catch (error) {
        console.error('Authentication check failed:', error);
        
        securityLogger.logEvent({
          event_type: SecurityEventType.ERROR,
          severity: SecurityEventSeverity.ERROR,
          details: {
            error: error.message,
            context: 'protected_route_auth_check',
            attempted_route: location.pathname
          }
        });

        if (mounted) {
          setAuthError('Authentication system error');
          setLoading(false);
        }
      }
    };

    // Initial auth check
    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state change:', event);
        
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setAuthError(null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Re-run auth check on sign in or token refresh
          await checkAuth();
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [location.pathname, requiredRole]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg font-medium text-gray-700">Verifying authentication...</p>
          <p className="text-sm text-gray-500 mt-2">Securing your access</p>
        </div>
      </div>
    );
  }

  // Authentication error
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="max-w-md w-full mx-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Authentication Error:</strong> {authError}
            </AlertDescription>
          </Alert>
          <div className="mt-6 text-center">
            <a 
              href="/auth" 
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Shield className="h-4 w-4 mr-2" />
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // User is authenticated and authorized
  return <>{children}</>;
};

export default ProtectedRoute;