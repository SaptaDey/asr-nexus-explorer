/**
 * TreeDataService.ts - Supabase integration for botanical tree data
 * Handles real-time tree state persistence and synchronization
 */

import { supabase } from '@/integrations/supabase/client';
import { GraphData, GraphNode, GraphEdge } from '@/types/asrGotTypes';

export interface TreeState {
  id: string;
  user_id: string;
  research_topic: string;
  current_stage: number;
  graph_data: GraphData;
  botanical_metadata: {
    evidence_deltas: Record<string, number>;
    confidence_vectors: Record<string, number[]>;
    disciplinary_mappings: Record<string, string>;
    impact_scores: Record<string, number>;
    bias_flags: Record<string, string[]>;
    quality_assessments: Record<string, any>;
  };
  created_at: string;
  updated_at: string;
}

export interface TreeEvolutionLog {
  id: string;
  tree_id: string;
  stage: number;
  timestamp: string;
  action: 'node_added' | 'node_updated' | 'edge_added' | 'confidence_updated' | 'evidence_added';
  data: any;
  metadata: {
    confidence_delta?: number;
    evidence_count?: number;
    impact_change?: number;
  };
}

export class TreeDataService {
  private static instance: TreeDataService;
  private currentTreeId: string | null = null;
  private realtimeSubscription: any = null;

  static getInstance(): TreeDataService {
    if (!TreeDataService.instance) {
      TreeDataService.instance = new TreeDataService();
    }
    return TreeDataService.instance;
  }

