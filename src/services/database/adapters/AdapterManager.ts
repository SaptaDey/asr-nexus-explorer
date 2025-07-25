/**
 * Unified Adapter Manager for ASR-GoT Database Integration
 * Coordinates all database adapters and provides unified interface
 */

import { DatabaseService } from '../DatabaseService';
import { HypothesisAdapter } from './HypothesisAdapter';
import { KnowledgeGapAdapter } from './KnowledgeGapAdapter';
import { StageEngineAdapter } from './StageEngineAdapter';
import { PerformanceAdapter } from './PerformanceAdapter';
import { ResearchContext, GraphData } from '@/types/asrGotTypes';

export interface AdapterManagerConfig {
  apiKey: string;
  enableRealTimeUpdates?: boolean;
  performanceThresholds?: {
    maxExecutionTime?: number;
    maxMemoryUsage?: number;
    maxCpuUsage?: number;
    minThroughput?: number;
  };
}

export class AdapterManager {
  private db: DatabaseService;
  private hypothesisAdapter: HypothesisAdapter;
  private knowledgeGapAdapter: KnowledgeGapAdapter;
  private stageEngineAdapter: StageEngineAdapter;
  private performanceAdapter: PerformanceAdapter;
  private config: AdapterManagerConfig;
  private activeSubscriptions: Map<string, any[]> = new Map();

  constructor(config: AdapterManagerConfig) {
    this.config = config;
    this.db = new DatabaseService();
    
    // Initialize adapters
    this.hypothesisAdapter = new HypothesisAdapter(this.db);
    this.knowledgeGapAdapter = new KnowledgeGapAdapter(this.db);
    this.stageEngineAdapter = new StageEngineAdapter(this.db, config.apiKey);
    this.performanceAdapter = new PerformanceAdapter(this.db);
  }

  /**
   * Initialize a new research session with full database integration
   */
  async initializeResearchSession(
    userId: string,
    sessionData: {
      title: string;
      description?: string;
      research_question?: string;
      researchContext: ResearchContext;
    }
  ): Promise<{
    sessionId: string;
    session: any;
    monitoringSetup: boolean;
  }> {
    try {
      // Create research session
      const session = await this.db.createResearchSession({
        user_id: userId,
        title: sessionData.title,
        description: sessionData.description,
        research_question: sessionData.research_question,
        status: 'draft',
        current_stage: 1,
        metadata: {
          research_context: sessionData.researchContext,
          initialization_timestamp: new Date().toISOString()
        }
      });

      // Set up real-time monitoring if enabled
      let monitoringSetup = false;
      if (this.config.enableRealTimeUpdates) {
        await this.setupSessionMonitoring(session.id);
        monitoringSetup = true;
      }

      // Log session creation
      await this.db.savePerformanceMetric({
        session_id: session.id,
        operation_type: 'session_initialization',
        execution_time_ms: 0,
        success_count: 1,
        error_count: 0
      });

      return {
        sessionId: session.id,
        session,
        monitoringSetup
      };

    } catch (error) {
      console.error('Failed to initialize research session:', error);
      throw error;
    }
  }

