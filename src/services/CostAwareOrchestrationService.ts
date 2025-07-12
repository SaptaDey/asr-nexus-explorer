/**
 * Cost-Aware Orchestration Service
 * Implements tri-model routing system (Sonar Deep Research + Gemini 2.5 Flash + Gemini 2.5 Pro)
 * Based on Cost-Aware-Orchestration.md specifications
 */

import { 
  AIModel, 
  CapabilityFlag, 
  ModelCapability, 
  StageModelAssignment, 
  CostDashboardEntry,
  TokenBudget,
  BatchRequest,
  SonarSearchRequest,
  APICredentials 
} from '@/types/asrGotTypes';
import { PerplexityClient } from './PerplexityClient';

export class CostAwareOrchestrationService {
  private costHistory: CostDashboardEntry[] = [];
  private currentSessionCost = 0;
  private cacheStorage = new Map<string, any>();

  // Stage-by-Stage Model Assignment Matrix (exact from Cost-Aware-Orchestration.md)
  private stageModelMatrix: Record<string, StageModelAssignment> = {
    '1_initialization': {
      stage: 'Initialisation',
      microPass: undefined,
      modelCapability: {
        model: 'gemini-2.5-flash',
        capability: 'STRUCTURED_OUTPUTS',
        batchSize: 50,
        purpose: 'Emit root n₀ and parameter inventory.',
        outputType: 'RootNode JSON',
        maxTokens: 5000,
        thinkingBudget: 2048
      },
      costEstimate: {
        inputTokens: 12000,
        outputTokens: 5000,
        priceUSD: 0.073
      }
    },
    '2_decomposition': {
      stage: 'Decomposition',
      microPass: undefined,
      modelCapability: {
        model: 'gemini-2.5-flash',
        capability: 'STRUCTURED_OUTPUTS',
        batchSize: 50,
        purpose: 'Create dimension nodes + bias flags.',
        outputType: 'DimensionArray',
        maxTokens: 10000,
        thinkingBudget: 2048
      },
      costEstimate: {
        inputTokens: 30000,
        outputTokens: 10000,
        priceUSD: 0.115
      }
    },
    '3A_hypothesis_generation': {
      stage: 'Hypothesis Generation',
      microPass: 'pass A',
      modelCapability: {
        model: 'gemini-2.5-flash',
        capability: 'STRUCTURED_OUTPUTS',
        batchSize: 25,
        purpose: 'Draft 3-5 hypotheses per dimension w/ metadata.',
        outputType: 'HypothesisBatch',
        maxTokens: 10000,
        thinkingBudget: 2048
      },
      costEstimate: {
        inputTokens: 30000,
        outputTokens: 10000,
        priceUSD: 0.115
      }
    },
    '3B_hypothesis_planning': {
      stage: 'Hypothesis Planning',
      microPass: 'pass B',
      modelCapability: {
        model: 'gemini-2.5-pro',
        capability: 'SEARCH_GROUNDING',
        batchSize: 10,
        purpose: 'Rapid facts & review snippets.',
        outputType: 'SearchResultSet',
        maxTokens: 8000,
        thinkingBudget: 4096
      },
      costEstimate: {
        inputTokens: 25000,
        outputTokens: 8000,
        priceUSD: 0.111
      }
    },
    '3C_micro_service_decision': {
      stage: 'Micro-service Decision',
      microPass: undefined,
      modelCapability: {
        model: 'gemini-2.5-pro',
        capability: 'FUNCTION_CALLING',
        batchSize: 1,
        purpose: 'Select next back-end fn (run_lit_review, queue_lab_protocol).',
        outputType: 'CallSpec',
        maxTokens: 4000,
        thinkingBudget: 4096
      },
      costEstimate: {
        inputTokens: 15000,
        outputTokens: 4000,
        priceUSD: 0.058
      }
    },
    '4_1_evidence_harvest_web': {
      stage: 'Evidence Harvest - Web Search',
      microPass: undefined,
      modelCapability: {
        model: 'sonar-deep-research',
        capability: 'SEARCH_GROUNDING',
        batchSize: 100,
        purpose: 'Crawl PubMed / arXiv; return up to 1 M tokens of docs.',
        outputType: 'EvidenceCorpus',
        maxTokens: 1000000,
        thinkingBudget: 0
      },
      costEstimate: {
        inputTokens: 500000,
        outputTokens: 0,
        priceUSD: 1.0
      }
    },
    '4_2_evidence_harvest_citations': {
      stage: 'Evidence Harvest → Citation Batch',
      microPass: undefined,
      modelCapability: {
        model: 'sonar-deep-research',
        capability: 'STRUCTURED_OUTPUTS',
        batchSize: 1,
        purpose: 'Generate structured citations & DOIs.',
        outputType: 'CitationBatch',
        maxTokens: 100000,
        thinkingBudget: 0
      },
      costEstimate: {
        inputTokens: 0,
        outputTokens: 100000,
        priceUSD: 0.8
      }
    },
    '4_3_evidence_analysis': {
      stage: 'Evidence Analysis',
      microPass: undefined,
      modelCapability: {
        model: 'gemini-2.5-pro',
        capability: 'CODE_EXECUTION',
        batchSize: 10,
        purpose: 'Compute effect sizes, CI, power (P1.26), produce figs.',
        outputType: 'StatsBundle + PNGs',
        maxTokens: 15000,
        thinkingBudget: 16384
      },
      costEstimate: {
        inputTokens: 40000,
        outputTokens: 15000,
        priceUSD: 0.2
      }
    },
    '4_4_graph_update': {
      stage: 'Graph Update',
      microPass: undefined,
      modelCapability: {
        model: 'gemini-2.5-pro',
        capability: 'STRUCTURED_OUTPUTS',
        batchSize: 200,
        purpose: 'Attach Evidence nodes & typed edges (causal, temporal).',
        outputType: 'EvidenceBatch',
        maxTokens: 20000,
        thinkingBudget: 8192
      },
      costEstimate: {
        inputTokens: 50000,
        outputTokens: 20000,
        priceUSD: 0.262
      }
    },
    '5A_prune_merge_reasoning': {
      stage: 'Prune / Merge Reasoning',
      microPass: undefined,
      modelCapability: {
        model: 'gemini-2.5-flash',
        capability: 'THINKING',
        batchSize: 1,
        purpose: 'Bayesian filter: mark prune_list & merge_map.',
        outputType: 'internal list',
        maxTokens: 5000,
        thinkingBudget: 2048
      },
      costEstimate: {
        inputTokens: 30000,
        outputTokens: 5000,
        priceUSD: 0.1
      }
    },
    '5B_graph_mutation_persist': {
      stage: 'Graph Mutation Persist',
      microPass: undefined,
      modelCapability: {
        model: 'gemini-2.5-flash',
        capability: 'STRUCTURED_OUTPUTS',
        batchSize: 1,
        purpose: 'Apply prune_list / merge_map.',
        outputType: 'PruneMergeSet',
        maxTokens: 8000,
        thinkingBudget: 2048
      },
      costEstimate: {
        inputTokens: 25000,
        outputTokens: 8000,
        priceUSD: 0.095
      }
    },
    '6A_subgraph_metrics': {
      stage: 'Sub-graph Metrics Calc',
      microPass: undefined,
      modelCapability: {
        model: 'gemini-2.5-pro',
        capability: 'CODE_EXECUTION',
        batchSize: 1,
        purpose: 'Run NetworkX / GraphML centrality + MI scores.',
        outputType: 'MetricsJSON',
        maxTokens: 10000,
        thinkingBudget: 16384
      },
      costEstimate: {
        inputTokens: 60000,
        outputTokens: 10000,
        priceUSD: 0.175
      }
    },
    '6B_subgraph_emit': {
      stage: 'Sub-graph Emit',
      microPass: undefined,
      modelCapability: {
        model: 'gemini-2.5-flash',
        capability: 'STRUCTURED_OUTPUTS',
        batchSize: 10,
        purpose: 'Send ranked SubgraphSet.',
        outputType: 'SubgraphSet',
        maxTokens: 8000,
        thinkingBudget: 2048
      },
      costEstimate: {
        inputTokens: 20000,
        outputTokens: 8000,
        priceUSD: 0.08
      }
    },
    '7_narrative_composition': {
      stage: 'Narrative Composition',
      microPass: undefined,
      modelCapability: {
        model: 'gemini-2.5-pro',
        capability: 'STRUCTURED_OUTPUTS',
        batchSize: 1,
        purpose: 'Write HTML blocks with embedded figs & Vancouver refs.',
        outputType: 'ReportChunk[]',
        maxTokens: 25000,
        thinkingBudget: 2048
      },
      costEstimate: {
        inputTokens: 60000,
        outputTokens: 25000,
        priceUSD: 0.325
      }
    },
    '8A_audit_script': {
      stage: 'Audit Script',
      microPass: undefined,
      modelCapability: {
        model: 'gemini-2.5-pro',
        capability: 'CODE_EXECUTION',
        batchSize: 1,
        purpose: 'Auto-check coverage, bias, power; produce scorecard.',
        outputType: 'AuditBundle',
        maxTokens: 10000,
        thinkingBudget: 8192
      },
      costEstimate: {
        inputTokens: 50000,
        outputTokens: 10000,
        priceUSD: 0.162
      }
    },
    '8B_audit_outputs': {
      stage: 'Audit Outputs',
      microPass: undefined,
      modelCapability: {
        model: 'gemini-2.5-pro',
        capability: 'STRUCTURED_OUTPUTS',
        batchSize: 1,
        purpose: 'Persist AuditReport + next-step recs.',
        outputType: 'AuditReport',
        maxTokens: 8000,
        thinkingBudget: 4096
      },
      costEstimate: {
        inputTokens: 40000,
        outputTokens: 8000,
        priceUSD: 0.13
      }
    },
    'S_session_cache': {
      stage: 'Session-wide Cache',
      microPass: undefined,
      modelCapability: {
        model: 'gemini-2.5-flash',
        capability: 'CACHING',
        batchSize: 1,
        purpose: 'Context slices ≥200 k tokens cached for 60 min.',
        outputType: 'n/a',
        maxTokens: 0,
        thinkingBudget: 0
      },
      costEstimate: {
        inputTokens: 0,
        outputTokens: 0,
        priceUSD: 0.4
      }
    }
  };

