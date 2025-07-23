/**
 * Production-Ready Query History Service
 * Comprehensive tracking, pause-resume, and RAG integration for ASR-GoT framework
 */

import { supabase } from '@/integrations/supabase/client';
import { GraphData, ResearchContext } from '@/types/asrGotTypes';

export interface QuerySession {
  id: string;
  query: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  current_stage: number;
  total_stages: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  research_context: ResearchContext;
  graph_data: GraphData;
  stage_results: string[];
  figures: QueryFigure[];
  tables: QueryTable[];
  metadata: QueryMetadata;
  user_id?: string;
  tags: string[];
}

export interface QueryFigure {
  id: string;
  session_id: string;
  stage: number;
  title: string;
  description: string;
  figure_type: 'chart' | 'graph' | 'visualization' | 'plot';
  data_url: string;
  file_path: string;
  metadata: any;
  created_at: string;
}

export interface QueryTable {
  id: string;
  session_id: string;
  stage: number;
  title: string;
  description: string;
  data: any[];
  schema: any;
  created_at: string;
}

export interface QueryMetadata {
  token_usage: {
    total: number;
    by_stage: Record<number, number>;
  };
  execution_time: {
    total_seconds: number;
    by_stage: Record<number, number>;
  };
  api_calls: {
    gemini: number;
    perplexity: number;
  };
  quality_metrics: {
    avg_confidence: number;
    evidence_count: number;
    hypothesis_count: number;
  };
}

export class QueryHistoryService {
  private static instance: QueryHistoryService;
  
  public static getInstance(): QueryHistoryService {
    if (!QueryHistoryService.instance) {
      QueryHistoryService.instance = new QueryHistoryService();
    }
    return QueryHistoryService.instance;
  }

