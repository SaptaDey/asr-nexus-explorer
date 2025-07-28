/**
 * Graph Visualization Adapters
 * Type conversion utilities for different graph visualization libraries
 */

import { GraphData, GraphNode, GraphEdge, HyperEdge } from '@/types/asrGotTypes';
import {
  CytoscapeNodeData,
  CytoscapeEdgeData,
  CytoscapeElement,
  ReactFlowNode,
  ReactFlowEdge,
  ReactFlowNodeData,
  ReactFlowEdgeData,
  D3NodeData,
  D3EdgeData,
  PlotlyNodeData,
  PlotlyEdgeData,
  GraphVisualizationAdapter,
  GraphDataValidationError,
  GraphTypeConversionError,
  isValidGraphData
} from '@/types/graphVisualizationTypes';

/**
 * Cytoscape.js Adapter
 */
export class CytoscapeAdapter implements GraphVisualizationAdapter<CytoscapeElement, CytoscapeElement> {
  validateData(data: GraphData): boolean {
    return isValidGraphData(data);
  }

  normalizeData(data: GraphData): GraphData {
    return {
      ...data,
      nodes: data.nodes.map(node => ({
        ...node,
        confidence: Array.isArray(node.confidence) ? node.confidence : [node.confidence || 0.5]
      })),
      edges: data.edges.map(edge => ({
        ...edge,
        confidence: typeof edge.confidence === 'number' ? edge.confidence : 0.5
      }))
    };
  }

  convertNodes(nodes: GraphNode[]): CytoscapeElement[] {
    return nodes.map(node => {
      try {
        const avgConfidence = Array.isArray(node.confidence) 
          ? node.confidence.reduce((a, b) => a + b, 0) / node.confidence.length
          : (node.confidence || 0.5);

        const cytoscapeData: CytoscapeNodeData = {
          id: node.id,
          label: node.label,
          type: node.type,
          confidence: node.confidence,
          metadata: node.metadata || {},
          position: node.position,
          classes: `node-${node.type} confidence-${Math.floor(avgConfidence * 10)}`
        };

        return {
          data: cytoscapeData,
          position: node.position || { x: Math.random() * 500, y: Math.random() * 300 },
          group: 'nodes' as const,
          classes: cytoscapeData.classes,
          selectable: true,
          grabbable: true
        };
      } catch (error) {
        throw new GraphTypeConversionError(`Failed to convert node ${node.id} to Cytoscape format`, { node, error });
      }
    });
  }

  convertEdges(edges: GraphEdge[]): CytoscapeElement[] {
    return edges.map(edge => {
      try {
        const cytoscapeData: CytoscapeEdgeData = {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type,
          confidence: edge.confidence || 0.5,
          metadata: edge.metadata || {},
          weight: edge.metadata?.weight || edge.confidence || 0.5,
          bidirectional: edge.bidirectional || false,
          classes: `edge-${edge.type} confidence-${Math.floor((edge.confidence || 0.5) * 10)}`
        };

        return {
          data: cytoscapeData,
          group: 'edges' as const,
          classes: cytoscapeData.classes,
          selectable: true
        };
      } catch (error) {
        throw new GraphTypeConversionError(`Failed to convert edge ${edge.id} to Cytoscape format`, { edge, error });
      }
    });
  }

  convertHyperEdges(hyperedges: HyperEdge[]): CytoscapeElement[] {
    // Convert hyperedges to multiple regular edges with special styling
    const elements: CytoscapeElement[] = [];
    
    hyperedges.forEach(hyperedge => {
      const centerNodeId = `hyperedge-center-${hyperedge.id}`;
      
      // Create center node for hyperedge
      elements.push({
        data: {
          id: centerNodeId,
          label: hyperedge.label || 'HyperEdge',
          type: 'hyperedge-center',
          confidence: hyperedge.confidence || 0.5,
          metadata: hyperedge.metadata || {},
          classes: 'hyperedge-center'
        },
        group: 'nodes' as const,
        classes: 'hyperedge-center',
        selectable: true,
        grabbable: true
      });

      // Create edges from center to each connected node
      hyperedge.nodes.forEach((nodeId: string, index: number) => {
        elements.push({
          data: {
            id: `${hyperedge.id}-${index}`,
            source: centerNodeId,
            target: nodeId,
            type: 'hyperedge',
            confidence: hyperedge.confidence || 0.5,
            metadata: hyperedge.metadata || {},
            classes: 'hyperedge-connection'
          },
          group: 'edges' as const,
          classes: 'hyperedge-connection',
          selectable: true
        });
      });
    });

    return elements;
  }
}

/**
 * ReactFlow Adapter
 */
export class ReactFlowAdapter implements GraphVisualizationAdapter<ReactFlowNode, ReactFlowEdge> {
  validateData(data: GraphData): boolean {
    return isValidGraphData(data);
  }