  /**
   * Execute complete ASR-GoT pipeline with full integration
   */
  async executeResearchPipeline(
    sessionId: string,
    progressCallback?: (stage: number, progress: number, result?: any) => void
  ): Promise<{
    session: any;
    stageExecutions: any[];
    finalGraphData: GraphData;
    hypotheses: any[];
    knowledgeGaps: any[];
    performanceReport: any;
    recommendations: string[];
  }> {
    const startTime = Date.now();

    try {
      // Get session and research context
      const session = await this.db.getResearchSession(sessionId);
      if (!session) throw new Error('Session not found');

      const researchContext: ResearchContext = session.metadata?.research_context;
      if (!researchContext) throw new Error('Research context not found');

      // Execute pipeline through stage engine adapter
      const pipelineResult = await this.stageEngineAdapter.executeCompleteResearchPipeline(
        sessionId,
        researchContext,
        progressCallback
      );

      // Analyze results and detect knowledge gaps
      const gapAnalysis = await this.knowledgeGapAdapter.detectAndPersistKnowledgeGaps(
        sessionId,
        pipelineResult.finalGraphData,
        researchContext,
        pipelineResult.stageExecutions.map(se => se.output_data)
      );

      // Generate hypotheses from final results
      const hypotheses = await this.generateHypothesesFromResults(
        sessionId,
        pipelineResult.stageExecutions,
        pipelineResult.finalGraphData
      );

      // Generate performance report
      const performanceReport = await this.performanceAdapter.generatePerformanceReport(sessionId);

      // Compile final recommendations
      const allRecommendations = [
        ...pipelineResult.recommendations,
        ...gapAnalysis.gapAnalysis.recommendations,
        ...performanceReport.recommendations
      ];

      // Log final execution metrics
      await this.db.savePerformanceMetric({
        session_id: sessionId,
        operation_type: 'complete_pipeline_execution',
        execution_time_ms: Date.now() - startTime,
        success_count: 1,
        error_count: 0
      });

      return {
        session: pipelineResult.session,
        stageExecutions: pipelineResult.stageExecutions,
        finalGraphData: pipelineResult.finalGraphData,
        hypotheses,
        knowledgeGaps: gapAnalysis.persistedGaps,
        performanceReport: performanceReport.metrics,
        recommendations: allRecommendations
      };

    } catch (error) {
      // Log error
      await this.db.logError({
        session_id: sessionId,
        error_type: 'pipeline_execution_failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        severity: 'critical',
        resolved: false,
        context: {
          execution_time_ms: Date.now() - startTime
        }
      });

      throw error;
    }
  }

  /**
   * Get comprehensive session analytics
   */
  async getSessionAnalytics(sessionId: string): Promise<{
    sessionOverview: any;
    stageAnalytics: any;
    hypothesisAnalytics: any;
    knowledgeGapAnalytics: any;
    performanceAnalytics: any;
    collaborationAnalytics: any;
  }> {
    try {
      const [
        session,
        stageAnalytics,
        hypothesisStats,
        gapTrends,
        performanceTrends,
        collaborations
      ] = await Promise.all([
        this.db.getResearchSession(sessionId),
        this.stageEngineAdapter.getExecutionAnalytics(sessionId),
        this.hypothesisAdapter.getHypothesisStatistics(sessionId),
        this.knowledgeGapAdapter.getGapTrends(sessionId),
        this.performanceAdapter.analyzePerformanceTrends(sessionId),
        this.getCollaborationAnalytics(sessionId)
      ]);

      return {
        sessionOverview: {
          ...session,
          totalExecutionTime: stageAnalytics.totalExecutionTime,
          overallConfidence: stageAnalytics.overallConfidence
        },
        stageAnalytics,
        hypothesisAnalytics: hypothesisStats,
        knowledgeGapAnalytics: gapTrends,
        performanceAnalytics: performanceTrends,
        collaborationAnalytics: collaborations
      };

    } catch (error) {
      console.error('Failed to get session analytics:', error);
      throw error;
    }
  }

  /**
   * Set up real-time monitoring for a session
   */
  async setupSessionMonitoring(sessionId: string): Promise<void> {
    try {
      const subscriptions: any[] = [];

      // Session updates
      const sessionSub = this.db.subscribeToSession(sessionId, (payload) => {
        this.handleSessionUpdate(sessionId, payload);
      });
      subscriptions.push(sessionSub);

      // Stage execution updates
      const stageSub = this.stageEngineAdapter.subscribeToStageUpdates(sessionId, (execution) => {
        this.handleStageUpdate(sessionId, execution);
      });
      subscriptions.push(stageSub);

      // Graph data updates
      const graphSub = this.db.subscribeToGraphChanges(sessionId, (payload) => {
        this.handleGraphUpdate(sessionId, payload);
      });
      subscriptions.push(graphSub);

      // Hypothesis updates
      const hypothesisSub = this.hypothesisAdapter.subscribeToHypothesisUpdates(sessionId, (hypothesis) => {
        this.handleHypothesisUpdate(sessionId, hypothesis);
      });
      subscriptions.push(hypothesisSub);

      // Knowledge gap updates
      const gapSub = this.knowledgeGapAdapter.subscribeToKnowledgeGapUpdates(sessionId, (gap) => {
        this.handleKnowledgeGapUpdate(sessionId, gap);
      });
      subscriptions.push(gapSub);

      // Performance monitoring
      if (this.config.performanceThresholds) {
        const perfSub = await this.performanceAdapter.setupRealtimeMonitoring(
          sessionId,
          this.config.performanceThresholds,
          (alert) => this.handlePerformanceAlert(sessionId, alert)
        );
        subscriptions.push(perfSub);
      }

      // Store subscriptions for cleanup
      this.activeSubscriptions.set(sessionId, subscriptions);

    } catch (error) {
      console.error('Failed to set up session monitoring:', error);
      throw error;
    }
  }

