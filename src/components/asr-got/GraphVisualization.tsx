import React, { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { GraphData } from '@/hooks/useASRGoT';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GraphVisualizationProps {
  data: GraphData;
  currentStage: number;
}

const nodeTypes = {
  root: { color: '#3b82f6', label: 'Root' },
  dimension: { color: '#10b981', label: 'Dimension' },
  hypothesis: { color: '#f59e0b', label: 'Hypothesis' },
  evidence: { color: '#ef4444', label: 'Evidence' },
  bridge: { color: '#8b5cf6', label: 'Bridge' },
  gap: { color: '#6b7280', label: 'Gap' },
};

const edgeTypes = {
  correlative: { color: '#64748b', label: '⇢' },
  supportive: { color: '#22c55e', label: '↑' },
  contradictory: { color: '#ef4444', label: '⊥' },
  causal: { color: '#3b82f6', label: '→' },
  temporal: { color: '#f59e0b', label: '≺' },
  prerequisite: { color: '#8b5cf6', label: '⊢' },
};

export const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  data,
  currentStage
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    data.nodes.map(node => ({
      id: node.id,
      type: 'default',
      position: node.position || { x: Math.random() * 500, y: Math.random() * 500 },
      data: {
        label: (
          <div className="px-3 py-2 text-center">
            <div className="font-semibold text-sm">{node.label}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {node.type}
            </div>
            {node.confidence && (
              <div className="flex gap-1 mt-1 justify-center">
                {node.confidence.map((conf, idx) => (
                  <div
                    key={idx}
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: conf > 0.7 ? '#22c55e' : conf > 0.4 ? '#f59e0b' : '#ef4444'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )
      },
      style: {
        background: nodeTypes[node.type]?.color || '#64748b',
        color: 'white',
        border: '2px solid #ffffff',
        borderRadius: '8px',
        minWidth: '120px',
      },
    }))
  );

  const [edges, setEdges, onEdgesChange] = useEdgesState(
    data.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      style: {
        stroke: edgeTypes[edge.type]?.color || '#64748b',
        strokeWidth: Math.max(1, edge.confidence * 3),
      },
      label: edgeTypes[edge.type]?.label || '',
      labelStyle: {
        fontSize: '12px',
        fontWeight: 'bold',
      },
    }))
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const selectedNode = nodes.find(node => node.selected);
  const correspondingDataNode = selectedNode ? 
    data.nodes.find(n => n.id === selectedNode.id) : null;

  return (
    <div className="h-[600px] w-full bg-background border rounded-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background />
        
        <Panel position="top-left">
          <Card className="w-80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Graph Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-xs font-medium mb-2">Node Types</div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(nodeTypes).map(([type, config]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="text-xs">{config.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="text-xs font-medium mb-2">Edge Types</div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(edgeTypes).map(([type, config]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div
                        className="w-3 h-0.5"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="text-xs">{config.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </Panel>

        {correspondingDataNode && (
          <Panel position="top-right">
            <Card className="w-80">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Node Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Badge variant="outline">{correspondingDataNode.type}</Badge>
                  <h3 className="font-medium mt-2">{correspondingDataNode.label}</h3>
                </div>
                
                {correspondingDataNode.confidence && (
                  <div>
                    <div className="text-xs font-medium mb-1">Confidence Vector</div>
                    <div className="flex gap-1">
                      {correspondingDataNode.confidence.map((conf, idx) => (
                        <div key={idx} className="text-center">
                          <div className="text-xs text-muted-foreground">
                            {['Emp', 'Theo', 'Meth', 'Cons'][idx]}
                          </div>
                          <div className="text-sm font-mono">
                            {conf.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {correspondingDataNode.metadata && (
                  <div>
                    <div className="text-xs font-medium mb-1">Metadata</div>
                    <div className="text-xs space-y-1">
                      {correspondingDataNode.metadata.parameter_id && (
                        <div>ID: {correspondingDataNode.metadata.parameter_id}</div>
                      )}
                      {correspondingDataNode.metadata.disciplinary_tags && (
                        <div>
                          Tags: {correspondingDataNode.metadata.disciplinary_tags.join(', ')}
                        </div>
                      )}
                      {correspondingDataNode.metadata.impact_score && (
                        <div>Impact: {correspondingDataNode.metadata.impact_score}</div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};