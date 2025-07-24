/**
 * Database Validation Wrapper
 * Provides schema validation for all database operations in ASR-GoT
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
  validateAndSanitize,
  ProfileSchema,
  ProfileUpdateSchema,
  ResearchSessionSchema,
  ResearchSessionCreateSchema,
  ResearchSessionUpdateSchema,
  GraphNodeSchema,
  GraphNodeCreateSchema,
  GraphEdgeSchema,
  GraphEdgeCreateSchema,
  StageExecutionSchema,
  StageExecutionCreateSchema,
  HypothesisSchema,
  HypothesisCreateSchema,
  KnowledgeGapSchema,
  KnowledgeGapCreateSchema,
  ResearchCollaborationSchema,
  ResearchCollaborationCreateSchema,
  APICredentialsSchema,
  APICredentialsCreateSchema,
  PerformanceMetricsSchema,
  PerformanceMetricsCreateSchema,
  ErrorLogSchema,
  ErrorLogCreateSchema,
  ExportHistorySchema,
  ExportHistoryCreateSchema,
  ActivityLogSchema,
  ActivityLogCreateSchema,
  type ResearchSessionType,
  type ResearchSessionCreateType,
  type ResearchSessionUpdateType,
  type GraphNodeType,
  type GraphNodeCreateType,
  type GraphEdgeType,
  type GraphEdgeCreateType,
  type StageExecutionType,
  type StageExecutionCreateType,
  type HypothesisType,
  type HypothesisCreateType,
  type KnowledgeGapType,
  type KnowledgeGapCreateType,
  type PerformanceMetricsType,
  type PerformanceMetricsCreateType,
  type ErrorLogType,
  type ErrorLogCreateType
} from './schemas';

interface ValidationError {
  field: string;
  message: string;
  code: string;
}

interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

export class DatabaseValidationWrapper {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Generic validation and database operation wrapper
   */
  private async validateAndExecute<T, U>(
    operation: () => Promise<{ data: T | null; error: any }>,
    schema: z.ZodSchema<U>,
    inputData?: unknown
  ): Promise<{ data: T | null; error: any; validationErrors?: ValidationError[] }> {
    try {
      // Validate input data if provided
      if (inputData !== undefined) {
        validateAndSanitize(inputData, schema);
      }

      // Execute the database operation
      const result = await operation();

      // Validate output data if successful
      if (result.data && !result.error) {
        try {
          validateAndSanitize(result.data, schema);
        } catch (validationError) {
          console.warn('Output validation failed:', validationError);
          // Log but don't fail the operation for output validation
        }
      }

      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return {
          data: null,
          error: {
            message: 'Validation failed',
            details: validationErrors,
            code: 'VALIDATION_ERROR'
          },
          validationErrors
        };
      }

      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown validation error',
          code: 'VALIDATION_ERROR'
        }
      };
    }
  }

  /**
   * Validated Research Session Operations
   */
  async createResearchSession(sessionData: unknown): Promise<{ data: ResearchSessionType | null; error: any }> {
    return this.validateAndExecute(
      () => this.supabase
        .from('research_sessions')
        .insert(validateAndSanitize(sessionData, ResearchSessionCreateSchema))
        .select()
        .single(),
      ResearchSessionSchema,
      sessionData
    );
  }

  async updateResearchSession(
    sessionId: string, 
    updates: unknown
  ): Promise<{ data: ResearchSessionType | null; error: any }> {
    return this.validateAndExecute(
      () => this.supabase
        .from('research_sessions')
        .update(validateAndSanitize(updates, ResearchSessionUpdateSchema))
        .eq('id', sessionId)
        .select()
        .single(),
      ResearchSessionSchema,
      updates
    );
  }

  /**
   * Validated Graph Node Operations
   */
  async createGraphNode(nodeData: unknown): Promise<{ data: GraphNodeType | null; error: any }> {
    return this.validateAndExecute(
      () => this.supabase
        .from('graph_nodes')
        .insert(validateAndSanitize(nodeData, GraphNodeCreateSchema))
        .select()
        .single(),
      GraphNodeSchema,
      nodeData
    );
  }

  async createGraphNodes(nodesData: unknown[]): Promise<{ data: GraphNodeType[] | null; error: any }> {
    try {
      const validatedNodes = nodesData.map(node => 
        validateAndSanitize(node, GraphNodeCreateSchema)
      );

      const { data, error } = await this.supabase
        .from('graph_nodes')
        .insert(validatedNodes)
        .select();

      return { data, error };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return {
          data: null,
          error: {
            message: 'Bulk validation failed',
            details: validationErrors,
            code: 'VALIDATION_ERROR'
          }
        };
      }

      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown validation error',
          code: 'VALIDATION_ERROR'
        }
      };
    }
  }

  /**
   * Validated Graph Edge Operations
   */
  async createGraphEdge(edgeData: unknown): Promise<{ data: GraphEdgeType | null; error: any }> {
    return this.validateAndExecute(
      () => this.supabase
        .from('graph_edges')
        .insert(validateAndSanitize(edgeData, GraphEdgeCreateSchema))
        .select()
        .single(),
      GraphEdgeSchema,
      edgeData
    );
  }

  async createGraphEdges(edgesData: unknown[]): Promise<{ data: GraphEdgeType[] | null; error: any }> {
    try {
      const validatedEdges = edgesData.map(edge => 
        validateAndSanitize(edge, GraphEdgeCreateSchema)
      );

      const { data, error } = await this.supabase
        .from('graph_edges')
        .insert(validatedEdges)
        .select();

      return { data, error };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return {
          data: null,
          error: {
            message: 'Bulk edge validation failed',
            details: validationErrors,
            code: 'VALIDATION_ERROR'
          }
        };
      }

      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown validation error',
          code: 'VALIDATION_ERROR'
        }
      };
    }
  }

  /**
   * Validated Stage Execution Operations
   */
  async createStageExecution(executionData: unknown): Promise<{ data: StageExecutionType | null; error: any }> {
    return this.validateAndExecute(
      () => this.supabase
        .from('stage_executions')
        .insert(validateAndSanitize(executionData, StageExecutionCreateSchema))
        .select()
        .single(),
      StageExecutionSchema,
      executionData
    );
  }

  async updateStageExecution(
    executionId: string,
    updates: unknown
  ): Promise<{ data: StageExecutionType | null; error: any }> {
    const updateSchema = StageExecutionCreateSchema.partial();
    return this.validateAndExecute(
      () => this.supabase
        .from('stage_executions')
        .update(validateAndSanitize(updates, updateSchema))
        .eq('id', executionId)
        .select()
        .single(),
      StageExecutionSchema,
      updates
    );
  }

  /**
   * Validated Hypothesis Operations
   */
  async createHypothesis(hypothesisData: unknown): Promise<{ data: HypothesisType | null; error: any }> {
    return this.validateAndExecute(
      () => this.supabase
        .from('hypotheses')
        .insert(validateAndSanitize(hypothesisData, HypothesisCreateSchema))
        .select()
        .single(),
      HypothesisSchema,
      hypothesisData
    );
  }

  /**
   * Validated Knowledge Gap Operations
   */
  async createKnowledgeGap(gapData: unknown): Promise<{ data: KnowledgeGapType | null; error: any }> {
    return this.validateAndExecute(
      () => this.supabase
        .from('knowledge_gaps')
        .insert(validateAndSanitize(gapData, KnowledgeGapCreateSchema))
        .select()
        .single(),
      KnowledgeGapSchema,
      gapData
    );
  }

  /**
   * Validated Performance Metrics Operations
   */
  async createPerformanceMetrics(metricsData: unknown): Promise<{ data: PerformanceMetricsType | null; error: any }> {
    return this.validateAndExecute(
      () => this.supabase
        .from('performance_metrics')
        .insert(validateAndSanitize(metricsData, PerformanceMetricsCreateSchema))
        .select()
        .single(),
      PerformanceMetricsSchema,
      metricsData
    );
  }

  /**
   * Validated Error Log Operations
   */
  async createErrorLog(errorData: unknown): Promise<{ data: ErrorLogType | null; error: any }> {
    return this.validateAndExecute(
      () => this.supabase
        .from('error_logs')
        .insert(validateAndSanitize(errorData, ErrorLogCreateSchema))
        .select()
        .single(),
      ErrorLogSchema,
      errorData
    );
  }

  /**
   * Validated Activity Log Operations
   */
  async createActivityLog(activityData: unknown): Promise<{ data: any | null; error: any }> {
    return this.validateAndExecute(
      () => this.supabase
        .from('activity_logs')
        .insert(validateAndSanitize(activityData, ActivityLogCreateSchema))
        .select()
        .single(),
      ActivityLogSchema,
      activityData
    );
  }

  /**
   * Batch validation for large operations
   */
  async validateBatch<T>(data: unknown[], schema: z.ZodSchema<T>): Promise<ValidationResult<T[]>> {
    try {
      const validatedData = data.map(item => validateAndSanitize(item, schema));
      return {
        success: true,
        data: validatedData
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return {
          success: false,
          errors
        };
      }

      return {
        success: false,
        errors: [{
          field: 'unknown',
          message: error instanceof Error ? error.message : 'Unknown validation error',
          code: 'VALIDATION_ERROR'
        }]
      };
    }
  }

  /**
   * Safe data sanitization for complex objects
   */
  sanitizeForDatabase(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'string') {
      // Remove potentially dangerous characters
      return data
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: protocols
        .replace(/on\w+\s*=/gi, '') // Remove on* event handlers
        .trim();
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeForDatabase(item));
    }

    if (typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        // Only include safe keys
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
          sanitized[key] = this.sanitizeForDatabase(value);
        }
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Validate database query parameters to prevent injection
   */
  validateQueryParams(params: Record<string, any>): Record<string, any> {
    const validated: Record<string, any> = {};

    for (const [key, value] of Object.entries(params)) {
      // Validate parameter keys
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
        throw new Error(`Invalid parameter key: ${key}`);
      }

      // Validate parameter values
      if (typeof value === 'string') {
        // Check for SQL injection patterns
        if (/['";\\]|--|\b(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|ALTER|CREATE)\b/i.test(value)) {
          throw new Error(`Potentially unsafe parameter value: ${key}`);
        }
        validated[key] = value.trim();
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        validated[key] = value;
      } else if (value === null || value === undefined) {
        validated[key] = value;
      } else {
        // For complex objects, sanitize recursively
        validated[key] = this.sanitizeForDatabase(value);
      }
    }

    return validated;
  }
}

/**
 * Create validation wrapper instance
 */
export const createValidationWrapper = (supabase: SupabaseClient): DatabaseValidationWrapper => {
  return new DatabaseValidationWrapper(supabase);
};