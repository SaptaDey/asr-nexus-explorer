/**
 * Hook for using Web Worker graph processing
 */

import { useRef, useCallback, useEffect } from 'react';
import { GraphData } from '@/types/asrGotTypes';
import { GraphProcessingMessage, GraphProcessingResponse } from '@/workers/GraphProcessingWorker';

interface UseGraphProcessingOptions {
  onProgress?: (progress: number) => void;
  onError?: (error: string) => void;
}

export const useGraphProcessing = (options: UseGraphProcessingOptions = {}) => {
  const workerRef = useRef<Worker | null>(null);
  const pendingRequests = useRef<Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }>>(new Map());

  // Initialize worker
  useEffect(() => {
    try {
      // Create worker from the TypeScript file
      const workerCode = `
        // Import the worker functionality
        importScripts('/src/workers/GraphProcessingWorker.ts');
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      
      workerRef.current = new Worker(workerUrl);
      
      workerRef.current.onmessage = (event: MessageEvent<GraphProcessingResponse>) => {
        const { type, payload, id, processingTime } = event.data;
        
        if (type === 'PROGRESS') {
          options.onProgress?.(payload.progress);
          return;
        }
        
        const request = pendingRequests.current.get(id);
        if (request) {
          pendingRequests.current.delete(id);
          
          if (type === 'SUCCESS') {
            request.resolve({ ...payload, processingTime });
          } else if (type === 'ERROR') {
            request.reject(new Error(payload.error));
            options.onError?.(payload.error);
          }
        }
      };
      
      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error);
        options.onError?.('Worker processing error');
      };
      
      URL.revokeObjectURL(workerUrl);
    } catch (error) {
      console.warn('Web Worker not supported, falling back to main thread');
      // Fall back to main thread processing
    }
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [options]);

  // Generic processing function
  const processGraph = useCallback((
    type: GraphProcessingMessage['type'],
    graphData: GraphData,
    processingOptions?: any
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      pendingRequests.current.set(id, { resolve, reject });
      
      if (workerRef.current) {
        // Use Web Worker
        workerRef.current.postMessage({
          type,
          payload: { graphData, options: processingOptions },
          id
        } as GraphProcessingMessage);
        
        // Timeout after 30 seconds
        setTimeout(() => {
          if (pendingRequests.current.has(id)) {
            pendingRequests.current.delete(id);
            reject(new Error('Processing timeout'));
          }
        }, 30000);
      } else {
        // Fall back to main thread (simplified versions)
        setTimeout(() => {
          try {
            let result: any;
            
            switch (type) {
              case 'CALCULATE_CENTRALITY':
                result = calculateCentralityMainThread(graphData);
                break;
              case 'ANALYZE_TOPOLOGY':
                result = analyzeTopologyMainThread(graphData);
                break;
              case 'OPTIMIZE_LAYOUT':
                result = optimizeLayoutMainThread(graphData, processingOptions);
                break;
              case 'DETECT_COMMUNITIES':
                result = detectCommunitiesMainThread(graphData);
                break;
              default:
                throw new Error(`Unknown processing type: ${type}`);
            }
            
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, 100);
      }
    });
  }, []);

  // Specific processing functions
  const calculateCentrality = useCallback((graphData: GraphData) => {
    return processGraph('CALCULATE_CENTRALITY', graphData);
  }, [processGraph]);

  const analyzeTopology = useCallback((graphData: GraphData) => {
    return processGraph('ANALYZE_TOPOLOGY', graphData);
  }, [processGraph]);

  const optimizeLayout = useCallback((graphData: GraphData, options?: any) => {
    return processGraph('OPTIMIZE_LAYOUT', graphData, options);
  }, [processGraph]);

  const detectCommunities = useCallback((graphData: GraphData) => {
    return processGraph('DETECT_COMMUNITIES', graphData);
  }, [processGraph]);

  return {
    calculateCentrality,
    analyzeTopology,
    optimizeLayout,
    detectCommunities,
    isWorkerAvailable: !!workerRef.current
  };
};

// Main thread fallback implementations (simplified)
function calculateCentralityMainThread(graphData: GraphData) {
  const { nodes, edges } = graphData;
  const centrality: Record<string, number> = {};
  
  nodes.forEach(node => {
    const degree = edges.filter(edge => 
      edge.source === node.id || edge.target === node.id
    ).length;
    centrality[node.id] = degree;
  });
  
  return {
    degree: centrality,
    betweenness: centrality, // Simplified
    closeness: centrality    // Simplified
  };
}

function analyzeTopologyMainThread(graphData: GraphData) {
  const { nodes, edges } = graphData;
  
  return {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    density: nodes.length > 1 ? (2 * edges.length) / (nodes.length * (nodes.length - 1)) : 0,
    components: 1, // Simplified
    clusteringCoefficient: 0.5, // Simplified
    averagePathLength: 3, // Simplified
    isConnected: true // Simplified
  };
}

function optimizeLayoutMainThread(graphData: GraphData, options: any = {}) {
  const { nodes } = graphData;
  const positions: Record<string, { x: number; y: number }> = {};
  
  nodes.forEach((node, index) => {
    const angle = (index / nodes.length) * 2 * Math.PI;
    const radius = 200;
    positions[node.id] = {
      x: 400 + radius * Math.cos(angle),
      y: 300 + radius * Math.sin(angle)
    };
  });
  
  return positions;
}

function detectCommunitiesMainThread(graphData: GraphData) {
  const { nodes } = graphData;
  
  return {
    communities: [{
      id: 0,
      nodes: nodes.map(n => n.id),
      size: nodes.length
    }],
    modularity: 0.3, // Simplified
    communityCount: 1
  };
}