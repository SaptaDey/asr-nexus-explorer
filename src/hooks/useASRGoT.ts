
import { useState, useCallback, useEffect } from 'react';
import { toast } from "sonner";
import { GraphData, GraphNode, GraphEdge, ASRGoTParameters, APICredentials, StageExecutionContext, ResearchContext } from '@/types/asrGotTypes';
import { completeASRGoTParameters } from '@/config/asrGotParameters';
import { backgroundProcessor, queuePerplexityCall, queueGeminiCall, getTaskResult } from '@/utils/backgroundProcessor';
import { AsrGotStageEngine } from '@/services/AsrGotStageEngine';

// Re-export types for other components
export type { GraphData, GraphNode, GraphEdge, ASRGoTParameters } from '@/types/asrGotTypes';

// Types are now imported from centralized type definitions

const defaultParameters: ASRGoTParameters = completeASRGoTParameters;

export const useASRGoT = () => {
  const [currentStage, setCurrentStage] = useState(0);
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    edges: [],
    metadata: {
      version: '1.0',
      created: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      stage: 0,
      total_nodes: 0,
      total_edges: 0,
      graph_metrics: {}
    }
  });
  const [parameters, setParameters] = useState<ASRGoTParameters>(completeASRGoTParameters);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKeys, setApiKeys] = useState<APICredentials>({ perplexity: '', gemini: '' });
  const [stageResults, setStageResults] = useState<string[]>([]);
  const [researchContext, setResearchContext] = useState<ResearchContext>({
    field: '',
    topic: '',
    objectives: [],
    hypotheses: [],
    constraints: [],
    biases_detected: [],
    knowledge_gaps: [],
    auto_generated: true
  });
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

  // ASR-GoT 8-Stage Execution Engine
  const executeStage = useCallback(async (stageIndex: number, input?: any) => {
    if (!stageEngine) {
      toast.error('ASR-GoT Stage Engine not initialized. Please configure API keys.');
      return;
    }

    if (isProcessing) {
      toast.warning('Another stage is currently processing. Please wait.');
      return;
    }

    setIsProcessing(true);
    
    try {
      let result;
      
      switch (stageIndex) {
        case 0: // Stage 1: Initialization
          if (!input) {
            toast.error('Research question required for initialization');
            return;
          }
          result = await stageEngine.executeStage1(input);
          setGraphData(result.graph);
          setResearchContext(result.context);
          setStageResults(prev => [...prev, result.result]);
          setCurrentStage(1);
          toast.success('Stage 1: Initialization complete - Field auto-detected');
          break;

        default:
          // Auto-advance through remaining stages
          if (stageIndex >= 8) {
            toast.info('All ASR-GoT stages completed. Framework execution terminated.');
            return;
          }
          break;
      }

    } catch (error) {
      console.error(`Stage ${stageIndex + 1} execution failed:`, error);
      toast.error(`Stage ${stageIndex + 1} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  }, [stageEngine, isProcessing, currentStage, stageResults]);

  const resetFramework = useCallback(() => {
    setCurrentStage(0);
    setGraphData({
      nodes: [],
      edges: [],
      metadata: {
        version: '1.0',
        created: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        stage: 0,
        total_nodes: 0,
        total_edges: 0,
        graph_metrics: {}
      }
    });
    setStageResults([]);
    setResearchContext({
      field: '',
      topic: '',
      objectives: [],
      hypotheses: [],
      constraints: [],
      biases_detected: [],
      knowledge_gaps: [],
      auto_generated: true
    });
    setFinalReport('');
    setStageEngine(null);
    toast.info('ASR-GoT Framework reset. Ready for new research.');
  }, []);

  const updateApiKeys = useCallback((newKeys: APICredentials) => {
    setApiKeys(newKeys);
    sessionStorage.setItem('asr-got-credentials', JSON.stringify(newKeys));
    toast.success('API credentials cached securely');
  }, []);

  const exportResults = useCallback(() => {
    if (stageResults.length === 0) {
      toast.warning('No results to export yet');
      return;
    }

    const exportData = {
      metadata: {
        exported_at: new Date().toISOString(),
        framework_version: 'ASR-GoT v2025.07.07',
        stages_completed: stageResults.length,
        total_nodes: graphData.nodes.length,
        total_edges: graphData.edges.length
      },
      research_context: researchContext,
      graph_data: graphData,
      stage_results: stageResults,
      final_report: finalReport,
      parameters_used: parameters
    };

    const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(jsonBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ASR-GoT-Analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('ASR-GoT analysis exported successfully');
  }, [stageResults, graphData, researchContext, finalReport, parameters]);

  // Load cached credentials on mount
  useEffect(() => {
    const cached = sessionStorage.getItem('asr-got-credentials');
    if (cached) {
      try {
        const credentials = JSON.parse(cached);
        setApiKeys(credentials);
      } catch (error) {
        console.warn('Failed to load cached credentials');
      }
    }
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
