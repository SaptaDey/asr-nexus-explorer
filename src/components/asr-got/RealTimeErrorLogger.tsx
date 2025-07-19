/**
 * Real-Time Error Logger Component
 * Provides continuous error monitoring and real-time display
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { AlertTriangle, Bug, XCircle, Info, Trash2, Eye, EyeOff } from 'lucide-react';

interface RealTimeError {
  id: string;
  timestamp: string;
  type: 'javascript' | 'react' | 'promise' | 'network' | 'custom' | 'stage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  source?: string;
  line?: number;
  column?: number;
  stack?: string;
  context?: any;
  stage?: number;
}

interface RealTimeErrorLoggerProps {
  maxErrors?: number;
  showInline?: boolean;
  onErrorCapture?: (error: RealTimeError) => void;
}

export const RealTimeErrorLogger: React.FC<RealTimeErrorLoggerProps> = ({
  maxErrors = 50,
  showInline = true,
  onErrorCapture
}) => {
  const [errors, setErrors] = useState<RealTimeError[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const errorIdCounter = useRef(0);
  const cleanupFunctions = useRef<(() => void)[]>([]);

  // Initialize comprehensive error monitoring
  useEffect(() => {
    if (!isMonitoring) return;

    const cleanup: (() => void)[] = [];

    // 1. JavaScript Runtime Errors
    const originalErrorHandler = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
      addError({
        type: 'javascript',
        severity: 'high',
        message: String(message),
        source,
        line: lineno,
        column: colno,
        stack: error?.stack
      });

      if (originalErrorHandler) {
        return originalErrorHandler(message, source, lineno, colno, error);
      }
      return false;
    };

    // 2. Unhandled Promise Rejections
    const promiseRejectionHandler = (event: PromiseRejectionEvent) => {
      addError({
        type: 'promise',
        severity: 'high',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack || String(event.reason)
      });
    };
    window.addEventListener('unhandledrejection', promiseRejectionHandler);

    // 3. Console Error Interceptor
    const originalConsoleError = console.error;
    console.error = function(...args) {
      const errorMessage = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      // Check if it's a Stage-related error
      const isStageError = errorMessage.toLowerCase().includes('stage') || 
                          errorMessage.toLowerCase().includes('failed') ||
                          errorMessage.toLowerCase().includes('invalid input');
      
      addError({
        type: isStageError ? 'stage' : 'custom',
        severity: isStageError ? 'critical' : 'medium',
        message: errorMessage,
        context: args.length > 1 ? args.slice(1) : undefined,
        stage: isStageError ? extractStageNumber(errorMessage) : undefined
      });

      return originalConsoleError.apply(console, args);
    };

    // 4. Console Warn Interceptor (for React warnings)
    const originalConsoleWarn = console.warn;
    console.warn = function(...args) {
      const warnMessage = args.join(' ');
      
      // Only capture React-related warnings
      if (warnMessage.includes('React') || warnMessage.includes('Warning:')) {
        addError({
          type: 'react',
          severity: 'medium',
          message: `React Warning: ${warnMessage}`,
          context: args
        });
      }

      return originalConsoleWarn.apply(console, args);
    };

    // 5. Network Error Monitoring
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      try {
        const response = await originalFetch.apply(window, args);
        if (!response.ok) {
          addError({
            type: 'network',
            severity: response.status >= 500 ? 'high' : 'medium',
            message: `Network Error: ${response.status} ${response.statusText}`,
            source: args[0]?.toString()
          });
        }
        return response;
      } catch (error) {
        addError({
          type: 'network',
          severity: 'high',
          message: `Network Fetch Failed: ${error}`,
          source: args[0]?.toString(),
          stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
      }
    };

    // 6. Custom Event Listener for Application Errors
    const customErrorHandler = (event: CustomEvent<RealTimeError>) => {
      addError(event.detail);
    };
    window.addEventListener('app-error', customErrorHandler as EventListener);

    // Setup cleanup
    cleanup.push(
      () => {
        window.onerror = originalErrorHandler;
        window.removeEventListener('unhandledrejection', promiseRejectionHandler);
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
        window.fetch = originalFetch;
        window.removeEventListener('app-error', customErrorHandler as EventListener);
      }
    );

    cleanupFunctions.current = cleanup;

    return () => {
      cleanup.forEach(fn => fn());
    };
  }, [isMonitoring]);

  const extractStageNumber = (message: string): number | undefined => {
    const stageMatch = message.match(/stage\s*(\d+)/i);
    return stageMatch ? parseInt(stageMatch[1], 10) : undefined;
  };

  const addError = (errorData: Omit<RealTimeError, 'id' | 'timestamp'>) => {
    const newError: RealTimeError = {
      ...errorData,
      id: `rt_error_${++errorIdCounter.current}`,
      timestamp: new Date().toISOString()
    };

    setErrors(prev => [newError, ...prev].slice(0, maxErrors));

    // Call external handler if provided
    onErrorCapture?.(newError);

    // Show toast for critical errors
    if (errorData.severity === 'critical') {
      toast.error(`🚨 Critical Error: ${errorData.message.substring(0, 80)}...`);
    } else if (errorData.severity === 'high') {
      toast.error(`⚠️ Error: ${errorData.message.substring(0, 80)}...`);
    }
  };

  const clearErrors = () => {
    setErrors([]);
    toast.success('Error log cleared');
  };

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    toast.info(isMonitoring ? 'Error monitoring stopped' : 'Error monitoring started');
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Info className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Bug className="h-4 w-4 text-blue-500" />;
      default: return <Bug className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  // Global error capture function
  useEffect(() => {
    (window as any).captureError = (error: Partial<RealTimeError>) => {
      addError({
        type: 'custom',
        severity: 'medium',
        message: 'Custom error captured',
        ...error
      });
    };

    return () => {
      delete (window as any).captureError;
    };
  }, []);

  if (!showInline) return null;

  return (
    <Card className="w-full border-l-4 border-l-blue-500">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Real-Time Error Monitor
            {errors.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {errors.length}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsVisible(!isVisible)}
              variant="ghost"
              size="sm"
            >
              {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              onClick={toggleMonitoring}
              variant="ghost"
              size="sm"
              className={isMonitoring ? 'text-green-600' : 'text-red-600'}
            >
              {isMonitoring ? '🟢' : '🔴'}
            </Button>
            <Button
              onClick={clearErrors}
              variant="ghost"
              size="sm"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isVisible && (
        <CardContent className="pt-0">
          {!isMonitoring && (
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Error monitoring is currently paused. Click the 🔴 button to resume.
              </AlertDescription>
            </Alert>
          )}

          {errors.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              {isMonitoring ? '✅ No errors detected' : '⏸️ Monitoring paused'}
            </div>
          ) : (
            <ScrollArea className="h-48 w-full">
              <div className="space-y-2">
                {errors.slice(0, 10).map((error) => (
                  <div
                    key={error.id}
                    className="flex items-start gap-2 p-2 rounded border bg-muted/30"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getSeverityIcon(error.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getSeverityColor(error.severity)} className="text-xs">
                          {error.severity}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {error.type}
                        </Badge>
                        {error.stage && (
                          <Badge variant="secondary" className="text-xs">
                            Stage {error.stage}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(error.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-foreground break-words">
                        {error.message.length > 100 
                          ? `${error.message.substring(0, 100)}...` 
                          : error.message}
                      </p>
                      {error.source && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {error.source}
                          {error.line && `:${error.line}`}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {errors.length > 10 && (
                  <div className="text-center py-2 text-xs text-muted-foreground">
                    ... and {errors.length - 10} more errors
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      )}
    </Card>
  );
};

// Export utility function for manual error reporting
export const reportError = (error: Partial<RealTimeError>) => {
  if (typeof window !== 'undefined' && (window as any).captureError) {
    (window as any).captureError(error);
  }
};

export default RealTimeErrorLogger;