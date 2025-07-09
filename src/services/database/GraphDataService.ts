/**
 * Graph Data Service for ASR-GoT Framework
 * Specialized service for persisting and managing graph data with advanced features
 */

import { DatabaseService, DbGraphNode, DbGraphEdge } from './DatabaseService';
import { GraphData, GraphNode, GraphEdge } from '@/types/asrGotTypes';

export interface GraphSnapshot {
  id: string;
  session_id: string;
  snapshot_name: string;
  graph_data: GraphData;
  created_at: string;
  created_by: string;
  metadata: {
    node_count: number;
    edge_count: number;
    confidence_avg: number;
    stage_number?: number;
    description?: string;
  };
}

export interface GraphDiff {
  added_nodes: GraphNode[];
  removed_nodes: string[];
  modified_nodes: Array<{
    node_id: string;
    old_data: Partial<GraphNode>;
    new_data: Partial<GraphNode>;
  }>;
  added_edges: GraphEdge[];
  removed_edges: string[];
  modified_edges: Array<{
    edge_id: string;
    old_data: Partial<GraphEdge>;
    new_data: Partial<GraphEdge>;
  }>;
}

export interface GraphAnalytics {
  nodeTypeDistribution: Record<string, number>;
  edgeTypeDistribution: Record<string, number>;
  confidenceDistribution: {
    high: number; // > 0.7
    medium: number; // 0.3 - 0.7
    low: number; // < 0.3
  };
  connectivityMetrics: {
    totalNodes: number;
    totalEdges: number;
    averageDegree: number;
    density: number;
    isolatedNodes: number;
    stronglyConnectedComponents: number;
  };
  temporalMetrics: {
    creationRate: number; // nodes/edges per hour
    modificationRate: number;
    growthTrend: 'increasing' | 'decreasing' | 'stable';
  };
}

export interface GraphValidationResult {
  isValid: boolean;
  errors: Array<{
    type: 'missing_node' | 'orphaned_edge' | 'invalid_confidence' | 'duplicate_id' | 'invalid_type';
    message: string;
    node_id?: string;
    edge_id?: string;
  }>;
  warnings: Array<{
    type: 'low_confidence' | 'isolated_node' | 'high_complexity' | 'inconsistent_data';
    message: string;
    node_id?: string;
    edge_id?: string;
  }>;
  suggestions: string[];
}

export class GraphDataService {
  private db: DatabaseService;

  constructor() {
    this.db = new DatabaseService();
  }

  /**
   * Save complete graph data with versioning
   */
  async saveGraphWithVersion(
    sessionId: string, 
    graphData: GraphData, 
    versionName?: string
  ): Promise<{
    success: boolean;
    snapshot?: GraphSnapshot;
    diff?: GraphDiff;
    analytics: GraphAnalytics;
  }> {
    try {
      // Get previous graph data for diff calculation
      const previousGraphData = await this.getLatestGraph(sessionId);
      const diff = previousGraphData ? this.calculateGraphDiff(previousGraphData, graphData) : null;

      // Validate graph data
      const validation = await this.validateGraphData(graphData);
      if (!validation.isValid) {
        console.warn('Graph validation failed:', validation.errors);
      }

      // Save main graph data
      await this.db.saveGraphData(sessionId, graphData);

      // Create snapshot if version name provided
      let snapshot: GraphSnapshot | undefined;
      if (versionName) {
        snapshot = await this.createSnapshot(sessionId, graphData, versionName);
      }

      // Calculate analytics
      const analytics = await this.calculateGraphAnalytics(sessionId, graphData);

      // Log performance metrics
      await this.db.savePerformanceMetric({
        session_id: sessionId,
        operation_type: 'graph_save_with_version',
        execution_time_ms: 0, // Would be measured
        success_count: 1,
        error_count: validation.errors.length
      });

      return {
        success: true,
        snapshot,
        diff: diff || undefined,
        analytics
      };

    } catch (error) {
      console.error('Failed to save graph with version:', error);
      
      await this.db.logError({
        session_id: sessionId,
        error_type: 'graph_save_failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        severity: 'high',
        resolved: false,
        context: {
          node_count: graphData.nodes.length,
          edge_count: graphData.edges.length
        }
      });

      throw error;
    }
  }

  /**
   * Get latest graph data with caching
   */
  async getLatestGraph(sessionId: string): Promise<GraphData | null> {
    try {
      return await this.db.getGraphData(sessionId);
    } catch (error) {
      console.error('Failed to get latest graph:', error);
      return null;
    }
  }

