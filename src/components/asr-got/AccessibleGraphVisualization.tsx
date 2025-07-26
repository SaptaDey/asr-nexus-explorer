import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Network, Eye, EyeOff, Volume2, Info, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { GraphData, GraphNode as ASRGraphNode, GraphEdge as ASRGraphEdge } from '@/types/asrGotTypes';
import { useAccessibilityContext } from '@/components/accessibility/AccessibilityProvider';
import { useAccessibleDescription, useFocusManagement } from '@/hooks/useAccessibility';

interface AccessibleGraphVisualizationProps {
  graphData: GraphData;
  currentStage: number;
  isProcessing: boolean;
  className?: string;
}

interface LocalGraphNode {
  id: string;
  label: string;
  type: string;
  confidence?: number[];
  description?: string;
  metadata?: any;
}

interface LocalGraphEdge {
  source: string;
  target: string;
  relationship: string;
  type: string;
  weight?: number;
}

export const AccessibleGraphVisualization: React.FC<AccessibleGraphVisualizationProps> = ({
  graphData,
  currentStage,
  isProcessing,
  className = ''
}) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'text' | 'both'>('both');
  const [showAudioDescriptions, setShowAudioDescriptions] = useState(false);
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  
  const { announceLiveRegion } = useAccessibilityContext();
  const { generateVisualizationDescription } = useAccessibleDescription();
  const { setFocusWithAnnouncement } = useFocusManagement();
  
  const graphRef = useRef<HTMLDivElement>(null);
  const nodeListRef = useRef<HTMLDivElement>(null);
  
  const nodes: LocalGraphNode[] = graphData?.nodes || [];
  const edges: LocalGraphEdge[] = (graphData?.edges || []).map(edge => ({
    source: edge.source,
    target: edge.target,
    relationship: edge.relationship || edge.type,
    type: edge.type,
    weight: edge.weight
  }));

  const handleKeyNavigation = useCallback((event: KeyboardEvent) => {
    if (!nodes.length) return;

    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowDown':
        event.preventDefault();
        const direction = event.key === 'ArrowUp' ? -1 : 1;
        const newIndex = Math.max(0, Math.min(nodes.length - 1, currentNodeIndex + direction));
        setCurrentNodeIndex(newIndex);
        setSelectedNode(nodes[newIndex].id);
        announceNodeSelection(nodes[newIndex]);
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (nodes[currentNodeIndex]) {
          provideNodeDetails(nodes[currentNodeIndex]);
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        setSelectedNode(null);
        announceLiveRegion('Node selection cleared');
        break;
    }
  }, [nodes, currentNodeIndex]);

  useEffect(() => {
    const graphElement = graphRef.current;
    if (graphElement && viewMode !== 'visual') {
      graphElement.addEventListener('keydown', handleKeyNavigation);
      return () => graphElement.removeEventListener('keydown', handleKeyNavigation);
    }
  }, [handleKeyNavigation, viewMode]);

  const announceNodeSelection = (node: LocalGraphNode) => {
    const connections = edges.filter(e => e.source === node.id || e.target === node.id).length;
    const confidenceText = node.confidence ? ` with ${Math.round(node.confidence[0] * 100)}% confidence` : '';
    
    announceLiveRegion(
      `Selected ${node.type} node: ${node.label}${confidenceText}. ${connections} connections. Press Enter for details.`,
      'polite'
    );
  };

  const provideNodeDetails = (node: LocalGraphNode) => {
    const relatedEdges = edges.filter(e => e.source === node.id || e.target === node.id);
    const connections = relatedEdges.map(edge => {
      const otherNodeId = edge.source === node.id ? edge.target : edge.source;
      const otherNode = nodes.find(n => n.id === otherNodeId);
      return `${edge.relationship} ${otherNode?.label || otherNodeId}`;
    }).join(', ');

    const details = [
      `Node: ${node.label}`,
      `Type: ${node.type}`,
      node.confidence && `Confidence: ${Math.round(node.confidence[0] * 100)}%`,
      node.description && `Description: ${node.description}`,
      connections && `Connections: ${connections}`,
    ].filter(Boolean).join('. ');

    announceLiveRegion(details, 'assertive');
  };

  const generateAudioDescription = () => {
    if (!nodes.length) {
      return 'No graph data available to describe.';
    }

    const nodeTypes = nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const description = [
      `Graph contains ${nodes.length} nodes and ${edges.length} connections.`,
      `Node types: ${Object.entries(nodeTypes).map(([type, count]) => `${count} ${type} nodes`).join(', ')}.`,
      `Research stage: ${currentStage + 1} of 9.`,
      selectedNode ? `Currently selected: ${nodes.find(n => n.id === selectedNode)?.label}` : 'No node selected.',
      'Use arrow keys to navigate nodes, Enter to get details, Escape to clear selection.'
    ].join(' ');

    return description;
  };

  const speakDescription = () => {
    const description = generateAudioDescription();
    announceLiveRegion(description, 'assertive');
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(description);
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const getNodesByType = () => {
    const grouped = nodes.reduce((acc, node) => {
      if (!acc[node.type]) acc[node.type] = [];
      acc[node.type].push(node);
      return acc;
    }, {} as Record<string, LocalGraphNode[]>);

    return grouped;
  };

  const renderTextualView = () => {
    const nodesByType = getNodesByType();

    return (
      <ScrollArea className="h-96">
        <div className="space-y-4 p-4">
          <div className="text-sm text-gray-600 mb-4">
            {generateVisualizationDescription(graphData, currentStage)}
          </div>

          {Object.entries(nodesByType).map(([type, typeNodes]) => (
            <div key={type} className="space-y-2">
              <h4 className="font-semibold capitalize flex items-center">
                {type} Nodes ({typeNodes.length})
              </h4>
              
              <div className="space-y-2 ml-4">
                {typeNodes.map((node, index) => {
                  const nodeConnections = edges.filter(e => e.source === node.id || e.target === node.id);
                  const isSelected = selectedNode === node.id;
                  
                  return (
                    <div
                      key={node.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => {
                        setSelectedNode(node.id);
                        announceNodeSelection(node);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedNode(node.id);
                          announceNodeSelection(node);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`${node.type} node: ${node.label}`}
                      aria-pressed={isSelected}
                      aria-describedby={`node-${node.id}-desc`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-medium">{node.label}</h5>
                          {node.description && (
                            <p className="text-sm text-gray-600 mt-1">{node.description}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {node.confidence && (
                            <Badge variant="secondary">
                              {Math.round(node.confidence[0] * 100)}%
                            </Badge>
                          )}
                          <Badge variant="outline">
                            {nodeConnections.length} connections
                          </Badge>
                        </div>
                      </div>
                      
                      <div id={`node-${node.id}-desc`} className="sr-only">
                        {node.type} node with {nodeConnections.length} connections.
                        {node.confidence && ` Confidence: ${Math.round(node.confidence[0] * 100)}%.`}
                        {node.description && ` Description: ${node.description}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {edges.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Relationships ({edges.length})</h4>
              <div className="space-y-1 ml-4 text-sm">
                {edges.slice(0, 10).map((edge, index) => {
                  const sourceNode = nodes.find(n => n.id === edge.source);
                  const targetNode = nodes.find(n => n.id === edge.target);
                  
                  return (
                    <div key={index} className="p-2 bg-gray-50 rounded">
                      <span className="font-medium">{sourceNode?.label || edge.source}</span>
                      <span className="text-gray-600 mx-2">→ {edge.relationship} →</span>
                      <span className="font-medium">{targetNode?.label || edge.target}</span>
                      {edge.weight && (
                        <Badge variant="outline" className="ml-2">
                          Weight: {edge.weight.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                  );
                })}
                {edges.length > 10 && (
                  <p className="text-gray-500 italic">... and {edges.length - 10} more relationships</p>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    );
  };

  return (
    <Card className={`w-full ${className}`} role="region" aria-labelledby="graph-viz-title">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle id="graph-viz-title" className="flex items-center">
            <Network className="h-5 w-5 mr-2" aria-hidden="true" />
            Research Knowledge Graph
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={speakDescription}
              aria-label="Speak graph description"
            >
              <Volume2 className="h-4 w-4 mr-1" aria-hidden="true" />
              Audio Description
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAudioDescriptions(!showAudioDescriptions)}
              aria-label={`${showAudioDescriptions ? 'Hide' : 'Show'} audio descriptions`}
            >
              {showAudioDescriptions ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          {nodes.length} nodes, {edges.length} connections • Stage {currentStage + 1}/9
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
          <TabsList className="grid w-full grid-cols-3" role="tablist">
            <TabsTrigger value="visual" role="tab">Visual</TabsTrigger>
            <TabsTrigger value="text" role="tab">Text-based</TabsTrigger>
            <TabsTrigger value="both" role="tab">Both</TabsTrigger>
          </TabsList>

          <TabsContent value="visual" role="tabpanel">
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" aria-hidden="true" />
                  <div>
                    <h4 className="font-medium text-blue-900">Visual Graph View</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Interactive network visualization showing research nodes and relationships.
                      For full accessibility, use the "Text-based" or "Both" view options.
                    </p>
                  </div>
                </div>
              </div>
              
              <div 
                ref={graphRef}
                className="h-96 bg-gray-50 border rounded-lg flex items-center justify-center"
                role="img"
                aria-label={generateVisualizationDescription(graphData, currentStage)}
              >
                <div className="text-center text-gray-500">
                  <Network className="h-12 w-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
                  <p>Interactive graph visualization would appear here</p>
                  <p className="text-sm mt-2">
                    Switch to "Text-based" view for accessible node navigation
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="text" role="tabpanel">
            <div 
              ref={nodeListRef}
              tabIndex={0}
              role="application"
              aria-label="Graph navigation"
              aria-describedby="graph-instructions"
            >
              <div id="graph-instructions" className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Keyboard Navigation:</strong> Use arrow keys to navigate nodes, 
                  Enter to get details, Escape to clear selection.
                </p>
              </div>
              
              {renderTextualView()}
            </div>
          </TabsContent>

          <TabsContent value="both" role="tabpanel">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Visual Representation</h4>
                <div 
                  className="h-64 bg-gray-50 border rounded-lg flex items-center justify-center"
                  role="img"
                  aria-label={generateVisualizationDescription(graphData, currentStage)}
                >
                  <div className="text-center text-gray-500">
                    <Network className="h-8 w-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
                    <p className="text-sm">Graph visualization</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Accessible Navigation</h4>
                <div className="h-64 overflow-hidden">
                  {renderTextualView()}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div 
          className="sr-only" 
          aria-live="polite" 
          aria-atomic="true"
          id="graph-announcements"
        >
        </div>

        {selectedNode && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium mb-2">Selected Node Details</h4>
            {(() => {
              const node = nodes.find(n => n.id === selectedNode);
              if (!node) return null;
              
              const connections = edges.filter(e => e.source === node.id || e.target === node.id);
              
              return (
                <div className="space-y-2 text-sm">
                  <p><strong>Label:</strong> {node.label}</p>
                  <p><strong>Type:</strong> {node.type}</p>
                  {node.confidence && (
                    <p><strong>Confidence:</strong> {Math.round(node.confidence[0] * 100)}%</p>
                  )}
                  {node.description && (
                    <p><strong>Description:</strong> {node.description}</p>
                  )}
                  <p><strong>Connections:</strong> {connections.length}</p>
                  
                  {connections.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium">
                        View all connections ({connections.length})
                      </summary>
                      <ul className="mt-2 space-y-1 ml-4">
                        {connections.map((edge, index) => {
                          const otherNodeId = edge.source === node.id ? edge.target : edge.source;
                          const otherNode = nodes.find(n => n.id === otherNodeId);
                          return (
                            <li key={index}>
                              {edge.relationship} → {otherNode?.label || otherNodeId}
                            </li>
                          );
                        })}
                      </ul>
                    </details>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{nodes.length}</div>
            <div className="text-sm text-gray-600">Total Nodes</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{edges.length}</div>
            <div className="text-sm text-gray-600">Connections</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">
              {Object.keys(getNodesByType()).length}
            </div>
            <div className="text-sm text-gray-600">Node Types</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{currentStage + 1}/9</div>
            <div className="text-sm text-gray-600">Stage Progress</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
