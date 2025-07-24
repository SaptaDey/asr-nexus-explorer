/**
 * Graph Data Service
 * Handles storage and retrieval of graph data with type safety and validation
 */

import { GraphData, GraphNode, GraphEdge, HyperEdge } from '@/types/asrGotTypes';
import { convertGraphDataToSupabase, convertGraphDataFromSupabase } from '@/integrations/supabase/typeMapping';
import { supabase } from '@/integrations/supabase/client';
import { isValidGraphData, GraphDataValidationError } from '@/types/graphVisualizationTypes';

export interface GraphDataStorageResult {
  success: boolean;
  data?: GraphData;
  error?: string;
}

export interface GraphMetadata {
  sessionId: string;
  version: string;
  stage: number;
  nodeCount: number;
  edgeCount: number;
  hyperedgeCount: number;
  lastUpdated: string;
  checksum?: string;
}

export class GraphDataService {
  /**
   * Store graph data in Supabase with type validation
   */
  static async storeGraphData(
    sessionId: string,
    graphData: GraphData
  ): Promise<GraphDataStorageResult> {
    try {
      // Validate graph data structure
      if (!isValidGraphData(graphData)) {
        throw new GraphDataValidationError('Invalid graph data structure');
      }

      // Convert to Supabase format
      const supabaseGraphData = convertGraphDataToSupabase(sessionId, graphData);

      // Upsert graph data (insert or update)
      const { data, error } = await supabase
        .from('graph_data')
        .upsert(supabaseGraphData, {
          onConflict: 'session_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to store graph data:', error);
        return {
          success: false,
          error: `Database error: ${error.message}`
        };
      }

      // Convert back to application format for verification
      const storedGraphData = convertGraphDataFromSupabase(data);

      return {
        success: true,
        data: storedGraphData
      };
    } catch (error) {
      console.error('Graph data storage error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown storage error'
      };
    }
  }

  /**
   * Retrieve graph data from Supabase with type conversion
   */
  static async getGraphData(sessionId: string): Promise<GraphDataStorageResult> {
    try {
      const { data, error } = await supabase
        .from('graph_data')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found - return empty graph structure
          return {
            success: true,
            data: {
              nodes: [],
              edges: [],
              hyperedges: [],
              metadata: {
                version: '1.0',
                created: new Date().toISOString(),
                last_updated: new Date().toISOString(),
                stage: 1
              }
            }
          };
        }

        console.error('Failed to retrieve graph data:', error);
        return {
          success: false,
          error: `Database error: ${error.message}`
        };
      }

      // Convert from Supabase format to application format
      const graphData = convertGraphDataFromSupabase(data);

      // Validate converted data
      if (!isValidGraphData(graphData)) {
        throw new GraphDataValidationError('Retrieved graph data failed validation');
      }

