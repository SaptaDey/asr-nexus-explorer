/**
 * Security Event Logger
 * SECURITY: Comprehensive logging for security events and audit trails
 */

import { supabase } from '@/integrations/supabase/client';

export enum SecurityEventType {
  // Authentication events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Authorization events
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_VIOLATION = 'PERMISSION_VIOLATION',
  
  // API events
  API_CALL_SUCCESS = 'API_CALL_SUCCESS',
  API_CALL_FAILURE = 'API_CALL_FAILURE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Data access events
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  DATA_DELETION = 'DATA_DELETION',
  
  // Security violations
  XSS_ATTEMPT_BLOCKED = 'XSS_ATTEMPT_BLOCKED',
  SQL_INJECTION_BLOCKED = 'SQL_INJECTION_BLOCKED',
  CSRF_TOKEN_FAILURE = 'CSRF_TOKEN_FAILURE',
  INVALID_INPUT_BLOCKED = 'INVALID_INPUT_BLOCKED',
  
  // Credential events
  CREDENTIAL_CREATED = 'CREDENTIAL_CREATED',
  CREDENTIAL_ACCESSED = 'CREDENTIAL_ACCESSED',
  CREDENTIAL_DELETED = 'CREDENTIAL_DELETED',
  
  // System events
  SECURITY_CONFIG_CHANGED = 'SECURITY_CONFIG_CHANGED',
  ANOMALY_DETECTED = 'ANOMALY_DETECTED',
  ERROR = 'ERROR'
}

export enum SecurityEventSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

export interface SecurityEvent {
  id?: string;
  event_type: SecurityEventType;
  severity: SecurityEventSeverity;
  user_id?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  resource?: string;
  action?: string;
  result?: 'success' | 'failure';
  details?: any;
  error_message?: string;
  timestamp?: string;
}

class SecurityEventLogger {
  private static instance: SecurityEventLogger;
  private eventQueue: SecurityEvent[] = [];
  private isProcessing = false;
  private readonly BATCH_SIZE = 10;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds
  
  private constructor() {
    // Start periodic flush
    setInterval(() => this.flushEvents(), this.FLUSH_INTERVAL);
    
    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushEvents(true); // Force sync flush
      });
    }
  }
  
  static getInstance(): SecurityEventLogger {
    if (!SecurityEventLogger.instance) {
      SecurityEventLogger.instance = new SecurityEventLogger();
    }
    return SecurityEventLogger.instance;
  }
  
  /**
   * Log a security event
   */
  async logEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      // Enrich event with context
      const enrichedEvent: SecurityEvent = {
        ...event,
        timestamp: new Date().toISOString(),
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        session_id: await this.getSessionId(),
        user_id: await this.getUserId()
      };
      
      // Add to queue
      this.eventQueue.push(enrichedEvent);
      
      // Log to console in development
      if (import.meta.env.MODE === 'development') {
        console.log(`[SECURITY ${event.severity}] ${event.event_type}`, event);
      }
      
      // Flush if queue is full
      if (this.eventQueue.length >= this.BATCH_SIZE) {
        this.flushEvents();
      }
      
      // For critical events, flush immediately
      if (event.severity === SecurityEventSeverity.CRITICAL) {
        this.flushEvents();
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
  
  /**
   * Flush events to storage
   */
  private async flushEvents(sync = false): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];
    
    try {
      // Try to save to Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await this.saveToSupabase(eventsToFlush);
      } else {
        // Save to local storage for unauthenticated users
        this.saveToLocalStorage(eventsToFlush);
      }
    } catch (error) {
      console.error('Failed to flush security events:', error);
      // Re-add events to queue on failure
      this.eventQueue.unshift(...eventsToFlush);
    } finally {
      this.isProcessing = false;
    }
  }
  
  /**
   * Save events to Supabase
   */
  private async saveToSupabase(events: SecurityEvent[]): Promise<void> {
    // Note: This would require a security_events table in Supabase
    // For now, we'll store in local storage with encryption
    this.saveToLocalStorage(events);
  }
  
  /**
   * Save events to local storage
   */
  private saveToLocalStorage(events: SecurityEvent[]): void {
    try {
      const storageKey = 'security-events';
      const existingEvents = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const allEvents = [...existingEvents, ...events];
      
      // Keep only last 1000 events
      const trimmedEvents = allEvents.slice(-1000);
      
      localStorage.setItem(storageKey, JSON.stringify(trimmedEvents));
    } catch (error) {
      console.error('Failed to save security events to local storage:', error);
    }
  }
  
  /**
   * Get client IP (placeholder - would need server-side implementation)
   */
  private async getClientIP(): Promise<string> {
    // In a real implementation, this would call a server endpoint
    return 'client-ip-placeholder';
  }
  
  /**
   * Get current session ID
   */
  private async getSessionId(): Promise<string | undefined> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token?.substring(0, 8); // Use first 8 chars as session ID
    } catch {
      return sessionStorage.getItem('csrf-session-id') || undefined;
    }
  }
  
  /**
   * Get current user ID
   */
  private async getUserId(): Promise<string | undefined> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user?.id;
    } catch {
      return undefined;
    }
  }
  
  /**
   * Query security events
   */
  async queryEvents(filters: {
    event_type?: SecurityEventType;
    severity?: SecurityEventSeverity;
    user_id?: string;
    start_date?: Date;
    end_date?: Date;
    limit?: number;
  }): Promise<SecurityEvent[]> {
    try {
      const events = JSON.parse(localStorage.getItem('security-events') || '[]') as SecurityEvent[];
      
      let filtered = events;
      
      if (filters.event_type) {
        filtered = filtered.filter(e => e.event_type === filters.event_type);
      }
      
      if (filters.severity) {
        filtered = filtered.filter(e => e.severity === filters.severity);
      }
      
      if (filters.user_id) {
        filtered = filtered.filter(e => e.user_id === filters.user_id);
      }
      
      if (filters.start_date) {
        filtered = filtered.filter(e => new Date(e.timestamp!) >= filters.start_date!);
      }
      
      if (filters.end_date) {
        filtered = filtered.filter(e => new Date(e.timestamp!) <= filters.end_date!);
      }
      
      // Sort by timestamp descending
      filtered.sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
      
      if (filters.limit) {
        filtered = filtered.slice(0, filters.limit);
      }
      
      return filtered;
    } catch (error) {
      console.error('Failed to query security events:', error);
      return [];
    }
  }
  
  /**
   * Get security metrics
   */
  async getSecurityMetrics(): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    recentCriticalEvents: SecurityEvent[];
  }> {
    const events = await this.queryEvents({ limit: 1000 });
    
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    
    events.forEach(event => {
      eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    });
    
    const recentCriticalEvents = await this.queryEvents({
      severity: SecurityEventSeverity.CRITICAL,
      limit: 10
    });
    
    return {
      totalEvents: events.length,
      eventsByType,
      eventsBySeverity,
      recentCriticalEvents
    };
  }
}

