/**
 * React Hook for Graph Data Management
 * Provides comprehensive graph data operations with caching and real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { GraphDataService, GraphSnapshot, GraphDiff, GraphAnalytics, GraphValidationResult } from '@/services/database/GraphDataService';
import { GraphData, GraphNode, GraphEdge } from '@/types/asrGotTypes';
import { databaseService } from '@/services/database';

interface UseGraphDataParams {
  sessionId: string;
  enableRealTimeUpdates?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number; // milliseconds
}

interface UseGraphDataReturn {
  // State
  graphData: GraphData | null;
  snapshots: GraphSnapshot[];
  analytics: GraphAnalytics | null;
  validation: GraphValidationResult | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;

  // Actions
  saveGraph: (versionName?: string) => Promise<boolean>;
  loadGraph: () => Promise<boolean>;
  createSnapshot: (name: string, description?: string) => Promise<boolean>;
  restoreFromSnapshot: (snapshotId: string) => Promise<boolean>;
  addNode: (node: GraphNode) => void;
  removeNode: (nodeId: string) => void;
  updateNode: (nodeId: string, updates: Partial<GraphNode>) => void;
  addEdge: (edge: GraphEdge) => void;
  removeEdge: (edgeId: string) => void;
  updateEdge: (edgeId: string, updates: Partial<GraphEdge>) => void;
  validateGraph: () => Promise<GraphValidationResult>;
  exportGraph: (format: 'json' | 'graphml' | 'gexf' | 'csv') => Promise<{ data: string; filename: string }>;
  calculateAnalytics: () => Promise<GraphAnalytics>;
  
  // Utilities
  getNode: (nodeId: string) => GraphNode | undefined;
  getEdge: (edgeId: string) => GraphEdge | undefined;
  getConnectedNodes: (nodeId: string) => GraphNode[];
  getNodeDegree: (nodeId: string) => number;
  findShortestPath: (sourceId: string, targetId: string) => string[] | null;
  clearError: () => void;
}

export function useGraphData({
  sessionId,
  enableRealTimeUpdates = true,
  autoSave = false,
  autoSaveInterval = 30000 // 30 seconds
}: UseGraphDataParams): UseGraphDataReturn {
  // State
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [snapshots, setSnapshots] = useState<GraphSnapshot[]>([]);
  const [analytics, setAnalytics] = useState<GraphAnalytics | null>(null);
  const [validation, setValidation] = useState<GraphValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Refs
  const graphService = useRef(new GraphDataService());
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSavedData = useRef<GraphData | null>(null);

  /**
   * Load graph data from database
   */
  const loadGraph = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const data = await graphService.current.getLatestGraph(sessionId);
      
      if (data) {
        setGraphData(data);
        lastSavedData.current = data;
        setHasUnsavedChanges(false);
        
        // Calculate analytics
        const analyticsData = await graphService.current.calculateGraphAnalytics(sessionId, data);
        setAnalytics(analyticsData);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load graph data');
      return false;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  /**
   * Save graph data to database
   */
  const saveGraph = useCallback(async (versionName?: string): Promise<boolean> => {
    if (!graphData) return false;

    try {
      setSaving(true);
      setError(null);

      const result = await graphService.current.saveGraphWithVersion(
        sessionId,
        graphData,
        versionName
      );

      if (result.success) {
        lastSavedData.current = graphData;
        setHasUnsavedChanges(false);
        setAnalytics(result.analytics);
        
        if (result.snapshot) {
          setSnapshots(prev => [result.snapshot!, ...prev]);
        }
        
        return true;
      }

      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save graph data');
      return false;
    } finally {
      setSaving(false);
    }
  }, [sessionId, graphData]);

  /**
   * Create a snapshot
   */
  const createSnapshot = useCallback(async (name: string, description?: string): Promise<boolean> => {
    if (!graphData) return false;

    try {
      setError(null);
      
      const snapshot = await graphService.current.createSnapshot(
        sessionId,
        graphData,
        name,
        description
      );

      setSnapshots(prev => [snapshot, ...prev]);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create snapshot');
      return false;
    }
  }, [sessionId, graphData]);

  /**
   * Restore from snapshot
   */
  const restoreFromSnapshot = useCallback(async (snapshotId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const restoredData = await graphService.current.restoreFromSnapshot(sessionId, snapshotId);
      
      setGraphData(restoredData);
      lastSavedData.current = restoredData;
      setHasUnsavedChanges(false);

      // Recalculate analytics
      const analyticsData = await graphService.current.calculateGraphAnalytics(sessionId, restoredData);
      setAnalytics(analyticsData);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore from snapshot');
      return false;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  /**
   * Add node to graph
   */
  const addNode = useCallback((node: GraphNode) => {
    setGraphData(prev => {
      if (!prev) return { nodes: [node], edges: [] };
      
      // Check if node already exists
      if (prev.nodes.some(n => n.id === node.id)) {
        console.warn(`Node with ID ${node.id} already exists`);
        return prev;
      }

      const newData = {
        ...prev,
        nodes: [...prev.nodes, node]
      };
      
      setHasUnsavedChanges(true);
      return newData;
    });
  }, []);

  /**
   * Remove node from graph
   */
  const removeNode = useCallback((nodeId: string) => {
    setGraphData(prev => {
      if (!prev) return null;

      const newData = {
        nodes: prev.nodes.filter(n => n.id !== nodeId),
        edges: prev.edges.filter(e => e.source !== nodeId && e.target !== nodeId)
      };
      
      setHasUnsavedChanges(true);
      return newData;
    });
  }, []);

  /**
   * Update node in graph
   */
  const updateNode = useCallback((nodeId: string, updates: Partial<GraphNode>) => {
    setGraphData(prev => {
      if (!prev) return null;

      const newData = {
        ...prev,
        nodes: prev.nodes.map(n => 
          n.id === nodeId ? { ...n, ...updates } : n
        )
      };
      
      setHasUnsavedChanges(true);
      return newData;
    });
  }, []);

  /**
   * Add edge to graph
   */
  const addEdge = useCallback((edge: GraphEdge) => {
    setGraphData(prev => {
      if (!prev) return { nodes: [], edges: [edge] };
      
      // Check if edge already exists
      if (prev.edges.some(e => e.id === edge.id)) {
        console.warn(`Edge with ID ${edge.id} already exists`);
        return prev;
      }

      // Validate that source and target nodes exist
      const sourceExists = prev.nodes.some(n => n.id === edge.source);
      const targetExists = prev.nodes.some(n => n.id === edge.target);
      
      if (!sourceExists || !targetExists) {
        console.warn(`Cannot add edge: source or target node does not exist`);
        return prev;
      }

      const newData = {
        ...prev,
        edges: [...prev.edges, edge]
      };
      
      setHasUnsavedChanges(true);
      return newData;
    });
  }, []);

  /**
   * Remove edge from graph
   */
  const removeEdge = useCallback((edgeId: string) => {
    setGraphData(prev => {
      if (!prev) return null;

      const newData = {
        ...prev,
        edges: prev.edges.filter(e => e.id !== edgeId)
      };
      
      setHasUnsavedChanges(true);
      return newData;
    });
  }, []);

  /**
   * Update edge in graph
   */
  const updateEdge = useCallback((edgeId: string, updates: Partial<GraphEdge>) => {
    setGraphData(prev => {
      if (!prev) return null;

      const newData = {
        ...prev,
        edges: prev.edges.map(e => 
          e.id === edgeId ? { ...e, ...updates } : e
        )
      };
      
      setHasUnsavedChanges(true);
      return newData;
    });
  }, []);

  /**
   * Validate current graph
   */
  const validateGraph = useCallback(async (): Promise<GraphValidationResult> => {
    if (!graphData) {
      return {
        isValid: false,
        errors: [{ type: 'invalid_type', message: 'No graph data available' }],
        warnings: [],
        suggestions: []
      };
    }

    try {
      const result = await graphService.current.validateGraphData(graphData);
      setValidation(result);
      return result;
    } catch (err) {
      const errorResult: GraphValidationResult = {
        isValid: false,
        errors: [{ type: 'invalid_type', message: 'Validation failed' }],
        warnings: [],
        suggestions: []
      };
      setValidation(errorResult);
      return errorResult;
    }
  }, [graphData]);

  /**
   * Export graph data
   */
  const exportGraph = useCallback(async (format: 'json' | 'graphml' | 'gexf' | 'csv') => {
    try {
      setError(null);
      const result = await graphService.current.exportGraphData(sessionId, format);
      return { data: result.data, filename: result.filename };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export graph');
      throw err;
    }
  }, [sessionId]);

  /**
   * Calculate analytics
   */
  const calculateAnalytics = useCallback(async (): Promise<GraphAnalytics> => {
    if (!graphData) {
      throw new Error('No graph data available');
    }

    try {
      const analyticsData = await graphService.current.calculateGraphAnalytics(sessionId, graphData);
      setAnalytics(analyticsData);
      return analyticsData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate analytics');
      throw err;
    }
  }, [sessionId, graphData]);

  /**
   * Get node by ID
   */
  const getNode = useCallback((nodeId: string): GraphNode | undefined => {
    return graphData?.nodes.find(n => n.id === nodeId);
  }, [graphData]);

  /**
   * Get edge by ID
   */
  const getEdge = useCallback((edgeId: string): GraphEdge | undefined => {
    return graphData?.edges.find(e => e.id === edgeId);
  }, [graphData]);

  /**
   * Get connected nodes
   */
  const getConnectedNodes = useCallback((nodeId: string): GraphNode[] => {
    if (!graphData) return [];

    const connectedNodeIds = new Set<string>();
    
    graphData.edges.forEach(edge => {
      if (edge.source === nodeId) {
        connectedNodeIds.add(edge.target);
      } else if (edge.target === nodeId) {
        connectedNodeIds.add(edge.source);
      }
    });

    return graphData.nodes.filter(n => connectedNodeIds.has(n.id));
  }, [graphData]);

  /**
   * Get node degree (number of connections)
   */
  const getNodeDegree = useCallback((nodeId: string): number => {
    if (!graphData) return 0;

    return graphData.edges.filter(edge => 
      edge.source === nodeId || edge.target === nodeId
    ).length;
  }, [graphData]);

  /**
   * Find shortest path between nodes (simplified BFS)
   */
  const findShortestPath = useCallback((sourceId: string, targetId: string): string[] | null => {
    if (!graphData || sourceId === targetId) return [sourceId];

    // Build adjacency list
    const adjacencyList = new Map<string, string[]>();
    graphData.nodes.forEach(node => adjacencyList.set(node.id, []));
    
    graphData.edges.forEach(edge => {
      adjacencyList.get(edge.source)?.push(edge.target);
      adjacencyList.get(edge.target)?.push(edge.source);
    });

    // BFS
    const queue: Array<{ nodeId: string; path: string[] }> = [{ nodeId: sourceId, path: [sourceId] }];
    const visited = new Set<string>([sourceId]);

    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!;

      if (nodeId === targetId) {
        return path;
      }

      const neighbors = adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push({ nodeId: neighbor, path: [...path, neighbor] });
        }
      }
    }

    return null; // No path found
  }, [graphData]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Load snapshots
   */
  const loadSnapshots = useCallback(async () => {
    try {
      const snapshotList = await graphService.current.getSnapshots(sessionId);
      setSnapshots(snapshotList);
    } catch (err) {
      console.error('Failed to load snapshots:', err);
    }
  }, [sessionId]);

  /**
   * Auto-save functionality
   */
  useEffect(() => {
    if (!autoSave || !hasUnsavedChanges || !graphData) return;

    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = setTimeout(() => {
      saveGraph().catch(console.error);
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [autoSave, hasUnsavedChanges, graphData, autoSaveInterval, saveGraph]);

  /**
   * Real-time updates
   */
  useEffect(() => {
    if (!enableRealTimeUpdates) return;

    const channel = databaseService.subscribeToGraphChanges(sessionId, (payload) => {
      // Reload graph data when changes are detected
      loadGraph().catch(console.error);
    });

    return () => {
      if (channel && typeof channel.unsubscribe === 'function') {
        channel.unsubscribe();
      }
    };
  }, [sessionId, enableRealTimeUpdates, loadGraph]);

  /**
   * Initial load
   */
  useEffect(() => {
    loadGraph();
    loadSnapshots();
  }, [loadGraph, loadSnapshots]);

  return {
    // State
    graphData,
    snapshots,
    analytics,
    validation,
    loading,
    saving,
    error,
    hasUnsavedChanges,

    // Actions
    saveGraph,
    loadGraph,
    createSnapshot,
    restoreFromSnapshot,
    addNode,
    removeNode,
    updateNode,
    addEdge,
    removeEdge,
    updateEdge,
    validateGraph,
    exportGraph,
    calculateAnalytics,

    // Utilities
    getNode,
    getEdge,
    getConnectedNodes,
    getNodeDegree,
    findShortestPath,
    clearError
  };
}