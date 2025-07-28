/**
 * Visualization Error Boundary Component
 * Specialized error handling for graph visualizations, charts, and interactive components
 */

import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Eye, EyeOff, Download, Settings } from 'lucide-react';

interface VisualizationErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorType: 'rendering' | 'data' | 'memory' | 'webgl' | 'layout' | 'interaction' | 'unknown';
  retryCount: number;
  isRetrying: boolean;
  fallbackMode: boolean;
  performanceMetrics: {
    nodeCount?: number;
    edgeCount?: number;
    renderTime?: number;
    memoryUsage?: number;
  };
}

interface VisualizationErrorBoundaryProps {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  maxRetries?: number;
  showFallbackVisualization?: boolean;
  visualizationType?: 'graph' | 'chart' | 'tree' | 'network' | 'plot';
  dataSize?: 'small' | 'medium' | 'large' | 'huge';
  enableFallbackMode?: boolean;
}

export class VisualizationErrorBoundary extends Component<VisualizationErrorBoundaryProps, VisualizationErrorBoundaryState> {
  private retryTimer: NodeJS.Timeout | null = null;
  private performanceObserver: PerformanceObserver | null = null;

  constructor(props: VisualizationErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown',
      retryCount: 0,
      isRetrying: false,
      fallbackMode: false,
      performanceMetrics: {}
    };
  }

  componentDidMount() {
    // Monitor performance for memory issues
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'measure') {
            this.setState(prev => ({
              performanceMetrics: {
                ...prev.performanceMetrics,
                renderTime: entry.duration
              }
            }));
          }
        });
      });
      
      try {
        this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (e) {
        // PerformanceObserver not fully supported
      }
    }

    // Monitor memory usage if available
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;
        if (memory) {
          this.setState(prev => ({
            performanceMetrics: {
              ...prev.performanceMetrics,
              memoryUsage: memory.usedJSHeapSize / memory.jsHeapSizeLimit
            }
          }));
        }
      };
      
      checkMemory();
      const memoryInterval = setInterval(checkMemory, 5000);
      
      // Cleanup
      return () => clearInterval(memoryInterval);
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }

  static getDerivedStateFromError(error: Error): Partial<VisualizationErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorType: VisualizationErrorBoundary.categorizeError(error)
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      errorInfo
    });

    console.error('Visualization Error Boundary caught an error:', error, errorInfo);
    
    // Log visualization-specific context
    console.error('Visualization context:', {
      type: this.props.visualizationType,
      dataSize: this.props.dataSize,
      performanceMetrics: this.state.performanceMetrics
    });
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Categorize error type for better handling
   */
  private static categorizeError(error: Error): VisualizationErrorBoundaryState['errorType'] {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';
    
    if (message.includes('webgl') || message.includes('context') || message.includes('gpu')) {
      return 'webgl';
    }
    
    if (message.includes('memory') || message.includes('heap') || stack.includes('memory')) {
      return 'memory';
    }
    
    if (message.includes('render') || message.includes('draw') || message.includes('canvas')) {
      return 'rendering';
    }
    
    if (message.includes('data') || message.includes('parse') || message.includes('invalid')) {
      return 'data';
    }
    
    if (message.includes('layout') || message.includes('position') || message.includes('force')) {
      return 'layout';
    }
    
    if (message.includes('click') || message.includes('drag') || message.includes('zoom') || message.includes('interaction')) {
      return 'interaction';
    }
    
    return 'unknown';
  }

  /**
   * Get error icon based on type
   */
  private getErrorIcon() {
    switch (this.state.errorType) {
      case 'rendering':
        return <Eye className="w-8 h-8 text-red-500" />;
      case 'data':
        return <AlertTriangle className="w-8 h-8 text-orange-500" />;
      case 'memory':
        return <AlertTriangle className="w-8 h-8 text-purple-500" />;
      case 'webgl':
        return <Settings className="w-8 h-8 text-red-500" />;
      case 'layout':
        return <Settings className="w-8 h-8 text-blue-500" />;
      case 'interaction':
        return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-red-500" />;
    }
  }

  /**
   * Get error title based on type
   */
  private getErrorTitle() {
    const vizType = this.props.visualizationType || 'Visualization';
    const typeName = vizType.charAt(0).toUpperCase() + vizType.slice(1);
    
    switch (this.state.errorType) {
      case 'rendering':
        return `${typeName} Rendering Error`;
      case 'data':
        return `${typeName} Data Error`;
      case 'memory':
        return `${typeName} Memory Error`;
      case 'webgl':
        return `${typeName} Graphics Error`;
      case 'layout':
        return `${typeName} Layout Error`;
      case 'interaction':
        return `${typeName} Interaction Error`;
      default:
        return `${typeName} Error`;
    }
  }

  /**
   * Get error description based on type
   */
  private getErrorDescription() {
    switch (this.state.errorType) {
      case 'rendering':
        return 'Failed to render the visualization. This may be due to complex data or browser limitations.';
      case 'data':
        return 'Invalid or corrupted data detected. The visualization cannot process the provided data.';
      case 'memory':
        return 'Insufficient memory to render the visualization. Try reducing the data size or complexity.';
      case 'webgl':
        return 'Graphics acceleration error. Your browser or device may not support the required features.';
      case 'layout':
        return 'Failed to calculate the visualization layout. This may be due to conflicting positioning constraints.';
      case 'interaction':
        return 'Error handling user interaction. The visualization may be in an unstable state.';
      default:
        return 'An unexpected error occurred while displaying the visualization.';
    }
  }

  /**
   * Get recovery suggestions based on error type
   */
  private getRecoverySuggestions() {
    switch (this.state.errorType) {
      case 'rendering':
        return [
          'Try refreshing the page',
          'Reduce the number of visible elements',
          'Switch to a simpler visualization mode',
          'Update your browser to the latest version'
        ];
      case 'data':
        return [
          'Check the input data format',
          'Reduce the dataset size',
          'Verify all data fields are valid',
          'Try reloading the data source'
        ];
      case 'memory':
        return [
          'Close other browser tabs',
          'Reduce the number of nodes/elements',
          'Use data sampling or pagination',
          'Restart your browser'
        ];
      case 'webgl':
        return [
          'Update your graphics drivers',
          'Enable hardware acceleration in browser',
          'Try a different browser',
          'Switch to software rendering mode'
        ];
      case 'layout':
        return [
          'Try a different layout algorithm',
          'Reduce layout complexity',
          'Reset layout parameters',
          'Use manual positioning'
        ];
      case 'interaction':
        return [
          'Reset the visualization state',
          'Disable complex interactions',
          'Try using keyboard navigation',
          'Refresh the page'
        ];
      default:
        return [
          'Try refreshing the page',
          'Clear browser cache',
          'Reduce visualization complexity',
          'Contact support if issue persists'
        ];
    }
  }

  /**
   * Retry with fallback mode if enabled
   */
  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      return;
    }

    this.setState({ isRetrying: true });

    this.retryTimer = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: this.state.retryCount + 1,
        isRetrying: false,
        fallbackMode: this.state.retryCount >= 1 // Enable fallback mode after first retry
      });
    }, 1000);
  };

  /**
   * Enable simplified fallback mode
   */
  private handleFallbackMode = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      fallbackMode: true,
      retryCount: 0
    });
  };

  /**
   * Reset to full visualization mode
   */
  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      fallbackMode: false
    });
  };

  /**
   * Export error report for debugging
   */
  private handleExportReport = () => {
    const report = {
      error: this.state.error?.message,
      errorType: this.state.errorType,
      visualizationType: this.props.visualizationType,
      dataSize: this.props.dataSize,
      performanceMetrics: this.state.performanceMetrics,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      stack: this.state.error?.stack
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visualization-error-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      const { maxRetries = 3, enableFallbackMode = true } = this.props;
      const canRetry = this.state.retryCount < maxRetries;
      const recoverySuggestions = this.getRecoverySuggestions();

      return (
        <div className="w-full h-96 bg-gray-50 flex items-center justify-center p-4">
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

              {/* Performance Metrics */}
              {Object.keys(this.state.performanceMetrics).length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <h5 className="font-medium text-sm mb-2">Performance Information:</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {this.state.performanceMetrics.nodeCount && (
                      <div>Nodes: {this.state.performanceMetrics.nodeCount}</div>
                    )}
                    {this.state.performanceMetrics.edgeCount && (
                      <div>Edges: {this.state.performanceMetrics.edgeCount}</div>
                    )}
                    {this.state.performanceMetrics.renderTime && (
                      <div>Render Time: {Math.round(this.state.performanceMetrics.renderTime)}ms</div>
                    )}
                    {this.state.performanceMetrics.memoryUsage && (
                      <div>Memory Usage: {Math.round(this.state.performanceMetrics.memoryUsage * 100)}%</div>
                    )}
                  </div>
                </div>
              )}

              {/* Recovery Suggestions */}
              <div>
                <h4 className="font-medium mb-3">What you can try:</h4>
                <ul className="space-y-2">
                  {recoverySuggestions.slice(0, 4).map((suggestion, index) => (
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
                
                {enableFallbackMode && (
                  <Button 
                    onClick={this.handleFallbackMode}
                    variant="outline"
                  >
                    <EyeOff className="w-4 h-4 mr-2" />
                    Simple Mode
                  </Button>
                )}
                
                <Button 
                  onClick={this.handleReset}
                  variant="outline"
                >
                  Reset
                </Button>
                
                <Button 
                  onClick={this.handleExportReport}
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>

              {/* Retry Counter */}
              {this.state.retryCount > 0 && (
                <div className="text-sm text-gray-600">
                  Attempts: {this.state.retryCount}/{maxRetries}
                </div>
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
 * Simple fallback visualization component
 */
export function SimpleFallbackVisualization({ 
  message = "Visualization temporarily unavailable",
  type = "graph"
}: { 
  message?: string;
  type?: string;
}) {
  return (
    <div className="w-full h-96 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
      <div className="text-center space-y-3">
        <EyeOff className="w-12 h-12 text-gray-400 mx-auto" />
        <div>
          <h3 className="font-medium text-gray-600">Simple {type} mode</h3>
          <p className="text-sm text-gray-500 mt-1">{message}</p>
        </div>
        <div className="text-xs text-gray-400">
          Switch back to full mode when ready
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for handling visualization errors in functional components
 */
export function useVisualizationErrorHandler() {
  const [error, setError] = React.useState<string | null>(null);
  const [fallbackMode, setFallbackMode] = React.useState(false);
  const [performanceWarning, setPerformanceWarning] = React.useState(false);

  const handleError = React.useCallback((error: Error | string) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    setError(errorMessage);
    console.error('Visualization error:', error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
    setFallbackMode(false);
  }, []);

  const enableFallbackMode = React.useCallback(() => {
    setFallbackMode(true);
    setError(null);
  }, []);

  const checkPerformance = React.useCallback((nodeCount: number, edgeCount: number) => {
    const totalElements = nodeCount + edgeCount;
    const isLarge = totalElements > 1000;
    setPerformanceWarning(isLarge);
    return !isLarge;
  }, []);

  return {
    error,
    fallbackMode,
    performanceWarning,
    handleError,
    clearError,
    enableFallbackMode,
    checkPerformance
  };
}