  normalizeData(data: GraphData): GraphData {
    return {
      ...data,
      nodes: data.nodes.map(node => ({
        ...node,
        confidence: Array.isArray(node.confidence) ? node.confidence : [node.confidence || 0.5]
      })),
      edges: data.edges.map(edge => ({
        ...edge,
        confidence: typeof edge.confidence === 'number' ? edge.confidence : 0.5
      }))
    };
  }

  convertNodes(nodes: GraphNode[]): ReactFlowNode[] {
    return nodes.map(node => {
      try {
        const nodeData: ReactFlowNodeData = {
          label: node.label,
          type: node.type,
          confidence: node.confidence,
          metadata: node.metadata || {},
          isConnectable: true,
          toolbarVisible: false
        };

        return {
          id: node.id,
          type: 'scientific',
          data: nodeData,
          position: node.position || { x: Math.random() * 500, y: Math.random() * 300 },
          draggable: true,
          selectable: true,
          connectable: true,
          deletable: false,
          style: this.getNodeStyle(node),
          className: `react-flow-node node-${node.type}`
        };
      } catch (error) {
        throw new GraphTypeConversionError(`Failed to convert node ${node.id} to ReactFlow format`, { node, error });
      }
    });
  }

  convertEdges(edges: GraphEdge[]): ReactFlowEdge[] {
    return edges.map(edge => {
      try {
        const edgeData: ReactFlowEdgeData = {
          type: edge.type,
          confidence: edge.confidence || 0.5,
          metadata: edge.metadata || {},
          animated: edge.type === 'temporal' || edge.bidirectional
        };

        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: 'smoothstep',
          data: edgeData,
          animated: edgeData.animated,
          style: this.getEdgeStyle(edge),
          className: `react-flow-edge edge-${edge.type}`,
          markerEnd: {
            type: 'arrowclosed',
            width: 20,
            height: 20
          }
        };
      } catch (error) {
        throw new GraphTypeConversionError(`Failed to convert edge ${edge.id} to ReactFlow format`, { edge, error });
      }
    });
  }

  private getNodeStyle(node: GraphNode): React.CSSProperties {
    const avgConfidence = Array.isArray(node.confidence) 
      ? node.confidence.reduce((a, b) => a + b, 0) / node.confidence.length
      : (node.confidence || 0.5);

    return {
      backgroundColor: this.getNodeColor(node.type),
      border: `2px solid ${this.getNodeBorderColor(node.type)}`,
      borderRadius: '8px',
      opacity: 0.3 + (avgConfidence * 0.7),
      minWidth: '150px',
      fontSize: '12px'
    };
  }

  private getEdgeStyle(edge: GraphEdge): React.CSSProperties {
    return {
      stroke: this.getEdgeColor(edge.type),
      strokeWidth: Math.max(1, (edge.confidence || 0.5) * 4),
      opacity: 0.8
    };
  }

  private getNodeColor(type: string): string {
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
  }

  private getNodeBorderColor(type: string): string {
    return this.getNodeColor(type);
  }

  private getEdgeColor(type: string): string {
    const colors: { [key: string]: string } = {
      'supportive': '#10B981',
      'contradictory': '#EF4444',
      'correlative': '#F59E0B',
      'causal': '#8B5CF6',
      'temporal': '#EC4899',
      'prerequisite': '#3B82F6'
    };
    return colors[type] || '#6B7280';
  }
}

/**
 * D3.js Adapter
 */
export class D3Adapter implements GraphVisualizationAdapter<D3NodeData, D3EdgeData> {
  validateData(data: GraphData): boolean {
    return isValidGraphData(data);
  }

  normalizeData(data: GraphData): GraphData {
    return {
      ...data,
      nodes: data.nodes.map(node => ({
        ...node,
        confidence: Array.isArray(node.confidence) ? node.confidence : [node.confidence || 0.5]
      })),
      edges: data.edges.map(edge => ({
        ...edge,
        confidence: typeof edge.confidence === 'number' ? edge.confidence : 0.5
      }))
    };
  }

  convertNodes(nodes: GraphNode[]): D3NodeData[] {
    return nodes.map(node => {
      try {
        return {
          id: node.id,
          label: node.label,
          type: node.type,
          confidence: node.confidence,
          metadata: node.metadata || {},
          x: node.position?.x,
          y: node.position?.y,
          fx: null,
          fy: null
        };
      } catch (error) {
        throw new GraphTypeConversionError(`Failed to convert node ${node.id} to D3 format`, { node, error });
      }
    });
  }

  convertEdges(edges: GraphEdge[]): D3EdgeData[] {
    return edges.map(edge => {
      try {
        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type,
          confidence: edge.confidence || 0.5,
          metadata: edge.metadata || {},
          weight: edge.metadata?.weight || edge.confidence || 0.5
        };
      } catch (error) {
        throw new GraphTypeConversionError(`Failed to convert edge ${edge.id} to D3 format`, { edge, error });
      }
    });
  }
}

