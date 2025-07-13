/**
 * Sonar Deep Research Types - Exact implementation from specification
 * Enhanced TypeScript interfaces for scientific research API calls
 */

export interface SonarDeepResearchRequest {
  model: 'sonar-deep-research';
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  reasoning_effort: 'high';
  search_mode?: 'academic';
  search_domain_filter?: string[];
  search_after_date_filter?: string;
  search_before_date_filter?: string;
  web_search_options?: {
    search_context_size: 'high';
  };
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface SonarDeepResearchResponse {
  id: string;
  model: string;
  created: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    search_context_size: string;
    citation_tokens: number;
    num_search_queries: number;
    reasoning_tokens: number;
  };
  object: string;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      content: string;
      role: string;
    };
  }>;
  search_results: Array<{
    title: string;
    url: string;
    date: string;
  }>;
}

export interface AsyncResearchRequest {
  request: {
    model: 'sonar-deep-research';
    messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }>;
    reasoning_effort: 'high';
    search_mode: 'academic';
    web_search_options: {
      search_context_size: 'high';
    };
  };
}

export interface AsyncResearchResponse {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  result?: SonarDeepResearchResponse;
  error?: string;
}

export interface ResearchResultStorage {
  query: string;
  response_content: string;
  search_results: Array<{
    title: string;
    url: string;
    date: string;
  }>;
  usage_stats: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    search_context_size: string;
    citation_tokens: number;
    num_search_queries: number;
    reasoning_tokens: number;
  };
  created_at: string;
}