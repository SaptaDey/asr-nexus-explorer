// Main ASR-GoT Hook - Orchestrates all functionality
import { useEffect, useState } from 'react';
import { AsrGotStageEngine } from '@/services/AsrGotStageEngine';
// Temporarily disabled imports due to architectural issues
// import { useASRGoTState } from './useASRGoTState';
import { useAPICredentials } from './useAPICredentials';
// import { useCostAwareStageExecution } from './useCostAwareStageExecution';
import { useExportFunctionality } from './useExportFunctionality';

// Export all hooks for external use
// Temporarily disabled exports
// export * from './useASRGoTState';
// export * from './useCostAwareStageExecution';
export * from './useAPICredentials';
export * from './useProcessingMode';

// Re-export types for other components
export type { GraphData, ASRGoTParameters } from '@/types/asrGotTypes';

// Temporarily simplified hook due to disabled dependencies
export const useASRGoT = () => {
  const credentialsHook = useAPICredentials();
  
  // Minimal implementation to prevent build errors
  return {
    // State
    currentStage: 0,
    graphData: { nodes: [], edges: [], metadata: { version: '1.0', created: '', last_updated: '', stage: 0, total_nodes: 0, total_edges: 0, graph_metrics: {} } },
    parameters: {},
    stageProgress: [],
    isProcessing: false,
    apiKeys: credentialsHook.apiKeys,
    stageResults: [],
    researchContext: { topic: '', field: '', objectives: [], hypotheses: [], constraints: [], biases_detected: [], knowledge_gaps: [], auto_generated: false },
    finalReport: null,
    autoMode: false,
    
    // Session management
    currentSessionId: null,
    queryHistorySessionId: null,
    
    // Actions (simplified)
    executeStage: async () => {},
    resetFramework: () => {},
    setParameters: () => {},
    updateApiKeys: credentialsHook.updateApiKeys,
    exportResults: async () => {},
    advanceStage: () => {},
    setAutoMode: () => {},
    
    // Session actions (simplified)
    createSession: async () => '',
    loadSession: async () => {},
    pauseSession: async () => {},
    resumeFromHistory: async () => {},
    completeSession: async () => {},
    
    // Auto-storage methods (simplified)
    forceSave: async () => {},
    queueFigureForSaving: () => {},
    queueTableForSaving: () => {},
    
    // Computed
    isComplete: false,
    hasResults: false,
    canExportHtml: false,
    isAutoSaveEnabled: false,
    lastSaveTime: null,
    isConnected: false
  };
};