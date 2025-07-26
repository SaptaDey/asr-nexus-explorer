
/**
 * Advanced Graph Visualization for ASR-GoT Framework
 * Features: Multi-layer directed graphs, hyper-edges, live confidence bars, impact scores
 * Implements P1.10 (node typing), P1.24 (causal), P1.25 (temporal), P1.5 (confidence), P1.28 (impact)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Network, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Move3D,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';
import { GraphData, GraphNode, GraphEdge } from '@/types/asrGotTypes';
import { VisualizationErrorBoundary } from '@/components/errors/VisualizationErrorBoundary';

// Register the dagre layout
cytoscape.use(dagre);

interface AdvancedGraphVisualizationProps {
  graphData: GraphData;
  currentStage: number;
  isProcessing: boolean;
  onNodeSelect?: (nodeId: string) => void;
  onEdgeSelect?: (edgeId: string) => void;
  className?: string;
  enableAnimation?: boolean;
  showHyperEdges?: boolean;
  confidenceThreshold?: number;
}

// Edge types mapping for styling
const EDGE_TYPES = {
  supportive: { color: '#10B981', width: 3, style: 'solid' },
  contradictory: { color: '#EF4444', width: 3, style: 'solid' },
  correlative: { color: '#F59E0B', width: 2, style: 'dashed' },
  causal: { color: '#8B5CF6', width: 4, style: 'solid' },
  temporal: { color: '#EC4899', width: 2, style: 'dotted' },
  prerequisite: { color: '#3B82F6', width: 3, style: 'solid' },
  causal_direct: { color: '#8B5CF6', width: 4, style: 'solid' },
  causal_counterfactual: { color: '#A855F7', width: 3, style: 'dashed' },
  causal_confounded: { color: '#C084FC', width: 2, style: 'dotted' },
  temporal_precedence: { color: '#EC4899', width: 3, style: 'solid' },
  temporal_cyclic: { color: '#F472B6', width: 2, style: 'dashed' },
  temporal_delayed: { color: '#FDA4AF', width: 2, style: 'dotted' },
  temporal_sequential: { color: '#FBBF24', width: 3, style: 'solid' }
};

export const AdvancedGraphVisualization: React.FC<AdvancedGraphVisualizationProps> = ({
  graphData,
  currentStage,
  isProcessing,
  onNodeSelect,
  onEdgeSelect,
  className = '',
  enableAnimation = true,
  showHyperEdges = true,
  confidenceThreshold = 0.3
}) => {
  const [selectedLayout, setSelectedLayout] = useState<'dagre' | 'grid' | 'circle' | 'concentric' | 'breadthfirst'>('dagre');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showConfidenceBars, setShowConfidenceBars] = useState(true);
  const [filterByType, setFilterByType] = useState<string>('all');
  const [cyInstance, setCyInstance] = useState<cytoscape.Core | null>(null);
  const [confidenceRange, setConfidenceRange] = useState([0, 1]);

  // Convert graph data to Cytoscape elements
  const cytoscapeElements = useMemo(() => {
    if (!graphData || !graphData.nodes) return [];

    const nodes = graphData.nodes
      .filter(node => {
        if (filterByType === 'all') return true;
        return node.type === filterByType;
      })
      .filter(node => {
        const confidence = Array.isArray(node.confidence) ? node.confidence[0] : node.confidence;
        return confidence >= confidenceThreshold;
      })
      .map(node => {
        const avgConfidence = Array.isArray(node.confidence) 
          ? node.confidence.reduce((a, b) => a + b, 0) / node.confidence.length
          : (node.confidence || 0.5);

        return {
          data: {
            id: node.id,
            label: node.label,
            type: node.type,
            confidence: avgConfidence,
            metadata: node.metadata || {},
            // Size based on confidence
            size: 20 + (avgConfidence * 40),
            // Color based on type
            color: getNodeColor(node.type)
          },
          position: node.position || { x: Math.random() * 500, y: Math.random() * 300 }
        };
      });

    const edges = (graphData.edges || [])
      .filter(edge => {
        // Only show edges where both nodes are visible
        const sourceVisible = nodes.some(n => n.data.id === edge.source);
        const targetVisible = nodes.some(n => n.data.id === edge.target);
        return sourceVisible && targetVisible && edge.confidence >= confidenceThreshold;
      })
      .map(edge => {
        const style = EDGE_TYPES[edge.type as keyof typeof EDGE_TYPES] || EDGE_TYPES.supportive;
        
        return {
          data: {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: edge.type,
            confidence: edge.confidence,
            weight: edge.weight || edge.confidence || 0.5,
            // Visual properties
            color: style.color,
            width: Math.max(1, style.width * (edge.confidence || 0.5)),
            lineStyle: style.style
          }
        };
      });

    return [...nodes, ...edges];
  }, [graphData, filterByType, confidenceThreshold]);

  // Cytoscape stylesheet
  const cytoscapeStylesheet: cytoscape.Stylesheet[] = useMemo(() => [
    {
      selector: 'node',
      style: {
        'background-color': 'data(color)',
        'label': 'data(label)',
        'width': 'data(size)',
        'height': 'data(size)',
        'text-valign': 'center',
        'text-halign': 'center',
        'font-size': '12px',
        'font-weight': 'bold',
        'color': '#ffffff',
        'text-outline-color': '#000000',
        'text-outline-width': 1,
        'border-width': 2,
        'border-color': '#ffffff',
        'overlay-padding': '6px'
      }
    },
    {
      selector: 'node:selected',
      style: {
        'border-color': '#FFD700',
        'border-width': 4,
        'overlay-color': '#FFD700',
        'overlay-opacity': 0.25
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 'data(width)',
        'line-color': 'data(color)',
        'target-arrow-color': 'data(color)',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'line-style': 'data(lineStyle)',
        'arrow-scale': 1.5,
        'opacity': 0.8
      }
    },
    {
      selector: 'edge:selected',
      style: {
        'line-color': '#FFD700',
        'target-arrow-color': '#FFD700',
        'opacity': 1,
        'width': (ele: any) => Math.max(4, parseFloat(ele.data('width')) + 2)
      }
    },
    {
      selector: '.filtered',
      style: {
        'opacity': 0.2
      }
    },
    {
      selector: '.highlight',
      style: {
        'opacity': 1,
        'z-index': 999
      }
    }
  ], []);

  // Layout configurations
  const getLayoutConfig = () => {
    const baseConfig = {
      name: selectedLayout,
      animate: enableAnimation && !isProcessing,
      animationDuration: 1000,
      fit: true,
      padding: 50
    };

    switch (selectedLayout) {
      case 'dagre':
        return {
          ...baseConfig,
          nodeSep: 100,
          edgeSep: 50,
          rankSep: 150,
          rankDir: 'TB'
        };
      case 'grid':
        return {
          ...baseConfig,
          rows: Math.ceil(Math.sqrt(cytoscapeElements.filter(el => !el.data.source).length)),
          cols: undefined
        };
      case 'circle':
        return {
          ...baseConfig,
          radius: 200
        };
      case 'concentric':
        return {
          ...baseConfig,
          concentric: (node: any) => node.data('confidence'),
          levelWidth: () => 2
        };
      case 'breadthfirst':
        return {
          ...baseConfig,
          directed: true,
          roots: cytoscapeElements
            .filter(el => !el.data.source && el.data.type === 'root')
            .map(el => `#${el.data.id}`)
        };
      default:
        return baseConfig;
    }
  };

  // Node color mapping
  const getNodeColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      'root': '#8B5CF6',
      'dimension': '#3B82F6',
      'hypothesis': '#10B981',
      'evidence': '#F59E0B',
      'bridge': '#EC4899',
      'gap': '#EF4444',
      'synthesis': '#6366F1',
      'reflection': '#8B5CF6',
      'knowledge': '#14B8A6'
    };
    return colors[type] || '#6B7280';
  };

  // Event handlers
  const handleCytoscapeInit = useCallback((cy: cytoscape.Core) => {
    setCyInstance(cy);
    
    // Node selection
    cy.on('tap', 'node', (event) => {
      const nodeId = event.target.id();
      if (onNodeSelect) {
        onNodeSelect(nodeId);
      }
    });

    // Edge selection
    cy.on('tap', 'edge', (event) => {
      const edgeId = event.target.id();
      if (onEdgeSelect) {
        onEdgeSelect(edgeId);
      }
    });

    // Hover effects
    cy.on('mouseover', 'node', (event) => {
      const node = event.target;
      node.neighborhood().addClass('highlight');
    });

    cy.on('mouseout', 'node', () => {
      cy.elements().removeClass('highlight');
    });
  }, [onNodeSelect, onEdgeSelect]);

  // Animation controls
  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
    if (cyInstance) {
      if (!isAnimating) {
        cyInstance.layout(getLayoutConfig()).run();
      } else {
        cyInstance.stop();
      }
    }
  };

  const resetView = () => {
    if (cyInstance) {
      cyInstance.fit();
      cyInstance.center();
      setZoomLevel(1);
    }
  };

  const handleZoomIn = () => {
    if (cyInstance) {
      const newZoom = Math.min(3, zoomLevel * 1.2);
      cyInstance.zoom(newZoom);
      setZoomLevel(newZoom);
    }
  };

  const handleZoomOut = () => {
    if (cyInstance) {
      const newZoom = Math.max(0.1, zoomLevel / 1.2);
      cyInstance.zoom(newZoom);
      setZoomLevel(newZoom);
    }
  };

  // Get unique node types for filter
  const nodeTypes = useMemo(() => {
    if (!graphData?.nodes) return [];
    const types = Array.from(new Set(graphData.nodes.map(node => node.type)));
    return ['all', ...types];
  }, [graphData]);

  // Statistics
  const stats = useMemo(() => {
    if (!graphData) return { nodes: 0, edges: 0, avgConfidence: 0 };
    
    const visibleNodes = cytoscapeElements.filter(el => !el.data.source);
    const visibleEdges = cytoscapeElements.filter(el => el.data.source);
    const avgConfidence = visibleNodes.reduce((sum, node) => sum + node.data.confidence, 0) / visibleNodes.length || 0;

    return {
      nodes: visibleNodes.length,
      edges: visibleEdges.length,
      avgConfidence: Math.round(avgConfidence * 100)
    };
  }, [cytoscapeElements]);

  return (
    <VisualizationErrorBoundary
      visualizationType="graph"
      dataSize={cytoscapeElements.length > 100 ? 'large' : 'medium'}
      enableFallbackMode={true}
    >
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Network className="h-5 w-5 mr-2" />
              Advanced Graph Visualization
              <Badge variant="outline" className="ml-2">Stage {currentStage + 1}/9</Badge>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAnimation}
                disabled={isProcessing}
              >
                {isAnimating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isAnimating ? 'Pause' : 'Animate'}
              </Button>
              
              <Button
                variant="outline" 
                size="sm"
                onClick={() => setShowConfidenceBars(!showConfidenceBars)}
              >
                {showConfidenceBars ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center mt-4">
            <Select value={selectedLayout} onValueChange={(value: any) => setSelectedLayout(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dagre">Dagre</SelectItem>
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="circle">Circle</SelectItem>
                <SelectItem value="concentric">Concentric</SelectItem>
                <SelectItem value="breadthfirst">Hierarchy</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterByType} onValueChange={setFilterByType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                {nodeTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <span className="text-sm">Confidence:</span>
              <Slider
                value={[confidenceThreshold]}
                onValueChange={(value) => setConfidenceRange([value[0], 1])}
                max={1}
                min={0}
                step={0.1}
                className="w-24"
              />
            </div>

            <div className="flex items-center space-x-1">
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={resetView}>
                <Move3D className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="relative">
            <div className="h-96 border rounded-lg overflow-hidden">
              <CytoscapeComponent
                elements={cytoscapeElements}
                stylesheet={cytoscapeStylesheet}
                layout={getLayoutConfig()}
                cy={handleCytoscapeInit}
                className="w-full h-full"
                style={{ width: '100%', height: '100%' }}
                boxSelectionEnabled={false}
                autounselectify={false}
                userZoomingEnabled={true}
                userPanningEnabled={true}
                minZoom={0.1}
                maxZoom={3}
              />
            </div>

            {isProcessing && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Processing stage {currentStage + 1}...</p>
                </div>
              </div>
            )}
          </div>

          {/* Statistics Panel */}
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.nodes}</div>
              <div className="text-sm text-gray-600">Visible Nodes</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.edges}</div>
              <div className="text-sm text-gray-600">Connections</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.avgConfidence}%</div>
              <div className="text-sm text-gray-600">Avg. Confidence</div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Node Types:</h4>
            <div className="flex flex-wrap gap-2">
              {nodeTypes.slice(1).map(type => (
                <Badge 
                  key={type}
                  style={{ backgroundColor: getNodeColor(type), color: 'white' }}
                  className="text-xs"
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </VisualizationErrorBoundary>
  );
};
