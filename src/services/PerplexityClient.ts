/**
 * Enhanced Perplexity API Client - Integrated with ScientificResearchAPI
 * Implements Sonar Deep Research with scientific focus and enhanced capabilities
 */

import { 
  PerplexityRequest, 
  PerplexityResponse, 
  PerplexityMessage 
} from '@/types/perplexityTypes';
import { 
  SonarDeepResearchRequest, 
  SonarDeepResearchResponse 
} from '@/types/sonarDeepResearchTypes';
import { ScientificResearchAPI } from './ScientificResearchAPI';

export class PerplexityClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.perplexity.ai';
  private scientificAPI: ScientificResearchAPI;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.scientificAPI = new ScientificResearchAPI(apiKey);
  }

  /**
   * Enhanced deep research using Sonar Deep Research with scientific focus
   */
  async deepResearch(
    query: string,
    options: Partial<PerplexityRequest> = {}
  ): Promise<PerplexityResponse> {
    // Use the enhanced scientific research API for better results
    try {
      const scientificResponse = await this.scientificAPI.conductDeepResearch(query);
      
      // Convert to PerplexityResponse format for backward compatibility
      return {
        id: scientificResponse.id,
        model: scientificResponse.model,
        created: scientificResponse.created,
        usage: scientificResponse.usage,
        object: scientificResponse.object,
        choices: scientificResponse.choices,
        citations: scientificResponse.search_results
      } as PerplexityResponse;
    } catch (error) {
      console.error('Enhanced scientific research failed, falling back to basic implementation:', error);
      return this.basicDeepResearch(query, options);
    }
  }

  /**
   * Basic deep research implementation (fallback)
   */
  private async basicDeepResearch(
    query: string,
    options: Partial<PerplexityRequest> = {}
  ): Promise<PerplexityResponse> {
    const requestBody: PerplexityRequest = {
      model: 'sonar-deep-research',
      messages: [
        {
          role: 'system',
          content: `You are an expert scientific research assistant specializing in comprehensive literature review and data extraction. Your task is to:

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

Format your response to clearly separate:
- Main findings and datasets
- Supplementary materials and raw data sources
- Statistical analyses and correlations found
- Recommendations for data visualization approaches`
        },
        {
          role: 'user',
          content: query
        }
      ],
      stream: false,
      reasoning_effort: 'high',
      search_mode: 'academic',
      search_domain_filter: [
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
      web_search_options: {
        search_context_size: 'high'
      },
      return_related_questions: true,
      ...options
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error?.message || response.statusText}`);
      }

      const data: PerplexityResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error calling Perplexity API:', error);
      throw error;
    }
  }

  /**
   * Enhanced academic research with scientific focus
   */
  async academicResearch(
    query: string,
    dateFilter?: string
  ): Promise<PerplexityResponse> {
    try {
      const scientificResponse = await this.scientificAPI.conductCustomResearch(query, {
        dateFilter: dateFilter,
        maxTokens: 128000  // Maximum tokens for comprehensive research
      });
      
      // Convert to PerplexityResponse format
      return {
        id: scientificResponse.id,
        model: scientificResponse.model,
        created: scientificResponse.created,
        usage: scientificResponse.usage,
        object: scientificResponse.object,
        choices: scientificResponse.choices,
        citations: scientificResponse.search_results
      } as PerplexityResponse;
    } catch (error) {
      console.error('Enhanced academic research failed, falling back to basic implementation:', error);
      return this.basicDeepResearch(query, {
        search_mode: 'academic',
        search_after_date_filter: dateFilter,
        web_search_options: {
          search_context_size: 'high'
        }
      });
    }
  }

  /**
   * Conduct comprehensive scientific research for ASR-GoT Stage 4
   */
  async conductASRGoTResearch(
    query: string,
    researchDomain: string,
    options: {
      maxTokens?: number;
      dateFilter?: string;
      customDomains?: string[];
    } = {}
  ): Promise<SonarDeepResearchResponse> {
    const customSystemPrompt = `You are conducting Stage 4.1 Sonar Deep Research for the ASR-GoT framework with focus on: ${researchDomain}

Your task is to conduct EXHAUSTIVE evidence collection with maximum analytical depth:

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

For ASR-GoT framework, provide comprehensive analysis with:
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
- Evidence synthesis for ASR-GoT Stage 4.2 Gemini analysis`;

    return this.scientificAPI.conductCustomResearch(query, {
      maxTokens: options.maxTokens || 128000,
      dateFilter: options.dateFilter,
      customDomains: options.customDomains,
      customSystemPrompt: customSystemPrompt
    });
  }

  /**
   * Perform financial/SEC research
   */
  async financialResearch(
    query: string,
    dateFilter?: string
  ): Promise<PerplexityResponse> {
    return this.deepResearch(query, {
      search_mode: 'sec',
      search_after_date_filter: dateFilter,
      web_search_options: {
        search_context_size: 'high'
      }
    });
  }

  /**
   * Test API key validity with a simple query
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.deepResearch('Test connection', {
        max_tokens: 10,
        web_search_options: {
          search_context_size: 'low'
        }
      });
      return response.choices && response.choices.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get usage statistics from the last request
   */
  getUsageStats(response: PerplexityResponse) {
    return {
      totalTokens: response.usage.total_tokens,
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      searchQueries: response.usage.num_search_queries,
      citationTokens: response.usage.citation_tokens,
      searchContextSize: response.usage.search_context_size,
      reasoningTokens: response.usage.reasoning_tokens || 0
    };
  }
}