/**
 * Database Error Boundary Component
 * Comprehensive error handling for database operations
 */

import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Database, Wifi, WifiOff } from 'lucide-react';

interface DatabaseErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorType: 'database' | 'network' | 'authentication' | 'permission' | 'unknown';
  retryCount: number;
  isRetrying: boolean;
}

interface DatabaseErrorBoundaryProps {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  maxRetries?: number;
  showDetails?: boolean;
}

export class DatabaseErrorBoundary extends Component<DatabaseErrorBoundaryProps, DatabaseErrorBoundaryState> {
  private retryTimer: NodeJS.Timeout | null = null;

  constructor(props: DatabaseErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown',
      retryCount: 0,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<DatabaseErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorType: DatabaseErrorBoundary.categorizeError(error)
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      errorInfo
    });

    // Log to external service
    console.error('Database Error Boundary caught an error:', error, errorInfo);
    
    // Call error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Categorize error type for better handling
   */
  private static categorizeError(error: Error): DatabaseErrorBoundaryState['errorType'] {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
      return 'network';
    }
    
    if (message.includes('authentication') || message.includes('unauthorized') || message.includes('auth')) {
      return 'authentication';
    }
    
    if (message.includes('permission') || message.includes('forbidden') || message.includes('access')) {
      return 'permission';
    }
    
    if (message.includes('database') || message.includes('postgres') || message.includes('sql')) {
      return 'database';
    }
    
    return 'unknown';
  }

  /**
   * Get error icon based on type
   */
  private getErrorIcon() {
    switch (this.state.errorType) {
      case 'network':
        return <WifiOff className="w-8 h-8 text-red-500" />;
      case 'database':
        return <Database className="w-8 h-8 text-red-500" />;
      case 'authentication':
        return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
      case 'permission':
        return <AlertTriangle className="w-8 h-8 text-orange-500" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-red-500" />;
    }
  }

  /**
   * Get error title based on type
   */
  private getErrorTitle() {
    switch (this.state.errorType) {
      case 'network':
        return 'Network Connection Error';
      case 'database':
        return 'Database Error';
      case 'authentication':
        return 'Authentication Error';
      case 'permission':
        return 'Permission Error';
      default:
        return 'Application Error';
    }
  }

  /**
   * Get error description based on type
   */
  private getErrorDescription() {
    switch (this.state.errorType) {
      case 'network':
        return 'Unable to connect to the server. Please check your internet connection.';
      case 'database':
        return 'There was an issue with the database. Our team has been notified.';
      case 'authentication':
        return 'Your session has expired. Please sign in again.';
      case 'permission':
        return 'You don\'t have permission to access this resource.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Get recovery suggestions based on error type
   */
  private getRecoverySuggestions() {
    switch (this.state.errorType) {
      case 'network':
        return [
          'Check your internet connection',
          'Try refreshing the page',
          'Wait a moment and try again',
          'Contact support if the problem persists'
        ];
      case 'database':
        return [
          'Try refreshing the page',
          'Wait a moment and try again',
          'Check system status',
          'Contact support if the problem persists'
        ];
      case 'authentication':
        return [
          'Sign in again',
          'Clear your browser cache',
          'Try using a different browser',
          'Reset your password if needed'
        ];
      case 'permission':
        return [
          'Contact an administrator',
          'Check if you have the correct permissions',
          'Try signing out and signing in again',
          'Contact support for assistance'
        ];
      default:
        return [
          'Try refreshing the page',
          'Clear your browser cache',
          'Try using a different browser',
          'Contact support if the problem persists'
        ];
    }
  }

  /**
   * Retry the operation
   */
  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      return;
    }

    this.setState({ isRetrying: true });

    // Simulate retry delay
    this.retryTimer = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: this.state.retryCount + 1,
        isRetrying: false
      });
    }, 1000);
  };

  /**
   * Reset error state
   */
  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    });
  };

  /**
   * Refresh the page
   */
  private handleRefresh = () => {
    window.location.reload();
  };

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback component if provided
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      const { maxRetries = 3, showDetails = false } = this.props;
      const canRetry = this.state.retryCount < maxRetries;
      const recoverySuggestions = this.getRecoverySuggestions();

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {this.getErrorIcon()}
                {this.getErrorTitle()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error Description */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {this.getErrorDescription()}
                </AlertDescription>
              </Alert>

              {/* Recovery Suggestions */}
              <div>
                <h4 className="font-medium mb-3">What you can do:</h4>
                <ul className="space-y-2">
                  {recoverySuggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span className="text-sm text-gray-700">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {canRetry && (
                  <Button 
                    onClick={this.handleRetry}
                    disabled={this.state.isRetrying}
                    variant="default"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
                    {this.state.isRetrying ? 'Retrying...' : 'Retry'}
                  </Button>
                )}
                
                <Button 
                  onClick={this.handleReset}
                  variant="outline"
                >
                  Reset
                </Button>
                
                <Button 
                  onClick={this.handleRefresh}
                  variant="outline"
                >
                  Refresh Page
                </Button>
              </div>

              {/* Retry Counter */}
              {this.state.retryCount > 0 && (
                <div className="text-sm text-gray-600">
                  Attempts: {this.state.retryCount}/{maxRetries}
                </div>
              )}

              {/* Technical Details */}
              {showDetails && this.state.error && (
                <details className="mt-6">
                  <summary className="cursor-pointer font-medium text-sm mb-3">
                    Technical Details
                  </summary>
                  <div className="bg-gray-100 rounded-lg p-4 space-y-3">
                    <div>
                      <div className="font-medium text-sm">Error Message:</div>
                      <div className="text-sm font-mono text-red-600 break-all">
                        {this.state.error.message}
                      </div>
                    </div>
                    
                    {this.state.error.stack && (
                      <div>
                        <div className="font-medium text-sm">Stack Trace:</div>
                        <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    
                    {this.state.errorInfo && (
                      <div>
                        <div className="font-medium text-sm">Component Stack:</div>
                        <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                    
                    <div>
                      <div className="font-medium text-sm">Error Type:</div>
                      <div className="text-sm">{this.state.errorType}</div>
                    </div>
                    
                    <div>
                      <div className="font-medium text-sm">Timestamp:</div>
                      <div className="text-sm">{new Date().toISOString()}</div>
                    </div>
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for handling database errors in functional components
 */
export function useDatabaseErrorHandler() {
  const [error, setError] = React.useState<string | null>(null);
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);

  const handleError = React.useCallback((error: Error | string) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    setError(errorMessage);
    console.error('Database operation failed:', error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  const retry = React.useCallback(async (operation: () => Promise<void>, maxRetries: number = 3) => {
    if (retryCount >= maxRetries) {
      return;
    }

    setIsRetrying(true);
    
    try {
      await operation();
      clearError();
    } catch (err) {
      setRetryCount(prev => prev + 1);
      handleError(err as Error);
    } finally {
      setIsRetrying(false);
    }
  }, [retryCount, handleError, clearError]);

  return {
    error,
    isRetrying,
    retryCount,
    handleError,
    clearError,
    retry
  };
}

/**
 * Loading state component for database operations
 */
export function DatabaseLoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

/**
 * Connection status indicator
 */
export function DatabaseConnectionStatus({ 
  isConnected, 
  isConnecting, 
  lastError 
}: { 
  isConnected: boolean;
  isConnecting: boolean;
  lastError?: string | null;
}) {
  const getStatusColor = () => {
    if (isConnecting) return 'text-yellow-500';
    if (isConnected) return 'text-green-500';
    return 'text-red-500';
  };

  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    if (isConnected) return 'Connected';
    return 'Disconnected';
  };

  const getStatusIcon = () => {
    if (isConnecting) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (isConnected) return <Wifi className="w-4 h-4" />;
    return <WifiOff className="w-4 h-4" />;
  };

  return (
    <div className="flex items-center gap-2">
      <div className={getStatusColor()}>
        {getStatusIcon()}
      </div>
      <span className={`text-sm ${getStatusColor()}`}>
        {getStatusText()}
      </span>
      {lastError && (
        <div className="text-xs text-red-600 ml-2" title={lastError}>
          Error occurred
        </div>
      )}
    </div>
  );
}