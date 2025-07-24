/**
 * Supabase Type Mapping and Compatibility Layer
 * Bridges the gap between custom ASR-GoT types and Supabase-generated types
 */

import type { Database, Tables, TablesInsert, TablesUpdate, Json } from './types';

// Type utilities for safe conversion
type SafeJson<T> = T extends Json ? T : Json;

/**
 * Database table type aliases using Supabase generated types
 */
export type SupabaseProfile = Tables<'profiles'>;
export type SupabaseProfileInsert = TablesInsert<'profiles'>;
export type SupabaseProfileUpdate = TablesUpdate<'profiles'>;

export type SupabaseResearchSession = Tables<'research_sessions'>;
export type SupabaseResearchSessionInsert = TablesInsert<'research_sessions'>;
export type SupabaseResearchSessionUpdate = TablesUpdate<'research_sessions'>;

export type SupabaseQuerySession = Tables<'query_sessions'>;
export type SupabaseQuerySessionInsert = TablesInsert<'query_sessions'>;
export type SupabaseQuerySessionUpdate = TablesUpdate<'query_sessions'>;

export type SupabaseStageExecution = Tables<'stage_executions'>;
export type SupabaseStageExecutionInsert = TablesInsert<'stage_executions'>;
export type SupabaseStageExecutionUpdate = TablesUpdate<'stage_executions'>;

export type SupabaseGraphData = Tables<'graph_data'>;
export type SupabaseGraphDataInsert = TablesInsert<'graph_data'>;
export type SupabaseGraphDataUpdate = TablesUpdate<'graph_data'>;

export type SupabaseQueryFigure = Tables<'query_figures'>;
export type SupabaseQueryFigureInsert = TablesInsert<'query_figures'>;
export type SupabaseQueryFigureUpdate = TablesUpdate<'query_figures'>;

/**
 * Type converters to bridge custom types with Supabase types
 */

// Profile type mapping
export interface ProfileTypeMapping {
  custom: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    research_interests?: string[];
    expertise_areas?: string[];
    institution?: string;
    created_at: string;
    updated_at: string;
  };
  supabase: SupabaseProfile;
}

export const convertProfileToSupabase = (
  profile: ProfileTypeMapping['custom']
): SupabaseProfileInsert => ({
  id: profile.id,
  user_id: profile.id, // Map id to user_id for Supabase
  email: profile.email,
  full_name: profile.full_name || null,
  avatar_url: profile.avatar_url || null,
  created_at: profile.created_at,
  updated_at: profile.updated_at
});

export const convertProfileFromSupabase = (
  profile: SupabaseProfile
): ProfileTypeMapping['custom'] => ({
  id: profile.id,
  email: profile.email || '',
  full_name: profile.full_name || undefined,
  avatar_url: profile.avatar_url || undefined,
  research_interests: [], // Not stored in Supabase profile
  expertise_areas: [], // Not stored in Supabase profile  
  institution: undefined, // Not stored in Supabase profile
  created_at: profile.created_at,
  updated_at: profile.updated_at
});

// Research Session type mapping 
export interface ResearchSessionTypeMapping {
  custom: {
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
  };
  supabase: SupabaseResearchSession;
  querySession: SupabaseQuerySession;
}

export const convertResearchSessionToSupabase = (
  session: ResearchSessionTypeMapping['custom']
): SupabaseResearchSessionInsert => ({
  id: session.id,
  user_id: session.user_id,
  title: session.title,
  description: session.description || null,
  status: session.status || null,
  config: {
    research_question: session.research_question,
    current_stage: session.current_stage,
    graph_data: session.graph_data,
    stage_results: session.stage_results,
    metadata: session.metadata,
    completed_at: session.completed_at
  } as Json,
  created_at: session.created_at,
  updated_at: session.updated_at
});

export const convertResearchSessionToQuerySession = (
  session: ResearchSessionTypeMapping['custom']
): SupabaseQuerySessionInsert => ({
  id: session.id,
  query: session.research_question || session.title,
  status: session.status || 'draft',
  current_stage: session.current_stage,
  total_stages: 9, // ASR-GoT has 9 stages
  created_at: session.created_at,
  updated_at: session.updated_at,
  completed_at: session.completed_at || null,
  research_context: (session.metadata || {}) as Json,
  graph_data: (session.graph_data || {}) as Json,
  stage_results: (session.stage_results || {}) as Json,
  metadata: {
    original_session: session,
    migration_timestamp: new Date().toISOString()
  } as Json,
  user_id: session.user_id,
  tags: [] // Default empty tags
});

