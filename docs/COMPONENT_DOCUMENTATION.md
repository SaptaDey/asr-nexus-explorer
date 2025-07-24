# ASR-GoT Component Documentation

## Overview

Interactive component documentation for the ASR-GoT (Automatic Scientific Research - Graph of Thoughts) framework. This guide provides comprehensive examples, props documentation, and interactive usage patterns for all components in the system.

## Table of Contents

1. [Core Research Components](#core-research-components)
2. [Graph Visualization Components](#graph-visualization-components)
3. [UI Components](#ui-components)
4. [Form & Input Components](#form--input-components)
5. [Export & Analysis Components](#export--analysis-components)
6. [Debug & Development Components](#debug--development-components)
7. [Authentication Components](#authentication-components)
8. [Layout & Navigation Components](#layout--navigation-components)
9. [Interactive Examples](#interactive-examples)
10. [Component Testing](#component-testing)

---

## Core Research Components

### ResearchInterface

The main interface component for conducting ASR-GoT research workflows.

**File**: `/src/components/asr-got/ResearchInterface.tsx`

#### Props

```typescript
interface ResearchInterfaceProps {
  initialQuery?: string;
  autoStart?: boolean;
  processingMode?: 'manual' | 'automatic';
  onStageComplete?: (stage: number, result: StageResult) => void;
  onError?: (error: string, stage?: number) => void;
  onComplete?: (finalResult: FinalResult) => void;
  onStateChange?: (state: ASRGoTState) => void;
  className?: string;
  style?: React.CSSProperties;
  debugMode?: boolean;
  showProgress?: boolean;
  enableExport?: boolean;
}
```

#### Interactive Example

```typescript
import React, { useState, useCallback } from 'react';
import { ResearchInterface } from '@/components/asr-got/ResearchInterface';
import { toast } from 'sonner';

function ResearchInterfaceExample() {
  const [results, setResults] = useState<any[]>([]);
  const [currentStage, setCurrentStage] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleStageComplete = useCallback((stage: number, result: any) => {
    console.log(`🎉 Stage ${stage} completed:`, result);
    setResults(prev => [...prev, { stage, result, timestamp: Date.now() }]);
    setCurrentStage(stage);
    
    toast.success(`Stage ${stage} completed successfully`, {
      description: `Generated ${result.graph?.nodes?.length || 0} nodes`,
      duration: 3000,
    });
  }, []);

  const handleError = useCallback((error: string, stage?: number) => {
    console.error(`❌ Error in stage ${stage}:`, error);
    
    toast.error(`Stage ${stage} failed`, {
      description: error,
      duration: 5000,
    });
  }, []);

  const handleComplete = useCallback((finalResult: any) => {
    console.log('🏁 Research completed:', finalResult);
    setIsCompleted(true);
    
    toast.success('Research completed!', {
      description: 'Full analysis report generated',
      duration: 5000,
    });
  }, []);

  const handleStateChange = useCallback((state: any) => {
    console.log('📊 State updated:', {
      stage: state.currentStage,
      nodes: state.graphData?.nodes?.length,
      edges: state.graphData?.edges?.length
    });
  }, []);

  return (
    <div className="research-interface-example">
      <div className="example-header">
        <h3>ResearchInterface Component</h3>
        <div className="status-indicators">
          <span className={`status ${currentStage > 0 ? 'active' : ''}`}>
            Current Stage: {currentStage}
          </span>
          <span className={`status ${isCompleted ? 'completed' : ''}`}>
            {isCompleted ? '✅ Completed' : '🔄 In Progress'}
          </span>
        </div>
      </div>

      <ResearchInterface
        initialQuery="Analyze the effectiveness of CRISPR-Cas9 in treating genetic disorders"
        autoStart={false}
        processingMode="manual"
        onStageComplete={handleStageComplete}
        onError={handleError}
        onComplete={handleComplete}
        onStateChange={handleStateChange}
        className="demo-research-interface"
        debugMode={true}
        showProgress={true}
        enableExport={true}
      />

      <div className="results-panel">
        <h4>Stage Results ({results.length})</h4>
        <div className="results-list">
          {results.map((item, index) => (
            <div key={index} className="result-item">
              <div className="result-header">
                <strong>Stage {item.stage}</strong>
                <span className="timestamp">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="result-summary">
                Nodes: {item.result.graph?.nodes?.length || 0} | 
                Edges: {item.result.graph?.edges?.length || 0}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .research-interface-example {
          padding: 20px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .example-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e2e8f0;
        }

        .status-indicators {
          display: flex;
          gap: 12px;
        }

        .status {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          background: #f1f5f9;
          color: #64748b;
        }

        .status.active {
          background: #dbeafe;
          color: #2563eb;
        }

        .status.completed {
          background: #dcfce7;
          color: #16a34a;
        }

        .results-panel {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }

        .results-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 200px;
          overflow-y: auto;
        }

        .result-item {
          padding: 12px;
          background: #f8fafc;
          border-radius: 6px;
          border-left: 3px solid #3b82f6;
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .timestamp {
          font-size: 11px;
          color: #64748b;
        }

        .result-summary {
          font-size: 12px;
          color: #475569;
        }
      `}</style>
    </div>
  );
}

export default ResearchInterfaceExample;
```

#### Usage Patterns

**Basic Usage**:
```typescript
<ResearchInterface 
  initialQuery="Your research question here"
  onComplete={(result) => console.log('Done!', result)}
/>
```

**Advanced Configuration**:
```typescript
<ResearchInterface
  initialQuery="Complex research question"
  processingMode="automatic"
  autoStart={true}
  debugMode={process.env.NODE_ENV === 'development'}
  onStageComplete={(stage, result) => {
    // Save progress to database
    saveStageProgress(stage, result);
  }}
  onError={(error, stage) => {
    // Custom error handling
    reportError(error, stage);
  }}
  className="custom-research-interface"
  style={{ 
    minHeight: '600px',
    maxWidth: '1000px' 
  }}
/>
```

---

### StageManager

Component for managing individual stage execution with controls and status display.

**File**: `/src/components/asr-got/StageManager.tsx`

#### Props

```typescript
interface StageManagerProps {
  currentStage: number;
  totalStages?: number;
  stageResults?: StageResult[];
  onStageExecute?: (stage: number) => Promise<void>;
  onStageRetry?: (stage: number) => Promise<void>;
  onStageSkip?: (stage: number) => void;
  processingMode?: 'manual' | 'automatic';
  showDetails?: boolean;
  allowRetry?: boolean;
  allowSkip?: boolean;
  className?: string;
}
```

#### Interactive Example

```typescript
import React, { useState } from 'react';
import { StageManager } from '@/components/asr-got/StageManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function StageManagerExample() {
  const [currentStage, setCurrentStage] = useState(1);
  const [stageResults, setStageResults] = useState<any[]>([]);
  const [processingMode, setProcessingMode] = useState<'manual' | 'automatic'>('manual');
  const [isExecuting, setIsExecuting] = useState(false);

  const stageNames = [
    'Initialization',
    'Decomposition', 
    'Hypothesis Generation',
    'Evidence Integration',
    'Pruning/Merging',
    'Subgraph Extraction',
    'Composition',
    'Reflection',
    'Final Analysis'
  ];

  const handleStageExecute = async (stage: number) => {
    setIsExecuting(true);
    console.log(`🚀 Executing stage ${stage}: ${stageNames[stage - 1]}`);
    
    try {
      // Simulate stage execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = {
        stage,
        name: stageNames[stage - 1],
        status: 'completed',
        timestamp: Date.now(),
        nodes: Math.floor(Math.random() * 20) + 5,
        edges: Math.floor(Math.random() * 30) + 10,
        duration: Math.random() * 5000 + 1000
      };
      
      setStageResults(prev => [...prev, result]);
      
      if (processingMode === 'automatic' && stage < 9) {
        setCurrentStage(stage + 1);
      }
      
    } catch (error) {
      console.error(`❌ Stage ${stage} failed:`, error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleStageRetry = async (stage: number) => {
    console.log(`🔄 Retrying stage ${stage}`);
    await handleStageExecute(stage);
  };

  const handleStageSkip = (stage: number) => {
    console.log(`⏭️ Skipping stage ${stage}`);
    setCurrentStage(stage + 1);
  };

  const resetDemo = () => {
    setCurrentStage(1);
    setStageResults([]);
  };

  return (
    <div className="stage-manager-example">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            StageManager Component
            <div className="flex gap-2">
              <Badge variant={processingMode === 'manual' ? 'default' : 'secondary'}>
                {processingMode.toUpperCase()}
              </Badge>
              <Button size="sm" variant="outline" onClick={resetDemo}>
                Reset Demo
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="controls-section mb-4">
            <div className="flex gap-4 items-center">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  checked={processingMode === 'manual'}
                  onChange={() => setProcessingMode('manual')}
                />
                Manual Mode
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  checked={processingMode === 'automatic'}
                  onChange={() => setProcessingMode('automatic')}
                />
                Automatic Mode
              </label>
            </div>
          </div>

          <StageManager
            currentStage={currentStage}
            totalStages={9}
            stageResults={stageResults}
            onStageExecute={handleStageExecute}
            onStageRetry={handleStageRetry}
            onStageSkip={handleStageSkip}
            processingMode={processingMode}
            showDetails={true}
            allowRetry={true}
            allowSkip={processingMode === 'manual'}
            className="demo-stage-manager"
          />

          {isExecuting && (
            <div className="execution-indicator">
              <div className="animate-pulse">
                ⚡ Executing {stageNames[currentStage - 1]}...
              </div>
            </div>
          )}

          <div className="results-summary mt-6">
            <h4 className="text-lg font-semibold mb-3">Execution Summary</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="stat-card">
                <div className="stat-value">{stageResults.length}</div>
                <div className="stat-label">Stages Completed</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {stageResults.reduce((sum, r) => sum + r.nodes, 0)}
                </div>
                <div className="stat-label">Total Nodes</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {stageResults.reduce((sum, r) => sum + r.edges, 0)}
                </div>
                <div className="stat-label">Total Edges</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <style jsx>{`
        .stage-manager-example {
          max-width: 800px;
          margin: 0 auto;
        }

        .controls-section {
          padding: 16px;
          background: #f8fafc;
          border-radius: 6px;
        }

        .execution-indicator {
          padding: 12px;
          background: #fef3c7;
          border-radius: 6px;
          text-align: center;
          font-weight: 500;
          color: #92400e;
          margin-top: 16px;
        }

        .results-summary {
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }

        .stat-card {
          padding: 16px;
          background: #f1f5f9;
          border-radius: 8px;
          text-align: center;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
        }

        .stat-label {
          font-size: 12px;
          color: #64748b;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
}

export default StageManagerExample;
```

---

## Graph Visualization Components

### EnhancedGraphVisualization

Advanced graph visualization component using Cytoscape.js with multiple layout options and interactive features.

**File**: `/src/components/asr-got/EnhancedGraphVisualization.tsx`

#### Props

```typescript
interface GraphVisualizationProps {
  graphData: GraphData;
  layout?: 'cose' | 'breadthfirst' | 'circle' | 'concentric' | 'grid' | 'random';
  interactive?: boolean;
  showLabels?: boolean;
  showConfidence?: boolean;
  showMetadata?: boolean;
  highlightPath?: string[];
  selectedNodes?: string[];
  onNodeSelect?: (node: GraphNode) => void;
  onEdgeSelect?: (edge: GraphEdge) => void;
  onLayoutChange?: (layout: string) => void;
  zoom?: number;
  style?: React.CSSProperties;
  className?: string;
  colorScheme?: 'default' | 'dark' | 'high-contrast';
  animations?: boolean;
}
```

#### Interactive Example

```typescript
import React, { useState, useMemo } from 'react';
import { EnhancedGraphVisualization } from '@/components/asr-got/EnhancedGraphVisualization';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function GraphVisualizationExample() {
  const [layout, setLayout] = useState<string>('cose');
  const [showLabels, setShowLabels] = useState(true);
  const [showConfidence, setShowConfidence] = useState(true);
  const [interactive, setInteractive] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);
  const [colorScheme, setColorScheme] = useState<'default' | 'dark' | 'high-contrast'>('default');

  // Generate sample graph data
  const sampleGraphData = useMemo(() => {
    const nodes = [
      {
        id: 'n0_root',
        label: 'Task Understanding',
        type: 'root',
        confidence: [0.9, 0.8, 0.7, 0.85],
        metadata: {
          parameter_id: 'P1.1',
          type: 'root_initialization',
          source_description: 'Root node for research task',
          value: 'Analyze CRISPR applications in immunotherapy',
          timestamp: new Date().toISOString(),
          impact_score: 1.0
        }
      },
      {
        id: 'n1_scope',
        label: 'Research Scope',
        type: 'dimension',
        confidence: [0.8, 0.75, 0.8, 0.7],
        metadata: {
          parameter_id: 'P1.2',
          type: 'decomposition_dimension',
          source_description: 'Scope analysis dimension',
          value: 'Define boundaries of CRISPR research in immunotherapy context',
          timestamp: new Date().toISOString(),
          impact_score: 0.9
        }
      },
      {
        id: 'n2_objectives',
        label: 'Research Objectives',
        type: 'dimension',
        confidence: [0.85, 0.8, 0.75, 0.8],
        metadata: {
          parameter_id: 'P1.2',
          type: 'decomposition_dimension',
          source_description: 'Objectives analysis dimension',
          value: 'Identify specific research goals and success criteria',
          timestamp: new Date().toISOString(),
          impact_score: 0.85
        }
      },
      {
        id: 'h1_effectiveness',
        label: 'CRISPR Effectiveness Hypothesis',
        type: 'hypothesis',
        confidence: [0.7, 0.8, 0.6, 0.65],
        metadata: {
          parameter_id: 'P1.3',
          type: 'research_hypothesis',
          source_description: 'Generated hypothesis for effectiveness testing',
          value: 'CRISPR-Cas9 demonstrates superior efficacy in T-cell modification for immunotherapy',
          falsification_criteria: 'Comparative studies showing no significant improvement over traditional methods',
          timestamp: new Date().toISOString(),
          impact_score: 0.8
        }
      },
      {
        id: 'e1_clinical_data',
        label: 'Clinical Trial Evidence',
        type: 'evidence',
        confidence: [0.85, 0.75, 0.9, 0.8],
        metadata: {
          parameter_id: 'P1.4',
          type: 'integrated_evidence',
          source_description: 'Clinical trial data from peer-reviewed sources',
          value: 'Multiple phase II trials show 60-70% response rates in CAR-T therapy',
          evidence_quality: 'high',
          statistical_power: 0.85,
          timestamp: new Date().toISOString(),
          impact_score: 0.95
        }
      }
    ];

    const edges = [
      {
        id: 'edge_root_scope',
        source: 'n0_root',
        target: 'n1_scope',
        type: 'supportive',
        confidence: 0.8,
        metadata: {
          type: 'decomposition_derivation',
          source_description: 'Root to scope decomposition',
          timestamp: new Date().toISOString()
        }
      },
      {
        id: 'edge_root_objectives',
        source: 'n0_root',
        target: 'n2_objectives',
        type: 'supportive',
        confidence: 0.85,
        metadata: {
          type: 'decomposition_derivation',
          source_description: 'Root to objectives decomposition',
          timestamp: new Date().toISOString()
        }
      },
      {
        id: 'edge_scope_hypothesis',
        source: 'n1_scope',
        target: 'h1_effectiveness',
        type: 'supportive',
        confidence: 0.75,
        metadata: {
          type: 'hypothesis_derivation',
          source_description: 'Scope to hypothesis relationship',
          timestamp: new Date().toISOString()
        }
      },
      {
        id: 'edge_hypothesis_evidence',
        source: 'h1_effectiveness',
        target: 'e1_clinical_data',
        type: 'causal_direct',
        confidence: 0.9,
        metadata: {
          type: 'evidence_support',
          source_description: 'Hypothesis supported by clinical evidence',
          causal_metadata: {
            causal_direction: 'evidence supports hypothesis',
            causal_confidence: 0.9
          },
          timestamp: new Date().toISOString()
        }
      }
    ];

    return {
      nodes,
      edges,
      metadata: {
        version: '1.0.0',
        created: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        stage: 4,
        total_nodes: nodes.length,
        total_edges: edges.length,
        graph_metrics: {
          complexity: 0.6,
          connectivity: 0.8
        }
      }
    };
  }, []);

  const handleNodeSelect = (node: any) => {
    console.log('Selected node:', node);
    setSelectedNode(node);
    setSelectedEdge(null);
  };

  const handleEdgeSelect = (edge: any) => {
    console.log('Selected edge:', edge);
    setSelectedEdge(edge);
    setSelectedNode(null);
  };

  const resetSelection = () => {
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  const getNodeTypeColor = (type: string) => {
    const colors = {
      root: '#ef4444',
      dimension: '#3b82f6',
      hypothesis: '#f59e0b',
      evidence: '#10b981',
      reflection: '#8b5cf6'
    };
    return colors[type as keyof typeof colors] || '#6b7280';
  };

  return (
    <div className="graph-visualization-example">
      <div className="controls-panel">
        <Card>
          <CardHeader>
            <CardTitle>Graph Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="control-group">
              <Label htmlFor="layout-select">Layout Algorithm</Label>
              <Select value={layout} onValueChange={setLayout}>
                <SelectTrigger id="layout-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cose">COSE (Force-directed)</SelectItem>
                  <SelectItem value="breadthfirst">Breadth-first</SelectItem>
                  <SelectItem value="circle">Circle</SelectItem>
                  <SelectItem value="concentric">Concentric</SelectItem>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="control-group">
              <Label htmlFor="color-scheme">Color Scheme</Label>
              <Select value={colorScheme} onValueChange={(value: any) => setColorScheme(value)}>
                <SelectTrigger id="color-scheme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="high-contrast">High Contrast</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="control-group">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-labels"
                  checked={showLabels}
                  onCheckedChange={setShowLabels}
                />
                <Label htmlFor="show-labels">Show Labels</Label>
              </div>
            </div>

            <div className="control-group">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-confidence"
                  checked={showConfidence}
                  onCheckedChange={setShowConfidence}
                />
                <Label htmlFor="show-confidence">Show Confidence</Label>
              </div>
            </div>

            <div className="control-group">
              <div className="flex items-center space-x-2">
                <Switch
                  id="interactive"
                  checked={interactive}
                  onCheckedChange={setInteractive}
                />
                <Label htmlFor="interactive">Interactive Mode</Label>
              </div>
            </div>

            <Button onClick={resetSelection} variant="outline" size="sm">
              Clear Selection
            </Button>
          </CardContent>
        </Card>

        {/* Node/Edge Details Panel */}
        {(selectedNode || selectedEdge) && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>
                {selectedNode ? 'Node Details' : 'Edge Details'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedNode && (
                <div className="node-details">
                  <div className="detail-row">
                    <strong>ID:</strong> {selectedNode.id}
                  </div>
                  <div className="detail-row">
                    <strong>Label:</strong> {selectedNode.label}
                  </div>
                  <div className="detail-row">
                    <strong>Type:</strong> 
                    <span 
                      className="type-badge"
                      style={{ backgroundColor: getNodeTypeColor(selectedNode.type) }}
                    >
                      {selectedNode.type}
                    </span>
                  </div>
                  <div className="detail-row">
                    <strong>Confidence:</strong> 
                    <div className="confidence-bars">
                      {selectedNode.confidence?.map((conf: number, index: number) => (
                        <div key={index} className="confidence-bar">
                          <div 
                            className="confidence-fill"
                            style={{ width: `${conf * 100}%` }}
                          />
                          <span className="confidence-value">{(conf * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="detail-row">
                    <strong>Impact Score:</strong> {selectedNode.metadata?.impact_score || 'N/A'}
                  </div>
                  <div className="detail-row">
                    <strong>Description:</strong>
                    <div className="description">
                      {selectedNode.metadata?.value || 'No description available'}
                    </div>
                  </div>
                </div>
              )}

              {selectedEdge && (
                <div className="edge-details">
                  <div className="detail-row">
                    <strong>ID:</strong> {selectedEdge.id}
                  </div>
                  <div className="detail-row">
                    <strong>Source:</strong> {selectedEdge.source}
                  </div>
                  <div className="detail-row">
                    <strong>Target:</strong> {selectedEdge.target}
                  </div>
                  <div className="detail-row">
                    <strong>Type:</strong> {selectedEdge.type}
                  </div>
                  <div className="detail-row">
                    <strong>Confidence:</strong> {(selectedEdge.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="visualization-container">
        <Card>
          <CardHeader>
            <CardTitle>Graph Visualization</CardTitle>
            <div className="graph-stats">
              <span>Nodes: {sampleGraphData.nodes.length}</span>
              <span>Edges: {sampleGraphData.edges.length}</span>
              <span>Stage: {sampleGraphData.metadata.stage}</span>
            </div>
          </CardHeader>
          <CardContent>
            <EnhancedGraphVisualization
              graphData={sampleGraphData}
              layout={layout as any}
              interactive={interactive}
              showLabels={showLabels}
              showConfidence={showConfidence}
              showMetadata={true}
              onNodeSelect={handleNodeSelect}
              onEdgeSelect={handleEdgeSelect}
              colorScheme={colorScheme}
              animations={true}
              style={{ height: '500px', width: '100%' }}
              className="demo-graph-visualization"
            />
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        .graph-visualization-example {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .graph-stats {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #64748b;
        }

        .detail-row {
          margin-bottom: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .type-badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          color: white;
          font-size: 11px;
          font-weight: 500;
          margin-left: 8px;
        }

        .confidence-bars {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 4px;
        }

        .confidence-bar {
          position: relative;
          height: 16px;
          background: #f1f5f9;
          border-radius: 8px;
          overflow: hidden;
        }

        .confidence-fill {
          height: 100%;
          background: linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #10b981 100%);
          transition: width 0.3s ease;
        }

        .confidence-value {
          position: absolute;
          right: 4px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 10px;
          font-weight: 500;
          color: #374151;
        }

        .description {
          padding: 8px;
          background: #f8fafc;
          border-radius: 4px;
          font-size: 12px;
          line-height: 1.4;
          color: #475569;
        }

        @media (max-width: 1024px) {
          .graph-visualization-example {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default GraphVisualizationExample;
```

---

### TreeOfReasoningVisualization

3D botanical tree visualization for representing reasoning structures.

**File**: `/src/components/asr-got/TreeOfReasoningVisualization.tsx`

#### Props

```typescript
interface TreeVisualizationProps {
  graphData: GraphData;
  treeStyle?: 'botanical' | 'geometric' | 'organic';
  showGrowthAnimation?: boolean;
  interactive3D?: boolean;
  cameraControls?: boolean;
  showSeasons?: boolean;
  seasonSpeed?: number;
  nodeSize?: 'small' | 'medium' | 'large';
  onNodeHover?: (node: GraphNode | null) => void;
  onNodeClick?: (node: GraphNode) => void;
  className?: string;
  style?: React.CSSProperties;
}
```

#### Interactive Example

```typescript
import React, { useState, useEffect } from 'react';
import { TreeOfReasoningVisualization } from '@/components/asr-got/TreeOfReasoningVisualization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function TreeVisualizationExample() {
  const [treeStyle, setTreeStyle] = useState<'botanical' | 'geometric' | 'organic'>('botanical');
  const [showGrowthAnimation, setShowGrowthAnimation] = useState(true);
  const [interactive3D, setInteractive3D] = useState(true);
  const [showSeasons, setShowSeasons] = useState(false);
  const [seasonSpeed, setSeasonSpeed] = useState([1]);
  const [nodeSize, setNodeSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isGrowing, setIsGrowing] = useState(false);

  // Generate hierarchical tree data
  const generateTreeData = () => {
    const nodes = [
      {
        id: 'root',
        label: 'Research Question',
        type: 'root',
        level: 0,
        confidence: [0.9, 0.85, 0.8, 0.9],
        children: ['scope', 'objectives', 'constraints'],
        metadata: {
          value: 'How effective is CRISPR in immunotherapy?',
          growth_stage: 'mature',
          branch_strength: 1.0
        }
      },
      {
        id: 'scope',
        label: 'Research Scope',
        type: 'dimension',
        level: 1,
        confidence: [0.8, 0.75, 0.8, 0.7],
        children: ['scope_h1', 'scope_h2'],
        parent: 'root',
        metadata: {
          value: 'Define boundaries of CRISPR research',
          growth_stage: 'growing',
          branch_strength: 0.8
        }
      },
      {
        id: 'objectives',
        label: 'Research Objectives', 
        type: 'dimension',
        level: 1,
        confidence: [0.85, 0.8, 0.75, 0.8],
        children: ['obj_h1', 'obj_h2', 'obj_h3'],
        parent: 'root',
        metadata: {
          value: 'Identify specific research goals',
          growth_stage: 'mature',
          branch_strength: 0.9
        }
      },
      {
        id: 'constraints',
        label: 'Constraints',
        type: 'dimension',
        level: 1,
        confidence: [0.7, 0.8, 0.85, 0.75],
        children: ['const_h1'],
        parent: 'root',
        metadata: {
          value: 'Identify limitations and constraints',
          growth_stage: 'budding',
          branch_strength: 0.6
        }
      },
      // Level 2 - Hypotheses
      {
        id: 'scope_h1',
        label: 'Efficacy Hypothesis',
        type: 'hypothesis',
        level: 2,
        confidence: [0.75, 0.8, 0.7, 0.65],
        children: ['eff_evidence'],
        parent: 'scope',
        metadata: {
          value: 'CRISPR shows higher efficacy than traditional methods',
          growth_stage: 'flowering',
          branch_strength: 0.7
        }
      },
      {
        id: 'scope_h2',
        label: 'Safety Hypothesis',
        type: 'hypothesis',
        level: 2,
        confidence: [0.8, 0.75, 0.85, 0.7],
        children: ['safety_evidence'],
        parent: 'scope',
        metadata: {
          value: 'CRISPR modifications show acceptable safety profile',
          growth_stage: 'mature',
          branch_strength: 0.75
        }
      },
      {
        id: 'obj_h1',
        label: 'Mechanism Hypothesis',
        type: 'hypothesis',
        level: 2,
        confidence: [0.7, 0.85, 0.75, 0.8],
        children: ['mech_evidence'],
        parent: 'objectives',
        metadata: {
          value: 'CRISPR enhances T-cell targeting specificity',
          growth_stage: 'growing',
          branch_strength: 0.8
        }
      },
      // Level 3 - Evidence
      {
        id: 'eff_evidence',
        label: 'Clinical Trial Data',
        type: 'evidence',
        level: 3,
        confidence: [0.9, 0.85, 0.95, 0.8],
        parent: 'scope_h1',
        metadata: {
          value: 'Phase II trials show 70% response rate',
          growth_stage: 'fruiting',
          branch_strength: 0.95,
          evidence_quality: 'high'
        }
      },
      {
        id: 'safety_evidence',
        label: 'Safety Studies',
        type: 'evidence',
        level: 3,
        confidence: [0.85, 0.8, 0.9, 0.85],
        parent: 'scope_h2',
        metadata: {
          value: 'Low adverse event rates in controlled studies',
          growth_stage: 'fruiting',
          branch_strength: 0.85,
          evidence_quality: 'high'
        }
      },
      {
        id: 'mech_evidence',
        label: 'Molecular Studies',
        type: 'evidence',
        level: 3,
        confidence: [0.8, 0.9, 0.85, 0.75],
        parent: 'obj_h1',
        metadata: {
          value: 'Increased antigen recognition specificity measured',
          growth_stage: 'growing',
          branch_strength: 0.8,
          evidence_quality: 'medium'
        }
      }
    ];

    const edges = nodes
      .filter(node => node.parent)
      .map(node => ({
        id: `edge_${node.parent}_${node.id}`,
        source: node.parent!,
        target: node.id,
        type: 'hierarchical',
        confidence: node.confidence[0],
        metadata: {
          type: 'parent_child',
          branch_type: node.type === 'evidence' ? 'leaf' : 'branch'
        }
      }));

    return {
      nodes,
      edges,
      metadata: {
        version: '1.0.0',
        created: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        stage: 4,
        total_nodes: nodes.length,
        total_edges: edges.length,
        tree_depth: 3,
        growth_complete: false
      }
    };
  };

  const [treeData, setTreeData] = useState(generateTreeData);

  const handleNodeHover = (node: any) => {
    setHoveredNode(node);
  };

  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
    console.log('Tree node selected:', node);
  };

  const simulateGrowth = () => {
    setIsGrowing(true);
    
    // Simulate growth over time
    const growthStages = ['budding', 'growing', 'flowering', 'fruiting', 'mature'];
    let currentStage = 0;
    
    const growthInterval = setInterval(() => {
      if (currentStage >= growthStages.length) {
        clearInterval(growthInterval);
        setIsGrowing(false);
        return;
      }
      
      setTreeData(prevData => ({
        ...prevData,
        nodes: prevData.nodes.map(node => ({
          ...node,
          metadata: {
            ...node.metadata,
            growth_stage: Math.random() > 0.5 ? growthStages[currentStage] : node.metadata.growth_stage
          }
        }))
      }));
      
      currentStage++;
    }, 1000);
  };

  const resetTree = () => {
    setTreeData(generateTreeData());
    setSelectedNode(null);
    setHoveredNode(null);
  };

  const getGrowthStageColor = (stage: string) => {
    const colors = {
      budding: '#fbbf24',
      growing: '#84cc16',
      flowering: '#ec4899',
      fruiting: '#8b5cf6',
      mature: '#059669'
    };
    return colors[stage as keyof typeof colors] || '#6b7280';
  };

  return (
    <div className="tree-visualization-example">
      <div className="tree-controls">
        <Card>
          <CardHeader>
            <CardTitle>Tree Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="control-group">
              <Label>Tree Style</Label>
              <Select value={treeStyle} onValueChange={(value: any) => setTreeStyle(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="botanical">Botanical</SelectItem>
                  <SelectItem value="geometric">Geometric</SelectItem>
                  <SelectItem value="organic">Organic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="control-group">
              <Label>Node Size</Label>
              <Select value={nodeSize} onValueChange={(value: any) => setNodeSize(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="control-group">
              <div className="flex items-center space-x-2">
                <Switch
                  id="growth-animation"
                  checked={showGrowthAnimation}
                  onCheckedChange={setShowGrowthAnimation}
                />
                <Label htmlFor="growth-animation">Growth Animation</Label>
              </div>
            </div>

            <div className="control-group">
              <div className="flex items-center space-x-2">
                <Switch
                  id="interactive-3d"
                  checked={interactive3D}
                  onCheckedChange={setInteractive3D}
                />
                <Label htmlFor="interactive-3d">3D Interaction</Label>
              </div>
            </div>

            <div className="control-group">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-seasons"
                  checked={showSeasons}
                  onCheckedChange={setShowSeasons}
                />
                <Label htmlFor="show-seasons">Seasonal Changes</Label>
              </div>
            </div>

            {showSeasons && (
              <div className="control-group">
                <Label>Season Speed</Label>
                <Slider
                  value={seasonSpeed}
                  onValueChange={setSeasonSpeed}
                  min={0.1}
                  max={3}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground">
                  Speed: {seasonSpeed[0]}x
                </div>
              </div>
            )}

            <div className="button-group">
              <Button onClick={simulateGrowth} disabled={isGrowing}>
                {isGrowing ? 'Growing...' : 'Simulate Growth'}
              </Button>
              <Button onClick={resetTree} variant="outline">
                Reset Tree
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Node Information Panel */}
        {(hoveredNode || selectedNode) && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>
                {selectedNode ? 'Selected' : 'Hovered'} Node
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(selectedNode || hoveredNode) && (
                <div className="node-info">
                  <div className="info-row">
                    <strong>Label:</strong> {(selectedNode || hoveredNode).label}
                  </div>
                  <div className="info-row">
                    <strong>Type:</strong> {(selectedNode || hoveredNode).type}
                  </div>
                  <div className="info-row">
                    <strong>Level:</strong> {(selectedNode || hoveredNode).level}
                  </div>
                  <div className="info-row">
                    <strong>Growth Stage:</strong>
                    <span 
                      className="growth-badge"
                      style={{ 
                        backgroundColor: getGrowthStageColor(
                          (selectedNode || hoveredNode).metadata?.growth_stage || 'budding'
                        )
                      }}
                    >
                      {(selectedNode || hoveredNode).metadata?.growth_stage || 'budding'}
                    </span>
                  </div>
                  <div className="info-row">
                    <strong>Branch Strength:</strong> 
                    <div className="strength-bar">
                      <div 
                        className="strength-fill"
                        style={{ 
                          width: `${((selectedNode || hoveredNode).metadata?.branch_strength || 0) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  <div className="info-row">
                    <strong>Description:</strong>
                    <div className="description">
                      {(selectedNode || hoveredNode).metadata?.value || 'No description available'}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="tree-container">
        <Card>
          <CardHeader>
            <CardTitle>
              3D Tree of Reasoning
              {isGrowing && <span className="growing-indicator">🌱 Growing...</span>}
            </CardTitle>
            <div className="tree-stats">
              <span>Nodes: {treeData.nodes.length}</span>
              <span>Depth: {treeData.metadata.tree_depth}</span>
              <span>Growth: {isGrowing ? 'Active' : 'Static'}</span>
            </div>
          </CardHeader>
          <CardContent>
            <TreeOfReasoningVisualization
              graphData={treeData}
              treeStyle={treeStyle}
              showGrowthAnimation={showGrowthAnimation}
              interactive3D={interactive3D}
              cameraControls={true}
              showSeasons={showSeasons}
              seasonSpeed={seasonSpeed[0]}
              nodeSize={nodeSize}
              onNodeHover={handleNodeHover}
              onNodeClick={handleNodeClick}
              style={{ height: '600px', width: '100%' }}
              className="demo-tree-visualization"
            />
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        .tree-visualization-example {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .button-group {
          display: flex;
          gap: 8px;
        }

        .button-group button {
          flex: 1;
        }

        .tree-stats {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #64748b;
        }

        .growing-indicator {
          margin-left: 8px;
          font-size: 14px;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .info-row {
          margin-bottom: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .growth-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          color: white;
          font-size: 11px;
          font-weight: 500;
          margin-left: 8px;
          text-transform: capitalize;
        }

        .strength-bar {
          height: 8px;
          background: #f1f5f9;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 4px;
        }

        .strength-fill {
          height: 100%;
          background: linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #10b981 100%);
          transition: width 0.3s ease;
        }

        .description {
          padding: 8px;
          background: #f8fafc;
          border-radius: 4px;
          font-size: 12px;
          line-height: 1.4;
          color: #475569;
        }

        @media (max-width: 1024px) {
          .tree-visualization-example {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default TreeVisualizationExample;
```

---

## UI Components

### Enhanced Parameter Panel

Component for configuring ASR-GoT framework parameters (P1.0-P1.29).

**File**: `/src/components/asr-got/EnhancedParametersPane.tsx`

#### Props

```typescript
interface ParametersPaneProps {
  parameters: ASRGoTParameters;
  onParameterChange: (parameterId: string, value: any) => void;
  onParameterReset: (parameterId: string) => void;
  onResetAll: () => void;
  showAdvanced?: boolean;
  showDescriptions?: boolean;
  groupByCategory?: boolean;
  readOnly?: boolean;
  className?: string;
}
```

#### Interactive Example

```typescript
import React, { useState } from 'react';
import { EnhancedParametersPane } from '@/components/asr-got/EnhancedParametersPane';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function ParametersPaneExample() {
  const [parameters, setParameters] = useState({
    // Framework Execution Rules (P1.0-P1.7)
    'P1.0': { value: true, category: 'execution', description: 'Enable mandatory 9-stage pipeline' },
    'P1.1': { value: 'vancouver', category: 'execution', description: 'Citation style format' },
    'P1.2': { value: 7, category: 'execution', description: 'Number of decomposition dimensions' },
    'P1.3': { value: 4, category: 'execution', description: 'Hypotheses per dimension' },
    'P1.4': { value: true, category: 'execution', description: 'Enable iterative evidence loops' },
    'P1.5': { value: [0.8, 0.7, 0.6, 0.8], category: 'execution', description: 'Confidence vector thresholds' },
    'P1.6': { value: 0.4, category: 'execution', description: 'Minimum edge confidence' },
    'P1.7': { value: true, category: 'execution', description: 'Enable self-audit reflection' },
    
    // Graph Operations (P1.8-P1.11)
    'P1.8': { value: 1000, category: 'graph', description: 'Maximum nodes per graph' },
    'P1.9': { value: true, category: 'graph', description: 'Enable hyperedges' },
    'P1.10': { value: 'cose', category: 'graph', description: 'Default layout algorithm' },
    'P1.11': { value: 0.7, category: 'graph', description: 'Graph density threshold' },
    
    // Metadata & Citations (P1.12-P1.18)
    'P1.12': { value: true, category: 'metadata', description: 'Rich metadata compliance' },
    'P1.13': { value: 'comprehensive', category: 'metadata', description: 'Provenance tracking level' },
    'P1.14': { value: true, category: 'metadata', description: 'Enable attribution tracking' },
    'P1.15': { value: true, category: 'metadata', description: 'Knowledge gap detection' },
    'P1.16': { value: true, category: 'metadata', description: 'Falsifiability requirements' },
    'P1.17': { value: true, category: 'metadata', description: 'Bias detection enabled' },
    'P1.18': { value: 'auto', category: 'metadata', description: 'Reference validation mode' },
    
    // API & Analysis (P1.19-P1.21)
    'P1.19': { value: 'intervention', category: 'analysis', description: 'Analysis framework type' },
    'P1.20': { value: true, category: 'analysis', description: 'Perplexity Sonar integration' },
    'P1.21': { value: { sonar: 3000, gemini: 6000 }, category: 'analysis', description: 'Token limits per API' },
    
    // Advanced Features (P1.22-P1.29)
    'P1.22': { value: true, category: 'advanced', description: 'Dynamic topology management' },
    'P1.23': { value: 'adaptive', category: 'advanced', description: 'Pruning strategy' },
    'P1.24': { value: true, category: 'advanced', description: 'Causal inference enabled' },
    'P1.25': { value: true, category: 'advanced', description: 'Temporal reasoning enabled' },
    'P1.26': { value: 0.8, category: 'advanced', description: 'Statistical power threshold' },
    'P1.27': { value: true, category: 'advanced', description: 'Information theory metrics' },
    'P1.28': { value: 'high', category: 'advanced', description: 'Impact estimation precision' },
    'P1.29': { value: false, category: 'advanced', description: 'Collaboration features enabled' }
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDescriptions, setShowDescriptions] = useState(true);
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [readOnly, setReadOnly] = useState(false);
  const [changedParameters, setChangedParameters] = useState<Set<string>>(new Set());

  const handleParameterChange = (parameterId: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [parameterId]: { ...prev[parameterId], value }
    }));
    
    setChangedParameters(prev => new Set([...prev, parameterId]));
    console.log(`Parameter ${parameterId} changed to:`, value);
  };

  const handleParameterReset = (parameterId: string) => {
    // Reset to default values (simplified)
    const defaults = {
      'P1.0': true,
      'P1.1': 'vancouver',
      'P1.2': 7,
      'P1.3': 4,
      'P1.5': [0.8, 0.7, 0.6, 0.8]
      // ... other defaults
    };

    if (defaults[parameterId]) {
      handleParameterChange(parameterId, defaults[parameterId]);
    }
    
    setChangedParameters(prev => {
      const newSet = new Set(prev);
      newSet.delete(parameterId);
      return newSet;
    });
  };

  const handleResetAll = () => {
    console.log('Resetting all parameters to defaults');
    setChangedParameters(new Set());
    // Reset all parameters logic here
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      execution: '#3b82f6',
      graph: '#10b981',
      metadata: '#f59e0b',
      analysis: '#8b5cf6',
      advanced: '#ef4444'
    };
    return colors[category as keyof typeof colors] || '#6b7280';
  };

  const getCategoryName = (category: string) => {
    const names = {
      execution: 'Framework Execution',
      graph: 'Graph Operations',
      metadata: 'Metadata & Citations',
      analysis: 'API & Analysis',
      advanced: 'Advanced Features'
    };
    return names[category as keyof typeof names] || category;
  };

  const getParametersByCategory = () => {
    const categorized: Record<string, any[]> = {};
    
    Object.entries(parameters).forEach(([id, param]) => {
      const category = param.category;
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push({ id, ...param });
    });
    
    return categorized;
  };

  const renderParameterValue = (param: any, id: string) => {
    const isChanged = changedParameters.has(id);
    
    if (typeof param.value === 'boolean') {
      return (
        <div className={`parameter-control ${isChanged ? 'changed' : ''}`}>
          <Switch
            checked={param.value}
            onCheckedChange={(value) => handleParameterChange(id, value)}
            disabled={readOnly}
          />
        </div>
      );
    }
    
    if (typeof param.value === 'number') {
      return (
        <div className={`parameter-control ${isChanged ? 'changed' : ''}`}>
          <input
            type="number"
            value={param.value}
            onChange={(e) => handleParameterChange(id, parseFloat(e.target.value))}
            disabled={readOnly}
            className="number-input"
          />
        </div>
      );
    }
    
    if (typeof param.value === 'string') {
      return (
        <div className={`parameter-control ${isChanged ? 'changed' : ''}`}>
          <input
            type="text"
            value={param.value}
            onChange={(e) => handleParameterChange(id, e.target.value)}
            disabled={readOnly}
            className="text-input"
          />
        </div>
      );
    }
    
    if (Array.isArray(param.value)) {
      return (
        <div className={`parameter-control ${isChanged ? 'changed' : ''}`}>
          <div className="array-input">
            {param.value.map((val: any, index: number) => (
              <input
                key={index}
                type="number"
                value={val}
                onChange={(e) => {
                  const newArray = [...param.value];
                  newArray[index] = parseFloat(e.target.value);
                  handleParameterChange(id, newArray);
                }}
                disabled={readOnly}
                className="array-item-input"
                step="0.1"
              />
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <div className={`parameter-control ${isChanged ? 'changed' : ''}`}>
        <code>{JSON.stringify(param.value)}</code>
      </div>
    );
  };

  return (
    <div className="parameters-pane-example">
      <div className="controls-header">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              ASR-GoT Parameters Configuration
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {Object.keys(parameters).length} Parameters
                </Badge>
                <Badge variant={changedParameters.size > 0 ? "default" : "secondary"}>
                  {changedParameters.size} Changed
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="control-options">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-advanced"
                  checked={showAdvanced}
                  onCheckedChange={setShowAdvanced}
                />
                <Label htmlFor="show-advanced">Show Advanced</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-descriptions"
                  checked={showDescriptions}
                  onCheckedChange={setShowDescriptions}
                />
                <Label htmlFor="show-descriptions">Show Descriptions</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="group-by-category"
                  checked={groupByCategory}
                  onCheckedChange={setGroupByCategory}
                />
                <Label htmlFor="group-by-category">Group by Category</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="read-only"
                  checked={readOnly}
                  onCheckedChange={setReadOnly}
                />
                <Label htmlFor="read-only">Read Only</Label>
              </div>
              
              <Button onClick={handleResetAll} variant="outline" size="sm">
                Reset All
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="parameters-container">
        <Card>
          <CardContent className="p-0">
            {groupByCategory ? (
              <Tabs defaultValue="execution" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  {Object.keys(getParametersByCategory()).map(category => (
                    <TabsTrigger key={category} value={category}>
                      <span 
                        className="category-dot"
                        style={{ backgroundColor: getCategoryColor(category) }}
                      />
                      {getCategoryName(category)}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {Object.entries(getParametersByCategory()).map(([category, params]) => (
                  <TabsContent key={category} value={category} className="p-6">
                    <div className="category-header">
                      <h3 className="text-lg font-semibold">
                        {getCategoryName(category)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {params.length} parameters in this category
                      </p>
                    </div>
                    
                    <div className="parameters-grid">
                      {params.map(param => {
                        const isAdvanced = param.category === 'advanced';
                        if (!showAdvanced && isAdvanced) return null;
                        
                        return (
                          <div key={param.id} className="parameter-item">
                            <div className="parameter-header">
                              <div className="parameter-label">
                                <Badge 
                                  variant="outline" 
                                  className="parameter-id"
                                  style={{ borderColor: getCategoryColor(param.category) }}
                                >
                                  {param.id}
                                </Badge>
                                {changedParameters.has(param.id) && (
                                  <Badge variant="default" className="changed-badge">
                                    Modified
                                  </Badge>
                                )}
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleParameterReset(param.id)}
                                className="reset-button"
                              >
                                Reset
                              </Button>
                            </div>
                            
                            <div className="parameter-content">
                              {renderParameterValue(param, param.id)}
                              
                              {showDescriptions && (
                                <div className="parameter-description">
                                  {param.description}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <div className="parameters-list p-6">
                {Object.entries(parameters).map(([id, param]) => {
                  const isAdvanced = param.category === 'advanced';
                  if (!showAdvanced && isAdvanced) return null;
                  
                  return (
                    <div key={id} className="parameter-item">
                      <div className="parameter-header">
                        <div className="parameter-label">
                          <Badge 
                            variant="outline" 
                            className="parameter-id"
                            style={{ borderColor: getCategoryColor(param.category) }}
                          >
                            {id}
                          </Badge>
                          <Badge 
                            variant="secondary"
                            style={{ backgroundColor: getCategoryColor(param.category) + '20' }}
                          >
                            {getCategoryName(param.category)}
                          </Badge>
                          {changedParameters.has(id) && (
                            <Badge variant="default">Modified</Badge>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleParameterReset(id)}
                        >
                          Reset
                        </Button>
                      </div>
                      
                      <div className="parameter-content">
                        {renderParameterValue(param, id)}
                        
                        {showDescriptions && (
                          <div className="parameter-description">
                            {param.description}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        .parameters-pane-example {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .control-options {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
        }

        .category-header {
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e2e8f0;
        }

        .category-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 6px;
          display: inline-block;
        }

        .parameters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 16px;
        }

        .parameters-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .parameter-item {
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #fafafa;
        }

        .parameter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .parameter-label {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .parameter-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .parameter-control {
          display: flex;
          align-items: center;
          padding: 4px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .parameter-control.changed {
          background: #fef3c7;
          border: 1px solid #f59e0b;
        }

        .number-input, .text-input {
          padding: 6px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
          width: 100%;
        }

        .array-input {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }

        .array-item-input {
          padding: 4px 6px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 12px;
          width: 60px;
        }

        .parameter-description {
          font-size: 12px;
          color: #64748b;
          line-height: 1.4;
          padding: 8px;
          background: #f8fafc;
          border-radius: 4px;
        }

        .changed-badge {
          background: #fbbf24;
          color: #92400e;
        }

        .reset-button {
          font-size: 12px;
        }

        @media (max-width: 768px) {
          .parameters-grid {
            grid-template-columns: 1fr;
          }
          
          .control-options {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
}

export default ParametersPaneExample;
```

---

## Form & Input Components

### API Integration Component

Secure API credential management and validation component.

**File**: `/src/components/asr-got/APIIntegration.tsx`

#### Props

```typescript
interface APIIntegrationProps {
  onCredentialsUpdate: (credentials: APICredentials) => void;
  onConnectionTest: (service: string, success: boolean) => void;
  initialCredentials?: Partial<APICredentials>;
  showValidation?: boolean;
  showTestResults?: boolean;
  allowSave?: boolean;
  services?: ('gemini' | 'perplexity' | 'openai')[];
  className?: string;
}
```

#### Interactive Example

```typescript
import React, { useState, useEffect } from 'react';
import { APIIntegration } from '@/components/asr-got/APIIntegration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

function APIIntegrationExample() {
  const [credentials, setCredentials] = useState({
    gemini: '',
    perplexity: '',
    openai: ''
  });

  const [connectionStatus, setConnectionStatus] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [showValidation, setShowValidation] = useState(true);
  const [showTestResults, setShowTestResults] = useState(true);
  const [allowSave, setAllowSave] = useState(true);
  const [savedCredentials, setSavedCredentials] = useState(false);

  const handleCredentialsUpdate = (newCredentials: any) => {
    setCredentials(newCredentials);
    console.log('Credentials updated:', {
      gemini: newCredentials.gemini ? '***' + newCredentials.gemini.slice(-4) : '',
      perplexity: newCredentials.perplexity ? '***' + newCredentials.perplexity.slice(-4) : '',
      openai: newCredentials.openai ? '***' + newCredentials.openai.slice(-4) : ''
    });
  };

  const handleConnectionTest = (service: string, success: boolean) => {
    setConnectionStatus(prev => ({ ...prev, [service]: success }));
    
    // Simulate test results
    const mockResults = {
      gemini: {
        model: 'gemini-2.5-pro',
        quota: { used: 1250, limit: 100000 },
        latency: '245ms',
        region: 'us-central1'
      },
      perplexity: {
        model: 'sonar-medium-online',
        quota: { used: 89, limit: 1000 },
        latency: '180ms',
        region: 'us-east1'
      },
      openai: {
        model: 'gpt-4',
        quota: { used: 5670, limit: 50000 },
        latency: '320ms',
        region: 'us-west2'
      }
    };

    if (success) {
      setTestResults(prev => ({ 
        ...prev, 
        [service]: {
          ...mockResults[service as keyof typeof mockResults],
          timestamp: new Date().toISOString(),
          status: 'connected'
        }
      }));
    } else {
      setTestResults(prev => ({
        ...prev,
        [service]: {
          error: 'Connection failed - Invalid API key or network error',
          timestamp: new Date().toISOString(),
          status: 'failed'
        }
      }));
    }

    console.log(`${service} connection test:`, success ? 'SUCCESS' : 'FAILED');
  };

  const saveCredentials = () => {
    // Simulate saving to secure storage
    console.log('Saving credentials to secure storage...');
    setSavedCredentials(true);
    setTimeout(() => setSavedCredentials(false), 3000);
  };

  const clearCredentials = () => {
    setCredentials({ gemini: '', perplexity: '', openai: '' });
    setConnectionStatus({});
    setTestResults({});
  };

  const getServiceStatus = (service: string) => {
    if (connectionStatus[service] === true) return 'connected';
    if (connectionStatus[service] === false) return 'failed';
    return 'unknown';
  };

  const getServiceBadgeVariant = (status: string) => {
    switch (status) {
      case 'connected': return 'default';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  const getServiceBadgeText = (status: string) => {
    switch (status) {
      case 'connected': return '✅ Connected';
      case 'failed': return '❌ Failed';
      default: return '⚪ Unknown';
    }
  };

  return (
    <div className="api-integration-example">
      <div className="example-controls">
        <Card>
          <CardHeader>
            <CardTitle>API Integration Demo Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="control-row">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-validation"
                  checked={showValidation}
                  onCheckedChange={setShowValidation}
                />
                <Label htmlFor="show-validation">Show Validation</Label>
              </div>
            </div>

            <div className="control-row">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-test-results"
                  checked={showTestResults}
                  onCheckedChange={setShowTestResults}
                />
                <Label htmlFor="show-test-results">Show Test Results</Label>
              </div>
            </div>

            <div className="control-row">
              <div className="flex items-center space-x-2">
                <Switch
                  id="allow-save"
                  checked={allowSave}
                  onCheckedChange={setAllowSave}
                />
                <Label htmlFor="allow-save">Allow Save</Label>
              </div>
            </div>

            <div className="button-row">
              <Button onClick={saveCredentials} disabled={!allowSave}>
                Save Credentials
              </Button>
              <Button onClick={clearCredentials} variant="outline">
                Clear All
              </Button>
            </div>

            {savedCredentials && (
              <Alert>
                <AlertDescription>
                  ✅ Credentials saved securely to local storage
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Connection Status Overview */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="status-grid">
              {['gemini', 'perplexity', 'openai'].map(service => (
                <div key={service} className="status-item">
                  <div className="service-name">{service.toUpperCase()}</div>
                  <Badge variant={getServiceBadgeVariant(getServiceStatus(service))}>
                    {getServiceBadgeText(getServiceStatus(service))}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Test Results Details */}
        {showTestResults && Object.keys(testResults).length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="test-results">
                {Object.entries(testResults).map(([service, result]) => (
                  <div key={service} className="test-result-item">
                    <div className="result-header">
                      <strong>{service.toUpperCase()}</strong>
                      <Badge variant={result.status === 'connected' ? 'default' : 'destructive'}>
                        {result.status}
                      </Badge>
                    </div>
                    
                    {result.status === 'connected' ? (
                      <div className="result-details">
                        <div className="detail-row">
                          <span>Model:</span> {result.model}
                        </div>
                        <div className="detail-row">
                          <span>Latency:</span> {result.latency}
                        </div>
                        <div className="detail-row">
                          <span>Quota:</span> {result.quota.used}/{result.quota.limit}
                        </div>
                        <div className="detail-row">
                          <span>Region:</span> {result.region}
                        </div>
                      </div>
                    ) : (
                      <div className="result-error">
                        {result.error}
                      </div>
                    )}
                    
                    <div className="result-timestamp">
                      Tested: {new Date(result.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="api-integration-container">
        <Card>
          <CardHeader>
            <CardTitle>API Credentials Configuration</CardTitle>
            <div className="header-stats">
              <Badge variant="outline">
                {Object.values(credentials).filter(Boolean).length}/3 Configured
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <APIIntegration
              onCredentialsUpdate={handleCredentialsUpdate}
              onConnectionTest={handleConnectionTest}
              initialCredentials={credentials}
              showValidation={showValidation}
              showTestResults={showTestResults}
              allowSave={allowSave}
              services={['gemini', 'perplexity', 'openai']}
              className="demo-api-integration"
            />
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        .api-integration-example {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .control-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .button-row {
          display: flex;
          gap: 8px;
        }

        .button-row button {
          flex: 1;
        }

        .header-stats {
          display: flex;
          gap: 8px;
        }

        .status-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          background: #f8fafc;
          border-radius: 4px;
        }

        .service-name {
          font-weight: 500;
          font-size: 12px;
        }

        .test-results {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .test-result-item {
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: #fafafa;
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .result-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }

        .detail-row span:first-child {
          color: #64748b;
        }

        .result-error {
          color: #dc2626;
          font-size: 12px;
          padding: 8px;
          background: #fef2f2;
          border-radius: 4px;
        }

        .result-timestamp {
          font-size: 10px;
          color: #9ca3af;
          margin-top: 8px;
          text-align: right;
        }

        @media (max-width: 1024px) {
          .api-integration-example {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default APIIntegrationExample;
```

---

## Export & Analysis Components

### Export Functionality Component

Comprehensive export system supporting multiple formats and customization options.

**File**: `/src/components/asr-got/ExportFunctionality.tsx`

#### Props

```typescript
interface ExportFunctionalityProps {
  graphData?: GraphData;
  stageResults?: StageResult[];
  researchContext?: ResearchContext;
  finalReport?: string;
  exportFormats?: ExportFormat[];
  onExportComplete?: (format: string, success: boolean) => void;
  onExportError?: (format: string, error: string) => void;
  showPreview?: boolean;
  allowCustomization?: boolean;
  className?: string;
}

type ExportFormat = 'html' | 'pdf' | 'json' | 'csv' | 'svg' | 'png' | 'docx' | 'xlsx';
```

#### Interactive Example

```typescript
import React, { useState } from 'react';
import { ExportFunctionality } from '@/components/asr-got/ExportFunctionality';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function ExportFunctionalityExample() {
  const [exportStatus, setExportStatus] = useState<Record<string, any>>({});
  const [showPreview, setShowPreview] = useState(true);
  const [allowCustomization, setAllowCustomization] = useState(true);
  const [exportProgress, setExportProgress] = useState<Record<string, number>>({});
  const [exportHistory, setExportHistory] = useState<any[]>([]);

  // Sample data for demonstration
  const sampleGraphData = {
    nodes: [
      { id: 'n0', label: 'Root Node', type: 'root', confidence: [0.9, 0.8, 0.7, 0.85] },
      { id: 'n1', label: 'Dimension 1', type: 'dimension', confidence: [0.8, 0.75, 0.8, 0.7] },
      { id: 'h1', label: 'Hypothesis 1', type: 'hypothesis', confidence: [0.7, 0.8, 0.6, 0.65] }
    ],
    edges: [
      { id: 'e1', source: 'n0', target: 'n1', type: 'supportive', confidence: 0.8 },
      { id: 'e2', source: 'n1', target: 'h1', type: 'supportive', confidence: 0.75 }
    ],
    metadata: {
      version: '1.0.0',
      stage: 3,
      total_nodes: 3,
      total_edges: 2
    }
  };

  const sampleStageResults = [
    { stage: 1, name: 'Initialization', completed: true, duration: 2500 },
    { stage: 2, name: 'Decomposition', completed: true, duration: 3200 },
    { stage: 3, name: 'Hypothesis Generation', completed: true, duration: 4100 }
  ];

  const sampleFinalReport = `
    <!DOCTYPE html>
    <html>
    <head><title>Research Report</title></head>
    <body>
      <h1>CRISPR Immunotherapy Analysis</h1>
      <p>This is a sample research report generated by the ASR-GoT framework...</p>
    </body>
    </html>
  `;

  const handleExportComplete = (format: string, success: boolean) => {
    setExportStatus(prev => ({ ...prev, [format]: success ? 'completed' : 'failed' }));
    setExportProgress(prev => ({ ...prev, [format]: 100 }));
    
    const exportRecord = {
      format,
      success,
      timestamp: new Date().toISOString(),
      fileSize: Math.floor(Math.random() * 1000) + 100 + 'KB'
    };
    
    setExportHistory(prev => [exportRecord, ...prev.slice(0, 9)]); // Keep last 10
    
    console.log(`Export ${format}:`, success ? 'SUCCESS' : 'FAILED');
  };

  const handleExportError = (format: string, error: string) => {
    setExportStatus(prev => ({ ...prev, [format]: 'error' }));
    console.error(`Export ${format} error:`, error);
  };

  const simulateExport = (format: string) => {
    setExportStatus(prev => ({ ...prev, [format]: 'exporting' }));
    setExportProgress(prev => ({ ...prev, [format]: 0 }));
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setExportProgress(prev => {
        const current = prev[format] || 0;
        if (current >= 100) {
          clearInterval(progressInterval);
          // Simulate success/failure (90% success rate)
          const success = Math.random() > 0.1;
          handleExportComplete(format, success);
          return prev;
        }
        return { ...prev, [format]: current + 10 };
      });
    }, 200);
  };

  const clearHistory = () => {
    setExportHistory([]);
    setExportStatus({});
    setExportProgress({});
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'exporting': return '#f59e0b';
      case 'failed': return '#ef4444';
      case 'error': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'exporting': return '⏳';
      case 'failed': return '❌';
      case 'error': return '🚨';
      default: return '⚪';
    }
  };

  const exportFormats = ['html', 'pdf', 'json', 'csv', 'svg', 'png', 'docx', 'xlsx'];

  return (
    <div className="export-functionality-example">
      <div className="export-controls">
        <Card>
          <CardHeader>
            <CardTitle>Export Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="control-row">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-preview"
                  checked={showPreview}
                  onCheckedChange={setShowPreview}
                />
                <Label htmlFor="show-preview">Show Preview</Label>
              </div>
            </div>

            <div className="control-row">
              <div className="flex items-center space-x-2">
                <Switch
                  id="allow-customization"
                  checked={allowCustomization}
                  onCheckedChange={setAllowCustomization}
                />
                <Label htmlFor="allow-customization">Allow Customization</Label>
              </div>
            </div>

            <Button onClick={clearHistory} variant="outline" size="sm">
              Clear History
            </Button>
          </CardContent>
        </Card>

        {/* Export Status */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Export Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="status-grid">
              {exportFormats.map(format => (
                <div key={format} className="status-item">
                  <div className="format-info">
                    <span className="format-name">{format.toUpperCase()}</span>
                    <span className="status-icon">
                      {getStatusIcon(exportStatus[format])}
                    </span>
                  </div>
                  
                  {exportStatus[format] === 'exporting' && (
                    <Progress 
                      value={exportProgress[format] || 0} 
                      className="progress-bar"
                    />
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => simulateExport(format)}
                    disabled={exportStatus[format] === 'exporting'}
                  >
                    {exportStatus[format] === 'exporting' ? 'Exporting...' : 'Test Export'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Export History */}
        {exportHistory.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Export History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="history-list">
                {exportHistory.map((record, index) => (
                  <div key={index} className="history-item">
                    <div className="history-info">
                      <Badge 
                        variant={record.success ? 'default' : 'destructive'}
                        className="format-badge"
                      >
                        {record.format.toUpperCase()}
                      </Badge>
                      <span className="file-size">{record.fileSize}</span>
                    </div>
                    <div className="history-time">
                      {new Date(record.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="export-container">
        <Card>
          <CardHeader>
            <CardTitle>Export Functionality Component</CardTitle>
            <div className="export-stats">
              <Badge variant="outline">
                {Object.keys(exportStatus).length} Formats Tested
              </Badge>
              <Badge variant="outline">
                {exportHistory.length} Exports Completed
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="component" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="component">Export Component</TabsTrigger>
                <TabsTrigger value="preview">Data Preview</TabsTrigger>
                <TabsTrigger value="results">Results</TabsTrigger>
              </TabsList>
              
              <TabsContent value="component" className="space-y-4">
                <ExportFunctionality
                  graphData={sampleGraphData}
                  stageResults={sampleStageResults}
                  finalReport={sampleFinalReport}
                  exportFormats={exportFormats as any}
                  onExportComplete={handleExportComplete}
                  onExportError={handleExportError}
                  showPreview={showPreview}
                  allowCustomization={allowCustomization}
                  className="demo-export-functionality"
                />
              </TabsContent>
              
              <TabsContent value="preview" className="space-y-4">
                <div className="data-preview">
                  <div className="preview-section">
                    <h4 className="text-sm font-semibold mb-2">Graph Data</h4>
                    <div className="preview-content">
                      <div className="data-stat">
                        <span>Nodes:</span> {sampleGraphData.nodes.length}
                      </div>
                      <div className="data-stat">
                        <span>Edges:</span> {sampleGraphData.edges.length}
                      </div>
                      <div className="data-stat">
                        <span>Stage:</span> {sampleGraphData.metadata.stage}
                      </div>
                    </div>
                  </div>
                  
                  <div className="preview-section">
                    <h4 className="text-sm font-semibold mb-2">Stage Results</h4>
                    <div className="preview-content">
                      {sampleStageResults.map(stage => (
                        <div key={stage.stage} className="stage-item">
                          <span>Stage {stage.stage}: {stage.name}</span>
                          <Badge variant="default">
                            {stage.duration}ms
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="preview-section">
                    <h4 className="text-sm font-semibold mb-2">Final Report</h4>
                    <div className="preview-content">
                      <div className="report-preview">
                        Report Length: {sampleFinalReport.length} characters
                        <br />
                        Contains HTML structure with research analysis
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="results" className="space-y-4">
                <div className="results-overview">
                  <div className="results-stats">
                    <div className="stat-card">
                      <div className="stat-value">
                        {exportHistory.filter(h => h.success).length}
                      </div>
                      <div className="stat-label">Successful</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">
                        {exportHistory.filter(h => !h.success).length}
                      </div>
                      <div className="stat-label">Failed</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">
                        {Object.values(exportStatus).filter(s => s === 'exporting').length}
                      </div>
                      <div className="stat-label">In Progress</div>
                    </div>
                  </div>
                  
                  {exportHistory.length === 0 && (
                    <Alert>
                      <AlertDescription>
                        No exports completed yet. Use the "Test Export" buttons to simulate exports.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        .export-functionality-example {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .control-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .export-stats {
          display: flex;
          gap: 8px;
        }

        .status-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .status-item {
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: #fafafa;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .format-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .format-name {
          font-weight: 500;
          font-size: 12px;
        }

        .status-icon {
          font-size: 14px;
        }

        .progress-bar {
          height: 4px;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .history-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          background: #f8fafc;
          border-radius: 4px;
        }

        .history-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .file-size {
          font-size: 11px;
          color: #64748b;
        }

        .history-time {
          font-size: 10px;
          color: #9ca3af;
        }

        .data-preview {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .preview-section {
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: #fafafa;
        }

        .preview-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .data-stat {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }

        .data-stat span:first-child {
          color: #64748b;
        }

        .stage-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
        }

        .report-preview {
          font-size: 12px;
          color: #475569;
        }

        .results-overview {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .results-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .stat-card {
          padding: 16px;
          background: #f1f5f9;
          border-radius: 8px;
          text-align: center;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
        }

        .stat-label {
          font-size: 12px;
          color: #64748b;
          margin-top: 4px;
        }

        @media (max-width: 1024px) {
          .export-functionality-example {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default ExportFunctionalityExample;
```

---

## Debug & Development Components

### Debug Panel Component

Comprehensive debugging interface for development and troubleshooting.

**File**: `/src/components/asr-got/DebugPanel.tsx`

#### Props

```typescript
interface DebugPanelProps {
  visible?: boolean;
  onToggle?: (visible: boolean) => void;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'floating';
  showPerformanceMetrics?: boolean;
  showMemoryUsage?: boolean;
  showAPILogs?: boolean;
  showStateInspector?: boolean;
  showNetworkMonitor?: boolean;
  showConsoleOutput?: boolean;
  allowExport?: boolean;
  className?: string;
}
```

#### Interactive Example

```javascript
// This example would be quite extensive, showing real debugging capabilities
// For brevity, I'll provide a condensed version focusing on the key aspects

import React, { useState, useEffect } from 'react';
import { DebugPanel } from '@/components/asr-got/DebugPanel';

function DebugPanelExample() {
  const [debugVisible, setDebugVisible] = useState(false);
  const [position, setPosition] = useState('floating');
  const [enabledFeatures, setEnabledFeatures] = useState({
    performance: true,
    memory: true,
    apiLogs: true,
    stateInspector: true,
    networkMonitor: false,
    consoleOutput: true
  });

  return (
    <div className="debug-panel-example">
      <div className="debug-controls">
        <button onClick={() => setDebugVisible(!debugVisible)}>
          {debugVisible ? 'Hide' : 'Show'} Debug Panel
        </button>
        
        {/* Feature toggles */}
        {Object.entries(enabledFeatures).map(([feature, enabled]) => (
          <label key={feature}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabledFeatures(prev => ({
                ...prev,
                [feature]: e.target.checked
              }))}
            />
            {feature}
          </label>
        ))}
      </div>

      <DebugPanel
        visible={debugVisible}
        onToggle={setDebugVisible}
        position={position}
        showPerformanceMetrics={enabledFeatures.performance}
        showMemoryUsage={enabledFeatures.memory}
        showAPILogs={enabledFeatures.apiLogs}
        showStateInspector={enabledFeatures.stateInspector}
        showNetworkMonitor={enabledFeatures.networkMonitor}
        showConsoleOutput={enabledFeatures.consoleOutput}
        allowExport={true}
        className="demo-debug-panel"
      />
    </div>
  );
}
```

---

## Component Testing

### Testing Utilities and Examples

```typescript
// Component testing utilities
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { ResearchInterface } from '@/components/asr-got/ResearchInterface';

// Test utility functions
export const ComponentTestUtils = {
  // Mock API services
  mockApiServices: () => {
    const mockCallGeminiAPI = jest.fn().mockResolvedValue('Mock response');
    const mockCallPerplexityAPI = jest.fn().mockResolvedValue('Mock evidence');
    
    jest.mock('@/services/apiService', () => ({
      callGeminiAPI: mockCallGeminiAPI,
      callPerplexitySonarAPI: mockCallPerplexityAPI
    }));
    
    return { mockCallGeminiAPI, mockCallPerplexityAPI };
  },

  // Create test data
  createTestGraphData: () => ({
    nodes: [
      {
        id: 'test-node',
        label: 'Test Node',
        type: 'root',
        confidence: [0.8, 0.7, 0.6, 0.8],
        metadata: {
          parameter_id: 'P1.1',
          type: 'test',
          source_description: 'Test node',
          value: 'Test value',
          timestamp: new Date().toISOString(),
          impact_score: 0.9
        }
      }
    ],
    edges: [],
    metadata: {
      version: '1.0.0',
      created: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      stage: 1,
      total_nodes: 1,
      total_edges: 0,
      graph_metrics: {}
    }
  }),

  // Render with providers
  renderWithProviders: (component, contextValue = {}) => {
    const defaultContext = {
      state: {
        graphData: ComponentTestUtils.createTestGraphData(),
        credentials: { gemini: 'test-key', perplexity: 'test-key' }
      },
      isExecuting: false,
      currentStage: 1,
      error: null,
      ...contextValue
    };

    return render(
      <ASRGoTContext.Provider value={defaultContext}>
        {component}
      </ASRGoTContext.Provider>
    );
  },

  // Wait for async operations
  waitForStageCompletion: async (stageName, timeout = 5000) => {
    await waitFor(
      () => {
        expect(screen.getByText(new RegExp(stageName, 'i'))).toBeInTheDocument();
      },
      { timeout }
    );
  }
};

// Example component test
describe('ResearchInterface Component', () => {
  beforeEach(() => {
    ComponentTestUtils.mockApiServices();
  });

  test('renders research interface correctly', () => {
    ComponentTestUtils.renderWithProviders(<ResearchInterface />);
    
    expect(screen.getByText(/research interface/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start research/i })).toBeInTheDocument();
  });

  test('executes stage 1 when button clicked', async () => {
    const onStageComplete = jest.fn();
    
    ComponentTestUtils.renderWithProviders(
      <ResearchInterface onStageComplete={onStageComplete} />
    );
    
    // Enter research question
    const input = screen.getByPlaceholderText(/enter research question/i);
    fireEvent.change(input, { target: { value: 'Test research question' } });
    
    // Click execute button
    const executeButton = screen.getByRole('button', { name: /execute stage 1/i });
    fireEvent.click(executeButton);
    
    // Wait for completion
    await ComponentTestUtils.waitForStageCompletion('Stage 1 Complete');
    
    expect(onStageComplete).toHaveBeenCalledWith(1, expect.any(Object));
  });

  test('handles API errors gracefully', async () => {
    const { mockCallGeminiAPI } = ComponentTestUtils.mockApiServices();
    mockCallGeminiAPI.mockRejectedValue(new Error('API Error'));
    
    const onError = jest.fn();
    ComponentTestUtils.renderWithProviders(
      <ResearchInterface onError={onError} />
    );
    
    const executeButton = screen.getByRole('button', { name: /execute stage 1/i });
    fireEvent.click(executeButton);
    
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('API Error'), 1);
    });
  });
});
```

---

This comprehensive component documentation provides developers with complete examples, interactive demonstrations, and testing utilities for all major components in the ASR-GoT framework. Each component includes detailed props documentation, usage patterns, and real-world examples that can be copied and modified for specific use cases.