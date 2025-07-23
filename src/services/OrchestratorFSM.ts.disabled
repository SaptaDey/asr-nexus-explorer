/**
 * OrchestratorFSM.ts - Finite State Machine for ASR-GoT stage orchestration
 * Implements the exact capability mapping from High-level_Principles.md
 */

import { APICredentials } from '@/types/asrGotTypes';
import { queueGeminiCall, queuePerplexityCall, getTaskResult } from '@/utils/background/TaskQueue';
import { validateStructuredOutput } from './StructuredOutputValidator';

export type GeminiCapability = 
  | 'STRUCTURED_OUTPUTS'
  | 'SEARCH_GROUNDING' 
  | 'FUNCTION_CALLING'
  | 'CODE_EXECUTION'
  | 'CACHING'
  | 'THINKING_ONLY';

export interface StagePass {
  passId: string;
  capability: GeminiCapability;
  description: string;
  inputRequired: string[];
  outputSchema?: string;
  cacheThreshold?: number;
}

export interface StageDefinition {
  stageId: number;
  name: string;
  passes: StagePass[];
  convergenceCheck?: (results: any[]) => boolean;
}

// Exact implementation from High-level_Principles.md Table 2
export const ASR_GOT_STAGES: StageDefinition[] = [
  {
    stageId: 1,
    name: 'Initialization',
    passes: [
      {
        passId: '1-init',
        capability: 'STRUCTURED_OUTPUTS',
        description: 'Emit canonical JSON for root node n₀ (ID, confidence vector C₀, timestamps, layer ID, metadata P1.12)',
        inputRequired: ['task_description'],
        outputSchema: 'RootNode'
      }
    ]
  },
  {
    stageId: 2,
    name: 'Decomposition',
    passes: [
      {
        passId: '2-decomp',
        capability: 'STRUCTURED_OUTPUTS',
        description: 'Generate array of dimension nodes (Scope, Constraints, …) with prior confidence vectors and bias flags',
        inputRequired: ['root_node'],
        outputSchema: 'DimensionArray'
      }
    ]
  },
  {
    stageId: 3,
    name: 'Hypothesis Generation',
    passes: [
      {
        passId: '3a-hypotheses',
        capability: 'STRUCTURED_OUTPUTS',
        description: 'Draft 3–5 hypotheses per dimension; attach falsifiability criteria (P1.16) & impact score (P1.28)',
        inputRequired: ['dimension_nodes'],
        outputSchema: 'HypothesisBatch'
      },
      {
        passId: '3b-planning',
        capability: 'SEARCH_GROUNDING',
        description: 'Collect high-level domain facts & recent reviews to refine experiment plans',
        inputRequired: ['hypothesis_batch'],
        cacheThreshold: 200000
      },
      {
        passId: '3c-functions',
        capability: 'FUNCTION_CALLING',
        description: 'Decide which bespoke micro-service (e.g. run_lit_review, queue_lab_protocol) to call next',
        inputRequired: ['search_results', 'hypothesis_batch']
      }
    ]
  },
  {
    stageId: 4,
    name: 'Evidence Integration',
    passes: [
      {
        passId: '4-cycle',
        capability: 'SEARCH_GROUNDING',
        description: 'Query Perplexity for targeted evidence supporting focus hypothesis h*',
        inputRequired: ['focus_hypothesis'],
        convergenceCheck: (results) => results.length >= 3 && results.every(r => r.confidence > 0.6)
      },
      {
        passId: '4-analysis',
        capability: 'CODE_EXECUTION',
        description: 'If raw tables/CSVs are present, compute effect sizes, CIs, statistical power (P1.26)',
        inputRequired: ['evidence_data']
      },
      {
        passId: '4-integration',
        capability: 'STRUCTURED_OUTPUTS',
        description: 'Post retrieved evidence nodes and typed edges (supportive, causal, temporal)',
        inputRequired: ['analyzed_evidence'],
        outputSchema: 'EvidenceBatch'
      }
    ]
  },
  {
    stageId: 5,
    name: 'Pruning & Merging',
    passes: [
      {
        passId: '5a-reasoning',
        capability: 'THINKING_ONLY',
        description: 'Pure Bayesian update: drop nodes with E[C] < 0.2 and low impact; shortlist merge-candidates (semantic ≥ 0.8)',
        inputRequired: ['full_graph']
      },
      {
        passId: '5b-mutation',
        capability: 'STRUCTURED_OUTPUTS',
        description: 'Persist prune_ids and merge_map to graph store',
        inputRequired: ['pruning_decisions'],
        outputSchema: 'PruneMergeSet'
      }
    ]
  },
  {
    stageId: 6,
    name: 'Subgraph Extraction',
    passes: [
      {
        passId: '6-analysis',
        capability: 'CODE_EXECUTION',
        description: 'Compute centrality, MI and impact metrics; rank top sub-graphs for user view/export',
        inputRequired: ['pruned_graph']
      },
      {
        passId: '6-results',
        capability: 'STRUCTURED_OUTPUTS',
        description: 'Emit SubgraphSet JSON with node IDs & scores',
        inputRequired: ['subgraph_analysis'],
        outputSchema: 'SubgraphSet'
      }
    ]
  },
  {
    stageId: 7,
    name: 'Composition',
    passes: [
      {
        passId: '7-narrative',
        capability: 'STRUCTURED_OUTPUTS',
        description: 'Draft human-readable narrative blocks (Abstract, Findings, Figures, Vancouver refs) without raw MD',
        inputRequired: ['subgraph_set'],
        outputSchema: 'ReportChunks'
      }
    ]
  },
  {
    stageId: 8,
    name: 'Reflection & Audit',
    passes: [
      {
        passId: '8a-audit',
        capability: 'CODE_EXECUTION',
        description: 'Traverse entire graph; run automated audit script for coverage, biases, power, causality',
        inputRequired: ['complete_graph', 'report_chunks']
      },
      {
        passId: '8b-reflection',
        capability: 'STRUCTURED_OUTPUTS',
        description: 'Emit AuditReport JSON & recommended next actions',
        inputRequired: ['audit_results'],
        outputSchema: 'AuditReport'
      }
    ]
  }
];

