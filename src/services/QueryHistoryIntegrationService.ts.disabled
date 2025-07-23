/**
 * Query History Integration Service
 * Seamlessly integrates query history and pause-resume with existing ASR-GoT framework
 */

import { queryHistoryService } from './QueryHistoryService';
import { GraphData, ResearchContext } from '@/types/asrGotTypes';
import { toast } from 'sonner';

export class QueryHistoryIntegrationService {
  private static instance: QueryHistoryIntegrationService;
  private currentSessionId: string | null = null;
  private isTrackingEnabled: boolean = true;

  public static getInstance(): QueryHistoryIntegrationService {
    if (!QueryHistoryIntegrationService.instance) {
      QueryHistoryIntegrationService.instance = new QueryHistoryIntegrationService();
    }
    return QueryHistoryIntegrationService.instance;
  }

  /**
   * Initialize tracking for a new research session
   */
  async initializeSession(query: string, researchContext: ResearchContext): Promise<string> {
    if (!this.isTrackingEnabled) {
      return '';
    }

    try {
      this.currentSessionId = await queryHistoryService.createSession(query, researchContext);
      
      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent('query-session-started', {
        detail: { sessionId: this.currentSessionId, query, researchContext }
      }));

      console.log('🚀 Query history tracking initialized:', this.currentSessionId);
      return this.currentSessionId;
    } catch (error) {
      console.error('Failed to initialize query session:', error);
      toast.error('Failed to initialize session tracking');
      return '';
    }
  }

  /**
   * Track stage completion with automatic storage
   */
  async trackStageCompletion(
    stage: number, 
    result: string, 
    graphData?: GraphData,
    metadata?: {
      executionTime?: number;
      tokenUsage?: number;
      apiCalls?: { gemini?: number; perplexity?: number };
    }
  ): Promise<void> {
    if (!this.currentSessionId || !this.isTrackingEnabled) return;

    try {
      await queryHistoryService.updateStageProgress(
        this.currentSessionId,
        stage,
        result,
        graphData,
        metadata?.tokenUsage,
        metadata?.executionTime
      );

      // Update session metadata
      if (metadata?.apiCalls) {
        // Additional metadata update could go here
      }

      // Dispatch stage completion event
      window.dispatchEvent(new CustomEvent('stage-tracked', {
        detail: { sessionId: this.currentSessionId, stage, result, metadata }
      }));

      console.log(`📝 Stage ${stage} tracked and stored`);
    } catch (error) {
      console.error(`Failed to track stage ${stage}:`, error);
    }
  }

  /**
   * Store generated figures
   */
  async storeFigure(
    stage: number,
    title: string,
    description: string,
    figureType: 'chart' | 'graph' | 'visualization' | 'plot',
    imageData: string | Blob,
    metadata: any = {}
  ): Promise<void> {
    if (!this.currentSessionId || !this.isTrackingEnabled) return;

    try {
      let blob: Blob;
      
      if (typeof imageData === 'string') {
        // Convert data URL to blob
        const response = await fetch(imageData);
        blob = await response.blob();
      } else {
        blob = imageData;
      }

      await queryHistoryService.storeFigure(
        this.currentSessionId,
        stage,
        title,
        description,
        figureType,
        blob,
        metadata
      );

      console.log(`📊 Figure stored: ${title} (Stage ${stage})`);
    } catch (error) {
      console.error('Failed to store figure:', error);
    }
  }

  /**
   * Store generated tables
   */
  async storeTable(
    stage: number,
    title: string,
    description: string,
    tableData: any[],
    schema: any = {}
  ): Promise<void> {
    if (!this.currentSessionId || !this.isTrackingEnabled) return;

    try {
      await queryHistoryService.storeTable(
        this.currentSessionId,
        stage,
        title,
        description,
        tableData,
        schema
      );

      console.log(`📋 Table stored: ${title} (Stage ${stage})`);
    } catch (error) {
      console.error('Failed to store table:', error);
    }
  }

  /**
   * Pause current session
   */
  async pauseCurrentSession(): Promise<void> {
    if (!this.currentSessionId) return;

    try {
      await queryHistoryService.pauseSession(this.currentSessionId);
      
      // Dispatch pause event
      window.dispatchEvent(new CustomEvent('session-paused', {
        detail: { sessionId: this.currentSessionId }
      }));

      toast.success('⏸️ Session paused - resume from History tab');
      this.currentSessionId = null; // Clear current session
    } catch (error) {
      console.error('Failed to pause session:', error);
      toast.error('Failed to pause session');
    }
  }

  /**
   * Resume a paused session
   */
  async resumeSession(sessionId: string): Promise<{
    session: any;
    shouldContinueFromStage: number;
  }> {
    try {
      const session = await queryHistoryService.resumeSession(sessionId);
      this.currentSessionId = sessionId;

      // Dispatch resume event
      window.dispatchEvent(new CustomEvent('session-resumed', {
        detail: { sessionId, session }
      }));

      toast.success(`▶️ Session resumed from Stage ${session.current_stage + 1}`);
      
      return {
        session,
        shouldContinueFromStage: session.current_stage
      };
    } catch (error) {
      console.error('Failed to resume session:', error);
      toast.error('Failed to resume session');
      throw error;
    }
  }

  /**
   * Complete current session
   */
  async completeCurrentSession(): Promise<void> {
    if (!this.currentSessionId) return;

    try {
      await queryHistoryService.completeSession(this.currentSessionId);
      
      // Dispatch completion event
      window.dispatchEvent(new CustomEvent('session-completed', {
        detail: { sessionId: this.currentSessionId }
      }));

      toast.success('✅ Research session completed and saved to History');
      this.currentSessionId = null; // Clear current session
    } catch (error) {
      console.error('Failed to complete session:', error);
      toast.error('Failed to complete session');
    }
  }

  /**
   * Load session for reanalysis (doesn't change current session)
   */
  async loadSessionForReanalysis(sessionId: string): Promise<{
    session: any;
    figures: any[];
    tables: any[];
  }> {
    try {
      const sessionDetails = await queryHistoryService.getSessionDetails(sessionId);
      
      // Dispatch load event
      window.dispatchEvent(new CustomEvent('session-loaded-for-reanalysis', {
        detail: { sessionId, sessionDetails }
      }));

      toast.success(`📊 Session loaded for reanalysis`);
      return sessionDetails;
    } catch (error) {
      console.error('Failed to load session for reanalysis:', error);
      toast.error('Failed to load session');
      throw error;
    }
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Enable/disable tracking
   */
  setTrackingEnabled(enabled: boolean): void {
    this.isTrackingEnabled = enabled;
    console.log(`Query history tracking ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if tracking is enabled
   */
  isTrackingActive(): boolean {
    return this.isTrackingEnabled && this.currentSessionId !== null;
  }

  /**
   * Get session analytics
   */
  async getSessionAnalytics(): Promise<any> {
    try {
      // This would implement analytics queries
      // For now, return basic info
      return {
        totalSessions: 0,
        completedSessions: 0,
        averageCompletionTime: 0
      };
    } catch (error) {
      console.error('Failed to get session analytics:', error);
      return null;
    }
  }

  /**
   * Export session data
   */
  async exportSession(sessionId: string, format: 'json' | 'html' | 'pdf'): Promise<void> {
    try {
      const sessionDetails = await queryHistoryService.getSessionDetails(sessionId);
      
      if (format === 'json') {
        const exportData = {
          ...sessionDetails,
          exported_at: new Date().toISOString(),
          export_format: format
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
          type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `asr-got-session-${sessionId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      toast.success(`📄 Session exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Failed to export session:', error);
      toast.error('Failed to export session');
    }
  }

  /**
   * Search sessions
   */
  async searchSessions(searchTerm: string, filters: any = {}): Promise<any[]> {
    try {
      const { sessions } = await queryHistoryService.getQueryHistory(
        50, // limit
        0,  // offset
        searchTerm,
        filters.status,
        filters.startDate,
        filters.endDate,
        filters.tags
      );
      
      return sessions;
    } catch (error) {
      console.error('Failed to search sessions:', error);
      return [];
    }
  }
}

// Export singleton instance
export const queryHistoryIntegration = QueryHistoryIntegrationService.getInstance();