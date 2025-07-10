/**
 * Web Worker for Heavy Graph Processing
 * Handles centrality calculations and topology analysis
 */

import { GraphData, GraphNode, GraphEdge } from '../types/asrGotTypes';

// Worker message types
export interface GraphProcessingMessage {
  type: 'CALCULATE_CENTRALITY' | 'ANALYZE_TOPOLOGY' | 'OPTIMIZE_LAYOUT' | 'DETECT_COMMUNITIES';
  payload: {
    graphData: GraphData;
    options?: any;
  };
  id: string;
}

export interface GraphProcessingResponse {
  type: 'SUCCESS' | 'ERROR' | 'PROGRESS';
  payload: any;
  id: string;
  processingTime?: number;
}

// Check if we're in a Web Worker context
const isWorkerContext = typeof importScripts !== 'undefined';

if (isWorkerContext) {
  // Web Worker implementation
  self.onmessage = async (event: MessageEvent<GraphProcessingMessage>) => {
    const startTime = performance.now();
    const { type, payload, id } = event.data;
    
    try {
      let result: any;
      
      switch (type) {
        case 'CALCULATE_CENTRALITY':
          result = await calculateCentrality(payload.graphData);
          break;
        case 'ANALYZE_TOPOLOGY':
          result = await analyzeTopology(payload.graphData);
          break;
        case 'OPTIMIZE_LAYOUT':
          result = await optimizeLayout(payload.graphData, payload.options);
          break;
        case 'DETECT_COMMUNITIES':
          result = await detectCommunities(payload.graphData);
          break;
        default:
          throw new Error(`Unknown processing type: ${type}`);
      }
      
      const processingTime = performance.now() - startTime;
      
      self.postMessage({
        type: 'SUCCESS',
        payload: result,
        id,
        processingTime
      } as GraphProcessingResponse);
      
    } catch (error) {
      self.postMessage({
        type: 'ERROR',
        payload: { error: error instanceof Error ? error.message : 'Unknown error' },
        id
      } as GraphProcessingResponse);
    }
  };
}

// Graph processing functions
async function calculateCentrality(graphData: GraphData) {
  const { nodes, edges } = graphData;
  
  // Calculate degree centrality
  const degreeCentrality = new Map<string, number>();
  nodes.forEach(node => {
    const degree = edges.filter(edge => 
      edge.source === node.id || edge.target === node.id
    ).length;
    degreeCentrality.set(node.id, degree);
  });
  
  // Calculate betweenness centrality (simplified)
  const betweennessCentrality = new Map<string, number>();
  nodes.forEach(node => {
    // Simplified betweenness calculation
    const paths = findAllPaths(node.id, nodes, edges);
    const betweenness = paths.reduce((sum, path) => {
      return sum + (path.includes(node.id) ? 1 : 0);
    }, 0);
    betweennessCentrality.set(node.id, betweenness / paths.length);
  });
  
  // Calculate closeness centrality
  const closenessCentrality = new Map<string, number>();
  nodes.forEach(node => {
    const distances = dijkstra(node.id, nodes, edges);
    const avgDistance = Array.from(distances.values()).reduce((a, b) => a + b, 0) / distances.size;
    closenessCentrality.set(node.id, avgDistance > 0 ? 1 / avgDistance : 0);
  });
  
  return {
    degree: Object.fromEntries(degreeCentrality),
    betweenness: Object.fromEntries(betweennessCentrality),
    closeness: Object.fromEntries(closenessCentrality)
  };
}

async function analyzeTopology(graphData: GraphData) {
  const { nodes, edges } = graphData;
  
  // Basic topology metrics
  const nodeCount = nodes.length;
  const edgeCount = edges.length;
  const density = nodeCount > 1 ? (2 * edgeCount) / (nodeCount * (nodeCount - 1)) : 0;
  
  // Connected components
  const components = findConnectedComponents(nodes, edges);
  
  // Clustering coefficient
  const clusteringCoeff = calculateClusteringCoefficient(nodes, edges);
  
  // Average path length
  const avgPathLength = calculateAveragePathLength(nodes, edges);
  
  return {
    nodeCount,
    edgeCount,
    density,
    components: components.length,
    clusteringCoefficient: clusteringCoeff,
    averagePathLength: avgPathLength,
    isConnected: components.length === 1
  };
}

