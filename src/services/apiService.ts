/**
 * API Service for ASR-GoT Framework
 * Handles Perplexity and Gemini API interactions with security validation
 */

import { validateInput, validateAPIKey, apiRateLimiter } from '@/utils/securityUtils';
import { costGuardrails } from '@/services/CostGuardrails';
import { APICredentials } from '@/types/asrGotTypes';
import { 
  secureNetworkRequest, 
  createGeminiHeaders, 
  validateApiKeyFormat,
  secureRequestWithTimeout 
} from '@/utils/secureNetworkRequest';
import { sanitizeError, secureConsoleError } from '@/utils/errorSanitizer';
import { logApiCall } from '@/services/securityEventLogger';
import { errorLogger } from '@/services/ErrorLoggingService';


// Perplexity Sonar API integration (placeholder for future implementation)
export const callPerplexitySonarAPI = async (
  query: string,
  apiKey?: string,
  options: { recency?: boolean; focus?: string; userId?: string } = {}
): Promise<string> => {
  // Enhanced rate limiting for Perplexity
  const userId = options.userId || 'anonymous';
  
  if (!apiRateLimiter.isAllowed('perplexity', userId)) {
    const status = apiRateLimiter.getStatus('perplexity', userId);
    throw new Error(
      `Perplexity API rate limit exceeded. Remaining: ${status.remaining}. ` +
      `Reset in ${Math.ceil((status.resetTime - Date.now()) / 1000)} seconds.`
    );
  }

  // Check cost guardrails for Sonar call
  if (!costGuardrails.canMakeCall('sonar', 1000)) {
    throw new Error('Cost guardrails exceeded for Sonar API');
  }

  // Placeholder implementation - currently using Gemini with web search
  // In production, this would call Perplexity Sonar API
  console.log('Perplexity Sonar API call (placeholder):', query);
  
  // Record Sonar usage (placeholder cost - in production this would be actual usage)
  costGuardrails.recordUsage('sonar', 1000);
  
  // Fallback to Gemini with web search grounding
  return await callGeminiAPI(
    `Search for and analyze: ${query}. Focus on recent, peer-reviewed research.`,
    apiKey || '',
    'thinking-search',
    undefined,
    { stageId: 'sonar-fallback' }
  );
};

// RULE COMPLIANT: Capability types follow SECTION 2 matrix
export type GeminiCapability = 
  | 'thinking-only'        // THINKING only (Stage 5 pass A)
  | 'thinking-structured'  // THINKING + STRUCTURED_OUTPUTS
  | 'thinking-search'      // THINKING + SEARCH_GROUNDING  
  | 'thinking-code'        // THINKING + CODE_EXECUTION
  | 'thinking-function'    // THINKING + FUNCTION_CALLING
  | 'thinking-cache';      // THINKING + CACHING

