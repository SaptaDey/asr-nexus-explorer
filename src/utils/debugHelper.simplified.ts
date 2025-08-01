/**
 * Simplified Debug Helper for Claude Code Access
 * SIMPLIFIED: Uses static imports to prevent temporal dead zone issues
 */

import { errorLogger } from '@/services/ErrorLoggingService';

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
    
    try {
      return await errorLogger.exportErrorsForDebugging(hours);
    } catch (error) {
      console.error('Failed to get error report:', error);
      return { error: 'Failed to load error logging service' };
    }
  }

  /**
   * Get error patterns for trend analysis
   * @param hours - Number of hours to look back (default: 24)
   */
  static async getErrorPatterns(hours: number = 24) {
    console.log(`📊 Analyzing error patterns for last ${hours} hours...`);
    
    try {
      return await errorLogger.getErrorPatterns(hours);
    } catch (error) {
      console.error('Failed to get error patterns:', error);
      return [];
    }
  }

  /**
   * Get critical errors that need immediate attention
   */
  static async getCriticalErrors() {
    console.log('🚨 Fetching critical errors...');
    
    try {
      return await errorLogger.getCriticalErrors();
    } catch (error) {
      console.error('Failed to get critical errors:', error);
      return [];
    }
  }

  /**
   * Get errors for a specific component
   * @param componentName - Name of the component to analyze
   * @param hours - Number of hours to look back (default: 24)
   */
  static async getComponentErrors(componentName: string, hours: number = 24) {
    console.log(`🔧 Analyzing errors for component: ${componentName}`);
    
    try {
      return await errorLogger.getErrorsByComponent(componentName, hours);
    } catch (error) {
      console.error('Failed to get component errors:', error);
      return [];
    }
  }

  /**
   * Quick health check - get summary of recent issues
   */
  static async quickHealthCheck() {
    console.log('🏥 Performing quick health check...');
    
    try {
      const [critical, patterns, recent] = await Promise.all([
        errorLogger.getCriticalErrors(),
        errorLogger.getErrorPatterns(6), // Last 6 hours for patterns
        errorLogger.getRecentErrors(6, 100)  // Last 6 hours for recent
      ]);

      return {
        health_status: critical.length > 0 ? 'CRITICAL' : 'HEALTHY',
        critical_count: critical.length,
        pattern_count: patterns.length,
        total_errors_6h: recent.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to perform health check:', error);
      return {
        health_status: 'UNKNOWN',
        error: 'Failed to load error logging service'
      };
    }
  }

  /**
   * Get local storage errors (always available)
   */
  static getLocalStorageErrors(): any[] {
    try {
      const stored = localStorage.getItem('asr_error_logs');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to read local storage errors:', error);
      return [];
    }
  }
}

/**
 * Global debug functions for easy access in browser console
 * These are defined after DOMContentLoaded to ensure proper initialization
 */
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready before setting up global helpers
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupGlobalDebugHelpers);
  } else {
    // DOM is already ready
    setupGlobalDebugHelpers();
  }
}

function setupGlobalDebugHelpers() {
  // Make debug helper available globally for browser console access
  (window as any).claudeDebug = ClaudeDebugHelper;
  
  // Convenience functions
  (window as any).getErrors = (hours?: number) => ClaudeDebugHelper.getFullErrorReport(hours);
  (window as any).getCritical = () => ClaudeDebugHelper.getCriticalErrors();
  (window as any).getPatterns = (hours?: number) => ClaudeDebugHelper.getErrorPatterns(hours);
  (window as any).healthCheck = () => ClaudeDebugHelper.quickHealthCheck();
  (window as any).debugComponent = (name: string, hours?: number) => ClaudeDebugHelper.getComponentErrors(name, hours);
  (window as any).getLocalErrors = () => ClaudeDebugHelper.getLocalStorageErrors();
  
  console.log('🛠️ Claude Debug Helper loaded. Available commands:');
  console.log('  - claudeDebug.getFullErrorReport(hours)');
  console.log('  - claudeDebug.getCriticalErrors()');
  console.log('  - claudeDebug.quickHealthCheck()');
  console.log('  - claudeDebug.getComponentErrors(name, hours)');
  console.log('  - getErrors(hours) // Shortcut');
  console.log('  - getCritical() // Shortcut');
  console.log('  - healthCheck() // Shortcut');
  console.log('  - getLocalErrors() // Shortcut');
}

export default ClaudeDebugHelper;