  /**
   * Create a named snapshot of graph data
   */
  async createSnapshot(
    sessionId: string, 
    graphData: GraphData, 
    snapshotName: string,
    description?: string
  ): Promise<GraphSnapshot> {
    try {
      const user = await this.db.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const analytics = await this.calculateGraphAnalytics(sessionId, graphData);

      const { data, error } = await this.db.supabase
        .from('graph_snapshots')
        .insert({
          session_id: sessionId,
          snapshot_name: snapshotName,
          graph_data: graphData,
          created_by: user.id,
          metadata: {
            node_count: graphData.nodes.length,
            edge_count: graphData.edges.length,
            confidence_avg: analytics.connectivityMetrics.averageDegree,
            description
          }
        })
        .select()
        .single();

      if (error) throw error;

      return data as GraphSnapshot;

    } catch (error) {
      console.error('Failed to create snapshot:', error);
      throw error;
    }
  }

  /**
   * Get all snapshots for a session
   */
  async getSnapshots(sessionId: string): Promise<GraphSnapshot[]> {
    try {
      const { data, error } = await this.db.supabase
        .from('graph_snapshots')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data as GraphSnapshot[] || [];

    } catch (error) {
      console.error('Failed to get snapshots:', error);
      return [];
    }
  }

  /**
   * Restore graph from snapshot
   */
  async restoreFromSnapshot(sessionId: string, snapshotId: string): Promise<GraphData> {
    try {
      const { data, error } = await this.db.supabase
        .from('graph_snapshots')
        .select('graph_data')
        .eq('id', snapshotId)
        .eq('session_id', sessionId)
        .single();

      if (error) throw error;

      const graphData = data.graph_data as GraphData;
      
      // Save restored data as current graph
      await this.db.saveGraphData(sessionId, graphData);

      // Log restoration
      await this.db.supabase
        .from('activity_logs')
        .insert({
          session_id: sessionId,
          user_id: (await this.db.getCurrentUser())?.id,
          activity_type: 'graph_restored',
          activity_data: {
            snapshot_id: snapshotId,
            timestamp: new Date().toISOString()
          }
        });

      return graphData;

    } catch (error) {
      console.error('Failed to restore from snapshot:', error);
      throw error;
    }
  }

  /**
   * Calculate difference between two graph states
   */
  calculateGraphDiff(oldGraph: GraphData, newGraph: GraphData): GraphDiff {
    const diff: GraphDiff = {
      added_nodes: [],
      removed_nodes: [],
      modified_nodes: [],
      added_edges: [],
      removed_edges: [],
      modified_edges: []
    };

    // Create maps for efficient lookup
    const oldNodeMap = new Map(oldGraph.nodes.map(n => [n.id, n]));
    const newNodeMap = new Map(newGraph.nodes.map(n => [n.id, n]));
    const oldEdgeMap = new Map(oldGraph.edges.map(e => [e.id, e]));
    const newEdgeMap = new Map(newGraph.edges.map(e => [e.id, e]));

    // Find added and modified nodes
    for (const newNode of newGraph.nodes) {
      const oldNode = oldNodeMap.get(newNode.id);
      if (!oldNode) {
        diff.added_nodes.push(newNode);
      } else if (JSON.stringify(oldNode) !== JSON.stringify(newNode)) {
        diff.modified_nodes.push({
          node_id: newNode.id,
          old_data: oldNode,
          new_data: newNode
        });
      }
    }

    // Find removed nodes
    for (const oldNode of oldGraph.nodes) {
      if (!newNodeMap.has(oldNode.id)) {
        diff.removed_nodes.push(oldNode.id);
      }
    }

    // Find added and modified edges
    for (const newEdge of newGraph.edges) {
      const oldEdge = oldEdgeMap.get(newEdge.id);
      if (!oldEdge) {
        diff.added_edges.push(newEdge);
      } else if (JSON.stringify(oldEdge) !== JSON.stringify(newEdge)) {
        diff.modified_edges.push({
          edge_id: newEdge.id,
          old_data: oldEdge,
          new_data: newEdge
        });
      }
    }

    // Find removed edges
    for (const oldEdge of oldGraph.edges) {
      if (!newEdgeMap.has(oldEdge.id)) {
        diff.removed_edges.push(oldEdge.id);
      }
    }

    return diff;
  }

