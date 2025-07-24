/**
 * Database Schema Validation
 * Comprehensive Zod schemas for all database operations in ASR-GoT
 */

import { z } from 'zod';

// Base schemas for common types
export const UUIDSchema = z.string().uuid('Invalid UUID format');
export const EmailSchema = z.string().email('Invalid email format');
export const TimestampSchema = z.string().datetime('Invalid timestamp format');
export const URLSchema = z.string().url('Invalid URL format').optional();

// Research Session Status Enum
export const ResearchSessionStatusSchema = z.enum(['draft', 'active', 'completed', 'archived']);

// Stage Number Validation (1-9 for ASR-GoT framework)
export const StageNumberSchema = z.number().int().min(1).max(9);

// Confidence Score (0-1)
export const ConfidenceSchema = z.number().min(0).max(1);

// Priority Score (0-1)
export const PrioritySchema = z.number().min(0).max(1);

// Execution Status Enum
export const ExecutionStatusSchema = z.enum(['pending', 'running', 'completed', 'failed', 'skipped']);

// Hypothesis Status Enum
export const HypothesisStatusSchema = z.enum(['active', 'validated', 'refuted', 'archived']);

// Knowledge Gap Status Enum
export const KnowledgeGapStatusSchema = z.enum(['identified', 'researching', 'filled', 'unfillable']);

// Collaboration Role Enum
export const CollaborationRoleSchema = z.enum(['owner', 'editor', 'viewer', 'commenter']);

// Collaboration Status Enum
export const CollaborationStatusSchema = z.enum(['pending', 'accepted', 'declined', 'revoked']);

// Error Severity Enum
export const ErrorSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);

/**
 * Profile Schema
 */
export const ProfileSchema = z.object({
  id: UUIDSchema,
  email: EmailSchema,
  full_name: z.string().min(1).max(255).trim().optional(),
  avatar_url: URLSchema,
  research_interests: z.array(z.string().min(1).max(100)).max(20).optional(),
  expertise_areas: z.array(z.string().min(1).max(100)).max(20).optional(),
  institution: z.string().min(1).max(500).trim().optional(),
  created_at: TimestampSchema.optional(),
  updated_at: TimestampSchema.optional()
});

export const ProfileUpdateSchema = ProfileSchema.omit({ 
  id: true, 
  email: true,
  created_at: true, 
  updated_at: true 
}).partial();

/**
 * Research Session Schema
 */
export const GraphDataSchema = z.object({
  nodes: z.array(z.object({
    id: z.string().min(1),
    label: z.string().min(1).max(500),
    type: z.string().min(1).max(100),
    confidence: z.array(ConfidenceSchema).length(4), // [empirical, theoretical, methodological, consensus]
    position: z.object({
      x: z.number(),
      y: z.number()
    }).optional(),
    metadata: z.record(z.unknown()).optional()
  })).max(10000), // Reasonable limit for large graphs
  edges: z.array(z.object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
    type: z.string().min(1).max(100),
    confidence: ConfidenceSchema,
    bidirectional: z.boolean().optional(),
    metadata: z.record(z.unknown()).optional()
  })).max(50000), // Reasonable limit for large graphs
  hyperedges: z.array(z.object({
    id: z.string().min(1),
    nodes: z.array(z.string().min(1)).min(2), // At least 2 nodes
    type: z.string().min(1).max(100),
    confidence: ConfidenceSchema,
    metadata: z.record(z.unknown()).optional()
  })).optional().default([]),
  metadata: z.object({
    version: z.string().default('1.0'),
    created: z.string().datetime(),
    last_updated: z.string().datetime(),
    stage: z.number().int().min(1).max(9),
    total_nodes: z.number().int().min(0),
    total_edges: z.number().int().min(0),
    graph_metrics: z.record(z.number()).default({})
  })
}).refine((data) => {
  // Validate that node counts match
  return data.metadata.total_nodes === data.nodes.length &&
         data.metadata.total_edges === data.edges.length;
}, {
  message: "Node/edge counts in metadata must match actual array lengths"
});

export const ResearchSessionSchema = z.object({
  id: UUIDSchema.optional(),
  user_id: UUIDSchema,
  title: z.string().min(1).max(500).trim(),
  description: z.string().max(5000).trim().optional(),
  research_question: z.string().max(2000).trim().optional(),
  status: ResearchSessionStatusSchema.default('draft'),
  current_stage: StageNumberSchema.default(1),
  graph_data: GraphDataSchema,
  stage_results: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
  created_at: TimestampSchema.optional(),
  updated_at: TimestampSchema.optional(),
  completed_at: TimestampSchema.optional()
});

export const ResearchSessionCreateSchema = ResearchSessionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const ResearchSessionUpdateSchema = ResearchSessionSchema.omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true
}).partial();

/**
 * Graph Node Schema
 */
