/**
 * Enhanced Session Management Service
 * SECURITY: Comprehensive session handling with security features
 */

import { supabase } from '@/integrations/supabase/client';
import { securityLogger, SecurityEventType, SecurityEventSeverity } from './securityEventLogger';
import { anomalyDetector } from './anomalyDetection';
import type { User, Session } from '@supabase/supabase-js';

interface SessionMetadata {
  user_agent: string;
  ip_address: string;
  login_time: string;
  last_activity: string;
  device_fingerprint: string;
  location?: string;
  risk_score: number;
}

interface SessionInfo {
  session: Session;
  metadata: SessionMetadata;
  isValid: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

class SessionManager {
  private static instance: SessionManager;
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private readonly IDLE_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
  private readonly SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  
  private constructor() {
    this.initializeSessionMonitoring();
  }
  
  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }
  
  /**
   * Initialize session monitoring
   */
  private initializeSessionMonitoring(): void {
    // Monitor session changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      await this.handleAuthStateChange(event, session);
    });
    
    // Periodic session validation
    this.sessionCheckInterval = setInterval(() => {
      this.validateCurrentSession();
    }, this.SESSION_CHECK_INTERVAL);
    
    // Activity tracking
    this.setupActivityTracking();
  }
  
  /**
   * Handle authentication state changes
   */
  private async handleAuthStateChange(event: string, session: Session | null): Promise<void> {
    try {
      switch (event) {
        case 'SIGNED_IN':
          if (session) {
            await this.handleSignIn(session);
          }
          break;
          
        case 'SIGNED_OUT':
          await this.handleSignOut();
          break;
          
        case 'TOKEN_REFRESHED':
          if (session) {
            await this.handleTokenRefresh(session);
          }
          break;
          
        case 'PASSWORD_RECOVERY':
          await this.handlePasswordRecovery();
          break;
      }
    } catch (error) {
      console.error('Session state change error:', error);
      securityLogger.logEvent({
        event_type: SecurityEventType.ERROR,
        severity: SecurityEventSeverity.ERROR,
        details: { event, error: error.message }
      });
    }
  }
  
  /**
   * Handle sign in
   */
  private async handleSignIn(session: Session): Promise<void> {
    const metadata = await this.createSessionMetadata(session);
    
    // Store session metadata
    await this.storeSessionMetadata(session.user.id, metadata);
    
    // Calculate risk score
    const riskLevel = this.calculateRiskScore(metadata);
    
    // Log successful login
    securityLogger.logEvent({
      event_type: SecurityEventType.LOGIN_SUCCESS,
      severity: SecurityEventSeverity.INFO,
      user_id: session.user.id,
      details: { riskLevel, metadata }
    });
    
    // Track for anomaly detection
    anomalyDetector.trackLoginAttempt(session.user.id, true);
    
    // Additional security checks for high-risk sessions
    if (riskLevel === 'high') {
      await this.handleHighRiskSession(session, metadata);
    }
  }
  
  /**
   * Handle sign out
   */
  private async handleSignOut(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      securityLogger.logEvent({
        event_type: SecurityEventType.LOGOUT,
        severity: SecurityEventSeverity.INFO,
        user_id: session.user.id
      });
      
      // Clean up session data
      await this.cleanupSessionData(session.user.id);
    }
  }
  
  /**
   * Handle token refresh
   */
  private async handleTokenRefresh(session: Session): Promise<void> {
    // Update last activity
    await this.updateLastActivity(session.user.id);
    
    // Validate session is still secure
    const sessionInfo = await this.getSessionInfo();
    if (sessionInfo && !sessionInfo.isValid) {
      await this.terminateSession('Session validation failed');
    }
  }
  
  /**
   * Handle password recovery
   */
  private async handlePasswordRecovery(): Promise<void> {
    securityLogger.logEvent({
      event_type: SecurityEventType.LOGIN_SUCCESS, // Password recovery attempt
      severity: SecurityEventSeverity.WARNING,
      details: { action: 'password_recovery' }
    });
  }
  
  /**
   * Create session metadata
   */
  private async createSessionMetadata(session: Session): Promise<SessionMetadata> {
    const userAgent = navigator.userAgent;
    const deviceFingerprint = await this.generateDeviceFingerprint();
    
    return {
      user_agent: userAgent,
      ip_address: await this.getClientIP(),
      login_time: new Date().toISOString(),
      last_activity: new Date().toISOString(),
      device_fingerprint: deviceFingerprint,
      location: await this.getApproximateLocation(),
      risk_score: 0 // Will be calculated
    };
  }
  
  /**
   * Generate device fingerprint
   */
  private async generateDeviceFingerprint(): Promise<string> {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 'unknown',
      navigator.deviceMemory || 'unknown'
    ];
    
    // Simple hash of components
    const fingerprint = btoa(components.join('|')).substring(0, 16);
    return fingerprint;
  }
  
  /**
   * Calculate risk score for session
   */
  private calculateRiskScore(metadata: SessionMetadata): 'low' | 'medium' | 'high' {
    let riskScore = 0;
    
    // Check for suspicious user agents
    if (metadata.user_agent.includes('bot') || metadata.user_agent.includes('crawler')) {
      riskScore += 50;
    }
    
    // Check for unusual activity times (placeholder - would need user history)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      riskScore += 10;
    }
    
    // Check for suspicious patterns (placeholder)
    // In a real implementation, this would check against known patterns
    
    if (riskScore > 30) return 'high';
    if (riskScore > 10) return 'medium';
    return 'low';
  }
  
  /**
   * Handle high-risk sessions
   */
  private async handleHighRiskSession(session: Session, metadata: SessionMetadata): Promise<void> {
    securityLogger.logEvent({
      event_type: SecurityEventType.ANOMALY_DETECTED,
      severity: SecurityEventSeverity.CRITICAL,
      user_id: session.user.id,
      details: {
        reason: 'high_risk_session',
        metadata,
        recommended_action: 'require_additional_verification'
      }
    });
    
    // In a real implementation, this might:
    // - Require additional verification
    // - Limit session capabilities
    // - Send security alerts
    // - Force password reset
  }
  
  /**
   * Get current session information
   */
  async getSessionInfo(): Promise<SessionInfo | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return null;
      }
      
      const metadata = await this.getSessionMetadata(session.user.id);
      if (!metadata) {
        return null;
      }
      
      const isValid = this.validateSession(session, metadata);
      const riskLevel = this.calculateRiskScore(metadata);
      
      return {
        session,
        metadata,
        isValid,
        riskLevel
      };
    } catch (error) {
      console.error('Failed to get session info:', error);
      return null;
    }
  }
  
  /**
   * Validate current session
   */
  private async validateCurrentSession(): Promise<void> {
    const sessionInfo = await this.getSessionInfo();
    
    if (!sessionInfo) {
      return; // No session to validate
    }
    
    if (!sessionInfo.isValid) {
      await this.terminateSession('Session validation failed');
      return;
    }
    
    // Update last activity
    await this.updateLastActivity(sessionInfo.session.user.id);
  }
  
  /**
   * Validate session against security rules
   */
  private validateSession(session: Session, metadata: SessionMetadata): boolean {
    const now = Date.now();
    const loginTime = new Date(metadata.login_time).getTime();
    const lastActivity = new Date(metadata.last_activity).getTime();
    
    // Check session timeout
    if (now - loginTime > this.SESSION_TIMEOUT) {
      securityLogger.logEvent({
        event_type: SecurityEventType.SESSION_EXPIRED,
        severity: SecurityEventSeverity.WARNING,
        user_id: session.user.id,
        details: { reason: 'session_timeout' }
      });
      return false;
    }
    
    // Check idle timeout
    if (now - lastActivity > this.IDLE_TIMEOUT) {
      securityLogger.logEvent({
        event_type: SecurityEventType.SESSION_EXPIRED,
        severity: SecurityEventSeverity.INFO,
        user_id: session.user.id,
        details: { reason: 'idle_timeout' }
      });
      return false;
    }
    
    // Check device fingerprint consistency
    const currentFingerprint = this.generateDeviceFingerprint();
    if (metadata.device_fingerprint !== currentFingerprint) {
      securityLogger.logEvent({
        event_type: SecurityEventType.ANOMALY_DETECTED,
        severity: SecurityEventSeverity.CRITICAL,
        user_id: session.user.id,
        details: { reason: 'device_fingerprint_mismatch' }
      });
      // In a real implementation, might require re-authentication
    }
    
    return true;
  }
  
  /**
   * Terminate session
   */
  async terminateSession(reason: string): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        securityLogger.logEvent({
          event_type: SecurityEventType.LOGOUT,
          severity: SecurityEventSeverity.WARNING,
          user_id: session.user.id,
          details: { reason, forced: true }
        });
      }
      
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Failed to terminate session:', error);
    }
  }
  
  /**
   * Setup activity tracking
   */
  private setupActivityTracking(): void {
    // Track mouse movement, clicks, keyboard activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const updateActivity = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await this.updateLastActivity(session.user.id);
      }
    };
    
    // Throttle activity updates to once per minute
    let lastUpdate = 0;
    const throttledUpdate = () => {
      const now = Date.now();
      if (now - lastUpdate > 60000) { // 1 minute
        lastUpdate = now;
        updateActivity();
      }
    };
    
    events.forEach(event => {
      document.addEventListener(event, throttledUpdate, { passive: true });
    });
  }
  
  /**
   * Store session metadata
   */
  private async storeSessionMetadata(userId: string, metadata: SessionMetadata): Promise<void> {
    // Store in session storage (encrypted in a real implementation)
    sessionStorage.setItem(`session-meta-${userId}`, JSON.stringify(metadata));
  }
  
  /**
   * Get session metadata
   */
  private async getSessionMetadata(userId: string): Promise<SessionMetadata | null> {
    try {
      const stored = sessionStorage.getItem(`session-meta-${userId}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
  
  /**
   * Update last activity timestamp
   */
  private async updateLastActivity(userId: string): Promise<void> {
    const metadata = await this.getSessionMetadata(userId);
    if (metadata) {
      metadata.last_activity = new Date().toISOString();
      await this.storeSessionMetadata(userId, metadata);
    }
  }
  
  /**
   * Clean up session data
   */
  private async cleanupSessionData(userId: string): Promise<void> {
    sessionStorage.removeItem(`session-meta-${userId}`);
  }
  
  /**
   * Get client IP (placeholder)
   */
  private async getClientIP(): Promise<string> {
    // In a real implementation, this would get the actual IP
    return 'client-ip-placeholder';
  }
  
  /**
   * Get approximate location (placeholder)
   */
  private async getApproximateLocation(): Promise<string | undefined> {
    // In a real implementation, this might use geolocation API
    return 'location-placeholder';
  }
  
  /**
   * Get session security metrics
   */
  async getSessionMetrics(): Promise<{
    activeSession: boolean;
    sessionAge: number;
    idleTime: number;
    riskLevel: 'low' | 'medium' | 'high';
    deviceTrusted: boolean;
  }> {
    const sessionInfo = await this.getSessionInfo();
    
    if (!sessionInfo) {
      return {
        activeSession: false,
        sessionAge: 0,
        idleTime: 0,
        riskLevel: 'low',
        deviceTrusted: false
      };
    }
    
    const now = Date.now();
    const loginTime = new Date(sessionInfo.metadata.login_time).getTime();
    const lastActivity = new Date(sessionInfo.metadata.last_activity).getTime();
    
    return {
      activeSession: true,
      sessionAge: now - loginTime,
      idleTime: now - lastActivity,
      riskLevel: sessionInfo.riskLevel,
      deviceTrusted: sessionInfo.riskLevel === 'low'
    };
  }
  
  /**
   * Force session refresh
   */
  async refreshSession(): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh failed:', error);
        return false;
      }
      
      return !!data.session;
    } catch (error) {
      console.error('Session refresh error:', error);
      return false;
    }
  }
  
  /**
   * Cleanup on page unload
   */
  cleanup(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    sessionManager.cleanup();
  });
}

// Helper functions
export const getCurrentSessionInfo = () => sessionManager.getSessionInfo();
export const getSessionMetrics = () => sessionManager.getSessionMetrics();
export const terminateCurrentSession = (reason: string) => sessionManager.terminateSession(reason);
export const refreshCurrentSession = () => sessionManager.refreshSession();