/**
 * Comprehensive Error Handling and Logging System
 * Provides graceful degradation and user-friendly error messages
 */

import { toast } from 'sonner';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error categories for better organization
export enum ErrorCategory {
  NETWORK = 'network',
  PARSING = 'parsing',
  RENDERING = 'rendering',
  COMPUTATION = 'computation',
  STORAGE = 'storage',
  AUTH = 'auth',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown'
}

interface ErrorDetails {
  id: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  timestamp: Date;
  context?: Record<string, any>;
  stack?: string;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
}

interface ErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  logToServer?: boolean;
  fallbackAction?: () => void;
  retryAction?: () => Promise<void>;
  maxRetries?: number;
}

export class ErrorHandler {
  private errors: ErrorDetails[] = [];
  private errorCounts: Map<string, number> = new Map();
  private sessionId: string;
  
  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        ErrorCategory.UNKNOWN,
        ErrorSeverity.HIGH,
        { type: 'unhandledrejection', reason: event.reason }
      );
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(
        new Error(event.message),
        ErrorCategory.UNKNOWN,
        ErrorSeverity.MEDIUM,
        { 
          type: 'javascript_error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      );
    });
  }

  /**
   * Main error handling method
   */
  public handleError(
    error: Error | string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, any>,
    options: ErrorHandlerOptions = {}
  ): string {
    const errorId = this.generateErrorId();
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = error instanceof Error ? error.stack : undefined;

    const errorDetails: ErrorDetails = {
      id: errorId,
      message: errorMessage,
      category,
      severity,
      timestamp: new Date(),
      context,
      stack: errorStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.sessionId,
    };

    // Store error
    this.errors.push(errorDetails);
    this.updateErrorCount(category);

    // Log to console if enabled (default: true)
    if (options.logToConsole !== false) {
      this.logToConsole(errorDetails);
    }

    // Show user-friendly toast if enabled (default: true)
    if (options.showToast !== false) {
      this.showUserFriendlyToast(errorDetails);
    }

    // Execute fallback action if provided
    if (options.fallbackAction) {
      try {
        options.fallbackAction();
      } catch (fallbackError) {
        console.error('❌ Fallback action failed:', fallbackError);
      }
    }

    // Log to server if enabled and in production
    if (options.logToServer && process.env.NODE_ENV === 'production') {
      this.logToServer(errorDetails).catch(console.error);
    }

    return errorId;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateErrorCount(category: ErrorCategory): void {
    const currentCount = this.errorCounts.get(category) || 0;
    this.errorCounts.set(category, currentCount + 1);
  }

  private logToConsole(error: ErrorDetails): void {
    const emoji = this.getSeverityEmoji(error.severity);
    const categoryBadge = `[${error.category.toUpperCase()}]`;
    
    console.group(`${emoji} ${categoryBadge} ${error.message}`);
    console.log('Error ID:', error.id);
    console.log('Timestamp:', error.timestamp.toISOString());
    console.log('Severity:', error.severity);
    
    if (error.context) {
      console.log('Context:', error.context);
    }
    
    if (error.stack) {
      console.log('Stack:', error.stack);
    }
    
    console.groupEnd();
  }

  private getSeverityEmoji(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.LOW: return '⚠️';
      case ErrorSeverity.MEDIUM: return '🔶';
      case ErrorSeverity.HIGH: return '🔴';
      case ErrorSeverity.CRITICAL: return '💥';
      default: return '❓';
    }
  }

  private showUserFriendlyToast(error: ErrorDetails): void {
    const message = this.getUserFriendlyMessage(error);
    
    switch (error.severity) {
      case ErrorSeverity.LOW:
        toast.info(message);
        break;
      case ErrorSeverity.MEDIUM:
        toast.warning(message);
        break;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        toast.error(message);
        break;
    }
  }

  private getUserFriendlyMessage(error: ErrorDetails): string {
    // Map technical errors to user-friendly messages
    const errorMap: Record<string, string> = {
      // Network errors
      'Failed to fetch': 'Unable to connect to the server. Please check your internet connection.',
      'Network request failed': 'Network error occurred. Please try again.',
      'ERR_NETWORK': 'Network error. Please check your connection and try again.',
      
      // API errors
      'API rate limit exceeded': 'Too many requests. Please wait a moment and try again.',
      'Unauthorized': 'Authentication required. Please log in.',
      'Forbidden': 'You don\'t have permission to perform this action.',
      'Not found': 'The requested resource was not found.',
      
      // Visualization errors
      'Failed to render graph': 'Graph visualization failed. Trying alternative display.',
      'Layout calculation failed': 'Graph layout failed. Using simplified view.',
      'Cytoscape': 'Graph rendering issue. Falling back to alternative view.',
      'Plotly': 'Chart rendering failed. Data is still available in table format.',
      
      // Processing errors
      'Stage execution failed': 'Research stage processing encountered an issue. Retrying...',
      'Graph processing error': 'Graph analysis encountered an issue. Continuing with available data.',
      'Export failed': 'Export operation failed. Please try a different format.',
      
      // Storage errors
      'LocalStorage': 'Browser storage is full or unavailable. Some features may be limited.',
      'SessionStorage': 'Session data could not be saved. Your work may be lost on refresh.',
      
      // Parsing errors
      'JSON parse error': 'Data format error. Refreshing might help.',
      'Invalid data format': 'Received data is in an unexpected format.',
    };

    // Find matching error message
    for (const [key, userMessage] of Object.entries(errorMap)) {
      if (error.message.toLowerCase().includes(key.toLowerCase())) {
        return userMessage;
      }
    }

    // Category-based fallback messages
    switch (error.category) {
      case ErrorCategory.NETWORK:
        return 'Network connectivity issue. Please check your connection.';
      case ErrorCategory.RENDERING:
        return 'Display issue encountered. Content may appear differently.';
      case ErrorCategory.COMPUTATION:
        return 'Processing issue occurred. Retrying with alternative approach.';
      case ErrorCategory.STORAGE:
        return 'Data storage issue. Some information may not be saved.';
      case ErrorCategory.AUTH:
        return 'Authentication issue. You may need to log in again.';
      case ErrorCategory.VALIDATION:
        return 'Data validation failed. Please check your input.';
      default:
        return 'An unexpected issue occurred. The system is attempting to recover.';
    }
  }

  private async logToServer(error: ErrorDetails): Promise<void> {
    try {
      // In a real implementation, this would send to your error logging service
      // For now, we'll just simulate the call
      console.log('Would log to server:', error);
      
      // Example implementation:
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(error)
      // });
    } catch (logError) {
      console.error('Failed to log error to server:', logError);
    }
  }

  /**
   * Get error statistics for debugging
   */
  public getErrorStats(): { total: number; byCategory: Record<string, number>; recent: ErrorDetails[] } {
    const recentErrors = this.errors
      .filter(error => Date.now() - error.timestamp.getTime() < 5 * 60 * 1000) // Last 5 minutes
      .slice(-10); // Last 10 errors

    return {
      total: this.errors.length,
      byCategory: Object.fromEntries(this.errorCounts),
      recent: recentErrors
    };
  }

  /**
   * Clear old errors to prevent memory leaks
   */
  public clearOldErrors(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge;
    this.errors = this.errors.filter(error => error.timestamp.getTime() > cutoff);
  }

  /**
   * Get detailed error by ID
   */
  public getError(id: string): ErrorDetails | undefined {
    return this.errors.find(error => error.id === id);
  }

  /**
   * Check if system is experiencing issues
   */
  public isSystemHealthy(): boolean {
    const recentErrors = this.errors.filter(
      error => Date.now() - error.timestamp.getTime() < 5 * 60 * 1000
    );
    
    const criticalErrors = recentErrors.filter(
      error => error.severity === ErrorSeverity.CRITICAL
    ).length;
    
    const highErrors = recentErrors.filter(
      error => error.severity === ErrorSeverity.HIGH
    ).length;
    
    return criticalErrors === 0 && highErrors < 3;
  }
}

