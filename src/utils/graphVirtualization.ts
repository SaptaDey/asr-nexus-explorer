/**
 * Graph Virtualization Utilities
 * Implements efficient rendering for large graphs with viewport culling
 */

import { GraphNode, GraphEdge } from '@/types/asrGotTypes';

interface ViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
}

interface VirtualizedGraphData {
  visibleNodes: GraphNode[];
  visibleEdges: GraphEdge[];
  hiddenNodeCount: number;
  hiddenEdgeCount: number;
  boundingBox: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

interface GraphMetrics {
  nodeCount: number;
  edgeCount: number;
  complexity: number;
  recommendedVirtualization: boolean;
}

// Configuration for virtualization thresholds
const VIRTUALIZATION_CONFIG = {
  MAX_VISIBLE_NODES: 500,
  MAX_VISIBLE_EDGES: 1000,
  NODE_RENDER_DISTANCE: 100, // pixels outside viewport to render
  EDGE_RENDER_DISTANCE: 50,
  MIN_NODE_SIZE_TO_RENDER: 2, // minimum size in pixels
  CLUSTERING_THRESHOLD: 1000, // nodes count to trigger clustering
  PERFORMANCE_BUDGET_MS: 16, // target frame time
};

/**
 * Calculates graph complexity metrics
 */
export const calculateGraphMetrics = (nodes: GraphNode[], edges: GraphEdge[]): GraphMetrics => {
  const nodeCount = nodes.length;
  const edgeCount = edges.length;
  
  // Calculate complexity based on nodes, edges, and connections per node
  const avgConnections = nodeCount > 0 ? (edgeCount * 2) / nodeCount : 0;
  const complexity = nodeCount * Math.log(nodeCount + 1) + edgeCount + avgConnections;
  
  const recommendedVirtualization = 
    nodeCount > VIRTUALIZATION_CONFIG.MAX_VISIBLE_NODES ||
    edgeCount > VIRTUALIZATION_CONFIG.MAX_VISIBLE_EDGES ||
    complexity > 5000;

  return {
    nodeCount,
    edgeCount,
    complexity,
    recommendedVirtualization
  };
};

/**
 * Performs viewport culling to determine visible graph elements
 */
export const performViewportCulling = (
  nodes: GraphNode[],
  edges: GraphEdge[],
  viewport: ViewportBounds
): VirtualizedGraphData => {
  const startTime = performance.now();
  
  // Calculate expanded viewport bounds for rendering buffer
  const expandedViewport = {
    x: viewport.x - VIRTUALIZATION_CONFIG.NODE_RENDER_DISTANCE / viewport.zoom,
    y: viewport.y - VIRTUALIZATION_CONFIG.NODE_RENDER_DISTANCE / viewport.zoom,
    width: viewport.width + (2 * VIRTUALIZATION_CONFIG.NODE_RENDER_DISTANCE) / viewport.zoom,
    height: viewport.height + (2 * VIRTUALIZATION_CONFIG.NODE_RENDER_DISTANCE) / viewport.zoom,
  };

  // Filter visible nodes based on viewport
  const visibleNodes = nodes.filter(node => {
    if (!node.position) return true; // Always render nodes without position
    
    const nodeSize = Math.max(node.size || 20, VIRTUALIZATION_CONFIG.MIN_NODE_SIZE_TO_RENDER);
    
    return (
      node.position.x + nodeSize >= expandedViewport.x &&
      node.position.x - nodeSize <= expandedViewport.x + expandedViewport.width &&
      node.position.y + nodeSize >= expandedViewport.y &&
      node.position.y - nodeSize <= expandedViewport.y + expandedViewport.height
    );
  });

  // Create set of visible node IDs for efficient lookup
  const visibleNodeIds = new Set(visibleNodes.map(node => node.id));

  // Filter visible edges (only include edges between visible nodes)
  const visibleEdges = edges.filter(edge => {
    return visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target);
  });

