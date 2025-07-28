/**
 * Graph Visualization Type Definitions
 * Standardized types for all graph visualization components
 */

import { GraphNode, GraphEdge, HyperEdge, GraphData } from './asrGotTypes';

// Cytoscape.js compatible types
export interface CytoscapeNodeData {
  id: string;
  label: string;
  type: string;
  confidence: number | number[];
  metadata: any;
  position?: { x: number; y: number };
  // Cytoscape specific properties
  parent?: string;
  classes?: string;
  scratch?: any;
}

export interface CytoscapeEdgeData {
  id: string;
  source: string;
  target: string;
  type: string;
  confidence: number;
  metadata: any;
  weight?: number;
  bidirectional?: boolean;
  // Cytoscape specific properties
  classes?: string;
  scratch?: any;
}

export interface CytoscapeElement {
  data: CytoscapeNodeData | CytoscapeEdgeData;
  position?: { x: number; y: number };
  group?: 'nodes' | 'edges';
  classes?: string;
  selected?: boolean;
  selectable?: boolean;
  locked?: boolean;
  grabbable?: boolean;
}

// ReactFlow compatible types
export interface ReactFlowNodeData {
  label: string;
  type: string;
  confidence: number | number[];
  metadata: any;
  // ReactFlow specific properties
  toolbarVisible?: boolean;
  toolbarPosition?: string;
  isConnectable?: boolean;
}

export interface ReactFlowEdgeData {
  type: string;
  confidence: number;
  metadata: any;
  // ReactFlow specific properties
  animated?: boolean;
  markerEnd?: any;
  markerStart?: any;
}

export interface ReactFlowNode {
  id: string;
  type: string;
  data: ReactFlowNodeData;
  position: { x: number; y: number };
  width?: number;
  height?: number;
  draggable?: boolean;
  selectable?: boolean;
  connectable?: boolean;
  deletable?: boolean;
  parentNode?: string;
  zIndex?: number;
  extent?: 'parent' | [[number, number], [number, number]];
  expandParent?: boolean;
  positionAbsolute?: { x: number; y: number };
  ariaLabel?: string;
  style?: React.CSSProperties;
  className?: string;
  sourcePosition?: string;
  targetPosition?: string;
  hidden?: boolean;
  selected?: boolean;
  dragHandle?: string;
}

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type?: string;
  data?: ReactFlowEdgeData;
  style?: React.CSSProperties;
  className?: string;
  animated?: boolean;
  hidden?: boolean;
  deletable?: boolean;
  selectable?: boolean;
  focusable?: boolean;
  markerStart?: any;
  markerEnd?: any;
  pathOptions?: any;
  interactionWidth?: number;
  zIndex?: number;
  ariaLabel?: string;
  selected?: boolean;
}

// D3.js compatible types
export interface D3NodeData {
  id: string;
  label: string;
  type: string;
  confidence: number | number[];
  metadata: any;
  // D3 simulation properties
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
  index?: number;
}

export interface D3EdgeData {
  id: string;
  source: string | D3NodeData;
  target: string | D3NodeData;
  type: string;
  confidence: number;
  metadata: any;
  weight?: number;
  // D3 force properties
  index?: number;
}

// Plotly.js compatible types for network graphs
export interface PlotlyNodeData {
  x: number[];
  y: number[];
  mode: 'markers' | 'text' | 'markers+text';
  type: 'scatter';
  text: string[];
  textposition: string;
  marker: {
    size: number[];
    color: string[] | string;
    line: {
      width: number;
      color: string;
    };
  };
  hovertemplate: string;
  name: string;
}

export interface PlotlyEdgeData {
  x: number[];
  y: number[];
  mode: 'lines';
  type: 'scatter';
  line: {
    width: number;
    color: string;
  };
  hoverinfo: 'none';
  showlegend: boolean;
}

// Visualization adapter interfaces
export interface GraphVisualizationAdapter<TNode, TEdge> {
  convertNodes(nodes: GraphNode[]): TNode[];
  convertEdges(edges: GraphEdge[]): TEdge[];
  convertHyperEdges?(hyperedges: HyperEdge[]): TEdge[];
  validateData(data: GraphData): boolean;
  normalizeData(data: GraphData): GraphData;
}

// Type guards for runtime type checking
export function isValidGraphNode(node: any): node is GraphNode {
  return (
    typeof node === 'object' &&
    typeof node.id === 'string' &&
    typeof node.label === 'string' &&
    typeof node.type === 'string' &&
    (Array.isArray(node.confidence) || typeof node.confidence === 'number') &&
    typeof node.metadata === 'object'
  );
}