  // Token Budget Configuration (from document)
  private tokenBudgets: Record<string, TokenBudget> = {
    'flash_stages': {
      promptSizeEnvelope: 40000,
      thinkingBudget: 2048,
      outputLimit: 8000
    },
    'pro_search_plan': {
      promptSizeEnvelope: 60000,
      thinkingBudget: 8192,
      outputLimit: 15000
    },
    'pro_evidence_code': {
      promptSizeEnvelope: 200000,
      thinkingBudget: 16384,
      outputLimit: 25000
    },
    'report_chunks': {
      promptSizeEnvelope: 20000,
      thinkingBudget: 2048,
      outputLimit: 10000
    },
    'audit': {
      promptSizeEnvelope: 100000,
      thinkingBudget: 8192,
      outputLimit: 15000
    }
  };

  /**
   * Get model assignment for a specific stage
   */
  getStageModelAssignment(stage: string): StageModelAssignment | null {
    return this.stageModelMatrix[stage] || null;
  }

  /**
   * Batch API Strategy: Send up to 5 prompts in one HTTP call for Gemini (per document)
   */
  async routeBatchApiCall(
    stage: string,
    prompts: string[],
    apiKeys: APICredentials,
    additionalParams?: any
  ): Promise<any[]> {
    const assignment = this.getStageModelAssignment(stage);
    if (!assignment) {
      throw new Error(`No model assignment found for stage: ${stage}`);
    }

    const { model, capability, maxTokens, thinkingBudget, batchSize } = assignment.modelCapability;

    // Enforce batch size limits (max 5 prompts per HTTP call for Gemini as per document)
    const maxBatchSize = model.includes('gemini') ? Math.min(5, batchSize) : batchSize;
    const batchedPrompts = prompts.slice(0, maxBatchSize);

    console.log(`Batching ${batchedPrompts.length} prompts for ${stage} with ${model}`);

    if (model === 'sonar-deep-research') {
      if (!apiKeys.perplexity) {
        throw new Error('PERPLEXITY_KEY_REQUIRED');
      }
      // Sonar handles batching differently (100-query bundles)
      return await this.callSonarBatchSearch(batchedPrompts, apiKeys.perplexity, additionalParams);
    } else {
      // Gemini batch processing
      return await this.callGeminiBatch(batchedPrompts, model, apiKeys.gemini, capability, maxTokens, thinkingBudget, additionalParams);
    }
  }