  // Calculate bounding box of all nodes for overview
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  nodes.forEach(node => {
    if (node.position) {
      minX = Math.min(minX, node.position.x);
      maxX = Math.max(maxX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxY = Math.max(maxY, node.position.y);
    }
  });

  const processingTime = performance.now() - startTime;
  
  // Log performance warning if culling is too slow
  if (processingTime > VIRTUALIZATION_CONFIG.PERFORMANCE_BUDGET_MS) {
    console.warn(`⚠️ Viewport culling took ${processingTime.toFixed(2)}ms (budget: ${VIRTUALIZATION_CONFIG.PERFORMANCE_BUDGET_MS}ms)`);
  }

  return {
    visibleNodes,
    visibleEdges,
    hiddenNodeCount: nodes.length - visibleNodes.length,
    hiddenEdgeCount: edges.length - visibleEdges.length,
    boundingBox: {
      minX: isFinite(minX) ? minX : 0,
      maxX: isFinite(maxX) ? maxX : 0,
      minY: isFinite(minY) ? minY : 0,
      maxY: isFinite(maxY) ? maxY : 0,
    }
  };
};

/**
 * Clusters nearby nodes to reduce rendering complexity
 */
export const clusterNodes = (
  nodes: GraphNode[],
  viewport: ViewportBounds,
  clusterRadius: number = 50
): GraphNode[] => {
  if (nodes.length < VIRTUALIZATION_CONFIG.CLUSTERING_THRESHOLD) {
    return nodes;
  }

  const clustered: GraphNode[] = [];
  const processed = new Set<string>();

  nodes.forEach(node => {
    if (processed.has(node.id)) return;

    const cluster: GraphNode[] = [node];
    const clusterPosition = node.position || { x: 0, y: 0 };

    // Find nearby nodes to cluster
    nodes.forEach(otherNode => {
      if (
        otherNode.id !== node.id &&
        !processed.has(otherNode.id) &&
        otherNode.position
      ) {
        const distance = Math.sqrt(
          Math.pow(otherNode.position.x - clusterPosition.x, 2) +
          Math.pow(otherNode.position.y - clusterPosition.y, 2)
        );

        if (distance <= clusterRadius / viewport.zoom) {
          cluster.push(otherNode);
        }
      }
    });

    // Mark all nodes in cluster as processed
    cluster.forEach(n => processed.add(n.id));

    if (cluster.length > 1) {
      // Create cluster representative
      const clusterNode: GraphNode = {
        id: `cluster_${node.id}`,
        label: `${cluster.length} nodes`,
        type: 'cluster',
        position: clusterPosition,
        size: Math.min(cluster.length * 5 + 20, 100),
        confidence: cluster.reduce((sum, n) => sum + (n.confidence?.[0] || 0), 0) / cluster.length,
        metadata: {
          ...node.metadata,
          isCluster: true,
          clusterSize: cluster.length,
          clusterNodes: cluster.map(n => n.id),
        }
      };
      clustered.push(clusterNode);
    } else {
      clustered.push(node);
    }
  });

  return clustered;
};

/**
 * Implements level-of-detail rendering based on zoom level
 */
export const applyLevelOfDetail = (
  nodes: GraphNode[],
  edges: GraphEdge[],
  zoomLevel: number
): { nodes: GraphNode[]; edges: GraphEdge[] } => {
  const detailLevel = Math.max(0, Math.min(3, Math.floor(zoomLevel * 2))); // 0-3 detail levels

  const processedNodes = nodes.map(node => {
    const lodNode = { ...node };

    switch (detailLevel) {
      case 0: // Far zoom - minimal detail
        lodNode.label = node.type === 'cluster' 
          ? `${node.metadata?.clusterSize || 1} nodes`
          : node.label?.substring(0, 10) + '...' || '';
        break;
      case 1: // Medium zoom - reduced detail
        lodNode.label = node.label?.substring(0, 30) + '...' || '';
        break;
      case 2: // Close zoom - full detail
      case 3: // Very close zoom - enhanced detail
        lodNode.label = node.label || '';
        break;
    }

    return lodNode;
  });

  // Simplify edges based on detail level
  const processedEdges = edges.filter(edge => {
    // At low detail levels, only show important edges
    if (detailLevel === 0) {
      return edge.metadata?.importance === 'high' || 
             edge.type === 'supportive' || 
             edge.type === 'causal_direct';
    }
    return true;
  });

  return {
    nodes: processedNodes,
    edges: processedEdges
  };
};

/**
 * Creates a spatial index for fast node lookup
 */
export class SpatialIndex {
  private grid: Map<string, GraphNode[]> = new Map();
  private cellSize: number;

