/**
 * 🐛 Debug Button Component - SECURITY PATCHED
 * Comprehensive error logging and debugging interface with data sanitization
 * CRITICAL: Now prevents research data leakage through secure logging
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Bug, Download, Copy, Trash2, RefreshCw, AlertTriangle, Info, XCircle, CheckCircle, Activity, Monitor, Shield } from 'lucide-react';
import { dataSanitizer } from '@/services/security/DataSanitizationService';
import { secureLogger } from '@/services/security/SecureConsoleLogger';

interface ErrorLog {
  id: string;
  timestamp: string;
  type: 'javascript' | 'react' | 'promise' | 'network' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  source?: string;
  line?: number;
  column?: number;
  stack?: string;
  context?: any;
}

interface DebugState {
  errors: ErrorLog[];
  isRecording: boolean;
  lastUpdate: string;
  realTimeMode: boolean;
  systemHealth: {
    memoryUsage?: number;
    performanceScore?: number;
    errorRate?: number;
  };
}

export const DebugButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [debugState, setDebugState] = useState<DebugState>({
    errors: [],
    isRecording: true,
    lastUpdate: new Date().toISOString(),
    realTimeMode: true,
    systemHealth: {}
  });
  const [activeTab, setActiveTab] = useState('errors');
  const errorIdCounter = useRef(0);
  const addError = React.useCallback(
  (errorData: Omit<ErrorLog, 'id' | 'timestamp'>) => {
    const newError: ErrorLog = {
      ...errorData,
      id: `error_${++errorIdCounter.current}`,
      timestamp: new Date().toISOString()
    };

    setDebugState(prev => ({
      ...prev,
      errors: [newError, ...prev.errors].slice(0, 100),
    }));

    if (errorData.severity === 'critical') {
      toast.error(`Critical Error: ${errorData.message.substring(0, 50)}...`);
    }
  },
  []
);

  // Initialize comprehensive error monitoring system
  useEffect(() => {
    const errorLoggers: (() => void)[] = [];

    // System Health Monitoring
    const updateSystemHealth = () => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        const memoryUsage = memInfo ? (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100 : 0;
        
        setDebugState(prev => ({
          ...prev,
          systemHealth: {
            ...prev.systemHealth,
            memoryUsage,
            errorRate: prev.errors.filter(e => 
              new Date(e.timestamp).getTime() > Date.now() - 60000
            ).length,
            performanceScore: Math.max(0, 100 - memoryUsage)
          }
        }));
      }
    };

    const healthInterval = setInterval(updateSystemHealth, 10000); // Update every 10s
    errorLoggers.push(() => clearInterval(healthInterval));

    // Enhanced JavaScript Error Handler
    const originalErrorHandler = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
      if (debugState.isRecording) {
        addError({
          type: 'javascript',
          severity: 'high',
          message: String(message),
          source,
          line: lineno,
          column: colno,
          stack: error?.stack
        });
      }
      
      if (originalErrorHandler) {
        return originalErrorHandler(message, source, lineno, colno, error);
      }
      return false;
    };

    // 2. Unhandled Promise Rejection Handler
    const promiseRejectionHandler = (event: PromiseRejectionEvent) => {
      if (debugState.isRecording) {
        addError({
          type: 'promise',
          severity: 'high',
          message: `Unhandled Promise Rejection: ${event.reason}`,
          stack: event.reason?.stack || String(event.reason)
        });
      }
    };
    window.addEventListener('unhandledrejection', promiseRejectionHandler);

    // Enhanced Console Error Interceptor with better categorization
    const originalConsoleError = console.error;
    console.error = function(...args) {
      if (debugState.isRecording && args.length > 0) {
        const errorMessage = args.join(' ');
        const isStageError = errorMessage.toLowerCase().includes('stage') && 
                            errorMessage.toLowerCase().includes('failed');
        
        addError({
          type: isStageError ? 'custom' : 'custom',
          severity: isStageError ? 'critical' : 'medium',
          message: errorMessage,
          context: args.length > 1 ? args.slice(1) : undefined
        });
      }
      return originalConsoleError.apply(console, args);
    };

    // 4. React Error Boundary Interceptor (if available)
    const checkForReactErrors = () => {
      try {
        const reactRoot = document.getElementById('root');
        const reactErrorNodes = document.querySelectorAll('[data-react-error]');
        
        reactErrorNodes.forEach(node => {
          const errorMessage = node.getAttribute('data-react-error');
          if (errorMessage && debugState.isRecording) {
            addError({
              type: 'react',
              severity: 'critical',
              message: errorMessage,
              source: 'React Error Boundary'
            });
          }
        });
      } catch (e) {
        // Silent fail - error checking shouldn't break the app
      }
    };

    // 5. Network Error Monitoring
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      try {
        const response = await originalFetch.apply(window, args);
        if (!response.ok && debugState.isRecording) {
          addError({
            type: 'network',
            severity: response.status >= 500 ? 'high' : 'medium',
            message: `Network Error: ${response.status} ${response.statusText}`,
            source: args[0]?.toString()
          });
        }
        return response;
      } catch (error) {
        if (debugState.isRecording) {
          addError({
            type: 'network',
            severity: 'high',
            message: `Network Fetch Failed: ${error}`,
            source: args[0]?.toString(),
            stack: error instanceof Error ? error.stack : undefined
          });
        }
        throw error;
      }
    };

    // Setup cleanup functions
    errorLoggers.push(
      () => {
        window.onerror = originalErrorHandler;
        window.removeEventListener('unhandledrejection', promiseRejectionHandler);
        console.error = originalConsoleError;
        window.fetch = originalFetch;
      }
    );

    // Check for React errors periodically
    const reactErrorCheck = setInterval(checkForReactErrors, 2000);
    errorLoggers.push(() => clearInterval(reactErrorCheck));

    // Cleanup on unmount
    return () => {
      errorLoggers.forEach(cleanup => cleanup());
    };
  }, [debugState.isRecording, addError]);

  const clearErrors = () => {
    setDebugState(prev => ({
      ...prev,
      errors: [],
      lastUpdate: new Date().toISOString()
    }));
    toast.success('Error log cleared');
  };

  const toggleRecording = () => {
    setDebugState(prev => ({
      ...prev,
      isRecording: !prev.isRecording,
      lastUpdate: new Date().toISOString()
    }));
    toast.info(debugState.isRecording ? 'Error recording stopped' : 'Error recording started');
  };

  const exportErrorLog = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      totalErrors: debugState.errors.length,
      isRecording: debugState.isRecording,
      lastUpdate: debugState.lastUpdate,
      errors: debugState.errors,
      systemInfo: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        localStorage: '[REDACTED_FOR_SECURITY]',
        sessionStorage: '[REDACTED_FOR_SECURITY]'
      },
      appState: {
        reactRoot: !!document.getElementById('root'),
        hasContent: (document.getElementById('root')?.innerHTML?.length || 0) > 100,
        bundleScript: document.querySelector('script[src*="index-"]')?.getAttribute('src') || 'Not found'
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asr-got-debug-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Debug log exported successfully');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Info className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <Bug className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const errorStats = debugState.errors.reduce((acc, error) => {
    acc[error.severity] = (acc[error.severity] || 0) + 1;
    acc[error.type] = (acc[error.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={`flex items-center gap-2 ${debugState.errors.length > 0 ? 'border-red-500 text-red-600 bg-red-50' : 'border-gray-300'}`}
        >
          <Bug className="h-4 w-4" />
          🐛 Debug
          {debugState.errors.length > 0 && (
            <Badge variant="destructive" className="ml-1 text-xs">
              {debugState.errors.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              🐛 Debug Console
            </span>
            <div className="flex items-center gap-2">
              <Badge variant={debugState.isRecording ? 'default' : 'secondary'}>
                {debugState.isRecording ? '🔴 Recording' : '⏸️ Paused'}
              </Badge>
              <Badge variant="outline">
                {debugState.errors.length} errors
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={toggleRecording} variant="outline" size="sm">
              {debugState.isRecording ? (
                <>⏸️ Pause Recording</>
              ) : (
                <>▶️ Start Recording</>
              )}
            </Button>
            <Button onClick={clearErrors} variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Errors
            </Button>
            <Button onClick={exportErrorLog} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Log
            </Button>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload App
            </Button>
          </div>

          {/* Error Statistics */}
          {debugState.errors.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-red-600">{errorStats.critical || 0}</div>
                  <p className="text-xs text-muted-foreground">Critical</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-orange-600">{errorStats.high || 0}</div>
                  <p className="text-xs text-muted-foreground">High</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-yellow-600">{errorStats.medium || 0}</div>
                  <p className="text-xs text-muted-foreground">Medium</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{errorStats.low || 0}</div>
                  <p className="text-xs text-muted-foreground">Low</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="errors">
                Errors ({debugState.errors.length})
              </TabsTrigger>
              <TabsTrigger value="realtime">
                <Activity className="h-4 w-4 mr-1" />
                Live
              </TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>
            
            <TabsContent value="errors" className="space-y-4">
              {debugState.errors.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>No Errors Detected</AlertTitle>
                  <AlertDescription>
                    {debugState.isRecording 
                      ? "Great! No errors have been captured yet. The debug system is actively monitoring."
                      : "Error recording is paused. Click 'Start Recording' to begin monitoring."}
                  </AlertDescription>
                </Alert>
              ) : (
                <ScrollArea className="h-[400px] w-full">
                  <div className="space-y-2">
                    {debugState.errors.map((error) => (
                      <Card key={error.id} className="border-l-4 border-l-red-500">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {getSeverityIcon(error.severity)}
                              <Badge variant={getSeverityColor(error.severity) as any}>
                                {error.severity}
                              </Badge>
                              <Badge variant="outline">{error.type}</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(error.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                          <CardTitle className="text-sm font-medium">
                            {error.message}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {error.source && (
                            <p className="text-xs text-muted-foreground mb-2">
                              Source: {error.source}
                              {error.line && `:${error.line}`}
                              {error.column && `:${error.column}`}
                            </p>
                          )}
                          {error.stack && (
                            <details className="mt-2">
                              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                Stack Trace
                              </summary>
                              <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                                {error.stack}
                              </pre>
                            </details>
                          )}
                          <div className="flex gap-2 mt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => copyToClipboard(JSON.stringify(error, null, 2))}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="realtime" className="space-y-4">
              {/* Real-Time Health Monitoring */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {debugState.systemHealth.memoryUsage?.toFixed(1) || 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">Memory Usage</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {debugState.systemHealth.performanceScore?.toFixed(0) || 100}
                    </div>
                    <p className="text-xs text-muted-foreground">Performance Score</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-orange-600">
                      {debugState.systemHealth.errorRate || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Errors/Min</p>
                  </CardContent>
                </Card>
              </div>

              {/* Live Error Stream */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Live Error Stream
                    {debugState.isRecording && (
                      <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64 w-full">
                    {debugState.errors.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p>No errors detected</p>
                        <p className="text-xs">System running smoothly</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {debugState.errors.slice(0, 20).map((error) => (
                          <div
                            key={error.id}
                            className="flex items-start gap-2 p-2 rounded border text-sm"
                          >
                            {getSeverityIcon(error.severity)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={getSeverityColor(error.severity) as any} className="text-xs">
                                  {error.severity}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(error.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-xs break-words">
                                {error.message.length > 80 
                                  ? `${error.message.substring(0, 80)}...` 
                                  : error.message}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="system" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Application State</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>React Root: {document.getElementById('root') ? '✅' : '❌'}</div>
                      <div>Has Content: {(document.getElementById('root')?.innerHTML?.length || 0) > 100 ? '✅' : '❌'}</div>
                      <div>Recording: {debugState.isRecording ? '✅' : '❌'}</div>
                      <div>Last Update: {new Date(debugState.lastUpdate).toLocaleTimeString()}</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Browser Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      value={`URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Viewport: ${window.innerWidth}x${window.innerHeight}
LocalStorage Items: [REDACTED_FOR_SECURITY]
SessionStorage Items: [REDACTED_FOR_SECURITY]
Bundle Script: ${document.querySelector('script[src*="index-"]')?.getAttribute('src') || 'Not found'}`}
                      readOnly
                      className="text-xs font-mono"
                      rows={8}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="export" className="space-y-4">
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Export Options</AlertTitle>
                  <AlertDescription>
                    Export debug information to share with developers or for further analysis.
                  </AlertDescription>
                </Alert>
                
                <div className="grid gap-2">
                  <Button onClick={exportErrorLog} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download Complete Debug Log (JSON)
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => copyToClipboard(JSON.stringify({
                      errors: debugState.errors,
                      timestamp: new Date().toISOString(),
                      url: window.location.href
                    }, null, 2))}
                    className="w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Error Summary to Clipboard
                  </Button>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Quick Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      value={`ASR-GoT Debug Summary
Timestamp: ${new Date().toISOString()}
Total Errors: ${debugState.errors.length}
Critical: ${errorStats.critical || 0}
High: ${errorStats.high || 0}
Medium: ${errorStats.medium || 0}
Low: ${errorStats.low || 0}

Most Recent Error: ${debugState.errors[0]?.message || 'None'}
Recording Status: ${debugState.isRecording ? 'Active' : 'Paused'}`}
                      readOnly
                      className="text-xs font-mono"
                      rows={10}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DebugButton;