  /**
   * Route API call to appropriate model based on stage and capability
   * Supports both single prompts and batch processing
   */
  async routeApiCall(
    stage: string,
    prompt: string | string[],
    apiKeys: APICredentials,
    additionalParams?: any
  ): Promise<any> {
    // Defensive check for apiKeys
    if (!apiKeys) {
      throw new Error('API credentials are required but not provided');
    }
    
    const assignment = this.getStageModelAssignment(stage);
    if (!assignment) {
      throw new Error(`No model assignment found for stage: ${stage}`);
    }

    const { model, capability, maxTokens, thinkingBudget } = assignment.modelCapability;

    // Check API key requirements
    if (model === 'sonar-deep-research' && !apiKeys.perplexity) {
      throw new Error('Perplexity API key required for Sonar Deep Research');
    }
    
    if (model.includes('gemini') && !apiKeys.gemini) {
      throw new Error('Gemini API key required for Gemini models');
    }

    // Detect batch request
    const isBatchRequest = Array.isArray(prompt) || additionalParams?.batch === true;
    const prompts = Array.isArray(prompt) ? prompt : 
                   additionalParams?.prompts ? additionalParams.prompts : [prompt];

    // Track cost before API call
    const startTime = Date.now();

    try {
      let result;
      
      if (isBatchRequest && prompts.length > 1) {
        // Use batch processing
        console.log(`Executing batch request for stage ${stage} with ${prompts.length} prompts`);
        result = await this.executeBatch(stage, prompts, apiKeys, additionalParams);
      } else {
        // Single prompt processing
        const singlePrompt = Array.isArray(prompt) ? prompt[0] : prompt;
        
        switch (model) {
          case 'sonar-deep-research':
            result = await this.callSonarDeepResearch(singlePrompt, apiKeys.perplexity, capability, maxTokens, additionalParams);
            break;
          case 'gemini-2.5-flash':
            result = await this.callGeminiFlash(singlePrompt, apiKeys.gemini, capability, maxTokens, thinkingBudget, additionalParams);
            break;
          case 'gemini-2.5-pro':
            result = await this.callGeminiPro(singlePrompt, apiKeys.gemini, capability, maxTokens, thinkingBudget, additionalParams);
            break;
          default:
            throw new Error(`Unsupported model: ${model}`);
        }
      }

      // Track cost after successful call
      this.trackCost(stage, model, assignment.costEstimate, startTime);

      return result;
    } catch (error) {
      console.error(`API call failed for stage ${stage} with model ${model}:`, error);
      
      // Implement fallback strategy
      return this.handleFallback(stage, prompt, apiKeys, error);
    }
  }

