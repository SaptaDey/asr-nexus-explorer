/**
 * Debug Helper for Claude Code Access
 * Provides easy methods for Claude to access error logs and debug information
 */

import { 
  getErrorsForClaude,
  getErrorPatternsForClaude,
  getCriticalIssuesForClaude,
  getComponentErrorsForClaude,
  getErrorAnalyticsForClaude
} from '@/pages/api/debug/errors';

/**
 * Main debug interface for Claude Code
 * Use this to quickly access error information for debugging
 */
export class ClaudeDebugHelper {
  
  /**
   * Get comprehensive error export for debugging
   * @param hours - Number of hours to look back (default: 24)
   */
  static async getFullErrorReport(hours: number = 24) {
    console.log(`🔍 Generating full error report for last ${hours} hours...`);
    return await getErrorsForClaude(hours);
  }

  /**
   * Get error patterns for trend analysis
   * @param hours - Number of hours to look back (default: 24)
   */
  static async getErrorPatterns(hours: number = 24) {
    console.log(`📊 Analyzing error patterns for last ${hours} hours...`);
    return await getErrorPatternsForClaude(hours);
  }

  /**
   * Get critical errors that need immediate attention
   */
  static async getCriticalErrors() {
    console.log('🚨 Fetching critical errors...');
    return await getCriticalIssuesForClaude();
  }

  /**
   * Get errors for a specific component
   * @param componentName - Name of the component to analyze
   * @param hours - Number of hours to look back (default: 24)
   */
  static async getComponentErrors(componentName: string, hours: number = 24) {
    console.log(`🔧 Analyzing errors for component: ${componentName}`);
    return await getComponentErrorsForClaude(componentName, hours);
  }

  /**
   * Get error analytics and summary
   * @param hours - Number of hours to look back (default: 24)
   */
  static async getErrorAnalytics(hours: number = 24) {
    console.log(`📈 Generating error analytics for last ${hours} hours...`);
    return await getErrorAnalyticsForClaude(hours);
  }

  /**
   * Quick health check - get summary of recent issues
   */
  static async quickHealthCheck() {
    console.log('🏥 Performing quick health check...');
    
    const [critical, patterns, analytics] = await Promise.all([
      this.getCriticalErrors(),
      this.getErrorPatterns(6), // Last 6 hours for patterns
      this.getErrorAnalytics(6)  // Last 6 hours for analytics
    ]);

    return {
      health_status: critical.data?.critical_errors?.length > 0 ? 'CRITICAL' : 'HEALTHY',
      critical_count: critical.data?.critical_errors?.length || 0,
      pattern_count: patterns.data?.patterns?.length || 0,
      total_errors_6h: analytics.data?.total_errors || 0,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Debug specific error types
   * @param errorType - Type of error to focus on
   * @param hours - Number of hours to look back
   */
  static async debugErrorType(errorType: string, hours: number = 24) {
    console.log(`🐛 Debugging specific error type: ${errorType}`);
    
    const fullReport = await this.getFullErrorReport(hours);
    
    if (!fullReport.success || !fullReport.data?.recent_errors) {
      return { error: 'Failed to fetch error data' };
    }

    const filteredErrors = fullReport.data.recent_errors.filter((error: any) => 
      error.error_type === errorType || error.category === errorType
    );

    return {
      error_type: errorType,
      matching_errors: filteredErrors,
      count: filteredErrors.length,
      timeframe_hours: hours,
      analysis: this.analyzeErrorGroup(filteredErrors)
    };
  }

  /**
   * Debug errors by component
   * @param componentName - Component to focus on
   * @param hours - Number of hours to look back
   */
  static async debugComponent(componentName: string, hours: number = 24) {
    console.log(`🧩 Debugging component: ${componentName}`);
    return await this.getComponentErrors(componentName, hours);
  }

  /**
   * Debug recent error spike
   * @param hours - Number of hours to analyze for spike
   */
  static async debugErrorSpike(hours: number = 6) {
    console.log(`📈 Analyzing error spike in last ${hours} hours...`);
    
    const [currentPeriod, previousPeriod] = await Promise.all([
      this.getErrorAnalytics(hours),
      this.getErrorAnalytics(hours * 2) // Compare with previous period
    ]);

    if (!currentPeriod.success || !previousPeriod.success) {
      return { error: 'Failed to fetch comparison data' };
    }

    const currentCount = currentPeriod.data?.total_errors || 0;
    const previousCount = (previousPeriod.data?.total_errors || 0) - currentCount;
    const increasePercentage = previousCount > 0 ? 
      ((currentCount - previousCount) / previousCount * 100) : 0;

    return {
      current_period: {
        hours,
        error_count: currentCount,
        top_errors: currentPeriod.data?.trends || {}
      },
      previous_period: {
        hours,
        error_count: previousCount
      },
      spike_analysis: {
        increase_percentage: increasePercentage,
        is_spike: increasePercentage > 50, // More than 50% increase
        severity: increasePercentage > 200 ? 'SEVERE' : 
                 increasePercentage > 100 ? 'HIGH' :
                 increasePercentage > 50 ? 'MODERATE' : 'NORMAL'
      }
    };
  }

  /**
   * Get production status for monitoring
   */
  static async getProductionStatus() {
    console.log('🌐 Checking production status...');
    
    const healthCheck = await this.quickHealthCheck();
    const criticalErrors = await this.getCriticalErrors();
    const recentPatterns = await this.getErrorPatterns(1); // Last hour

    return {
      production_status: healthCheck.health_status,
      last_check: new Date().toISOString(),
      critical_issues: criticalErrors.data?.critical_errors || [],
      recent_patterns: recentPatterns.data?.patterns || [],
      recommendations: this.generateRecommendations(healthCheck, criticalErrors.data)
    };
  }

  /**
   * Private helper to analyze a group of errors
   */
  private static analyzeErrorGroup(errors: any[]) {
    if (errors.length === 0) return null;

    const analysis = {
      most_common_message: '',
      most_affected_component: '',
      error_frequency: {} as Record<string, number>,
      first_occurrence: '',
      last_occurrence: '',
      stack_trace_patterns: [] as string[]
    };

    // Analyze error messages
    const messageFreq: Record<string, number> = {};
    const componentFreq: Record<string, number> = {};
    const stackPatterns = new Set<string>();

    errors.forEach(error => {
      // Count messages
      const msg = error.message || 'Unknown';
      messageFreq[msg] = (messageFreq[msg] || 0) + 1;

      // Count components
      if (error.component_name) {
        componentFreq[error.component_name] = (componentFreq[error.component_name] || 0) + 1;
      }

      // Extract stack patterns
      if (error.stack) {
        const firstLine = error.stack.split('\n')[0];
        if (firstLine) stackPatterns.add(firstLine);
      }
    });

    analysis.most_common_message = Object.entries(messageFreq)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';
    
    analysis.most_affected_component = Object.entries(componentFreq)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    analysis.error_frequency = messageFreq;
    analysis.first_occurrence = errors.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )[0]?.created_at || '';
    
    analysis.last_occurrence = errors.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0]?.created_at || '';

    analysis.stack_trace_patterns = Array.from(stackPatterns).slice(0, 5);

    return analysis;
  }

