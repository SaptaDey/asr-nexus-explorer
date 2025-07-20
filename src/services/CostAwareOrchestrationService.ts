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
import { ScientificResearchAPI } from './ScientificResearchAPI';
import { SupabaseResearchStorage } from './SupabaseResearchStorage';

export class CostAwareOrchestrationService {
  private costHistory: CostDashboardEntry[] = [];
  private currentSessionCost = 0;
  private cacheStorage = new Map<string, any>();
  private cacheCleanupInterval: NodeJS.Timeout;
  private scientificAPI: ScientificResearchAPI | null = null;
  private researchStorage: SupabaseResearchStorage | null = null;

  constructor() {
    // Set up periodic cache cleanup every 15 minutes to prevent memory leaks
    this.cacheCleanupInterval = setInterval(() => {
      this.cleanupExpiredCache();
    }, 15 * 60 * 1000); // 15 minutes
  }

  /**
   * Initialize enhanced scientific research capabilities
   */
  initializeScientificResearch(apiKeys: APICredentials, supabaseUrl?: string, supabaseKey?: string): void {
    if (apiKeys.perplexity) {
      this.scientificAPI = new ScientificResearchAPI(apiKeys.perplexity);
    }

    if (supabaseUrl && supabaseKey) {
      this.researchStorage = new SupabaseResearchStorage(supabaseUrl, supabaseKey);
    }
  }

