/**
 * Hypothesis Competition Framework Database Adapter
 * Integrates HypothesisCompetitionFramework with Supabase persistence
 */

import { DatabaseService, DbHypothesis } from '../DatabaseService';
import { 
  Hypothesis, 
  HypothesisCompetitionFramework, 
  CompetitionRound, 
  EvaluationCriteria 
} from '@/services/reasoning/HypothesisCompetitionFramework';

export class HypothesisAdapter {
  private db: DatabaseService;
  private competitionFramework: HypothesisCompetitionFramework;

  constructor(databaseService: DatabaseService) {
    this.db = databaseService;
    this.competitionFramework = new HypothesisCompetitionFramework();
  }

  /**
   * Register a hypothesis and persist it to database
   */
  async registerHypothesis(
    sessionId: string,
    hypothesis: Hypothesis
  ): Promise<{
    success: boolean;
    hypothesisId: string;
    dbHypothesis?: DbHypothesis;
    initialEvaluation: any;
    competingHypotheses: string[];
  }> {
    try {
      // Register with the competition framework
      const result = this.competitionFramework.registerHypothesis(hypothesis);
      
      if (result.success) {
        // Persist to database
        const dbHypothesis = await this.db.saveHypothesis({
          session_id: sessionId,
          hypothesis_text: hypothesis.description,
          hypothesis_type: hypothesis.domain.join(','),
          confidence: hypothesis.confidence,
          supporting_evidence: hypothesis.supportingEvidence,
          contradicting_evidence: hypothesis.contradictingEvidence,
          falsifiability_score: hypothesis.falsifiability,
          competition_results: {
            initial_evaluation: result.initialEvaluation,
            competing_hypotheses: result.competingHypotheses
          },
          status: 'active'
        });

        return {
          ...result,
          dbHypothesis
        };
      }

      return result;
    } catch (error) {
      console.error('Failed to register hypothesis:', error);
      throw error;
    }
  }

  /**
   * Conduct competition and persist results
   */
  async conductCompetition(
    sessionId: string,
    hypothesisIds: string[],
    criteria: EvaluationCriteria,
    evidenceUpdate?: Record<string, any>
  ): Promise<{
    competition: CompetitionRound;
    persistedResults: DbHypothesis[];
  }> {
    try {
      // Load hypotheses from database and register them with framework
      await this.loadHypothesesIntoFramework(sessionId, hypothesisIds);

      // Conduct competition
      const competition = this.competitionFramework.conductCompetition(
        hypothesisIds,
        criteria,
        evidenceUpdate
      );

      // Persist competition results to database
      const persistedResults: DbHypothesis[] = [];
      
      for (const result of competition.results) {
        try {
          const updated = await this.db.updateHypothesis(result.hypothesisId, {
            competition_results: {
              ...competition,
              individual_result: result
            },
            confidence: result.overallScore
          });
          persistedResults.push(updated);
        } catch (error) {
          console.error(`Failed to update hypothesis ${result.hypothesisId}:`, error);
        }
      }

      // Log the competition as a stage execution
      await this.db.saveStageExecution({
        session_id: sessionId,
        stage_number: 13, // P1.13 stage
        stage_name: 'Hypothesis Competition',
        status: 'completed',
        input_data: {
          hypothesis_ids: hypothesisIds,
          criteria,
          evidence_update: evidenceUpdate
        },
        output_data: competition,
        execution_time_ms: 0, // Could be measured
        confidence_score: competition.confidence,
        started_at: competition.timestamp,
        completed_at: competition.timestamp
      });

      return {
        competition,
        persistedResults
      };
    } catch (error) {
      console.error('Failed to conduct competition:', error);
      throw error;
    }
  }

