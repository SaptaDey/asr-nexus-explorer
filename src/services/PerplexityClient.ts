/**
 * Perplexity API Client
 * Implements the official Perplexity API with proper model names and structure
 */

import { 
  PerplexityRequest, 
  PerplexityResponse, 
  PerplexityMessage 
} from '@/types/perplexityTypes';

export class PerplexityClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.perplexity.ai';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Perform deep research using Sonar Deep Research model
   */
  async deepResearch(
    query: string,
    options: Partial<PerplexityRequest> = {}
  ): Promise<PerplexityResponse> {
    const requestBody: PerplexityRequest = {
      model: 'sonar-deep-research',
      messages: [
        {
          role: 'system',
          content: 'You are an expert researcher. Provide comprehensive, well-sourced analysis with detailed insights.'
        },
        {
          role: 'user',
          content: query
        }
      ],
      stream: false,
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
   * Perform academic research with date filtering
   */
  async academicResearch(
    query: string,
    dateFilter?: string
  ): Promise<PerplexityResponse> {
    return this.deepResearch(query, {
      search_mode: 'academic',
      search_after_date_filter: dateFilter,
      web_search_options: {
        search_context_size: 'high'
      }
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