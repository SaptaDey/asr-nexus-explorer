import React from 'react';
import { errorLogger } from '@/services/ErrorLoggingService';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  eventId: string | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private unhandledRejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      eventId: null
    };
  }

  componentDidMount() {
    // Handle unhandled promise rejections
    this.unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Convert promise rejection to error for error boundary
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      const eventId = this.generateEventId();
      
      this.setState({
        hasError: true,
        error,
        errorInfo: { componentStack: 'Promise rejection' } as React.ErrorInfo,
        eventId
      });

      // Log promise rejection to error logging service
      errorLogger.logError({
        error_type: 'javascript',
        severity: 'error',
        category: 'unhandled_promise',
        message: error.message,
        stack: error.stack,
        component_name: 'ErrorBoundary',
        function_name: 'unhandledRejectionHandler',
        metadata: {
          reason: event.reason,
          promiseRejectionEventId: eventId,
          originalType: typeof event.reason
        },
        tags: ['promise', 'unhandled', 'error-boundary']
      });
      
      // Prevent the default browser error handling
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', this.unhandledRejectionHandler);
  }

  componentWillUnmount() {
    if (this.unhandledRejectionHandler) {
      window.removeEventListener('unhandledrejection', this.unhandledRejectionHandler);
    }
  }

  private generateEventId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { 
      hasError: true, 
      error,
      eventId: Math.random().toString(36).substr(2, 9)
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    const eventId = this.state.eventId || this.generateEventId();
    
    // Store additional error information
    this.setState({
      errorInfo,
      eventId
    });

    // Log error to our comprehensive logging service
    errorLogger.logError({
      error_type: 'component',
      severity: 'critical',
      category: 'error_boundary',
      message: error.message,
      stack: error.stack,
      component_name: 'ErrorBoundary',
      function_name: 'componentDidCatch',
      metadata: {
        componentStack: errorInfo.componentStack,
        errorBoundaryEventId: eventId,
        errorInfo
      },
      tags: ['error-boundary', 'critical', 'react']
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null
    });
  };

  private copyErrorToClipboard = () => {
    const errorReport = `
Error ID: ${this.state.eventId}
Error: ${this.state.error?.message}
Stack: ${this.state.error?.stack}
Component Stack: ${this.state.errorInfo?.componentStack}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
`;
    
    navigator.clipboard.writeText(errorReport.trim()).then(() => {
      alert('Error report copied to clipboard');
    }).catch(() => {
      console.error('Failed to copy error report');
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback component if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetErrorBoundary={this.handleReset} />;
      }

      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 p-2 rounded-full mr-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-red-600">Application Error</h2>
                <p className="text-gray-600">Error ID: {this.state.eventId}</p>
              </div>
            </div>

            <div className="bg-red-100 border border-red-200 rounded p-4 mb-4">
              <p className="text-red-800 font-semibold mb-2">Error Message:</p>
              <pre className="text-red-700 text-sm whitespace-pre-wrap">
                {this.state.error?.message || 'Unknown error'}
              </pre>
            </div>

            <details className="mb-4">
              <summary className="cursor-pointer text-gray-700 font-semibold hover:text-gray-900">
                Technical Details (Click to expand)
              </summary>
              <div className="mt-2 space-y-4">
                <div className="bg-gray-100 border border-gray-200 rounded p-4">
                  <p className="text-gray-800 font-semibold mb-2">Stack Trace:</p>
                  <pre className="text-gray-700 text-xs whitespace-pre-wrap overflow-auto max-h-40">
                    {this.state.error?.stack || 'No stack trace available'}
                  </pre>
                </div>
                
                {this.state.errorInfo?.componentStack && (
                  <div className="bg-gray-100 border border-gray-200 rounded p-4">
                    <p className="text-gray-800 font-semibold mb-2">Component Stack:</p>
                    <pre className="text-gray-700 text-xs whitespace-pre-wrap overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={this.handleReset}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button 
                onClick={this.copyErrorToClipboard}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
              >
                Copy Error Report
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
              >
                Reload Page
              </button>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-blue-800 text-sm">
                <strong>What happened?</strong> An unexpected error occurred in the application. 
                You can try again, copy the error report for support, or reload the page to start fresh.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;