  /**
   * Call Sonar Deep Research API using the proper client
   */
  private async callSonarDeepResearch(
    prompt: string,
    apiKey: string,
    capability: CapabilityFlag,
    maxTokens: number,
    additionalParams?: any
  ): Promise<any> {
    const client = new PerplexityClient(apiKey);
    
    // Determine search mode based on capability and additional params
    let searchMode: 'web' | 'academic' | 'sec' = 'web';
    if (additionalParams?.searchMode) {
      searchMode = additionalParams.searchMode;
    } else if (prompt.toLowerCase().includes('academic') || prompt.toLowerCase().includes('research')) {
      searchMode = 'academic';
    }

    const options = {
      max_tokens: maxTokens,
      temperature: 0.1,
      search_mode: searchMode,
      web_search_options: {
        search_context_size: 'high' as const
      },
      return_related_questions: true,
      ...additionalParams
    };

    const response = await client.deepResearch(prompt, options);
    
    // Return enhanced response with metadata for cost tracking
    return {
      content: response.choices[0].message.content,
      usage: response.usage,
      citations: response.citations,
      searchResults: response.search_results
    };
  }

  /**
   * Call Gemini 2.5 Flash API with THINKING + ONE capability flag rule
   */
  private async callGeminiFlash(
    prompt: string,
    apiKey: string,
    capability: CapabilityFlag,
    maxTokens: number,
    thinkingBudget?: number,
    additionalParams?: any
  ): Promise<any> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    // Enforce 65536 token limit as per document
    const enforcedMaxTokens = Math.min(maxTokens, 65536);
    
