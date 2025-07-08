// Core ASR-GoT State Management
import { useState, useCallback } from 'react';
import { GraphData, ASRGoTParameters, ResearchContext } from '@/types/asrGotTypes';
import { completeASRGoTParameters } from '@/config/asrGotParameters';
import { createInitialGraphData, createInitialResearchContext } from '@/utils/asrGotUtils';
import { toast } from "sonner";

export const useASRGoTState = () => {
  const [currentStage, setCurrentStage] = useState(0);
  const [graphData, setGraphData] = useState<GraphData>(createInitialGraphData);
  const [parameters, setParameters] = useState<ASRGoTParameters>(completeASRGoTParameters);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stageResults, setStageResults] = useState<string[]>([]);
  const [researchContext, setResearchContext] = useState<ResearchContext>(createInitialResearchContext);
  const [finalReport, setFinalReport] = useState<string>('');

  // Manual stage advancement
  const advanceStage = useCallback(() => {
    if (currentStage < 8) {
      setCurrentStage(prev => prev + 1);
    }
  }, [currentStage]);

  const resetFramework = useCallback(() => {
    setCurrentStage(0);
    setGraphData(createInitialGraphData());
    setStageResults([]);
    setResearchContext(createInitialResearchContext());
    setFinalReport('');
    toast.info('ASR-GoT Framework reset. Ready for new research.');
  }, []);

  const updateStageResults = useCallback((stageIndex: number, result: string) => {
    setStageResults(prev => {
      const newResults = [...prev];
      newResults[stageIndex] = result;
      return newResults;
    });
  }, []);

  const stageProgress = stageResults.length > 0 ? ((currentStage + 1) / 9) * 100 : 0;

  return {
    // State
    currentStage,
    graphData,
    parameters,
    isProcessing,
    stageResults,
    researchContext,
    finalReport,
    stageProgress,
    
    // Setters
    setCurrentStage,
    setGraphData,
    setParameters,
    setIsProcessing,
    setStageResults,
    setResearchContext,
    setFinalReport,
    
    // Actions
    advanceStage,
    resetFramework,
    updateStageResults,
    
    // Computed
    isComplete: currentStage >= 8,
    hasResults: stageResults.length > 0,
    canExportHtml: finalReport.length > 0
  };
};