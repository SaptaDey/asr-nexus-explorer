/**
 * Perplexity API TypeScript Interfaces
 * Based on official Perplexity API documentation
 */

export interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PerplexityRequest {
  model: string;
  messages: PerplexityMessage[];
  stream?: boolean;
  search_mode?: 'web' | 'academic' | 'sec';
  search_after_date_filter?: string;
  search_before_date_filter?: string;
  search_domain_filter?: string[];
  web_search_options?: {
    search_context_size?: 'low' | 'medium' | 'high';
    user_location?: {
      country?: string;
      latitude?: number;
      longitude?: number;
    };
  };
  return_related_questions?: boolean;
  max_tokens?: number;
  temperature?: number;
}

export interface PerplexityUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  search_context_size: string;
  citation_tokens: number;
  num_search_queries: number;
  reasoning_tokens?: number;
}

export interface PerplexityChoice {
  index: number;
  finish_reason: string;
  message: {
    content: string;
    role: string;
  };
}

export interface PerplexitySearchResult {
  title: string;
  url: string;
  date: string;
}

export interface PerplexityResponse {
  id: string;
  model: string;
  created: number;
  usage: PerplexityUsage;
  object: string;
  choices: PerplexityChoice[];
  citations: string[];
  search_results: PerplexitySearchResult[];
}