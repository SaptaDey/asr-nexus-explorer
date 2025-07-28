/**
 * Comprehensive Debug Panel Component
 * Unified debug interface with real-time monitoring and error tracking
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DebugButton } from './DebugButton';
import { RealTimeErrorLogger } from './RealTimeErrorLogger';
import { DebugErrorExport } from './DebugErrorExport';
import { Bug, Activity, Download, Settings } from 'lucide-react';
import type { GraphData, ResearchContext } from '@/types/asrGotTypes';

interface DebugPanelProps {
  graphData: GraphData;
  researchContext: ResearchContext;
  stageResults: string[];
  currentStage: number;
  isProcessing: boolean;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  graphData,
  researchContext,
  stageResults,
  currentStage,
  isProcessing,
  isVisible = true,
  onToggleVisibility
}) => {
  const [errorLogs, setErrorLogs] = useState<any[]>([]);

  const handleErrorCapture = (error: any) => {
    setErrorLogs(prev => [error, ...prev].slice(0, 100));
  };

  if (!isVisible) {
    return (
      <Button
        onClick={onToggleVisibility}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 bg-red-50 border-red-200 text-red-700"
      >
        <Bug className="h-4 w-4 mr-2" />
        Show Debug
      </Button>
    );
  }

  return (
    <Card className="w-full border-l-4 border-l-red-500 bg-red-50/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-red-700">
            <Bug className="h-5 w-5" />
            🐛 Comprehensive Debug Panel
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-xs">
              {errorLogs.length} errors logged
            </Badge>
            {onToggleVisibility && (
              <Button onClick={onToggleVisibility} variant="ghost" size="sm">
                ✕
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="realtime" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="realtime" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Real-Time
            </TabsTrigger>
            <TabsTrigger value="debug" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Debug Tools
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="logs">
              System Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="realtime" className="space-y-4">
            <RealTimeErrorLogger 
              maxErrors={50}
              showInline={true}
              onErrorCapture={handleErrorCapture}
            />
          </TabsContent>

          <TabsContent value="debug" className="space-y-4">
            <div className="flex gap-2">
              <DebugButton />
              <Button
                onClick={() => {
                  console.log('🔍 Debug Info:', {
                    graphData,
                    researchContext,
                    stageResults,
                    currentStage,
                    isProcessing,
                    timestamp: new Date().toISOString()
                  });
                }}
                variant="outline"
                size="sm"
              >
                Log State
              </Button>
              <Button
                onClick={() => {
                  // Trigger test error for debugging
                  throw new Error('Test error for debugging purposes');
                }}
                variant="outline"
                size="sm"
                className="text-orange-600"
              >
                Test Error
              </Button>
            </div>

            {/* Current System State */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Current System State</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Current Stage: <Badge>{currentStage + 1}</Badge></div>
                  <div>Processing: <Badge variant={isProcessing ? 'default' : 'secondary'}>
                    {isProcessing ? 'Active' : 'Idle'}
                  </Badge></div>
                  <div>Graph Nodes: <Badge variant="outline">{graphData.nodes.length}</Badge></div>
                  <div>Graph Edges: <Badge variant="outline">{graphData.edges.length}</Badge></div>
                  <div>Topic: <Badge variant="outline">{researchContext.topic || 'Not set'}</Badge></div>
                  <div>Field: <Badge variant="outline">{researchContext.field || 'Not set'}</Badge></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <DebugErrorExport
              graphData={graphData}
              researchContext={researchContext}
              stageResults={stageResults}
              errorLogs={errorLogs}
              currentStage={currentStage}
              isProcessing={isProcessing}
            />
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Stage Execution Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {stageResults.map((result, index) => (
                    <div key={index} className="p-2 bg-muted rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary">Stage {index + 1}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {result ? `${result.length} chars` : 'No result'}
                        </span>
                      </div>
                      {result && (
                        <div className="text-xs text-muted-foreground max-h-20 overflow-y-auto">
                          {result.substring(0, 200)}
                          {result.length > 200 && '...'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DebugPanel;