  /**
   * Generate recommendations based on health check
   */
  private static generateRecommendations(healthCheck: any, criticalData: any): string[] {
    const recommendations: string[] = [];

    if (healthCheck.health_status === 'CRITICAL') {
      recommendations.push('🚨 IMMEDIATE ACTION REQUIRED: Critical errors detected');
      recommendations.push('📋 Review critical errors list for specific issues');
    }

    if (healthCheck.critical_count > 0) {
      recommendations.push(`🔧 Address ${healthCheck.critical_count} critical error(s)`);
    }

    if (healthCheck.total_errors_6h > 50) {
      recommendations.push('📊 High error volume detected - investigate error patterns');
    }

    if (healthCheck.pattern_count > 10) {
      recommendations.push('🔄 Multiple error patterns - check for systemic issues');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ System appears healthy - continue monitoring');
    }

    return recommendations;
  }
}

/**
 * Global debug functions for easy access in browser console
 * These can be called directly for quick debugging
 */

// Make debug helper available globally for browser console access
if (typeof window !== 'undefined') {
  (window as any).claudeDebug = ClaudeDebugHelper;
  
  // Convenience functions
  (window as any).getErrors = ClaudeDebugHelper.getFullErrorReport;
  (window as any).getCritical = ClaudeDebugHelper.getCriticalErrors;
  (window as any).getPatterns = ClaudeDebugHelper.getErrorPatterns;
  (window as any).healthCheck = ClaudeDebugHelper.quickHealthCheck;
  (window as any).debugComponent = ClaudeDebugHelper.debugComponent;
  
  console.log('🛠️ Claude Debug Helper loaded. Available commands:');
  console.log('  - claudeDebug.getFullErrorReport(hours)');
  console.log('  - claudeDebug.getCriticalErrors()');
  console.log('  - claudeDebug.quickHealthCheck()');
  console.log('  - claudeDebug.debugComponent(name)');
  console.log('  - getErrors(hours) // Shortcut');
  console.log('  - healthCheck() // Shortcut');
}

export default ClaudeDebugHelper;