/**
 * Enhanced Cytoscape.js Graph Engine with Hyper-edge Support
 * Implements P1.22, P1.23 specifications for ASR-GoT
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import cytoscape, { Core, EdgeSingular, NodeSingular } from '../../utils/cytoscapeSetup';
import { GraphData, GraphNode, GraphEdge } from '@/types/asrGotTypes';
import { GraphAdapterFactory } from '@/adapters/GraphVisualizationAdapters';
import { GraphVisualizationError, GraphDataValidationError } from '@/types/graphVisualizationTypes';
import { Settings, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';
import { toast } from 'sonner';

interface EnhancedCytoscapeGraphProps {
  graphData: GraphData;
  currentStage: number;
  onNodeSelect?: (nodeId: string) => void;
  onGraphUpdate?: (event: string, data: any) => void;
}

export const EnhancedCytoscapeGraph: React.FC<EnhancedCytoscapeGraphProps> = ({
  graphData,
  currentStage,
  onNodeSelect,
  onGraphUpdate
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [layoutRunning, setLayoutRunning] = useState(false);

  // Enhanced node styling with confidence-based colors
  const getNodeStyle = useCallback((node: GraphNode) => {
    const avgConfidence = node.confidence && Array.isArray(node.confidence) && node.confidence.length > 0 
      ? node.confidence.reduce((a, b) => a + b, 0) / node.confidence.length 
      : 0.5;
    const impactScore = node.metadata?.impact_score || 0.5;
    
    let color = '#94A3B8'; // default gray
    if (avgConfidence >= 0.8) color = '#00857C'; // high confidence - teal
    else if (avgConfidence >= 0.5) color = '#FFB200'; // medium - amber
    else if (avgConfidence >= 0.3) color = '#B60000'; // low - red
    
    return {
      'background-color': color,
      'border-color': '#FFFFFF',
      'border-width': selectedNode === node.id ? 4 : 2,
      'width': Math.max(30, impactScore * 60),
      'height': Math.max(30, impactScore * 60),
      'label': node.label,
      'font-size': '12px',
      'text-valign': 'center',
      'text-halign': 'center',
      'color': '#FFFFFF',
      'text-outline-width': 2,
      'text-outline-color': color,
      'overlay-opacity': 0.1,
      'transition-property': 'background-color, border-width, width, height',
      'transition-duration': '0.3s'
    };
  }, [selectedNode]);

  // Enhanced edge styling based on type and confidence
  const getEdgeStyle = useCallback((edge: GraphEdge) => {
    const typeStyles = {
      'supportive': { color: '#10B981', width: 3 },
      'contradictory': { color: '#EF4444', width: 3 },
      'causal': { color: '#8B5CF6', width: 4 },
      'temporal': { color: '#F59E0B', width: 2 },
      'correlative': { color: '#6B7280', width: 2 },
      'prerequisite': { color: '#3B82F6', width: 3 },
      'hyperedge': { color: '#EC4899', width: 5 }
    };

    const style = typeStyles[edge.type] || { color: '#6B7280', width: 2 };
    
    return {
      'line-color': style.color,
      'target-arrow-color': style.color,
      'target-arrow-shape': 'triangle',
      'width': style.width * (edge.confidence || 0.5),
      'opacity': 0.7,
      'curve-style': edge.type === 'hyperedge' ? 'bezier' : 'straight',
      'transition-property': 'line-color, width',
      'transition-duration': '0.3s'
    };
  }, []);

  // Initialize Cytoscape instance
  const initializeCytoscape = useCallback(() => {
    if (!containerRef.current || cyRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      style: [
        {
          selector: 'node',
          style: {
            'shape': 'ellipse',
            'text-wrap': 'wrap',
            'text-max-width': '80px'
          }
        },
        {
          selector: 'edge',
          style: {
            'curve-style': 'straight'
          }
        },
        {
          selector: '.highlighted',
          style: {
            'border-width': 4,
            'border-color': '#662D91',
            'overlay-color': '#662D91',
            'overlay-padding': 10,
            'overlay-opacity': 0.25
          }
        }
      ],
      layout: {
        name: 'cose',
        fit: true,
        padding: 30,
        randomize: false,
        animate: true,
        animationDuration: 1000
      }
    });

    // Event handlers
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const nodeId = node.id();
      setSelectedNode(nodeId);
      onNodeSelect?.(nodeId);
      
      // Highlight connected nodes
      cy.elements().removeClass('highlighted');
      node.addClass('highlighted');
      node.neighborhood().addClass('highlighted');
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null);
        cy.elements().removeClass('highlighted');
      }
    });

    cyRef.current = cy;
  }, [onNodeSelect]);

  // Update graph data
  const updateGraphData = useCallback(() => {
    if (!cyRef.current) return;

    const cy = cyRef.current;
    
    try {
      // Convert graph data using the adapter
      const convertedData = GraphAdapterFactory.convertForVisualization(graphData, 'cytoscape');
      
      // Apply custom styling to nodes and edges
      const styledElements = [
        ...convertedData.nodes.map(nodeElement => ({
          ...nodeElement,
          style: {
            ...nodeElement.style,
            ...getNodeStyle(graphData.nodes.find(n => n.id === nodeElement.data.id)!)
          }
        })),
        ...convertedData.edges.map(edgeElement => ({
          ...edgeElement,
          style: {
            ...edgeElement.style,
            ...getEdgeStyle(graphData.edges.find(e => e.id === edgeElement.data.id)!)
          }
        })),
        ...(convertedData.hyperedges || [])
      ];

      cy.elements().remove();
      cy.add(styledElements);
    } catch (error) {
      console.error('Failed to convert graph data for Cytoscape:', error);
      toast.error('Failed to render graph visualization');
      
      if (error instanceof GraphVisualizationError) {
        console.error('Graph visualization error:', error.code, error.message);
      }
      return;
    }

    // Trigger layout update for Stage 4 topology changes (P1.22)
    if (currentStage === 4) {
      setLayoutRunning(true);
      const layout = cy.layout({
        name: 'cose',
        animate: true,
        animationDuration: 1000,
        fit: true,
        stop: () => {
          setLayoutRunning(false);
          onGraphUpdate?.('graph-layout-complete', { stage: currentStage });
        }
      });
      layout.run();
    }

    // Broadcast graph-updated event
    onGraphUpdate?.('graph-updated', { 
      nodes: graphData.nodes.length, 
      edges: graphData.edges.length,
      stage: currentStage 
    });
  }, [graphData, currentStage, getNodeStyle, getEdgeStyle, onGraphUpdate]);

  // Initialize and update graph
  useEffect(() => {
    initializeCytoscape();
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [initializeCytoscape]);

  useEffect(() => {
    updateGraphData();
  }, [updateGraphData]);

  // Graph controls
  const zoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.2);
  const zoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const resetView = () => cyRef.current?.fit(undefined, 50);
  const exportGraph = () => {
    if (!cyRef.current) return;
    const png = cyRef.current.png({ output: 'blob', bg: '#FFFFFF' });
    const url = URL.createObjectURL(png);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asr-got-graph.png';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Graph exported as PNG');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle>Enhanced Graph Visualization</CardTitle>
              <Badge variant="outline" className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                Stage {currentStage}/8
              </Badge>
              {layoutRunning && (
                <Badge variant="secondary" className="animate-pulse">
                  Layout Running...
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={zoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={zoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={resetView}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={exportGraph}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 h-[calc(100%-80px)]">
          <div
            ref={containerRef}
            className="w-full h-full rounded-b-lg"
            style={{ minHeight: '400px' }}
          />
          
          {/* Graph Statistics */}
          <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-black/90 rounded-lg p-3 shadow-lg">
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="text-center">
                <div className="font-bold text-blue-600">{graphData.nodes.length}</div>
                <div className="text-muted-foreground">Nodes</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-green-600">{graphData.edges.length}</div>
                <div className="text-muted-foreground">Edges</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-purple-600">
                  {graphData.nodes.length > 1 ? 
                    ((graphData.edges.length / (graphData.nodes.length * (graphData.nodes.length - 1) / 2)) * 100).toFixed(1) + '%' : 
                    '0%'}
                </div>
                <div className="text-muted-foreground">Density</div>
              </div>
            </div>
          </div>

          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute top-4 right-4 bg-white dark:bg-black rounded-lg p-4 shadow-xl border max-w-sm"
            >
              <h4 className="font-semibold mb-2">Node Details</h4>
              <div className="space-y-1 text-sm">
                <div><strong>ID:</strong> {selectedNode}</div>
                {/* Add more node details here */}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};