  /**
   * Validate graph data integrity
   */
  async validateGraphData(graphData: GraphData): Promise<GraphValidationResult> {
    const result: GraphValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Check for duplicate node IDs
    const nodeIds = new Set<string>();
    for (const node of graphData.nodes) {
      if (nodeIds.has(node.id)) {
        result.errors.push({
          type: 'duplicate_id',
          message: `Duplicate node ID: ${node.id}`,
          node_id: node.id
        });
      }
      nodeIds.add(node.id);
    }

    // Check for duplicate edge IDs
    const edgeIds = new Set<string>();
    for (const edge of graphData.edges) {
      if (edgeIds.has(edge.id)) {
        result.errors.push({
          type: 'duplicate_id',
          message: `Duplicate edge ID: ${edge.id}`,
          edge_id: edge.id
        });
      }
      edgeIds.add(edge.id);
    }

    // Validate edges reference existing nodes
    for (const edge of graphData.edges) {
      if (!nodeIds.has(edge.source)) {
        result.errors.push({
          type: 'missing_node',
          message: `Edge ${edge.id} references non-existent source node: ${edge.source}`,
          edge_id: edge.id
        });
      }
      if (!nodeIds.has(edge.target)) {
        result.errors.push({
          type: 'missing_node',
          message: `Edge ${edge.id} references non-existent target node: ${edge.target}`,
          edge_id: edge.id
        });
      }
    }

    // Validate confidence values
    for (const node of graphData.nodes) {
      if (node.confidence.some(c => c < 0 || c > 1)) {
        result.errors.push({
          type: 'invalid_confidence',
          message: `Node ${node.id} has invalid confidence values`,
          node_id: node.id
        });
      }
      
      // Warning for low confidence
      if (node.confidence.some(c => c < 0.3)) {
        result.warnings.push({
          type: 'low_confidence',
          message: `Node ${node.id} has low confidence values`,
          node_id: node.id
        });
      }
    }

    for (const edge of graphData.edges) {
      if (edge.confidence < 0 || edge.confidence > 1) {
        result.errors.push({
          type: 'invalid_confidence',
          message: `Edge ${edge.id} has invalid confidence value`,
          edge_id: edge.id
        });
      }
      
      // Warning for low confidence
      if (edge.confidence < 0.3) {
        result.warnings.push({
          type: 'low_confidence',
          message: `Edge ${edge.id} has low confidence value`,
          edge_id: edge.id
        });
      }
    }

    // Check for isolated nodes
    const connectedNodes = new Set<string>();
    for (const edge of graphData.edges) {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    }
    
    for (const node of graphData.nodes) {
      if (!connectedNodes.has(node.id)) {
        result.warnings.push({
          type: 'isolated_node',
          message: `Node ${node.id} is isolated (no connections)`,
          node_id: node.id
        });
      }
    }

    // Check graph complexity
    if (graphData.nodes.length > 1000) {
      result.warnings.push({
        type: 'high_complexity',
        message: 'Graph has high complexity (>1000 nodes), consider optimization'
      });
    }

    // Generate suggestions
    if (result.warnings.some(w => w.type === 'isolated_node')) {
      result.suggestions.push('Consider removing isolated nodes or adding connections');
    }
    
    if (result.warnings.some(w => w.type === 'low_confidence')) {
      result.suggestions.push('Review and improve low confidence nodes/edges');
    }
    
    if (result.warnings.some(w => w.type === 'high_complexity')) {
      result.suggestions.push('Consider using hierarchical graph structures or filtering');
    }

    result.isValid = result.errors.length === 0;

    return result;
  }

