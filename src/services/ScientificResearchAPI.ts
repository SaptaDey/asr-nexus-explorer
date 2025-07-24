/**
 * Scientific Research API - Exact implementation from specification
 * Enhanced Sonar Deep Research API with scientific focus and async capabilities
 */

import { 
  SonarDeepResearchRequest, 
  SonarDeepResearchResponse, 
  AsyncResearchRequest, 
  AsyncResearchResponse 
} from '@/types/sonarDeepResearchTypes';
import { sanitizeError, secureConsoleError } from '@/utils/errorSanitizer';

export class ScientificResearchAPI {
  private apiKey: string;
  private baseUrl = 'https://api.perplexity.ai';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async conductDeepResearch(query: string): Promise<SonarDeepResearchResponse> {
    const requestPayload: SonarDeepResearchRequest = {
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
      max_tokens: 8000,
      temperature: 0.1,
      stream: false
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json() as SonarDeepResearchResponse;
    } catch (error) {
      secureConsoleError('Error conducting deep research:', error);
      throw sanitizeError(error);
    }
  }

  // For asynchronous processing of complex queries
  async conductAsyncDeepResearch(query: string): Promise<string> {
    const requestPayload: AsyncResearchRequest = {
      request: {
        model: 'sonar-deep-research',
        messages: [
          {
            role: 'system',
            content: `You are an expert scientific research assistant specializing in comprehensive literature review and data extraction for scientific visualization and analysis. Focus on extracting datasets, statistical analyses, and supplementary materials.`
          },
          {
            role: 'user',
            content: query
          }
        ],
        reasoning_effort: 'high',
        search_mode: 'academic',
        web_search_options: {
          search_context_size: 'high'
        }
      }
    };

    try {
      const response = await fetch(`${this.baseUrl}/async/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        throw new Error(`Async API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.id; // Return request ID for polling
    } catch (error) {
      secureConsoleError('Error starting async deep research:', error);
      throw sanitizeError(error);
    }
  }

  async getAsyncResult(requestId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/async/chat/completions/${requestId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get async result: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      secureConsoleError('Error getting async result:', error);
      throw sanitizeError(error);
    }
  }

  /**
   * Enhanced research with custom parameters for ASR-GoT framework
   */
  async conductCustomResearch(
    query: string,
    options: {
      maxTokens?: number;
      dateFilter?: string;
      customDomains?: string[];
      customSystemPrompt?: string;
    } = {}
  ): Promise<SonarDeepResearchResponse> {
    const requestPayload: SonarDeepResearchRequest = {
      model: 'sonar-deep-research',
      messages: [
        {
          role: 'system',
          content: options.customSystemPrompt || `You are an expert scientific research assistant specializing in comprehensive literature review and data extraction. Your task is to:

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
      reasoning_effort: 'high',
      search_mode: 'academic',
      search_domain_filter: options.customDomains || [
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
      max_tokens: options.maxTokens || 8000,
      temperature: 0.1,
      stream: false
    };

    // Add date filter if provided
    if (options.dateFilter) {
      requestPayload.search_after_date_filter = options.dateFilter;
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json() as SonarDeepResearchResponse;
    } catch (error) {
      secureConsoleError('Error conducting custom research:', error);
      throw sanitizeError(error);
    }
  }

  /**
   * Test API connection and key validity
   */
  async testConnection(): Promise<boolean> {
    try {
      const testResponse = await this.conductDeepResearch('Test connection for scientific research');
      return testResponse.choices && testResponse.choices.length > 0;
    } catch (error) {
      secureConsoleError('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get detailed usage statistics from response
   */
  getUsageStats(response: SonarDeepResearchResponse) {
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