// Global error handler instance
export const errorHandler = new ErrorHandler();

/**
 * Convenience functions for common error types
 */
export const handleNetworkError = (error: Error, context?: Record<string, any>) => {
  return errorHandler.handleError(error, ErrorCategory.NETWORK, ErrorSeverity.HIGH, context);
};

export const handleRenderingError = (error: Error, context?: Record<string, any>) => {
  return errorHandler.handleError(error, ErrorCategory.RENDERING, ErrorSeverity.MEDIUM, context, {
    fallbackAction: () => console.log('Using fallback rendering mode')
  });
};

export const handleComputationError = (error: Error, context?: Record<string, any>) => {
  return errorHandler.handleError(error, ErrorCategory.COMPUTATION, ErrorSeverity.HIGH, context);
};

export const handleValidationError = (error: Error, context?: Record<string, any>) => {
  return errorHandler.handleError(error, ErrorCategory.VALIDATION, ErrorSeverity.LOW, context);
};

/**
 * React Error Boundary component
 */
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorId?: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ errorId?: string }> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = errorHandler.handleError(
      error,
      ErrorCategory.RENDERING,
      ErrorSeverity.HIGH,
      { type: 'react_error_boundary' }
    );
    
    return { hasError: true, errorId };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorHandler.handleError(
      error,
      ErrorCategory.RENDERING,
      ErrorSeverity.HIGH,
      { ...errorInfo, type: 'react_component_error' }
    );
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent) {
        return <FallbackComponent errorId={this.state.errorId} />;
      }
      
      return (
        <div className="flex items-center justify-center h-64 border border-destructive rounded-lg bg-destructive/5">
          <div className="text-center p-6">
            <div className="text-4xl mb-4">💥</div>
            <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
            <p className="text-muted-foreground mb-4">
              A rendering error occurred. Please refresh the page.
            </p>
            {this.state.errorId && (
              <p className="text-xs text-muted-foreground">
                Error ID: {this.state.errorId}
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for error handling
 */
export const withErrorHandling = <P extends object>(
  Component: React.ComponentType<P>,
  category: ErrorCategory = ErrorCategory.RENDERING
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <ErrorBoundary>
      <Component {...props} ref={ref} />
    </ErrorBoundary>
  ));
};