export class OrchestratorFSM {
  private currentStage: number = 1;
  private currentPass: number = 0;
  private stageResults: Map<string, any> = new Map();
  private credentials: APICredentials;
  private graphHash: string = '';
  
  constructor(credentials: APICredentials) {
    this.credentials = credentials;
  }

  /**
   * Execute a single stage pass with strict single-tool rule enforcement
   */
  async executeStagePass(
    stageId: number, 
    passIndex: number, 
    inputData: any
  ): Promise<any> {
    const stage = ASR_GOT_STAGES.find(s => s.stageId === stageId);
    if (!stage) {
      throw new Error(`Stage ${stageId} not found`);
    }

    const pass = stage.passes[passIndex];
    if (!pass) {
      throw new Error(`Pass ${passIndex} not found for stage ${stageId}`);
    }

    console.log(`🎯 Executing ${pass.passId}: ${pass.description}`);

    // Validate input requirements
    this.validateInputRequirements(pass.inputRequired, inputData);

    // Build prompt with proper capability flags
    const prompt = this.buildPrompt(pass, inputData);
    
    // Execute with single-tool rule enforcement
    const result = await this.executeWithCapability(pass, prompt);

    // Validate structured output if schema specified
    if (pass.outputSchema) {
      const isValid = await validateStructuredOutput(result, pass.outputSchema);
      if (!isValid) {
        throw new Error(`Structured output validation failed for ${pass.passId}`);
      }
    }

    // Store result for next pass
    this.stageResults.set(pass.passId, result);

    return result;
  }

  /**
   * Execute entire stage with all passes
   */
  async executeStage(stageId: number, inputData: any): Promise<any> {
    const stage = ASR_GOT_STAGES.find(s => s.stageId === stageId);
    if (!stage) {
      throw new Error(`Stage ${stageId} not found`);
    }

    console.log(`🚀 Starting Stage ${stageId}: ${stage.name}`);

    let currentData = inputData;
    const passResults: any[] = [];

    // Execute all passes in sequence
    for (let i = 0; i < stage.passes.length; i++) {
      const pass = stage.passes[i];
      
      // Execute pass
      const result = await this.executeStagePass(stageId, i, currentData);
      passResults.push(result);

      // Check convergence for iterative passes
      if (pass.convergenceCheck) {
        if (!pass.convergenceCheck(passResults)) {
          console.log(`🔄 Convergence not met for ${pass.passId}, continuing...`);
          // Could implement retry logic here
        }
      }

      // Pass result to next stage
      currentData = { ...currentData, [`${pass.passId}_result`]: result };
    }

    // Update FSM state
    this.currentStage = stageId;
    this.currentPass = 0;

    console.log(`✅ Completed Stage ${stageId}: ${stage.name}`);
    
    return {
      stageId,
      stageName: stage.name,
      passResults,
      finalResult: passResults[passResults.length - 1]
    };
  }

  /**
   * Enforce single-tool rule: Thinking + exactly one other capability
   */
  private async executeWithCapability(pass: StagePass, prompt: string): Promise<any> {
    const tools = ['THINKING']; // Always include thinking
    
    // Add exactly one other capability
    if (pass.capability !== 'THINKING_ONLY') {
      tools.push(pass.capability);
    }

    // Check cache threshold
    const shouldCache = pass.cacheThreshold && prompt.length > pass.cacheThreshold;
    const cacheKey = shouldCache ? this.generateCacheKey(pass.passId) : undefined;

    switch (pass.capability) {
      case 'STRUCTURED_OUTPUTS':
        return this.executeStructuredOutput(prompt, tools, cacheKey);
      
      case 'SEARCH_GROUNDING':
        return this.executeSearchGrounding(prompt, tools, cacheKey);
      
      case 'FUNCTION_CALLING':
        return this.executeFunctionCalling(prompt, tools, cacheKey);
      
      case 'CODE_EXECUTION':
        return this.executeCodeExecution(prompt, tools, cacheKey);
      
      case 'THINKING_ONLY':
        return this.executeThinkingOnly(prompt, cacheKey);
      
      default:
        throw new Error(`Unknown capability: ${pass.capability}`);
    }
  }