    // THINKING + exactly ONE capability flag per request (as per document rule)
    const tools = ['THINKING'];
    if (capability !== 'THINKING') {
      tools.push(capability);
    }
    
    const body = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        maxOutputTokens: enforcedMaxTokens,
        temperature: 0.1,
        // Only include valid Gemini generation config parameters
        ...(additionalParams?.temperature !== undefined && { temperature: additionalParams.temperature }),
        ...(additionalParams?.topP !== undefined && { topP: additionalParams.topP }),
        ...(additionalParams?.topK !== undefined && { topK: additionalParams.topK }),
        ...(additionalParams?.candidateCount !== undefined && { candidateCount: additionalParams.candidateCount }),
        ...(additionalParams?.stopSequences !== undefined && { stopSequences: additionalParams.stopSequences })
      },
      tools: this.getToolsForCapability(tools),
      systemInstruction: {
        parts: [{ text: 'You are Gemini 2.5 Flash, optimized for fast, cost-efficient processing with structured outputs.' }]
      }
    };

    // Note: thinking_budget is not a valid Gemini API parameter - removed

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini Flash API error: ${response.status} ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  /**
   * Call Gemini 2.5 Pro API with THINKING + ONE capability flag rule
   */
  private async callGeminiPro(
    prompt: string,
    apiKey: string,
    capability: CapabilityFlag,
    maxTokens: number,
    thinkingBudget?: number,
    additionalParams?: any
  ): Promise<any> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;
    
    // Enforce 65536 token limit as per document
    const enforcedMaxTokens = Math.min(maxTokens, 65536);
    
    // THINKING + exactly ONE capability flag per request (as per document rule)
    const tools = ['THINKING'];
    if (capability !== 'THINKING') {
      tools.push(capability);
    }
    
    const body = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        maxOutputTokens: enforcedMaxTokens,
        temperature: 0.1,
        // Only include valid Gemini generation config parameters
        ...(additionalParams?.temperature !== undefined && { temperature: additionalParams.temperature }),
        ...(additionalParams?.topP !== undefined && { topP: additionalParams.topP }),
        ...(additionalParams?.topK !== undefined && { topK: additionalParams.topK }),
        ...(additionalParams?.candidateCount !== undefined && { candidateCount: additionalParams.candidateCount }),
        ...(additionalParams?.stopSequences !== undefined && { stopSequences: additionalParams.stopSequences })
      },
      tools: this.getToolsForCapability(tools),
      systemInstruction: {
        parts: [{ text: 'You are Gemini 2.5 Pro, optimized for advanced reasoning, code execution, and premium scientific analysis.' }]
      }
    };

    // Note: thinking_budget is not a valid Gemini API parameter - removed

    // Add CODE_EXECUTION enhancements for figure generation (per document)
    if (capability === 'CODE_EXECUTION') {
      const codeExecutionPrompt = `${prompt}

IMPORTANT: When generating statistical figures, use matplotlib, plotly, or ggplot2 to create publication-ready visualizations. Save figures as PNG/SVG and include proper legends, axis labels, and titles. Each figure should be saved to the working directory for incorporation into HTML reports.

Available libraries: matplotlib, plotly, seaborn, ggplot2, pandas, numpy, scipy.stats
Example: 
import matplotlib.pyplot as plt
plt.savefig('figure_name.png', dpi=300, bbox_inches='tight')`;
      
      body.contents[0].parts[0].text = codeExecutionPrompt;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini Pro API error: ${response.status} ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  /**
   * Get tools configuration for specific capability or array of capabilities
   */
  private getToolsForCapability(capability: CapabilityFlag | CapabilityFlag[] | string[]): any[] {
    const capabilities = Array.isArray(capability) ? capability : [capability];
    const tools: any[] = [];
    
    for (const cap of capabilities) {
      switch (cap) {
        case 'THINKING':
          // THINKING is always included by default in Gemini calls
          break;
        case 'STRUCTURED_OUTPUTS':
          tools.push({ 'function_declarations': [] });
          break;
        case 'SEARCH_GROUNDING':
          tools.push({ 'google_search_retrieval': {} });
          break;
        case 'CODE_EXECUTION':
          tools.push({ 'code_execution': {} });
          break;
        case 'FUNCTION_CALLING':
          tools.push({ 'function_declarations': [] });
          break;
        case 'CACHING':
          // Caching is handled at the orchestration level
          break;
      }
    }
    
    return tools;
  }

  /**
   * Call Gemini Batch API (up to 5 prompts per HTTP call as per document)
   */
  private async callGeminiBatch(
    prompts: string[],
    model: AIModel,
    apiKey: string,
    capability: CapabilityFlag,
    maxTokens: number,
    thinkingBudget?: number,
    additionalParams?: any
  ): Promise<any[]> {
    const modelName = model === 'gemini-2.5-flash' ? 'gemini-2.5-flash' : 'gemini-2.5-pro';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    // Enforce 65536 token limit as per document
    const enforcedMaxTokens = Math.min(maxTokens, 65536);
    
    // THINKING + exactly ONE capability flag per request (as per document rule)
    const tools = ['THINKING'];
    if (capability !== 'THINKING') {
      tools.push(capability);
    }

    const batchRequests = prompts.map(prompt => ({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: enforcedMaxTokens,
        temperature: 0.1,
        // Only include valid Gemini generation config parameters
        ...(additionalParams?.temperature !== undefined && { temperature: additionalParams.temperature }),
        ...(additionalParams?.topP !== undefined && { topP: additionalParams.topP }),
        ...(additionalParams?.topK !== undefined && { topK: additionalParams.topK }),
        ...(additionalParams?.candidateCount !== undefined && { candidateCount: additionalParams.candidateCount }),
        ...(additionalParams?.stopSequences !== undefined && { stopSequences: additionalParams.stopSequences })
      },
      tools: this.getToolsForCapability(tools),
      systemInstruction: {
        parts: [{ text: `You are ${modelName}, optimized for ${model.includes('flash') ? 'fast, cost-efficient processing' : 'advanced reasoning and premium analysis'}.` }]
      }
    }));

    // For now, process sequentially since Gemini batch API might need different endpoint
    // TODO: Use actual batch endpoint when available
    const results = [];
    for (const request of batchRequests) {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini Batch API error: ${response.status} ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      results.push(data.candidates[0].content.parts[0].text);
    }

    return results;
  }

  /**
   * Call Sonar Batch Search (100-query bundles @ $0.50 per 100 as per document)
   */
  private async callSonarBatchSearch(
    queries: string[],
    apiKey: string,
    additionalParams?: any
  ): Promise<any[]> {
    const client = new PerplexityClient(apiKey);
    
    // Process in batches of 100 queries for optimal cost ($5 per 1000 queries = $0.50 per 100)
    const batchSize = 100;
    const results = [];
    
    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);
      console.log(`Processing Sonar batch ${Math.floor(i / batchSize) + 1}: ${batch.length} queries`);
      
      const batchResults = await Promise.all(
        batch.map(query => client.deepResearch(query, {
          search_mode: 'academic',
          web_search_options: { search_context_size: 'high' },
          return_related_questions: true,
          max_tokens: 100000, // Up to 1M tokens per document
          ...additionalParams
        }))
      );
      
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Implement hallucination detection and Flash→Pro escalation (per document)
   */
  private async detectHallucination(response: string, originalPrompt: string): Promise<boolean> {
    // Simple heuristic-based hallucination detection
    const hallucinationIndicators = [
      /I don't have access/i,
      /I cannot access/i,
      /I'm not able to browse/i,
      /I don't have real-time/i,
      /fictional/i,
      /made up/i,
      /hypothetical/i
    ];
    
    const hallucinationCount = hallucinationIndicators.filter(indicator => 
      indicator.test(response)
    ).length;
    
    // If ≥10% hallucination indicators, escalate to Pro (per document)
    const hallucinationRate = hallucinationCount / hallucinationIndicators.length;
    return hallucinationRate >= 0.1;
  }

  /**
   * Handle fallback scenarios with hallucination detection and escalation (per document)
   */
  private async handleFallback(
    stage: string,
    prompt: string,
    apiKeys: APICredentials,
    error: any
  ): Promise<any> {
    console.log(`Implementing fallback for stage: ${stage}`, error.message);
    
    // If Sonar rate-limits → auto-downgrade to Gemini Pro SEARCH_GROUNDING batch (per document)
    if (stage.includes('evidence_harvest') && (error.message.includes('rate') || error.message.includes('429'))) {
      console.log('Sonar rate limited, falling back to Gemini Pro with search grounding');
      return this.callGeminiPro(prompt, apiKeys.gemini, 'SEARCH_GROUNDING', 15000, 8192);
    }
    
    // If Flash output ≥10% hallucination → escalate stage to Pro (per document)
    if (stage.includes('flash') || error.message.includes('hallucination')) {
      console.log('Flash hallucination detected or Flash stage failed, escalating to Pro');
      const assignment = this.getStageModelAssignment(stage);
      if (assignment) {
        return this.callGeminiPro(prompt, apiKeys.gemini, assignment.modelCapability.capability, 
          assignment.modelCapability.maxTokens, assignment.modelCapability.thinkingBudget);
      }
    }

    // Cache slice when aggregated prompt ≥200k; purge after 24h (per document)
    if (prompt.length > 200000) {
      console.log('Large prompt detected, implementing caching strategy');
      const cacheKey = `large_prompt_${Date.now()}`;
      this.cacheContext(cacheKey, prompt, 1440); // 24 hours = 1440 minutes
    }

    throw error;
  }

  /**
   * Track cost for dashboard
   */
  private trackCost(
    stage: string,
    model: AIModel,
    costEstimate: any,
    startTime: number
  ): void {
    const costEntry: CostDashboardEntry = {
      stage,
      model,
      promptTokens: costEstimate.inputTokens,
      outputTokens: costEstimate.outputTokens,
      priceUSD: costEstimate.priceUSD,
      timestamp: new Date().toISOString()
    };

    this.costHistory.push(costEntry);
    this.currentSessionCost += costEstimate.priceUSD;
    
    console.log(`Cost tracked for ${stage}: $${costEstimate.priceUSD.toFixed(4)}`);
  }

  /**
   * Get cost dashboard data
   */
  getCostDashboard(): {
    entries: CostDashboardEntry[];
    totalCost: number;
    averageCostPerStage: number;
  } {
    return {
      entries: this.costHistory,
      totalCost: this.currentSessionCost,
      averageCostPerStage: this.costHistory.length > 0 ? this.currentSessionCost / this.costHistory.length : 0
    };
  }

  /**
   * Reset cost tracking for new session
   */
  resetCostTracking(): void {
    this.costHistory = [];
    this.currentSessionCost = 0;
  }

  /**
   * Get estimated total cost for full pipeline
   */
  getEstimatedTotalCost(): number {
    return Object.values(this.stageModelMatrix)
      .reduce((total, assignment) => total + assignment.costEstimate.priceUSD, 0);
  }

  /**
   * Check if caching is needed for large contexts
   */
  shouldCache(promptTokens: number): boolean {
    return promptTokens >= 200000; // 200k tokens threshold from document
  }

  /**
   * Cache large contexts
   */
  cacheContext(key: string, data: any, ttlMinutes: number = 60): void {
    const expiryTime = Date.now() + (ttlMinutes * 60 * 1000);
    this.cacheStorage.set(key, { data, expiryTime });
  }

  /**
   * Get cached context
   */
  getCachedContext(key: string): any | null {
    const cached = this.cacheStorage.get(key);
    if (cached && Date.now() < cached.expiryTime) {
      return cached.data;
    }
    if (cached) {
      this.cacheStorage.delete(key);
    }
    return null;
  }
}

// Export singleton instance
export const costAwareOrchestration = new CostAwareOrchestrationService();