export const GraphNodeSchema = z.object({
  id: UUIDSchema.optional(),
  session_id: UUIDSchema,
  node_id: z.string().min(1).max(255),
  label: z.string().min(1).max(500).trim(),
  node_type: z.string().min(1).max(100),
  confidence: z.array(ConfidenceSchema).length(4),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number().optional()
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
  created_at: TimestampSchema.optional(),
  updated_at: TimestampSchema.optional()
});

export const GraphNodeCreateSchema = GraphNodeSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

/**
 * Graph Edge Schema
 */
export const GraphEdgeSchema = z.object({
  id: UUIDSchema.optional(),
  session_id: UUIDSchema,
  edge_id: z.string().min(1).max(255),
  source_node_id: z.string().min(1).max(255),
  target_node_id: z.string().min(1).max(255),
  edge_type: z.string().min(1).max(100),
  confidence: ConfidenceSchema,
  bidirectional: z.boolean().default(false),
  metadata: z.record(z.unknown()).optional(),
  created_at: TimestampSchema.optional(),
  updated_at: TimestampSchema.optional()
});

export const GraphEdgeCreateSchema = GraphEdgeSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

/**
 * Stage Execution Schema
 */
export const StageExecutionSchema = z.object({
  id: UUIDSchema.optional(),
  session_id: UUIDSchema,
  stage_number: StageNumberSchema,
  stage_name: z.string().min(1).max(255),
  status: ExecutionStatusSchema.default('pending'),
  input_data: z.record(z.unknown()).optional(),
  output_data: z.record(z.unknown()).optional(),
  execution_time_ms: z.number().int().min(0).max(3600000).optional(), // Max 1 hour
  error_message: z.string().max(5000).optional(),
  confidence_score: ConfidenceSchema.optional(),
  started_at: TimestampSchema.optional(),
  completed_at: TimestampSchema.optional(),
  created_at: TimestampSchema.optional()
});

export const StageExecutionCreateSchema = StageExecutionSchema.omit({
  id: true,
  created_at: true
});

/**
 * Hypothesis Schema
 */
export const HypothesisSchema = z.object({
  id: UUIDSchema.optional(),
  session_id: UUIDSchema,
  hypothesis_text: z.string().min(10).max(2000).trim(),
  hypothesis_type: z.string().min(1).max(100),
  confidence: ConfidenceSchema,
  supporting_evidence: z.array(z.string().max(1000)).max(50).default([]),
  contradicting_evidence: z.array(z.string().max(1000)).max(50).default([]),
  falsifiability_score: ConfidenceSchema.optional(),
  competition_results: z.record(z.unknown()).optional(),
  status: HypothesisStatusSchema.default('active'),
  created_at: TimestampSchema.optional(),
  updated_at: TimestampSchema.optional()
});

export const HypothesisCreateSchema = HypothesisSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

/**
 * Knowledge Gap Schema
 */
export const KnowledgeGapSchema = z.object({
  id: UUIDSchema.optional(),
  session_id: UUIDSchema,
  gap_type: z.string().min(1).max(100),
  description: z.string().min(10).max(2000).trim(),
  priority: PrioritySchema,
  fillability: ConfidenceSchema,
  related_nodes: z.array(z.string().min(1).max(255)).max(100).optional(),
  research_recommendations: z.array(z.string().max(1000)).max(20).default([]),
  status: KnowledgeGapStatusSchema.default('identified'),
  created_at: TimestampSchema.optional(),
  updated_at: TimestampSchema.optional()
});

export const KnowledgeGapCreateSchema = KnowledgeGapSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

/**
 * Research Collaboration Schema
 */
export const ResearchCollaborationSchema = z.object({
  id: UUIDSchema.optional(),
  session_id: UUIDSchema,
  collaborator_id: UUIDSchema,
  role: CollaborationRoleSchema,
  invited_by: UUIDSchema.optional(),
  invited_at: TimestampSchema.optional(),
  accepted_at: TimestampSchema.optional(),
  status: CollaborationStatusSchema.default('pending')
});

export const ResearchCollaborationCreateSchema = ResearchCollaborationSchema.omit({
  id: true,
  invited_at: true,
  accepted_at: true
});

/**
 * API Credentials Schema
 */
export const APICredentialsSchema = z.object({
  id: UUIDSchema.optional(),
  user_id: UUIDSchema,
  provider: z.string().min(1).max(50),
  encrypted_api_key: z.string().min(10), // Encrypted, so minimum length check
  key_name: z.string().min(1).max(255).optional(),
  usage_limits: z.record(z.unknown()).optional(),
  is_active: z.boolean().default(true),
  created_at: TimestampSchema.optional(),
  updated_at: TimestampSchema.optional(),
  last_used_at: TimestampSchema.optional()
});

export const APICredentialsCreateSchema = APICredentialsSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  last_used_at: true
});

/**
 * Performance Metrics Schema
 */
