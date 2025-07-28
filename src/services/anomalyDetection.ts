/**
 * Anomaly Detection Service
 * SECURITY: Detects unusual patterns and potential security threats
 */

import { securityLogger, SecurityEventType, SecurityEventSeverity } from './securityEventLogger';

interface AnomalyRule {
  name: string;
  description: string;
  check: (data: AnomalyCheckData) => boolean;
  severity: SecurityEventSeverity;
}

interface AnomalyCheckData {
  userId?: string;
  sessionId?: string;
  endpoint?: string;
  requestCount?: number;
  timeWindowMs?: number;
  errorRate?: number;
  dataSize?: number;
  loginAttempts?: number;
  apiKeyAccess?: number;
}

class AnomalyDetectionService {
  private static instance: AnomalyDetectionService;
  private requestHistory: Map<string, { timestamps: number[]; errors: number }> = new Map();
  private loginHistory: Map<string, number[]> = new Map();
  private apiKeyAccessHistory: Map<string, number[]> = new Map();
  
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
  
  private anomalyRules: AnomalyRule[] = [
    {
      name: 'Excessive Request Rate',
      description: 'User making too many requests in a short time',
      check: (data) => {
        if (!data.requestCount || !data.timeWindowMs) return false;
        const ratePerMinute = (data.requestCount / data.timeWindowMs) * 60000;
        return ratePerMinute > 100; // More than 100 requests per minute
      },
      severity: SecurityEventSeverity.WARNING
    },
    {
      name: 'High Error Rate',
      description: 'Unusually high error rate in requests',
      check: (data) => {
        if (!data.errorRate) return false;
        return data.errorRate > 0.5; // More than 50% errors
      },
      severity: SecurityEventSeverity.WARNING
    },
    {
      name: 'Excessive Login Attempts',
      description: 'Too many login attempts from same source',
      check: (data) => {
        if (!data.loginAttempts) return false;
        return data.loginAttempts > 5; // More than 5 failed attempts
      },
      severity: SecurityEventSeverity.CRITICAL
    },
    {
      name: 'Suspicious API Key Access',
      description: 'Unusual pattern of API key access',
      check: (data) => {
        if (!data.apiKeyAccess) return false;
        return data.apiKeyAccess > 10; // More than 10 accesses in time window
      },
      severity: SecurityEventSeverity.WARNING
    },
    {
      name: 'Large Data Transfer',
      description: 'Unusually large data being processed',
      check: (data) => {
        if (!data.dataSize) return false;
        return data.dataSize > 50 * 1024 * 1024; // More than 50MB
      },
      severity: SecurityEventSeverity.INFO
    }
  ];
  
  private constructor() {
    // Periodic cleanup
    setInterval(() => this.cleanupOldData(), this.CLEANUP_INTERVAL);
  }
  
  static getInstance(): AnomalyDetectionService {
    if (!AnomalyDetectionService.instance) {
      AnomalyDetectionService.instance = new AnomalyDetectionService();
    }
    return AnomalyDetectionService.instance;
  }
  
  /**
   * Track a request for anomaly detection
   */
  trackRequest(identifier: string, isError: boolean = false): void {
    const history = this.requestHistory.get(identifier) || { timestamps: [], errors: 0 };
    history.timestamps.push(Date.now());
    if (isError) history.errors++;
    this.requestHistory.set(identifier, history);
    
    // Check for anomalies
    this.checkRequestAnomalies(identifier);
  }
  
  /**
   * Track login attempts
   */
  trackLoginAttempt(identifier: string, success: boolean): void {
    if (!success) {
      const attempts = this.loginHistory.get(identifier) || [];
      attempts.push(Date.now());
      this.loginHistory.set(identifier, attempts);
      
      // Check for anomalies
      this.checkLoginAnomalies(identifier);
    } else {
      // Reset on successful login
      this.loginHistory.delete(identifier);
    }
  }
  
  /**
   * Track API key access
   */
  trackApiKeyAccess(userId: string): void {
    const accesses = this.apiKeyAccessHistory.get(userId) || [];
    accesses.push(Date.now());
    this.apiKeyAccessHistory.set(userId, accesses);
    
    // Check for anomalies
    this.checkApiKeyAnomalies(userId);
  }
  
  /**
   * Check for request anomalies
   */
  private checkRequestAnomalies(identifier: string): void {
    const history = this.requestHistory.get(identifier);
    if (!history) return;
    
    const now = Date.now();
    const timeWindow = 60000; // 1 minute
    const recentRequests = history.timestamps.filter(t => now - t < timeWindow);
    
    const checkData: AnomalyCheckData = {
      requestCount: recentRequests.length,
      timeWindowMs: timeWindow,
      errorRate: history.errors / history.timestamps.length
    };
    
    this.runAnomalyChecks(checkData, identifier);
  }
  
