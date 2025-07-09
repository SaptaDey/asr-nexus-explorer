/**
 * Knowledge Gap Detection Database Adapter
 * Integrates KnowledgeGapDetector with Supabase persistence
 */

import { DatabaseService, DbKnowledgeGap } from '../DatabaseService';
import { KnowledgeGapDetector, KnowledgeGap, GapAnalysisResult } from '@/services/analysis/KnowledgeGapDetector';
import { GraphData } from '@/types/asrGotTypes';

export class KnowledgeGapAdapter {
  private db: DatabaseService;
  private gapDetector: KnowledgeGapDetector;

  constructor(databaseService: DatabaseService) {
    this.db = databaseService;
    this.gapDetector = new KnowledgeGapDetector();
  }

  /**
   * Detect knowledge gaps and persist them to database
   */
  async detectAndPersistKnowledgeGaps(
    sessionId: string,
    graphData: GraphData,
    researchContext: any,
    analysisResults: any[]
  ): Promise<{
    gapAnalysis: GapAnalysisResult;
    persistedGaps: DbKnowledgeGap[];
    stageExecution: any;
  }> {
    const startTime = Date.now();

    try {
      // Detect knowledge gaps
      const gapAnalysis = await this.gapDetector.detectKnowledgeGaps(
        graphData,
        researchContext,
        analysisResults
      );

      // Persist gaps to database
      const persistedGaps: DbKnowledgeGap[] = [];
      
      for (const gap of gapAnalysis.gaps) {
        try {
          const dbGap = await this.db.saveKnowledgeGap({
            session_id: sessionId,
            gap_type: gap.type,
            description: gap.description,
            priority: gap.priority,
            fillability: gap.fillability,
            related_nodes: gap.affectedNodes,
            research_recommendations: gap.researchRecommendations,
            status: 'identified'
          });
          persistedGaps.push(dbGap);
        } catch (error) {
          console.error(`Failed to persist gap ${gap.id}:`, error);
        }
      }

      // Log performance metrics
      const executionTime = Date.now() - startTime;
      await this.db.savePerformanceMetric({
        session_id: sessionId,
        operation_type: 'knowledge_gap_detection',
        execution_time_ms: executionTime,
        success_count: persistedGaps.length,
        error_count: gapAnalysis.gaps.length - persistedGaps.length
      });

      // Log stage execution
      const stageExecution = await this.db.saveStageExecution({
        session_id: sessionId,
        stage_number: 15, // P1.15 Knowledge Gap Detection
        stage_name: 'Knowledge Gap Detection',
        status: 'completed',
        input_data: {
          graph_nodes: graphData.nodes.length,
          graph_edges: graphData.edges.length,
          research_context: researchContext
        },
        output_data: {
          gaps_detected: gapAnalysis.gaps.length,
          gaps_persisted: persistedGaps.length,
          confidence_score: gapAnalysis.confidence,
          recommendations: gapAnalysis.recommendations
        },
        execution_time_ms: executionTime,
        confidence_score: gapAnalysis.confidence,
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString()
      });

      return {
        gapAnalysis,
        persistedGaps,
        stageExecution
      };
    } catch (error) {
      // Log error
      await this.db.logError({
        session_id: sessionId,
        error_type: 'knowledge_gap_detection_failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        severity: 'high',
        resolved: false,
        context: {
          graph_nodes: graphData.nodes.length,
          graph_edges: graphData.edges.length
        }
      });

      throw error;
    }
  }

  /**
   * Update gap status and track progress
   */
  async updateGapStatus(
    gapId: string,
    status: 'identified' | 'researching' | 'filled' | 'unfillable',
    researchNotes?: string,
    fillingEvidence?: any[]
  ): Promise<DbKnowledgeGap> {
    try {
      const updates: Partial<DbKnowledgeGap> = {
        status,
        ...(researchNotes && { 
          research_recommendations: [
            ...(await this.getKnowledgeGap(gapId))?.research_recommendations || [],
            researchNotes
          ]
        })
      };

      // If gap is being filled, increase fillability score
      if (status === 'filled' && fillingEvidence) {
        updates.fillability = Math.min(1.0, updates.fillability! + 0.3);
        updates.research_recommendations = [
          ...(updates.research_recommendations || []),
          `Gap filled with evidence: ${JSON.stringify(fillingEvidence)}`
        ];
      }

      return await this.db.updateKnowledgeGap(gapId, updates);
    } catch (error) {
      console.error('Failed to update gap status:', error);
      throw error;
    }
  }

