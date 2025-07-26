/**
 * Comprehensive Database Service for ASR-GoT Framework
 * Handles all database operations with Supabase integration and schema validation
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { GraphData, GraphNode, GraphEdge, StageExecution } from '@/types/asrGotTypes';
import { Hypothesis } from '@/services/reasoning/HypothesisCompetitionFramework';
import { DatabaseValidationWrapper, createValidationWrapper } from './ValidationWrapper';
import { migrationService, MigrationService } from './MigrationService';
import { 
  validateAndSanitize,
  ResearchSessionCreateSchema,
  ResearchSessionUpdateSchema,
  GraphNodeCreateSchema,
  GraphEdgeCreateSchema,
  StageExecutionCreateSchema,
  HypothesisCreateSchema,
  KnowledgeGapCreateSchema,
  PerformanceMetricsCreateSchema,
  ErrorLogCreateSchema,
  ActivityLogCreateSchema,
  type ResearchSessionCreateType,
  type ResearchSessionUpdateType
} from './schemas';
import { 
  SupabaseTypeAdapter,
  convertResearchSessionToQuerySession,
  convertQuerySessionToCustom,
  convertStageExecutionToSupabase,
  convertStageExecutionFromSupabase,
  convertGraphDataToSupabase,
  convertGraphDataFromSupabase,
  isSupabaseQuerySession,
  DatabaseMigrationUtils,
  type Database
} from '@/integrations/supabase/typeMapping';

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
  private static instance: DatabaseService;
  private supabase: SupabaseClient<Database>;
  private validator: DatabaseValidationWrapper;

  private constructor() {
    this.supabase = supabase as SupabaseClient<Database>;
    this.validator = createValidationWrapper(this.supabase);
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
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
    try {
      // Validate input data before database operation
      const validatedData = validateAndSanitize(sessionData, ResearchSessionCreateSchema);
      
      // Convert to Supabase-compatible format using query_sessions table
      const supabaseSessionData = convertResearchSessionToQuerySession({
        id: crypto.randomUUID(),
        ...validatedData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Insert into query_sessions table (which exists in Supabase)
      const { data, error } = await this.supabase
        .from('query_sessions')
        .insert(supabaseSessionData)
        .select()
        .single();
      
      if (error) throw new Error(`Database operation failed: ${error.message}`);
      if (!data) throw new Error('No data returned from create operation');
      
      // Convert back to custom format
      return convertQuerySessionToCustom(data) as DbResearchSession;
    } catch (validationError) {
      throw new Error(`Validation failed: ${validationError instanceof Error ? validationError.message : 'Unknown validation error'}`);
    }
  }

  async getResearchSessions(userId: string): Promise<DbResearchSession[]> {
    try {
      // Query from query_sessions table (which exists in Supabase)
      const { data, error } = await this.supabase
        .from('query_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      if (!data) return [];
      
      // Convert all query sessions to research session format
      return data.map(querySession => convertQuerySessionToCustom(querySession) as DbResearchSession);
    } catch (error) {
      throw new Error(`Failed to get research sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getResearchSession(sessionId: string): Promise<DbResearchSession | null> {
    try {
      // Query from query_sessions table (which exists in Supabase)
      const { data, error } = await this.supabase
        .from('query_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;
      
      // Convert query session to research session format
      return convertQuerySessionToCustom(data) as DbResearchSession;
    } catch (error) {
      throw new Error(`Failed to get research session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateResearchSession(sessionId: string, updates: Partial<DbResearchSession>): Promise<DbResearchSession> {
    try {
      // Validate sessionId
      if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('Invalid session ID');
      }

      // Validate input data before database operation
      const validatedUpdates = validateAndSanitize(updates, ResearchSessionUpdateSchema);
      
      // Convert updates to query_sessions format
      const supabaseUpdates = convertResearchSessionToQuerySession({
        id: sessionId,
        updated_at: new Date().toISOString(),
        ...validatedUpdates
      } as any);

      // Update in query_sessions table (which exists in Supabase)
      const { data, error } = await this.supabase
        .from('query_sessions')
        .update(supabaseUpdates)
        .eq('id', sessionId)
        .select()
        .single();
      
      if (error) throw new Error(`Database operation failed: ${error.message}`);
      if (!data) throw new Error('No data returned from update operation');
      
      // Convert back to custom format
      return convertQuerySessionToCustom(data) as DbResearchSession;
    } catch (validationError) {
      throw new Error(`Validation failed: ${validationError instanceof Error ? validationError.message : 'Unknown validation error'}`);
    }
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
  async saveGraphNodes(sessionId: string, nodes: GraphNode[]): Promise<void> {
    // Get existing graph data and update nodes
    const existingData = await this.getGraphData(sessionId) || { nodes: [], edges: [] };
    const updatedData = { ...existingData, nodes };
    await this.saveGraphData(sessionId, updatedData);
  }

  async saveGraphEdges(sessionId: string, edges: GraphEdge[]): Promise<void> {
    // Get existing graph data and update edges  
    const existingData = await this.getGraphData(sessionId) || { nodes: [], edges: [] };
    const updatedData = { ...existingData, edges };
    await this.saveGraphData(sessionId, updatedData);
  }

  /**
   * Save complete graph data using Supabase graph_data table
   */
  async saveGraphData(sessionId: string, graphData: GraphData): Promise<void> {
    try {
      // Validate sessionId
      if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('Invalid session ID');
      }

      // Convert to Supabase format
      const supabaseGraphData = convertGraphDataToSupabase(sessionId, graphData);

      // Upsert graph data
      const { error } = await this.supabase
        .from('graph_data')
        .upsert(supabaseGraphData, { 
          onConflict: 'session_id',
          ignoreDuplicates: false 
        });
      
      if (error) throw new Error(`Database operation failed: ${error.message}`);
      
    } catch (error) {
      throw new Error(`Graph data save failed: ${error instanceof Error ? error.message : 'Unknown validation error'}`);
    }
  }

  async getGraphData(sessionId: string): Promise<GraphData | null> {
    try {
      // Get graph data from graph_data table (which exists in Supabase)
      const { data, error } = await this.supabase
        .from('graph_data')
        .select('*')
        .eq('session_id', sessionId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      if (!data) {
        // Fallback to session graph_data
        const session = await this.getResearchSession(sessionId);
        return session?.graph_data || null;
      }
      
      // Convert from Supabase format
      return convertGraphDataFromSupabase(data);
    } catch (error) {
      // Fallback to session graph_data
      const session = await this.getResearchSession(sessionId);
      return session?.graph_data || null;
    }
  }

  async getGraphNodes(sessionId: string): Promise<DbGraphNode[]> {
    // Graph nodes are stored in graph_data table for current schema compatibility
    const graphData = await this.getGraphData(sessionId);
    return []; // Return empty for now - data is in graph_data.nodes
  }

  async getGraphEdges(sessionId: string): Promise<DbGraphEdge[]> {
    // Graph edges are stored in graph_data table for current schema compatibility
    const graphData = await this.getGraphData(sessionId);
    return []; // Return empty for now - data is in graph_data.edges
  }

  /**
   * Stage Execution Management
   */
  async saveStageExecution(stageData: Omit<DbStageExecution, 'id' | 'created_at'>): Promise<DbStageExecution> {
    try {
      // Validate input data before database operation
      const validatedData = validateAndSanitize(stageData, StageExecutionCreateSchema);
      
      const { data, error } = await this.validator.createStageExecution(validatedData);
      
      if (error) throw new Error(`Database operation failed: ${error.message}`);
      if (!data) throw new Error('No data returned from stage execution create operation');
      
      return data as DbStageExecution;
    } catch (validationError) {
      throw new Error(`Stage execution validation failed: ${validationError instanceof Error ? validationError.message : 'Unknown validation error'}`);
    }
  }

  async updateStageExecution(executionId: string, updates: Partial<DbStageExecution>): Promise<DbStageExecution> {
    try {
      // Validate executionId
      if (!executionId || typeof executionId !== 'string') {
        throw new Error('Invalid execution ID');
      }

      // Sanitize and validate updates
      const sanitizedUpdates = this.validator.sanitizeForDatabase(updates);
      const updateSchema = StageExecutionCreateSchema.partial();
      const validatedUpdates = validateAndSanitize(sanitizedUpdates, updateSchema);
      
      const { data, error } = await this.validator.updateStageExecution(executionId, validatedUpdates);
      
      if (error) throw new Error(`Database operation failed: ${error.message}`);
      if (!data) throw new Error('No data returned from stage execution update operation');
      
      return data as DbStageExecution;
    } catch (validationError) {
      throw new Error(`Stage execution update validation failed: ${validationError instanceof Error ? validationError.message : 'Unknown validation error'}`);
    }
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
    try {
      // Validate input data before database operation
      const validatedData = validateAndSanitize(errorData, ErrorLogCreateSchema);
      
      const { data, error } = await this.validator.createErrorLog(validatedData);
      
      if (error) throw new Error(`Database operation failed: ${error.message}`);
      if (!data) throw new Error('No data returned from error log create operation');
      
      return data as DbErrorLog;
    } catch (validationError) {
      // For error logging, we want to be more permissive to avoid losing error data
      console.error('Error log validation failed, attempting to sanitize and retry:', validationError);
      
      try {
        // Fallback: sanitize the data and try again with minimal validation
        const sanitizedData = this.validator.sanitizeForDatabase(errorData);
        const { data, error } = await this.supabase
          .from('error_logs')
          .insert(sanitizedData)
          .select()
          .single();
        
        if (error) throw new Error(`Database operation failed: ${error.message}`);
        return data;
      } catch (fallbackError) {
        throw new Error(`Error logging failed completely: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
      }
    }
  }

  async getErrorLogs(sessionId?: string, severity?: string): Promise<DbErrorLog[]> {
    try {
      // Validate query parameters
      const validatedParams = this.validator.validateQueryParams({
        session_id: sessionId,
        severity: severity
      });

      let query = this.supabase
        .from('error_logs')
        .select('*');

      if (validatedParams.session_id) {
        query = query.eq('session_id', validatedParams.session_id);
      }

      if (validatedParams.severity) {
        query = query.eq('severity', validatedParams.severity);
      }

      const { data, error } = await query
        .eq('resolved', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (validationError) {
      throw new Error(`Error logs query validation failed: ${validationError instanceof Error ? validationError.message : 'Unknown validation error'}`);
    }
  }

  /**
   * Real-time Subscriptions
   */
  subscribeToSession(sessionId: string, callback: (payload: any) => void) {
    try {
      const channel = this.supabase
        .channel(`session_${sessionId}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'query_sessions', // Fixed: Use actual table name
            filter: `id=eq.${sessionId}`
          }, 
          (payload) => {
            try {
              callback(payload);
            } catch (error) {
              console.error('Session subscription callback error:', error);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Session subscription active for ${sessionId}`);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Session subscription error for ${sessionId}`);
          } else if (status === 'TIMED_OUT') {
            console.warn(`Session subscription timeout for ${sessionId}`);
          }
        });
        
      return channel;
    } catch (error) {
      console.error('Failed to create session subscription:', error);
      throw error;
    }
  }

  subscribeToGraphChanges(sessionId: string, callback: (payload: any) => void) {
    try {
      const channel = this.supabase
        .channel(`graph_${sessionId}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'graph_data', // Fixed: Use actual table name
            filter: `session_id=eq.${sessionId}`
          }, 
          (payload) => {
            try {
              callback(payload);
            } catch (error) {
              console.error('Graph subscription callback error:', error);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Graph subscription active for ${sessionId}`);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Graph subscription error for ${sessionId}`);
          } else if (status === 'TIMED_OUT') {
            console.warn(`Graph subscription timeout for ${sessionId}`);
          }
        });
        
      return channel;
    } catch (error) {
      console.error('Failed to create graph subscription:', error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' | 'error' {
    try {
      // Since we can't access private methods, we'll use a simpler approach
      // Check if auth is available as a proxy for connection status
      if (this.supabase.auth) {
        return 'connected';
      } else {
        return 'disconnected';
      }
    } catch (error) {
      console.error('Connection status check failed:', error);
      return 'error';
    }
  }

  /**
   * Cleanup all subscriptions
   */
  async cleanupSubscriptions(): Promise<void> {
    try {
      // Note: Cannot access private getChannels() method
      // Individual channels should be cleaned up by their respective components
      console.log('Subscription cleanup requested - components must handle individual channels');
    } catch (error) {
      console.error('Failed to cleanup subscriptions:', error);
      throw error;
    }
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
      
      // Check and validate database schema
      await this.validateAndRepairSchema();
      
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

  /**
   * Validate and repair database schema if needed
   */
  private async validateAndRepairSchema(): Promise<void> {
    try {
      console.log('🔍 Validating database schema...');
      
      // Check schema health
      const schemaHealth = await migrationService.getHealthStatus();
      console.log(`Schema health: ${schemaHealth.status} - ${schemaHealth.message}`);
      
      if (schemaHealth.status === 'critical') {
        console.log('🔧 Critical schema issues detected, attempting repair...');
        
        const repairResult = await migrationService.initializeSchema();
        
        if (repairResult.success) {
          console.log('✅ Schema repair completed successfully');
          if (repairResult.tablesCreated.length > 0) {
            console.log('Created/updated:', repairResult.tablesCreated.join(', '));
          }
        } else {
          console.warn('⚠️ Schema repair encountered issues:');
          repairResult.errors.forEach(error => console.warn(`  - ${error}`));
          
          // Don't throw error here - allow app to continue with degraded functionality
        }
      } else if (schemaHealth.status === 'degraded') {
        console.log('⚠️ Schema has minor issues but is functional');
        
        // Optionally attempt to fix degraded schema
        const validation = await migrationService.validateSchema();
        if (validation.recommendations.length > 0) {
          console.log('Schema recommendations:');
          validation.recommendations.forEach(rec => console.log(`  - ${rec}`));
        }
      } else {
        console.log('✅ Database schema is healthy');
      }
      
    } catch (error) {
      console.warn('Schema validation failed, continuing with basic functionality:', error);
      // Don't throw - allow app to continue
    }
  }

  /**
   * Get detailed schema status for debugging
   */
  async getSchemaStatus(): Promise<{
    health: any;
    validation: any;
    tables: any;
  }> {
    try {
      const [health, validation, tables] = await Promise.all([
        migrationService.getHealthStatus(),
        migrationService.validateSchema(),
        migrationService.checkSchemaStatus()
      ]);
      
      return { health, validation, tables };
    } catch (error) {
      return {
        health: { status: 'error', message: 'Could not check schema status' },
        validation: { isValid: false, issues: ['Status check failed'] },
        tables: { tablesExist: {}, missingTables: [] }
      };
    }
  }
}

// Singleton instance
export const databaseService = new DatabaseService();