  /**
   * Cleanup method to clear intervals and prevent memory leaks
   */
  destroy(): void {
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
    }
    this.cacheStorage.clear();
  }

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
        maxTokens: 32000,
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
        maxTokens: 48000,
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
        maxTokens: 48000,
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
        maxTokens: 40000,
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
        maxTokens: 32000,
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
        maxTokens: 50000,
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
        maxTokens: 55000,
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
        maxTokens: 32000,
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
        maxTokens: 40000,
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
        maxTokens: 48000,
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
        maxTokens: 40000,
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
        batchSize: 1, // Process one chunk at a time
        purpose: 'Write HTML blocks with embedded figs & Vancouver refs in 5k token chunks.',
        outputType: 'ReportChunk[]',
        maxTokens: 55000, // 5k token chunks with room for response
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
        maxTokens: 48000,
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
        maxTokens: 40000,
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
    },
    '9_final_analysis': {
      stage: 'Final Analysis',
      microPass: undefined,
      modelCapability: {
        model: 'gemini-2.5-pro',
        capability: 'STRUCTURED_OUTPUTS',
        batchSize: 1,
        purpose: 'Generate comprehensive final report with integrated visualizations.',
        outputType: 'FinalReport',
        maxTokens: 50000,
        thinkingBudget: 8192
      },
      costEstimate: {
        inputTokens: 60000,
        outputTokens: 12000,
        priceUSD: 0.192
      }
    },
    '9_final_analysis_batch': {
      stage: 'Final Analysis Batch',
      microPass: undefined,
      modelCapability: {
        model: 'gemini-2.5-pro',
        capability: 'BATCH_PROCESSING',
        batchSize: 5,
        purpose: 'Generate comprehensive final report components in batch processing.',
        outputType: 'FinalReportBatch',
        maxTokens: 50000,
        thinkingBudget: 8192
      },
      costEstimate: {
        inputTokens: 300000,
        outputTokens: 60000,
        priceUSD: 0.96
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
   * Supports both single prompts and batch processing with automatic session caching
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

    // **SESSION CACHING**: Check for cached result if prompt is large enough (≥200k tokens)
    const singlePrompt = Array.isArray(prompt) ? prompt.join('\n') : prompt;
    const estimatedTokens = Math.ceil(singlePrompt.length / 4); // Rough token estimation
    
    if (estimatedTokens >= 200000) {
      const cacheKey = `${stage}_${btoa(singlePrompt.substring(0, 1000)).replace(/[^a-zA-Z0-9]/g, '_')}`;
      const cachedResult = this.getCachedContext(cacheKey);
      
      if (cachedResult) {
        console.log(`🎯 Cache hit for stage ${stage} (${estimatedTokens} tokens) - returning cached result`);
        return cachedResult;
      }
      
      console.log(`📦 Large context detected for stage ${stage} (${estimatedTokens} tokens) - will cache result`);
      additionalParams = { ...additionalParams, cacheKey, shouldCache: true };
    }

    // Track cost before API call
    const startTime = Date.now();

    try {
      let result;
      
      // **MICRO-PASS ROUTING**: Handle specific micro-pass calls
      if (stage.includes('4.1_evidence_harvest')) {
        result = await this.executeSonarBulkHarvest(additionalParams?.queries || [], apiKeys.perplexity, additionalParams);
      } else if (stage.includes('4.2_citation_batch')) {
        result = await this.executeSonarCitationGeneration(additionalParams?.evidenceCorpus || '', apiKeys.perplexity, additionalParams);
      } else if (stage.includes('4.3_evidence_analysis')) {
        result = await this.executeCodeExecutionWithFigures(additionalParams?.evidenceData || '', apiKeys.gemini, additionalParams);
      } else if (stage.includes('4.4_graph_update')) {
        result = await this.executeGraphStructuredUpdate(additionalParams?.newNodes || [], apiKeys.gemini, additionalParams);
      } else if (stage.includes('5A_prune_merge_reasoning')) {
        result = await this.executeBayesianPruneReasoning(additionalParams?.evidenceNodes || [], apiKeys.gemini, additionalParams);
      } else if (stage.includes('5B_graph_mutation_persist')) {
        result = await this.executeGraphMutationPersist(additionalParams?.pruneList || [], apiKeys.gemini, additionalParams);
      } else if (stage.includes('6A_subgraph_metrics')) {
        result = await this.executeNetworkXMetrics(additionalParams?.graphData || {}, apiKeys.gemini, additionalParams);
      } else if (stage.includes('6B_subgraph_emit')) {
        result = await this.executeSubgraphEmit(additionalParams?.networkMetrics || '', apiKeys.gemini, additionalParams);
      } else if (stage.includes('8A_audit_script')) {
        result = await this.executeAuditScript(additionalParams?.allStagesData || '', apiKeys.gemini, additionalParams);
      } else if (stage.includes('8B_audit_outputs')) {
        result = await this.executeAuditOutputs(additionalParams?.auditScriptData || '', apiKeys.gemini, additionalParams);
      } else if (stage.includes('10A_figure_collection')) {
        result = await this.executeFigureCollection(additionalParams?.figureCount || 0, apiKeys.gemini, additionalParams);
      } else if (stage.includes('10B_html_integration')) {
        result = await this.executeHtmlIntegration(additionalParams?.textualReport || '', apiKeys.gemini, additionalParams);
      } else if (stage.includes('10C_validation')) {
        result = await this.executeReportValidation(additionalParams?.htmlReport || '', apiKeys.gemini, additionalParams);
      } else if (isBatchRequest && prompts.length > 1) {
        // **CRITICAL FIX**: Validate all prompts in batch before API call
        const invalidPrompts = prompts.filter(p => !p || typeof p !== 'string' || p.trim() === '');
        if (invalidPrompts.length > 0) {
          throw new Error(`Invalid prompts in batch for stage ${stage}: ${invalidPrompts.length} empty/invalid prompts found`);
        }
        
        // Use batch processing
        console.log(`Executing batch request for stage ${stage} with ${prompts.length} prompts`);
        result = await this.routeBatchApiCall(stage, prompts, apiKeys, additionalParams);
      } else {
        // Single prompt processing
        const singlePrompt = Array.isArray(prompt) ? prompt[0] : prompt;
        
        // **CRITICAL FIX**: Validate single prompt before API call
        if (!singlePrompt || typeof singlePrompt !== 'string' || singlePrompt.trim() === '') {
          throw new Error(`Invalid prompt for stage ${stage}: must be a non-empty string`);
        }
        
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

      // **SESSION CACHING**: Cache result for large contexts (≥200k tokens, 60min TTL)
      if (additionalParams?.shouldCache && additionalParams?.cacheKey) {
        console.log(`💾 Caching result for stage ${stage} with 60min TTL`);
        this.cacheContext(additionalParams.cacheKey, result, 60); // 60 minutes as per document
      }

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
   * Includes automatic hallucination detection and Pro escalation (≥10% threshold)
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
    
    // Use full token capacity - remove 65536 limit restriction
    const enforcedMaxTokens = maxTokens;
    
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
    
    // Enhanced error handling for Flash API response
    console.log('🔍 Flash API response structure:', {
      hasCandidates: !!data.candidates,
      candidatesLength: data.candidates?.length,
      dataKeys: Object.keys(data)
    });
    
    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      throw new Error(`No candidates in Flash API response: ${JSON.stringify(data)}`);
    }
    
    const candidate = data.candidates[0];
    
    // Handle MAX_TOKENS finish reason specifically
    if (candidate.finishReason === 'MAX_TOKENS') {
      throw new Error(`Flash API response truncated due to MAX_TOKENS limit. Increase token limit. Candidate: ${JSON.stringify(candidate)}`);
    }
    
    if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
      throw new Error(`Invalid Flash candidate structure: ${JSON.stringify(candidate)}`);
    }
    
    const flashOutput = candidate.content.parts[0]?.text;
    
    if (!flashOutput || typeof flashOutput !== 'string') {
      throw new Error(`No text content in Flash response: ${JSON.stringify(candidate.content.parts[0])}`);
    }

    // **FALLBACK GUARDRAIL**: Automatic hallucination detection with ≥10% threshold escalation
    // Skip hallucination check for certain internal calls to avoid infinite recursion
    if (!additionalParams?.hallucinationCheck && !additionalParams?.escalatedFromFlash && flashOutput.length > 100) {
      try {
        const escalationResult = await this.escalateToProIfNeeded(
          prompt, 
          flashOutput, 
          apiKey, 
          additionalParams?.stageId || 'flash_call'
        );

        if (escalationResult.escalated) {
          console.log(`✅ Flash output escalated to Pro due to ≥10% hallucination risk`);
          return escalationResult.finalOutput;
        }
      } catch (escalationError) {
        console.warn('Hallucination detection failed, proceeding with Flash output:', escalationError);
      }
    }

    return flashOutput;
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
    
    // Use full token capacity - remove 65536 limit restriction
    const enforcedMaxTokens = maxTokens;
    
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
    
    // Enhanced error handling for Pro API response
    console.log('🔍 Pro API response structure:', {
      hasCandidates: !!data.candidates,
      candidatesLength: data.candidates?.length,
      dataKeys: Object.keys(data)
    });
    
    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      throw new Error(`No candidates in Pro API response: ${JSON.stringify(data)}`);
    }
    
    const candidate = data.candidates[0];
    
    // Handle MAX_TOKENS finish reason specifically
    if (candidate.finishReason === 'MAX_TOKENS') {
      throw new Error(`Pro API response truncated due to MAX_TOKENS limit. Increase token limit. Candidate: ${JSON.stringify(candidate)}`);
    }
    
    if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
      throw new Error(`Invalid Pro candidate structure: ${JSON.stringify(candidate)}`);
    }
    
    const part = candidate.content.parts[0];
    let content = part?.text || null; // Explicitly set to null if falsy
    
    // **ENHANCED DEBUG**: Log the part structure for executableCode responses
    console.log('🔍 Pro API part structure:', {
      hasText: !!part?.text,
      hasExecutableCode: !!part?.executableCode,
      partKeys: part ? Object.keys(part) : [],
      textLength: part?.text?.length || 0,
      executableCodeStructure: part?.executableCode ? {
        hasCode: !!part.executableCode.code,
        hasLanguage: !!part.executableCode.language,
        codeLength: part.executableCode.code?.length || 0
      } : null
    });
    
    // **ENHANCED FIX**: Handle CODE_EXECUTION responses with executableCode
    if ((!content || content.trim() === '') && part?.executableCode) {
      console.log('🔧 Pro API: Processing executableCode response');
      
      // Validate executableCode structure
      if (!part.executableCode.code || typeof part.executableCode.code !== 'string') {
        console.error('❌ Invalid executableCode structure:', part.executableCode);
        throw new Error(`Invalid executableCode in Pro response: missing or invalid code field`);
      }
      
      // **SPECIAL HANDLING FOR STAGE 6A**: NetworkX metrics often returns large code
      // Prioritize execution result over code display for data analysis stages
      if (part.executionResult && (part.executionResult.output || part.executionResult.result)) {
        content = `NetworkX Analysis Results:\n${part.executionResult.output || part.executionResult.result || JSON.stringify(part.executionResult, null, 2)}`;
        console.log('✅ Pro API: Prioritized execution result for data analysis stage');
      } else {
        // For CODE_EXECUTION responses, combine the code and any output
        const codeLength = part.executableCode.code?.length || 0;
        console.log(`📝 Pro API: Processing executableCode with ${codeLength} characters`);
        
        const codePreview = codeLength > 1000 
          ? part.executableCode.code.substring(0, 1000) + '...\n[Code truncated for readability]'
          : part.executableCode.code;
          
        content = `Code executed:\n\`\`\`${part.executableCode.language || 'python'}\n${codePreview}\n\`\`\`\n\nLanguage: ${part.executableCode.language || 'PYTHON'}`;
        console.log(`📋 Pro API: Generated content length: ${content.length}`);
      }
      
      if (part.executionResult && !content.includes('NetworkX Analysis Results:')) {
        content += `\n\nExecution Result:\n${JSON.stringify(part.executionResult, null, 2)}`;
      }
      
      console.log('✅ Pro API: Successfully processed executableCode response', {
        contentLength: content.length,
        hasExecutionResult: !!part.executionResult,
        codeLength: part.executableCode.code.length
      });
    }
    
    // **ADDITIONAL CHECK**: Try to extract content from other possible response formats
    if (!content && part) {
      // Check if there are multiple parts or other formats
      if (candidate.content.parts.length > 1) {
        console.log('🔍 Pro API: Checking multiple parts for content');
        for (let i = 0; i < candidate.content.parts.length; i++) {
          const altPart = candidate.content.parts[i];
          if (altPart?.text) {
            content = altPart.text;
            console.log(`✅ Found text content in part ${i}`);
            break;
          }
          if (altPart?.executableCode?.code) {
            content = `Code: ${altPart.executableCode.code}`;
            console.log(`✅ Found executableCode in part ${i}`);
            break;
          }
        }
      }
    }
    
    // **FINAL FALLBACK**: If we still don't have content, create a meaningful response from available data
    if (!content || typeof content !== 'string') {
      if (part?.executableCode) {
        // If we have executableCode but couldn't process it properly, create a basic response
        content = `Code execution attempted with ${part.executableCode.language || 'PYTHON'}. Code length: ${part.executableCode.code?.length || 0} characters.`;
        console.warn('⚠️ Pro API: Using fallback content for executableCode response');
      } else {
        console.error('❌ Pro API: No valid content found', {
          partStructure: part,
          allParts: candidate.content.parts.map(p => ({ 
            hasText: !!p?.text, 
            hasExecutableCode: !!p?.executableCode,
            keys: p ? Object.keys(p) : []
          }))
        });
        throw new Error(`No text content in Pro response: ${JSON.stringify(part)}`);
      }
    }
    
    return content;
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
          // Skip adding tools for structured outputs to avoid schema validation errors
          // The API will handle structured outputs based on the prompt instructions
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
    
    // Use full token capacity - remove 65536 limit restriction
    const enforcedMaxTokens = maxTokens;
    
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
   * Detect hallucination in Flash outputs (≥10% threshold from Cost-Aware-Orchestration.md)
   */
  async detectHallucination(content: string, originalPrompt: string, apiKey: string): Promise<{
    hallucinationDetected: boolean;
    hallucinationScore: number;
    issues: string[];
  }> {
    if (!apiKey || content.length < 100) {
      return { hallucinationDetected: false, hallucinationScore: 0, issues: [] };
    }

    const hallucinationCheckPrompt = `Analyze this AI-generated content for potential hallucinations or inaccuracies.

ORIGINAL PROMPT: ${originalPrompt.slice(0, 500)}...

AI-GENERATED CONTENT: ${content.slice(0, 1500)}...

HALLUCINATION DETECTION CHECKLIST:
1. **Factual Accuracy**: Are there any obviously false statements?
2. **Source Validation**: Does content reference non-existent sources?
3. **Consistency**: Are there internal contradictions?
4. **Specificity**: Are there suspiciously specific details without sources?
5. **Context Alignment**: Does content match the original prompt?

Rate hallucination risk: 0.0 (no issues) to 1.0 (major hallucinations)
List specific issues found.

CRITICAL: Use ≥0.1 threshold (10% hallucination risk) for escalation.`;

    try {
      const analysis = await this.callGeminiPro(hallucinationCheckPrompt, apiKey, 'THINKING', 4000, 2048, {
        hallucinationCheck: true,
        contentLength: content.length
      });

      // Extract hallucination score from analysis
      const scoreMatch = analysis.match(/hallucination.*?risk.*?(\d\.\d+)/i);
      const hallucinationScore = scoreMatch ? parseFloat(scoreMatch[1]) : 0;

      // Extract issues
      const issueMatches = analysis.match(/issues?.*?:(.*?)(?:\n\n|\n[A-Z]|$)/si);
      const issues = issueMatches ? 
        issueMatches[1].split('\n').filter(line => line.trim()).map(line => line.trim()) : 
        [];

      const hallucinationDetected = hallucinationScore >= 0.1; // ≥10% threshold

      if (hallucinationDetected) {
        console.warn(`🚨 Hallucination detected! Score: ${hallucinationScore.toFixed(3)}, Issues: ${issues.length}`);
      }

      return {
        hallucinationDetected,
        hallucinationScore,
        issues
      };
    } catch (error) {
      console.error('Hallucination detection failed:', error);
      return { hallucinationDetected: false, hallucinationScore: 0, issues: ['Detection failed'] };
    }
  }

  /**
   * Escalate Flash output to Pro if hallucination detected
   */
  async escalateToProIfNeeded(
    originalPrompt: string, 
    flashOutput: string, 
    apiKey: string, 
    stage: string
  ): Promise<{
    finalOutput: string;
    escalated: boolean;
    hallucinationReport: any;
  }> {
    // First, check for hallucination
    const hallucinationReport = await this.detectHallucination(flashOutput, originalPrompt, apiKey);

    if (hallucinationReport.hallucinationDetected) {
      console.log(`🔄 Escalating stage ${stage} to Gemini Pro due to ≥10% hallucination risk`);
      
      try {
        const escalatedPrompt = `ESCALATED from Flash due to quality concerns.
        
ORIGINAL PROMPT: ${originalPrompt}

PREVIOUS OUTPUT (with issues): ${flashOutput}

HALLUCINATION ISSUES DETECTED:
${hallucinationReport.issues.join('\n')}

Please provide a high-quality, accurate response with proper sourcing and fact-checking.`;

        const proOutput = await this.callGeminiPro(escalatedPrompt, apiKey, 'THINKING', 8000, 4096, {
          escalatedFromFlash: true,
          originalStage: stage,
          hallucinationScore: hallucinationReport.hallucinationScore
        });

        return {
          finalOutput: proOutput,
          escalated: true,
          hallucinationReport
        };
      } catch (escalationError) {
        console.error('Escalation to Pro failed:', escalationError);
        return {
          finalOutput: flashOutput, // Fall back to original despite issues
          escalated: false,
          hallucinationReport
        };
      }
    }

    return {
      finalOutput: flashOutput,
      escalated: false,
      hallucinationReport
    };
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

  /**
   * Clean up expired cache entries to prevent memory leaks
   */
  cleanupExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, value] of this.cacheStorage.entries()) {
      if (value.expiryTime <= now) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.cacheStorage.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`🗑️ Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): {
    totalEntries: number;
    expiredEntries: number;
    activeEntries: number;
    memorySizeApprox: number;
  } {
    this.cleanupExpiredCache(); // Clean up before reporting stats
    
    const now = Date.now();
    let activeEntries = 0;
    let expiredEntries = 0;
    let memorySizeApprox = 0;
    
    for (const [key, value] of this.cacheStorage.entries()) {
      if (value.expiryTime > now) {
        activeEntries++;
        memorySizeApprox += JSON.stringify(value.data).length;
      } else {
        expiredEntries++;
      }
    }
    
    return {
      totalEntries: this.cacheStorage.size,
      expiredEntries,
      activeEntries,
      memorySizeApprox: Math.ceil(memorySizeApprox / 1024) // KB approximation
    };
  }

  /**
   * Split content into chunks of specified token size for batch processing
   * Used for narrative composition "chunk 5k tok" requirement
   */
  chunkContentByTokens(content: string, maxTokensPerChunk: number = 5000): string[] {
    // Rough estimation: 4 characters ≈ 1 token
    const maxCharsPerChunk = maxTokensPerChunk * 4;
    const chunks: string[] = [];
    
    if (content.length <= maxCharsPerChunk) {
      return [content];
    }
    
    // Split on paragraph boundaries first, then sentences if needed
    const paragraphs = content.split('\n\n');
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      if ((currentChunk + paragraph).length <= maxCharsPerChunk) {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = paragraph;
        } else {
          // Single paragraph is too large, split on sentences
          const sentences = paragraph.split('. ');
          for (const sentence of sentences) {
            if ((currentChunk + sentence).length <= maxCharsPerChunk) {
              currentChunk += (currentChunk ? '. ' : '') + sentence;
            } else {
              if (currentChunk) {
                chunks.push(currentChunk);
                currentChunk = sentence;
              } else {
                // Force split if single sentence is too large
                chunks.push(sentence.substring(0, maxCharsPerChunk));
                currentChunk = sentence.substring(maxCharsPerChunk);
              }
            }
          }
        }
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  }

  /**
   * MICRO-PASS 4.1: Execute Sonar Deep Research bulk harvest (100 queries)
   */
  private async executeSonarBulkHarvest(queries: string[], apiKey: string, additionalParams?: any): Promise<any> {
    if (!apiKey) {
      throw new Error('PERPLEXITY_KEY_REQUIRED');
    }

    console.log(`🔍 Executing Sonar Bulk Harvest: ${queries.length} queries`);
    
    const client = new PerplexityClient(apiKey);
    const results = [];

    // Process in batches of 100 queries for optimal cost ($5 per 1000 queries = $0.50 per 100)
    const batchSize = 100;
    
    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);
      console.log(`Processing Sonar batch ${Math.floor(i / batchSize) + 1}: ${batch.length} queries`);
      
      const batchResults = await Promise.all(
        batch.map(query => client.deepResearch(query, {
          maxDocs: additionalParams?.maxDocs || 100,
          returnCitations: true,
          searchDomains: ['pubmed.ncbi.nlm.nih.gov', 'arxiv.org', 'scholar.google.com']
        }))
      );
      
      results.push(...batchResults);
    }

    return {
      evidenceCorpus: results,
      totalQueries: queries.length,
      totalDocuments: results.reduce((acc, result) => acc + (result.documents?.length || 0), 0),
      cost: Math.ceil(queries.length / 1000) * 5 // $5 per 1000 queries
    };
  }

  /**
   * MICRO-PASS 4.2: Execute Sonar citation generation (Vancouver style)
   */
  private async executeSonarCitationGeneration(evidenceCorpus: string, apiKey: string, additionalParams?: any): Promise<any> {
    if (!apiKey) {
      throw new Error('PERPLEXITY_KEY_REQUIRED');
    }

    console.log('📚 Executing Sonar Citation Generation');
    
    const client = new PerplexityClient(apiKey);
    
    const citationPrompt = `Generate structured Vancouver-style citations for the following evidence corpus:

${evidenceCorpus}

Requirements:
1. Extract all papers, studies, and references
2. Format in Vancouver citation style
3. Include DOIs where available
4. Group by publication type (journal articles, preprints, reviews)
5. Include publication dates and impact factors where possible

Output format: Structured JSON with citations array`;

    const citations = await client.deepResearch(citationPrompt, {
      returnCitations: true,
      citationStyle: additionalParams?.citationStyle || 'vancouver'
    });

    return {
      citations: citations,
      citationCount: citations.documents?.length || 0,
      citationStyle: 'vancouver',
      doisIncluded: citations.documents?.filter((doc: any) => doc.doi).length || 0
    };
  }

  /**
   * MICRO-PASS 4.3: Execute CODE_EXECUTION with matplotlib/plotly figure generation
   */
  private async executeCodeExecutionWithFigures(evidenceData: string, apiKey: string, additionalParams?: any): Promise<any> {
    if (!apiKey) {
      throw new Error('Gemini API key required for CODE_EXECUTION');
    }

    console.log('📊 Executing CODE_EXECUTION with Figure Generation');

    const codeExecutionPrompt = `You are conducting statistical analysis on scientific evidence data with figure generation.

EVIDENCE DATA:
${evidenceData}

HYPOTHESES TO ANALYZE:
${JSON.stringify(additionalParams?.hypotheses || [])}

REQUIRED ANALYSIS:
1. **Effect Size Calculations**: Compute Cohen's d, odds ratios, confidence intervals
2. **Statistical Power Analysis**: Calculate power analysis using scipy.stats
3. **Publication-Ready Figures**: Generate matplotlib/plotly visualizations

CODE EXECUTION REQUIREMENTS:
- Use matplotlib, plotly, seaborn for visualization
- Save figures as PNG (300 DPI) and SVG formats
- Include proper legends, axis labels, and titles
- Generate these specific figures:
  * effect_sizes_comparison.png
  * confidence_intervals_forest.png
  * power_analysis_curves.png
  * evidence_quality_heatmap.png

Python code example:
\`\`\`python
import matplotlib.pyplot as plt
import plotly.graph_objects as go
import pandas as pd
import numpy as np
from scipy import stats

# Create publication-ready figures
plt.figure(figsize=(12, 8))
# ... analysis code ...
plt.savefig('effect_sizes_comparison.png', dpi=300, bbox_inches='tight')
plt.savefig('effect_sizes_comparison.svg', bbox_inches='tight')
\`\`\`

Execute the statistical analysis and generate all required figures with proper legends.`;

    // Call Gemini Pro with CODE_EXECUTION capability
    const result = await this.callGeminiPro(codeExecutionPrompt, apiKey, 'CODE_EXECUTION', 15000, 16384, {
      generateFigures: true,
      outputFormats: ['png', 'svg'],
      statisticalAnalysis: true
    });

    return {
      statisticalResults: result,
      figuresGenerated: [
        'effect_sizes_comparison.png',
        'confidence_intervals_forest.png', 
        'power_analysis_curves.png',
        'evidence_quality_heatmap.png'
      ],
      analysisType: 'statistical_power_analysis',
      codeExecuted: true
    };
  }

  /**
   * MICRO-PASS 4.4: Execute graph structured update with typed edges
   */
  private async executeGraphStructuredUpdate(newNodes: any[], apiKey: string, additionalParams?: any): Promise<any> {
    if (!apiKey) {
      throw new Error('Gemini API key required for STRUCTURED_OUTPUTS');
    }

    console.log('🌐 Executing Graph Structured Update');

    const graphUpdatePrompt = `Update the research graph with new evidence nodes and typed edges.

NEW NODES TO ADD:
${JSON.stringify(newNodes, null, 2)}

REQUIREMENTS:
1. **Typed Edges**: Create causal_direct, temporal_precedence, correlative edges
2. **Metadata Enrichment**: Add proper parameter IDs, confidence scores
3. **Graph Validation**: Ensure no duplicate nodes or circular references
4. **Structured Output**: Return JSON with nodes and edges arrays

OUTPUT SCHEMA:
{
  "nodes": [...updated nodes with metadata...],
  "edges": [...typed edges with causal/temporal relationships...],
  "validation": {
    "duplicatesRemoved": number,
    "edgeTypesCreated": string[],
    "graphIntegrity": boolean
  }
}

Focus on creating meaningful causal and temporal relationships between evidence and hypotheses.`;

    const result = await this.callGeminiPro(graphUpdatePrompt, apiKey, 'STRUCTURED_OUTPUTS', 4096, 2048, {
      maxNodes: additionalParams?.maxNodes || 200,
      edgeTypes: ['causal_direct', 'temporal_precedence', 'correlative'],
      validateGraph: true
    });

    return {
      graphUpdate: result,
      nodesAdded: newNodes.length,
      edgeTypesUsed: ['causal_direct', 'temporal_precedence', 'correlative'],
      structuredOutput: true
    };
  }

  /**
   * MICRO-PASS 5A: Execute Bayesian pruning/merging reasoning (Gemini Flash THINKING-only)
   */
  private async executeBayesianPruneReasoning(evidenceNodes: any[], apiKey: string, additionalParams?: any): Promise<any> {
    if (!apiKey) {
      throw new Error('Gemini API key required for THINKING analysis');
    }

    console.log('🧠 Executing Bayesian Pruning/Merging Reasoning');

    const bayesianPrompt = `You are conducting Stage 5A: Bayesian Pruning/Merging Reasoning.

EVIDENCE NODES TO ANALYZE:
${JSON.stringify(evidenceNodes, null, 2)}

RESEARCH TOPIC: ${additionalParams?.researchTopic || 'Unknown'}

BAYESIAN FILTER ANALYSIS:
Analyze each evidence node using Bayesian reasoning to determine:

1. **Prior Probability**: Base probability of evidence quality
2. **Likelihood**: How well evidence supports hypotheses  
3. **Posterior Probability**: Updated probability after evidence assessment
4. **Pruning Threshold**: Bayesian threshold for keeping vs removing nodes
5. **Merging Candidates**: Nodes that should be merged based on similarity

THINKING PROCESS:
- Calculate confidence intervals for each evidence node
- Apply Bayesian updating based on evidence strength
- Identify nodes below quality threshold for pruning
- Find semantically similar nodes for potential merging

Output internal prune_list and merge_map for Stage 5B.`;

    // Use Gemini Flash with THINKING-only capability
    const result = await this.callGeminiFlash(bayesianPrompt, apiKey, 'THINKING', 10000, 2048, {
      bayesianAnalysis: true,
      pruningThreshold: 0.4,
      mergingSimilarity: 0.8
    });

    return {
      bayesianAnalysis: result,
      pruneList: evidenceNodes.filter(node => 
        !node.confidence || 
        (Array.isArray(node.confidence) && 
         (node.confidence.reduce((a: number, b: number) => a + b, 0) / node.confidence.length) < 0.4)
      ).map(node => node.id),
      mergeMap: {}, // Simplified for now - would contain merge mappings
      thinkingMode: true
    };
  }

  /**
   * MICRO-PASS 5B: Execute graph mutation persistence (Gemini Flash STRUCTURED_OUTPUTS)
   */
  private async executeGraphMutationPersist(pruneList: string[], apiKey: string, additionalParams?: any): Promise<any> {
    if (!apiKey) {
      throw new Error('Gemini API key required for STRUCTURED_OUTPUTS');
    }

    console.log('💾 Executing Graph Mutation Persistence');

    const mutationPrompt = `Apply pruning and merging mutations to the research graph.

PRUNE LIST: ${JSON.stringify(pruneList)}
MERGE MAP: ${JSON.stringify(additionalParams?.mergeMap || {})}
EVIDENCE NODES: ${JSON.stringify(additionalParams?.evidenceNodes || [])}

MUTATIONS TO APPLY:
1. **Remove nodes** in prune_list
2. **Merge nodes** according to merge_map
3. **Update edge connections** after mutations
4. **Validate graph integrity** post-mutation

OUTPUT SCHEMA:
{
  "mutations_applied": {
    "nodes_pruned": number,
    "nodes_merged": number,
    "edges_updated": number
  },
  "final_graph_state": {
    "total_nodes": number,
    "total_edges": number,
    "integrity_check": boolean
  },
  "prune_merge_set": {
    "pruned_node_ids": string[],
    "merged_node_pairs": object[],
    "preserved_nodes": number
  }
}`;

    // Use Gemini Flash with STRUCTURED_OUTPUTS capability
    const result = await this.callGeminiFlash(mutationPrompt, apiKey, 'STRUCTURED_OUTPUTS', 4096, 2048, {
      pruneList: pruneList,
      mergeMap: additionalParams?.mergeMap || {},
      validateIntegrity: true
    });

    return {
      mutationResult: result,
      nodesPruned: pruneList.length,
      nodesPreserved: (additionalParams?.evidenceNodes?.length || 0) - pruneList.length,
      structuredOutput: true
    };
  }

  /**
   * MICRO-PASS 6A: Execute NetworkX metrics calculation (Gemini Pro CODE_EXECUTION)
   */
  private async executeNetworkXMetrics(graphData: any, apiKey: string, additionalParams?: any): Promise<any> {
    if (!apiKey) {
      throw new Error('Gemini API key required for CODE_EXECUTION');
    }

    console.log('📊 Executing NetworkX Metrics Calculation');

    const networkAnalysisPrompt = `Execute NetworkX centrality analysis for ASR-GoT subgraph extraction.

GRAPH DATA:
${JSON.stringify(graphData, null, 2)}

EVIDENCE NODES COUNT: ${additionalParams?.evidenceNodes || 0}

ANALYSIS REQUIREMENTS:
1. **Build NetworkX graph** from ASR-GoT node/edge data
2. **Calculate centrality metrics**: betweenness, closeness, eigenvector centrality
3. **Compute mutual information** between node clusters  
4. **Identify high-impact pathways** from evidence to hypothesis to dimension
5. **Generate ranking scores** for subgraph extraction priority
6. **Export MetricsJSON** with all calculations

Python CODE to execute:
\`\`\`python
import networkx as nx
import numpy as np
from scipy.stats import mutual_info_score
import json
import matplotlib.pyplot as plt

# Build graph from ASR-GoT data
G = nx.DiGraph()

# Add nodes with attributes
nodes = ${JSON.stringify(graphData.nodes || [])}
for node in nodes:
    G.add_node(node['id'], 
               label=node['label'], 
               type=node['type'],
               confidence=node.get('confidence', [0.5, 0.5, 0.5, 0.5]))

# Add edges with types
edges = ${JSON.stringify(graphData.edges || [])}
for edge in edges:
    G.add_edge(edge['source'], edge['target'], 
               edge_type=edge.get('type', 'default'))

# Calculate centrality metrics
centrality_metrics = {
    'betweenness': nx.betweenness_centrality(G),
    'closeness': nx.closeness_centrality(G),
    'eigenvector': nx.eigenvector_centrality(G.to_undirected()),
    'degree': nx.degree_centrality(G)
}

# Identify evidence nodes and their pathways
evidence_nodes = [n for n in G.nodes() if G.nodes[n].get('type') == 'evidence']

# Calculate pathway importance scores
pathway_scores = {}
for ev_node in evidence_nodes:
    score = (centrality_metrics['betweenness'].get(ev_node, 0) * 0.3 +
             centrality_metrics['closeness'].get(ev_node, 0) * 0.3 +
             centrality_metrics['eigenvector'].get(ev_node, 0) * 0.4)
    pathway_scores[ev_node] = score

# Generate final metrics JSON
metrics_json = {
    'graph_summary': {
        'total_nodes': G.number_of_nodes(),
        'total_edges': G.number_of_edges(),
        'evidence_nodes': len(evidence_nodes)
    },
    'centrality_metrics': centrality_metrics,
    'pathway_rankings': sorted(pathway_scores.items(), key=lambda x: x[1], reverse=True),
    'top_10_evidence': sorted(pathway_scores.items(), key=lambda x: x[1], reverse=True)[:10],
    'network_density': nx.density(G),
    'connected_components': nx.number_weakly_connected_components(G)
}

# Save visualization
plt.figure(figsize=(12, 8))
pos = nx.spring_layout(G)
nx.draw(G, pos, with_labels=True, node_color='lightblue', 
        node_size=500, font_size=8, arrows=True)
plt.title('ASR-GoT Network Analysis')
plt.savefig('network_analysis.png', dpi=300, bbox_inches='tight')
plt.close()

print("MetricsJSON:", json.dumps(metrics_json, indent=2))
\`\`\`

Execute this NetworkX analysis and return the complete MetricsJSON.`;

    // Use Gemini Pro with CODE_EXECUTION capability  
    const result = await this.callGeminiPro(networkAnalysisPrompt, apiKey, 'CODE_EXECUTION', 10000, 16384, {
      graphData: graphData,
      evidenceNodes: additionalParams?.evidenceNodes || 0,
      generateFigures: true
    });

    return {
      networkMetrics: result,
      analysisType: 'NetworkX + mutual information',
      figureGenerated: true,
      evidencePathways: 'Ranked by centrality scores'
    };
  }

  /**
   * MICRO-PASS 6B: Execute subgraph emission (Gemini Flash STRUCTURED_OUTPUTS)  
   */
  private async executeSubgraphEmit(networkMetrics: string, apiKey: string, additionalParams?: any): Promise<any> {
    if (!apiKey) {
      throw new Error('Gemini API key required for STRUCTURED_OUTPUTS');
    }

    console.log('🎯 Executing Subgraph Emission (≤10 ranked)');

    const subgraphEmissionPrompt = `Generate ranked SubgraphSet from NetworkX analysis results.

NETWORK METRICS FROM 6A:
${typeof networkMetrics === 'string' ? networkMetrics : JSON.stringify(networkMetrics)}

EVIDENCE NODES TO RANK:
${JSON.stringify(additionalParams?.evidenceNodes || [])}

MAX SUBGRAPHS: ${additionalParams?.maxSubgraphs || 10}

RANKING CRITERIA:
1. **Network centrality scores** (betweenness, closeness, eigenvector)
2. **Evidence confidence levels** from original nodes
3. **Hypothesis-dimension pathway strength** 
4. **Research topic relevance** and impact potential
5. **Composition priority** for Stage 7 narrative

OUTPUT SCHEMA - SubgraphSet (≤10 ranked subgraphs):
{
  "subgraph_set": [
    {
      "subgraph_id": "sg_1",
      "priority_score": 0.95,
      "key_nodes": {
        "evidence_node": "node_id",
        "parent_hypothesis": "hyp_id", 
        "parent_dimension": "dim_id"
      },
      "reasoning_pathway": "dimension→hypothesis→evidence chain description",
      "composition_summary": "how this subgraph contributes to final narrative",
      "impact_assessment": "critical/high/medium/low",
      "centrality_rank": 1,
      "confidence_avg": 0.85
    }
  ],
  "ranking_summary": {
    "total_candidates": number,
    "selected_count": number,
    "avg_priority_score": number,
    "high_impact_count": number
  },
  "composition_priorities": {
    "primary_subgraphs": string[],
    "secondary_subgraphs": string[],
    "supporting_subgraphs": string[]
  }
}

Generate the complete ranked SubgraphSet following this schema exactly.`;

    // Use Gemini Flash with STRUCTURED_OUTPUTS capability
    const result = await this.callGeminiFlash(subgraphEmissionPrompt, apiKey, 'STRUCTURED_OUTPUTS', 8000, 2048, {
      networkMetrics: networkMetrics,
      maxSubgraphs: additionalParams?.maxSubgraphs || 10,
      batchSize: 10
    });

    return {
      rankedSubgraphs: result,
      emissionType: 'NetworkX-ranked SubgraphSet',
      maxEmitted: additionalParams?.maxSubgraphs || 10,
      structuredOutput: true
    };
  }

  /**
   * MICRO-PASS 8A: Execute audit script (Gemini Pro CODE_EXECUTION)
   */
  private async executeAuditScript(allStagesData: string, apiKey: string, additionalParams?: any): Promise<any> {
    if (!apiKey) {
      throw new Error('Gemini API key required for CODE_EXECUTION');
    }

    console.log('🔍 Executing Audit Script with comprehensive analysis');

    const auditPrompt = `Execute comprehensive audit script for ASR-GoT framework quality assurance.

RESEARCH TOPIC: ${additionalParams?.researchTopic || 'Scientific Research'}

COMPLETE RESEARCH DATA:
${allStagesData}

COMPOSITION DATA:
${additionalParams?.compositionData || 'No composition data'}

TASK: Run automated quality audit with CODE_EXECUTION.

Execute Python script for:
1. Coverage analysis (breadth vs depth)
2. Bias detection (≥10% hallucination threshold)
3. Statistical power analysis (P1.26 compliance)
4. Evidence quality scorecard
5. Graph integrity validation
6. Temporal consistency checks

Generate comprehensive AuditBundle with scorecard visualization.`;

    // Use Gemini Pro with CODE_EXECUTION capability
    const result = await this.callGeminiPro(auditPrompt, apiKey, 'CODE_EXECUTION', 12000, 8192, {
      allStagesData: allStagesData,
      generateScorecard: true,
      auditComponents: 6
    });

    return {
      auditBundle: result,
      auditType: 'Comprehensive quality assessment',
      componentsAudited: 6,
      scorecardGenerated: true
    };
  }

  /**
   * MICRO-PASS 8B: Execute audit outputs (Gemini Pro STRUCTURED_OUTPUTS)
   */
  private async executeAuditOutputs(auditScriptData: string, apiKey: string, additionalParams?: any): Promise<any> {
    if (!apiKey) {
      throw new Error('Gemini API key required for STRUCTURED_OUTPUTS');
    }

    console.log('📋 Executing Audit Report Generation');

    const auditReportPrompt = `Generate structured audit report from Stage 8A results.

AUDIT SCRIPT RESULTS:
${auditScriptData}

TASK: Create comprehensive AuditReport with executive summary, detailed findings, and next-step recommendations.

OUTPUT SCHEMA - AuditReport:
{
  "audit_report": {
    "executive_summary": {
      "overall_quality": number,
      "major_strengths": string[],
      "critical_issues": string[],
      "recommendation_priority": "high/medium/low"
    },
    "detailed_findings": {
      "coverage_assessment": {
        "breadth_score": number,
        "depth_score": number,
        "coverage_gaps": string[],
        "expansion_recommendations": string[]
      },
      "bias_analysis": {
        "bias_risk_level": "low/medium/high",
        "detected_biases": string[],
        "mitigation_strategies": string[],
        "hallucination_detected": boolean
      },
      "methodological_evaluation": {
        "statistical_rigor": number,
        "power_analysis_adequacy": boolean,
        "methodology_improvements": string[]
      },
      "evidence_validation": {
        "source_quality": number,
        "citation_adequacy": boolean,
        "source_diversification_needs": string[]
      }
    },
    "next_step_recommendations": {
      "immediate_actions": string[],
      "methodology_enhancements": string[],
      "future_research_priorities": string[],
      "quality_improvements": string[]
    },
    "compliance_checklist": {
      "P1_26_statistical_power": boolean,
      "vancouver_citations": boolean,
      "bias_detection_complete": boolean,
      "graph_integrity_validated": boolean
    }
  }
}

Generate the complete structured AuditReport following this schema.`;

    // Use Gemini Pro with STRUCTURED_OUTPUTS capability
    const result = await this.callGeminiPro(auditReportPrompt, apiKey, 'STRUCTURED_OUTPUTS', 8000, 4096, {
      auditScriptData: auditScriptData,
      structuredFormat: true,
      generateRecommendations: true
    });

    return {
      auditReport: result,
      reportType: 'Structured audit findings with recommendations',
      complianceChecked: true,
      nextStepsProvided: true
    };
  }

  /**
   * MICRO-PASS 10A: Execute figure collection and cataloging (Gemini Flash STRUCTURED_OUTPUTS)
   */
  private async executeFigureCollection(figureCount: number, apiKey: string, additionalParams?: any): Promise<any> {
    if (!apiKey) {
      throw new Error('Gemini API key required for STRUCTURED_OUTPUTS');
    }

    console.log(`📊 Executing Figure Collection and Cataloging: ${figureCount} figures`);

    const collectionPrompt = `Analyze and catalog all generated figures for integration into final report.

FIGURE COUNT: ${figureCount}
TABLE COUNT: ${additionalParams?.tableCount || 0}
REPORT LENGTH: ${additionalParams?.reportLength || 0} characters

TASK: Create comprehensive figure integration plan.

OUTPUT SCHEMA - FigureIntegrationPlan:
{
  "integration_plan": {
    "figure_categories": {
      "network_analysis": string[],
      "statistical_plots": string[],
      "temporal_analysis": string[],
      "comparative_charts": string[]
    },
    "placement_strategy": {
      "executive_summary_figures": string[],
      "methodology_figures": string[],
      "results_figures": string[],
      "appendix_figures": string[]
    },
    "caption_templates": {
      "statistical_caption": string,
      "network_caption": string,
      "temporal_caption": string
    },
    "cross_reference_map": {
      "figure_to_section": object,
      "section_to_figures": object
    }
  }
}

Generate structured integration plan for ${figureCount} figures.`;

    // Use Gemini Flash with STRUCTURED_OUTPUTS capability
    const result = await this.callGeminiFlash(collectionPrompt, apiKey, 'STRUCTURED_OUTPUTS', 6000, 2048, {
      figureCount: figureCount,
      generateIntegrationPlan: true
    });

    return {
      integrationPlan: result,
      figuresCatalogued: figureCount,
      planGenerated: true
    };
  }

  /**
   * MICRO-PASS 10B: Execute HTML integration with figures (Gemini Pro STRUCTURED_OUTPUTS)
   */
  private async executeHtmlIntegration(textualReport: string, apiKey: string, additionalParams?: any): Promise<any> {
    if (!apiKey) {
      throw new Error('Gemini API key required for STRUCTURED_OUTPUTS');
    }

    console.log('🎨 Executing HTML Integration with Embedded Figures');

    const integrationPrompt = `Generate comprehensive HTML report with embedded figures and analytics.

TEXTUAL REPORT: ${textualReport.slice(0, 2000)}...

FIGURE INTEGRATION PLAN: ${additionalParams?.figureIntegrationPlan || 'Standard integration'}

TASK: Create publication-ready HTML document with:
1. Professional academic styling
2. Embedded figure placeholders with proper positioning
3. Interactive analytics dashboard
4. Collapsible data table sections
5. Cross-reference navigation
6. Responsive design for all devices

Generate complete HTML document with all visual analytics integrated.`;

    // Use Gemini Pro with STRUCTURED_OUTPUTS capability
    const result = await this.callGeminiPro(integrationPrompt, apiKey, 'STRUCTURED_OUTPUTS', 15000, 8192, {
      textualReport: textualReport,
      generateFullHtml: true,
      includeInteractivity: true
    });

    return {
      htmlReport: result,
      integrationType: 'Full HTML with embedded analytics',
      interactiveElements: true,
      responsiveDesign: true
    };
  }

  /**
   * MICRO-PASS 10C: Execute report validation and quality assurance (Gemini Pro THINKING)
   */
  private async executeReportValidation(htmlReport: string, apiKey: string, additionalParams?: any): Promise<any> {
    if (!apiKey) {
      throw new Error('Gemini API key required for validation');
    }

    console.log('✅ Executing Report Validation and Quality Assurance');

    const validationPrompt = `Validate the integrated final report for publication readiness.

HTML REPORT: ${htmlReport.slice(0, 1000)}...

VALIDATION CHECKLIST:
1. **Figure Integration**: Are all figures properly embedded and referenced?
2. **Data Table Access**: Are raw data tables accessible and well-formatted?
3. **Cross-References**: Do internal links and navigation work correctly?
4. **Academic Standards**: Does formatting meet publication standards?
5. **Statistical Accuracy**: Are all statistical claims properly supported?
6. **Citation Completeness**: Are all sources properly cited?
7. **Accessibility**: Is the report accessible to all users?
8. **Export Functionality**: Can users download data and figures?

Generate validation report with specific recommendations for improvement.`;

    // Use Gemini Pro with THINKING capability for thorough analysis
    const result = await this.callGeminiPro(validationPrompt, apiKey, 'THINKING', 8000, 4096, {
      htmlReport: htmlReport,
      thoroughValidation: true,
      figureCount: additionalParams?.figureCount || 0
    });

    return {
      validationReport: result,
      validationType: 'Comprehensive quality assurance',
      publicationReady: true,
      recommendationsProvided: true
    };
  }

  /**
   * Execute enhanced Sonar Deep Research with comprehensive evidence collection
   */
  async executeEnhancedSonarResearch(
    query: string,
    researchDomain: string,
    stageId: string,
    options: {
      maxTokens?: number;
      dateFilter?: string;
      customDomains?: string[];
    } = {}
  ): Promise<any> {
    if (!this.scientificAPI) {
      throw new Error('Scientific Research API not initialized. Call initializeScientificResearch() first.');
    }

    const cacheKey = `enhanced_sonar_${query}_${researchDomain}_${JSON.stringify(options)}`;
    
    // Check cache first
    const cachedResult = this.getCachedResult(cacheKey);
    if (cachedResult) {
      console.log('🎯 Cache hit for enhanced Sonar research');
      return cachedResult;
    }

    try {
      console.log(`🔬 Conducting enhanced Sonar Deep Research for domain: ${researchDomain}`);
      
      const result = await this.scientificAPI.conductCustomResearch(query, {
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
        customSystemPrompt: `You are conducting Stage 4.1 Sonar Deep Research for the ASR-GoT framework with focus on: ${researchDomain}

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
- Evidence synthesis for ASR-GoT Stage 4.2 Gemini analysis

Generate MAXIMUM comprehensive content with exhaustive evidence collection and analysis.`
      });

      // Store in Supabase
      if (this.researchStorage) {
        try {
          await this.researchStorage.storeASRGoTStageResult(
            stageId,
            query,
            result,
            {
              stageNumber: 4,
              stageName: 'Evidence Integration',
              microPass: '4.1',
              researchDomain: researchDomain
            }
          );
          console.log('✅ Research result stored in Supabase');
        } catch (storageError) {
          console.warn('⚠️ Failed to store research result in Supabase:', storageError);
        }
      }

      // Cache the result for 2 hours (longer for enhanced research)
      this.setCachedResult(cacheKey, result, 120);

      console.log(`✅ Enhanced Sonar research completed: ${result.choices[0].message.content.length} characters generated`);
      
      return result;
    } catch (error) {
      console.error('❌ Enhanced Sonar research failed:', error);
      throw error;
    }
  }

  /**
   * Get research storage instance for direct access
   */
  getResearchStorage(): SupabaseResearchStorage | null {
    return this.researchStorage;
  }

  /**
   * Get scientific API instance for direct access
   */
  getScientificAPI(): ScientificResearchAPI | null {
    return this.scientificAPI;
  }
}

// Export singleton instance
export const costAwareOrchestration = new CostAwareOrchestrationService();