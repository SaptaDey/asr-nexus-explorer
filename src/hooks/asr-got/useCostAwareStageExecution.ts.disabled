
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
  currentSessionId: string | null;
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
  currentStage,
  currentSessionId
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
    8: '9_final_analysis', // Will trigger 9A-9G substages
    9: '10A_figure_collection' // Will also trigger 10B and 10C - Final Report Integration
  };

  // Map substage IDs to cost orchestration stages
  const substageMapping = {
    '9A_abstract_executive': '9_final_analysis',
    '9B_introduction_literature': '9_final_analysis',
    '9C_methodology_framework': '9_final_analysis',
    '9D_results_statistical': '9_final_analysis',
    '9E_discussion_clinical': '9_final_analysis',
    '9F_conclusions_future': '9_final_analysis',
    '9G_references_appendices': '9_final_analysis'
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
      currentSessionId,
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
            promptLength: (prompt && typeof prompt === 'string') ? prompt.length : 0, 
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
              maxTokens: additionalParams?.maxTokens || 32000, // Massive increase - use 32k tokens for Stage 1 components
              stageId: additionalParams?.stageId || 'stage1_bypass',
              temperature: 0.1
            }
          );
          
          console.log(`✅ Direct API call successful for Stage 1`, { 
            resultLength: (result && typeof result === 'string') ? result.length : 'non-string' 
          });
          
          return result;
        }
        
        try {
          console.log(`🎯 Routing API call for stage: ${stageName}`, { 
            promptLength: (prompt && typeof prompt === 'string') ? prompt.length : 0, 
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
            resultLength: (result && typeof result === 'string') ? result.length : 'non-string' 
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
              maxTokens: additionalParams?.maxTokens || 32000, // Massive token limit for fallback - use full capacity
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
      
      // For Stage 1 (Initialization), ensure we have the input topic
      let contextForStage = researchContext;
      if (stageIndex === 0 && input && typeof input === 'string') {
        console.log(`📝 Using research topic for Stage 1: ${input}`);
        // Create temporary context with the topic for Stage 1
        contextForStage = {
          ...researchContext,
          topic: input,
          field: '',
          objectives: [],
          hypotheses: [],
          constraints: [],
          biases_detected: [],
          knowledge_gaps: [],
          auto_generated: false
        };
        
        // **CRITICAL FIX**: Update the research context immediately after Stage 1 input
        setResearchContext(contextForStage);
      }
      
      console.log(`🔧 Creating stage context for stage ${stageIndex + 1}`, { 
        topic: contextForStage.topic,
        hasValidTopic: !!contextForStage.topic && contextForStage.topic.trim() !== '' 
      });
      
      // Create context with the appropriate research context
      const context: StageExecutorContext = {
        apiKeys,
        graphData,
        researchContext: contextForStage, // Use the appropriate context
        stageResults,
        setGraphData,
        setResearchContext,
        currentSessionId,
        routeApiCall: async (prompt: string, additionalParams?: any) => {
          // Check if this is a substage call (9A-9G)
          const substageId = additionalParams?.stageId;
          let stageName = stageMapping[currentStage as keyof typeof stageMapping];
          
          // Handle substage routing
          if (substageId && substageMapping[substageId as keyof typeof substageMapping]) {
            stageName = substageMapping[substageId as keyof typeof substageMapping];
            console.log(`🎯 Routing substage ${substageId} to ${stageName}`);
          }
          
          if (!stageName) {
            throw new Error(`Unknown stage: ${currentStage} (substage: ${substageId})`);
          }
          
          // Check if Perplexity key is needed for evidence harvest stages
          if (stageName.includes('evidence_harvest') && !apiKeys.perplexity) {
            throw new Error('PERPLEXITY_KEY_REQUIRED');
          }
          
          // **STAGE 1 BYPASS**: Use direct API for Stage 1 to avoid any Cost-Aware Orchestration issues
          if (currentStage === 0) {
            console.log(`🎯 Direct API call for Stage 1 (bypassing cost-aware orchestration)`, { 
              promptLength: (prompt && typeof prompt === 'string') ? prompt.length : 0, 
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
                maxTokens: additionalParams?.maxTokens || 32000, // Massive increase - use 32k tokens for Stage 1 components
                stageId: additionalParams?.stageId || 'stage1_bypass',
                temperature: additionalParams?.temperature || 0.1
              }
            );
            
            console.log(`✅ Direct API call successful for Stage 1`, { 
              resultLength: (result && typeof result === 'string') ? result.length : 'non-string' 
            });
            
            return result;
          }
          
          // **STAGE 9 SUBSTAGES**: Use direct API for 9A-9G substages for optimal quality
          if (currentStage === 8 && substageId && substageId.startsWith('9')) {
            console.log(`🎯 Direct API call for Stage 9 substage ${substageId}`, { 
              promptLength: (prompt && typeof prompt === 'string') ? prompt.length : 0, 
              hasGeminiKey: !!apiKeys.gemini,
              additionalParams 
            });
            
            const { callGeminiAPI } = await import('@/services/apiService');
            const result = await callGeminiAPI(
              prompt, 
              apiKeys.gemini, 
              'thinking-structured', // Use structured output for substages
              undefined, // No schema constraints
              { 
                maxTokens: additionalParams?.maxTokens || 4000,
                stageId: substageId,
                temperature: additionalParams?.temperature || 0.3
              }
            );
            
            console.log(`✅ Direct API call successful for substage ${substageId}`, { 
              resultLength: (result && typeof result === 'string') ? result.length : 'non-string' 
            });
            
            return result;
          }
          
          try {
            console.log(`🎯 Routing API call for stage: ${stageName}`, { 
              promptLength: (prompt && typeof prompt === 'string') ? prompt.length : 0, 
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
              resultLength: (result && typeof result === 'string') ? result.length : 'non-string' 
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
                maxTokens: additionalParams?.maxTokens || 32000, // Massive token limit for fallback - use full capacity
                stageId: additionalParams?.stageId || 'fallback',
                temperature: additionalParams?.temperature || 0.1
              }
            );
          }
        }
      };
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
          // Use the topic from the context (which already has the right value)
          const topicToUse = contextForStage.topic;
          console.log(`📋 Research topic: ${topicToUse}`);
          if (!topicToUse || topicToUse.trim() === '') {
            throw new Error('Stage 1 requires a valid research topic');
          }
          result = await initializeGraph(topicToUse, context);
          console.log(`📊 Initialization result length: ${(result && typeof result === 'string') ? result.length : 'non-string'}`);
          setGraphData(prev => ({ ...prev, stage: 'initialization' }));
          break;
          
        case 1: // Decomposition
          // **CRITICAL DEBUG**: Log the context state for Stage 2
          console.log(`🔍 Stage 2 Debug - Research Context:`, {
            topic: context.researchContext.topic,
            hasValidTopic: !!context.researchContext.topic && context.researchContext.topic.trim() !== '',
            field: context.researchContext.field,
            objectives: (context.researchContext.objectives && Array.isArray(context.researchContext.objectives)) ? context.researchContext.objectives.length : 0
          });
          
          // **CRITICAL FIX**: Additional validation with better error message
          if (!context.researchContext.topic || context.researchContext.topic.trim() === '') {
            // Try to get topic from stage results or input
            let fallbackTopic = '';
            if (stageResults[0] && stageResults[0].includes('Research Topic:')) {
              const match = stageResults[0].match(/Research Topic:\s*([^\n]+)/);
              if (match) {
                fallbackTopic = match[1].trim();
                console.log(`🔧 Found fallback topic from Stage 1 results: ${fallbackTopic}`);
                // Update context with fallback topic
                context.researchContext.topic = fallbackTopic;
              }
            }
            
            if (!fallbackTopic) {
              throw new Error(`Stage 2 failed: Invalid input: must be a non-empty string. Current research topic is empty or undefined. Please ensure Stage 1 completed successfully and set a valid research topic.`);
            }
          }
          
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
        resultLength: (result && typeof result === 'string') ? result.length : 'non-string', 
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
      
      // **CRITICAL FIX**: Enhanced error handling to prevent unhandled promise rejections
      let errorMessage = error.message || 'Unknown error occurred';
      
      if (error.message === 'PERPLEXITY_KEY_REQUIRED') {
        toast.error('Please configure Perplexity API key for Sonar Deep Research to continue');
      } else if (errorMessage.includes('Cannot read properties of undefined')) {
        errorMessage = `Stage ${stageIndex + 1} encountered a data structure error. This may be due to incomplete previous stage results.`;
        toast.error(errorMessage);
      } else if (errorMessage.includes('Invalid input: must be a non-empty string')) {
        errorMessage = `Stage ${stageIndex + 1} received invalid input. Please ensure all previous stages completed successfully.`;
        toast.error(errorMessage);
      } else {
        toast.error(`Stage ${stageIndex + 1} failed: ${errorMessage}`);
      }
      
      // Log error for debugging but don't rethrow to prevent unhandled promise rejection
      console.warn(`🚨 Stage ${stageIndex + 1} error handled gracefully:`, errorMessage);
      
      // Update stage results with error message instead of throwing
      updateStageResults(stageIndex, `**Stage ${stageIndex + 1} Error**: ${errorMessage}`);
      
      return; // Exit gracefully without throwing
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
    setFinalReport,
    researchContext,
    stageResults,
    setResearchContext
  ]);

  return {
    executeStage,
    getCostDashboard: () => costAwareOrchestration.getCostDashboard(),
    getEstimatedTotalCost: () => costAwareOrchestration.getEstimatedTotalCost(),
    resetCostTracking: () => costAwareOrchestration.resetCostTracking()
  };
};
