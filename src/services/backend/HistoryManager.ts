/**
 * Comprehensive History Manager
 * Handles all session history, persistence, and retrieval operations
 */

import { supabase } from '@/integrations/supabase/client';
import { GraphData, ResearchContext, ASRGoTParameters } from '@/types/asrGotTypes';
import { backendInitializer } from './BackendInitializer';
import { storageManager } from './StorageManager';

export interface SessionHistory {
  id: string;
  title: string;
  description?: string;
  query?: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  current_stage: number;
  total_stages: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  research_context?: ResearchContext;
  parameters?: ASRGoTParameters;
  graph_data?: GraphData;
  stage_results?: string[];
  metadata?: {
    token_usage?: number;
    execution_time?: number;
    api_calls?: any;
    quality_metrics?: any;
  };
  user_id?: string;
  tags?: string[];
}

export interface HistorySearchOptions {
  searchTerm?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export class HistoryManager {
  private static instance: HistoryManager;
  private currentSessionId: string | null = null;

  public static getInstance(): HistoryManager {
    if (!HistoryManager.instance) {
      HistoryManager.instance = new HistoryManager();
    }
    return HistoryManager.instance;
  }

  /**
   * Create a new research session
   */
  async createSession(
    title: string,
    description?: string,
    researchContext?: ResearchContext,
    parameters?: ASRGoTParameters
  ): Promise<string | null> {
    try {
      // Ensure backend is initialized
      const health = backendInitializer.getHealthStatus();
      if (health.database === 'error') {
        await backendInitializer.reinitialize();
      }

      console.log(`📝 Creating new research session: ${title}`);

      const sessionId = crypto.randomUUID();
      const now = new Date().toISOString();

      // Create research session
      const { data: researchSession, error: researchError } = await supabase
        .from('research_sessions')
        .insert([{
          id: sessionId,
          title,
          description,
          status: 'active',
          user_id: '00000000-0000-0000-0000-000000000000', // Anonymous user
          config: {
            research_context: researchContext,
            parameters: parameters,
            created_from: 'asr-got-interface',
            version: '2.0'
          },
          created_at: now,
          updated_at: now
        }])
        .select()
        .single();

      if (researchError) throw researchError;

      // Create corresponding query session for tracking
      if (researchContext) {
        const { error: queryError } = await supabase
          .from('query_sessions')
          .insert([{
            id: sessionId,
            query: researchContext.topic || title,
            status: 'running',
            current_stage: 0,
            total_stages: 9,
            research_context: researchContext,
            graph_data: { nodes: [], edges: [], metadata: {} },
            stage_results: [],
            metadata: {
              token_usage: { total: 0, by_stage: {} },
              execution_time: { total_seconds: 0, by_stage: {} },
              api_calls: { gemini: 0, perplexity: 0 },
              quality_metrics: { avg_confidence: 0, evidence_count: 0, hypothesis_count: 0 }
            },
            tags: this.generateTags(title, researchContext),
            user_id: '00000000-0000-0000-0000-000000000000',
            created_at: now,
            updated_at: now
          }]);

        if (queryError) {
          console.warn('⚠️ Could not create query session:', queryError);
        }
      }

      this.currentSessionId = sessionId;
      console.log(`✅ Session created successfully: ${sessionId}`);
      return sessionId;

    } catch (error) {
      console.error('❌ Failed to create session:', error);
      return null;
    }
  }

  /**
   * Update session with progress
   */
  async updateSession(
    sessionId: string,
    updates: {
      status?: 'running' | 'paused' | 'completed' | 'failed';
      current_stage?: number;
      stage_results?: string[];
      graph_data?: GraphData;
      metadata?: any;
      completed_at?: string;
    }
  ): Promise<boolean> {
    try {
      console.log(`📝 Updating session: ${sessionId}`);

      const now = new Date().toISOString();

      // Update research session
      const { error: researchError } = await supabase
        .from('research_sessions')
        .update({
          status: updates.status === 'completed' ? 'completed' : 'active',
          updated_at: now,
          config: updates.graph_data || updates.metadata ? {
            // Preserve existing config and add new data
          } : undefined
        })
        .eq('id', sessionId);

      if (researchError) {
        console.warn('⚠️ Could not update research session:', researchError);
      }

      // Update query session
      const queryUpdates: any = {
        updated_at: now
      };

      if (updates.status) queryUpdates.status = updates.status;
      if (updates.current_stage !== undefined) queryUpdates.current_stage = updates.current_stage;
      if (updates.stage_results) queryUpdates.stage_results = updates.stage_results;
      if (updates.graph_data) queryUpdates.graph_data = updates.graph_data;
      if (updates.metadata) queryUpdates.metadata = updates.metadata;
      if (updates.completed_at) queryUpdates.completed_at = updates.completed_at;

      const { error: queryError } = await supabase
        .from('query_sessions')
        .update(queryUpdates)
        .eq('id', sessionId);

      if (queryError) {
        console.warn('⚠️ Could not update query session:', queryError);
      }

      console.log(`✅ Session updated: ${sessionId}`);
      return true;

    } catch (error) {
      console.error(`❌ Failed to update session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Get session details
   */
  async getSession(sessionId: string): Promise<SessionHistory | null> {
    try {
      console.log(`📖 Retrieving session: ${sessionId}`);

      // Try query_sessions first (more detailed)
      const { data: querySession, error: queryError } = await supabase
        .from('query_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (!queryError && querySession) {
        return {
          id: querySession.id,
          title: querySession.query.substring(0, 50) + (querySession.query.length > 50 ? '...' : ''),
          query: querySession.query,
          status: querySession.status,
          current_stage: querySession.current_stage,
          total_stages: querySession.total_stages,
          created_at: querySession.created_at,
          updated_at: querySession.updated_at,
          completed_at: querySession.completed_at,
          research_context: querySession.research_context,
          graph_data: querySession.graph_data,
          stage_results: querySession.stage_results,
          metadata: querySession.metadata,
          user_id: querySession.user_id,
          tags: querySession.tags
        };
      }

      // Fallback to research_sessions
      const { data: researchSession, error: researchError } = await supabase
        .from('research_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (researchError || !researchSession) {
        console.error(`❌ Session not found: ${sessionId}`, researchError);
        return null;
      }

      return {
        id: researchSession.id,
        title: researchSession.title,
        description: researchSession.description,
        status: researchSession.status === 'completed' ? 'completed' : 'running',
        current_stage: 0,
        total_stages: 9,
        created_at: researchSession.created_at,
        updated_at: researchSession.updated_at,
        research_context: researchSession.config?.research_context,
        parameters: researchSession.config?.parameters,
        user_id: researchSession.user_id
      };

    } catch (error) {
      console.error(`❌ Failed to retrieve session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Get all sessions with search and filtering
   */
  async getSessions(options: HistorySearchOptions = {}): Promise<{
    sessions: SessionHistory[];
    total: number;
  }> {
    try {
      console.log(`📚 Retrieving sessions with options:`, options);

      const {
        searchTerm,
        status,
        startDate,
        endDate,
        tags,
        limit = 50,
        offset = 0
      } = options;

      // Query query_sessions for detailed data
      let query = supabase
        .from('query_sessions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (searchTerm) {
        query = query.or(`query.ilike.%${searchTerm}%,research_context->topic.ilike.%${searchTerm}%`);
      }
      
      if (status) {
        query = query.eq('status', status);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      if (tags && tags.length > 0) {
        query = query.overlaps('tags', tags);
      }

      query = query.range(offset, offset + limit - 1);

      const { data: querySessions, error: queryError, count } = await query;

      if (queryError) {
        console.warn('⚠️ Query sessions error, falling back to research sessions:', queryError);
        
        // Fallback to research_sessions
        let fallbackQuery = supabase
          .from('research_sessions')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false });

        if (searchTerm) {
          fallbackQuery = fallbackQuery.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }

        if (startDate) {
          fallbackQuery = fallbackQuery.gte('created_at', startDate);
        }

        if (endDate) {
          fallbackQuery = fallbackQuery.lte('created_at', endDate);
        }

        fallbackQuery = fallbackQuery.range(offset, offset + limit - 1);

        const { data: researchSessions, error: researchError, count: fallbackCount } = await fallbackQuery;

        if (researchError) throw researchError;

        const sessions: SessionHistory[] = (researchSessions || []).map(session => ({
          id: session.id,
          title: session.title,
          description: session.description,
          status: session.status === 'completed' ? 'completed' : 'running' as any,
          current_stage: 0,
          total_stages: 9,
          created_at: session.created_at,
          updated_at: session.updated_at,
          research_context: session.config?.research_context,
          parameters: session.config?.parameters,
          user_id: session.user_id
        }));

        return {
          sessions,
          total: fallbackCount || 0
        };
      }

      // Convert query sessions to history format
      const sessions: SessionHistory[] = (querySessions || []).map(session => ({
        id: session.id,
        title: session.query.substring(0, 50) + (session.query.length > 50 ? '...' : ''),
        query: session.query,
        status: session.status,
        current_stage: session.current_stage,
        total_stages: session.total_stages,
        created_at: session.created_at,
        updated_at: session.updated_at,
        completed_at: session.completed_at,
        research_context: session.research_context,
        graph_data: session.graph_data,
        stage_results: session.stage_results,
        metadata: session.metadata,
        user_id: session.user_id,
        tags: session.tags
      }));

      console.log(`✅ Retrieved ${sessions.length} sessions (total: ${count})`);
      return {
        sessions,
        total: count || 0
      };

    } catch (error) {
      console.error('❌ Failed to retrieve sessions:', error);
      return {
        sessions: [],
        total: 0
      };
    }
  }

  /**
   * Delete a session and all related data
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      console.log(`🗑️ Deleting session: ${sessionId}`);

      // Delete from query_sessions (will cascade to related tables)
      const { error: queryError } = await supabase
        .from('query_sessions')
        .delete()
        .eq('id', sessionId);

      if (queryError) {
        console.warn('⚠️ Could not delete from query_sessions:', queryError);
      }

      // Delete from research_sessions
      const { error: researchError } = await supabase
        .from('research_sessions')
        .delete()
        .eq('id', sessionId);

      if (researchError) {
        console.warn('⚠️ Could not delete from research_sessions:', researchError);
      }

      // Clean up storage files
      try {
        const analysisFolder = `${sessionId}`;
        await storageManager.cleanupOldFiles('asr-got-analyses', analysisFolder, 0);
        await storageManager.cleanupOldFiles('asr-got-visualizations', analysisFolder, 0);
        await storageManager.cleanupOldFiles('query-figures', analysisFolder, 0);
      } catch (storageError) {
        console.warn('⚠️ Could not clean up storage files:', storageError);
      }

      console.log(`✅ Session deleted: ${sessionId}`);
      return true;

    } catch (error) {
      console.error(`❌ Failed to delete session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Pause a running session
   */
  async pauseSession(sessionId: string): Promise<boolean> {
    return await this.updateSession(sessionId, { status: 'paused' });
  }

  /**
   * Resume a paused session
   */
  async resumeSession(sessionId: string): Promise<SessionHistory | null> {
    const updated = await this.updateSession(sessionId, { status: 'running' });
    if (updated) {
      return await this.getSession(sessionId);
    }
    return null;
  }

  /**
   * Mark session as completed
   */
  async completeSession(sessionId: string): Promise<boolean> {
    return await this.updateSession(sessionId, {
      status: 'completed',
      completed_at: new Date().toISOString()
    });
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Set current session ID
   */
  setCurrentSessionId(sessionId: string | null): void {
    this.currentSessionId = sessionId;
  }

  /**
   * Generate auto tags for a session
   */
  private generateTags(title: string, context?: ResearchContext): string[] {
    const tags: string[] = [];

    if (context?.field) {
      tags.push(context.field.toLowerCase());
    }

    const text = `${title} ${context?.topic || ''}`.toLowerCase();
    
    // Medical/Research tags
    if (text.includes('cancer')) tags.push('oncology');
    if (text.includes('treatment')) tags.push('therapeutics');
    if (text.includes('diagnosis')) tags.push('diagnostics');
    if (text.includes('clinical')) tags.push('clinical-research');
    if (text.includes('genetic')) tags.push('genomics');
    if (text.includes('molecular')) tags.push('molecular-biology');

    // General research tags
    if (text.includes('analysis')) tags.push('analysis');
    if (text.includes('review')) tags.push('review');
    if (text.includes('study')) tags.push('study');

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Export session data
   */
  async exportSession(sessionId: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return {
          success: false,
          error: 'Session not found'
        };
      }

      // Get all related data
      const [figures, tables, stageExecutions] = await Promise.all([
        supabase.from('query_figures').select('*').eq('session_id', sessionId),
        supabase.from('query_tables').select('*').eq('session_id', sessionId),
        supabase.from('stage_executions').select('*').eq('session_id', sessionId)
      ]);

      const exportData = {
        session,
        figures: figures.data || [],
        tables: tables.data || [],
        stage_executions: stageExecutions.data || [],
        exported_at: new Date().toISOString()
      };

      console.log(`✅ Session exported: ${sessionId}`);
      return {
        success: true,
        data: exportData
      };

    } catch (error) {
      console.error(`❌ Failed to export session ${sessionId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      };
    }
  }
}

// Export singleton instance
export const historyManager = HistoryManager.getInstance();