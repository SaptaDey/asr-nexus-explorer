/**
 * Database Services Export Index
 * Central export point for all database-related services and adapters
 */

// Core database service
export { DatabaseService, databaseService } from './DatabaseService';

// Specialized database services
export { GraphDataService, graphDataService } from './GraphDataService';

// Database adapters
export { HypothesisAdapter } from './adapters/HypothesisAdapter';
export { KnowledgeGapAdapter } from './adapters/KnowledgeGapAdapter';
export { StageEngineAdapter } from './adapters/StageEngineAdapter';
export { PerformanceAdapter } from './adapters/PerformanceAdapter';

// Unified adapter manager
export { AdapterManager, adapterManager } from './adapters/AdapterManager';

// Type exports
export type {
  DbProfile,
  DbResearchSession,
  DbGraphNode,
  DbGraphEdge,
  DbStageExecution,
  DbHypothesis,
  DbKnowledgeGap,
  DbPerformanceMetric,
  DbErrorLog
} from './DatabaseService';

export type {
  GraphSnapshot,
  GraphDiff,
  GraphAnalytics,
  GraphValidationResult
} from './GraphDataService';

export type { AdapterManagerConfig } from './adapters/AdapterManager';