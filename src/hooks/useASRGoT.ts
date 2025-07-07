
import { useState, useCallback, useEffect } from 'react';
import { toast } from "sonner";
import { GraphData, ASRGoTParameters, APICredentials, ResearchContext } from '@/types/asrGotTypes';
import { completeASRGoTParameters } from '@/config/asrGotParameters';
import { AsrGotStageEngine } from '@/services/AsrGotStageEngine';
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
import {
  createInitialGraphData,
  createInitialResearchContext,
  exportResultsAsMarkdown,
  exportResultsAsJSON,
  loadApiKeysFromStorage,
  saveApiKeysToStorage
} from '@/utils/asrGotUtils';

// Re-export types for other components
export type { GraphData, ASRGoTParameters } from '@/types/asrGotTypes';

export const useASRGoT = () => {
  const [currentStage, setCurrentStage] = useState(0);
  const [graphData, setGraphData] = useState<GraphData>(createInitialGraphData);
  const [parameters, setParameters] = useState<ASRGoTParameters>(completeASRGoTParameters);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKeys, setApiKeys] = useState<APICredentials>({ perplexity: '', gemini: '' });
  const [stageResults, setStageResults] = useState<string[]>([]);
  const [researchContext, setResearchContext] = useState<ResearchContext>(createInitialResearchContext);
  const [stageEngine, setStageEngine] = useState<AsrGotStageEngine | null>(null);
  const [finalReport, setFinalReport] = useState<string>('');

  // Initialize Stage Engine when API keys are available
  useEffect(() => {
    if (apiKeys.perplexity && apiKeys.gemini && !stageEngine) {
      const engine = new AsrGotStageEngine(apiKeys, graphData);
      setStageEngine(engine);
    }
  }, [apiKeys, graphData, stageEngine]);

  const stageProgress = ((currentStage + 1) / 9) * 100;

  // Create context for stage executors
  const createStageContext = useCallback((): StageExecutorContext => ({
    apiKeys,
    graphData,
    researchContext,
    stageResults,
    setGraphData,
    setResearchContext
  }), [apiKeys, graphData, researchContext, stageResults]);

  // ASR-GoT 8-Stage Execution Engine
  const executeStage = useCallback(async (stageIndex: number, input?: any) => {
    if (!apiKeys.perplexity || !apiKeys.gemini) {
      toast.error('Please configure API keys first');
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
      
      setStageResults(prev => {
        const newResults = [...prev];
        newResults[stageIndex] = result;
        return newResults;
      });
      
      if (stageIndex === currentStage) {
        setCurrentStage(prev => Math.min(prev + 1, 8));
      }
      
      // Note: Manual stage progression - no automatic jumping
      
      toast.success(`Stage ${stageIndex + 1} completed successfully`);
    } catch (error) {
      toast.error(`Error in stage ${stageIndex + 1}: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  }, [apiKeys, isProcessing, currentStage, stageResults, createStageContext]);

  const resetFramework = useCallback(() => {
    setCurrentStage(0);
    setGraphData(createInitialGraphData());
    setStageResults([]);
    setResearchContext(createInitialResearchContext());
    setFinalReport('');
    setStageEngine(null);
    toast.info('ASR-GoT Framework reset. Ready for new research.');
  }, []);

  const updateApiKeys = useCallback((newKeys: APICredentials) => {
    setApiKeys(newKeys);
    saveApiKeysToStorage(newKeys);
    toast.success('API credentials cached securely');
  }, []);

  const exportResults = useCallback(() => {
    if (stageResults.length === 0) {
      toast.warning('No results to export yet');
      return;
    }

    exportResultsAsJSON(stageResults, graphData, researchContext, finalReport, parameters);
    toast.success('ASR-GoT analysis exported successfully');
  }, [stageResults, graphData, researchContext, finalReport, parameters]);

  // Load cached credentials on mount
  useEffect(() => {
    const credentials = loadApiKeysFromStorage();
    setApiKeys(credentials);
  }, []);

  return {
    currentStage,
    graphData,
    parameters,
    stageProgress,
    isProcessing,
    apiKeys,
    stageResults,
    researchContext,
    finalReport,
    executeStage,
    resetFramework,
    setParameters,
    updateApiKeys,
    exportResults,
    isComplete: currentStage >= 8,
    hasResults: stageResults.length > 0,
    canExportHtml: finalReport.length > 0
  };
};
