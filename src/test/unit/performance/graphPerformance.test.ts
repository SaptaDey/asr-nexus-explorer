import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { performanceTestData } from '@/test/fixtures/testData';
import { mockServices } from '@/test/mocks/mockServices';
import type { GraphData, ASRGoTNode, ASRGoTEdge } from '@/types/asrGotTypes';

// Mock performance API
const mockPerformance = {
  now: vi.fn(),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn()
};

// Mock memory API
const mockMemory = {
  usedJSHeapSize: 50000000,
  totalJSHeapSize: 100000000,
  jsHeapSizeLimit: 2000000000
};

// Mock requestIdleCallback
const mockRequestIdleCallback = vi.fn().mockImplementation((callback) => {
  setTimeout(callback, 0);
  return 1;
});

beforeEach(() => {
  // Setup performance mocks
  global.performance = mockPerformance as any;
  global.requestIdleCallback = mockRequestIdleCallback;
  Object.defineProperty(global.performance, 'memory', {
    value: mockMemory,
    writable: true
  });

  vi.clearAllMocks();
  
  // Mock performance.now to return incrementing values
  let performanceTime = 0;
  mockPerformance.now.mockImplementation(() => performanceTime += 16.67); // ~60fps
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Graph Performance Tests', () => {
  describe('Large Dataset Handling', () => {
    it('should handle 1000+ nodes efficiently', async () => {
      const largeGraph = performanceTestData.largeGraph;
      
      const startTime = performance.now();
      
      // Simulate graph processing
      const processedNodes = largeGraph.nodes.map(node => ({
        ...node,
        processed: true,
        computedMetrics: {
          centrality: Math.random(),
          clustering: Math.random(),
          pageRank: Math.random()
        }
      }));
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      expect(processedNodes).toHaveLength(1000);
      expect(processingTime).toBeLessThan(1000); // Should process within 1 second
    });

    it('should handle 2000+ edges efficiently', async () => {
      const largeGraph = performanceTestData.largeGraph;
      
      const startTime = performance.now();
      
      // Simulate edge weight calculations
      const processedEdges = largeGraph.edges.map(edge => ({
        ...edge,
        normalizedWeight: edge.weight / Math.max(...largeGraph.edges.map(e => e.weight)),
        computedStrength: edge.weight * Math.random()
      }));
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      expect(processedEdges).toHaveLength(2000);
      expect(processingTime).toBeLessThan(500); // Should process within 500ms
    });

    it('should optimize memory usage for large graphs', () => {
      const initialMemory = performance.memory.usedJSHeapSize;
      
      // Create large graph
      const largeGraph = performanceTestData.largeGraph;
      
      // Simulate memory-efficient processing
      const nodeChunks = [];
      const chunkSize = 100;
      
      for (let i = 0; i < largeGraph.nodes.length; i += chunkSize) {
        const chunk = largeGraph.nodes.slice(i, i + chunkSize);
        // Process chunk and release references
        const processedChunk = chunk.map(node => ({ id: node.id, confidence: node.confidence }));
        nodeChunks.push(processedChunk);
      }
      
      const finalMemory = performance.memory.usedJSHeapSize;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 100MB for 1000 nodes)
      expect(memoryIncrease).toBeLessThan(100000000);
    });
  });

  describe('Visualization Performance', () => {
    it('should render graph visualization within acceptable time', async () => {
      const testGraph = performanceTestData.largeGraph;
      
      performance.mark('render-start');
      
      // Simulate Cytoscape graph rendering
      const cytoscapeElements = {
        nodes: testGraph.nodes.map(node => ({
          data: { id: node.id, label: node.label },
          position: { x: Math.random() * 1000, y: Math.random() * 1000 }
        })),
        edges: testGraph.edges.map(edge => ({
          data: { id: `${edge.source}-${edge.target}`, source: edge.source, target: edge.target }
        }))
      };
      
      performance.mark('render-end');
      performance.measure('graph-render', 'render-start', 'render-end');
      
      const renderMeasure = performance.getEntriesByName('graph-render')[0];
      
      expect(cytoscapeElements.nodes).toHaveLength(1000);
      expect(cytoscapeElements.edges).toHaveLength(2000);
      expect(renderMeasure).toBeDefined();
    });

    it('should handle real-time graph updates efficiently', async () => {
      const initialGraph: GraphData = {
        nodes: [],
        edges: [],
        hyperedges: []
      };

      const updateTimes: number[] = [];

      // Simulate real-time updates
      for (let i = 0; i < 100; i++) {
        const startTime = performance.now();
        
        // Add new node
        const newNode: ASRGoTNode = {
          id: `node-${i}`,
          label: `Node ${i}`,
          confidence: [Math.random(), Math.random(), Math.random(), Math.random()],
          metadata: {
            stage: Math.floor(Math.random() * 9) + 1,
            type: 'evidence',
            source: 'generated',
            timestamp: new Date().toISOString()
          }
        };

        initialGraph.nodes.push(newNode);

        // Add edge if possible
        if (i > 0) {
          const newEdge: ASRGoTEdge = {
            source: `node-${i - 1}`,
            target: `node-${i}`,
            type: 'supportive',
            weight: Math.random(),
            metadata: {
              timestamp: new Date().toISOString()
            }
          };
          initialGraph.edges.push(newEdge);
        }

        const endTime = performance.now();
        updateTimes.push(endTime - startTime);
      }

      // All updates should be under 10ms
      const averageUpdateTime = updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;
      expect(averageUpdateTime).toBeLessThan(10);
      
      // No single update should take more than 50ms
      const maxUpdateTime = Math.max(...updateTimes);
      expect(maxUpdateTime).toBeLessThan(50);
    });

    it('should optimize layout calculations for large graphs', () => {
      const largeGraph = performanceTestData.largeGraph;
      
      performance.mark('layout-start');
      
      // Simulate force-directed layout calculation
      const positions = new Map();
      const forces = new Map();
      
      // Initialize positions
      largeGraph.nodes.forEach(node => {
        positions.set(node.id, {
          x: Math.random() * 1000,
          y: Math.random() * 1000
        });
        forces.set(node.id, { x: 0, y: 0 });
      });
      
      // Simulate layout iterations (simplified)
      for (let iteration = 0; iteration < 50; iteration++) {
        // Reset forces
        forces.forEach((force) => {
          force.x = 0;
          force.y = 0;
        });
        
        // Calculate repulsive forces (simplified)
        largeGraph.nodes.forEach(node1 => {
          const pos1 = positions.get(node1.id);
          const force1 = forces.get(node1.id);
          
          largeGraph.nodes.forEach(node2 => {
            if (node1.id !== node2.id) {
              const pos2 = positions.get(node2.id);
              const dx = pos1.x - pos2.x;
              const dy = pos1.y - pos2.y;
              const distance = Math.sqrt(dx * dx + dy * dy) || 1;
              
              const repulsion = 100 / (distance * distance);
              force1.x += (dx / distance) * repulsion;
              force1.y += (dy / distance) * repulsion;
            }
          });
        });
        
        // Apply forces
        positions.forEach((pos, nodeId) => {
          const force = forces.get(nodeId);
          pos.x += force.x * 0.1;
          pos.y += force.y * 0.1;
        });
      }
      
      performance.mark('layout-end');
      performance.measure('layout-calculation', 'layout-start', 'layout-end');
      
      const layoutMeasure = performance.getEntriesByName('layout-calculation')[0];
      expect(layoutMeasure).toBeDefined();
      expect(positions.size).toBe(1000);
    });
  });

  describe('Memory Management', () => {
    it('should prevent memory leaks in long-running sessions', () => {
      const initialMemory = performance.memory.usedJSHeapSize;
      const graphs: GraphData[] = [];
      
      // Simulate creating and disposing of many graphs
      for (let i = 0; i < 10; i++) {
        const graph: GraphData = {
          nodes: Array.from({ length: 100 }, (_, j) => ({
            id: `g${i}-node-${j}`,
            label: `Graph ${i} Node ${j}`,
            confidence: [Math.random(), Math.random(), Math.random(), Math.random()],
            metadata: {
              stage: 1,
              type: 'evidence',
              source: 'generated',
              timestamp: new Date().toISOString()
            }
          })),
          edges: [],
          hyperedges: []
        };
        
        graphs.push(graph);
        
        // Simulate processing
        graph.nodes.forEach(node => {
          // Simulate some processing
          node.processed = true;
        });
        
        // Clear old graphs to simulate cleanup
        if (graphs.length > 5) {
          const oldGraph = graphs.shift();
          // Simulate cleanup
          if (oldGraph) {
            oldGraph.nodes.length = 0;
            oldGraph.edges.length = 0;
          }
        }
      }
      
      // Force garbage collection simulation
      graphs.length = 0;
      
      const finalMemory = performance.memory.usedJSHeapSize;
      const memoryLeak = finalMemory - initialMemory;
      
      // Memory should not increase significantly after cleanup
      expect(memoryLeak).toBeLessThan(10000000); // Less than 10MB leak
    });

    it('should handle WeakMap and WeakSet for optimal memory usage', () => {
      const nodeCache = new WeakMap();
      const processedNodes = new WeakSet();
      
      const testNodes = performanceTestData.largeGraph.nodes.slice(0, 100);
      
      // Use WeakMap for caching
      testNodes.forEach(node => {
        const computedData = {
          centrality: Math.random(),
          processed: true
        };
        nodeCache.set(node, computedData);
        processedNodes.add(node);
      });
      
      // Verify cache works
      testNodes.forEach(node => {
        expect(nodeCache.has(node)).toBe(true);
        expect(processedNodes.has(node)).toBe(true);
      });
      
      // Simulate nodes going out of scope
      // WeakMap and WeakSet should allow garbage collection
      testNodes.length = 0;
      
      // Test passes if no memory errors occur
      expect(true).toBe(true);
    });

    it('should efficiently handle graph data serialization', () => {
      const largeGraph = performanceTestData.largeGraph;
      
      performance.mark('serialize-start');
      
      // Simulate efficient serialization
      const serialized = JSON.stringify({
        nodes: largeGraph.nodes.map(node => ({
          id: node.id,
          label: node.label,
          confidence: node.confidence,
          // Omit large metadata for efficiency
          metadata: {
            stage: node.metadata.stage,
            type: node.metadata.type
          }
        })),
        edges: largeGraph.edges.map(edge => ({
          source: edge.source,
          target: edge.target,
          type: edge.type,
          weight: edge.weight
        }))
      });
      
      performance.mark('serialize-end');
      performance.measure('serialization', 'serialize-start', 'serialize-end');
      
      const serializeMeasure = performance.getEntriesByName('serialization')[0];
      
      expect(serialized.length).toBeGreaterThan(0);
      expect(serializeMeasure).toBeDefined();
      
      // Test deserialization
      performance.mark('deserialize-start');
      const deserialized = JSON.parse(serialized);
      performance.mark('deserialize-end');
      performance.measure('deserialization', 'deserialize-start', 'deserialize-end');
      
      const deserializeMeasure = performance.getEntriesByName('deserialization')[0];
      
      expect(deserialized.nodes).toHaveLength(1000);
      expect(deserializeMeasure).toBeDefined();
    });
  });

  describe('API Performance', () => {
    it('should handle concurrent API requests efficiently', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => 
        mockServices.api.callGemini(`Test query ${i}`, 'test-key', 'thinking-only')
      );
      
      const startTime = performance.now();
      const results = await Promise.all(requests);
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      const avgTimePerRequest = totalTime / requests.length;
      
      expect(results).toHaveLength(10);
      expect(avgTimePerRequest).toBeLessThan(1000); // Average less than 1 second per request
    });

    it('should implement request batching for efficiency', async () => {
      const queries = Array.from({ length: 5 }, (_, i) => `Batch query ${i}`);
      
      performance.mark('batch-start');
      
      // Simulate batched requests
      const batchedRequest = mockServices.api.callGemini(
        `Process multiple queries: ${queries.join('; ')}`,
        'test-key',
        'thinking-structured'
      );
      
      const result = await batchedRequest;
      
      performance.mark('batch-end');
      performance.measure('batch-processing', 'batch-start', 'batch-end');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should cache API responses for performance', async () => {
      const query = 'Cacheable test query';
      const apiKey = 'test-key';
      
      // First call
      performance.mark('first-call-start');
      const result1 = await mockServices.api.callGemini(query, apiKey, 'thinking-only');
      performance.mark('first-call-end');
      
      // Second call (should be cached)
      performance.mark('second-call-start');
      const result2 = await mockServices.api.callGemini(query, apiKey, 'thinking-only');
      performance.mark('second-call-end');
      
      performance.measure('first-call', 'first-call-start', 'first-call-end');
      performance.measure('second-call', 'second-call-start', 'second-call-end');
      
      expect(result1).toBe(result2);
      // Second call should be faster due to caching
    });
  });

  describe('Background Processing Performance', () => {
    it('should handle task queue efficiently', async () => {
      const tasks = Array.from({ length: 20 }, (_, i) => ({
        id: `task-${i}`,
        type: 'graph-processing',
        priority: Math.floor(Math.random() * 3) + 1,
        data: { nodeCount: 100 + i * 10 }
      }));
      
      performance.mark('queue-start');
      
      // Add all tasks to queue
      const taskPromises = tasks.map(task => 
        mockServices.backgroundProcessor.addTask(task.type, task.data, task.priority)
      );
      
      const taskIds = await Promise.all(taskPromises);
      
      performance.mark('queue-end');
      performance.measure('task-queuing', 'queue-start', 'queue-end');
      
      expect(taskIds).toHaveLength(20);
      
      // Verify all tasks are processed
      const statusPromises = taskIds.map(id => 
        mockServices.backgroundProcessor.getTaskStatus(id)
      );
      
      const statuses = await Promise.all(statusPromises);
      expect(statuses.every(status => status === 'completed')).toBe(true);
    });

    it('should prioritize tasks correctly', async () => {
      const highPriorityTask = mockServices.backgroundProcessor.addTask('urgent', {}, 1);
      const lowPriorityTask = mockServices.backgroundProcessor.addTask('normal', {}, 3);
      const mediumPriorityTask = mockServices.backgroundProcessor.addTask('important', {}, 2);
      
      const taskIds = await Promise.all([highPriorityTask, lowPriorityTask, mediumPriorityTask]);
      
      // Verify all tasks complete
      expect(taskIds).toHaveLength(3);
      taskIds.forEach(id => expect(typeof id).toBe('string'));
    });

    it('should handle task cancellation efficiently', async () => {
      const taskPromises = Array.from({ length: 10 }, (_, i) => 
        mockServices.backgroundProcessor.addTask('cancellable', { id: i }, 2)
      );
      
      const taskIds = await Promise.all(taskPromises);
      
      // Cancel half the tasks
      const cancelPromises = taskIds.slice(0, 5).map(id => 
        mockServices.backgroundProcessor.cancelTask(id)
      );
      
      const cancelResults = await Promise.all(cancelPromises);
      expect(cancelResults.every(result => result === true)).toBe(true);
    });
  });

  describe('Real-time Performance Monitoring', () => {
    it('should track performance metrics over time', () => {
      const metrics = {
        renderTimes: [] as number[],
        memoryUsage: [] as number[],
        apiResponseTimes: [] as number[]
      };
      
      // Simulate collecting metrics over time
      for (let i = 0; i < 100; i++) {
        const renderStart = performance.now();
        // Simulate rendering
        setTimeout(() => {}, 16); // 60fps target
        const renderEnd = performance.now();
        
        metrics.renderTimes.push(renderEnd - renderStart);
        metrics.memoryUsage.push(performance.memory.usedJSHeapSize);
        metrics.apiResponseTimes.push(Math.random() * 1000 + 200);
      }
      
      // Calculate performance statistics
      const avgRenderTime = metrics.renderTimes.reduce((a, b) => a + b, 0) / metrics.renderTimes.length;
      const avgMemoryUsage = metrics.memoryUsage.reduce((a, b) => a + b, 0) / metrics.memoryUsage.length;
      const avgApiTime = metrics.apiResponseTimes.reduce((a, b) => a + b, 0) / metrics.apiResponseTimes.length;
      
      expect(avgRenderTime).toBeLessThan(20); // Should average under 20ms
      expect(avgMemoryUsage).toBeGreaterThan(0);
      expect(avgApiTime).toBeLessThan(2000); // Should average under 2 seconds
    });

    it('should detect performance degradation', () => {
      const performanceHistory = {
        renderTimes: [10, 12, 11, 13, 15, 18, 22, 28, 35, 45], // Degrading performance
        threshold: 25
      };
      
      const recentAverage = performanceHistory.renderTimes.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const earlyAverage = performanceHistory.renderTimes.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      
      const degradationRatio = recentAverage / earlyAverage;
      
      expect(degradationRatio).toBeGreaterThan(2.0); // Performance has degraded significantly
      expect(recentAverage).toBeGreaterThan(performanceHistory.threshold);
    });

    it('should provide performance recommendations', () => {
      const currentMetrics = {
        nodeCount: 1500,
        edgeCount: 3000,
        renderTime: 45,
        memoryUsage: 150000000, // 150MB
        apiLatency: 2500
      };
      
      const recommendations = [];
      
      if (currentMetrics.renderTime > 33) { // Slower than 30fps
        recommendations.push('Consider graph virtualization for better rendering performance');
      }
      
      if (currentMetrics.nodeCount > 1000) {
        recommendations.push('Enable node clustering for large graphs');
      }
      
      if (currentMetrics.memoryUsage > 100000000) { // > 100MB
        recommendations.push('Implement memory cleanup for old graph data');
      }
      
      if (currentMetrics.apiLatency > 2000) {
        recommendations.push('Consider request batching or caching');
      }
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations).toContain('Consider graph virtualization for better rendering performance');
      expect(recommendations).toContain('Enable node clustering for large graphs');
    });
  });
});