  /**
   * Create a new query session
   */
  async createSession(query: string, researchContext: ResearchContext): Promise<string> {
    try {
      const sessionData = {
        id: crypto.randomUUID(),
        query: query.trim(),
        status: 'running' as const,
        current_stage: 0,
        total_stages: 9,
        research_context: researchContext,
        graph_data: { nodes: [], edges: [], metadata: {} },
        stage_results: [],
        figures: [],
        tables: [],
        metadata: {
          token_usage: { total: 0, by_stage: {} },
          execution_time: { total_seconds: 0, by_stage: {} },
          api_calls: { gemini: 0, perplexity: 0 },
          quality_metrics: { avg_confidence: 0, evidence_count: 0, hypothesis_count: 0 }
        },
        tags: this.generateAutoTags(query, researchContext),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('query_sessions')
        .insert([sessionData])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Query session created:', sessionData.id);
      return sessionData.id;
    } catch (error) {
      console.error('❌ Failed to create query session:', error);
      throw error;
    }
  }

  /**
   * Update session with stage progress (real-time)
   */
  async updateStageProgress(
    sessionId: string, 
    stage: number, 
    result: string,
    graphData?: GraphData,
    tokenUsed?: number,
    executionTime?: number
  ): Promise<void> {
    try {
      // Get current session
      const { data: session, error: fetchError } = await supabase
        .from('query_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (fetchError) throw fetchError;

      // Update stage results
      const stageResults = [...session.stage_results];
      stageResults[stage] = result;

      // Update metadata
      const metadata = { ...session.metadata };
      if (tokenUsed) {
        metadata.token_usage.total += tokenUsed;
        metadata.token_usage.by_stage[stage] = tokenUsed;
      }
      if (executionTime) {
        metadata.execution_time.total_seconds += executionTime;
        metadata.execution_time.by_stage[stage] = executionTime;
      }

      // Update session
      const { error: updateError } = await supabase
        .from('query_sessions')
        .update({
          current_stage: stage,
          stage_results: stageResults,
          graph_data: graphData || session.graph_data,
          metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      console.log(`✅ Stage ${stage} progress updated for session ${sessionId}`);
    } catch (error) {
      console.error('❌ Failed to update stage progress:', error);
      throw error;
    }
  }

  /**
   * Pause a running session
   */
  async pauseSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('query_sessions')
        .update({
          status: 'paused',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
      console.log(`⏸️ Session paused: ${sessionId}`);
    } catch (error) {
      console.error('❌ Failed to pause session:', error);
      throw error;
    }
  }

  /**
   * Resume a paused session
   */
  async resumeSession(sessionId: string): Promise<QuerySession> {
    try {
      // Update status to running
      const { error: updateError } = await supabase
        .from('query_sessions')
        .update({
          status: 'running',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      // Get updated session
      const { data: session, error: fetchError } = await supabase
        .from('query_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (fetchError) throw fetchError;

      console.log(`▶️ Session resumed: ${sessionId} from stage ${session.current_stage}`);
      return session;
    } catch (error) {
      console.error('❌ Failed to resume session:', error);
      throw error;
    }
  }

  /**
   * Complete a session
   */
  async completeSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('query_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
      console.log(`✅ Session completed: ${sessionId}`);
    } catch (error) {
      console.error('❌ Failed to complete session:', error);
      throw error;
    }
  }

  /**
   * Store figure data
   */
  async storeFigure(
    sessionId: string,
    stage: number,
    title: string,
    description: string,
    figureType: 'chart' | 'graph' | 'visualization' | 'plot',
    dataBlob: Blob,
    metadata: any = {}
  ): Promise<string> {
    try {
      const figureId = crypto.randomUUID();
      const fileName = `${sessionId}/stage_${stage}/${figureId}.png`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('query-figures')
        .upload(fileName, dataBlob, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('query-figures')
        .getPublicUrl(fileName);

      // Store figure metadata
      const figureData = {
        id: figureId,
        session_id: sessionId,
        stage,
        title,
        description,
        figure_type: figureType,
        data_url: urlData.publicUrl,
        file_path: fileName,
        metadata,
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('query_figures')
        .insert([figureData]);

      if (insertError) throw insertError;

      console.log(`📊 Figure stored: ${title} for session ${sessionId}`);
      return figureId;
    } catch (error) {
      console.error('❌ Failed to store figure:', error);
      throw error;
    }
  }

  /**
   * Store table data
   */
  async storeTable(
    sessionId: string,
    stage: number,
    title: string,
    description: string,
    data: any[],
    schema: any = {}
  ): Promise<string> {
    try {
      const tableId = crypto.randomUUID();

      const tableData = {
        id: tableId,
        session_id: sessionId,
        stage,
        title,
        description,
        data,
        schema,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('query_tables')
        .insert([tableData]);

      if (error) throw error;

      console.log(`📋 Table stored: ${title} for session ${sessionId}`);
      return tableId;
    } catch (error) {
      console.error('❌ Failed to store table:', error);
      throw error;
    }
  }

  /**
   * Get all query sessions with filtering and search
   */
  async getQueryHistory(
    limit: number = 50,
    offset: number = 0,
    searchTerm?: string,
    status?: string,
    startDate?: string,
    endDate?: string,
    tags?: string[]
  ): Promise<{ sessions: QuerySession[], total: number }> {
    try {
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

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        sessions: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('❌ Failed to get query history:', error);
      throw error;
    }
  }

  /**
   * Get session with all related data
   */
  async getSessionDetails(sessionId: string): Promise<{
    session: QuerySession;
    figures: QueryFigure[];
    tables: QueryTable[];
  }> {
    try {
      // Get session
      const { data: session, error: sessionError } = await supabase
        .from('query_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Get figures
      const { data: figures, error: figuresError } = await supabase
        .from('query_figures')
        .select('*')
        .eq('session_id', sessionId)
        .order('stage', { ascending: true });

      if (figuresError) throw figuresError;

      // Get tables
      const { data: tables, error: tablesError } = await supabase
        .from('query_tables')
        .select('*')
        .eq('session_id', sessionId)
        .order('stage', { ascending: true });

      if (tablesError) throw tablesError;

      return {
        session,
        figures: figures || [],
        tables: tables || []
      };
    } catch (error) {
      console.error('❌ Failed to get session details:', error);
      throw error;
    }
  }

  /**
   * Delete a session and all related data
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      // Delete figures from storage
      const { data: figures } = await supabase
        .from('query_figures')
        .select('file_path')
        .eq('session_id', sessionId);

      if (figures && figures.length > 0) {
        const filePaths = figures.map(f => f.file_path);
        await supabase.storage
          .from('query-figures')
          .remove(filePaths);
      }

      // Delete database records (cascading)
      const { error } = await supabase
        .from('query_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      console.log(`🗑️ Session deleted: ${sessionId}`);
    } catch (error) {
      console.error('❌ Failed to delete session:', error);
      throw error;
    }
  }

  /**
   * Auto-generate tags based on query and context
   */
  private generateAutoTags(query: string, context: ResearchContext): string[] {
    const tags: string[] = [];

    // Add field tag
    if (context.field) {
      tags.push(context.field.toLowerCase());
    }

    // Add topic-based tags
    if (context.topic) {
      const topic = context.topic.toLowerCase();
      if (topic.includes('cancer')) tags.push('oncology');
      if (topic.includes('lymphoma')) tags.push('hematology');
      if (topic.includes('treatment')) tags.push('therapeutics');
      if (topic.includes('diagnosis')) tags.push('diagnostics');
      if (topic.includes('genetic')) tags.push('genomics');
    }

    // Add query-based tags
    const queryLower = query.toLowerCase();
    if (queryLower.includes('clinical')) tags.push('clinical-research');
    if (queryLower.includes('molecular')) tags.push('molecular-biology');
    if (queryLower.includes('biomarker')) tags.push('biomarkers');
    if (queryLower.includes('survival')) tags.push('survival-analysis');

    return [...new Set(tags)]; // Remove duplicates
  }
}

export const queryHistoryService = QueryHistoryService.getInstance();