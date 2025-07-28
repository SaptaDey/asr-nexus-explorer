/**
 * useTreeDataService.ts - React hook for tree data service integration
 * Provides real-time tree state management with Supabase
 */

import { useState, useEffect, useCallback } from 'react';
import { GraphData } from '@/types/asrGotTypes';
import { treeDataService, TreeState } from '@/services/TreeDataService';

export interface UseTreeDataServiceResult {
  treeState: TreeState | null;
  isLoading: boolean;
  error: string | null;
  saveTree: (
    userId: string,
    researchTopic: string,
    currentStage: number,
    graphData: GraphData
  ) => Promise<string>;
  loadTree: (treeId: string) => Promise<void>;
  updateNodeMetadata: (
    nodeId: string,
    metadata: {
      evidence_count?: number;
      confidence_delta?: number;
      impact_score?: number;
      disciplinary_tags?: string[];
      bias_flags?: string[];
      quality_issues?: string[];
      audit_passed?: boolean;
    }
  ) => Promise<void>;
  getUserTrees: (userId: string) => Promise<TreeState[]>;
  subscribeToUpdates: (treeId: string) => void;
  unsubscribeFromUpdates: () => void;
}

export const useTreeDataService = (): UseTreeDataServiceResult => {
  const [treeState, setTreeState] = useState<TreeState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveTree = useCallback(async (
    userId: string,
    researchTopic: string,
    currentStage: number,
    graphData: GraphData
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Calculate botanical metadata from graph data
      const botanicalMetadata = {
        evidence_deltas: {},
        confidence_vectors: {},
        disciplinary_mappings: {},
        impact_scores: {},
        bias_flags: {},
        quality_assessments: {}
      };

      // Process nodes to extract botanical metadata
      graphData.nodes.forEach(node => {
        if (node.confidence) {
          botanicalMetadata.confidence_vectors[node.id] = node.confidence;
        }
        if (node.metadata?.disciplinary_tags?.[0]) {
          botanicalMetadata.disciplinary_mappings[node.id] = node.metadata.disciplinary_tags[0];
        }
        if (node.metadata?.impact_score) {
          botanicalMetadata.impact_scores[node.id] = node.metadata.impact_score;
        }
        if (node.metadata?.confidence_delta) {
          botanicalMetadata.evidence_deltas[node.id] = node.metadata.confidence_delta;
        }
        if (node.metadata?.bias_flags) {
          botanicalMetadata.bias_flags[node.id] = node.metadata.bias_flags;
        }
      });

      const treeId = await treeDataService.saveTreeState(
        userId,
        researchTopic,
        currentStage,
        graphData,
        botanicalMetadata
      );

      // Reload tree state to get updated data
      const updatedState = await treeDataService.loadTreeState(treeId);
      setTreeState(updatedState);

      return treeId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadTree = useCallback(async (treeId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const state = await treeDataService.loadTreeState(treeId);
      setTreeState(state);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tree';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateNodeMetadata = useCallback(async (
    nodeId: string,
    metadata: {
      evidence_count?: number;
      confidence_delta?: number;
      impact_score?: number;
      disciplinary_tags?: string[];
      bias_flags?: string[];
      quality_issues?: string[];
      audit_passed?: boolean;
    }
  ): Promise<void> => {
    const currentTreeId = treeDataService.getCurrentTreeId();
    if (!currentTreeId) {
      throw new Error('No tree currently loaded');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await treeDataService.updateNodeBotanicalMetadata(currentTreeId, nodeId, metadata);
      
      // Reload tree state to get updated data
      const updatedState = await treeDataService.loadTreeState(currentTreeId);
      setTreeState(updatedState);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update node metadata';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getUserTrees = useCallback(async (userId: string): Promise<TreeState[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const trees = await treeDataService.getUserTrees(userId);
      return trees;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user trees';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const subscribeToUpdates = useCallback((treeId: string) => {
    treeDataService.subscribeToTreeUpdates(treeId, (payload) => {
      if (payload.type === 'evolution') {
        // Handle evolution log updates
        console.log('Tree evolution update:', payload.data);
      } else {
        // Handle tree state updates
        setTreeState(payload as TreeState);
      }
    });
  }, []);

  const unsubscribeFromUpdates = useCallback(() => {
    treeDataService.unsubscribeFromTreeUpdates();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeFromUpdates();
    };
  }, [unsubscribeFromUpdates]);

  return {
    treeState,
    isLoading,
    error,
    saveTree,
    loadTree,
    updateNodeMetadata,
    getUserTrees,
    subscribeToUpdates,
    unsubscribeFromUpdates
  };
};