export function isValidGraphEdge(edge: any): edge is GraphEdge {
  return (
    typeof edge === 'object' &&
    typeof edge.id === 'string' &&
    typeof edge.source === 'string' &&
    typeof edge.target === 'string' &&
    typeof edge.type === 'string' &&
    typeof edge.confidence === 'number' &&
    typeof edge.metadata === 'object'
  );
}

export function isValidGraphData(data: any): data is GraphData {
  return (
    typeof data === 'object' &&
    Array.isArray(data.nodes) &&
    Array.isArray(data.edges) &&
    data.nodes.every(isValidGraphNode) &&
    data.edges.every(isValidGraphEdge) &&
    typeof data.metadata === 'object'
  );
}

// Error types for graph visualization
export class GraphVisualizationError extends Error {
  constructor(
    message: string,
    public code: string,
    public data?: any
  ) {
    super(message);
    this.name = 'GraphVisualizationError';
  }
}

export class GraphDataValidationError extends GraphVisualizationError {
  constructor(message: string, data?: any) {
    super(message, 'VALIDATION_ERROR', data);
    this.name = 'GraphDataValidationError';
  }
}

export class GraphTypeConversionError extends GraphVisualizationError {
  constructor(message: string, data?: any) {
    super(message, 'CONVERSION_ERROR', data);
    this.name = 'GraphTypeConversionError';
  }
}

// Utility types for graph operations
export interface GraphMetrics {
  nodeCount: number;
  edgeCount: number;
  hyperedgeCount: number;
  avgConfidence: number;
  confidenceDistribution: { [key: string]: number };
  typeDistribution: { nodes: { [key: string]: number }; edges: { [key: string]: number } };
  complexity: number;
  density: number;
  connectedComponents: number;
}

export interface GraphLayout {
  algorithm: 'force' | 'hierarchical' | 'circular' | 'grid' | 'concentric';
  options: {
    iterations?: number;
    nodeRepulsion?: number;
    nodeDistance?: number;
    edgeLength?: number;
    gravity?: number;
    stabilization?: boolean;
    animate?: boolean;
  };
}

export interface GraphStyle {
  nodes: {
    shape: 'circle' | 'rectangle' | 'ellipse' | 'triangle';
    size: { min: number; max: number };
    colors: { [nodeType: string]: string };
    borderWidth: number;
    borderColor: string;
    fontSize: number;
    fontColor: string;
  };
  edges: {
    width: { min: number; max: number };
    colors: { [edgeType: string]: string };
    arrowSize: number;
    curvature: number;
    opacity: number;
  };
  layout: GraphLayout;
}

// Export consolidated types
export type VisualizationNodeData = CytoscapeNodeData | ReactFlowNodeData | D3NodeData;
export type VisualizationEdgeData = CytoscapeEdgeData | ReactFlowEdgeData | D3EdgeData;
export type VisualizationElement = CytoscapeElement | ReactFlowNode | ReactFlowEdge;

// Default configuration
export const DEFAULT_GRAPH_STYLE: GraphStyle = {
  nodes: {
    shape: 'circle',
    size: { min: 20, max: 60 },
    colors: {
      'root': '#1f77b4',
      'dimension': '#ff7f0e',
      'hypothesis': '#2ca02c',
      'evidence': '#d62728',
      'bridge': '#9467bd',
      'gap': '#8c564b',
      'synthesis': '#e377c2',
      'reflection': '#7f7f7f',
      'knowledge': '#bcbd22'
    },
    borderWidth: 2,
    borderColor: '#ffffff',
    fontSize: 12,
    fontColor: '#333333'
  },
  edges: {
    width: { min: 1, max: 6 },
    colors: {
      'supportive': '#2ca02c',
      'contradictory': '#d62728',
      'correlative': '#ff7f0e',
      'causal': '#1f77b4',
      'temporal': '#9467bd',
      'prerequisite': '#8c564b'
    },
    arrowSize: 8,
    curvature: 0.2,
    opacity: 0.8
  },
  layout: {
    algorithm: 'force',
    options: {
      iterations: 100,
      nodeRepulsion: 100,
      nodeDistance: 150,
      edgeLength: 100,
      gravity: 0.1,
      stabilization: true,
      animate: true
    }
  }
};