      return {
        success: true,
        data: graphData
      };
    } catch (error) {
      console.error('Graph data retrieval error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown retrieval error'
      };
    }
  }

  /**
   * Update specific nodes in the graph
   */
  static async updateNodes(
    sessionId: string,
    updatedNodes: GraphNode[]
  ): Promise<GraphDataStorageResult> {
    try {
      // First get current graph data
      const currentResult = await this.getGraphData(sessionId);
      if (!currentResult.success || !currentResult.data) {
        return currentResult;
      }

      const currentGraph = currentResult.data;

      // Update nodes by replacing matching IDs
      const nodeMap = new Map(updatedNodes.map(node => [node.id, node]));
      const updatedGraph: GraphData = {
        ...currentGraph,
        nodes: currentGraph.nodes.map(node => 
          nodeMap.has(node.id) ? nodeMap.get(node.id)! : node
        ),
        metadata: {
          ...currentGraph.metadata,
          last_updated: new Date().toISOString()
        }
      };

      // Store updated graph
      return await this.storeGraphData(sessionId, updatedGraph);
    } catch (error) {
      console.error('Node update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown update error'
      };
    }
  }

  /**
   * Update specific edges in the graph
   */
  static async updateEdges(
    sessionId: string,
    updatedEdges: GraphEdge[]
  ): Promise<GraphDataStorageResult> {
    try {
      // First get current graph data
      const currentResult = await this.getGraphData(sessionId);
      if (!currentResult.success || !currentResult.data) {
        return currentResult;
      }

      const currentGraph = currentResult.data;

      // Update edges by replacing matching IDs
      const edgeMap = new Map(updatedEdges.map(edge => [edge.id, edge]));
      const updatedGraph: GraphData = {
        ...currentGraph,
        edges: currentGraph.edges.map(edge => 
          edgeMap.has(edge.id) ? edgeMap.get(edge.id)! : edge
        ),
        metadata: {
          ...currentGraph.metadata,
          last_updated: new Date().toISOString()
        }
      };

      // Store updated graph
      return await this.storeGraphData(sessionId, updatedGraph);
    } catch (error) {
      console.error('Edge update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown update error'
      };
    }
  }

  /**
   * Add new nodes to the graph
   */
  static async addNodes(
    sessionId: string,
    newNodes: GraphNode[]
  ): Promise<GraphDataStorageResult> {
    try {
      // First get current graph data
      const currentResult = await this.getGraphData(sessionId);
      if (!currentResult.success || !currentResult.data) {
        return currentResult;
      }

      const currentGraph = currentResult.data;

      // Check for duplicate node IDs
      const existingIds = new Set(currentGraph.nodes.map(node => node.id));
      const duplicates = newNodes.filter(node => existingIds.has(node.id));
      
      if (duplicates.length > 0) {
        return {
          success: false,
          error: `Duplicate node IDs detected: ${duplicates.map(n => n.id).join(', ')}`
        };
      }

      // Add new nodes
      const updatedGraph: GraphData = {
        ...currentGraph,
        nodes: [...currentGraph.nodes, ...newNodes],
        metadata: {
          ...currentGraph.metadata,
          last_updated: new Date().toISOString()
        }
      };

      // Store updated graph
      return await this.storeGraphData(sessionId, updatedGraph);
    } catch (error) {
      console.error('Add nodes error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown add error'
      };
    }
  }

  /**
   * Add new edges to the graph
   */
  static async addEdges(
    sessionId: string,
    newEdges: GraphEdge[]
  ): Promise<GraphDataStorageResult> {
    try {
      // First get current graph data
      const currentResult = await this.getGraphData(sessionId);
      if (!currentResult.success || !currentResult.data) {
        return currentResult;
      }

      const currentGraph = currentResult.data;

      // Validate that source and target nodes exist
      const nodeIds = new Set(currentGraph.nodes.map(node => node.id));
      const invalidEdges = newEdges.filter(edge => 
        !nodeIds.has(edge.source) || !nodeIds.has(edge.target)
      );

      if (invalidEdges.length > 0) {
        return {
          success: false,
          error: `Invalid edges - missing nodes: ${invalidEdges.map(e => `${e.source}->${e.target}`).join(', ')}`
        };
      }

      // Check for duplicate edge IDs
      const existingIds = new Set(currentGraph.edges.map(edge => edge.id));
      const duplicates = newEdges.filter(edge => existingIds.has(edge.id));
      
      if (duplicates.length > 0) {
        return {
          success: false,
          error: `Duplicate edge IDs detected: ${duplicates.map(e => e.id).join(', ')}`
        };
      }

      // Add new edges
      const updatedGraph: GraphData = {
        ...currentGraph,
        edges: [...currentGraph.edges, ...newEdges],
        metadata: {
          ...currentGraph.metadata,
          last_updated: new Date().toISOString()
        }
      };

      // Store updated graph
      return await this.storeGraphData(sessionId, updatedGraph);
    } catch (error) {
      console.error('Add edges error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown add error'
      };
    }
  }

  /**
   * Get graph metadata without full graph data
   */
  static async getGraphMetadata(sessionId: string): Promise<{
    success: boolean;
    metadata?: GraphMetadata;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('graph_data')
        .select('metadata, created_at, updated_at')
        .eq('session_id', sessionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: true,
            metadata: {
              sessionId,
              version: '1.0',
              stage: 1,
              nodeCount: 0,
              edgeCount: 0,
              hyperedgeCount: 0,
              lastUpdated: new Date().toISOString()
            }
          };
        }

        return {
          success: false,
          error: `Database error: ${error.message}`
        };
      }

      const metadata = data.metadata as any || {};
      
      return {
        success: true,
        metadata: {
          sessionId,
          version: metadata.version || '1.0',
          stage: metadata.stage || 1,
          nodeCount: metadata.node_count || 0,
          edgeCount: metadata.edge_count || 0,
          hyperedgeCount: metadata.hyperedge_count || 0,
          lastUpdated: data.updated_at,
          checksum: metadata.checksum
        }
      };
    } catch (error) {
      console.error('Graph metadata retrieval error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown metadata error'
      };
    }
  }

  /**
   * Delete graph data for a session
   */
  static async deleteGraphData(sessionId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('graph_data')
        .delete()
        .eq('session_id', sessionId);

      if (error) {
        return {
          success: false,
          error: `Database error: ${error.message}`
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Graph data deletion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deletion error'
      };
    }
  }
}