async function optimizeLayout(graphData: GraphData, options: any = {}) {
  const { nodes, edges } = graphData;
  const { iterations = 100, repulsionStrength = 1000, attractionStrength = 0.1 } = options;
  
  // Force-directed layout algorithm
  const positions = new Map<string, { x: number; y: number }>();
  
  // Initialize positions
  nodes.forEach(node => {
    positions.set(node.id, {
      x: node.position?.x || Math.random() * 800,
      y: node.position?.y || Math.random() * 600
    });
  });
  
  // Iterate force calculations
  for (let i = 0; i < iterations; i++) {
    const forces = new Map<string, { fx: number; fy: number }>();
    
    // Initialize forces
    nodes.forEach(node => {
      forces.set(node.id, { fx: 0, fy: 0 });
    });
    
    // Calculate repulsion forces
    nodes.forEach(node1 => {
      nodes.forEach(node2 => {
        if (node1.id !== node2.id) {
          const pos1 = positions.get(node1.id)!;
          const pos2 = positions.get(node2.id)!;
          const dx = pos1.x - pos2.x;
          const dy = pos1.y - pos2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const force = repulsionStrength / (distance * distance);
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;
            
            const currentForce = forces.get(node1.id)!;
            forces.set(node1.id, {
              fx: currentForce.fx + fx,
              fy: currentForce.fy + fy
            });
          }
        }
      });
    });
    
    // Calculate attraction forces
    edges.forEach(edge => {
      const pos1 = positions.get(edge.source)!;
      const pos2 = positions.get(edge.target)!;
      const dx = pos2.x - pos1.x;
      const dy = pos2.y - pos1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        const force = attractionStrength * distance;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        
        const force1 = forces.get(edge.source)!;
        const force2 = forces.get(edge.target)!;
        
        forces.set(edge.source, {
          fx: force1.fx + fx,
          fy: force1.fy + fy
        });
        
        forces.set(edge.target, {
          fx: force2.fx - fx,
          fy: force2.fy - fy
        });
      }
    });
    
    // Apply forces
    nodes.forEach(node => {
      const pos = positions.get(node.id)!;
      const force = forces.get(node.id)!;
      
      pos.x += force.fx * 0.01;
      pos.y += force.fy * 0.01;
      
      // Boundary constraints
      pos.x = Math.max(50, Math.min(750, pos.x));
      pos.y = Math.max(50, Math.min(550, pos.y));
    });
    
    // Report progress
    if (i % 10 === 0) {
      self.postMessage({
        type: 'PROGRESS',
        payload: { progress: i / iterations },
        id: 'layout-optimization'
      } as GraphProcessingResponse);
    }
  }
  
  return Object.fromEntries(positions);
}

async function detectCommunities(graphData: GraphData) {
  const { nodes, edges } = graphData;
  
  // Simple community detection using connected components
  const communities = findConnectedComponents(nodes, edges);
  
  // Modularity calculation
  const modularity = calculateModularity(nodes, edges, communities);
  
  return {
    communities: communities.map((community, index) => ({
      id: index,
      nodes: community,
      size: community.length
    })),
    modularity,
    communityCount: communities.length
  };
}

// Helper functions
function findAllPaths(nodeId: string, nodes: GraphNode[], edges: GraphEdge[]): string[][] {
  // Simplified path finding - returns sample paths
  const paths: string[][] = [];
  const visited = new Set<string>();
  
  function dfs(current: string, path: string[]) {
    if (visited.has(current)) return;
    visited.add(current);
    path.push(current);
    
    const neighbors = edges
      .filter(edge => edge.source === current || edge.target === current)
      .map(edge => edge.source === current ? edge.target : edge.source);
    
    if (neighbors.length === 0) {
      paths.push([...path]);
    } else {
      neighbors.forEach(neighbor => dfs(neighbor, path));
    }
    
    path.pop();
    visited.delete(current);
  }
  
  dfs(nodeId, []);
  return paths.slice(0, 10); // Limit to 10 paths for performance
}

