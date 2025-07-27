/**
 * ErrorLoggingService - Comprehensive error logging for ASR-GoT
 * Provides multiple transport methods for error logging that Claude Code can access
 */

import { supabase } from '@/integrations/supabase/client';

export interface ErrorLogEntry {
  // Error Classification
  error_type: 'javascript' | 'network' | 'database' | 'auth' | 'validation' | 'component' | 'api';
  severity: 'info' | 'warning' | 'error' | 'critical';
  category?: string;
  
  // Error Details
  message: string;
  stack?: string;
  error_code?: string;
  
  // Context Information
  url?: string;
  user_agent?: string;
  user_id?: string;
  session_id?: string;
  
  // Technical Context
  component_name?: string;
  function_name?: string;
  line_number?: number;
  column_number?: number;
  
  // ASR-GoT Specific Context
  stage_id?: string;
  research_session_id?: string;
  parameter_set?: Record<string, any>;
  
  // Browser/Environment Context
  browser_info?: Record<string, any>;
  screen_resolution?: string;
  viewport_size?: string;
  
  // Request Context (for API errors)
  request_url?: string;
  request_method?: string;
  request_headers?: Record<string, any>;
  response_status?: number;
  response_body?: string;
  
  // Additional Metadata
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface ErrorPattern {
  error_pattern: string;
  occurrence_count: number;
  latest_occurrence: string;
  affected_components: string[];
  affected_stages: string[];
}

class ErrorLoggingService {
  private sessionId: string;
  private isOnline: boolean = navigator.onLine;
  private offlineQueue: ErrorLogEntry[] = [];
  private maxQueueSize: number = 100;
  
  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupEventListeners();
    this.initializeGlobalErrorHandlers();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupEventListeners(): void {
    // Online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushOfflineQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private initializeGlobalErrorHandlers(): void {
    // Global JavaScript error handler
    window.addEventListener('error', (event) => {
      this.logError({
        error_type: 'javascript',
        severity: 'error',
        category: 'global_error',
        message: event.message,
        stack: event.error?.stack,
        component_name: 'window',
        function_name: 'global',
        line_number: event.lineno,
        column_number: event.colno,
        url: event.filename,
        tags: ['global', 'unhandled']
      });
    });

    // Global unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        error_type: 'javascript',
        severity: 'error',
        category: 'unhandled_promise',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        component_name: 'window',
        function_name: 'promise',
        tags: ['global', 'promise', 'unhandled']
      });
    });
  }

  /**
   * Main error logging method with multiple transport fallbacks
   */
  async logError(errorEntry: Partial<ErrorLogEntry>): Promise<void> {
    try {
      // Enrich error entry with default context
      const enrichedEntry = this.enrichErrorEntry(errorEntry);
      
      if (this.isOnline) {
        // Primary: Supabase logging
        await this.logToSupabase(enrichedEntry);
        
        // Secondary: Console logging for development
        this.logToConsole(enrichedEntry);
        
        // Tertiary: Local storage backup
        this.logToLocalStorage(enrichedEntry);
      } else {
        // Offline: Queue for later
        this.queueForOffline(enrichedEntry);
        this.logToConsole(enrichedEntry);
        this.logToLocalStorage(enrichedEntry);
      }
    } catch (error) {
      console.error('ErrorLoggingService: Failed to log error:', error);
      // Fallback to console only
      console.error('Original error:', errorEntry);
    }
  }

  private enrichErrorEntry(entry: Partial<ErrorLogEntry>): ErrorLogEntry {
    const now = new Date();
    
    return {
      error_type: entry.error_type || 'javascript',
      severity: entry.severity || 'error',
      message: entry.message || 'Unknown error',
      url: entry.url || window.location.href,
      user_agent: entry.user_agent || navigator.userAgent,
      session_id: entry.session_id || this.sessionId,
      browser_info: entry.browser_info || this.getBrowserInfo(),
      screen_resolution: entry.screen_resolution || `${screen.width}x${screen.height}`,
      viewport_size: entry.viewport_size || `${window.innerWidth}x${window.innerHeight}`,
      metadata: {
        ...entry.metadata,
        timestamp: now.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        logged_at: now.getTime()
      },
      tags: entry.tags || [],
      ...entry
    };
  }

  private getBrowserInfo(): Record<string, any> {
    return {
      language: navigator.language,
      languages: navigator.languages,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      userAgent: navigator.userAgent,
      vendor: navigator.vendor,
      memory: (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null
    };
  }

  /**
   * Primary transport: Supabase database
   */
  private async logToSupabase(entry: ErrorLogEntry): Promise<void> {
    try {
      const { error } = await supabase
        .from('error_logs')
        .insert([entry]);
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.warn('Failed to log to Supabase:', error);
      throw error;
    }
  }

  /**
   * Secondary transport: Console logging
   */
  private logToConsole(entry: ErrorLogEntry): void {
    const prefix = `[${entry.severity.toUpperCase()}] ${entry.error_type}:`;
    const context = entry.component_name ? ` (${entry.component_name})` : '';
    
    switch (entry.severity) {
      case 'critical':
        console.error(`🚨 ${prefix}${context}`, entry.message, entry);
        break;
      case 'error':
        console.error(`❌ ${prefix}${context}`, entry.message, entry);
        break;
      case 'warning':
        console.warn(`⚠️ ${prefix}${context}`, entry.message, entry);
        break;
      case 'info':
        console.info(`ℹ️ ${prefix}${context}`, entry.message, entry);
        break;
    }
  }

  /**
   * Tertiary transport: Local storage backup
   */
  private logToLocalStorage(entry: ErrorLogEntry): void {
    try {
      const key = 'asr_error_logs';
      const existing = localStorage.getItem(key);
      const logs = existing ? JSON.parse(existing) : [];
      
      logs.push({
        ...entry,
        stored_at: Date.now()
      });
      
      // Keep only last 50 errors in localStorage
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }
      
      localStorage.setItem(key, JSON.stringify(logs));
    } catch (error) {
      console.warn('Failed to store error in localStorage:', error);
    }
  }

  /**
   * Offline queue management
   */
  private queueForOffline(entry: ErrorLogEntry): void {
    this.offlineQueue.push(entry);
    
    // Limit queue size
    if (this.offlineQueue.length > this.maxQueueSize) {
      this.offlineQueue.shift();
    }
  }

  private async flushOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) return;
    
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];
    
    for (const entry of queue) {
      try {
        await this.logToSupabase(entry);
      } catch (error) {
        // Re-queue failed entries
        this.offlineQueue.push(entry);
      }
    }
  }

  /**
   * Claude Code access methods
   */
  
  /**
   * Get recent errors for Claude Code debugging
   */
  async getRecentErrors(hours: number = 24, limit: number = 100): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch recent errors:', error);
      return [];
    }
  }

  /**
   * Get error patterns for analysis
   */
  async getErrorPatterns(hours: number = 24, minOccurrences: number = 3): Promise<ErrorPattern[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_error_patterns', { 
          hours_back: hours, 
          min_occurrences: minOccurrences 
        });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch error patterns:', error);
      return [];
    }
  }

  /**
   * Get critical errors
   */
  async getCriticalErrors(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('recent_critical_errors')
        .select('*');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch critical errors:', error);
      return [];
    }
  }

  /**
   * Get errors by component
   */
  async getErrorsByComponent(componentName: string, hours: number = 24): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .eq('component_name', componentName)
        .gte('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch errors by component:', error);
      return [];
    }
  }

  /**
   * Get local storage errors (offline fallback)
   */
  getLocalStorageErrors(): any[] {
    try {
      const stored = localStorage.getItem('asr_error_logs');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to read local storage errors:', error);
      return [];
    }
  }

  /**
   * Export all errors for Claude Code analysis
   */
  async exportErrorsForDebugging(hours: number = 48): Promise<{
    recent_errors: any[];
    patterns: ErrorPattern[];
    critical_errors: any[];
    local_errors: any[];
    summary: any;
  }> {
    const [recentErrors, patterns, criticalErrors] = await Promise.all([
      this.getRecentErrors(hours),
      this.getErrorPatterns(hours),
      this.getCriticalErrors()
    ]);
    
    const localErrors = this.getLocalStorageErrors();
    
    return {
      recent_errors: recentErrors,
      patterns,
      critical_errors: criticalErrors,
      local_errors: localErrors,
      summary: {
        total_recent_errors: recentErrors.length,
        total_patterns: patterns.length,
        total_critical: criticalErrors.length,
        total_local: localErrors.length,
        export_timestamp: new Date().toISOString(),
        timeframe_hours: hours
      }
    };
  }

  /**
   * Helper methods for specific error types
   */
  
  logComponentError(componentName: string, error: Error, additionalContext?: any): void {
    this.logError({
      error_type: 'component',
      severity: 'error',
      category: 'component_error',
      message: error.message,
      stack: error.stack,
      component_name: componentName,
      metadata: additionalContext,
      tags: ['component', 'react']
    });
  }

  logAPIError(url: string, method: string, status: number, responseBody: string, error?: Error): void {
    this.logError({
      error_type: 'api',
      severity: status >= 500 ? 'critical' : 'error',
      category: 'api_error',
      message: error?.message || `API Error: ${status}`,
      stack: error?.stack,
      request_url: url,
      request_method: method,
      response_status: status,
      response_body: responseBody,
      tags: ['api', 'network']
    });
  }

  logASRGoTStageError(stageId: string, error: Error, parameters?: any): void {
    this.logError({
      error_type: 'javascript',
      severity: 'error',
      category: 'asr_got_stage',
      message: error.message,
      stack: error.stack,
      stage_id: stageId,
      parameter_set: parameters,
      tags: ['asr-got', 'stage', stageId]
    });
  }

  logAuthError(error: Error, context?: string): void {
    this.logError({
      error_type: 'auth',
      severity: 'error',
      category: 'authentication',
      message: error.message,
      stack: error.stack,
      metadata: { context },
      tags: ['auth', 'security']
    });
  }

  logDatabaseError(error: Error, operation?: string): void {
    this.logError({
      error_type: 'database',
      severity: 'critical',
      category: 'database_error',
      message: error.message,
      stack: error.stack,
      metadata: { operation },
      tags: ['database', 'supabase']
    });
  }
}

// Export singleton instance
export const errorLogger = new ErrorLoggingService();