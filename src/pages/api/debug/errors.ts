/**
 * Debug API Endpoint for Claude Code Error Access
 * Provides structured error data exports for debugging
 */

import { errorLogger } from '@/services/ErrorLoggingService';
import { supabase } from '@/integrations/supabase/client';

interface DebugRequest {
  action: 'recent' | 'patterns' | 'critical' | 'component' | 'export' | 'summary';
  params?: {
    hours?: number;
    limit?: number;
    component?: string;
    stage?: string;
    severity?: string;
    category?: string;
  };
}

interface DebugResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
  request_id: string;
}

/**
 * Main debug endpoint handler
 */
export async function handleDebugRequest(request: DebugRequest): Promise<DebugResponse> {
  const requestId = `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    let data: any = null;
    
    switch (request.action) {
      case 'recent':
        data = await getRecentErrors(request.params);
        break;
        
      case 'patterns':
        data = await getErrorPatterns(request.params);
        break;
        
      case 'critical':
        data = await getCriticalErrors();
        break;
        
      case 'component':
        data = await getComponentErrors(request.params);
        break;
        
      case 'export':
        data = await getFullErrorExport(request.params);
        break;
        
      case 'summary':
        data = await getErrorSummary(request.params);
        break;
        
      default:
        throw new Error(`Unknown action: ${request.action}`);
    }
    
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      request_id: requestId
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      request_id: requestId
    };
  }
}

/**
 * Get recent errors with filtering
 */
async function getRecentErrors(params?: any): Promise<any> {
  const hours = params?.hours || 24;
  const limit = params?.limit || 100;
  const severity = params?.severity;
  const category = params?.category;
  
  try {
    let query = supabase
      .from('error_logs')
      .select('*')
      .gte('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (severity) {
      query = query.eq('severity', severity);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return {
      errors: data || [],
      count: data?.length || 0,
      timeframe_hours: hours,
      filters: { severity, category }
    };
    
  } catch (error) {
    // Fallback to localStorage
    const localErrors = errorLogger.getLocalStorageErrors();
    return {
      errors: localErrors.slice(0, limit),
      count: localErrors.length,
      timeframe_hours: hours,
      source: 'localStorage',
      note: 'Database unavailable, showing local errors'
    };
  }
}

/**
 * Get error patterns
 */
async function getErrorPatterns(params?: any): Promise<any> {
  const hours = params?.hours || 24;
  const minOccurrences = params?.limit || 3;
  
  try {
    const patterns = await errorLogger.getErrorPatterns(hours, minOccurrences);
    
    return {
      patterns,
      count: patterns.length,
      timeframe_hours: hours,
      min_occurrences: minOccurrences
    };
    
  } catch (error) {
    return {
      patterns: [],
      count: 0,
      error: 'Failed to fetch patterns from database'
    };
  }
}

/**
 * Get critical errors
 */
async function getCriticalErrors(): Promise<any> {
  try {
    const critical = await errorLogger.getCriticalErrors();
    
    return {
      critical_errors: critical,
      count: critical.length
    };
    
  } catch (error) {
    return {
      critical_errors: [],
      count: 0,
      error: 'Failed to fetch critical errors'
    };
  }
}

/**
 * Get errors by component
 */
async function getComponentErrors(params?: any): Promise<any> {
  const component = params?.component;
  const hours = params?.hours || 24;
  
  if (!component) {
    throw new Error('Component name is required');
  }
  
  try {
    const errors = await errorLogger.getErrorsByComponent(component, hours);
    
    return {
      component_name: component,
      errors,
      count: errors.length,
      timeframe_hours: hours
    };
    
  } catch (error) {
    return {
      component_name: component,
      errors: [],
      count: 0,
      error: 'Failed to fetch component errors'
    };
  }
}

/**
 * Get full error export for comprehensive debugging
 */
async function getFullErrorExport(params?: any): Promise<any> {
  const hours = params?.hours || 48;
  
  try {
    const exportData = await errorLogger.exportErrorsForDebugging(hours);
    
    // Add additional debugging context
    const enhanced = {
      ...exportData,
      debugging_context: {
        browser_info: getBrowserInfo(),
        environment: getEnvironmentInfo(),
        performance_metrics: getPerformanceMetrics(),
        storage_info: getStorageInfo()
      }
    };
    
    return enhanced;
    
  } catch (error) {
    return {
      error: 'Failed to generate full export',
      fallback_data: {
        local_errors: errorLogger.getLocalStorageErrors(),
        debugging_context: {
          browser_info: getBrowserInfo(),
          environment: getEnvironmentInfo()
        }
      }
    };
  }
}

/**
 * Get error summary with analytics
 */
async function getErrorSummary(params?: any): Promise<any> {
  const hours = params?.hours || 24;
  
  try {
    const { data: errors, error } = await supabase
      .from('error_logs')
      .select('error_type, severity, category, created_at, component_name, stage_id')
      .gte('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString());
    
    if (error) throw error;
    
    const summary = analyzeErrors(errors || []);
    
    return {
      ...summary,
      timeframe_hours: hours,
      total_errors: errors?.length || 0
    };
    
  } catch (error) {
    const localErrors = errorLogger.getLocalStorageErrors();
    const summary = analyzeErrors(localErrors);
    
    return {
      ...summary,
      timeframe_hours: hours,
      total_errors: localErrors.length,
      source: 'localStorage'
    };
  }
}

/**
 * Analyze errors for patterns and insights
 */
function analyzeErrors(errors: any[]): any {
  const analysis = {
    by_type: {} as Record<string, number>,
    by_severity: {} as Record<string, number>,
    by_category: {} as Record<string, number>,
    by_component: {} as Record<string, number>,
    by_stage: {} as Record<string, number>,
    by_hour: {} as Record<string, number>,
    trends: {
      most_frequent_error: '',
      most_affected_component: '',
      most_problematic_stage: '',
      error_rate_trend: 'stable'
    }
  };
  
  errors.forEach(error => {
    // Count by type
    analysis.by_type[error.error_type] = (analysis.by_type[error.error_type] || 0) + 1;
    
    // Count by severity
    analysis.by_severity[error.severity] = (analysis.by_severity[error.severity] || 0) + 1;
    
    // Count by category
    if (error.category) {
      analysis.by_category[error.category] = (analysis.by_category[error.category] || 0) + 1;
    }
    
    // Count by component
    if (error.component_name) {
      analysis.by_component[error.component_name] = (analysis.by_component[error.component_name] || 0) + 1;
    }
    
    // Count by stage
    if (error.stage_id) {
      analysis.by_stage[error.stage_id] = (analysis.by_stage[error.stage_id] || 0) + 1;
    }
    
    // Count by hour
    const hour = new Date(error.created_at || error.stored_at).getHours();
    analysis.by_hour[hour] = (analysis.by_hour[hour] || 0) + 1;
  });
  
  // Calculate trends
  analysis.trends.most_frequent_error = Object.entries(analysis.by_category)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'none';
    
  analysis.trends.most_affected_component = Object.entries(analysis.by_component)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'none';
    
  analysis.trends.most_problematic_stage = Object.entries(analysis.by_stage)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'none';
  
  return analysis;
}

/**
 * Helper functions for debugging context
 */
function getBrowserInfo(): any {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    memory: (performance as any).memory ? {
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
    } : null
  };
}

function getEnvironmentInfo(): any {
  return {
    href: window.location.href,
    origin: window.location.origin,
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    referrer: document.referrer,
    title: document.title,
    readyState: document.readyState,
    visibilityState: document.visibilityState
  };
}

function getPerformanceMetrics(): any {
  if (!performance.getEntriesByType) return null;
  
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  return {
    loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : null,
    domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.navigationStart : null,
    firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || null,
    firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || null
  };
}

function getStorageInfo(): any {
  try {
    return {
      localStorage: {
        available: !!window.localStorage,
        used: new Blob(Object.values(localStorage)).size,
        keys: Object.keys(localStorage).length
      },
      sessionStorage: {
        available: !!window.sessionStorage,
        used: new Blob(Object.values(sessionStorage)).size,
        keys: Object.keys(sessionStorage).length
      }
    };
  } catch (error) {
    return { error: 'Storage info unavailable' };
  }
}

/**
 * Claude Code convenience functions - call these directly
 */

// For Claude Code to get recent errors
export async function getErrorsForClaude(hours: number = 24): Promise<any> {
  return handleDebugRequest({
    action: 'export',
    params: { hours }
  });
}

// For Claude Code to get specific error patterns
export async function getErrorPatternsForClaude(hours: number = 24): Promise<any> {
  return handleDebugRequest({
    action: 'patterns',
    params: { hours }
  });
}

// For Claude Code to get critical issues
export async function getCriticalIssuesForClaude(): Promise<any> {
  return handleDebugRequest({
    action: 'critical'
  });
}

// For Claude Code to get component-specific errors
export async function getComponentErrorsForClaude(componentName: string, hours: number = 24): Promise<any> {
  return handleDebugRequest({
    action: 'component',
    params: { component: componentName, hours }
  });
}

// For Claude Code to get error summary
export async function getErrorAnalyticsForClaude(hours: number = 24): Promise<any> {
  return handleDebugRequest({
    action: 'summary',
    params: { hours }
  });
}