export const convertQuerySessionToCustom = (
  querySession: SupabaseQuerySession
): ResearchSessionTypeMapping['custom'] => ({
  id: querySession.id,
  user_id: querySession.user_id || '',
  title: querySession.query,
  description: typeof querySession.research_context === 'object' && 
    querySession.research_context !== null ? 
    (querySession.research_context as any).description : undefined,
  research_question: querySession.query,
  status: (querySession.status as any) || 'draft',
  current_stage: querySession.current_stage,
  graph_data: querySession.graph_data,
  stage_results: querySession.stage_results,
  metadata: querySession.metadata,
  created_at: querySession.created_at,
  updated_at: querySession.updated_at,
  completed_at: querySession.completed_at || undefined
});

// Stage Execution type mapping
export interface StageExecutionTypeMapping {
  custom: {
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
  };
  supabase: SupabaseStageExecution;
}

export const convertStageExecutionToSupabase = (
  execution: StageExecutionTypeMapping['custom']
): SupabaseStageExecutionInsert => ({
  id: execution.id,
  session_id: execution.session_id,
  stage_id: `stage_${execution.stage_number}_${execution.stage_name}`,
  status: execution.status || null,
  parameters: {
    stage_number: execution.stage_number,
    stage_name: execution.stage_name,
    input_data: execution.input_data,
    execution_time_ms: execution.execution_time_ms,
    error_message: execution.error_message,
    confidence_score: execution.confidence_score
  } as Json,
  results: (execution.output_data || {}) as Json,
  started_at: execution.started_at || null,
  completed_at: execution.completed_at || null,
  created_at: execution.created_at
});

export const convertStageExecutionFromSupabase = (
  execution: SupabaseStageExecution
): StageExecutionTypeMapping['custom'] => {
  const parameters = execution.parameters as any || {};
  return {
    id: execution.id,
    session_id: execution.session_id,
    stage_number: parameters.stage_number || 1,
    stage_name: parameters.stage_name || execution.stage_id,
    status: (execution.status as any) || 'pending',
    input_data: parameters.input_data,
    output_data: execution.results,
    execution_time_ms: parameters.execution_time_ms,
    error_message: parameters.error_message,
    confidence_score: parameters.confidence_score,
    started_at: execution.started_at || undefined,
    completed_at: execution.completed_at || undefined,
    created_at: execution.created_at
  };
};

// Graph Data type mapping
export interface GraphDataTypeMapping {
  custom: {
    nodes: Array<{
      id: string;
      label: string;
      type: string;
      confidence: number[];
      position?: { x: number; y: number };
      metadata?: any;
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
      type: string;
      confidence: number;
      bidirectional?: boolean;
      metadata?: any;
    }>;
  };
  supabase: SupabaseGraphData;
}

export const convertGraphDataToSupabase = (
  sessionId: string,
  graphData: GraphDataTypeMapping['custom']
): SupabaseGraphDataInsert => ({
  session_id: sessionId,
  nodes: graphData.nodes as Json,
  edges: graphData.edges as Json,
  metadata: {
    version: graphData.metadata?.version || '1.0',
    stage: graphData.metadata?.stage || 1,
    node_count: graphData.nodes.length,
    edge_count: graphData.edges.length,
    hyperedge_count: graphData.hyperedges?.length || 0,
    graph_metrics: graphData.metadata?.graph_metrics || {},
    created_timestamp: graphData.metadata?.created || new Date().toISOString(),
    last_updated: new Date().toISOString()
  } as Json
});

export const convertGraphDataFromSupabase = (
  supabaseGraphData: SupabaseGraphData
): GraphDataTypeMapping['custom'] => {
  const nodes = Array.isArray(supabaseGraphData.nodes) ? supabaseGraphData.nodes as any[] : [];
  const edges = Array.isArray(supabaseGraphData.edges) ? supabaseGraphData.edges as any[] : [];
  const metadata = supabaseGraphData.metadata as any || {};
  
  return {
    nodes,
    edges,
    hyperedges: [], // Initialize empty hyperedges array
    metadata: {
      version: metadata.version || '1.0',
      created: metadata.created_timestamp || supabaseGraphData.created_at,
      last_updated: supabaseGraphData.updated_at,
      stage: metadata.stage || 1,
      total_nodes: nodes.length,
      total_edges: edges.length,
      graph_metrics: metadata.graph_metrics || {
        density: nodes.length > 0 ? edges.length / Math.max(nodes.length * (nodes.length - 1), 1) : 0,
        avg_confidence: edges.reduce((sum, edge) => sum + (edge.confidence || 0), 0) / Math.max(edges.length, 1)
      }
    }
  };
};

