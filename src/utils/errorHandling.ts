
import React from 'react';

/**
 * Enhanced Error Handling Utilities
 * Provides comprehensive error management for the ASR-GoT application
 */

export interface ErrorInfo {
  componentStack?: string;
  errorBoundary?: string;
  errorInfo?: React.ErrorInfo;
  timestamp?: Date;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
}

export interface ErrorReport {
  error: Error;
  errorInfo: ErrorInfo;
  context: 'component' | 'async' | 'api' | 'database' | 'auth' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  retryable: boolean;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorReports: ErrorReport[] = [];
  private maxReports = 100;
  private listeners: Array<(report: ErrorReport) => void> = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle an error with context information
   */
  handleError(error: Error, context: ErrorReport['context'] = 'unknown', additionalInfo?: Partial<ErrorInfo>): void {
    const errorReport: ErrorReport = {
      error,
      errorInfo: {
        timestamp: new Date(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
        url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
        ...additionalInfo
      },
      context,
      severity: this.determineSeverity(error, context),
      recoverable: this.isRecoverable(error, context),
      retryable: this.isRetryable(error, context)
    };

    this.addErrorReport(errorReport);
    this.notifyListeners(errorReport);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error handled:', errorReport);
    }
  }

  /**
   * Handle React component errors
   */
  handleComponentError(error: Error, errorInfo: React.ErrorInfo): void {
    this.handleError(error, 'component', {
      componentStack: errorInfo.componentStack,
      errorInfo
    });
  }

  /**
   * Handle async operation errors
   */
  handleAsyncError(error: Error, operation: string): void {
    this.handleError(error, 'async', {
      errorBoundary: `Async operation: ${operation}`
    });
  }

  /**
   * Handle API errors
   */
  handleAPIError(error: Error, endpoint: string): void {
    this.handleError(error, 'api', {
      errorBoundary: `API endpoint: ${endpoint}`
    });
  }

  /**
   * Handle database errors
   */
  handleDatabaseError(error: Error, operation: string): void {
    this.handleError(error, 'database', {
      errorBoundary: `Database operation: ${operation}`
    });
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(error: Error, operation: string): void {
    this.handleError(error, 'auth', {
      errorBoundary: `Auth operation: ${operation}`
    });
  }

  /**
   * Add error report to the collection
   */
  private addErrorReport(report: ErrorReport): void {
    this.errorReports.unshift(report);
    if (this.errorReports.length > this.maxReports) {
      this.errorReports = this.errorReports.slice(0, this.maxReports);
    }
  }

  /**
   * Notify listeners of new error reports
   */
  private notifyListeners(report: ErrorReport): void {
    this.listeners.forEach(listener => {
      try {
        listener(report);
      } catch (error) {
        console.error('Error in error handler listener:', error);
      }
    });
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error, context: ErrorReport['context']): ErrorReport['severity'] {
    if (context === 'auth' || context === 'database') {
      return 'high';
    }
    if (context === 'api') {
      return 'medium';
    }
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Check if error is recoverable
   */
  private isRecoverable(error: Error, context: ErrorReport['context']): boolean {
    if (context === 'component') {
      return true;
    }
    if (context === 'api' || context === 'database') {
      return !error.message.includes('unauthorized') && !error.message.includes('forbidden');
    }
    return false;
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(error: Error, context: ErrorReport['context']): boolean {
    if (context === 'api' || context === 'database') {
      return error.message.includes('network') || 
             error.message.includes('timeout') || 
             error.message.includes('server error');
    }
    return false;
  }

  /**
   * Subscribe to error reports
   */
  subscribe(listener: (report: ErrorReport) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Get all error reports
   */
  getErrorReports(): ErrorReport[] {
    return [...this.errorReports];
  }

  /**
   * Clear all error reports
   */
  clearErrorReports(): void {
    this.errorReports = [];
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    total: number;
    byContext: Record<ErrorReport['context'], number>;
    bySeverity: Record<ErrorReport['severity'], number>;
    recent: number;
  } {
    const stats = {
      total: this.errorReports.length,
      byContext: {} as Record<ErrorReport['context'], number>,
      bySeverity: {} as Record<ErrorReport['severity'], number>,
      recent: 0
    };

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    this.errorReports.forEach(report => {
      // Count by context
      stats.byContext[report.context] = (stats.byContext[report.context] || 0) + 1;
      
      // Count by severity
      stats.bySeverity[report.severity] = (stats.bySeverity[report.severity] || 0) + 1;
      
      // Count recent errors
      if (report.errorInfo.timestamp && report.errorInfo.timestamp > oneHourAgo) {
        stats.recent++;
      }
    });

    return stats;
  }
}

// Global error handler instance
export const errorHandler = ErrorHandler.getInstance();

// Global error event listeners
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorHandler.handleError(new Error(event.message), 'unknown', {
      errorBoundary: `Global error: ${event.filename}:${event.lineno}:${event.colno}`
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handleError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      'async',
      {
        errorBoundary: 'Unhandled promise rejection'
      }
    );
  });
}

/**
 * Higher-order component for error handling
 */
export function withErrorHandling<P extends object>(
  Component: React.ComponentType<P>,
  context: ErrorReport['context'] = 'component'
) {
  return function ErrorHandledComponent(props: P) {
    const handleError = React.useCallback((error: Error, errorInfo?: React.ErrorInfo) => {
      if (errorInfo) {
        errorHandler.handleComponentError(error, errorInfo);
      } else {
        errorHandler.handleError(error, context);
      }
    }, []);

    return (
      <ErrorBoundary onError={handleError}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * Simple error boundary component
 */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo?: React.ErrorInfo) => void;
  fallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent 
            error={this.state.error} 
            resetErrorBoundary={() => this.setState({ hasError: false, error: null })}
          />
        );
      }

      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center">
          <div className="text-center p-6 max-w-md">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Something went wrong</h2>
            <p className="text-red-600 mb-4">An error occurred while rendering this component.</p>
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for using error handling in functional components
 */
export function useErrorHandler() {
  const [errors, setErrors] = React.useState<ErrorReport[]>([]);

  React.useEffect(() => {
    const unsubscribe = errorHandler.subscribe((report) => {
      setErrors(prev => [report, ...prev.slice(0, 9)]);
    });

    return unsubscribe;
  }, []);

  const handleError = React.useCallback((error: Error, context: ErrorReport['context'] = 'component') => {
    errorHandler.handleError(error, context);
  }, []);

  const clearErrors = React.useCallback(() => {
    setErrors([]);
  }, []);

  return {
    errors,
    handleError,
    clearErrors,
    errorStats: errorHandler.getErrorStatistics()
  };
}

/**
 * Safe async operation wrapper
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context: ErrorReport['context'] = 'async',
  fallback?: T
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), context);
    return fallback;
  }
}

/**
 * Safe function wrapper
 */
export function safe<T extends any[], R>(
  fn: (...args: T) => R,
  context: ErrorReport['context'] = 'unknown',
  fallback?: R
): (...args: T) => R | undefined {
  return (...args: T) => {
    try {
      return fn(...args);
    } catch (error) {
      errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), context);
      return fallback;
    }
  };
}
