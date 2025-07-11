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

export class CostAwareOrchestrationService {
  private costHistory: CostDashboardEntry[] = [];
  private currentSessionCost = 0;
  private cacheStorage = new Map<string, any>();

  // Stage-by-Stage Model Assignment Matrix (from document)
  private stageModelMatrix: Record<string, StageModelAssignment> = {
    'initialization': {
      stage: 'Initialization',
      modelCapability: {
        model: 'gemini-2.5-flash',
        capability: 'STRUCTURED_OUTPUTS',
        batchSize: 50,
        purpose: 'Emit root n₀ and parameter inventory',
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
    'decomposition': {
      stage: 'Decomposition',
      modelCapability: {
        model: 'gemini-2.5-flash',
        capability: 'STRUCTURED_OUTPUTS',
        batchSize: 50,
        purpose: 'Create dimension nodes + bias flags',
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
    'hypothesis_generation': {
      stage: 'Hypothesis Generation - Pass A',
      modelCapability: {
        model: 'gemini-2.5-flash',
        capability: 'STRUCTURED_OUTPUTS',
        batchSize: 25,
        purpose: 'Draft 3-5 hypotheses per dimension w/ metadata',
        outputType: 'HypothesisBatch',
        maxTokens: 8000,
        thinkingBudget: 2048
      },
      costEstimate: {
        inputTokens: 25000,
        outputTokens: 8000,
        priceUSD: 0.111
      }
    },
    'hypothesis_planning': {
      stage: 'Hypothesis Planning - Pass B',
      modelCapability: {
        model: 'gemini-2.5-pro',
        capability: 'SEARCH_GROUNDING',
        batchSize: 10,
        purpose: 'Rapid facts & review snippets',
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
    'micro_service_decision': {
      stage: 'Micro-service Decision',
      modelCapability: {
        model: 'gemini-2.5-pro',
        capability: 'FUNCTION_CALLING',
        batchSize: 1,
        purpose: 'Select next back-end fn (run_lit_review, queue_lab_protocol)',
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
    'evidence_harvest_web': {
      stage: 'Evidence Harvest - Web Search',
      modelCapability: {
        model: 'sonar-deep-research',
        capability: 'SEARCH_GROUNDING',
        batchSize: 100,
        purpose: 'Crawl PubMed / arXiv; return up to 1M tokens of docs',
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
    'evidence_harvest_citations': {
      stage: 'Evidence Harvest - Citation Batch',
      modelCapability: {
        model: 'sonar-deep-research',
        capability: 'STRUCTURED_OUTPUTS',
        batchSize: 1,
        purpose: 'Generate structured citations & DOIs',
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
    'evidence_analysis': {
      stage: 'Evidence Analysis',
      modelCapability: {
        model: 'gemini-2.5-pro',
        capability: 'CODE_EXECUTION',
        batchSize: 10,
        purpose: 'Compute effect sizes, CI, power (P1.26), produce figs',
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
    'graph_update': {
      stage: 'Graph Update',
      modelCapability: {
        model: 'gemini-2.5-pro',
        capability: 'STRUCTURED_OUTPUTS',
        batchSize: 200,
        purpose: 'Attach Evidence nodes & typed edges (causal, temporal)',
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
    'prune_merge_reasoning': {
      stage: 'Prune / Merge Reasoning',
      modelCapability: {
        model: 'gemini-2.5-flash',
        capability: 'THINKING',
        batchSize: 1,
        purpose: 'Bayesian filter: mark prune_list & merge_map',
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
    'graph_mutation_persist': {
      stage: 'Graph Mutation Persist',
      modelCapability: {
        model: 'gemini-2.5-flash',
        capability: 'STRUCTURED_OUTPUTS',
        batchSize: 1,
        purpose: 'Apply prune_list / merge_map',
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
    'subgraph_metrics': {
      stage: 'Sub-graph Metrics Calc',
      modelCapability: {
        model: 'gemini-2.5-pro',
        capability: 'CODE_EXECUTION',
        batchSize: 1,
        purpose: 'Run NetworkX / GraphML centrality + MI scores',
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
    'subgraph_emit': {
      stage: 'Sub-graph Emit',
      modelCapability: {
        model: 'gemini-2.5-flash',
        capability: 'STRUCTURED_OUTPUTS',
        batchSize: 10,
        purpose: 'Send ranked SubgraphSet',
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
    'narrative_composition': {
      stage: 'Narrative Composition',
      modelCapability: {
        model: 'gemini-2.5-pro',
        capability: 'STRUCTURED_OUTPUTS',
        batchSize: 1,
        purpose: 'Write HTML blocks with embedded figs & Vancouver refs',
        outputType: 'ReportChunk[]',
        maxTokens: 25000,
        thinkingBudget: 8192
      },
      costEstimate: {
        inputTokens: 60000,
        outputTokens: 25000,
        priceUSD: 0.325
      }
    },
    'audit_script': {
      stage: 'Audit Script',
      modelCapability: {
        model: 'gemini-2.5-pro',
        capability: 'CODE_EXECUTION',
        batchSize: 1,
        purpose: 'Auto-check coverage, bias, power; produce scorecard',
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
    'audit_outputs': {
      stage: 'Audit Outputs',
      modelCapability: {
        model: 'gemini-2.5-pro',
        capability: 'STRUCTURED_OUTPUTS',
        batchSize: 1,
        purpose: 'Persist AuditReport + next-step recs',
        outputType: 'AuditReport',
        maxTokens: 8000,
        thinkingBudget: 4096
      },
      costEstimate: {
        inputTokens: 40000,
        outputTokens: 8000,
        priceUSD: 0.13
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
   * Route API call to appropriate model based on stage and capability
   */
  async routeApiCall(
    stage: string,
    prompt: string,
    apiKeys: APICredentials,
    additionalParams?: any
  ): Promise<any> {
    const assignment = this.getStageModelAssignment(stage);
    if (!assignment) {
      throw new Error(`No model assignment found for stage: ${stage}`);
    }

    const { model, capability, maxTokens, thinkingBudget } = assignment.modelCapability;

    // Check if we need Perplexity key for Sonar
    if (model === 'sonar-deep-research' && !apiKeys.perplexity) {
      throw new Error('Perplexity API key required for Sonar Deep Research');
    }

    // Track cost before API call
    const startTime = Date.now();

    try {
      let result;
      
      switch (model) {
        case 'sonar-deep-research':
          result = await this.callSonarDeepResearch(prompt, apiKeys.perplexity!, capability, maxTokens, additionalParams);
          break;
        case 'gemini-2.5-flash':
          result = await this.callGeminiFlash(prompt, apiKeys.gemini, capability, maxTokens, thinkingBudget, additionalParams);
          break;
        case 'gemini-2.5-pro':
          result = await this.callGeminiPro(prompt, apiKeys.gemini, capability, maxTokens, thinkingBudget, additionalParams);
          break;
        default:
          throw new Error(`Unsupported model: ${model}`);
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
   * Call Sonar Deep Research API
   */
  private async callSonarDeepResearch(
    prompt: string,
    apiKey: string,
    capability: CapabilityFlag,
    maxTokens: number,
    additionalParams?: any
  ): Promise<any> {
    const url = 'https://api.perplexity.ai/chat/completions';
    
    const body = {
      model: 'sonar-online',
      messages: [
        {
          role: 'system',
          content: 'You are Sonar Deep Research, an AI assistant specialized in comprehensive literature review and evidence collection. Search academic databases, PubMed, arXiv, and other scientific sources to gather high-quality research evidence.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.1,
      ...additionalParams
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Sonar API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Call Gemini 2.5 Flash API
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
    
    const tools = this.getToolsForCapability(capability);
    
    const body = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.1,
        ...additionalParams
      },
      tools: tools.length > 0 ? tools : undefined,
      systemInstruction: {
        parts: [{ text: 'You are Gemini 2.5 Flash, optimized for fast, cost-efficient processing with structured outputs.' }]
      }
    };

    if (thinkingBudget && capability === 'THINKING') {
      body.generationConfig.thinkingBudget = thinkingBudget;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Gemini Flash API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  /**
   * Call Gemini 2.5 Pro API
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
    
    const tools = this.getToolsForCapability(capability);
    
    const body = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.1,
        ...additionalParams
      },
      tools: tools.length > 0 ? tools : undefined,
      systemInstruction: {
        parts: [{ text: 'You are Gemini 2.5 Pro, optimized for advanced reasoning, code execution, and premium scientific analysis.' }]
      }
    };

    if (thinkingBudget && capability === 'THINKING') {
      body.generationConfig.thinkingBudget = thinkingBudget;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Gemini Pro API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  /**
   * Get tools configuration for specific capability
   */
  private getToolsForCapability(capability: CapabilityFlag): any[] {
    switch (capability) {
      case 'STRUCTURED_OUTPUTS':
        return [{ 'function_declarations': [] }];
      case 'SEARCH_GROUNDING':
        return [{ 'google_search_retrieval': {} }];
      case 'CODE_EXECUTION':
        return [{ 'code_execution': {} }];
      case 'FUNCTION_CALLING':
        return [{ 'function_declarations': [] }];
      default:
        return [];
    }
  }

  /**
   * Handle fallback scenarios
   */
  private async handleFallback(
    stage: string,
    prompt: string,
    apiKeys: APICredentials,
    error: any
  ): Promise<any> {
    console.log(`Implementing fallback for stage: ${stage}`);
    
    // If Sonar rate-limits, downgrade to Gemini Pro with SEARCH_GROUNDING
    if (stage.includes('evidence_harvest') && error.message.includes('rate')) {
      console.log('Sonar rate limited, falling back to Gemini Pro with search grounding');
      return this.callGeminiPro(prompt, apiKeys.gemini, 'SEARCH_GROUNDING', 15000, 8192);
    }
    
    // If Flash output has high hallucination, escalate to Pro
    if (stage.includes('flash') && error.message.includes('hallucination')) {
      console.log('Flash hallucination detected, escalating to Pro');
      return this.callGeminiPro(prompt, apiKeys.gemini, 'STRUCTURED_OUTPUTS', 15000, 8192);
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