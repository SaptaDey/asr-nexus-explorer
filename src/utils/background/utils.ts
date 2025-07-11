// Background Processing Utility Functions with Single-Tool Rule Support
import { backgroundProcessor } from './index';
import { APICredentials } from './types';

// Single-tool rule enforcement types
type GeminiTool = 'THINKING' | 'STRUCTURED_OUTPUTS' | 'SEARCH_GROUNDING' | 'FUNCTION_CALLING' | 'CODE_EXECUTION' | 'CACHING';

interface SingleToolRequest {
  tools: GeminiTool[];
  cacheKey?: string;
  structuredOutput?: boolean;
  searchGrounding?: boolean;
  functionCalling?: boolean;
  codeExecution?: boolean;
  thinkingOnly?: boolean;
  availableFunctions?: string[];
}

interface EnhancedAPICredentials extends APICredentials {
  perplexityApiKey?: string;
}

/**
 * Queue Gemini API call with single-tool rule enforcement
 * Enforces THINKING + exactly one other capability
 */
export const queueGeminiCall = (
  prompt: string, 
  credentials: APICredentials, 
  priority: 'high' | 'medium' | 'low' = 'medium',
  toolConfig?: SingleToolRequest
): string => {
  // Default to THINKING + STRUCTURED_OUTPUTS if no tool config provided
  const defaultToolConfig: SingleToolRequest = {
    tools: ['THINKING', 'STRUCTURED_OUTPUTS'],
    structuredOutput: true
  };
  
  const finalToolConfig = toolConfig || defaultToolConfig;
  
  // Validate single-tool rule
  validateSingleToolRule(finalToolConfig.tools);
  
  // Determine caching based on prompt size
  const estimatedTokens = Math.ceil(prompt.length / 4);
  const shouldCache = estimatedTokens > 50000; // 200k chars ≈ 50k tokens
  
  if (shouldCache && !finalToolConfig.cacheKey) {
    finalToolConfig.cacheKey = generateCacheKey(prompt);
  }
  
  return backgroundProcessor.addTask({
    type: 'api_call',
    priority,
    payload: {
      type: 'gemini',
      prompt,
      credentials,
      toolConfig: finalToolConfig,
      estimatedTokens
    }
  }, finalToolConfig);
};

/**
 * Queue Perplexity API call with single-tool rule enforcement
 * Always uses THINKING + SEARCH_GROUNDING
 */
export const queuePerplexityCall = (
  prompt: string, 
  credentials: EnhancedAPICredentials, 
  priority: 'high' | 'medium' | 'low' = 'medium',
  toolConfig?: SingleToolRequest
): string => {
  if (!credentials.perplexityApiKey) {
    throw new Error('Perplexity API key required for search grounding');
  }
  
  // Default to THINKING + SEARCH_GROUNDING for Perplexity
  const defaultToolConfig: SingleToolRequest = {
    tools: ['THINKING', 'SEARCH_GROUNDING'],
    searchGrounding: true
  };
  
  const finalToolConfig = toolConfig || defaultToolConfig;
  
  // Validate single-tool rule
  validateSingleToolRule(finalToolConfig.tools);
  
  return backgroundProcessor.addTask({
    type: 'api_call',
    priority,
    payload: {
      type: 'perplexity',
      prompt,
      credentials,
      toolConfig: finalToolConfig
    }
  }, finalToolConfig);
};

/**
 * Queue graph processing with enhanced operations
 */
