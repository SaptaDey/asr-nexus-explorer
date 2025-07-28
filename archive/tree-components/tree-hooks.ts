/**
 * tree-hooks.ts - Main entry point for tree visualization hooks
 * Re-exports focused hooks for backward compatibility
 */

// Re-export data transformation hooks
export { useTreeScene } from './useTreeData';
export type { TreeNode, BotanicalProperties } from './useTreeData';

// Re-export animation hooks  
export { useStageAnimation } from './useTreeAnimations';

// Re-export performance monitoring hooks
export { usePerformanceMonitor } from './useTreePerformance';