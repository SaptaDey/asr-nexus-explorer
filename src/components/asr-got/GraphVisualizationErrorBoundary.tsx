/**
 * Error Boundary for Graph Visualization Component
 * Catches any remaining errors and provides graceful fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GraphVisualizationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging
    console.error('🚨 GraphVisualization Error Boundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-[600px] w-full border border-destructive rounded-lg overflow-hidden bg-background flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle className="text-destructive">Graph Visualization Error</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-muted-foreground mb-2">
                  An unexpected error occurred while rendering the graph visualization.
                </p>
                {this.state.error && (
                  <details className="text-left">
                    <summary className="cursor-pointer text-sm font-medium mb-2">
                      Error Details
                    </summary>
                    <div className="bg-muted p-3 rounded text-xs font-mono">
                      <div className="text-destructive font-bold mb-1">
                        {this.state.error.name}: {this.state.error.message}
                      </div>
                      {this.state.error.stack && (
                        <pre className="whitespace-pre-wrap text-muted-foreground">
                          {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                        </pre>
                      )}
                    </div>
                  </details>
                )}
              </div>
              
              <div className="flex justify-center gap-2">
                <Button 
                  onClick={this.handleReset}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              </div>
              
              <div className="text-center text-xs text-muted-foreground">
                This error has been logged for debugging purposes.
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}