export const queueGraphProcessing = (graphData: any, operation: string, priority: 'high' | 'medium' | 'low' = 'low'): string => {
  return backgroundProcessor.addTask({
    type: 'graph_processing',
    priority,
    payload: {
      graphData,
      operation,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Get task result with enhanced error handling and caching info
 */
export const getTaskResult = async (taskId: string, timeoutMs: number = 30000): Promise<any> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const taskInfo = backgroundProcessor.getTaskWithTools(taskId);
    const task = taskInfo.task;
    
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    if (task.status === 'completed') {
      // Log cache hit/miss for monitoring
      if (task.cacheHit) {
        console.log(`🎯 Cache hit for task ${taskId}`);
      }
      
      return task.result;
    }
    
    if (task.status === 'failed') {
      const error = task.error || 'Task failed';
      console.error(`❌ Task ${taskId} failed: ${error}`);
      
      // Include tool configuration in error for debugging
      if (taskInfo.toolConfig) {
        console.error(`🔧 Tool config: ${JSON.stringify(taskInfo.toolConfig)}`);
      }
      
      throw new Error(error);
    }
    
    // Log progress for long-running tasks
    if (Date.now() - startTime > 10000) { // After 10 seconds
      console.log(`⏳ Task ${taskId} still ${task.status}... (${Math.round((Date.now() - startTime) / 1000)}s)`);
    }
    
    // Wait 500ms before checking again
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  throw new Error(`Task ${taskId} timeout after ${timeoutMs}ms`);
};

/**
 * Specialized function for Stage 4 evidence integration cycles
 */
export const queueEvidenceIntegrationCycle = async (
  hypothesis: string,
  credentials: EnhancedAPICredentials,
  priority: 'high' | 'medium' | 'low' = 'high'
): Promise<any> => {
  console.log('🔄 Starting Stage 4 Evidence Integration Cycle');
  
  // Step 1: Search Grounding
  const searchTaskId = queuePerplexityCall(
    `Find evidence for hypothesis: ${hypothesis}`,
    credentials,
    priority,
    { tools: ['THINKING', 'SEARCH_GROUNDING'], searchGrounding: true }
  );
  
  const searchResults = await getTaskResult(searchTaskId);
  
  // Step 2: Code Execution (if data analysis needed)
  const codeTaskId = queueGeminiCall(
    `Analyze evidence data: ${JSON.stringify(searchResults)}`,
    credentials,
    priority,
    { tools: ['THINKING', 'CODE_EXECUTION'], codeExecution: true }
  );
  
  const analysisResults = await getTaskResult(codeTaskId);
  
  // Step 3: Structured Output
  const structuredTaskId = queueGeminiCall(
    `Create structured evidence nodes: ${JSON.stringify(analysisResults)}`,
    credentials,
    priority,
    { tools: ['THINKING', 'STRUCTURED_OUTPUTS'], structuredOutput: true }
  );
  
  const structuredResults = await getTaskResult(structuredTaskId);
  
  console.log('✅ Stage 4 Evidence Integration Cycle complete');
  return structuredResults;
};

/**
 * Specialized function for Stage 5 dual-pass (Thinking → Structured)
 */
export const queuePruningMergingCycle = async (
  graphData: any,
  credentials: APICredentials,
  priority: 'high' | 'medium' | 'low' = 'high'
): Promise<any> => {
  console.log('🔄 Starting Stage 5 Pruning & Merging Cycle');
  
  // Pass A: Thinking only
  const thinkingTaskId = queueGeminiCall(
    `Analyze graph for pruning and merging: ${JSON.stringify(graphData)}`,
    credentials,
    priority,
    { tools: ['THINKING'], thinkingOnly: true }
  );
  
  const thinkingResults = await getTaskResult(thinkingTaskId);
  
  // Pass B: Structured Output
  const structuredTaskId = queueGeminiCall(
    `Create structured prune/merge commands: ${JSON.stringify(thinkingResults)}`,
    credentials,
    priority,
    { tools: ['THINKING', 'STRUCTURED_OUTPUTS'], structuredOutput: true }
  );
  
  const structuredResults = await getTaskResult(structuredTaskId);
  
  console.log('✅ Stage 5 Pruning & Merging Cycle complete');
  return structuredResults;
};

/**
 * Queue Stage 6 subgraph extraction with code execution
 */
export const queueSubgraphExtraction = async (
  graphData: any,
  credentials: APICredentials,
  priority: 'high' | 'medium' | 'low' = 'high'
): Promise<any> => {
  console.log('🔄 Starting Stage 6 Subgraph Extraction');
  
  // Code execution for analysis
  const codeTaskId = queueGeminiCall(
    `Compute centrality, MI and impact metrics for graph: ${JSON.stringify(graphData)}`,
    credentials,
    priority,
    { tools: ['THINKING', 'CODE_EXECUTION'], codeExecution: true }
  );
  
  const analysisResults = await getTaskResult(codeTaskId);
  
  // Structured output for results
  const structuredTaskId = queueGeminiCall(
    `Create structured subgraph set: ${JSON.stringify(analysisResults)}`,
    credentials,
    priority,
    { tools: ['THINKING', 'STRUCTURED_OUTPUTS'], structuredOutput: true }
  );
  
  const structuredResults = await getTaskResult(structuredTaskId);
  
  console.log('✅ Stage 6 Subgraph Extraction complete');
  return structuredResults;
};

/**
 * Queue Stage 8 audit with Thinking + Code Execution
 */
export const queueAuditCycle = async (
  completeGraph: any,
  reportChunks: any,
  credentials: APICredentials,
  priority: 'high' | 'medium' | 'low' = 'high'
): Promise<any> => {
  console.log('🔄 Starting Stage 8 Audit Cycle');
  
  // Code execution for automated audit
  const auditTaskId = queueGeminiCall(
    `Run automated audit on complete graph: ${JSON.stringify(completeGraph)}`,
    credentials,
    priority,
    { tools: ['THINKING', 'CODE_EXECUTION'], codeExecution: true }
  );
  
  const auditResults = await getTaskResult(auditTaskId);
  
  // Structured output for audit report
  const structuredTaskId = queueGeminiCall(
    `Create structured audit report: ${JSON.stringify(auditResults)}`,
    credentials,
    priority,
    { tools: ['THINKING', 'STRUCTURED_OUTPUTS'], structuredOutput: true }
  );
  
  const structuredResults = await getTaskResult(structuredTaskId);
  
  console.log('✅ Stage 8 Audit Cycle complete');
  return structuredResults;
};

/**
 * Validate single-tool rule: THINKING + exactly one other capability
 */
function validateSingleToolRule(tools: GeminiTool[]): void {
  if (!tools.includes('THINKING')) {
    throw new Error('Single-tool rule violation: THINKING must always be included');
  }
  
  const nonThinkingTools = tools.filter(tool => tool !== 'THINKING');
  if (nonThinkingTools.length > 1) {
    throw new Error(`Single-tool rule violation: Found ${nonThinkingTools.length} non-THINKING tools, maximum is 1. Tools: ${nonThinkingTools.join(', ')}`);
  }
  
  console.log(`✅ Single-tool rule validated: THINKING + ${nonThinkingTools[0] || 'NONE'}`);
}

/**
 * Generate cache key for large prompts
 */
function generateCacheKey(prompt: string): string {
  // Simple hash for cache key generation
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `cache_${Math.abs(hash).toString(36)}`;
}

// Export types for external use
export type { SingleToolRequest, EnhancedAPICredentials, GeminiTool };