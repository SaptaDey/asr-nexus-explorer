/**
 * Comprehensive Database Service for ASR-GoT Framework
 * Handles all database operations with Supabase integration
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GraphData, GraphNode, GraphEdge, StageExecution } from '@/types/asrGotTypes';
import { Hypothesis } from '@/services/reasoning/HypothesisCompetitionFramework';

// Database types matching our schema
export interface DbProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  research_interests?: string[];
  expertise_areas?: string[];
  institution?: string;
  created_at: string;
  updated_at: string;
}

export interface DbResearchSession {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  research_question?: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  current_stage: number;
  graph_data?: any;
  stage_results?: any;
  metadata?: any;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface DbGraphNode {
  id: string;
  session_id: string;
  node_id: string;
  label: string;
  node_type: string;
  confidence: number[];
  position?: any;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface DbGraphEdge {
  id: string;
  session_id: string;
  edge_id: string;
  source_node_id: string;
  target_node_id: string;
  edge_type: string;
  confidence: number;
  bidirectional: boolean;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface DbStageExecution {
  id: string;
  session_id: string;
  stage_number: number;
  stage_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  input_data?: any;
  output_data?: any;
  execution_time_ms?: number;
  error_message?: string;
  confidence_score?: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface DbHypothesis {
  id: string;
  session_id: string;
  hypothesis_text: string;
  hypothesis_type: string;
  confidence: number;
  supporting_evidence?: any;
  contradicting_evidence?: any;
  falsifiability_score?: number;
  competition_results?: any;
  status: 'active' | 'validated' | 'refuted' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface DbKnowledgeGap {
  id: string;
  session_id: string;
  gap_type: string;
  description: string;
  priority: number;
  fillability: number;
  related_nodes?: string[];
  research_recommendations?: any;
  status: 'identified' | 'researching' | 'filled' | 'unfillable';
  created_at: string;
  updated_at: string;
}

export interface DbPerformanceMetric {
  id: string;
  session_id: string;
  operation_type: string;
  execution_time_ms: number;
  memory_usage_mb?: number;
  cpu_usage_percent?: number;
  throughput?: number;
  error_count: number;
  success_count: number;
  created_at: string;
}

export interface DbErrorLog {
  id: string;
  session_id?: string;
  user_id?: string;
  error_type: string;
  error_code?: string;
  error_message: string;
  stack_trace?: string;
  context?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  resolved_at?: string;
  created_at: string;
}

export class DatabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Authentication Methods
   */
  async getCurrentUser() {
    const { data: { user }, error } = await this.supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  }

  async signUp(email: string, password: string, userData?: any) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Profile Management
   */
  async getProfile(userId: string): Promise<DbProfile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateProfile(userId: string, updates: Partial<DbProfile>): Promise<DbProfile> {
    const { data, error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Research Session Management
   */
  async createResearchSession(sessionData: Omit<DbResearchSession, 'id' | 'created_at' | 'updated_at'>): Promise<DbResearchSession> {
    const { data, error } = await this.supabase
      .from('research_sessions')
      .insert(sessionData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getResearchSessions(userId: string): Promise<DbResearchSession[]> {
    const { data, error } = await this.supabase
      .from('research_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getResearchSession(sessionId: string): Promise<DbResearchSession | null> {
    const { data, error } = await this.supabase
      .from('research_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateResearchSession(sessionId: string, updates: Partial<DbResearchSession>): Promise<DbResearchSession> {
    const { data, error } = await this.supabase
      .from('research_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteResearchSession(sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('research_sessions')
      .delete()
      .eq('id', sessionId);
    
    if (error) throw error;
  }

  /**
   * Graph Data Management
   */
  async saveGraphData(sessionId: string, graphData: GraphData): Promise<void> {
    // Update the main session with graph data
    await this.updateResearchSession(sessionId, { graph_data: graphData });
    
    // Save individual nodes
    if (graphData.nodes.length > 0) {
      await this.saveGraphNodes(sessionId, graphData.nodes);
    }
    
    // Save individual edges
    if (graphData.edges.length > 0) {
      await this.saveGraphEdges(sessionId, graphData.edges);
    }
  }


  async saveGraphNodes(sessionId: string, nodes: GraphNode[]): Promise<void> {
    const dbNodes = nodes.map(node => ({
      session_id: sessionId,
      node_id: node.id,
      label: node.label,
      node_type: node.type,
      confidence: node.confidence,
      position: node.position,
      metadata: {
        ...node,
        // Remove redundant fields to avoid duplication
        id: undefined,
        label: undefined,
        type: undefined,
        confidence: undefined,
        position: undefined
      }
    }));

    // Use upsert to handle existing nodes
    const { error } = await this.supabase
      .from('graph_nodes')
      .upsert(dbNodes, { 
        onConflict: 'session_id,node_id',
        ignoreDuplicates: false 
      });
    
    if (error) throw error;
  }

  async saveGraphEdges(sessionId: string, edges: GraphEdge[]): Promise<void> {
    const dbEdges = edges.map(edge => ({
      session_id: sessionId,
      edge_id: edge.id,
      source_node_id: edge.source,
      target_node_id: edge.target,
      edge_type: edge.type,
      confidence: edge.confidence,
      bidirectional: edge.bidirectional || false,
      metadata: {
        ...edge,
        // Remove redundant fields
        id: undefined,
        source: undefined,
        target: undefined,
        type: undefined,
        confidence: undefined,
        bidirectional: undefined
      }
    }));

    const { error } = await this.supabase
      .from('graph_edges')
      .upsert(dbEdges, { 
        onConflict: 'session_id,edge_id',
        ignoreDuplicates: false 
      });
    
    if (error) throw error;
  }

  async getGraphData(sessionId: string): Promise<GraphData | null> {
    // Get session with graph data
    const session = await this.getResearchSession(sessionId);
    if (!session?.graph_data) return null;
    
    // Optionally get detailed nodes and edges
    const [nodes, edges] = await Promise.all([
      this.getGraphNodes(sessionId),
      this.getGraphEdges(sessionId)
    ]);
    
    return {
      ...session.graph_data,
      nodes: nodes.length > 0 ? this.convertDbNodesToGraphNodes(nodes) : session.graph_data.nodes,
      edges: edges.length > 0 ? this.convertDbEdgesToGraphEdges(edges) : session.graph_data.edges
    };
  }

  async getGraphNodes(sessionId: string): Promise<DbGraphNode[]> {
    const { data, error } = await this.supabase
      .from('graph_nodes')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at');
    
    if (error) throw error;
    return data || [];
  }

  async getGraphEdges(sessionId: string): Promise<DbGraphEdge[]> {
    const { data, error } = await this.supabase
      .from('graph_edges')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at');
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Stage Execution Management
   */
  async saveStageExecution(stageData: Omit<DbStageExecution, 'id' | 'created_at'>): Promise<DbStageExecution> {
    const { data, error } = await this.supabase
      .from('stage_executions')
      .insert(stageData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateStageExecution(executionId: string, updates: Partial<DbStageExecution>): Promise<DbStageExecution> {
    const { data, error } = await this.supabase
      .from('stage_executions')
      .update(updates)
      .eq('id', executionId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getStageExecutions(sessionId: string): Promise<DbStageExecution[]> {
    const { data, error } = await this.supabase
      .from('stage_executions')
      .select('*')
      .eq('session_id', sessionId)
      .order('stage_number', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Hypothesis Management
   */
  async saveHypothesis(hypothesisData: Omit<DbHypothesis, 'id' | 'created_at' | 'updated_at'>): Promise<DbHypothesis> {
    const { data, error } = await this.supabase
      .from('hypotheses')
      .insert(hypothesisData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateHypothesis(hypothesisId: string, updates: Partial<DbHypothesis>): Promise<DbHypothesis> {
    const { data, error } = await this.supabase
      .from('hypotheses')
      .update(updates)
      .eq('id', hypothesisId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getHypotheses(sessionId: string): Promise<DbHypothesis[]> {
    const { data, error } = await this.supabase
      .from('hypotheses')
      .select('*')
      .eq('session_id', sessionId)
      .order('confidence', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Knowledge Gap Management
   */
  async saveKnowledgeGap(gapData: Omit<DbKnowledgeGap, 'id' | 'created_at' | 'updated_at'>): Promise<DbKnowledgeGap> {
    const { data, error } = await this.supabase
      .from('knowledge_gaps')
      .insert(gapData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getKnowledgeGaps(sessionId: string): Promise<DbKnowledgeGap[]> {
    const { data, error } = await this.supabase
      .from('knowledge_gaps')
      .select('*')
      .eq('session_id', sessionId)
      .order('priority', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Performance Metrics
   */
  async savePerformanceMetric(metricData: Omit<DbPerformanceMetric, 'id' | 'created_at'>): Promise<DbPerformanceMetric> {
    const { data, error } = await this.supabase
      .from('performance_metrics')
      .insert(metricData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getPerformanceMetrics(sessionId: string, operationType?: string): Promise<DbPerformanceMetric[]> {
    let query = this.supabase
      .from('performance_metrics')
      .select('*')
      .eq('session_id', sessionId);

    if (operationType) {
      query = query.eq('operation_type', operationType);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Error Logging
   */
  async logError(errorData: Omit<DbErrorLog, 'id' | 'created_at'>): Promise<DbErrorLog> {
    const { data, error } = await this.supabase
      .from('error_logs')
      .insert(errorData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getErrorLogs(sessionId?: string, severity?: string): Promise<DbErrorLog[]> {
    let query = this.supabase
      .from('error_logs')
      .select('*');

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data, error } = await query
      .eq('resolved', false)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Real-time Subscriptions
   */
  subscribeToSession(sessionId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel(`session_${sessionId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'research_sessions',
          filter: `id=eq.${sessionId}`
        }, 
        callback
      )
      .subscribe();
  }

  subscribeToGraphChanges(sessionId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel(`graph_${sessionId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'graph_nodes',
          filter: `session_id=eq.${sessionId}`
        }, 
        callback
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'graph_edges',
          filter: `session_id=eq.${sessionId}`
        }, 
        callback
      )
      .subscribe();
  }

  /**
   * Utility Methods
   */
  private convertDbNodesToGraphNodes(dbNodes: DbGraphNode[]): GraphNode[] {
    return dbNodes.map(dbNode => ({
      id: dbNode.node_id,
      label: dbNode.label,
      type: dbNode.node_type,
      confidence: dbNode.confidence,
      position: dbNode.position,
      ...dbNode.metadata
    }));
  }

  private convertDbEdgesToGraphEdges(dbEdges: DbGraphEdge[]): GraphEdge[] {
    return dbEdges.map(dbEdge => ({
      id: dbEdge.edge_id,
      source: dbEdge.source_node_id,
      target: dbEdge.target_node_id,
      type: dbEdge.edge_type,
      confidence: dbEdge.confidence,
      bidirectional: dbEdge.bidirectional,
      ...dbEdge.metadata
    }));
  }

  /**
   * Database Service Initialization
   */
  async initialize(): Promise<void> {
    try {
      // Test database connection
      const health = await this.healthCheck();
      if (health.status === 'unhealthy') {
        throw new Error(`Database initialization failed: ${health.message}`);
      }
      
      // Initialize any required database state
      console.log('Database service initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  /**
   * Stage Execution Management
   */
  async executeStage(sessionId: string, stageId: string, parameters: any): Promise<any> {
    try {
      const stageExecution: Omit<DbStageExecution, 'id' | 'created_at'> = {
        session_id: sessionId,
        stage_number: parseInt(stageId),
        stage_name: `Stage ${stageId}`,
        status: 'running',
        input_data: parameters,
        started_at: new Date().toISOString()
      };

      // Insert stage execution record
      const { data, error } = await this.supabase
        .from('stage_executions')
        .insert(stageExecution)
        .select()
        .single();

      if (error) throw error;

      // Simulate stage execution (in real implementation, this would call ASR-GoT stages)
      const result = {
        stageId,
        sessionId,
        parameters,
        output: {
          success: true,
          data: `Stage ${stageId} executed successfully`,
          timestamp: new Date().toISOString()
        },
        executionTime: Math.random() * 1000 + 100 // Random execution time
      };

      // Update stage execution with results
      await this.supabase
        .from('stage_executions')
        .update({
          status: 'completed',
          output_data: result.output,
          execution_time_ms: result.executionTime,
          completed_at: new Date().toISOString()
        })
        .eq('id', data.id);

      return result;
    } catch (error) {
      console.error('Stage execution error:', error);
      throw error;
    }
  }

  /**
   * Stage History Retrieval
   */
  async getStageHistory(sessionId: string, stageId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('stage_executions')
        .select('*')
        .eq('session_id', sessionId)
        .eq('stage_number', parseInt(stageId))
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting stage history:', error);
      throw error;
    }
  }



  /**
   * System Health Status
   */
  async getHealthStatus(): Promise<{
    database: { status: 'healthy' | 'unhealthy'; message: string };
    connections: { active: number; idle: number };
    performance: { avgResponseTime: number; uptime: number };
  }> {
    try {
      const databaseHealth = await this.healthCheck();
      
      // Mock performance metrics (in real implementation, these would be actual metrics)
      const performance = {
        avgResponseTime: Math.random() * 50 + 20, // 20-70ms
        uptime: Date.now() - (Math.random() * 86400000) // Up to 1 day
      };
      
      const connections = {
        active: Math.floor(Math.random() * 10) + 1,
        idle: Math.floor(Math.random() * 20) + 5
      };

      return {
        database: databaseHealth,
        connections,
        performance
      };
    } catch (error) {
      return {
        database: { status: 'unhealthy', message: 'Health check failed' },
        connections: { active: 0, idle: 0 },
        performance: { avgResponseTime: 0, uptime: 0 }
      };
    }
  }

  /**
   * Health Check
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      
      return { status: 'healthy', message: 'Database connection successful' };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}

// Singleton instance
export const databaseService = new DatabaseService();