  constructor(nodes: GraphNode[], cellSize: number = 100) {
    this.cellSize = cellSize;
    this.buildIndex(nodes);
  }

  private buildIndex(nodes: GraphNode[]): void {
    this.grid.clear();
    
    nodes.forEach(node => {
      if (!node.position) return;
      
      const cellX = Math.floor(node.position.x / this.cellSize);
      const cellY = Math.floor(node.position.y / this.cellSize);
      const key = `${cellX},${cellY}`;
      
      if (!this.grid.has(key)) {
        this.grid.set(key, []);
      }
      const gridCell = this.grid.get(key);
      if (gridCell) {
        gridCell.push(node);
      }
    });
  }

  public queryRegion(x: number, y: number, width: number, height: number): GraphNode[] {
    const startCellX = Math.floor(x / this.cellSize);
    const endCellX = Math.floor((x + width) / this.cellSize);
    const startCellY = Math.floor(y / this.cellSize);
    const endCellY = Math.floor((y + height) / this.cellSize);

    const results: GraphNode[] = [];
    
    for (let cellX = startCellX; cellX <= endCellX; cellX++) {
      for (let cellY = startCellY; cellY <= endCellY; cellY++) {
        const key = `${cellX},${cellY}`;
        const cellNodes = this.grid.get(key);
        if (cellNodes) {
          results.push(...cellNodes);
        }
      }
    }
    
    return results;
  }
}

/**
 * Performance monitoring for graph rendering
 */
export class GraphPerformanceMonitor {
  private frameCount = 0;
  private lastFrameTime = 0;
  private fpsHistory: number[] = [];
  private renderTimeHistory: number[] = [];

  public recordFrame(renderTime: number): void {
    const now = performance.now();
    
    if (this.lastFrameTime > 0) {
      const fps = 1000 / (now - this.lastFrameTime);
      this.fpsHistory.push(fps);
      
      // Keep only last 60 samples
      if (this.fpsHistory.length > 60) {
        this.fpsHistory.shift();
      }
    }
    
    this.renderTimeHistory.push(renderTime);
    if (this.renderTimeHistory.length > 60) {
      this.renderTimeHistory.shift();
    }
    
    this.lastFrameTime = now;
    this.frameCount++;
  }

  public getMetrics() {
    const avgFps = this.fpsHistory.length > 0 
      ? this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length 
      : 0;
    
    const avgRenderTime = this.renderTimeHistory.length > 0
      ? this.renderTimeHistory.reduce((a, b) => a + b, 0) / this.renderTimeHistory.length
      : 0;

    return {
      frameCount: this.frameCount,
      averageFPS: Math.round(avgFps),
      averageRenderTime: Math.round(avgRenderTime * 100) / 100,
      isPerformant: avgFps > 30 && avgRenderTime < VIRTUALIZATION_CONFIG.PERFORMANCE_BUDGET_MS,
    };
  }

  public shouldOptimize(): boolean {
    const metrics = this.getMetrics();
    return metrics.averageFPS < 30 || metrics.averageRenderTime > VIRTUALIZATION_CONFIG.PERFORMANCE_BUDGET_MS;
  }
}