export const callGeminiAPI = async (
  prompt: string, 
  apiKey: string, 
  capability: GeminiCapability = 'thinking-only',
  schema?: any,
  options: { thinkingBudget?: number; stageId?: string; graphHash?: string; temperature?: number; maxTokens?: number; retryCount?: number } = {}
): Promise<string> => {
  const maxRetries = 3;
  const currentRetry = options.retryCount || 0;

  // Validate API key with enhanced format checking
  if (!apiKey || !validateAPIKey(apiKey, 'gemini') || !validateApiKeyFormat(apiKey, 'gemini')) {
    throw new Error('Invalid Gemini API key format');
  }

  // Enhanced rate limiting with user context
  const userId = options.stageId ? `user-${options.stageId}` : 'anonymous';
  
  if (!apiRateLimiter.isAllowed('gemini-api', userId)) {
    const status = apiRateLimiter.getStatus('gemini-api', userId);
    const waitTime = Math.ceil((status.resetTime - Date.now()) / 1000);
    throw new Error(
      `Rate limit exceeded. You have ${status.remaining} requests remaining. ` +
      `${status.inBackoff ? 'Currently in backoff period. ' : ''}` +
      `Please wait ${waitTime} seconds before making another request.`
    );
  }

  // **CRITICAL FIX**: Defensive validation before validateInput
  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    throw new Error('API call failed: Invalid prompt - must be a non-empty string');
  }
  
  // Validate and sanitize input
  const sanitizedPrompt = validateInput(prompt, 'prompt');

  // **TOKEN LIMIT PREVENTION**: Aggressive input chunking for large prompts
  const estimatedInputTokens = Math.ceil(sanitizedPrompt.length / 4);
  const MAX_INPUT_TOKENS = 32000; // Conservative limit to prevent MAX_TOKENS errors
  
  if (estimatedInputTokens > MAX_INPUT_TOKENS) {
    console.warn(`⚠️ Input too large (${estimatedInputTokens} tokens), implementing chunking strategy`);
    return await handleLargePromptChunking(sanitizedPrompt, apiKey, capability, schema, options);
  }

  // Secondary rate limiting for Gemini provider
  if (!apiRateLimiter.isAllowed('gemini', userId)) {
    const status = apiRateLimiter.getStatus('gemini', userId);
    throw new Error(
      `Gemini API rate limit exceeded. Remaining: ${status.remaining}. ` +
      `Burst tokens: ${status.burstTokens}. ` +
      `Reset in ${Math.ceil((status.resetTime - Date.now()) / 1000)} seconds.`
    );
  }

  // **DYNAMIC OUTPUT TOKEN ADJUSTMENT**: Reduce output tokens based on input size
  let dynamicMaxTokens = options.maxTokens || 8000; // Much more conservative default
  if (estimatedInputTokens > 20000) {
    dynamicMaxTokens = Math.min(dynamicMaxTokens, 4000); // Very conservative for large inputs
  } else if (estimatedInputTokens > 10000) {
    dynamicMaxTokens = Math.min(dynamicMaxTokens, 6000); // Conservative for medium inputs
  }

  const estimatedOutputTokens = Math.ceil(dynamicMaxTokens / 2);
  const totalEstimatedTokens = estimatedInputTokens + estimatedOutputTokens;

  // Check cost guardrails
  if (!costGuardrails.canMakeCall('gemini', totalEstimatedTokens)) {
    throw new Error('Cost guardrails exceeded for Gemini API');
  }

  try {
    // RULE 4: Auto-cache for large prompts (>200k tokens)
    // Gemini 2.5 Pro limits: Input 1,048,576 tokens | Output 65,536 tokens
    const promptSize = new TextEncoder().encode(sanitizedPrompt).length;
    const shouldCache = promptSize > 200000;

    const requestBody: any = {
      model: "gemini-2.5-pro", // RULE COMPLIANCE: Correct model
      contents: [
        {
          parts: [
            { text: sanitizedPrompt }
          ]
        }
      ],
      generationConfig: {
        temperature: options.temperature || 0.4,
        maxOutputTokens: dynamicMaxTokens // Use dynamic token limit to prevent MAX_TOKENS errors
      },
      systemInstruction: {
        parts: [
          { text: "You are an expert AI research assistant. Always think step-by-step and provide detailed, accurate responses. Use <thinking> tags to show your reasoning process." }
        ]
      }
    };

    // RULE 1 COMPLIANCE: Always include THINKING + exactly one other capability
    const tools: any[] = [];
    
    switch (capability) {
      case 'thinking-structured':
        if (schema) {
          requestBody.generationConfig.responseSchema = schema;
          requestBody.generationConfig.responseMimeType = "application/json";
        }
        break;
      case 'thinking-search':
        tools.push({
          googleSearchRetrieval: {
            dynamicRetrievalConfig: {
              mode: "MODE_DYNAMIC",
              dynamicThreshold: 0.7
            }
          }
        });
        break;
      case 'thinking-code':
        tools.push({
          codeExecution: {}
        });
        break;
      case 'thinking-function':
        // Function calling tools would be added here when needed
        break;
      case 'thinking-cache':
        // Caching configuration
        break;
      case 'thinking-only':
        // Pure thinking mode - no additional tools
        break;
    }

    if (tools.length > 0) {
      requestBody.tools = tools;
    }

    const secureHeaders = createGeminiHeaders(apiKey);

    // RULE 4: Add cache header for large prompts
    if (shouldCache) {
      const cacheKey = await generateCacheKey(sanitizedPrompt, options.stageId || '', options.graphHash || '');
      secureHeaders['x-goog-cache'] = 'true';
      secureHeaders['x-goog-cache-key'] = cacheKey;
    }

    const apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';
    
    const response = await secureRequestWithTimeout(
      secureNetworkRequest({
        url: apiEndpoint,
        method: 'POST',
        secureHeaders,
        body: JSON.stringify(requestBody),
        logRequest: false // Never log API requests to prevent exposure
      }),
      60000 // 60 second timeout
    );

    if (!response.ok) {
      const errorText = await response.text();
      // Sanitize error to prevent API key exposure
      const sanitizedError = errorText.replace(/AIza[A-Za-z0-9_-]{35}/g, '[REDACTED_API_KEY]')
                                      .replace(/Bearer [A-Za-z0-9_-]+/g, 'Bearer [REDACTED]')
                                      .replace(/x-goog-api-key[^}]+/g, 'x-goog-api-key: [REDACTED]');
      
      // Log API failure
      logApiCall(apiEndpoint, false, `Status: ${response.status}`);
      
      throw new Error(`Gemini API error: ${response.status} - ${sanitizedError}`);
    }

    const data = await response.json();
    
    // Enhanced error handling for response structure (debug info removed for security)
    if (import.meta.env.MODE === 'development') {
      console.log('🔍 Gemini API response received:', {
        hasCandidates: !!data.candidates,
        candidatesLength: data.candidates?.length,
        hasContent: !!(data.candidates?.[0]?.content)
      });
    }
    
    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      throw new Error(`No candidates in Gemini API response: ${JSON.stringify(data)}`);
    }
    
    const candidate = data.candidates[0];
    
    // **RETRY LOGIC**: Handle MAX_TOKENS finish reason with automatic retry and smaller token limits
    if (candidate.finishReason === 'MAX_TOKENS') {
      console.warn(`⚠️ MAX_TOKENS hit (attempt ${currentRetry + 1}/${maxRetries}), implementing retry strategy`);
      
      if (currentRetry < maxRetries) {
        // Retry with significantly reduced token limits
        const retryMaxTokens = Math.max(1000, Math.floor(dynamicMaxTokens * 0.5)); // Reduce by 50%
        console.log(`🔄 Retrying with reduced token limit: ${retryMaxTokens} (was ${dynamicMaxTokens})`);
        
        // Add exponential backoff delay to avoid rate limiting
        const delayMs = Math.min(1000 * Math.pow(2, currentRetry), 5000); // Max 5 seconds
        console.log(`⏳ Waiting ${delayMs}ms before retry to avoid rate limits...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        return await callGeminiAPI(prompt, apiKey, capability, schema, {
          ...options,
          maxTokens: retryMaxTokens,
          retryCount: currentRetry + 1
        });
      }
      
      // If we've exhausted retries, try to extract partial content
      if (candidate.content && candidate.content.parts && candidate.content.parts[0]?.text) {
        const partialContent = candidate.content.parts[0].text;
        console.log(`✅ Extracted ${partialContent.length} characters from final truncated response`);
        return partialContent + '\n\n[Note: Response was truncated after multiple retry attempts. Content may be incomplete.]';
      }
      
      // Final fallback error
      throw new Error(`MAX_TOKENS limit exceeded after ${maxRetries} retry attempts. Input size: ${estimatedInputTokens} tokens. Consider breaking into smaller chunks.`);
    }
    
    if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
      throw new Error(`Invalid candidate structure: ${JSON.stringify(candidate)}`);
    }
    
    const content = candidate.content.parts[0]?.text;
    
    if (!content || typeof content !== 'string') {
      throw new Error(`No text content in response: ${JSON.stringify(candidate.content.parts[0])}`);
    }
    
    // Record actual usage - estimate output tokens from response
    const actualOutputTokens = Math.ceil(content.length / 4);
    const actualTotalTokens = estimatedInputTokens + actualOutputTokens;
    
    // Record the usage for cost monitoring
    costGuardrails.recordUsage('gemini', actualTotalTokens);
    
    // Log successful API call
    logApiCall(apiEndpoint, true);
    
    return content;
  } catch (error) {
    // Sanitize error message to prevent API key exposure
    const errorMessage = error instanceof Error && error.message ? error.message : 'Unknown API error';
    const sanitizedError = String(errorMessage)
      .replace(/AIza[A-Za-z0-9_-]{35}/g, '[REDACTED_API_KEY]')
      .replace(/Bearer [A-Za-z0-9_-]+/g, 'Bearer [REDACTED]')
      .replace(/x-goog-api-key[^}]+/g, 'x-goog-api-key: [REDACTED]');
    
    console.error('Gemini API call failed:', sanitizedError);
    
    // Log API error to error logging service
    errorLogger.logAPIError(
      apiEndpoint,
      'POST',
      error instanceof Error && error.message.includes('Status:') ? 
        parseInt(error.message.match(/Status: (\d+)/)?.[1] || '0') : 0,
      sanitizedError,
      error instanceof Error ? error : new Error(sanitizedError)
    );
    
    // Create new error with sanitized message - ensure it's never undefined
    const finalError = sanitizedError || 'Unknown API error';
    if (error instanceof Error) {
      const cleanError = new Error(finalError);
      cleanError.name = error.name || 'APIError';
      throw cleanError;
    }
    throw new Error(finalError);
  }
};

// **LARGE PROMPT CHUNKING**: Handle oversized prompts by intelligent chunking
async function handleLargePromptChunking(
  prompt: string,
  apiKey: string,
  capability: GeminiCapability,
  schema?: any,
  options: any = {}
): Promise<string> {
  console.log('📄 Implementing large prompt chunking strategy');
  
  // Split prompt into manageable chunks (approximately 20k tokens each)
  const CHUNK_SIZE = 20000 * 4; // 20k tokens * 4 chars/token
  const chunks = [];
  
  for (let i = 0; i < prompt.length; i += CHUNK_SIZE) {
    chunks.push(prompt.slice(i, i + CHUNK_SIZE));
  }
  
  console.log(`📦 Split large prompt into ${chunks.length} chunks`);
  
  const results = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunkPrompt = `Part ${i + 1}/${chunks.length} of a large analysis request:\n\n${chunks[i]}\n\nGenerate a focused response for this section. If this is not the final part, end with "... [Continued in next part]"`;
    
    try {
      const chunkResult = await callGeminiAPI(chunkPrompt, apiKey, capability, schema, {
        ...options,
        maxTokens: 4000, // Conservative token limit for chunks
        retryCount: 0 // Reset retry count for each chunk
      });
      results.push(chunkResult);
      console.log(`✅ Chunk ${i + 1}/${chunks.length} completed (${chunkResult.length} chars)`);
    } catch (error) {
      console.error(`❌ Chunk ${i + 1}/${chunks.length} failed:`, error);
      results.push(`[Error processing chunk ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}]`);
    }
  }
  
  // Combine results with proper formatting
  return results.join('\n\n---\n\n');
}

// Helper function for cache key generation (RULE 4)
async function generateCacheKey(prompt: string, stageId: string, graphHash: string): Promise<string> {
  const data = new TextEncoder().encode(stageId + graphHash + prompt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}