  /**
   * Clean up session monitoring
   */
  async cleanupSessionMonitoring(sessionId: string): Promise<void> {
    try {
      const subscriptions = this.activeSubscriptions.get(sessionId);
      if (subscriptions) {
        subscriptions.forEach(sub => {
          if (typeof sub === 'function') {
            sub(); // Unsubscribe function
          } else if (sub && typeof sub.unsubscribe === 'function') {
            sub.unsubscribe();
          }
        });
        this.activeSubscriptions.delete(sessionId);
      }
    } catch (error) {
      console.error('Failed to cleanup session monitoring:', error);
    }
  }

  /**
   * Export session data
   */
  async exportSession(
    sessionId: string,
    format: 'json' | 'csv',
    includeGraphData: boolean = true
  ): Promise<{
    exportData: string;
    exportRecord: any;
  }> {
    try {
      const user = await this.db.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Gather all session data
      const analytics = await this.getSessionAnalytics(sessionId);
      const graphData = includeGraphData ? await this.db.getGraphData(sessionId) : null;

      let exportData: string;
      let exportType: string;

      if (format === 'json') {
        exportData = JSON.stringify({
          ...analytics,
          ...(graphData && { graphData })
        }, null, 2);
        exportType = 'json';
      } else {
        // Simplified CSV export
        exportData = this.convertToCSV(analytics);
        exportType = 'csv';
      }

      // Record export
      const exportRecord = await this.db.supabase
        .from('export_history')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          export_type: exportType,
          export_format: format,
          file_size_bytes: new Blob([exportData]).size,
          download_count: 0
        })
        .select()
        .single();

