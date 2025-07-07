// Main ASR-GoT Hook - Orchestrates all functionality
import { useEffect, useState } from 'react';
import { AsrGotStageEngine } from '@/services/AsrGotStageEngine';
import { useASRGoTState } from './useASRGoTState';
import { useAPICredentials } from './useAPICredentials';
import { useStageExecution } from './useStageExecution';
import { useExportFunctionality } from './useExportFunctionality';

// Re-export types for other components
export type { GraphData, ASRGoTParameters } from '@/types/asrGotTypes';

export const useASRGoT = () => {
  const stateHook = useASRGoTState();
  const credentialsHook = useAPICredentials();
  const [stageEngine, setStageEngine] = useState<AsrGotStageEngine | null>(null);

  const stageExecutionHook = useStageExecution({
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
    
    // Actions
    executeStage: stageExecutionHook.executeStage,
    resetFramework: stateHook.resetFramework,
    setParameters: stateHook.setParameters,
    updateApiKeys: credentialsHook.updateApiKeys,
    exportResults: exportHook.exportResults,
    advanceStage: stateHook.advanceStage,
    
    // Computed
    isComplete: stateHook.isComplete,
    hasResults: stateHook.hasResults,
    canExportHtml: stateHook.canExportHtml
  };
};