  // Save tree state to Supabase
  async saveTreeState(
    userId: string,
    researchTopic: string,
    currentStage: number,
    graphData: GraphData,
    botanicalMetadata: TreeState['botanical_metadata']
  ): Promise<string> {
    const treeState: Partial<TreeState> = {
      user_id: userId,
      research_topic: researchTopic,
      current_stage: currentStage,
      graph_data: graphData,
      botanical_metadata: botanicalMetadata,
      updated_at: new Date().toISOString()
    };

    if (this.currentTreeId) {
      // Update existing tree
      const { data, error } = await supabase
        .from('tree_states')
        .update(treeState)
        .eq('id', this.currentTreeId)
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } else {
      // Create new tree
      const { data, error } = await supabase
        .from('tree_states')
        .insert([{ ...treeState, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;
      this.currentTreeId = data.id;
      return data.id;
    }
  }

  // Load tree state from Supabase
  async loadTreeState(treeId: string): Promise<TreeState | null> {
    const { data, error } = await supabase
      .from('tree_states')
      .select('*')
      .eq('id', treeId)
      .single();

    if (error) {
      console.error('Error loading tree state:', error);
      return null;
    }

    this.currentTreeId = treeId;
    return data as TreeState;
  }

  // Get user's trees
  async getUserTrees(userId: string): Promise<TreeState[]> {
    const { data, error } = await supabase
      .from('tree_states')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching user trees:', error);
      return [];
    }

    return data as TreeState[];
  }

  // Log tree evolution event
  async logTreeEvolution(
    treeId: string,
    stage: number,
    action: TreeEvolutionLog['action'],
    data: any,
    metadata: TreeEvolutionLog['metadata'] = {}
  ): Promise<void> {
    const logEntry: Partial<TreeEvolutionLog> = {
      tree_id: treeId,
      stage,
      timestamp: new Date().toISOString(),
      action,
      data,
      metadata
    };

    const { error } = await supabase
      .from('tree_evolution_logs')
      .insert([logEntry]);

    if (error) {
      console.error('Error logging tree evolution:', error);
    }
  }

  // Get evolution history
  async getTreeEvolutionHistory(treeId: string): Promise<TreeEvolutionLog[]> {
    const { data, error } = await supabase
      .from('tree_evolution_logs')
      .select('*')
      .eq('tree_id', treeId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching evolution history:', error);
      return [];
    }

    return data as TreeEvolutionLog[];
  }

  // Real-time subscription for tree updates
  subscribeToTreeUpdates(
    treeId: string,
    onUpdate: (payload: any) => void
  ): void {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
    }

    this.realtimeSubscription = supabase
      .channel(`tree_${treeId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tree_states',
          filter: `id=eq.${treeId}`
        },
        (payload) => {
          onUpdate(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tree_evolution_logs',
          filter: `tree_id=eq.${treeId}`
        },
        (payload) => {
          onUpdate({ type: 'evolution', data: payload.new });
        }
      )
      .subscribe();
  }

  // Unsubscribe from real-time updates
  unsubscribeFromTreeUpdates(): void {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
      this.realtimeSubscription = null;
    }
  }

  // Calculate confidence vector from evidence
  calculateConfidenceVector(evidenceNodes: GraphNode[]): number[] {
    const vector = [0, 0, 0, 0]; // [empirical, theoretical, methodological, consensus]
    
    if (evidenceNodes.length === 0) return vector;

    evidenceNodes.forEach(node => {
      const evidence = node.metadata;
      
      // Empirical support (based on data quality and sample size)
      if (evidence?.evidence_quality === 'high' && evidence?.statistical_power > 0.8) {
        vector[0] += 0.3;
      }
      
      // Theoretical basis (based on peer review and theoretical grounding)
      if (evidence?.peer_review_status === 'peer-reviewed' && evidence?.theoretical_basis) {
        vector[1] += 0.25;
      }
      
      // Methodological rigor (based on study design and methodology)
      if (evidence?.methodological_quality === 'high') {
        vector[2] += 0.2;
      }
      
      // Consensus alignment (based on citation count and field acceptance)
      if (evidence?.publication_rank > 0.7) {
        vector[3] += 0.15;
      }
    });

    // Normalize to 0-1 range
    return vector.map(v => Math.min(1, v));
  }

  // Calculate evidence delta for branch circumference
  calculateEvidenceDelta(
    previousConfidence: number[],
    newConfidence: number[]
  ): number {
    const prevSum = previousConfidence.reduce((a, b) => a + b, 0);
    const newSum = newConfidence.reduce((a, b) => a + b, 0);
    return Math.max(0, (newSum - prevSum) / 4); // Normalize by vector length
  }

  // Update node with botanical metadata
  async updateNodeBotanicalMetadata(
    treeId: string,
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
  ): Promise<void> {
    const treeState = await this.loadTreeState(treeId);
    if (!treeState) return;

    // Update node metadata
    const nodeIndex = treeState.graph_data.nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex !== -1) {
      treeState.graph_data.nodes[nodeIndex].metadata = {
        ...treeState.graph_data.nodes[nodeIndex].metadata,
        ...metadata
      };

      // Update botanical metadata
      if (metadata.evidence_count) {
        treeState.botanical_metadata.evidence_deltas[nodeId] = metadata.confidence_delta || 0;
      }
      if (metadata.impact_score) {
        treeState.botanical_metadata.impact_scores[nodeId] = metadata.impact_score;
      }
      if (metadata.disciplinary_tags) {
        treeState.botanical_metadata.disciplinary_mappings[nodeId] = metadata.disciplinary_tags[0];
      }
      if (metadata.bias_flags) {
        treeState.botanical_metadata.bias_flags[nodeId] = metadata.bias_flags;
      }

      // Save updated state
      await this.saveTreeState(
        treeState.user_id,
        treeState.research_topic,
        treeState.current_stage,
        treeState.graph_data,
        treeState.botanical_metadata
      );

      // Log the update
      await this.logTreeEvolution(
        treeId,
        treeState.current_stage,
        'node_updated',
        { nodeId, metadata },
        {
          confidence_delta: metadata.confidence_delta,
          evidence_count: metadata.evidence_count,
          impact_change: metadata.impact_score
        }
      );
    }
  }

  // Get current tree ID
  getCurrentTreeId(): string | null {
    return this.currentTreeId;
  }

  // Set current tree ID
  setCurrentTreeId(treeId: string | null): void {
    this.currentTreeId = treeId;
  }
}

// Export singleton instance
export const treeDataService = TreeDataService.getInstance();