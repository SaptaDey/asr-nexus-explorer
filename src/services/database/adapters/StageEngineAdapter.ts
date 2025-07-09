/**
 * ASR-GoT Stage Engine Database Adapter
 * Integrates the complete 9-stage pipeline with Supabase persistence
 */

import { DatabaseService, DbResearchSession, DbStageExecution } from '../DatabaseService';
import { AsrGotStageEngine, StageExecutionResult } from '@/services/AsrGotStageEngine';
import { ResearchContext, GraphData } from '@/types/asrGotTypes';

export class StageEngineAdapter {
  private db: DatabaseService;
  private stageEngine: AsrGotStageEngine;

  constructor(databaseService: DatabaseService, apiKey: string) {
    this.db = databaseService;
    this.stageEngine = new AsrGotStageEngine(apiKey);
  }

  /**
   * Execute the complete ASR-GoT pipeline with database persistence
   */
  async executeCompleteResearchPipeline(
    sessionId: string,
    researchContext: ResearchContext,
    progressCallback?: (stage: number, progress: number, result?: any) => void
  ): Promise<{
    session: DbResearchSession;
    stageExecutions: DbStageExecution[];
    finalGraphData: GraphData;
    recommendations: string[];
  }> {
    const startTime = Date.now();
    const stageExecutions: DbStageExecution[] = [];
    let currentGraphData: GraphData = { nodes: [], edges: [] };

    try {
      // Update session status to active
      await this.db.updateResearchSession(sessionId, {
        status: 'active',
        current_stage: 1
      });

      // Execute stages 1-9 with persistence
      for (let stage = 1; stage <= 9; stage++) {
        const stageStartTime = Date.now();
        
        // Create pending stage execution record
        const stageExecution = await this.db.saveStageExecution({
          session_id: sessionId,
          stage_number: stage,
          stage_name: this.getStageInfo(stage).name,
          status: 'pending',
          input_data: {
            research_context: researchContext,
            current_graph: currentGraphData,
            stage_number: stage
          },
          started_at: new Date().toISOString()
        });

        try {
          // Update status to running
          await this.db.updateStageExecution(stageExecution.id, {
            status: 'running',
            started_at: new Date().toISOString()
          });

          // Execute the stage
          let stageResult: StageExecutionResult;
          
          switch (stage) {
            case 1:
              stageResult = await this.stageEngine.executeStage1_ProblemFormulation(researchContext);
              break;
            case 2:
              stageResult = await this.stageEngine.executeStage2_InitialHypothesis(researchContext, currentGraphData);
              break;
            case 3:
              stageResult = await this.stageEngine.executeStage3_EvidenceGathering(researchContext, currentGraphData);
              break;
            case 4:
              stageResult = await this.stageEngine.executeStage4_ConceptualMapping(researchContext, currentGraphData);
              break;
            case 5:
              stageResult = await this.stageEngine.executeStage5_HypothesisRefinement(researchContext, currentGraphData);
              break;
            case 6:
              stageResult = await this.stageEngine.executeStage6_IterativeAnalysis(researchContext, currentGraphData);
              break;
            case 7:
              stageResult = await this.stageEngine.executeStage7_SynthesisIntegration(researchContext, currentGraphData);
              break;
            case 8:
              stageResult = await this.stageEngine.executeStage8_ValidationTesting(researchContext, currentGraphData);
              break;
            case 9:
              stageResult = await this.stageEngine.executeStage9_ConclusionRecommendation(researchContext, currentGraphData);
              break;
            default:
              throw new Error(`Invalid stage number: ${stage}`);
          }

          // Update graph data
          if (stageResult.graph_data) {
            currentGraphData = stageResult.graph_data;
            await this.db.saveGraphData(sessionId, currentGraphData);
          }

          // Calculate execution time
          const executionTime = Date.now() - stageStartTime;

          // Update stage execution with success
          const completedExecution = await this.db.updateStageExecution(stageExecution.id, {
            status: 'completed',
            output_data: stageResult,
            execution_time_ms: executionTime,
            confidence_score: stageResult.confidence,
            completed_at: new Date().toISOString()
          });

          stageExecutions.push(completedExecution);

          // Update session progress
          await this.db.updateResearchSession(sessionId, {
            current_stage: stage,
            stage_results: {
              ...((await this.db.getResearchSession(sessionId))?.stage_results || {}),
              [`stage_${stage}`]: stageResult
            }
          });

          // Log performance metrics
          await this.db.savePerformanceMetric({
            session_id: sessionId,
            operation_type: `stage_${stage}_execution`,
            execution_time_ms: executionTime,
            success_count: 1,
            error_count: 0
          });

          // Call progress callback
          if (progressCallback) {
            progressCallback(stage, (stage / 9) * 100, stageResult);
          }

        } catch (stageError) {
          // Update stage execution with failure
          await this.db.updateStageExecution(stageExecution.id, {
            status: 'failed',
            error_message: stageError instanceof Error ? stageError.message : 'Unknown error',
            completed_at: new Date().toISOString()
          });

          // Log error
          await this.db.logError({
            session_id: sessionId,
            error_type: `stage_${stage}_execution_failed`,
            error_message: stageError instanceof Error ? stageError.message : 'Unknown error',
            stack_trace: stageError instanceof Error ? stageError.stack : undefined,
            severity: 'high',
            resolved: false,
            context: {
              stage_number: stage,
              stage_name: this.getStageInfo(stage).name,
              research_context: researchContext
            }
          });

          throw stageError;
        }
      }

      // Generate final recommendations
      const recommendations = await this.generateFinalRecommendations(sessionId, stageExecutions);

      // Update session to completed
      const completedSession = await this.db.updateResearchSession(sessionId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        metadata: {
          total_execution_time_ms: Date.now() - startTime,
          stages_completed: 9,
          final_confidence: this.calculateOverallConfidence(stageExecutions),
          recommendations
        }
      });

      return {
        session: completedSession,
        stageExecutions,
        finalGraphData: currentGraphData,
        recommendations
      };

    } catch (error) {
      // Update session to failed state
      await this.db.updateResearchSession(sessionId, {
        status: 'archived', // Mark as archived rather than active
        metadata: {
          execution_failed: true,
          failure_reason: error instanceof Error ? error.message : 'Unknown error',
          stages_completed: stageExecutions.filter(se => se.status === 'completed').length
        }
      });

      throw error;
    }
  }

  /**
   * Execute a single stage with persistence
   */
  async executeSingleStage(
    sessionId: string,
    stageNumber: number,
    researchContext: ResearchContext,
    currentGraphData: GraphData
  ): Promise<{
    stageExecution: DbStageExecution;
    stageResult: StageExecutionResult;
    updatedGraphData: GraphData;
  }> {
    const stageStartTime = Date.now();

    try {
      // Create stage execution record
      const stageExecution = await this.db.saveStageExecution({
        session_id: sessionId,
        stage_number: stageNumber,
        stage_name: this.getStageInfo(stageNumber).name,
        status: 'running',
        input_data: {
          research_context: researchContext,
          current_graph: currentGraphData
        },
        started_at: new Date().toISOString()
      });

      // Execute the stage based on stage number
      let stageResult: StageExecutionResult;
      
      switch (stageNumber) {
        case 1:
          stageResult = await this.stageEngine.executeStage1_ProblemFormulation(researchContext);
          break;
        case 2:
          stageResult = await this.stageEngine.executeStage2_InitialHypothesis(researchContext, currentGraphData);
          break;
        case 3:
          stageResult = await this.stageEngine.executeStage3_EvidenceGathering(researchContext, currentGraphData);
          break;
        case 4:
          stageResult = await this.stageEngine.executeStage4_ConceptualMapping(researchContext, currentGraphData);
          break;
        case 5:
          stageResult = await this.stageEngine.executeStage5_HypothesisRefinement(researchContext, currentGraphData);
          break;
        case 6:
          stageResult = await this.stageEngine.executeStage6_IterativeAnalysis(researchContext, currentGraphData);
          break;
        case 7:
          stageResult = await this.stageEngine.executeStage7_SynthesisIntegration(researchContext, currentGraphData);
          break;
        case 8:
          stageResult = await this.stageEngine.executeStage8_ValidationTesting(researchContext, currentGraphData);
          break;
        case 9:
          stageResult = await this.stageEngine.executeStage9_ConclusionRecommendation(researchContext, currentGraphData);
          break;
        default:
          throw new Error(`Invalid stage number: ${stageNumber}`);
      }

      // Update graph data if changed
      let updatedGraphData = currentGraphData;
      if (stageResult.graph_data) {
        updatedGraphData = stageResult.graph_data;
        await this.db.saveGraphData(sessionId, updatedGraphData);
      }

      // Calculate execution time
      const executionTime = Date.now() - stageStartTime;

      // Update stage execution
      const completedExecution = await this.db.updateStageExecution(stageExecution.id, {
        status: 'completed',
        output_data: stageResult,
        execution_time_ms: executionTime,
        confidence_score: stageResult.confidence,
        completed_at: new Date().toISOString()
      });

      // Log performance metrics
      await this.db.savePerformanceMetric({
        session_id: sessionId,
        operation_type: `stage_${stageNumber}_execution`,
        execution_time_ms: executionTime,
        success_count: 1,
        error_count: 0
      });

      return {
        stageExecution: completedExecution,
        stageResult,
        updatedGraphData
      };

    } catch (error) {
      // Log error
      await this.db.logError({
        session_id: sessionId,
        error_type: `stage_${stageNumber}_execution_failed`,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        stack_trace: error instanceof Error ? error.stack : undefined,
        severity: 'high',
        resolved: false,
        context: {
          stage_number: stageNumber,
          research_context: researchContext
        }
      });

      throw error;
    }
  }

  /**
   * Resume execution from a specific stage
   */
  async resumeExecution(
    sessionId: string,
    fromStage: number,
    progressCallback?: (stage: number, progress: number, result?: any) => void
  ): Promise<{
    session: DbResearchSession;
    stageExecutions: DbStageExecution[];
    finalGraphData: GraphData;
  }> {
    try {
      // Get session and current data
      const session = await this.db.getResearchSession(sessionId);
      if (!session) throw new Error('Session not found');

      const graphData = await this.db.getGraphData(sessionId);
      if (!graphData) throw new Error('No graph data found');

      // Reconstruct research context from session
      const researchContext: ResearchContext = {
        field: session.metadata?.field || 'general',
        topic: session.title,
        objectives: session.metadata?.objectives || [session.research_question || session.title],
        hypotheses: session.metadata?.hypotheses || [],
        constraints: session.metadata?.constraints || [],
        timeline: session.metadata?.timeline || '1 month',
        keywords: session.metadata?.keywords || []
      };

      // Execute from the specified stage
      return await this.executeCompleteResearchPipeline(
        sessionId,
        researchContext,
        progressCallback
      );

    } catch (error) {
      console.error('Failed to resume execution:', error);
      throw error;
    }
  }

  /**
   * Get execution history and analytics
   */
  async getExecutionAnalytics(sessionId: string): Promise<{
    totalExecutionTime: number;
    stagePerformance: Array<{
      stage: number;
      name: string;
      executionTime: number;
      confidence: number;
      status: string;
    }>;
    overallConfidence: number;
    bottlenecks: string[];
    recommendations: string[];
  }> {
    try {
      const stageExecutions = await this.db.getStageExecutions(sessionId);
      
      const totalExecutionTime = stageExecutions.reduce(
        (sum, execution) => sum + (execution.execution_time_ms || 0), 
        0
      );

      const stagePerformance = stageExecutions.map(execution => ({
        stage: execution.stage_number,
        name: execution.stage_name,
        executionTime: execution.execution_time_ms || 0,
        confidence: execution.confidence_score || 0,
        status: execution.status
      }));

      const overallConfidence = this.calculateOverallConfidence(stageExecutions);

      // Identify bottlenecks (stages taking >90th percentile of time)
      const executionTimes = stageExecutions
        .map(se => se.execution_time_ms || 0)
        .filter(time => time > 0)
        .sort((a, b) => a - b);
      
      const percentile90 = executionTimes[Math.floor(executionTimes.length * 0.9)] || 0;
      
      const bottlenecks = stageExecutions
        .filter(se => (se.execution_time_ms || 0) > percentile90)
        .map(se => `Stage ${se.stage_number}: ${se.stage_name}`);

      // Generate recommendations
      const recommendations = [];
      if (overallConfidence < 0.7) {
        recommendations.push('Consider additional evidence gathering and validation');
      }
      if (bottlenecks.length > 0) {
        recommendations.push(`Optimize performance for: ${bottlenecks.join(', ')}`);
      }
      if (stageExecutions.some(se => se.status === 'failed')) {
        recommendations.push('Review and retry failed stages');
      }

      return {
        totalExecutionTime,
        stagePerformance,
        overallConfidence,
        bottlenecks,
        recommendations
      };

    } catch (error) {
      console.error('Failed to get execution analytics:', error);
      throw error;
    }
  }

  /**
   * Get stage information
   */
  private getStageInfo(stageNumber: number): { name: string; description: string } {
    const stageInfo = {
      1: { name: 'Problem Formulation', description: 'Define research problem and context' },
      2: { name: 'Initial Hypothesis', description: 'Generate initial hypotheses' },
      3: { name: 'Evidence Gathering', description: 'Collect and analyze evidence' },
      4: { name: 'Conceptual Mapping', description: 'Create conceptual relationships' },
      5: { name: 'Hypothesis Refinement', description: 'Refine and validate hypotheses' },
      6: { name: 'Iterative Analysis', description: 'Perform iterative analysis' },
      7: { name: 'Synthesis Integration', description: 'Synthesize findings' },
      8: { name: 'Validation Testing', description: 'Validate results and test hypotheses' },
      9: { name: 'Conclusion Recommendation', description: 'Generate conclusions and recommendations' }
    };

    return stageInfo[stageNumber as keyof typeof stageInfo] || { name: 'Unknown Stage', description: 'Unknown stage' };
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(stageExecutions: DbStageExecution[]): number {
    const confidenceScores = stageExecutions
      .filter(se => se.confidence_score !== null && se.confidence_score !== undefined)
      .map(se => se.confidence_score!);

    if (confidenceScores.length === 0) return 0;

    // Weighted average with later stages having higher weight
    let weightedSum = 0;
    let totalWeight = 0;

    confidenceScores.forEach((score, index) => {
      const weight = index + 1; // Later stages get higher weight
      weightedSum += score * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Generate final recommendations based on execution results
   */
  private async generateFinalRecommendations(
    sessionId: string,
    stageExecutions: DbStageExecution[]
  ): Promise<string[]> {
    try {
      const recommendations: string[] = [];
      
      // Analyze confidence levels
      const avgConfidence = this.calculateOverallConfidence(stageExecutions);
      if (avgConfidence > 0.8) {
        recommendations.push('High confidence results - ready for publication/implementation');
      } else if (avgConfidence > 0.6) {
        recommendations.push('Moderate confidence - consider additional validation');
      } else {
        recommendations.push('Low confidence - significant additional research needed');
      }

      // Check for failed stages
      const failedStages = stageExecutions.filter(se => se.status === 'failed');
      if (failedStages.length > 0) {
        recommendations.push(`Consider retrying failed stages: ${failedStages.map(se => se.stage_name).join(', ')}`);
      }

      // Performance recommendations
      const totalTime = stageExecutions.reduce((sum, se) => sum + (se.execution_time_ms || 0), 0);
      if (totalTime > 300000) { // > 5 minutes
        recommendations.push('Consider optimizing execution time for future research');
      }

      // Get knowledge gaps
      const knowledgeGaps = await this.db.getKnowledgeGaps(sessionId);
      if (knowledgeGaps.length > 0) {
        const highPriorityGaps = knowledgeGaps.filter(gap => gap.priority > 0.7);
        if (highPriorityGaps.length > 0) {
          recommendations.push(`Address ${highPriorityGaps.length} high-priority knowledge gaps`);
        }
      }

      return recommendations;
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      return ['Review execution results and consider manual analysis'];
    }
  }

  /**
   * Subscribe to real-time stage execution updates
   */
  subscribeToStageUpdates(sessionId: string, callback: (execution: DbStageExecution) => void) {
    return this.db.supabase
      .channel(`stage_executions_${sessionId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'stage_executions',
          filter: `session_id=eq.${sessionId}`
        }, 
        (payload) => {
          if (payload.new) {
            callback(payload.new as DbStageExecution);
          }
        }
      )
      .subscribe();
  }
}