  /**
   * Evolve hypothesis and persist changes
   */
  async evolveHypothesis(
    sessionId: string,
    hypothesisId: string,
    feedback: {
      criteriaFeedback: Record<string, number>;
      evidenceFeedback: string[];
      peerFeedback: Array<{
        evaluator: string;
        suggestions: string[];
        score: number;
      }>;
    }
  ): Promise<{
    evolvedHypothesis: Hypothesis;
    modifications: string[];
    improvementScore: number;
    dbHypothesis: DbHypothesis;
  }> {
    try {
      // Load hypothesis into framework
      await this.loadHypothesesIntoFramework(sessionId, [hypothesisId]);

      // Evolve hypothesis
      const result = this.competitionFramework.evolveHypothesis(hypothesisId, feedback);

      // Persist evolution to database
      const dbHypothesis = await this.db.updateHypothesis(hypothesisId, {
        hypothesis_text: result.evolvedHypothesis.description,
        confidence: result.evolvedHypothesis.confidence,
        supporting_evidence: result.evolvedHypothesis.supportingEvidence,
        contradicting_evidence: result.evolvedHypothesis.contradictingEvidence,
        falsifiability_score: result.evolvedHypothesis.falsifiability,
        competition_results: {
          evolution: {
            modifications: result.modifications,
            improvement_score: result.improvementScore,
            feedback
          }
        }
      });

      return {
        ...result,
        dbHypothesis
      };
    } catch (error) {
      console.error('Failed to evolve hypothesis:', error);
      throw error;
    }
  }

  /**
   * Build consensus and persist results
   */
  async buildConsensus(
    sessionId: string,
    hypothesisIds: string[],
    mechanism: any
  ): Promise<{
    consensusResult: any;
    persistedHypotheses: DbHypothesis[];
  }> {
    try {
      // Load hypotheses into framework
      await this.loadHypothesesIntoFramework(sessionId, hypothesisIds);

      // Build consensus
      const consensusResult = this.competitionFramework.buildConsensus(hypothesisIds, mechanism);

      // Persist consensus results
      const persistedHypotheses: DbHypothesis[] = [];
      
      for (const [hypothesisId, score] of Object.entries(consensusResult.finalScores)) {
        try {
          const updated = await this.db.updateHypothesis(hypothesisId, {
            competition_results: {
              consensus: {
                final_score: score,
                convergence_achieved: consensusResult.convergenceAchieved,
                consensus_strength: consensusResult.consensusStrength,
                iterations: consensusResult.iterations
              }
            }
          });
          persistedHypotheses.push(updated);
        } catch (error) {
          console.error(`Failed to update hypothesis ${hypothesisId}:`, error);
        }
      }

      return {
        consensusResult,
        persistedHypotheses
      };
    } catch (error) {
      console.error('Failed to build consensus:', error);
      throw error;
    }
  }

  /**
   * Analyze hypothesis landscape and persist insights
   */
  async analyzeHypothesisLandscape(sessionId: string): Promise<{
    analysis: any;
    knowledgeGapsCreated: any[];
  }> {
    try {
      // Load all hypotheses for session
      const dbHypotheses = await this.db.getHypotheses(sessionId);
      const hypothesisIds = dbHypotheses.map(h => h.id);
      
      await this.loadHypothesesIntoFramework(sessionId, hypothesisIds);

      // Analyze landscape
      const analysis = this.competitionFramework.analyzeHypothesisLandscape();

      // Persist knowledge gaps
      const knowledgeGapsCreated = [];
      for (const gap of analysis.gaps) {
        try {
          const dbGap = await this.db.saveKnowledgeGap({
            session_id: sessionId,
            gap_type: 'hypothesis_landscape',
            description: gap.description,
            priority: gap.priority,
            fillability: 0.7, // Default fillability
            related_nodes: [],
            research_recommendations: gap.suggestedHypotheses,
            status: 'identified'
          });
          knowledgeGapsCreated.push(dbGap);
        } catch (error) {
          console.error('Failed to save knowledge gap:', error);
        }
      }

      return {
        analysis,
        knowledgeGapsCreated
      };
    } catch (error) {
      console.error('Failed to analyze hypothesis landscape:', error);
      throw error;
    }
  }