  /**
   * Calculate comprehensive graph analytics
   */
  async calculateGraphAnalytics(sessionId: string, graphData: GraphData): Promise<GraphAnalytics> {
    // Node type distribution
    const nodeTypeDistribution = graphData.nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Edge type distribution
    const edgeTypeDistribution = graphData.edges.reduce((acc, edge) => {
      acc[edge.type] = (acc[edge.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Confidence distribution
    const allConfidences = [
      ...graphData.nodes.flatMap(n => n.confidence),
      ...graphData.edges.map(e => e.confidence)
    ];
    
    const confidenceDistribution = {
      high: allConfidences.filter(c => c > 0.7).length,
      medium: allConfidences.filter(c => c >= 0.3 && c <= 0.7).length,
      low: allConfidences.filter(c => c < 0.3).length
    };

    // Connectivity metrics
    const degreeMap = new Map<string, number>();
    graphData.nodes.forEach(node => degreeMap.set(node.id, 0));
    
    graphData.edges.forEach(edge => {
      degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1);
      degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1);
    });

    const degrees = Array.from(degreeMap.values());
    const averageDegree = degrees.reduce((sum, d) => sum + d, 0) / degrees.length || 0;
    const maxPossibleEdges = graphData.nodes.length * (graphData.nodes.length - 1) / 2;
    const density = maxPossibleEdges > 0 ? graphData.edges.length / maxPossibleEdges : 0;
    const isolatedNodes = degrees.filter(d => d === 0).length;

    // Simplified strongly connected components (would need more sophisticated algorithm)
    const stronglyConnectedComponents = this.estimateConnectedComponents(graphData);

    // Temporal metrics (would require historical data)
    const temporalMetrics = await this.calculateTemporalMetrics(sessionId);

    return {
      nodeTypeDistribution,
      edgeTypeDistribution,
      confidenceDistribution,
      connectivityMetrics: {
        totalNodes: graphData.nodes.length,
        totalEdges: graphData.edges.length,
        averageDegree,
        density,
        isolatedNodes,
        stronglyConnectedComponents
      },
      temporalMetrics
    };
  }

  /**
   * Get graph evolution timeline
   */
  async getGraphTimeline(sessionId: string): Promise<Array<{
    timestamp: string;
    event_type: 'node_added' | 'node_removed' | 'edge_added' | 'edge_removed' | 'snapshot_created';
    details: any;
  }>> {
    try {
      const { data, error } = await this.db.supabase
        .from('activity_logs')
        .select('*')
        .eq('session_id', sessionId)
        .in('activity_type', ['graph_node_added', 'graph_node_removed', 'graph_edge_added', 'graph_edge_removed', 'snapshot_created'])
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(log => ({
        timestamp: log.created_at,
        event_type: log.activity_type.replace('graph_', '') as any,
        details: log.activity_data
      }));

    } catch (error) {
      console.error('Failed to get graph timeline:', error);
      return [];
    }
  }

  /**
   * Export graph data in various formats
   */
  async exportGraphData(
    sessionId: string, 
    format: 'json' | 'graphml' | 'gexf' | 'csv'
  ): Promise<{
    data: string;
    filename: string;
    mimeType: string;
  }> {
    try {
      const graphData = await this.getLatestGraph(sessionId);
      if (!graphData) throw new Error('No graph data found');

      let exportData: string;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case 'json':
          exportData = JSON.stringify(graphData, null, 2);
          filename = `graph_${sessionId}_${Date.now()}.json`;
          mimeType = 'application/json';
          break;
          
        case 'graphml':
          exportData = this.convertToGraphML(graphData);
          filename = `graph_${sessionId}_${Date.now()}.graphml`;
          mimeType = 'application/xml';
          break;
          
        case 'gexf':
          exportData = this.convertToGEXF(graphData);
          filename = `graph_${sessionId}_${Date.now()}.gexf`;
          mimeType = 'application/xml';
          break;
          
        case 'csv':
          exportData = this.convertToCSV(graphData);
          filename = `graph_${sessionId}_${Date.now()}.csv`;
          mimeType = 'text/csv';
          break;
          
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // Record export
      await this.db.supabase
        .from('export_history')
        .insert({
          session_id: sessionId,
          user_id: (await this.db.getCurrentUser())?.id,
          export_type: 'graph_data',
          export_format: format,
          file_size_bytes: new Blob([exportData]).size
        });

      return {
        data: exportData,
        filename,
        mimeType
      };

    } catch (error) {
      console.error('Failed to export graph data:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private estimateConnectedComponents(graphData: GraphData): number {
    // Simplified connected components estimation
    const visited = new Set<string>();
    let components = 0;

    const adjacencyList = new Map<string, Set<string>>();
    graphData.nodes.forEach(node => adjacencyList.set(node.id, new Set()));
    
    graphData.edges.forEach(edge => {
      adjacencyList.get(edge.source)?.add(edge.target);
      adjacencyList.get(edge.target)?.add(edge.source);
    });

    const dfs = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      adjacencyList.get(nodeId)?.forEach(neighbor => dfs(neighbor));
    };

    graphData.nodes.forEach(node => {
      if (!visited.has(node.id)) {
        dfs(node.id);
        components++;
      }
    });

    return components;
  }

  private async calculateTemporalMetrics(sessionId: string): Promise<GraphAnalytics['temporalMetrics']> {
    try {
      const timeline = await this.getGraphTimeline(sessionId);
      
      if (timeline.length === 0) {
        return {
          creationRate: 0,
          modificationRate: 0,
          growthTrend: 'stable'
        };
      }

      const now = Date.now();
      const firstEvent = new Date(timeline[0].timestamp).getTime();
      const hoursSpan = (now - firstEvent) / (1000 * 60 * 60);

      const creationEvents = timeline.filter(e => e.event_type.includes('added')).length;
      const modificationEvents = timeline.length - creationEvents;

      const creationRate = hoursSpan > 0 ? creationEvents / hoursSpan : 0;
      const modificationRate = hoursSpan > 0 ? modificationEvents / hoursSpan : 0;

      // Simple trend analysis based on recent vs older events
      const midpoint = Math.floor(timeline.length / 2);
      const recentCreations = timeline.slice(midpoint).filter(e => e.event_type.includes('added')).length;
      const olderCreations = timeline.slice(0, midpoint).filter(e => e.event_type.includes('added')).length;

      let growthTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (recentCreations > olderCreations * 1.2) {
        growthTrend = 'increasing';
      } else if (recentCreations < olderCreations * 0.8) {
        growthTrend = 'decreasing';
      }

      return {
        creationRate,
        modificationRate,
        growthTrend
      };

    } catch (error) {
      console.error('Failed to calculate temporal metrics:', error);
      return {
        creationRate: 0,
        modificationRate: 0,
        growthTrend: 'stable'
      };
    }
  }

  private convertToGraphML(graphData: GraphData): string {
    let graphml = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
  <key id="label" for="node" attr.name="label" attr.type="string"/>
  <key id="type" for="node" attr.name="type" attr.type="string"/>
  <key id="confidence" for="node" attr.name="confidence" attr.type="string"/>
  <key id="edge_type" for="edge" attr.name="type" attr.type="string"/>
  <key id="edge_confidence" for="edge" attr.name="confidence" attr.type="double"/>
  <graph id="G" edgedefault="undirected">
`;

    // Add nodes
    graphData.nodes.forEach(node => {
      graphml += `    <node id="${node.id}">
      <data key="label">${node.label}</data>
      <data key="type">${node.type}</data>
      <data key="confidence">${JSON.stringify(node.confidence)}</data>
    </node>
`;
    });

    // Add edges
    graphData.edges.forEach(edge => {
      graphml += `    <edge source="${edge.source}" target="${edge.target}">
      <data key="edge_type">${edge.type}</data>
      <data key="edge_confidence">${edge.confidence}</data>
    </edge>
`;
    });

    graphml += `  </graph>
</graphml>`;

    return graphml;
  }

  private convertToGEXF(graphData: GraphData): string {
    let gexf = `<?xml version="1.0" encoding="UTF-8"?>
<gexf xmlns="http://www.gexf.net/1.2draft" version="1.2">
  <graph mode="static" defaultedgetype="undirected">
    <attributes class="node">
      <attribute id="0" title="type" type="string"/>
      <attribute id="1" title="confidence" type="string"/>
    </attributes>
    <attributes class="edge">
      <attribute id="0" title="type" type="string"/>
      <attribute id="1" title="confidence" type="double"/>
    </attributes>
    <nodes>
`;

    // Add nodes
    graphData.nodes.forEach(node => {
      gexf += `      <node id="${node.id}" label="${node.label}">
        <attvalues>
          <attvalue for="0" value="${node.type}"/>
          <attvalue for="1" value="${JSON.stringify(node.confidence)}"/>
        </attvalues>
      </node>
`;
    });

    gexf += `    </nodes>
    <edges>
`;

    // Add edges
    graphData.edges.forEach(edge => {
      gexf += `      <edge id="${edge.id}" source="${edge.source}" target="${edge.target}">
        <attvalues>
          <attvalue for="0" value="${edge.type}"/>
          <attvalue for="1" value="${edge.confidence}"/>
        </attvalues>
      </edge>
`;
    });

    gexf += `    </edges>
  </graph>
</gexf>`;

    return gexf;
  }

  private convertToCSV(graphData: GraphData): string {
    let csv = 'Type,ID,Label,Source,Target,Confidence,Node_Type,Edge_Type\n';

    // Add nodes
    graphData.nodes.forEach(node => {
      csv += `node,${node.id},"${node.label}",,,"${JSON.stringify(node.confidence)}",${node.type},\n`;
    });

    // Add edges
    graphData.edges.forEach(edge => {
      csv += `edge,${edge.id},,${edge.source},${edge.target},${edge.confidence},,${edge.type}\n`;
    });

    return csv;
  }
}

// Export singleton instance
export const graphDataService = new GraphDataService();