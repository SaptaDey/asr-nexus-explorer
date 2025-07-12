/**
 * Cost-Aware Stage Execution Hook
 * Integrates the tri-model orchestration system with ASR-GoT stage execution
 */

import { useCallback } from 'react';
import { toast } from "sonner";
import { APICredentials, GraphData, ResearchContext } from '@/types/asrGotTypes';
import { costAwareOrchestration } from '@/services/CostAwareOrchestrationService';
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
  generateIntegratedFinalReport,
  StageExecutorContext
} from '@/services/stageExecutors';

interface UseCostAwareStageExecutionProps {
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

export const useCostAwareStageExecution = ({
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
}: UseCostAwareStageExecutionProps) => {
  
  // Map stage numbers to detailed stage names for cost orchestration (per Cost-Aware-Orchestration.md)
  const stageMapping = {
    0: '1_initialization',
    1: '2_decomposition', 
    2: '3A_hypothesis_generation', // Will also trigger 3B and 3C
    3: '4_1_evidence_harvest_web', // Will also trigger 4.2, 4.3, 4.4
    4: '5A_prune_merge_reasoning', // Will also trigger 5B
    5: '6A_subgraph_metrics', // Will also trigger 6B
    6: '7_narrative_composition',
    7: '8A_audit_script', // Will also trigger 8B
    8: '9_final_analysis',
    9: '10A_figure_collection' // Will also trigger 10B and 10C - Final Report Integration
  };

  // Create enhanced context with cost-aware orchestration
  const createStageContext = useCallback((): StageExecutorContext => {
    // Defensive check for apiKeys
    if (!apiKeys) {
      console.error('createStageContext: apiKeys is undefined!', { apiKeys });
      throw new Error('API credentials are not available. Please configure your API keys first.');
    }
    
    return {
      apiKeys,
      graphData,
      researchContext,
      stageResults,
      setGraphData,
      setResearchContext,
      routeApiCall: async (prompt: string, additionalParams?: any) => {
        const stageName = stageMapping[currentStage as keyof typeof stageMapping];
        if (!stageName) {
          throw new Error(`Unknown stage: ${currentStage}`);
        }
        
        // Check if Perplexity key is needed for evidence harvest stages
        if (stageName.includes('evidence_harvest') && !apiKeys.perplexity) {
          throw new Error('PERPLEXITY_KEY_REQUIRED');
        }
        
        // **STAGE 1 BYPASS**: Use direct API for Stage 1 to avoid any Cost-Aware Orchestration issues
        if (currentStage === 0) {
          console.log(`🎯 Direct API call for Stage 1 (bypassing cost-aware orchestration)`, { 
            promptLength: prompt.length, 
            hasGeminiKey: !!apiKeys.gemini,
            additionalParams 
          });
          
          const { callGeminiAPI } = await import('@/services/apiService');
          const result = await callGeminiAPI(
            prompt, 
            apiKeys.gemini, 
            'thinking-only', // Use thinking-only instead of thinking-structured to avoid schema issues
            undefined, // No schema to avoid the 400 error
            { 
              maxTokens: additionalParams?.maxTokens || 2000, // Increased from 500 to 2000 to avoid MAX_TOKENS truncation
              stageId: additionalParams?.stageId || 'stage1_bypass',
              temperature: 0.1
            }
          );
          
          console.log(`✅ Direct API call successful for Stage 1`, { 
            resultLength: typeof result === 'string' ? result.length : 'non-string' 
          });
          
          return result;
        }
        
        try {
          console.log(`🎯 Routing API call for stage: ${stageName}`, { 
            promptLength: prompt.length, 
            hasGeminiKey: !!apiKeys.gemini,
            additionalParams 
          });
          
          const result = await costAwareOrchestration.routeApiCall(
            stageName,
            prompt,
            apiKeys,
            additionalParams
          );
          
          console.log(`✅ API call successful for stage: ${stageName}`, { 
            resultLength: typeof result === 'string' ? result.length : 'non-string' 
          });
          
          return result;
        } catch (error: any) {
          console.error(`❌ Cost-aware routing failed for stage ${stageName}:`, error);
          console.log(`🔄 Falling back to direct Gemini API for stage: ${stageName}`);
          
          // Fallback to direct API call if routing fails
          const { callGeminiAPI } = await import('@/services/apiService');
          return await callGeminiAPI(
            prompt, 
            apiKeys.gemini, 
            'thinking-only', // Use thinking-only to avoid schema issues
            undefined, // No schema to avoid errors
            { 
              maxTokens: additionalParams?.maxTokens || 8000, // Increased token limit for fallback
              stageId: additionalParams?.stageId || 'fallback',
              temperature: 0.1
            }
          );
        }
      }
    };
  }, [apiKeys, graphData, researchContext, stageResults, currentStage, setGraphData, setResearchContext]);

  // Enhanced stage execution with cost-aware routing
  const executeStage = useCallback(async (stageIndex: number, input?: any) => {
    if (isProcessing) {
      toast.warning('Processing in progress, please wait...');
      return;
    }

    if (!apiKeys.gemini) {
      toast.error('Gemini API key is required to execute stages');
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log(`🚀 Starting stage execution: ${stageIndex + 1}`, { stageIndex, input });
      
      // For Stage 1 (Initialization), set the research topic from input
      if (stageIndex === 0 && input && typeof input === 'string') {
        console.log(`📝 Setting research topic for Stage 1: ${input}`);
        setResearchContext(prev => ({
          ...prev,
          topic: input,
          field: '',
          objectives: [],
          hypotheses: [],
          constraints: [],
          biases_detected: [],
          knowledge_gaps: [],
          auto_generated: false
        }));
      }
      
      console.log(`🔧 Creating stage context for stage ${stageIndex + 1}`);
      const context = createStageContext();
      let result = '';
      
      // Get estimated cost for this stage
      const stageName = stageMapping[stageIndex as keyof typeof stageMapping];
      const stageAssignment = costAwareOrchestration.getStageModelAssignment(stageName);
      
      console.log(`💰 Stage assignment for ${stageName}:`, stageAssignment);
      
      if (stageAssignment) {
        toast.info(`Executing ${stageName} with ${stageAssignment.modelCapability.model} (Est. $${stageAssignment.costEstimate.priceUSD.toFixed(4)})`);
      }

      switch (stageIndex) {
        case 0: // Initialization
          console.log(`🔬 Starting Stage 1 Initialization`);
          // Use the input topic if provided, otherwise fall back to existing research context
          const topicToUse = (stageIndex === 0 && input && typeof input === 'string') 
            ? input 
            : researchContext.topic;
          console.log(`📋 Research topic: ${topicToUse}`);
          result = await initializeGraph(topicToUse, context);
          console.log(`📊 Initialization result length: ${result.length}`);
          setGraphData(prev => ({ ...prev, stage: 'initialization' }));
          break;
          
        case 1: // Decomposition
          result = await decomposeTask(undefined, context);
          setGraphData(prev => ({ ...prev, stage: 'decomposition' }));
          break;
          
        case 2: // Hypothesis Generation
          result = await generateHypotheses(undefined, context);
          setGraphData(prev => ({ ...prev, stage: 'hypothesis_generation' }));
          break;
          
        case 3: // Evidence Integration
          try {
            result = await integrateEvidence(undefined, context);
            setGraphData(prev => ({ ...prev, stage: 'evidence_integration' }));
          } catch (error: any) {
            if (error.message === 'PERPLEXITY_KEY_REQUIRED') {
              toast.error('Perplexity API key required for evidence harvesting. Please configure Sonar Deep Research.');
              throw error;
            }
            throw error;
          }
          break;
          
        case 4: // Pruning and Merging
          result = await pruneMergeNodes(context);
          setGraphData(prev => ({ ...prev, stage: 'pruning_merging' }));
          break;
          
        case 5: // Subgraph Extraction
          result = await extractSubgraphs(context);
          setGraphData(prev => ({ ...prev, stage: 'subgraph_extraction' }));
          break;
          
        case 6: // Composition
          result = await composeResults(context);
          setGraphData(prev => ({ ...prev, stage: 'composition' }));
          break;
          
        case 7: // Reflection
          result = await performReflection(context);
          setGraphData(prev => ({ ...prev, stage: 'reflection' }));
          break;
          
        case 8: // Final Analysis
          result = await generateFinalAnalysis(context);
          setGraphData(prev => ({ ...prev, stage: 'final_analysis' }));
          setFinalReport(result);
          break;

        case 9: // Stage 10: Final Report Integration with Figures
          // This will be called externally with figure data
          result = `Stage 10 ready for final report integration with figures and analytics.
                   Call generateIntegratedFinalReport() with figure data to complete.`;
          setGraphData(prev => ({ ...prev, stage: 'report_integration_ready' }));
          break;
          
        default:
          throw new Error(`Unknown stage: ${stageIndex}`);
      }

      console.log(`✅ Stage ${stageIndex + 1} execution completed successfully`, { 
        resultLength: result.length, 
        stageIndex 
      });
      
      updateStageResults(stageIndex, result);
      
      // **CRITICAL FIX**: Auto-advance stage after successful completion
      if (stageIndex < 8) { // Don't advance past stage 9 (index 8)
        console.log(`⏭️ Auto-advancing from stage ${stageIndex + 1} to ${stageIndex + 2} in 1 second`);
        setTimeout(() => {
          console.log(`🔄 Advancing stage from ${stageIndex + 1} to ${stageIndex + 2}`);
          advanceStage();
        }, 1000); // 1 second delay to show completion message
      } else {
        console.log(`🏁 Final stage ${stageIndex + 1} completed - no auto-advance`);
      }
      
      // Show cost information after successful execution
      const costDashboard = costAwareOrchestration.getCostDashboard();
      toast.success(`Stage ${stageIndex + 1} completed! Total session cost: $${costDashboard.totalCost.toFixed(4)}`);
      console.log(`💰 Stage ${stageIndex + 1} cost dashboard:`, costDashboard);
      
    } catch (error: any) {
      console.error(`Stage ${stageIndex + 1} execution failed:`, error);
      
      if (error.message === 'PERPLEXITY_KEY_REQUIRED') {
        toast.error('Please configure Perplexity API key for Sonar Deep Research to continue');
      } else {
        toast.error(`Stage ${stageIndex + 1} failed: ${error.message}`);
      }
      
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [
    isProcessing,
    apiKeys,
    createStageContext,
    setIsProcessing,
    setGraphData,
    updateStageResults,
    advanceStage,
    setFinalReport
  ]);

  return {
    executeStage,
    getCostDashboard: () => costAwareOrchestration.getCostDashboard(),
    getEstimatedTotalCost: () => costAwareOrchestration.getEstimatedTotalCost(),
    resetCostTracking: () => costAwareOrchestration.resetCostTracking()
  };
};