/**
 * Plotly.js Adapter
 */
export class PlotlyAdapter implements GraphVisualizationAdapter<PlotlyNodeData, PlotlyEdgeData> {
  validateData(data: GraphData): boolean {
    return isValidGraphData(data);
  }

  normalizeData(data: GraphData): GraphData {
    return {
      ...data,
      nodes: data.nodes.map(node => ({
        ...node,
        confidence: Array.isArray(node.confidence) ? node.confidence : [node.confidence || 0.5]
      })),
      edges: data.edges.map(edge => ({
        ...edge,
        confidence: typeof edge.confidence === 'number' ? edge.confidence : 0.5
      }))
    };
  }

  convertNodes(nodes: GraphNode[]): PlotlyNodeData[] {
    const x = nodes.map(node => node.position?.x || Math.random() * 500);
    const y = nodes.map(node => node.position?.y || Math.random() * 300);
    const text = nodes.map(node => node.label);
    const sizes = nodes.map(node => {
      const avgConfidence = Array.isArray(node.confidence) 
        ? node.confidence.reduce((a, b) => a + b, 0) / node.confidence.length
        : (node.confidence || 0.5);
      return 10 + (avgConfidence * 30);
    });
    const colors = nodes.map(node => this.getNodeColor(node.type));

    return [{
      x,
      y,
      mode: 'markers+text',
      type: 'scatter',
      text,
      textposition: 'middle center',
      marker: {
        size: sizes,
        color: colors,
        line: {
          width: 2,
          color: '#ffffff'
        }
      },
      hovertemplate: '%{text}<br>Confidence: %{marker.size}<extra></extra>',
      name: 'Nodes'
    }];
  }

  convertEdges(edges: GraphEdge[]): PlotlyEdgeData[] {
    // For Plotly, we need to create line traces for each edge
    return edges.map(edge => {
      // This is a simplified version - in practice, you'd need node positions
      return {
        x: [0, 100], // Placeholder coordinates
        y: [0, 100], // Placeholder coordinates
        mode: 'lines',
        type: 'scatter',
        line: {
          width: Math.max(1, (edge.confidence || 0.5) * 4),
          color: this.getEdgeColor(edge.type)
        },
        hoverinfo: 'none',
        showlegend: false
      };
    });
  }

  private getNodeColor(type: string): string {
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
  }

  private getEdgeColor(type: string): string {
    const colors: { [key: string]: string } = {
      'supportive': '#10B981',
      'contradictory': '#EF4444',
      'correlative': '#F59E0B',
      'causal': '#8B5CF6',
      'temporal': '#EC4899',
      'prerequisite': '#3B82F6'
    };
    return colors[type] || '#6B7280';
  }
}

/**
 * Universal Graph Adapter Factory
 */
export class GraphAdapterFactory {
  private static adapters = {
    cytoscape: new CytoscapeAdapter(),
    reactflow: new ReactFlowAdapter(),
    d3: new D3Adapter(),
    plotly: new PlotlyAdapter()
  };

  static getAdapter(type: 'cytoscape' | 'reactflow' | 'd3' | 'plotly') {
    const adapter = this.adapters[type];
    if (!adapter) {
      throw new Error(`Unsupported adapter type: ${type}`);
    }
    return adapter;
  }

  static convertForVisualization(
    data: GraphData,
    visualizationType: 'cytoscape' | 'reactflow' | 'd3' | 'plotly'
  ) {
    try {
      const adapter = this.getAdapter(visualizationType);
      
      if (!adapter.validateData(data)) {
        throw new GraphDataValidationError('Invalid graph data provided');
      }

      const normalizedData = adapter.normalizeData(data);
      const nodes = adapter.convertNodes(normalizedData.nodes);
      const edges = adapter.convertEdges(normalizedData.edges);
      
      let hyperedges = [];
      if (normalizedData.hyperedges && 'convertHyperEdges' in adapter) {
        hyperedges = (adapter as any).convertHyperEdges(normalizedData.hyperedges);
      }

      return {
        nodes,
        edges,
        hyperedges,
        metadata: normalizedData.metadata
      };
    } catch (error) {
      if (error instanceof GraphDataValidationError || error instanceof GraphTypeConversionError) {
        throw error;
      }
      throw new GraphTypeConversionError(`Failed to convert data for ${visualizationType}`, { error });
    }
  }
}

// Export singleton instances for convenience
export const cytoscapeAdapter = new CytoscapeAdapter();
export const reactFlowAdapter = new ReactFlowAdapter();
export const d3Adapter = new D3Adapter();
export const plotlyAdapter = new PlotlyAdapter();