      return {
        exportData,
        exportRecord: exportRecord.data
      };

    } catch (error) {
      console.error('Failed to export session:', error);
      throw error;
    }
  }

  /**
   * Get database health status
   */
  async getHealthStatus(): Promise<{
    database: any;
    adapters: Record<string, any>;
    monitoring: any;
  }> {
    try {
      const dbHealth = await this.db.healthCheck();
      
      return {
        database: dbHealth,
        adapters: {
          hypothesis: 'healthy',
          knowledgeGap: 'healthy', 
          stageEngine: 'healthy',
          performance: 'healthy'
        },
        monitoring: {
          activeSessions: this.activeSubscriptions.size,
          subscriptionsPerSession: Array.from(this.activeSubscriptions.values())
            .map(subs => subs.length)
        }
      };

    } catch (error) {
      console.error('Failed to get health status:', error);
      return {
        database: { status: 'unhealthy', message: error instanceof Error ? error.message : 'Unknown error' },
        adapters: { error: 'Health check failed' },
        monitoring: { error: 'Health check failed' }
      };
    }
  }

  /**
   * Private helper methods
   */
  private async generateHypothesesFromResults(
    sessionId: string,
    stageExecutions: any[],
    graphData: GraphData
  ): Promise<any[]> {
    try {
      // Extract potential hypotheses from stage results
      const hypotheses: any[] = [];
      
      for (const execution of stageExecutions) {
        if (execution.output_data?.hypotheses) {
          for (const hyp of execution.output_data.hypotheses) {
            const hypothesis = {
              description: hyp.description || hyp.text || 'Generated hypothesis',
              proposer: 'system',
              timestamp: new Date().toISOString(),
              supportingEvidence: hyp.evidence || [],
              contradictingEvidence: [],
              relatedNodes: hyp.related_nodes || [],
              confidence: hyp.confidence || 0.5,
              explanatoryPower: 0.5,
              falsifiability: 0.5,
              simplicity: 0.5,
              novelty: 0.5,
              testability: 0.5,
              scope: 'regional' as const,
              domain: [execution.stage_name],
              metadata: {
                research_paradigm: 'empirical',
                methodological_approach: 'quantitative', 
                theoretical_framework: 'scientific',
                empirical_support: 0.5,
                peer_evaluations: []
              }
            };

            const result = await this.hypothesisAdapter.registerHypothesis(sessionId, hypothesis);
            if (result.success && result.dbHypothesis) {
              hypotheses.push(result.dbHypothesis);
            }
          }
        }
      }

      return hypotheses;
    } catch (error) {
      console.error('Failed to generate hypotheses from results:', error);
      return [];
    }
  }

  private async getCollaborationAnalytics(sessionId: string): Promise<any> {
    try {
      const { data, error } = await this.db.supabase
        .from('research_collaborations')
        .select('*')
        .eq('session_id', sessionId);

      if (error) throw error;

      return {
        totalCollaborators: data?.length || 0,
        roleDistribution: data?.reduce((acc, collab) => {
          acc[collab.role] = (acc[collab.role] || 0) + 1;
          return acc;
        }, {}) || {},
        pendingInvitations: data?.filter(c => c.status === 'pending').length || 0
      };
    } catch (error) {
      console.error('Failed to get collaboration analytics:', error);
      return { totalCollaborators: 0, roleDistribution: {}, pendingInvitations: 0 };
    }
  }

  private convertToCSV(analytics: any): string {
    // Simplified CSV conversion - could be enhanced
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Session ID', analytics.sessionOverview.id],
      ['Title', analytics.sessionOverview.title],
      ['Status', analytics.sessionOverview.status],
      ['Overall Confidence', analytics.sessionOverview.overallConfidence?.toString() || 'N/A'],
      ['Total Execution Time', analytics.sessionOverview.totalExecutionTime?.toString() || 'N/A'],
      ['Total Hypotheses', analytics.hypothesisAnalytics.total?.toString() || '0'],
      ['Knowledge Gaps', Object.keys(analytics.knowledgeGapAnalytics.gapsByType || {}).length.toString()]
    ];

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  // Event handlers for real-time updates
  private handleSessionUpdate(sessionId: string, payload: any): void {
    // Could emit events or call callbacks for UI updates
    console.log(`Session ${sessionId} updated:`, payload);
  }

  private handleStageUpdate(sessionId: string, execution: any): void {
    console.log(`Stage update for session ${sessionId}:`, execution);
  }

  private handleGraphUpdate(sessionId: string, payload: any): void {
    console.log(`Graph update for session ${sessionId}:`, payload);
  }

  private handleHypothesisUpdate(sessionId: string, hypothesis: any): void {
    console.log(`Hypothesis update for session ${sessionId}:`, hypothesis);
  }

  private handleKnowledgeGapUpdate(sessionId: string, gap: any): void {
    console.log(`Knowledge gap update for session ${sessionId}:`, gap);
  }

  private handlePerformanceAlert(sessionId: string, alert: any): void {
    console.warn(`Performance alert for session ${sessionId}:`, alert);
    
    // Could automatically log high-severity alerts
    if (alert.severity === 'high') {
      this.db.logError({
        session_id: sessionId,
        error_type: 'performance_threshold_exceeded',
        error_message: `Performance threshold exceeded: ${alert.type}`,
        severity: 'medium',
        resolved: false,
        context: alert
      }).catch(console.error);
    }
  }
}

// Singleton instance - SECURITY: No fallback credentials, environment variables required
export const adapterManager = new AdapterManager({
  // SECURITY: Environment variable required, no fallback
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || (() => {
    throw new Error('VITE_GEMINI_API_KEY environment variable is required');
  })(),
  enableRealTimeUpdates: true,
  performanceThresholds: {
    maxExecutionTime: 30000, // 30 seconds
    maxMemoryUsage: 1000, // 1GB
    maxCpuUsage: 90, // 90%
    minThroughput: 0.1 // Minimum throughput
  }
});