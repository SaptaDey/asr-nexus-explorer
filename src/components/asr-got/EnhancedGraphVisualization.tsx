/**
 * Enhanced Interactive Graph Visualization for ASR-GoT
 * Force-directed graph with scientific theming
 */

import React, { useCallback, useMemo, useEffect } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GraphData, GraphNode, GraphEdge } from '@/types/asrGotTypes';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface EnhancedGraphVisualizationProps {
  graphData: GraphData;
  className?: string;
  currentStage?: number;
  isProcessing?: boolean;
}

// Custom Node Components
const ScientificNode = ({ data, selected }: any) => {
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

  return (
    <Card 
      className={`min-w-[200px] transition-all duration-200 hover:shadow-lg ${
        selected ? 'ring-2 ring-primary shadow-lg' : ''
      }`}
      style={{ 
        borderColor: getNodeColor(data.type),
        borderWidth: 2,
        backgroundColor: `${getNodeColor(data.type)}10`
      }}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{getNodeIcon(data.type)}</span>
          <Badge variant="secondary" className="text-xs">
            {data.type}
          </Badge>
        </div>
        
        <h4 className="font-semibold text-sm mb-2 line-clamp-2">
          {data.label}
        </h4>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Confidence</span>
            <span className="font-medium">{Math.round(avgConfidence * 100)}%</span>
          </div>
          <Progress value={avgConfidence * 100} className="h-1" />
          
          {data.metadata?.timestamp && (
            <div className="text-xs text-muted-foreground">
              {new Date(data.metadata.timestamp).toLocaleDateString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const ScientificEdge = ({ data, selected }: any) => {
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
        }}
      />
    </g>
  );
};

const nodeTypes = {
  scientific: ScientificNode,
};

const edgeTypes = {
  scientific: ScientificEdge,
};

export const EnhancedGraphVisualization: React.FC<EnhancedGraphVisualizationProps> = ({
  graphData,
  className = "",
  currentStage = 0,
  isProcessing = false
}) => {
  // Convert ASR-GoT graph data to ReactFlow format
  const initialNodes: Node[] = useMemo(() => 
    graphData.nodes.map((node: GraphNode) => ({
      id: node.id,
      type: 'scientific',
      position: node.position || { x: Math.random() * 500, y: Math.random() * 300 },
      data: {
        label: node.label,
        type: node.type,
        confidence: node.confidence,
        metadata: node.metadata,
      },
      draggable: true,
      selectable: true,
    })), [graphData.nodes]
  );

  const initialEdges: Edge[] = useMemo(() => 
    graphData.edges.map((edge: GraphEdge, index: number) => ({
      id: edge.id || `edge-${index}`,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      sourceHandle: null,
      targetHandle: null,
      data: {
        type: edge.type,
        confidence: edge.confidence,
        metadata: edge.metadata,
      },
      animated: edge.metadata?.type === 'hypothesis_derivation',
      style: { 
        strokeWidth: Math.max(1, (edge.confidence || 0.5) * 4),
        opacity: 0.8,
        stroke: edge.type === 'supportive' ? 'hsl(var(--chart-2))' : 
               edge.type === 'contradictory' ? 'hsl(var(--destructive))' : 
               'hsl(var(--muted-foreground))'
      },
      markerEnd: {
        type: 'arrowclosed' as any,
        width: 20,
        height: 20,
      },
    })), [graphData.edges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when graph data changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Auto-layout with force-directed positioning
  const applyForceLayout = useCallback(() => {
    // Simple force-directed layout algorithm
    const layoutedNodes = nodes.map((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      const radius = Math.min(200 + nodes.length * 20, 400);
      
      return {
        ...node,
        position: {
          x: 400 + radius * Math.cos(angle),
          y: 300 + radius * Math.sin(angle),
        },
      };
    });
    
    setNodes(layoutedNodes);
  }, [nodes, setNodes]);

  // Apply auto-layout when nodes are added
  useEffect(() => {
    if (nodes.length > 0 && nodes.every(node => node.position.x === 0 && node.position.y === 0)) {
      applyForceLayout();
    }
  }, [nodes.length, applyForceLayout]);

  const nodeColor = (node: Node) => {
    switch (node.data.type) {
      case 'root': return '#8B5CF6'; // purple
      case 'dimension': return '#3B82F6'; // blue
      case 'hypothesis': return '#10B981'; // green
      case 'evidence': return '#F59E0B'; // amber
      default: return '#6B7280'; // gray
    }
  };

  return (
    <div className={`h-[600px] w-full border border-border rounded-lg overflow-hidden bg-background ${className}`}>
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
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        className="scientific-graph"
      >
        <Controls 
          className="!bg-card !border-border"
          showZoom={true}
          showFitView={true}
          showInteractive={true}
        />
        
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
      
      {/* Graph Statistics */}
      <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 text-sm">
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Nodes:</span>
            <span className="font-medium">{nodes.length}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Edges:</span>
            <span className="font-medium">{edges.length}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Stage:</span>
            <span className="font-medium">{graphData.metadata.stage || 0}/8</span>
          </div>
        </div>
      </div>
    </div>
  );
};