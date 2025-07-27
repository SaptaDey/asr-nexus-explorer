/**
 * Enhanced Interactive Graph Visualization for ASR-GoT
 * Force-directed graph with scientific theming
 */

import React, { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GraphData, GraphNode, GraphEdge } from '@/types/asrGotTypes';
import { GraphAdapterFactory } from '@/adapters/GraphVisualizationAdapters';
import { GraphVisualizationError } from '@/types/graphVisualizationTypes';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { AlertCircle, ZoomIn, ZoomOut, Maximize2, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { 
  calculateGraphMetrics, 
  performViewportCulling, 
  applyLevelOfDetail,
  SpatialIndex,
  GraphPerformanceMonitor
} from '@/utils/graphVirtualization';
// import { GraphVisualizationErrorBoundary } from './GraphVisualizationErrorBoundary';

interface EnhancedGraphVisualizationProps {
  graphData: GraphData;
  className?: string;
  currentStage?: number;
  isProcessing?: boolean;
  enableVirtualization?: boolean;
  maxNodes?: number;
  onError?: (error: Error) => void;
}

// Custom Node Components
const ScientificNode = ({ data, selected }: any) => {
  const [imageError, setImageError] = useState(false);
  
  const handleError = useCallback((error: Error) => {
    console.error('❌ Node rendering error:', error);
    setImageError(true);
  }, []);
  const getNodeColor = (type: string) => {
    switch (type) {
      case 'root': return 'hsl(var(--primary))';
      case 'dimension': return 'hsl(var(--secondary))';
      case 'hypothesis': return 'hsl(var(--accent))';
      case 'evidence': return 'hsl(var(--chart-1))';
      default: return 'hsl(var(--muted))';
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'root': return '🎯';
      case 'dimension': return '📊';
      case 'hypothesis': return '🔬';
      case 'evidence': return '📚';
      default: return '💡';
    }
  };

  const confidence = data.confidence || [0, 0, 0, 0];
  const avgConfidence = confidence.reduce((a: number, b: number) => a + b, 0) / confidence.length;

  try {
    return (
      <Card 
        className={`min-w-[180px] max-w-[250px] transition-all duration-200 hover:shadow-lg ${
          selected ? 'ring-2 ring-primary shadow-lg' : ''
        } ${imageError ? 'border-destructive' : ''}`}
        style={{ 
          borderColor: imageError ? 'hsl(var(--destructive))' : getNodeColor(data.type),
          borderWidth: 2,
          backgroundColor: imageError ? 'hsl(var(--destructive) / 0.1)' : `${getNodeColor(data.type)}10`
        }}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{imageError ? '⚠️' : getNodeIcon(data.type)}</span>
            <Badge variant="secondary" className="text-xs">
              {data.type || 'unknown'}
            </Badge>
            {data.metadata?.isCluster && (
              <Badge variant="outline" className="text-xs">
                {data.metadata.clusterSize}x
              </Badge>
            )}
          </div>
          
          <h4 className="font-semibold text-sm mb-2 line-clamp-2" title={data.label}>
            {data.label || 'Untitled Node'}
          </h4>
          
          <div className="space-y-2">
            {typeof avgConfidence === 'number' && !isNaN(avgConfidence) && (
              <>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="font-medium">{Math.round(avgConfidence * 100)}%</span>
                </div>
                <Progress value={Math.min(100, Math.max(0, avgConfidence * 100))} className="h-1" />
              </>
            )}
            
            {data.metadata?.timestamp && (
              <div className="text-xs text-muted-foreground">
                {new Date(data.metadata.timestamp).toLocaleDateString()}
              </div>
            )}
            
            {imageError && (
              <div className="text-xs text-destructive">
                Rendering issue detected
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  } catch (error) {
    console.error('❌ ScientificNode render error:', error);
    handleError(error as Error);
    
    return (
      <div className="w-[180px] h-[100px] border border-destructive rounded bg-destructive/10 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-1" />
          <span className="text-xs text-destructive">Render Error</span>
        </div>
      </div>
    );
  }
};

const ScientificEdge = ({ data, selected }: any) => {
  try {
  const getEdgeColor = (type: string) => {
    switch (type) {
      case 'supportive': return 'hsl(var(--chart-2))';
      case 'conflicting': return 'hsl(var(--destructive))';
      case 'neutral': return 'hsl(var(--muted-foreground))';
      default: return 'hsl(var(--border))';
    }
  };

    return (
      <g>
        <path
          style={{
            stroke: getEdgeColor(data?.type || 'default'),
            strokeWidth: selected ? 3 : 2,
            strokeDasharray: data?.metadata?.type === 'hypothesis_derivation' ? '5,5' : 'none',
            strokeOpacity: data?.confidence ? Math.max(0.3, data.confidence) : 0.7,
          }}
        />
      </g>
    );
  } catch (error) {
    console.error('❌ ScientificEdge render error:', error);
    return (
      <g>
        <path
          style={{
            stroke: 'hsl(var(--destructive))',
            strokeWidth: 1,
            strokeDasharray: '2,2',
            strokeOpacity: 0.5,
          }}
        />
      </g>
    );
  }
};

const nodeTypes = {
  scientific: ScientificNode,
};

const edgeTypes = {
  scientific: ScientificEdge,
};

// Inner component that uses ReactFlow hooks
const GraphVisualizationInner: React.FC<EnhancedGraphVisualizationProps> = ({
  graphData,
  className = "",
  currentStage = 0,
  isProcessing = false,
  enableVirtualization = true,
  maxNodes = 500,
  onError
}) => {
  const reactFlowInstance = useReactFlow();
  const [isVirtualizationEnabled, setIsVirtualizationEnabled] = useState(enableVirtualization);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>({});
  const [graphError, setGraphError] = useState<string | null>(null);
  const performanceMonitor = useRef(new GraphPerformanceMonitor());
  const spatialIndex = useRef<SpatialIndex | null>(null);
  const lastViewport = useRef({ x: 0, y: 0, zoom: 1 });

  // Defensive: always use safe data to prevent re-render loops - MEMOIZED
  const safeGraphData = useMemo(() => {
    const safeNodes = Array.isArray(graphData?.nodes)
      ? graphData.nodes.filter(n => n && typeof n.id === 'string')
      : [];
    const safeEdges = Array.isArray(graphData?.edges)
      ? graphData.edges.filter(e => e && typeof e.source === 'string' && typeof e.target === 'string')
      : [];
    
    return {
      ...graphData,
      nodes: safeNodes,
      edges: safeEdges,
    };
  }, [graphData]);

  const safeNodes = safeGraphData.nodes;
  const safeEdges = safeGraphData.edges;
  
  // Calculate graph metrics using safe data
  const graphMetrics = useMemo(() => {
    try {
      return calculateGraphMetrics(safeNodes, safeEdges);
    } catch (error) {
      console.error('❌ Failed to calculate graph metrics:', error);
      return { nodeCount: 0, edgeCount: 0, complexity: 0, recommendedVirtualization: false };
    }
  }, [safeNodes, safeEdges]);
  // Convert ASR-GoT graph data with virtualization using safe data
  const { initialNodes, initialEdges, virtualizedData } = useMemo(() => {
    const startTime = performance.now();
    
    try {
      // Defensive validation - ensure safe data is actually safe
      if (!Array.isArray(safeGraphData.nodes) || !Array.isArray(safeGraphData.edges)) {
        throw new Error('Invalid graph data: nodes or edges are not arrays');
      }
      
      // Additional validation for array contents
      if (!safeGraphData.nodes.every(n => n && typeof n.id === 'string')) {
        throw new Error('Invalid graph data: some nodes lack valid id');
      }
      
      if (!safeGraphData.edges.every(e => e && typeof e.source === 'string' && typeof e.target === 'string')) {
        throw new Error('Invalid graph data: some edges lack valid source/target');
      }
      
      // Convert data using adapter with validated safe data
      const convertedData = GraphAdapterFactory.convertForVisualization(safeGraphData, 'reactflow');
      let nodes: Node[] = convertedData.nodes.map(node => ({
        id: node.id || String(Math.random()),
        position: node.position || { x: 0, y: 0 },
        data: node.data || {},
        type: node.type || 'default',
        ...node
      }));
      let edges: Edge[] = convertedData.edges.map(edge => ({
        id: edge.id || String(Math.random()),
        source: edge.source || '',
        target: edge.target || '',
        ...edge
      }));
      
      // Apply virtualization if enabled and needed
      let virtualizedInfo = null;
      if (isVirtualizationEnabled && graphMetrics.recommendedVirtualization) {
        try {
          // Use last known viewport instead of accessing reactFlowInstance directly
          const viewport = lastViewport.current || { x: 0, y: 0, zoom: 1 };
          
          // Perform viewport culling with safe data
          virtualizedInfo = performViewportCulling(
            safeNodes,
            safeEdges,
            { ...viewport, width: 1200, height: 800 }
          );
          
          // Apply level of detail
          const lodData = applyLevelOfDetail(
            virtualizedInfo.visibleNodes,
            virtualizedInfo.visibleEdges,
            viewport.zoom
          );
          
          // Convert virtualized data
          const virtualizedConverted = GraphAdapterFactory.convertForVisualization(
            { nodes: lodData.nodes, edges: lodData.edges, metadata: safeGraphData.metadata },
            'reactflow'
          );
          
          nodes = virtualizedConverted.nodes as Node[];
          edges = virtualizedConverted.edges as Edge[];
          
          console.log(`🎯 Virtualization: ${virtualizedInfo.visibleNodes.length}/${safeNodes.length} nodes, ${virtualizedInfo.visibleEdges.length}/${safeEdges.length} edges`);
        } catch (virtError) {
          console.warn('⚠️ Virtualization failed, using all nodes:', virtError);
          virtualizedInfo = null;
        }
      }
      
      // Create spatial index for performance with safe data
      if (safeNodes.length > 100) {
        spatialIndex.current = new SpatialIndex(safeNodes);
      }
      
      const processingTime = performance.now() - startTime;
      performanceMonitor.current.recordFrame(processingTime);
      
      return {
        initialNodes: nodes,
        initialEdges: edges,
        virtualizedData: virtualizedInfo
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to convert graph data for ReactFlow:', error);
      setGraphError(`Graph conversion failed: ${errorMessage}`);
      
      if (error instanceof GraphVisualizationError) {
        console.error('Graph visualization error:', error.code, error.message);
        onError?.(error);
      } else {
        onError?.(new Error(errorMessage));
      }
      
      toast.error('Failed to render graph visualization');
      
      // Return empty arrays as fallback
      return {
        initialNodes: [] as Node[],
        initialEdges: [] as Edge[],
        virtualizedData: null
      };
    }
  }, [safeGraphData, isVirtualizationEnabled, graphMetrics, onError]); // Using safeGraphData for stable dependency

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Clear graph error when graph data changes
  useEffect(() => {
    setGraphError(null);
  }, [graphData]);

  // Update nodes and edges when graph data changes with validation
  useEffect(() => {
    if (!Array.isArray(initialNodes) || !Array.isArray(initialEdges)) return;
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params || typeof params !== 'object') return;
      setEdges((eds) => {
        if (!Array.isArray(eds)) return [];
        return addEdge(params, eds);
      });
    },
    [setEdges]
  );

  // Enhanced auto-layout with error handling
  const applyForceLayout = useCallback(() => {
    if (!Array.isArray(nodes) || nodes.length === 0) return;
    
    try {
      const centerX = 600;
      const centerY = 400;
      
      // Group nodes by type for better layout - with validation
      const nodesByType = nodes.reduce((acc, node) => {
        if (!node || typeof node !== 'object') return acc; // Skip invalid nodes
        const type = node.data?.type || 'default';
        if (!acc[type]) acc[type] = [];
        acc[type].push(node);
        return acc;
      }, {} as Record<string, Node[]>);
      
      const layoutedNodes = [];
      let globalIndex = 0;
      
      // Layout each type in concentric circles
      Object.entries(nodesByType).forEach(([type, typeNodes], typeIndex) => {
        if (!Array.isArray(typeNodes) || typeNodes.length === 0) return; // Skip invalid type groups
        
        const typeRadius = 150 + typeIndex * 100;
        const angleStep = (2 * Math.PI) / Math.max(typeNodes.length, 1);
        
        typeNodes.forEach((node, nodeIndex) => {
          if (!node || typeof node !== 'object') return; // Skip invalid nodes
          
          const angle = nodeIndex * angleStep;
          const x = centerX + typeRadius * Math.cos(angle);
          const y = centerY + typeRadius * Math.sin(angle);
          
          // Add some randomization to avoid overlaps
          const jitterX = (Math.random() - 0.5) * 50;
          const jitterY = (Math.random() - 0.5) * 50;
          
          layoutedNodes.push({
            ...node,
            position: {
              x: x + jitterX,
              y: y + jitterY,
            },
          });
          globalIndex++;
        });
      });
      
      // Only update nodes if we have valid layouted nodes
      if (Array.isArray(layoutedNodes) && layoutedNodes.length > 0) {
        setNodes(layoutedNodes);
      }
      console.log(`🎯 Applied force layout to ${layoutedNodes.length} nodes`);
    } catch (error) {
      console.error('❌ Force layout failed:', error);
      toast.error('Failed to apply graph layout');
    }
  }, [nodes, setNodes]);

  // Auto-layout with error handling
  useEffect(() => {
    if (!Array.isArray(nodes) || nodes.length === 0) return;
    
    try {
      // Only apply layout if nodes don't have positions
      const needsLayout = nodes.some(node => 
        !node.position || (node.position.x === 0 && node.position.y === 0)
      );
      
      if (needsLayout) {
        // Use setTimeout to avoid blocking the UI
        const timeoutId = setTimeout(() => {
          try {
            applyForceLayout();
          } catch (layoutError) {
            console.error('❌ Auto-layout failed:', layoutError);
            setGraphError('Layout calculation failed');
          }
        }, 100);
        
        return () => clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error('❌ Layout setup failed:', error);
    }
  }, [nodes, applyForceLayout]);
  
  // Update performance metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const metrics = performanceMonitor.current.getMetrics();
      setPerformanceMetrics(metrics);
      
      // Auto-enable virtualization if performance is poor
      if (!isVirtualizationEnabled && performanceMonitor.current.shouldOptimize()) {
        console.log('🚀 Auto-enabling virtualization due to poor performance');
        setIsVirtualizationEnabled(true);
        toast.info('Virtualization enabled to improve performance');
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isVirtualizationEnabled]);

  const nodeColor = useCallback((node: Node) => {
    try {
      // Defensive validation for node object
      if (!node || typeof node !== 'object' || !node.data) {
        return '#6B7280'; // fallback gray
      }
      
      switch (node.data?.type) {
        case 'root': return '#8B5CF6'; // purple
        case 'dimension': return '#3B82F6'; // blue
        case 'hypothesis': return '#10B981'; // green
        case 'evidence': return '#F59E0B'; // amber
        case 'cluster': return '#EC4899'; // pink
        default: return '#6B7280'; // gray
      }
    } catch (error) {
      console.error('❌ nodeColor function error:', error);
      return '#6B7280'; // fallback gray
    }
  }, []);

  // Error boundary fallback
  if (graphError) {
    return (
      <div className={`h-[600px] w-full border border-destructive rounded-lg overflow-hidden bg-background ${className}`}>
        <div className="h-full flex items-center justify-center">
          <div className="text-center p-6">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Graph Visualization Error</h3>
            <p className="text-muted-foreground mb-4">{graphError}</p>
            <Button onClick={() => setGraphError(null)} variant="outline">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-[600px] w-full border border-border rounded-lg overflow-hidden bg-background relative ${className}`} data-testid="graph-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        minZoom={0.05}
        maxZoom={3}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        className="scientific-graph graph-visualization"
        data-testid="react-flow-graph"
        onError={(error) => {
          console.error('❌ ReactFlow error:', error);
          setGraphError(error.message || 'ReactFlow rendering error');
        }}
        onViewportChange={(viewport) => {
          // Update viewport for virtualization without causing re-renders
          lastViewport.current = viewport;
        }}
      >
        <Controls 
          className="!bg-card !border-border"
          showZoom={true}
          showFitView={true}
          showInteractive={true}
        >
          <Button
            onClick={() => setIsVirtualizationEnabled(!isVirtualizationEnabled)}
            variant={isVirtualizationEnabled ? "default" : "outline"}
            size="sm"
            className="w-8 h-8 p-0"
            title={`${isVirtualizationEnabled ? 'Disable' : 'Enable'} Virtualization`}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </Controls>
        
        <Background 
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          className="!fill-muted-foreground/20"
        />
        
        <MiniMap
          nodeColor={nodeColor}
          className="!bg-card !border-border"
          maskColor="hsl(var(--background) / 0.8)"
        />
      </ReactFlow>
      
      {/* Enhanced Graph Statistics */}
      <div className="absolute top-4 right-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 text-sm min-w-[200px]">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Nodes:</span>
            <div className="flex items-center gap-1">
              <span className="font-medium">{Array.isArray(nodes) ? nodes.length : 0}</span>
              {virtualizedData && Array.isArray(safeNodes) && (
                <Badge variant="secondary" className="text-xs px-1">
                  /{safeNodes.length}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Edges:</span>
            <div className="flex items-center gap-1">
              <span className="font-medium">{Array.isArray(edges) ? edges.length : 0}</span>
              {virtualizedData && Array.isArray(safeEdges) && (
                <Badge variant="secondary" className="text-xs px-1">
                  /{safeEdges.length}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Stage:</span>
            <span className="font-medium">{safeGraphData?.metadata?.stage || 0}/8</span>
          </div>
          
          {isVirtualizationEnabled && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-center gap-1 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">Virtualized</span>
              </div>
              {performanceMetrics.averageFPS && (
                <div className="text-xs">
                  <span className="text-muted-foreground">FPS: </span>
                  <span className={`font-medium ${
                    performanceMetrics.averageFPS >= 30 ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {performanceMetrics.averageFPS}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {graphMetrics.complexity > 5000 && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-orange-500" />
                <span className="text-xs text-orange-600">High Complexity</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Loading overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Processing graph...</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Main component with ReactFlow provider (Error Boundary temporarily disabled)
export const EnhancedGraphVisualization: React.FC<EnhancedGraphVisualizationProps> = (props) => {
  return (
    <ReactFlowProvider>
      <GraphVisualizationInner {...props} />
    </ReactFlowProvider>
  );
};