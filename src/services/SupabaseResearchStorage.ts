/**
 * Supabase Research Storage Service - Exact implementation from specification
 * Handles storing and retrieving Sonar Deep Research results
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SonarDeepResearchResponse, ResearchResultStorage } from '@/types/sonarDeepResearchTypes';

export class SupabaseResearchStorage {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseAnonKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  /**
   * Store research results in Supabase - Exact implementation from specification
   */
  async storeResearchResults(query: string, response: SonarDeepResearchResponse): Promise<any> {
    const { data, error } = await this.supabase
      .from('research_results')
      .insert({
        query: query,
        response_content: response.choices[0].message.content,
        search_results: response.search_results,
        usage_stats: response.usage,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error storing results:', error);
      throw error;
    } else {
      console.log('Results stored successfully:', data);
      return data;
    }
  }

  /**
   * Retrieve research results by query
   */
  async getResearchResults(query: string): Promise<ResearchResultStorage[]> {
    const { data, error } = await this.supabase
      .from('research_results')
      .select('*')
      .eq('query', query)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error retrieving results:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get recent research results
   */
  async getRecentResearchResults(limit: number = 10): Promise<ResearchResultStorage[]> {
    const { data, error } = await this.supabase
      .from('research_results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error retrieving recent results:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Search research results by content
   */
  async searchResearchResults(searchTerm: string): Promise<ResearchResultStorage[]> {
    const { data, error } = await this.supabase
      .from('research_results')
      .select('*')
      .or(`query.ilike.%${searchTerm}%,response_content.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching results:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Delete research result by ID
   */
  async deleteResearchResult(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('research_results')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting result:', error);
      throw error;
    }
  }

  /**
   * Get usage statistics summary
   */
  async getUsageStatistics(): Promise<any> {
    const { data, error } = await this.supabase
      .from('research_results')
      .select('usage_stats, created_at');

    if (error) {
      console.error('Error retrieving usage statistics:', error);
      throw error;
    }

    // Calculate summary statistics
    const totalQueries = data?.length || 0;
    const totalTokens = data?.reduce((sum, result) => sum + (result.usage_stats?.total_tokens || 0), 0) || 0;
    const totalSearchQueries = data?.reduce((sum, result) => sum + (result.usage_stats?.num_search_queries || 0), 0) || 0;
    const totalCitationTokens = data?.reduce((sum, result) => sum + (result.usage_stats?.citation_tokens || 0), 0) || 0;
    const totalReasoningTokens = data?.reduce((sum, result) => sum + (result.usage_stats?.reasoning_tokens || 0), 0) || 0;

    return {
      totalQueries,
      totalTokens,
      totalSearchQueries,
      totalCitationTokens,
      totalReasoningTokens,
      averageTokensPerQuery: totalQueries > 0 ? Math.round(totalTokens / totalQueries) : 0,
      averageSearchQueriesPerRequest: totalQueries > 0 ? Math.round(totalSearchQueries / totalQueries) : 0
    };
  }

  /**
   * Store ASR-GoT stage results with enhanced metadata
   */
  async storeASRGoTStageResult(
    stageId: string,
    query: string,
    response: SonarDeepResearchResponse,
    stageMetadata?: {
      stageNumber: number;
      stageName: string;
      microPass?: string;
      researchDomain?: string;
    }
  ): Promise<any> {
    const { data, error } = await this.supabase
      .from('asr_got_research_results')
      .insert({
        stage_id: stageId,
        query: query,
        response_content: response.choices[0].message.content,
        search_results: response.search_results,
        usage_stats: response.usage,
        stage_metadata: stageMetadata,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error storing ASR-GoT stage result:', error);
      throw error;
    } else {
      console.log('ASR-GoT stage result stored successfully:', data);
      return data;
    }
  }

  /**
   * Get ASR-GoT research results for a specific stage
   */
  async getASRGoTStageResults(stageId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('asr_got_research_results')
      .select('*')
      .eq('stage_id', stageId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error retrieving ASR-GoT stage results:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Initialize database tables if they don't exist
   */
  async initializeTables(): Promise<void> {
    try {
      // Check if tables exist and create them if needed
      // This would typically be done via Supabase dashboard or migrations
      // For now, we'll just log the requirement
      console.log('Database tables should be initialized via Supabase dashboard:');
      console.log('1. research_results table');
      console.log('2. asr_got_research_results table');
    } catch (error) {
      console.error('Error initializing tables:', error);
    }
  }
}