/**
 * Database adapter class for consistent type handling
 */
export class SupabaseTypeAdapter {
  /**
   * Convert any custom type to its Supabase equivalent
   */
  static toSupabase<T extends keyof TypeMappings>(
    type: T,
    data: TypeMappings[T]['custom']
  ): TypeMappings[T]['supabase'] {
    switch (type) {
      case 'profile':
        return convertProfileToSupabase(data as any) as any;
      case 'researchSession':
        return convertResearchSessionToSupabase(data as any) as any;
      case 'stageExecution':
        return convertStageExecutionToSupabase(data as any) as any;
      default:
        throw new Error(`Unsupported type conversion: ${type}`);
    }
  }

  /**
   * Convert Supabase type to custom type
   */
  static fromSupabase<T extends keyof TypeMappings>(
    type: T,
    data: TypeMappings[T]['supabase']
  ): TypeMappings[T]['custom'] {
    switch (type) {
      case 'profile':
        return convertProfileFromSupabase(data as any) as any;
      case 'stageExecution':
        return convertStageExecutionFromSupabase(data as any) as any;
      default:
        throw new Error(`Unsupported type conversion: ${type}`);
    }
  }

  /**
   * Safely convert JSON data with type validation
   */
  static safeJsonConvert<T>(data: T): SafeJson<T> {
    if (data === null || data === undefined) {
      return null as SafeJson<T>;
    }
    
    if (typeof data === 'object') {
      try {
        // Ensure it's serializable JSON
        JSON.parse(JSON.stringify(data));
        return data as SafeJson<T>;
      } catch {
        return {} as SafeJson<T>;
      }
    }
    
    return data as SafeJson<T>;
  }

  /**
   * Validate that data matches expected Supabase table structure
   */
  static validateForTable<T extends keyof Database['public']['Tables']>(
    tableName: T,
    data: unknown
  ): data is TablesInsert<T> {
    // Basic validation - could be extended with more sophisticated checks
    return typeof data === 'object' && data !== null;
  }
}

interface TypeMappings {
  profile: ProfileTypeMapping;
  researchSession: ResearchSessionTypeMapping;
  stageExecution: StageExecutionTypeMapping;
  graphData: GraphDataTypeMapping;
}

/**
 * Type guards for runtime type checking
 */
export const isSupabaseProfile = (data: unknown): data is SupabaseProfile => {
  return typeof data === 'object' && data !== null && 'id' in data && 'user_id' in data;
};

export const isSupabaseQuerySession = (data: unknown): data is SupabaseQuerySession => {
  return typeof data === 'object' && data !== null && 'id' in data && 'query' in data;
};

export const isSupabaseStageExecution = (data: unknown): data is SupabaseStageExecution => {
  return typeof data === 'object' && data !== null && 'id' in data && 'stage_id' in data;
};

/**
 * Migration utilities
 */
export class DatabaseMigrationUtils {
  /**
   * Migrate legacy query_sessions to research_sessions format
   */
  static migrateQuerySessionToResearchSession(
    querySession: SupabaseQuerySession
  ): ResearchSessionTypeMapping['custom'] {
    return convertQuerySessionToCustom(querySession);
  }

  /**
   * Check if current database schema matches expected ASR-GoT schema
   */
  static async validateSchemaCompatibility(): Promise<{
    compatible: boolean;
    missingTables: string[];
    recommendations: string[];
  }> {
    const expectedTables = [
      'profiles',
      'research_sessions', 
      'graph_nodes',
      'graph_edges',
      'stage_executions',
      'hypotheses',
      'knowledge_gaps',
      'research_collaborations',
      'api_credentials',
      'performance_metrics',
      'error_logs',
      'export_history',
      'activity_logs'
    ];

    // This would need to be implemented with actual database introspection
    // For now, return compatibility status based on known issues
    return {
      compatible: false,
      missingTables: [
        'graph_nodes',
        'graph_edges', 
        'hypotheses',
        'knowledge_gaps',
        'research_collaborations',
        'api_credentials',
        'performance_metrics',
        'error_logs',
        'export_history',
        'activity_logs'
      ],
      recommendations: [
        'Run the ASR-GoT database migration: supabase db reset',
        'Apply the complete schema from /supabase/migrations/001_initial_schema.sql',
        'Update Supabase type generation: supabase gen types typescript',
        'Consider using the legacy query_sessions table for backward compatibility'
      ]
    };
  }
}

// Export database type for use throughout the application
export type { Database };
export type SupabaseClient = import('@supabase/supabase-js').SupabaseClient<Database>;