export const PerformanceMetricsSchema = z.object({
  id: UUIDSchema.optional(),
  session_id: UUIDSchema,
  operation_type: z.string().min(1).max(100),
  execution_time_ms: z.number().int().min(0).max(3600000), // Max 1 hour
  memory_usage_mb: z.number().min(0).max(32000).optional(), // Max 32GB
  cpu_usage_percent: z.number().min(0).max(100).optional(),
  throughput: z.number().min(0).optional(),
  error_count: z.number().int().min(0).max(10000).default(0),
  success_count: z.number().int().min(0).max(10000).default(1),
  created_at: TimestampSchema.optional()
});

export const PerformanceMetricsCreateSchema = PerformanceMetricsSchema.omit({
  id: true,
  created_at: true
});

/**
 * Error Log Schema
 */
export const ErrorLogSchema = z.object({
  id: UUIDSchema.optional(),
  session_id: UUIDSchema.optional(),
  user_id: UUIDSchema.optional(),
  error_type: z.string().min(1).max(100),
  error_code: z.string().max(50).optional(),
  error_message: z.string().min(1).max(5000).trim(),
  stack_trace: z.string().max(10000).optional(),
  context: z.record(z.unknown()).optional(),
  severity: ErrorSeveritySchema,
  resolved: z.boolean().default(false),
  resolved_at: TimestampSchema.optional(),
  created_at: TimestampSchema.optional()
});

export const ErrorLogCreateSchema = ErrorLogSchema.omit({
  id: true,
  created_at: true
});

/**
 * Export History Schema
 */
export const ExportHistorySchema = z.object({
  id: UUIDSchema.optional(),
  session_id: UUIDSchema,
  user_id: UUIDSchema,
  export_type: z.string().min(1).max(50),
  export_format: z.string().min(1).max(50),
  file_size_bytes: z.number().int().min(0).max(1073741824).optional(), // Max 1GB
  download_count: z.number().int().min(0).max(10000).default(0),
  storage_url: URLSchema,
  created_at: TimestampSchema.optional(),
  expires_at: TimestampSchema.optional()
});

export const ExportHistoryCreateSchema = ExportHistorySchema.omit({
  id: true,
  created_at: true
});

/**
 * Activity Log Schema
 */
export const ActivityLogSchema = z.object({
  id: UUIDSchema.optional(),
  session_id: UUIDSchema,
  user_id: UUIDSchema,
  activity_type: z.string().min(1).max(100),
  activity_data: z.record(z.unknown()).optional(),
  created_at: TimestampSchema.optional()
});

export const ActivityLogCreateSchema = ActivityLogSchema.omit({
  id: true,
  created_at: true
});

/**
 * Validation utility functions
 */
export const validateAndSanitize = <T>(data: unknown, schema: z.ZodSchema<T>): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Validation failed: ${issues.join(', ')}`);
    }
    throw error;
  }
};

export const createValidationWrapper = <T, U>(
  createSchema: z.ZodSchema<T>,
  updateSchema: z.ZodSchema<U>
) => {
  return {
    validateCreate: (data: unknown): T => validateAndSanitize(data, createSchema),
    validateUpdate: (data: unknown): U => validateAndSanitize(data, updateSchema),
    validatePartialUpdate: (data: unknown): Partial<U> => validateAndSanitize(data, updateSchema.partial())
  };
};

// Export type definitions for TypeScript
export type ProfileType = z.infer<typeof ProfileSchema>;
export type ProfileUpdateType = z.infer<typeof ProfileUpdateSchema>;
export type ResearchSessionType = z.infer<typeof ResearchSessionSchema>;
export type ResearchSessionCreateType = z.infer<typeof ResearchSessionCreateSchema>;
export type ResearchSessionUpdateType = z.infer<typeof ResearchSessionUpdateSchema>;
export type GraphNodeType = z.infer<typeof GraphNodeSchema>;
export type GraphNodeCreateType = z.infer<typeof GraphNodeCreateSchema>;
export type GraphEdgeType = z.infer<typeof GraphEdgeSchema>;
export type GraphEdgeCreateType = z.infer<typeof GraphEdgeCreateSchema>;
export type StageExecutionType = z.infer<typeof StageExecutionSchema>;
export type StageExecutionCreateType = z.infer<typeof StageExecutionCreateSchema>;
export type HypothesisType = z.infer<typeof HypothesisSchema>;
export type HypothesisCreateType = z.infer<typeof HypothesisCreateSchema>;
export type KnowledgeGapType = z.infer<typeof KnowledgeGapSchema>;
export type KnowledgeGapCreateType = z.infer<typeof KnowledgeGapCreateSchema>;
export type PerformanceMetricsType = z.infer<typeof PerformanceMetricsSchema>;
export type PerformanceMetricsCreateType = z.infer<typeof PerformanceMetricsCreateSchema>;
export type ErrorLogType = z.infer<typeof ErrorLogSchema>;
export type ErrorLogCreateType = z.infer<typeof ErrorLogCreateSchema>;