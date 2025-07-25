/**
 * Enhanced Sonar Research Hook - React integration for ScientificResearchAPI
 * Provides state management and integration with ASR-GoT framework
 */

import { useState, useCallback, useRef } from 'react';
import { SonarDeepResearchResponse } from '@/types/sonarDeepResearchTypes';
import { ScientificResearchAPI } from '@/services/ScientificResearchAPI';
import { SupabaseResearchStorage } from '@/services/SupabaseResearchStorage';
import { costAwareOrchestration } from '@/services/CostAwareOrchestrationService';

interface UseEnhancedSonarResearchState {
  isLoading: boolean;
  results: SonarDeepResearchResponse | null;
  error: string | null;
  progress: string;
  usageStats: any | null;
}

interface EnhancedSonarResearchOptions {
  maxTokens?: number;
  dateFilter?: string;
  customDomains?: string[];
  storeResults?: boolean;
  enableCache?: boolean;
  researchDomain?: string;
}

export const useEnhancedSonarResearch = () => {
  const [state, setState] = useState<UseEnhancedSonarResearchState>({
    isLoading: false,
    results: null,
    error: null,
    progress: '',
    usageStats: null
  });

  const scientificAPIRef = useRef<ScientificResearchAPI | null>(null);
  const researchStorageRef = useRef<SupabaseResearchStorage | null>(null);

  /**
   * Initialize the scientific research API
   */
  const initialize = useCallback((apiKey: string) => {
    scientificAPIRef.current = new ScientificResearchAPI(apiKey);
    researchStorageRef.current = new SupabaseResearchStorage();

    // Initialize the cost-aware orchestration service
    costAwareOrchestration.initializeScientificResearch(
      { perplexity: apiKey }
    );
  }, []);

  /**
   * Conduct enhanced Sonar Deep Research
   */
  const conductResearch = useCallback(async (
    query: string,
    options: EnhancedSonarResearchOptions = {}
  ): Promise<SonarDeepResearchResponse | null> => {
    if (!scientificAPIRef.current) {
      setState(prev => ({ ...prev, error: 'Scientific Research API not initialized' }));
      return null;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      progress: 'Initializing research...',
      results: null
    }));

    try {
      setState(prev => ({ ...prev, progress: 'Conducting deep scientific research...' }));

      const result = await scientificAPIRef.current.conductCustomResearch(query, {
        maxTokens: options.maxTokens || 128000,
        dateFilter: options.dateFilter,
        customDomains: options.customDomains || [
          'pubmed.ncbi.nlm.nih.gov',
          'scholar.google.com',
          'arxiv.org',
          'nature.com',
          'science.org',
          'cell.com',
          'nejm.org',
          'bmj.com',
          'plos.org',
          'springer.com'
        ],
        customSystemPrompt: `You are an expert scientific research assistant specializing in comprehensive literature review and data extraction. Your task is to:

1. Search through all available peer-reviewed scientific literature
2. Identify and extract relevant datasets, tables, charts, and supplementary materials
3. Focus on finding downloadable raw datasets and supplementary files
4. Organize findings systematically for data visualization and analysis
5. Provide detailed citations and source information
6. Highlight any statistical data, correlation analyses, and quantitative findings
7. Note any available supplementary data files, raw datasets, or downloadable materials

When analyzing scientific papers, pay special attention to:
- Methods sections for dataset descriptions
- Results sections for statistical analyses and charts
- Supplementary materials and data availability statements
- Tables with raw data or statistical summaries
- Figure legends that might reference underlying datasets
- Data repository links (e.g., GEO, ArrayExpress, Zenodo, Figshare)

For the research domain "${options.researchDomain || 'general'}", provide comprehensive analysis with:
- Evidence quality assessment using GRADE methodology
- Statistical analysis and effect sizes
- Clinical translation potential
- Innovation assessment and competitive landscape
- Research gap identification and priority recommendations

Format your response to clearly separate:
- Main findings and datasets
- Supplementary materials and raw data sources
- Statistical analyses and correlations found
- Recommendations for data visualization approaches
- Evidence synthesis for further analysis

Generate MAXIMUM comprehensive content with exhaustive evidence collection and analysis.`
      });

      setState(prev => ({ ...prev, progress: 'Processing research results...' }));

      // Store results in Supabase if enabled
      if (options.storeResults && researchStorageRef.current) {
        try {
          setState(prev => ({ ...prev, progress: 'Storing research results...' }));
          await researchStorageRef.current.storeResearchResults(query, result);
        } catch (storageError) {
          console.warn('Failed to store research results:', storageError);
        }
      }

      // Extract usage statistics
      const usageStats = scientificAPIRef.current.getUsageStats(result);

      setState(prev => ({
        ...prev,
        isLoading: false,
        results: result,
        progress: 'Research completed successfully',
        usageStats: usageStats
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        progress: 'Research failed'
      }));
      return null;
    }
  }, []);

  /**
   * Conduct ASR-GoT specific research for Stage 4
   */
  const conductASRGoTResearch = useCallback(async (
    query: string,
    researchDomain: string,
    stageId: string,
    options: EnhancedSonarResearchOptions = {}
  ): Promise<SonarDeepResearchResponse | null> => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      progress: `Conducting ASR-GoT research for ${researchDomain}...`,
      results: null
    }));

    try {
      // Use the cost-aware orchestration service for ASR-GoT research
      const result = await costAwareOrchestration.executeEnhancedSonarResearch(
        query,
        researchDomain,
        stageId,
        {
          maxTokens: options.maxTokens || 128000,
          dateFilter: options.dateFilter,
          customDomains: options.customDomains
        }
      );

      setState(prev => ({
        ...prev,
        isLoading: false,
        results: result,
        progress: 'ASR-GoT research completed successfully',
        usageStats: result.usage || null
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        progress: 'ASR-GoT research failed'
      }));
      return null;
    }
  }, []);

  /**
   * Conduct async research for complex queries
   */
  const conductAsyncResearch = useCallback(async (
    query: string,
    options: EnhancedSonarResearchOptions = {}
  ): Promise<string | null> => {
    if (!scientificAPIRef.current) {
      setState(prev => ({ ...prev, error: 'Scientific Research API not initialized' }));
      return null;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      progress: 'Starting async research...',
    }));

    try {
      const requestId = await scientificAPIRef.current.conductAsyncDeepResearch(query);
      
      setState(prev => ({
        ...prev,
        progress: `Async research started. Request ID: ${requestId}`,
      }));

      return requestId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        progress: 'Async research failed to start'
      }));
      return null;
    }
  }, []);

  /**
   * Get async research results
   */
  const getAsyncResults = useCallback(async (requestId: string): Promise<any> => {
    if (!scientificAPIRef.current) {
      setState(prev => ({ ...prev, error: 'Scientific Research API not initialized' }));
      return null;
    }

    setState(prev => ({
      ...prev,
      progress: 'Retrieving async research results...',
    }));

    try {
      const result = await scientificAPIRef.current.getAsyncResult(requestId);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        results: result,
        progress: 'Async research results retrieved',
        usageStats: result.usage || null
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        progress: 'Failed to retrieve async results'
      }));
      return null;
    }
  }, []);

  /**
   * Test API connection
   */
  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!scientificAPIRef.current) {
      return false;
    }

    setState(prev => ({ ...prev, progress: 'Testing API connection...' }));

    try {
      const isConnected = await scientificAPIRef.current.testConnection();
      setState(prev => ({
        ...prev,
        progress: isConnected ? 'API connection successful' : 'API connection failed'
      }));
      return isConnected;
    } catch (error) {
      setState(prev => ({ ...prev, progress: 'API connection test failed' }));
      return false;
    }
  }, []);

  /**
   * Clear results and reset state
   */
  const clearResults = useCallback(() => {
    setState({
      isLoading: false,
      results: null,
      error: null,
      progress: '',
      usageStats: null
    });
  }, []);

  /**
   * Get research storage for direct access
   */
  const getResearchStorage = useCallback(() => {
    return researchStorageRef.current;
  }, []);

  return {
    // State
    isLoading: state.isLoading,
    results: state.results,
    error: state.error,
    progress: state.progress,
    usageStats: state.usageStats,

    // Methods
    initialize,
    conductResearch,
    conductASRGoTResearch,
    conductAsyncResearch,
    getAsyncResults,
    testConnection,
    clearResults,
    getResearchStorage
  };
};