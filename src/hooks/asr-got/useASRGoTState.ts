// Core ASR-GoT State Management
import { useState, useCallback, useEffect } from 'react';
import { GraphData, ASRGoTParameters, ResearchContext } from '@/types/asrGotTypes';
import { completeASRGoTParameters } from '@/config/asrGotParameters';
import { createInitialGraphData, createInitialResearchContext } from '@/utils/asrGotUtils';
import { eventBroadcaster } from '@/services/EventBroadcaster';
import { toast } from "sonner";

export const useASRGoTState = () => {
  const [currentStage, setCurrentStage] = useState(0);
  const [graphData, setGraphData] = useState<GraphData>(createInitialGraphData);
  const [parameters, setParameters] = useState<ASRGoTParameters>(completeASRGoTParameters);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stageResults, setStageResults] = useState<string[]>([]);
  const [researchContext, setResearchContext] = useState<ResearchContext>(createInitialResearchContext);
  const [finalReport, setFinalReport] = useState<string>('');
  const [previousGraphData, setPreviousGraphData] = useState<GraphData>(createInitialGraphData);

  // Broadcast graph updates when graph data changes
  useEffect(() => {
    if (graphData.nodes.length > 0 || graphData.edges.length > 0) {
      const changes = {
        nodesAdded: Math.max(0, graphData.nodes.length - previousGraphData.nodes.length),
        edgesAdded: Math.max(0, graphData.edges.length - previousGraphData.edges.length),
        nodesModified: 0, // Could be calculated by comparing node content
        edgesModified: 0   // Could be calculated by comparing edge content
      };

      eventBroadcaster.broadcastGraphUpdate(
        currentStage,
        graphData.nodes.length,
        graphData.edges.length,
        changes
      );

      setPreviousGraphData(graphData);
    }
  }, [graphData, currentStage, previousGraphData]);

  // Manual stage advancement
  const advanceStage = useCallback(() => {
    if (currentStage < 8) {
      const newStage = currentStage + 1;
      eventBroadcaster.broadcastStageTransition(currentStage, newStage, true);
      setCurrentStage(newStage);
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

  const stageProgress = (currentStage / 9) * 100;

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