// Stage Execution Logic
import { useCallback } from 'react';
import { toast } from "sonner";
import { APICredentials, GraphData, ResearchContext } from '@/types/asrGotTypes';
import {
  initializeGraph,
  decomposeTask,
  generateHypotheses,
  integrateEvidence,
  pruneMergeNodes,
  extractSubgraphs,
  composeResults,
  performReflection,
  generateFinalAnalysis,
  StageExecutorContext
} from '@/services/stageExecutors';

interface UseStageExecutionProps {
  apiKeys: APICredentials;
  graphData: GraphData;
  researchContext: ResearchContext;
  stageResults: string[];
  isProcessing: boolean;
  setGraphData: (data: GraphData | ((prev: GraphData) => GraphData)) => void;
  setResearchContext: (context: ResearchContext | ((prev: ResearchContext) => ResearchContext)) => void;
  setIsProcessing: (processing: boolean) => void;
  updateStageResults: (stageIndex: number, result: string) => void;
  setFinalReport: (report: string) => void;
  advanceStage: () => void;
  currentStage: number;
}

export const useStageExecution = ({
  apiKeys,
  graphData,
  researchContext,
  stageResults,
  isProcessing,
  setGraphData,
  setResearchContext,
  setIsProcessing,
  updateStageResults,
  setFinalReport,
  advanceStage,
  currentStage
}: UseStageExecutionProps) => {
  
  // Create context for stage executors
  const createStageContext = useCallback((): StageExecutorContext => ({
    apiKeys,
    graphData,
    researchContext,
    stageResults,
    setGraphData,
    setResearchContext
  }), [apiKeys, graphData, researchContext, stageResults, setGraphData, setResearchContext]);

  // ASR-GoT 8-Stage Execution Engine
  const executeStage = useCallback(async (stageIndex: number, input?: any) => {
    if (!apiKeys.gemini) {
      toast.error('Please configure Gemini API key first');
      return;
    }

    if (isProcessing) {
      toast.warning('Another stage is currently processing. Please wait.');
      return;
    }

    setIsProcessing(true);
    
    try {
      let result = '';
      const context = createStageContext();
      
      switch (stageIndex) {
        case 0: // Initialization
          result = await initializeGraph(input, context);
          break;
        case 1: // Decomposition
          result = await decomposeTask(input, context);
          break;
        case 2: // Hypothesis/Planning
          result = await generateHypotheses(input, context);
          break;
        case 3: // Evidence Integration
          result = await integrateEvidence(input, context);
          break;
        case 4: // Pruning/Merging
          result = await pruneMergeNodes(context);
          break;
        case 5: // Subgraph Extraction
          result = await extractSubgraphs(context);
          break;
        case 6: // Composition
          result = await composeResults(context);
          break;
        case 7: // Reflection
          result = await performReflection(context);
          break;
        case 8: // Final Comprehensive Analysis
          result = await generateFinalAnalysis(context);
          setFinalReport(result);
          break;
      }
      
      updateStageResults(stageIndex, result);
      
      toast.success(`Stage ${stageIndex + 1} completed successfully`);
      
      // Update stage progress after successful execution
      if (stageIndex === currentStage) {
        // Advance stage immediately after completion
        advanceStage();
      }
    } catch (error) {
      toast.error(`Error in stage ${stageIndex + 1}: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  }, [apiKeys, isProcessing, createStageContext, updateStageResults, setFinalReport, advanceStage, currentStage, setIsProcessing]);

  return {
    executeStage
  };
};