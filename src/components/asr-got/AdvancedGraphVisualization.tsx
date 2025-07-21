/**
 * Advanced Graph Visualization for ASR-GoT Framework
 * Features: Multi-layer directed graphs, hyper-edges, live confidence bars, impact scores
 * Implements P1.10 (node typing), P1.24 (causal), P1.25 (temporal), P1.5 (confidence), P1.28 (impact)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import cytoscapeWithExtensions from '@/utils/cytoscapeSetup';
import CytoscapeComponent from 'react-cytoscapejs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GraphData, GraphNode, GraphEdge, HyperEdge, ASRGoTParameters, ResearchContext } from '@/types/asrGotTypes';
import { Layers, Target, Zap, TrendingUp, Network, Eye, EyeOff } from 'lucide-react';

// Cytoscape extensions are initialized in cytoscapeSetup.ts

interface AdvancedGraphVisualizationProps {
  graphData: GraphData;
  className?: string;
  showParameters?: boolean;
  currentStage?: number;
  isProcessing?: boolean;
  stageResults?: string[];
  researchContext?: ResearchContext;
  parameters?: ASRGoTParameters;
  onNodeSelect?: (node: GraphNode) => void;
  onEdgeSelect?: (edge: GraphEdge) => void;
}

// Advanced node type definitions per P1.10
const NODE_TYPES = {
  root: { color: '#6366f1', icon: '🎯', layer: 0, shape: 'star' },
  dimension: { color: '#8b5cf6', icon: '📊', layer: 1, shape: 'diamond' },
  hypothesis: { color: '#06b6d4', icon: '🔬', layer: 2, shape: 'hexagon' },
  evidence: { color: '#10b981', icon: '📚', layer: 3, shape: 'round-rectangle' },
  bridge: { color: '#f59e0b', icon: '🌉', layer: 2, shape: 'round-tag' },
  gap: { color: '#ef4444', icon: '❓', layer: 3, shape: 'round-pentagon' },
  synthesis: { color: '#8b5a3c', icon: '🔄', layer: 4, shape: 'octagon' },
  reflection: { color: '#ec4899', icon: '🪞', layer: 5, shape: 'vee' },
  temporal: { color: '#14b8a6', icon: '⏰', layer: 2, shape: 'triangle' },
  causal: { color: '#f97316', icon: '➡️', layer: 2, shape: 'barrel' },
  knowledge: { color: '#a855f7', icon: '💎', layer: 0, shape: 'cut-rectangle' }
};

// Edge type definitions per P1.24, P1.25
const EDGE_TYPES = {
  // Basic edges
  supportive: { color: '#10b981', width: 2, style: 'solid' },
  contradictory: { color: '#ef4444', width: 2, style: 'solid' },
  correlative: { color: '#6366f1', width: 1, style: 'dashed' },
  prerequisite: { color: '#8b5cf6', width: 2, style: 'dotted' },
  
  // Causal edges (P1.24)
  causal_direct: { color: '#f97316', width: 3, style: 'solid', arrow: 'triangle' },
  causal_counterfactual: { color: '#ea580c', width: 2, style: 'dashed', arrow: 'triangle' },
  causal_confounded: { color: '#dc2626', width: 2, style: 'dotted', arrow: 'triangle' },
  
  // Temporal edges (P1.25)
  temporal_precedence: { color: '#14b8a6', width: 2, style: 'solid', arrow: 'chevron' },
  temporal_cyclic: { color: '#0891b2', width: 2, style: 'dashed', arrow: 'circle-triangle' },
  temporal_delayed: { color: '#0e7490', width: 1, style: 'dotted', arrow: 'chevron' },
  temporal_sequential: { color: '#155e75', width: 2, style: 'solid', arrow: 'triangle-tee' }
};

export const AdvancedGraphVisualization: React.FC<AdvancedGraphVisualizationProps> = ({
  graphData,
  className = '',
  showParameters = true,
  currentStage = 0,
  isProcessing = false,
  stageResults = [],
  researchContext,
  parameters,
  onNodeSelect,
  onEdgeSelect
}) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [layerVisibility, setLayerVisibility] = useState<Record<number, boolean>>({
    0: true, 1: true, 2: true, 3: true, 4: true, 5: true
  });
  const [showConfidenceBars, setShowConfidenceBars] = useState(true);
  const [showImpactScores, setShowImpactScores] = useState(true);
  const [cytoscapeRef, setCytoscapeRef] = useState<any | null>(null);

  // Convert graph data to Cytoscape format
  const cytoscapeElements = useMemo(() => {
    const nodes = graphData.nodes
      .filter(node => layerVisibility[NODE_TYPES[node.type]?.layer || 0])
      .map(node => {
        const nodeType = NODE_TYPES[node.type] || NODE_TYPES.root;
        const avgConfidence = node.confidence && Array.isArray(node.confidence) && node.confidence.length > 0 
          ? node.confidence.reduce((a, b) => a + b, 0) / node.confidence.length 
          : 0.5;
        const impactScore = node.metadata?.impact_score || 0;
        
        return {
          data: {
            id: node.id,
            label: node.label,
            type: node.type,
            confidence: node.confidence,
            avgConfidence: avgConfidence,
            impactScore: impactScore,
            metadata: node.metadata,
            layer: nodeType.layer
          },
          style: {
            'background-color': nodeType.color,
            'shape': nodeType.shape,
            'width': 40 + (impactScore * 20),
            'height': 40 + (impactScore * 20),
            'opacity': avgConfidence,
            'border-width': 2,
            'border-color': avgConfidence > 0.7 ? '#10b981' : avgConfidence > 0.4 ? '#f59e0b' : '#ef4444',
            'label': node.label,
            'font-size': 10,
            'text-valign': 'center',
            'text-halign': 'center',
            'color': '#ffffff',
            'text-outline-width': 1,
            'text-outline-color': '#000000'
          }
        };
      });

    const edges = graphData.edges.map(edge => {
      const edgeType = EDGE_TYPES[edge.type] || EDGE_TYPES.supportive;
      
      return {
        data: {
          id: `${edge.source}-${edge.target}`,
          source: edge.source,
          target: edge.target,
          type: edge.type,
          confidence: edge.confidence,
          metadata: edge.metadata
        },
        style: {
          'line-color': edgeType.color,
          'width': edgeType.width,
          'line-style': edgeType.style,
          'target-arrow-shape': edgeType.arrow || 'triangle',
          'target-arrow-color': edgeType.color,
          'opacity': edge.confidence,
          'curve-style': 'bezier'
        }
      };
    });

    // Add hyperedges as compound nodes if they exist
    const hyperedges = (graphData.hyperedges || []).map(hyperedge => ({
      data: {
        id: hyperedge.id,
        label: hyperedge.type,
        type: 'hyperedge',
        nodes: hyperedge.nodes,
        confidence: hyperedge.confidence
      },
      style: {
        'background-color': '#ec4899',
        'shape': 'round-rectangle',
        'width': 60,
        'height': 30,
        'border-width': 2,
        'border-color': '#be185d',
        'border-style': 'dashed'
      }
    }));

    return [...nodes, ...edges, ...hyperedges];
  }, [graphData, layerVisibility]);

  // Cytoscape layout configuration
  const cytoscapeLayout = {
    name: 'dagre',
    fit: true,
    directed: true,
    padding: 50,
    spacingFactor: 1.5,
    rankDir: 'TB',
    ranker: 'longest-path'
  };

  // Cytoscape stylesheet
  const cytoscapeStyle = [
    {
      selector: 'node',
      style: {
        'label': 'data(label)',
        'text-wrap': 'wrap',
        'text-max-width': 80,
        'font-family': 'Arial, sans-serif',
        'transition-property': 'background-color, border-color, width, height',
        'transition-duration': '0.3s'
      }
    },
    {
      selector: 'node:selected',
      style: {
        'border-width': 4,
        'border-color': '#ffffff',
        'box-shadow': '0 0 20px rgba(99, 102, 241, 0.8)'
      }
    },
    {
      selector: 'edge',
      style: {
        'curve-style': 'bezier',
        'target-arrow-shape': 'triangle',
        'transition-property': 'line-color, width, opacity',
        'transition-duration': '0.3s'
      }
    },
    {
      selector: 'edge:selected',
      style: {
        'width': 4,
        'line-color': '#ffffff',
        'target-arrow-color': '#ffffff'
      }
    }
  ];

  // Handle node selection
  const handleNodeTap = useCallback((event: any) => {
    const node = event.target.data();
    const graphNode = graphData.nodes.find(n => n.id === node.id);
    if (graphNode) {
      setSelectedNode(graphNode);
      onNodeSelect?.(graphNode);
    }
  }, [graphData.nodes, onNodeSelect]);

  // Handle edge selection
  const handleEdgeTap = useCallback((event: any) => {
    const edge = event.target.data();
    const graphEdge = graphData.edges.find(e => `${e.source}-${e.target}` === edge.id);
    if (graphEdge) {
      setSelectedEdge(graphEdge);
      onEdgeSelect?.(graphEdge);
    }
  }, [graphData.edges, onEdgeSelect]);

  // Setup Cytoscape event handlers
  useEffect(() => {
    if (cytoscapeRef) {
      cytoscapeRef.on('tap', 'node', handleNodeTap);
      cytoscapeRef.on('tap', 'edge', handleEdgeTap);
      
      return () => {
        cytoscapeRef.removeAllListeners();
      };
    }
  }, [cytoscapeRef, handleNodeTap, handleEdgeTap]);

  // Toggle layer visibility
  const toggleLayerVisibility = (layer: number) => {
    setLayerVisibility(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  // Confidence distribution component (P1.5)
  const ConfidenceDistribution = ({ confidence }: { confidence: number[] }) => {
    const labels = ['Empirical', 'Theoretical', 'Methodological', 'Consensus'];
    
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Confidence Distribution (P1.5)</h4>
        {confidence.map((value, index) => (
          <div key={index} className="flex items-center space-x-2">
            <span className="text-xs w-20 truncate">{labels[index]}</span>
            <Progress value={value * 100} className="flex-1 h-2" />
            <span className="text-xs w-12">{(value * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    );
  };

  // Impact score component (P1.28)
  const ImpactScoreDisplay = ({ score }: { score: number }) => (
    <div className="flex items-center space-x-2">
      <TrendingUp className="h-4 w-4 text-orange-500" />
      <span className="text-sm">Impact Score: </span>
      <Badge variant={score > 0.7 ? 'default' : score > 0.4 ? 'secondary' : 'outline'}>
        {(score * 100).toFixed(0)}%
      </Badge>
    </div>
  );

  return (
    <div className={`flex h-full ${className}`}>
      {/* Main Graph Visualization */}
      <div className="flex-1 relative">
        {/* Graph Controls */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-xs">
          <Card className="p-2 bg-white/95 backdrop-blur-sm">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={showConfidenceBars ? 'default' : 'outline'}
                onClick={() => setShowConfidenceBars(!showConfidenceBars)}
                className="text-xs"
              >
                <Target className="h-3 w-3 mr-1" />
                Confidence
              </Button>
              <Button
                size="sm"
                variant={showImpactScores ? 'default' : 'outline'}
                onClick={() => setShowImpactScores(!showImpactScores)}
                className="text-xs"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Impact
              </Button>
            </div>
          </Card>
        </div>

        {/* Layer Controls */}
        <div className="absolute top-4 right-4 z-10 max-w-xs">
          <Card className="p-2 bg-white/95 backdrop-blur-sm">
            <h4 className="text-sm font-medium mb-2">Layers</h4>
            <div className="grid grid-cols-3 gap-1">
              {Object.entries(NODE_TYPES).reduce((acc, [type, config]) => {
                if (!acc.find(item => item.layer === config.layer)) {
                  acc.push({ layer: config.layer, type, config });
                }
                return acc;
              }, [] as any[]).map(({ layer, type, config }) => (
                <Button
                  key={layer}
                  size="sm"
                  variant={layerVisibility[layer] ? 'default' : 'outline'}
                  onClick={() => toggleLayerVisibility(layer)}
                  className="text-xs p-1 min-w-0"
                >
                  {layerVisibility[layer] ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  <span className="ml-1">L{layer}</span>
                </Button>
              ))}
            </div>
          </Card>
        </div>

        {/* Cytoscape Graph */}
        <CytoscapeComponent
          elements={cytoscapeElements}
          layout={cytoscapeLayout}
          style={{ width: '100%', height: '100%' }}
          stylesheet={cytoscapeStyle}
          cy={(cy) => setCytoscapeRef(cy)}
          boxSelectionEnabled={true}
          autoungrabify={false}
          autounselectify={false}
        />

        {/* Legends Container - Positioned to avoid overlap */}
        <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap gap-4 justify-between">
          {/* Node Legend */}
          <Card className="p-3 max-w-sm flex-1 min-w-0">
            <h4 className="text-sm font-medium mb-2">Node Types (P1.10)</h4>
            <div className="grid grid-cols-2 gap-1 text-xs max-h-32 overflow-y-auto">
              {Object.entries(NODE_TYPES).map(([type, config]) => (
                <div key={type} className="flex items-center space-x-1">
                  <div 
                    className="w-3 h-3 rounded flex-shrink-0"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="flex-shrink-0">{config.icon}</span>
                  <span className="truncate text-xs">{type}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Edge Legend */}
          <Card className="p-3 max-w-sm flex-1 min-w-0">
            <h4 className="text-sm font-medium mb-2">Edge Types (P1.24/P1.25)</h4>
            <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
              {Object.entries(EDGE_TYPES).slice(0, 8).map(([type, config]) => (
                <div key={type} className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-0.5 flex-shrink-0"
                    style={{ 
                      backgroundColor: config.color,
                      borderStyle: config.style 
                    }}
                  />
                  <span className="truncate text-xs">{type.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Selection Details Panel */}
      {(selectedNode || selectedEdge) && (
        <div className="w-80 border-l bg-background flex flex-col">
          <Card className="h-full rounded-none border-0 flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-lg flex items-center space-x-2">
                {selectedNode && (
                  <>
                    <span>{NODE_TYPES[selectedNode.type]?.icon}</span>
                    <span className="truncate">{selectedNode.label}</span>
                  </>
                )}
                {selectedEdge && (
                  <>
                    <Network className="h-5 w-5" />
                    <span className="truncate">{selectedEdge.type.replace(/_/g, ' ')}</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 overflow-y-auto flex-1">
              {selectedNode && (
                <>
                  <div>
                    <Badge variant="outline">{selectedNode.type}</Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      ID: {selectedNode.id}
                    </p>
                  </div>

                  {showConfidenceBars && (
                    <ConfidenceDistribution confidence={selectedNode.confidence} />
                  )}

                  {showImpactScores && selectedNode.metadata?.impact_score && (
                    <ImpactScoreDisplay score={selectedNode.metadata.impact_score} />
                  )}

                  {selectedNode.metadata && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Metadata</h4>
                      <div className="text-xs space-y-1">
                        <p><strong>Type:</strong> {selectedNode.metadata.type}</p>
                        <p><strong>Source:</strong> {selectedNode.metadata.source_description}</p>
                        {selectedNode.metadata.timestamp && (
                          <p><strong>Created:</strong> {new Date(selectedNode.metadata.timestamp).toLocaleString()}</p>
                        )}
                        {selectedNode.metadata.attribution && (
                          <p><strong>Attribution:</strong> {selectedNode.metadata.attribution}</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {selectedEdge && (
                <>
                  <div>
                    <Badge variant="outline">{selectedEdge.type}</Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedEdge.source} → {selectedEdge.target}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Confidence</h4>
                    <Progress value={selectedEdge.confidence * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {(selectedEdge.confidence * 100).toFixed(1)}%
                    </p>
                  </div>

                  {selectedEdge.metadata && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Metadata</h4>
                      <div className="text-xs space-y-1">
                        <p><strong>Type:</strong> {selectedEdge.metadata.type}</p>
                        <p><strong>Source:</strong> {selectedEdge.metadata.source_description}</p>
                        {selectedEdge.metadata.timestamp && (
                          <p><strong>Created:</strong> {new Date(selectedEdge.metadata.timestamp).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};