  private async executeStructuredOutput(prompt: string, tools: string[], cacheKey?: string): Promise<any> {
    const enhancedPrompt = `${prompt}\n\nIMPORTANT: Respond with valid JSON following the specified schema. Use structured reasoning in your thinking process.`;
    
    const taskId = queueGeminiCall(enhancedPrompt, this.credentials, 'high', {
      tools,
      cacheKey,
      structuredOutput: true
    });
    
    return await getTaskResult(taskId);
  }

  private async executeSearchGrounding(prompt: string, tools: string[], cacheKey?: string): Promise<any> {
    const enhancedPrompt = `${prompt}\n\nUse search grounding to find current, relevant information. Think through your search strategy first.`;
    
    const taskId = queuePerplexityCall(enhancedPrompt, this.credentials, 'high', {
      tools,
      cacheKey,
      searchGrounding: true
    });
    
    return await getTaskResult(taskId);
  }

  private async executeFunctionCalling(prompt: string, tools: string[], cacheKey?: string): Promise<any> {
    const enhancedPrompt = `${prompt}\n\nSelect and call the appropriate function. Think through which function best addresses the requirements.`;
    
    const taskId = queueGeminiCall(enhancedPrompt, this.credentials, 'high', {
      tools,
      cacheKey,
      functionCalling: true,
      availableFunctions: this.getAvailableFunctions()
    });
    
    return await getTaskResult(taskId);
  }

  private async executeCodeExecution(prompt: string, tools: string[], cacheKey?: string): Promise<any> {
    const enhancedPrompt = `${prompt}\n\nWrite and execute code to analyze the data. Think through your analytical approach first.`;
    
    const taskId = queueGeminiCall(enhancedPrompt, this.credentials, 'high', {
      tools,
      cacheKey,
      codeExecution: true
    });
    
    return await getTaskResult(taskId);
  }

  private async executeThinkingOnly(prompt: string, cacheKey?: string): Promise<any> {
    const enhancedPrompt = `${prompt}\n\nUse only internal reasoning. No external tools needed. Think through the problem systematically.`;
    
    const taskId = queueGeminiCall(enhancedPrompt, this.credentials, 'high', {
      tools: ['THINKING'],
      cacheKey,
      thinkingOnly: true
    });
    
    return await getTaskResult(taskId);
  }

  private buildPrompt(pass: StagePass, inputData: any): string {
    const basePrompt = `
# ASR-GoT Stage Pass: ${pass.passId}

## Objective
${pass.description}

## Input Data
${JSON.stringify(inputData, null, 2)}

## Instructions
Execute this pass according to the ASR-GoT methodology. Use the ${pass.capability} capability as specified in the High-level Principles.

## Required Output
${pass.outputSchema ? `Structured JSON following ${pass.outputSchema} schema` : 'Analysis result as specified in the objective'}
`;

    return basePrompt;
  }

  private validateInputRequirements(required: string[], inputData: any): void {
    const missing = required.filter(req => !(req in inputData));
    if (missing.length > 0) {
      throw new Error(`Missing required inputs: ${missing.join(', ')}`);
    }
  }

  private generateCacheKey(passId: string): string {
    const data = `${passId}-${this.graphHash}`;
    return btoa(data).substring(0, 32);
  }

  private getAvailableFunctions(): string[] {
    return [
      'run_lit_review',
      'queue_lab_protocol',
      'compute_statistical_power',
      'extract_causal_relationships',
      'validate_methodology',
      'generate_citations'
    ];
  }

  // Public API methods
  public getCurrentStage(): number {
    return this.currentStage;
  }

  public getCurrentPass(): number {
    return this.currentPass;
  }

  public getStageResults(): Map<string, any> {
    return this.stageResults;
  }

  public updateGraphHash(newHash: string): void {
    this.graphHash = newHash;
  }

  public resetFSM(): void {
    this.currentStage = 1;
    this.currentPass = 0;
    this.stageResults.clear();
  }
}

// Singleton instance
export const orchestratorFSM = new OrchestratorFSM({
  geminiApiKey: '',
  perplexityApiKey: ''
});

// React hook for using orchestrator FSM
export const useOrchestratorFSM = () => {
  return {
    executeStage: (stageId: number, inputData: any) => orchestratorFSM.executeStage(stageId, inputData),
    executeStagePass: (stageId: number, passIndex: number, inputData: any) => 
      orchestratorFSM.executeStagePass(stageId, passIndex, inputData),
    getCurrentStage: () => orchestratorFSM.getCurrentStage(),
    getCurrentPass: () => orchestratorFSM.getCurrentPass(),
    getStageResults: () => orchestratorFSM.getStageResults(),
    updateGraphHash: (hash: string) => orchestratorFSM.updateGraphHash(hash),
    resetFSM: () => orchestratorFSM.resetFSM()
  };
};