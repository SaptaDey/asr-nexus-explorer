/**
 * TreePerformanceTest.tsx - Performance testing utilities for botanical tree visualization
 * Provides testing framework for animation performance and memory usage
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraphData } from '@/types/asrGotTypes';
import { TreeContainer } from './TreeContainer';

interface PerformanceMetrics {
  frameTime: number;
  memoryUsage: number;
  animationFrames: number;
  stageTransitionTime: number;
  nodeCount: number;
  renderTime: number;
}

interface TreePerformanceTestProps {
  graphData: GraphData;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export const TreePerformanceTest: React.FC<TreePerformanceTestProps> = ({
  graphData,
  onMetricsUpdate
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    frameTime: 0,
    memoryUsage: 0,
    animationFrames: 0,
    stageTransitionTime: 0,
    nodeCount: 0,
    renderTime: 0
  });
  
  const [currentStage, setCurrentStage] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  // Generate test data with varying complexity
  const generateTestData = useCallback((nodeCount: number): GraphData => {
    const nodes = [];
    const edges = [];
    
    // Root node
    nodes.push({
      id: 'root',
      label: 'Test Root',
      type: 'root' as const,
      confidence: [0.8, 0.9, 0.7, 0.85],
      metadata: { impact_score: 0.5 },
      position: { x: 0, y: 0 }
    });
    
    // Generate hierarchy
    for (let i = 1; i < nodeCount; i++) {
      const parentId = i === 1 ? 'root' : `node-${Math.floor(Math.random() * (i - 1)) + 1}`;
      
      nodes.push({
        id: `node-${i}`,
        label: `Test Node ${i}`,
        type: ['dimension', 'hypothesis', 'evidence', 'synthesis'][Math.floor(Math.random() * 4)] as any,
        confidence: [Math.random(), Math.random(), Math.random(), Math.random()],
        metadata: { 
          impact_score: Math.random(),
          disciplinary_tags: ['test-tag'],
          bias_flags: Math.random() > 0.8 ? ['test-bias'] : []
        },
        position: { x: 0, y: 0 }
      });
      
      edges.push({
        id: `edge-${i}`,
        source: parentId,
        target: `node-${i}`,
        type: 'supportive' as const,
        confidence: Math.random(),
        metadata: {}
      });
    }
    
    return {
      nodes,
      edges,
      metadata: {
        version: '1.0.0',
        created: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        stage: currentStage,
        total_nodes: nodes.length,
        total_edges: edges.length,
        graph_metrics: {}
      }
    };
  }, [currentStage]);

  // Run performance benchmark
  const runPerformanceTest = useCallback(async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const testSizes = [10, 50, 100, 200];
    const results: string[] = [];
    
    for (const size of testSizes) {
      const testData = generateTestData(size);
      const startTime = performance.now();
      
      // Memory before test
      const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Test all stage transitions
      for (let stage = 0; stage < 9; stage++) {
        const stageStart = performance.now();
        setCurrentStage(stage);
        
        // Wait for animations to complete
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const stageEnd = performance.now();
        const stageTime = stageEnd - stageStart;
        
        if (stageTime > 100) {
          results.push(`⚠️ Stage ${stage + 1} slow: ${stageTime.toFixed(2)}ms`);
        }
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Memory after test
      const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryDiff = memoryAfter - memoryBefore;
      
      results.push(`✅ ${size} nodes: ${totalTime.toFixed(2)}ms total, ${memoryDiff} bytes memory`);
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        nodeCount: size,
        renderTime: totalTime,
        memoryUsage: memoryDiff
      }));
      
      onMetricsUpdate?.({
        frameTime: totalTime / 9,
        memoryUsage: memoryDiff,
        animationFrames: 9,
        stageTransitionTime: totalTime / 9,
        nodeCount: size,
        renderTime: totalTime
      });
    }
    
    setTestResults(results);
    setIsRunning(false);
  }, [generateTestData, onMetricsUpdate]);

  // Monitor frame rate
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFrameRate = () => {
      const now = performance.now();
      frameCount++;
      
      if (now - lastTime >= 1000) {
        const fps = frameCount;
        frameCount = 0;
        lastTime = now;
        
        setMetrics(prev => ({
          ...prev,
          frameTime: 1000 / fps
        }));
      }
      
      requestAnimationFrame(measureFrameRate);
    };
    
    requestAnimationFrame(measureFrameRate);
  }, []);

  // Stress test with large dataset
  const runStressTest = useCallback(() => {
    const stressData = generateTestData(500);
    setCurrentStage(0);
    
    // Rapid stage cycling
    let stage = 0;
    const interval = setInterval(() => {
      stage = (stage + 1) % 9;
      setCurrentStage(stage);
    }, 500);
    
    // Stop after 10 seconds
    setTimeout(() => {
      clearInterval(interval);
      setIsRunning(false);
    }, 10000);
    
    setIsRunning(true);
  }, [generateTestData]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 Tree Performance Testing
            {isRunning && <Badge variant="secondary" className="animate-pulse">Running...</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.frameTime.toFixed(1)}ms</div>
              <div className="text-sm text-muted-foreground">Frame Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.nodeCount}</div>
              <div className="text-sm text-muted-foreground">Nodes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{(metrics.memoryUsage / 1024).toFixed(1)}KB</div>
              <div className="text-sm text-muted-foreground">Memory</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{metrics.renderTime.toFixed(1)}ms</div>
              <div className="text-sm text-muted-foreground">Render Time</div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={runPerformanceTest} 
              disabled={isRunning}
              variant="outline"
            >
              Run Benchmark
            </Button>
            <Button 
              onClick={runStressTest} 
              disabled={isRunning}
              variant="outline"
            >
              Stress Test
            </Button>
          </div>
          
          {testResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Test Results:</h4>
              <div className="bg-muted p-4 rounded text-sm space-y-1">
                {testResults.map((result, i) => (
                  <div key={i} className="font-mono">{result}</div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Test visualization */}
      <TreeContainer
        graphData={graphData}
        currentStage={currentStage}
        isProcessing={isRunning}
        onStageSelect={setCurrentStage}
      />
    </div>
  );
};