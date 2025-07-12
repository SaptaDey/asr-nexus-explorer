// Main ASR-GoT Hook - Orchestrates all functionality
import { useEffect, useState } from 'react';
import { AsrGotStageEngine } from '@/services/AsrGotStageEngine';
import { useASRGoTState } from './useASRGoTState';
import { useAPICredentials } from './useAPICredentials';
import { useCostAwareStageExecution } from './useCostAwareStageExecution';
import { useExportFunctionality } from './useExportFunctionality';

// Export all hooks for external use
export * from './useASRGoTState';
export * from './useCostAwareStageExecution';
export * from './useAPICredentials';
export * from './useProcessingMode';

// Re-export types for other components
export type { GraphData, ASRGoTParameters } from '@/types/asrGotTypes';

export const useASRGoT = () => {
  const stateHook = useASRGoTState();
  const credentialsHook = useAPICredentials();
  const [stageEngine, setStageEngine] = useState<AsrGotStageEngine | null>(null);
  const [autoMode, setAutoMode] = useState(false);

  const stageExecutionHook = useCostAwareStageExecution({
    apiKeys: credentialsHook.apiKeys,
    graphData: stateHook.graphData,
    researchContext: stateHook.researchContext,
    stageResults: stateHook.stageResults,
    isProcessing: stateHook.isProcessing,
    setGraphData: stateHook.setGraphData,
    setResearchContext: stateHook.setResearchContext,
    setIsProcessing: stateHook.setIsProcessing,
    updateStageResults: stateHook.updateStageResults,
    setFinalReport: stateHook.setFinalReport,
    advanceStage: stateHook.advanceStage,
    currentStage: stateHook.currentStage
  });

  // Auto-execute next stage in auto mode
  useEffect(() => {
    if (autoMode && 
        !stateHook.isProcessing && 
        stateHook.currentStage >= 1 && // **FIX**: Include stage 1 (after initialization)
        stateHook.currentStage < 9 &&
        credentialsHook.apiKeys.gemini) {
      
      // Auto-execute next stage after 2 second delay
      const timer = setTimeout(() => {
        stageExecutionHook.executeStage(stateHook.currentStage);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [autoMode, stateHook.isProcessing, stateHook.currentStage, credentialsHook.apiKeys.gemini]);

  // Enhanced executeStage with auto mode support
  const executeStageWithAutoMode = async (stageIndex: number, input?: any, enableAutoMode = false) => {
    if (enableAutoMode) {
      setAutoMode(true);
    }
    return stageExecutionHook.executeStage(stageIndex, input);
  };

  const exportHook = useExportFunctionality({
    stageResults: stateHook.stageResults,
    graphData: stateHook.graphData,
    researchContext: stateHook.researchContext,
    finalReport: stateHook.finalReport,
    parameters: stateHook.parameters
  });

  // Initialize Stage Engine when API keys are available
  useEffect(() => {
    if (credentialsHook.apiKeys.gemini && !stageEngine) {
      const engine = new AsrGotStageEngine(credentialsHook.apiKeys, stateHook.graphData);
      setStageEngine(engine);
    }
  }, [credentialsHook.apiKeys, stateHook.graphData, stageEngine]);

  // Reset auto mode when framework is reset
  const resetFrameworkWithAutoMode = () => {
    setAutoMode(false);
    stateHook.resetFramework();
  };

  return {
    // State
    currentStage: stateHook.currentStage,
    graphData: stateHook.graphData,
    parameters: stateHook.parameters,
    stageProgress: stateHook.stageProgress,
    isProcessing: stateHook.isProcessing,
    apiKeys: credentialsHook.apiKeys,
    stageResults: stateHook.stageResults,
    researchContext: stateHook.researchContext,
    finalReport: stateHook.finalReport,
    autoMode,
    
    // Actions
    executeStage: executeStageWithAutoMode,
    resetFramework: resetFrameworkWithAutoMode,
    setParameters: stateHook.setParameters,
    updateApiKeys: credentialsHook.updateApiKeys,
    exportResults: exportHook.exportResults,
    advanceStage: stateHook.advanceStage,
    setAutoMode,
    
    // Computed
    isComplete: stateHook.isComplete,
    hasResults: stateHook.hasResults,
    canExportHtml: stateHook.canExportHtml
  };
};