function dijkstra(startId: string, nodes: GraphNode[], edges: GraphEdge[]): Map<string, number> {
  const distances = new Map<string, number>();
  const unvisited = new Set<string>();
  
  // Initialize distances
  nodes.forEach(node => {
    distances.set(node.id, node.id === startId ? 0 : Infinity);
    unvisited.add(node.id);
  });
  
  while (unvisited.size > 0) {
    // Find unvisited node with minimum distance
    let current = '';
    let minDistance = Infinity;
    
    for (const nodeId of unvisited) {
      const distance = distances.get(nodeId)!;
      if (distance < minDistance) {
        minDistance = distance;
        current = nodeId;
      }
    }
    
    if (current === '') break;
    
    unvisited.delete(current);
    
    // Update distances to neighbors
    const neighbors = edges
      .filter(edge => edge.source === current || edge.target === current)
      .map(edge => edge.source === current ? edge.target : edge.source);
    
    neighbors.forEach(neighbor => {
      if (unvisited.has(neighbor)) {
        const newDistance = distances.get(current)! + 1;
        if (newDistance < distances.get(neighbor)!) {
          distances.set(neighbor, newDistance);
        }
      }
    });
  }
  
  return distances;
}

function findConnectedComponents(nodes: GraphNode[], edges: GraphEdge[]): string[][] {
  const visited = new Set<string>();
  const components: string[][] = [];
  
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      const component: string[] = [];
      const stack = [node.id];
      
      while (stack.length > 0) {
        const current = stack.pop()!;
        if (!visited.has(current)) {
          visited.add(current);
          component.push(current);
          
          const neighbors = edges
            .filter(edge => edge.source === current || edge.target === current)
            .map(edge => edge.source === current ? edge.target : edge.source);
          
          neighbors.forEach(neighbor => {
            if (!visited.has(neighbor)) {
              stack.push(neighbor);
            }
          });
        }
      }
      
      components.push(component);
    }
  });
  
  return components;
}

function calculateClusteringCoefficient(nodes: GraphNode[], edges: GraphEdge[]): number {
  let totalCoeff = 0;
  let nodeCount = 0;
  
  nodes.forEach(node => {
    const neighbors = edges
      .filter(edge => edge.source === node.id || edge.target === node.id)
      .map(edge => edge.source === node.id ? edge.target : edge.source);
    
    if (neighbors.length < 2) return;
    
    const possibleEdges = neighbors.length * (neighbors.length - 1) / 2;
    const actualEdges = neighbors.reduce((count, neighbor1) => {
      return count + neighbors.reduce((innerCount, neighbor2) => {
        if (neighbor1 < neighbor2) {
          const edgeExists = edges.some(edge => 
            (edge.source === neighbor1 && edge.target === neighbor2) ||
            (edge.source === neighbor2 && edge.target === neighbor1)
          );
          return innerCount + (edgeExists ? 1 : 0);
        }
        return innerCount;
      }, 0);
    }, 0);
    
    totalCoeff += actualEdges / possibleEdges;
    nodeCount++;
  });
  
  return nodeCount > 0 ? totalCoeff / nodeCount : 0;
}

function calculateAveragePathLength(nodes: GraphNode[], edges: GraphEdge[]): number {
  let totalLength = 0;
  let pairCount = 0;
  
  nodes.forEach(node1 => {
    const distances = dijkstra(node1.id, nodes, edges);
    distances.forEach((distance, node2Id) => {
      if (node1.id !== node2Id && distance !== Infinity) {
        totalLength += distance;
        pairCount++;
      }
    });
  });
  
  return pairCount > 0 ? totalLength / pairCount : 0;
}

function calculateModularity(nodes: GraphNode[], edges: GraphEdge[], communities: string[][]): number {
  const m = edges.length;
  if (m === 0) return 0;
  
  let modularity = 0;
  
  communities.forEach(community => {
    const communitySet = new Set(community);
    
    // Count edges within community
    const internalEdges = edges.filter(edge => 
      communitySet.has(edge.source) && communitySet.has(edge.target)
    ).length;
    
    // Calculate expected edges
    const totalDegree = community.reduce((sum, nodeId) => {
      const degree = edges.filter(edge => edge.source === nodeId || edge.target === nodeId).length;
      return sum + degree;
    }, 0);
    
    const expectedEdges = (totalDegree * totalDegree) / (4 * m);
    
    modularity += (internalEdges / m) - (expectedEdges / m);
  });
  
  return modularity;
}

// Export for non-worker usage
export {
  calculateCentrality,
  analyzeTopology,
  optimizeLayout,
  detectCommunities
};