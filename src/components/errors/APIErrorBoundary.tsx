/**
 * API Error Boundary Component
 * Specialized error handling for API operations and external service integrations
 */

import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Key, Clock, Zap } from 'lucide-react';

interface APIErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorType: 'rate_limit' | 'auth' | 'network' | 'timeout' | 'quota' | 'invalid_response' | 'unknown';
  retryCount: number;
  isRetrying: boolean;
  lastRetryTime: number | null;
}

interface APIErrorBoundaryProps {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  maxRetries?: number;
  retryDelay?: number;
  showDetails?: boolean;
  apiProvider?: 'gemini' | 'perplexity' | 'openai' | 'generic';
}

export class APIErrorBoundary extends Component<APIErrorBoundaryProps, APIErrorBoundaryState> {
  private retryTimer: NodeJS.Timeout | null = null;

  constructor(props: APIErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown',
      retryCount: 0,
      isRetrying: false,
      lastRetryTime: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<APIErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorType: APIErrorBoundary.categorizeError(error)
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      errorInfo
    });

    console.error('API Error Boundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Categorize error type for better handling
   */
  private static categorizeError(error: Error): APIErrorBoundaryState['errorType'] {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';
    
    if (message.includes('rate limit') || message.includes('too many requests') || message.includes('429')) {
      return 'rate_limit';
    }
    
    if (message.includes('unauthorized') || message.includes('forbidden') || message.includes('api key') || message.includes('401') || message.includes('403')) {
      return 'auth';
    }
    
    if (message.includes('timeout') || message.includes('timed out') || message.includes('408')) {
      return 'timeout';
    }
    
    if (message.includes('quota') || message.includes('limit exceeded') || message.includes('usage limit')) {
      return 'quota';
    }
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network';
    }
    
    if (message.includes('invalid response') || message.includes('parse') || message.includes('json')) {
      return 'invalid_response';
    }
    
    return 'unknown';
  }

  /**
   * Get error icon based on type
   */
  private getErrorIcon() {
    switch (this.state.errorType) {
      case 'rate_limit':
        return <Clock className="w-8 h-8 text-orange-500" />;
      case 'auth':
        return <Key className="w-8 h-8 text-red-500" />;
      case 'network':
        return <WifiOff className="w-8 h-8 text-red-500" />;
      case 'timeout':
        return <Clock className="w-8 h-8 text-yellow-500" />;
      case 'quota':
        return <Zap className="w-8 h-8 text-purple-500" />;
      case 'invalid_response':
        return <AlertTriangle className="w-8 h-8 text-red-500" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-red-500" />;
    }
  }

  /**
   * Get error title based on type
   */
  private getErrorTitle() {
    const provider = this.props.apiProvider || 'API';
    const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
    
    switch (this.state.errorType) {
      case 'rate_limit':
        return `${providerName} Rate Limit Exceeded`;
      case 'auth':
        return `${providerName} Authentication Error`;
      case 'network':
        return `${providerName} Connection Error`;
      case 'timeout':
        return `${providerName} Request Timeout`;
      case 'quota':
        return `${providerName} Quota Exceeded`;
      case 'invalid_response':
        return `${providerName} Response Error`;
      default:
        return `${providerName} Service Error`;
    }
  }

  /**
   * Get error description based on type
   */
  private getErrorDescription() {
    const provider = this.props.apiProvider || 'API service';
    
    switch (this.state.errorType) {
      case 'rate_limit':
        return `You've exceeded the rate limit for ${provider}. Please wait before making more requests.`;
      case 'auth':
        return `Authentication failed with ${provider}. Please check your API credentials.`;
      case 'network':
        return `Unable to connect to ${provider}. Please check your internet connection.`;
      case 'timeout':
        return `Request to ${provider} timed out. The service may be experiencing high load.`;
      case 'quota':
        return `You've reached your usage quota for ${provider}. Consider upgrading your plan.`;
      case 'invalid_response':
        return `Received an invalid response from ${provider}. The service may be experiencing issues.`;
      default:
        return `An unexpected error occurred with ${provider}. Please try again.`;
    }
  }

  /**
   * Get recovery suggestions based on error type
   */
  private getRecoverySuggestions() {
    switch (this.state.errorType) {
      case 'rate_limit':
        return [
          'Wait a few minutes before retrying',
          'Reduce the frequency of your requests',
          'Consider upgrading your API plan',
          'Use manual mode to control request timing'
        ];
      case 'auth':
        return [
          'Check your API key configuration',
          'Regenerate your API key if needed',
          'Verify API key permissions',
          'Contact the API provider for support'
        ];
      case 'network':
        return [
          'Check your internet connection',
          'Try refreshing the page',
          'Disable VPN if using one',
          'Try again in a few minutes'
        ];
      case 'timeout':
        return [
          'Try again with a simpler request',
          'Break large requests into smaller parts',
          'Wait and retry later',
          'Check your internet speed'
        ];
      case 'quota':
        return [
          'Wait until your quota resets',
          'Upgrade your API plan',
          'Use fewer API calls',
          'Contact the provider about limits'
        ];
      case 'invalid_response':
        return [
          'Try refreshing the page',
          'Check API service status',
          'Wait and retry later',
          'Contact support if issue persists'
        ];
      default:
        return [
          'Try refreshing the page',
          'Check your API configuration',
          'Wait and retry later',
          'Contact support if needed'
        ];
    }
  }

  /**
   * Get retry delay based on error type
   */
  private getRetryDelay() {
    const baseDelay = this.props.retryDelay || 2000;
    
    switch (this.state.errorType) {
      case 'rate_limit':
        return Math.min(baseDelay * Math.pow(2, this.state.retryCount) * 3, 60000); // Exponential backoff up to 1 minute
      case 'timeout':
        return Math.min(baseDelay * Math.pow(2, this.state.retryCount), 30000); // Exponential backoff up to 30 seconds
      default:
        return Math.min(baseDelay * Math.pow(2, this.state.retryCount), 15000); // Exponential backoff up to 15 seconds
    }
  }

  /**
   * Check if retry is allowed for this error type
   */
  private canRetry() {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      return false;
    }
    
    // Some errors shouldn't be retried
    if (this.state.errorType === 'auth' || this.state.errorType === 'quota') {
      return false;
    }
    
    return true;
  }

  /**
   * Retry the operation with appropriate delay
   */
  private handleRetry = () => {
    if (!this.canRetry()) {
      return;
    }

    this.setState({ isRetrying: true });
    const delay = this.getRetryDelay();

    this.retryTimer = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: this.state.retryCount + 1,
        isRetrying: false,
        lastRetryTime: Date.now()
      });
    }, delay);
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
      isRetrying: false,
      lastRetryTime: null
    });
  };

  /**
   * Navigate to API configuration
   */
  private handleConfigureAPI = () => {
    // This could navigate to API settings or open a modal
    console.log('Navigate to API configuration');
    // You could implement navigation logic here
  };

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      const { maxRetries = 3, showDetails = false } = this.props;
      const canRetryNow = this.canRetry();
      const recoverySuggestions = this.getRecoverySuggestions();
      const nextRetryDelay = Math.ceil(this.getRetryDelay() / 1000);

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
                {canRetryNow && (
                  <Button 
                    onClick={this.handleRetry}
                    disabled={this.state.isRetrying}
                    variant="default"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
                    {this.state.isRetrying ? `Retrying in ${nextRetryDelay}s...` : 'Retry'}
                  </Button>
                )}
                
                <Button 
                  onClick={this.handleReset}
                  variant="outline"
                >
                  Reset
                </Button>
                
                {(this.state.errorType === 'auth' || this.state.errorType === 'quota') && (
                  <Button 
                    onClick={this.handleConfigureAPI}
                    variant="outline"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Configure API
                  </Button>
                )}
                
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                >
                  Refresh Page
                </Button>
              </div>

              {/* Retry Information */}
              {this.state.retryCount > 0 && (
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Attempts: {this.state.retryCount}/{maxRetries}</div>
                  {this.state.lastRetryTime && (
                    <div>Last attempt: {new Date(this.state.lastRetryTime).toLocaleTimeString()}</div>
                  )}
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
                    
                    <div>
                      <div className="font-medium text-sm">Error Type:</div>
                      <div className="text-sm">{this.state.errorType}</div>
                    </div>
                    
                    <div>
                      <div className="font-medium text-sm">API Provider:</div>
                      <div className="text-sm">{this.props.apiProvider || 'Generic'}</div>
                    </div>
                    
                    {this.state.error.stack && (
                      <div>
                        <div className="font-medium text-sm">Stack Trace:</div>
                        <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    
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
 * Hook for handling API errors in functional components
 */
export function useAPIErrorHandler(apiProvider?: string) {
  const [error, setError] = React.useState<string | null>(null);
  const [errorType, setErrorType] = React.useState<APIErrorBoundaryState['errorType']>('unknown');
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);

  const handleError = React.useCallback((error: Error | string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const type = APIErrorBoundary.categorizeError(errorObj);
    
    setError(errorObj.message);
    setErrorType(type);
    console.error(`${apiProvider || 'API'} operation failed:`, error);
  }, [apiProvider]);

  const clearError = React.useCallback(() => {
    setError(null);
    setErrorType('unknown');
    setRetryCount(0);
  }, []);

  const retry = React.useCallback(async (
    operation: () => Promise<void>, 
    maxRetries: number = 3,
    baseDelay: number = 2000
  ) => {
    if (retryCount >= maxRetries) {
      return;
    }

    // Don't retry auth or quota errors
    if (errorType === 'auth' || errorType === 'quota') {
      return;
    }

    setIsRetrying(true);
    
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), 30000);
    
    setTimeout(async () => {
      try {
        await operation();
        clearError();
      } catch (err) {
        setRetryCount(prev => prev + 1);
        handleError(err as Error);
      } finally {
        setIsRetrying(false);
      }
    }, delay);
  }, [retryCount, errorType, handleError, clearError]);

  return {
    error,
    errorType,
    isRetrying,
    retryCount,
    handleError,
    clearError,
    retry
  };
}