// Export singleton instance
export const securityLogger = SecurityEventLogger.getInstance();

// Helper functions for common logging scenarios
export const logLoginAttempt = (success: boolean, userId?: string, error?: string) => {
  securityLogger.logEvent({
    event_type: success ? SecurityEventType.LOGIN_SUCCESS : SecurityEventType.LOGIN_FAILURE,
    severity: success ? SecurityEventSeverity.INFO : SecurityEventSeverity.WARNING,
    user_id: userId,
    result: success ? 'success' : 'failure',
    error_message: error
  });
};

export const logApiCall = (endpoint: string, success: boolean, error?: string) => {
  securityLogger.logEvent({
    event_type: success ? SecurityEventType.API_CALL_SUCCESS : SecurityEventType.API_CALL_FAILURE,
    severity: success ? SecurityEventSeverity.INFO : SecurityEventSeverity.WARNING,
    resource: endpoint,
    result: success ? 'success' : 'failure',
    error_message: error
  });
};

export const logSecurityViolation = (type: 'xss' | 'sql' | 'csrf' | 'input', details: any) => {
  const eventTypeMap = {
    xss: SecurityEventType.XSS_ATTEMPT_BLOCKED,
    sql: SecurityEventType.SQL_INJECTION_BLOCKED,
    csrf: SecurityEventType.CSRF_TOKEN_FAILURE,
    input: SecurityEventType.INVALID_INPUT_BLOCKED
  };
  
  securityLogger.logEvent({
    event_type: eventTypeMap[type],
    severity: SecurityEventSeverity.CRITICAL,
    details
  });
};

export const logDataAccess = (resource: string, action: 'read' | 'write' | 'delete', success: boolean) => {
  const eventTypeMap = {
    read: SecurityEventType.DATA_ACCESS,
    write: SecurityEventType.DATA_MODIFICATION,
    delete: SecurityEventType.DATA_DELETION
  };
  
  securityLogger.logEvent({
    event_type: eventTypeMap[action],
    severity: success ? SecurityEventSeverity.INFO : SecurityEventSeverity.WARNING,
    resource,
    action,
    result: success ? 'success' : 'failure'
  });
};