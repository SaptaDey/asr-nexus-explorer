/**
 * CSRF Protection Utilities
 * SIMPLIFIED: Uses static imports to prevent temporal dead zone issues
 */

import React from 'react';
import { secureHash } from './securityUtils';
import { supabase } from '@/integrations/supabase/client';

class CSRFProtection {
  private static instance: CSRFProtection;
  private tokens: Map<string, { token: string; expires: number }> = new Map();
  private readonly TOKEN_EXPIRY = 30 * 60 * 1000; // 30 minutes
  
  private constructor() {}
  
  static getInstance(): CSRFProtection {
    if (!CSRFProtection.instance) {
      CSRFProtection.instance = new CSRFProtection();
    }
    return CSRFProtection.instance;
  }
  
  /**
   * Generate a new CSRF token for a session
   */
  async generateToken(sessionId: string): Promise<string> {
    // Clean up expired tokens
    this.cleanupExpiredTokens();
    
    // Generate new token
    const randomData = crypto.getRandomValues(new Uint8Array(32));
    const tokenData = `${sessionId}-${Date.now()}-${Array.from(randomData).join('')}`;
    const token = await secureHash(tokenData);
    
    // Store token with expiry
    this.tokens.set(sessionId, {
      token,
      expires: Date.now() + this.TOKEN_EXPIRY
    });
    
    return token;
  }
  
  /**
   * Validate a CSRF token
   */
  validateToken(sessionId: string, token: string): boolean {
    const storedData = this.tokens.get(sessionId);
    
    if (!storedData) {
      console.warn('SECURITY: CSRF token not found for session', sessionId);
      return false;
    }
    
    if (Date.now() > storedData.expires) {
      console.warn('SECURITY: CSRF token expired for session', sessionId);
      this.tokens.delete(sessionId);
      return false;
    }
    
    if (storedData.token !== token) {
      console.warn('SECURITY: CSRF token mismatch for session', sessionId);
      return false;
    }
    
    return true;
  }
  
  /**
   * Refresh token expiry on successful validation
   */
  refreshToken(sessionId: string): void {
    const storedData = this.tokens.get(sessionId);
    if (storedData) {
      storedData.expires = Date.now() + this.TOKEN_EXPIRY;
    }
  }
  
  /**
   * Remove token for a session
   */
  removeToken(sessionId: string): void {
    this.tokens.delete(sessionId);
  }
  
  /**
   * Clean up expired tokens
   */
  private cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [sessionId, data] of this.tokens.entries()) {
      if (now > data.expires) {
        this.tokens.delete(sessionId);
      }
    }
  }
}

// Export singleton instance methods
export const csrfProtection = CSRFProtection.getInstance();

/**
 * CSRF Middleware for API requests
 */
export const addCSRFHeader = async (headers: Headers, sessionId: string): Promise<Headers> => {
  const token = await csrfProtection.generateToken(sessionId);
  headers.set('X-CSRF-Token', token);
  return headers;
};

/**
 * Verify CSRF token from request headers
 */
export const verifyCSRFToken = (headers: Headers, sessionId: string): boolean => {
  const token = headers.get('X-CSRF-Token');
  
  if (!token) {
    console.error('SECURITY: Missing CSRF token in request');
    return false;
  }
  
  return csrfProtection.validateToken(sessionId, token);
};

/**
 * React hook for CSRF protection
 */
export const useCSRFToken = () => {
  const [csrfToken, setCSRFToken] = React.useState<string>('');
  
  React.useEffect(() => {
    const initializeToken = async () => {
      try {
        // Get session ID from auth context or generate a temporary one
        const sessionId = await getSessionId();
        const token = await csrfProtection.generateToken(sessionId);
        setCSRFToken(token);
      } catch (error) {
        console.error('Failed to initialize CSRF token:', error);
      }
    };
    
    initializeToken();
    
    // Refresh token every 25 minutes
    const refreshInterval = setInterval(() => {
      initializeToken();
    }, 25 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);
  
  return csrfToken;
};

/**
 * Get session ID for CSRF token generation
 */
async function getSessionId(): Promise<string> {
  // Try to get from Supabase auth
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch (error) {
    console.warn('Failed to get session from Supabase:', error);
  }
  
  // Fallback to browser session storage
  let sessionId = sessionStorage.getItem('csrf-session-id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('csrf-session-id', sessionId);
  }
  
  return sessionId;
}

/**
 * Axios-style interceptor for fetch requests
 */
export const setupCSRFInterceptor = () => {
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const [url, options = {}] = args;
    
    // Only add CSRF for same-origin requests
    try {
      const requestUrl = new URL(url, window.location.origin);
      if (requestUrl.origin === window.location.origin) {
        // Get session ID
        const sessionId = await getSessionId();
        
        // Add CSRF token to headers
        const headers = new Headers(options.headers || {});
        await addCSRFHeader(headers, sessionId);
        
        options.headers = headers;
      }
    } catch (error) {
      console.warn('CSRF interceptor error:', error);
    }
    
    return originalFetch.apply(this, [url, options]);
  };
};

// Auto-setup CSRF interceptor when module loads
if (typeof window !== 'undefined') {
  setupCSRFInterceptor();
}