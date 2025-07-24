/**
 * Memory Status Indicator Component
 * Displays current memory usage and provides optimization controls
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Database, 
  HardDrive, 
  MemoryStick, 
  Trash2, 
  Zap,
  Info,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { MemoryMetrics } from '@/services/memory/MemoryManager';
import { toast } from 'sonner';

interface MemoryStatusIndicatorProps {
  metrics: MemoryMetrics;
  status: {
    pressure: string;
    recommendations: string[];
    actions: string[];
  };
  onOptimize: () => Promise<any>;
  onUpdateMetrics: () => MemoryMetrics;
  className?: string;
  showDetailedView?: boolean;
}

export const MemoryStatusIndicator: React.FC<MemoryStatusIndicatorProps> = ({
  metrics,
  status,
  onOptimize,
  onUpdateMetrics,
  className = '',
  showDetailedView = false
}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [lastOptimization, setLastOptimization] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);

  // Auto-refresh metrics
  useEffect(() => {
    if (showDetailedView) {
      setRefreshInterval(setInterval(() => {
        onUpdateMetrics();
      }, 5000));
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [showDetailedView, onUpdateMetrics]);

  const handleOptimize = async () => {
    if (isOptimizing) return;

    try {
      setIsOptimizing(true);
      toast.info('🔧 Optimizing memory usage...');
      
      const result = await onOptimize();
      setLastOptimization(result);
      
      if (result.freed > 0) {
        const freedMB = (result.freed / (1024 * 1024)).toFixed(1);
        toast.success(`✅ Memory optimized! Freed ${freedMB}MB of memory`);
      } else {
        toast.info('ℹ️ Memory already optimized');
      }
    } catch (error) {
      console.error('Memory optimization failed:', error);
      toast.error('❌ Memory optimization failed');
    } finally {
      setIsOptimizing(false);
      onUpdateMetrics(); // Refresh metrics after optimization
    }
  };

  const getPressureColor = (pressure: string) => {
    switch (pressure) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getPressureIcon = (pressure: string) => {
    switch (pressure) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium': return <Activity className="h-4 w-4 text-yellow-600" />;
      default: return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getMemoryUsagePercentage = (): number => {
    if (metrics.usedJSHeapSize && metrics.jsHeapSizeLimit) {
      return (metrics.usedJSHeapSize / metrics.jsHeapSizeLimit) * 100;
    }
    return 0;
  };

  // Compact indicator for toolbar/status bar
  if (!showDetailedView) {
    return (
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 px-2 ${getPressureColor(status.pressure)} ${className}`}
          >
            {getPressureIcon(status.pressure)}
            <span className="ml-1 text-xs font-medium">
              {status.pressure.toUpperCase()}
            </span>
            <MemoryStick className="h-3 w-3 ml-1" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MemoryStick className="h-5 w-5" />
              Memory Status & Optimization
            </DialogTitle>
            <DialogDescription>
              Monitor memory usage and optimize session data to prevent browser slowdown
            </DialogDescription>
          </DialogHeader>
          <MemoryDetailsContent 
            metrics={metrics}
            status={status}
            onOptimize={handleOptimize}
            isOptimizing={isOptimizing}
            lastOptimization={lastOptimization}
            formatBytes={formatBytes}
            getMemoryUsagePercentage={getMemoryUsagePercentage}
            getPressureColor={getPressureColor}
            getPressureIcon={getPressureIcon}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Detailed view for dashboard/settings
  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MemoryStick className="h-4 w-4" />
          Memory Status
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onUpdateMetrics()}
            className="ml-auto h-6 w-6 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MemoryDetailsContent 
          metrics={metrics}
          status={status}
          onOptimize={handleOptimize}
          isOptimizing={isOptimizing}
          lastOptimization={lastOptimization}
          formatBytes={formatBytes}
          getMemoryUsagePercentage={getMemoryUsagePercentage}
          getPressureColor={getPressureColor}
          getPressureIcon={getPressureIcon}
        />
      </CardContent>
    </Card>
  );
};

interface MemoryDetailsContentProps {
  metrics: MemoryMetrics;
  status: any;
  onOptimize: () => void;
  isOptimizing: boolean;
  lastOptimization: any;
  formatBytes: (bytes: number) => string;
  getMemoryUsagePercentage: () => number;
  getPressureColor: (pressure: string) => string;
  getPressureIcon: (pressure: string) => React.ReactNode;
}

const MemoryDetailsContent: React.FC<MemoryDetailsContentProps> = ({
  metrics,
  status,
  onOptimize,
  isOptimizing,
  lastOptimization,
  formatBytes,
  getMemoryUsagePercentage,
  getPressureColor,
  getPressureIcon
}) => {
  const memoryUsagePercentage = getMemoryUsagePercentage();

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <div className={`p-3 rounded-lg border ${getPressureColor(status.pressure)}`}>
        <div className="flex items-center gap-2 mb-2">
          {getPressureIcon(status.pressure)}
          <span className="font-semibold">
            Memory Pressure: {status.pressure.toUpperCase()}
          </span>
        </div>
        {status.actions.length > 0 && (
          <div className="text-sm">
            Active: {status.actions.join(', ')}
          </div>
        )}
      </div>

      {/* Memory Usage Overview */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Memory Usage</h4>
        
        {metrics.usedJSHeapSize && (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>JavaScript Heap</span>
              <span>{formatBytes(metrics.usedJSHeapSize)} / {formatBytes(metrics.jsHeapSizeLimit || 0)}</span>
            </div>
            <Progress value={memoryUsagePercentage} className="h-2" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              <span>Session Data</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {formatBytes(metrics.sessionDataSize)}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              <span>Graph Data</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {formatBytes(metrics.graphDataSize)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <HardDrive className="h-3 w-3" />
              <span>Local Storage</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {formatBytes(metrics.localStorageSize)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <HardDrive className="h-3 w-3" />
              <span>Session Storage</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {formatBytes(metrics.sessionStorageSize)}
            </div>
          </div>
        </div>
      </div>

      {/* Optimization */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Optimization</h4>
          <Button
            onClick={onOptimize}
            disabled={isOptimizing}
            size="sm"
            variant={status.pressure === 'critical' ? 'destructive' : 'default'}
          >
            {isOptimizing ? (
              <>
                <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Zap className="h-3 w-3 mr-2" />
                Optimize Memory
              </>
            )}
          </Button>
        </div>

        {lastOptimization && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Last optimization freed {formatBytes(lastOptimization.freed)} 
              ({(lastOptimization.compressionRatio || 1).toFixed(1)}x compression)
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Recommendations */}
      {status.recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-1">
            <Info className="h-3 w-3" />
            Recommendations
          </h4>
          <div className="space-y-1">
            {status.recommendations.map((rec, index) => (
              <div key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></div>
                {rec}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Details */}
      <Tabs defaultValue="storage" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="storage">Storage Details</TabsTrigger>
          <TabsTrigger value="trends">Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="storage" className="space-y-2">
          <ScrollArea className="h-32">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Stage Results Size:</span>
                <span>{formatBytes(metrics.stageResultsSize)}</span>
              </div>
              {metrics.usedJSHeapSize && (
                <>
                  <div className="flex justify-between">
                    <span>Total JS Heap:</span>
                    <span>{formatBytes(metrics.totalJSHeapSize || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Heap Limit:</span>
                    <span>{formatBytes(metrics.jsHeapSizeLimit || 0)}</span>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-2">
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center gap-1 mb-2">
              <TrendingUp className="h-3 w-3" />
              Memory trend information would be displayed here
            </div>
            <div>Monitor memory usage patterns over time to identify potential leaks or optimization opportunities.</div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MemoryStatusIndicator;