  /**
   * Get knowledge gap by ID
   */
  async getKnowledgeGap(gapId: string): Promise<DbKnowledgeGap | null> {
    try {
      const { data, error } = await this.db.supabase
        .from('knowledge_gaps')
        .select('*')
        .eq('id', gapId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Failed to get knowledge gap:', error);
      return null;
    }
  }

  /**
   * Update knowledge gap
   */
  async updateKnowledgeGap(gapId: string, updates: Partial<DbKnowledgeGap>): Promise<DbKnowledgeGap> {
    try {
      const { data, error } = await this.db.supabase
        .from('knowledge_gaps')
        .update(updates)
        .eq('id', gapId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to update knowledge gap:', error);
      throw error;
    }
  }

  /**
   * Prioritize gaps based on research impact
   */
  async prioritizeKnowledgeGaps(
    sessionId: string,
    criteria: {
      urgency: number;
      feasibility: number;
      impact: number;
      resources: number;
    }
  ): Promise<{
    prioritizedGaps: DbKnowledgeGap[];
    recommendations: string[];
  }> {
    try {
      const gaps = await this.db.getKnowledgeGaps(sessionId);
      
      // Calculate priority scores
      const prioritizedGaps = gaps.map(gap => {
        const priorityScore = 
          (gap.priority * criteria.urgency) +
          (gap.fillability * criteria.feasibility) +
          (gap.priority * criteria.impact) +
          (gap.fillability * criteria.resources);
        
        return {
          ...gap,
          calculated_priority: priorityScore / 4 // Normalize
        };
      }).sort((a, b) => b.calculated_priority - a.calculated_priority);

      // Generate recommendations
      const recommendations = [
        `Focus on ${prioritizedGaps.slice(0, 3).length} highest priority gaps`,
        `${prioritizedGaps.filter(g => g.status === 'identified').length} gaps need research attention`,
        `Consider collaborative research for ${prioritizedGaps.filter(g => g.fillability < 0.5).length} difficult gaps`
      ];

      // Update priorities in database
      for (const gap of prioritizedGaps) {
        await this.updateKnowledgeGap(gap.id, {
          priority: gap.calculated_priority
        });
      }

      return {
        prioritizedGaps,
        recommendations
      };
    } catch (error) {
      console.error('Failed to prioritize knowledge gaps:', error);
      throw error;
    }
  }

  /**
   * Generate gap-filling strategies
   */
  async generateGapFillingStrategies(
    sessionId: string,
    gapId: string
  ): Promise<{
    strategies: Array<{
      type: string;
      description: string;
      effort: 'low' | 'medium' | 'high';
      timeline: string;
      resources: string[];
    }>;
    recommendedStrategy: string;
  }> {
    try {
      const gap = await this.getKnowledgeGap(gapId);
      if (!gap) throw new Error('Gap not found');

      // Use gap detector to generate filling strategies
      const strategies = await this.gapDetector.generateFillingStrategies(
        gap.gap_type,
        gap.description,
        gap.fillability,
        gap.related_nodes || []
      );

      // Persist strategies as research recommendations
      await this.updateKnowledgeGap(gapId, {
        research_recommendations: [
          ...(gap.research_recommendations || []),
          `Generated filling strategies: ${JSON.stringify(strategies)}`
        ]
      });

      return strategies;
    } catch (error) {
      console.error('Failed to generate gap filling strategies:', error);
      throw error;
    }
  }

  /**
   * Track gap resolution progress
   */
  async trackGapResolution(sessionId: string): Promise<{
    totalGaps: number;
    resolvedGaps: number;
    inProgressGaps: number;
    resolutionRate: number;
    avgResolutionTime: number;
    recommendations: string[];
  }> {
    try {
      const gaps = await this.db.getKnowledgeGaps(sessionId);
      
      const totalGaps = gaps.length;
      const resolvedGaps = gaps.filter(g => g.status === 'filled').length;
      const inProgressGaps = gaps.filter(g => g.status === 'researching').length;
      const resolutionRate = totalGaps > 0 ? resolvedGaps / totalGaps : 0;

      // Calculate average resolution time for filled gaps
      const resolvedGapTimes = gaps
        .filter(g => g.status === 'filled')
        .map(g => new Date(g.updated_at).getTime() - new Date(g.created_at).getTime())
        .filter(time => time > 0);
      
      const avgResolutionTime = resolvedGapTimes.length > 0 
        ? resolvedGapTimes.reduce((sum, time) => sum + time, 0) / resolvedGapTimes.length 
        : 0;

      // Generate recommendations
      const recommendations = [
        `${resolutionRate > 0.7 ? 'Excellent' : resolutionRate > 0.4 ? 'Good' : 'Poor'} gap resolution rate: ${(resolutionRate * 100).toFixed(1)}%`,
        `${inProgressGaps} gaps currently being researched`,
        avgResolutionTime > 0 ? `Average resolution time: ${Math.round(avgResolutionTime / (1000 * 60 * 60 * 24))} days` : 'No gaps resolved yet'
      ];

      return {
        totalGaps,
        resolvedGaps,
        inProgressGaps,
        resolutionRate,
        avgResolutionTime,
        recommendations
      };
    } catch (error) {
      console.error('Failed to track gap resolution:', error);
      throw error;
    }
  }

  /**
   * Get knowledge gap trends and patterns
   */
  async getGapTrends(sessionId: string): Promise<{
    gapsByType: Record<string, number>;
    gapsByPriority: Record<string, number>;
    fillabilityDistribution: Record<string, number>;
    trendsOverTime: Array<{
      date: string;
      identified: number;
      filled: number;
      inProgress: number;
    }>;
  }> {
    try {
      const gaps = await this.db.getKnowledgeGaps(sessionId);

      const gapsByType = gaps.reduce((acc, gap) => {
        acc[gap.gap_type] = (acc[gap.gap_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const gapsByPriority = gaps.reduce((acc, gap) => {
        const priorityLevel = gap.priority > 0.7 ? 'high' : gap.priority > 0.4 ? 'medium' : 'low';
        acc[priorityLevel] = (acc[priorityLevel] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const fillabilityDistribution = gaps.reduce((acc, gap) => {
        const fillabilityLevel = gap.fillability > 0.7 ? 'high' : gap.fillability > 0.4 ? 'medium' : 'low';
        acc[fillabilityLevel] = (acc[fillabilityLevel] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Simple trends over time (could be enhanced with more sophisticated analysis)
      const trendsOverTime = [{
        date: new Date().toISOString().split('T')[0],
        identified: gaps.filter(g => g.status === 'identified').length,
        filled: gaps.filter(g => g.status === 'filled').length,
        inProgress: gaps.filter(g => g.status === 'researching').length
      }];

      return {
        gapsByType,
        gapsByPriority,
        fillabilityDistribution,
        trendsOverTime
      };
    } catch (error) {
      console.error('Failed to get gap trends:', error);
      throw error;
    }
  }

  /**
   * Real-time knowledge gap updates subscription
   */
  subscribeToKnowledgeGapUpdates(sessionId: string, callback: (gap: DbKnowledgeGap) => void) {
    return this.db.supabase
      .channel(`knowledge_gaps_${sessionId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'knowledge_gaps',
          filter: `session_id=eq.${sessionId}`
        }, 
        (payload) => {
          if (payload.new) {
            callback(payload.new as DbKnowledgeGap);
          }
        }
      )
      .subscribe();
  }

  /**
   * Export knowledge gaps for analysis
   */
  async exportKnowledgeGaps(sessionId: string, format: 'json' | 'csv'): Promise<string> {
    try {
      const gaps = await this.db.getKnowledgeGaps(sessionId);
      
      if (format === 'json') {
        return JSON.stringify(gaps, null, 2);
      } else if (format === 'csv') {
        const headers = ['ID', 'Type', 'Description', 'Priority', 'Fillability', 'Status', 'Created'];
        const rows = gaps.map(gap => [
          gap.id,
          gap.gap_type,
          gap.description.replace(/,/g, ';'), // Escape commas
          gap.priority.toString(),
          gap.fillability.toString(),
          gap.status,
          gap.created_at
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
      }

      throw new Error(`Unsupported format: ${format}`);
    } catch (error) {
      console.error('Failed to export knowledge gaps:', error);
      throw error;
    }
  }
}