  /**
   * Simulate competition scenarios and persist results
   */
  async simulateCompetition(
    sessionId: string,
    hypothesisIds: string[],
    scenarios: Array<{
      name: string;
      evidenceChanges: Record<string, number>;
      criteriaWeights: Record<string, number>;
    }>
  ): Promise<{
    simulations: any[];
    dbExecutions: any[];
  }> {
    try {
      // Load hypotheses into framework
      await this.loadHypothesesIntoFramework(sessionId, hypothesisIds);

      // Run simulations
      const simulations = this.competitionFramework.simulateCompetition(hypothesisIds, scenarios);

      // Persist simulation results
      const dbExecutions = [];
      for (const [index, simulation] of simulations.entries()) {
        try {
          const execution = await this.db.saveStageExecution({
            session_id: sessionId,
            stage_number: 13, // P1.13 stage
            stage_name: `Hypothesis Simulation: ${simulation.scenario}`,
            status: 'completed',
            input_data: {
              scenario: scenarios[index],
              hypothesis_ids: hypothesisIds
            },
            output_data: simulation,
            execution_time_ms: 0,
            confidence_score: simulation.confidence
          });
          dbExecutions.push(execution);
        } catch (error) {
          console.error('Failed to save simulation result:', error);
        }
      }

      return {
        simulations,
        dbExecutions
      };
    } catch (error) {
      console.error('Failed to simulate competition:', error);
      throw error;
    }
  }

  /**
   * Load hypotheses from database into competition framework
   */
  private async loadHypothesesIntoFramework(sessionId: string, hypothesisIds: string[]): Promise<void> {
    const dbHypotheses = await this.db.getHypotheses(sessionId);
    
    for (const dbHypothesis of dbHypotheses) {
      if (hypothesisIds.includes(dbHypothesis.id)) {
        // Convert database hypothesis to framework hypothesis
        const hypothesis: Hypothesis = {
          id: dbHypothesis.id,
          description: dbHypothesis.hypothesis_text,
          proposer: 'system', // Could be enhanced
          timestamp: dbHypothesis.created_at,
          supportingEvidence: dbHypothesis.supporting_evidence || [],
          contradictingEvidence: dbHypothesis.contradicting_evidence || [],
          relatedNodes: [], // Could be populated from graph data
          confidence: dbHypothesis.confidence,
          explanatoryPower: 0.5, // Default values - could be computed
          falsifiability: dbHypothesis.falsifiability_score || 0.5,
          simplicity: 0.5,
          novelty: 0.5,
          testability: 0.5,
          scope: 'regional',
          domain: dbHypothesis.hypothesis_type.split(','),
          metadata: {
            research_paradigm: 'empirical',
            methodological_approach: 'quantitative',
            theoretical_framework: 'scientific',
            empirical_support: 0.5,
            peer_evaluations: []
          }
        };

        this.competitionFramework.registerHypothesis(hypothesis);
      }
    }
  }

  /**
   * Get hypothesis statistics from database
   */
  async getHypothesisStatistics(sessionId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    averageConfidence: number;
    topHypotheses: DbHypothesis[];
  }> {
    try {
      const hypotheses = await this.db.getHypotheses(sessionId);
      
      const byStatus = hypotheses.reduce((acc, h) => {
        acc[h.status] = (acc[h.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const averageConfidence = hypotheses.length > 0 
        ? hypotheses.reduce((sum, h) => sum + h.confidence, 0) / hypotheses.length
        : 0;

      return {
        total: hypotheses.length,
        byStatus,
        averageConfidence,
        topHypotheses: hypotheses.slice(0, 5) // Top 5 by confidence
      };
    } catch (error) {
      console.error('Failed to get hypothesis statistics:', error);
      throw error;
    }
  }

  /**
   * Real-time hypothesis updates subscription
   */
  subscribeToHypothesisUpdates(sessionId: string, callback: (hypothesis: DbHypothesis) => void) {
    return this.db.supabase
      .channel(`hypotheses_${sessionId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'hypotheses',
          filter: `session_id=eq.${sessionId}`
        }, 
        (payload) => {
          if (payload.new) {
            callback(payload.new as DbHypothesis);
          }
        }
      )
      .subscribe();
  }
}