  /**
   * Check for login anomalies
   */
  private checkLoginAnomalies(identifier: string): void {
    const attempts = this.loginHistory.get(identifier) || [];
    const now = Date.now();
    const timeWindow = 15 * 60 * 1000; // 15 minutes
    const recentAttempts = attempts.filter(t => now - t < timeWindow);
    
    const checkData: AnomalyCheckData = {
      loginAttempts: recentAttempts.length
    };
    
    this.runAnomalyChecks(checkData, identifier);
  }
  
  /**
   * Check for API key access anomalies
   */
  private checkApiKeyAnomalies(userId: string): void {
    const accesses = this.apiKeyAccessHistory.get(userId) || [];
    const now = Date.now();
    const timeWindow = 5 * 60 * 1000; // 5 minutes
    const recentAccesses = accesses.filter(t => now - t < timeWindow);
    
    const checkData: AnomalyCheckData = {
      apiKeyAccess: recentAccesses.length,
      userId
    };
    
    this.runAnomalyChecks(checkData, userId);
  }
  
  /**
   * Run anomaly checks against rules
   */
  private runAnomalyChecks(data: AnomalyCheckData, identifier: string): void {
    for (const rule of this.anomalyRules) {
      if (rule.check(data)) {
        // Anomaly detected
        securityLogger.logEvent({
          event_type: SecurityEventType.ANOMALY_DETECTED,
          severity: rule.severity,
          details: {
            rule: rule.name,
            description: rule.description,
            identifier,
            data
          }
        });
      }
    }
  }
  
  /**
   * Check data size for anomalies
   */
  checkDataSize(dataSize: number, context: string): void {
    const checkData: AnomalyCheckData = { dataSize };
    
    for (const rule of this.anomalyRules) {
      if (rule.name === 'Large Data Transfer' && rule.check(checkData)) {
        securityLogger.logEvent({
          event_type: SecurityEventType.ANOMALY_DETECTED,
          severity: rule.severity,
          details: {
            rule: rule.name,
            context,
            dataSize
          }
        });
      }
    }
  }
  
  /**
   * Clean up old tracking data
   */
  private cleanupOldData(): void {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour
    
    // Clean request history
    for (const [id, history] of this.requestHistory.entries()) {
      history.timestamps = history.timestamps.filter(t => now - t < maxAge);
      if (history.timestamps.length === 0) {
        this.requestHistory.delete(id);
      }
    }
    
    // Clean login history
    for (const [id, attempts] of this.loginHistory.entries()) {
      const recent = attempts.filter(t => now - t < maxAge);
      if (recent.length === 0) {
        this.loginHistory.delete(id);
      } else {
        this.loginHistory.set(id, recent);
      }
    }
    
    // Clean API key access history
    for (const [id, accesses] of this.apiKeyAccessHistory.entries()) {
      const recent = accesses.filter(t => now - t < maxAge);
      if (recent.length === 0) {
        this.apiKeyAccessHistory.delete(id);
      } else {
        this.apiKeyAccessHistory.set(id, recent);
      }
    }
  }
  
  /**
   * Get current anomaly statistics
   */
  getAnomalyStats(): {
    activeMonitors: number;
    recentAnomalies: number;
    topOffenders: string[];
  } {
    const activeMonitors = 
      this.requestHistory.size + 
      this.loginHistory.size + 
      this.apiKeyAccessHistory.size;
    
    // Count users with high request counts
    const topOffenders: string[] = [];
    for (const [id, history] of this.requestHistory.entries()) {
      if (history.timestamps.length > 50) {
        topOffenders.push(id);
      }
    }
    
    return {
      activeMonitors,
      recentAnomalies: 0, // Would need to track this separately
      topOffenders: topOffenders.slice(0, 5)
    };
  }
}

// Export singleton instance
export const anomalyDetector = AnomalyDetectionService.getInstance();

// Helper functions
export const trackUserActivity = (userId: string, endpoint: string, isError: boolean = false) => {
  anomalyDetector.trackRequest(`${userId}-${endpoint}`, isError);
};

export const trackLoginAttempt = (identifier: string, success: boolean) => {
  anomalyDetector.trackLoginAttempt(identifier, success);
};

export const trackApiKeyAccess = (userId: string) => {
  anomalyDetector.trackApiKeyAccess(userId);
};

export const checkDataTransfer = (bytes: number, context: string) => {
  anomalyDetector.checkDataSize(bytes, context);
};