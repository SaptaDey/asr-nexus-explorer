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
  const userId = options.userId || 'anonymous';

  if (!apiRateLimiter.isAllowed('perplexity', userId)) {
    const status = apiRateLimiter.getStatus('perplexity', userId);
    throw new Error(
      `Perplexity API rate limit exceeded. Remaining: ${status.remaining}. ` +
      `Reset in ${Math.ceil((status.resetTime - Date.now()) / 1000)} seconds.`
    );
  }

  if (!costGuardrails.canMakeCall('sonar', 1000)) {
    throw new Error('Cost guardrails exceeded for Sonar API');
  }

  // Placeholder logic: will call Gemini as fallback.
  costGuardrails.recordUsage('sonar', 1000);

  // Fallback to Gemini
  return await callGeminiAPI(
    `Search for and analyze: ${query}. Focus on recent, peer-reviewed research.`,
    apiKey || '',
    'thinking-search',
    undefined,
    { stageId: 'sonar-fallback' }
  );
};

export type GeminiCapability = 
  | 'thinking-only'
  | 'thinking-structured'
  | 'thinking-search'
  | 'thinking-code'
  | 'thinking-function'
  | 'thinking-cache';

export const callGeminiAPI = async (
  prompt: string, 
  apiKey: string, 
  capability: GeminiCapability = 'thinking-only',
  schema?: any,
  options: { thinkingBudget?: number; stageId?: string; graphHash?: string; temperature?: number; maxTokens?: number; retryCount?: number } = {}
): Promise<string> => {
  const maxRetries = 3;
  const currentRetry = options.retryCount || 0;

  if (!apiKey || !validateAPIKey(apiKey, 'gemini') || !validateApiKeyFormat(apiKey, 'gemini')) {
    throw new Error('Invalid Gemini API key format');
  }

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

  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    throw new Error('API call failed: Invalid prompt - must be a non-empty string');
  }
  const sanitizedPrompt = validateInput(prompt, 'prompt');
  const estimatedInputTokens = Math.ceil(sanitizedPrompt.length / 4);
  const MAX_INPUT_TOKENS = 32000;
  if (estimatedInputTokens > MAX_INPUT_TOKENS) {
    return await handleLargePromptChunking(sanitizedPrompt, apiKey, capability, schema, options);
  }

  if (!apiRateLimiter.isAllowed('gemini', userId)) {
    const status = apiRateLimiter.getStatus('gemini', userId);
    throw new Error(
      `Gemini API rate limit exceeded. Remaining: ${status.remaining}. ` +
      `Burst tokens: ${status.burstTokens}. ` +
      `Reset in ${Math.ceil((status.resetTime - Date.now()) / 1000)} seconds.`
    );
  }

  let dynamicMaxTokens = options.maxTokens || 8000;
  if (estimatedInputTokens > 20000) dynamicMaxTokens = Math.min(dynamicMaxTokens, 4000);
  else if (estimatedInputTokens > 10000) dynamicMaxTokens = Math.min(dynamicMaxTokens, 6000);

  const estimatedOutputTokens = Math.ceil(dynamicMaxTokens / 2);
  const totalEstimatedTokens = estimatedInputTokens + estimatedOutputTokens;

  if (!costGuardrails.canMakeCall('gemini', totalEstimatedTokens)) {
    throw new Error('Cost guardrails exceeded for Gemini API');
  }

  let apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';
  let secureHeaders = createGeminiHeaders(apiKey);

  try {
    const promptSize = new TextEncoder().encode(sanitizedPrompt).length;
    const shouldCache = promptSize > 200000;

    const requestBody: any = {
      model: "gemini-2.5-pro",
      contents: [{ parts: [{ text: sanitizedPrompt }] }],
      generationConfig: {
        temperature: options.temperature || 0.4,
        maxOutputTokens: dynamicMaxTokens
      },
      systemInstruction: {
        parts: [
          { text: "You are an expert AI research assistant. Always think step-by-step and provide detailed, accurate responses. Use <thinking> tags to show your reasoning process." }
        ]
      }
    };

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
        tools.push({ codeExecution: {} });
        break;
      case 'thinking-function':
        break;
      case 'thinking-cache':
        break;
      case 'thinking-only':
      default:
        break;
    }

    if (tools.length > 0) requestBody.tools = tools;

    if (shouldCache) {
      const cacheKey = await generateCacheKey(sanitizedPrompt, options.stageId || '', options.graphHash || '');
      secureHeaders['x-goog-cache'] = 'true';
      secureHeaders['x-goog-cache-key'] = cacheKey;
    }

    const response = await secureRequestWithTimeout(
      secureNetworkRequest({
        url: apiEndpoint,
        method: 'POST',
        secureHeaders,
        body: JSON.stringify(requestBody),
        logRequest: false
      }),
      60000
    );

    if (!response.ok) {
      const errorText = await response.text();
      const sanitizedError = errorText
        .replace(/AIza[A-Za-z0-9_-]{35}/g, '[REDACTED_API_KEY]')
        .replace(/Bearer [A-Za-z0-9_-]+/g, 'Bearer [REDACTED]')
        .replace(/x-goog-api-key[^}]+/g, 'x-goog-api-key: [REDACTED]');
      logApiCall(apiEndpoint, false, `Status: ${response.status}`);
      throw new Error(`Gemini API error: ${response.status} - ${sanitizedError}`);
    }

    const data = await response.json();

    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      throw new Error(`No candidates in Gemini API response: ${JSON.stringify(data)}`);
    }
    const candidate = data.candidates[0];

    if (candidate.finishReason === 'MAX_TOKENS') {
      if (currentRetry < maxRetries) {
        const retryMaxTokens = Math.max(1000, Math.floor(dynamicMaxTokens * 0.5));
        const delayMs = Math.min(1000 * Math.pow(2, currentRetry), 5000);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return await callGeminiAPI(prompt, apiKey, capability, schema, {
          ...options,
          maxTokens: retryMaxTokens,
          retryCount: currentRetry + 1
        });
      }
      if (candidate.content && candidate.content.parts && candidate.content.parts[0]?.text) {
        const partialContent = candidate.content.parts[0].text;
        return partialContent + '\n\n[Note: Response was truncated after multiple retry attempts. Content may be incomplete.]';
      }
      throw new Error(`MAX_TOKENS limit exceeded after ${maxRetries} retry attempts. Input size: ${estimatedInputTokens} tokens. Consider breaking into smaller chunks.`);
    }

    if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
      throw new Error(`Invalid candidate structure: ${JSON.stringify(candidate)}`);
    }
    const content = candidate.content.parts[0]?.text;

    if (!content || typeof content !== 'string') {
      throw new Error(`No text content in response: ${JSON.stringify(candidate.content.parts[0])}`);
    }

    const actualOutputTokens = Math.ceil(content.length / 4);
    const actualTotalTokens = estimatedInputTokens + actualOutputTokens;
    costGuardrails.recordUsage('gemini', actualTotalTokens);
    logApiCall(apiEndpoint, true);

    return content;
  } catch (err) {
    const errorMessage =
      err instanceof Error && err.message ? err.message : 'Unknown API error';
    const sanitizedError = String(errorMessage)
      .replace(/AIza[A-Za-z0-9_-]{35}/g, '[REDACTED_API_KEY]')
      .replace(/Bearer [A-Za-z0-9_-]+/g, 'Bearer [REDACTED]')
      .replace(/x-goog-api-key[^}]+/g, 'x-goog-api-key: [REDACTED]');
    errorLogger.logAPIError(
      apiEndpoint,
      'POST',
      errorMessage.includes('Status:') ? parseInt(errorMessage.match(/Status: (\d+)/)?.[1] || '0') : 0,
      sanitizedError,
      err instanceof Error ? err : new Error(sanitizedError)
    );
    throw new Error(sanitizedError || 'Unknown API error');
  }
};

async function handleLargePromptChunking(
  prompt: string,
  apiKey: string,
  capability: GeminiCapability,
  schema?: any,
  options: any = {}
): Promise<string> {
  const CHUNK_SIZE = 20000 * 4;
  const chunks = [];
  for (let i = 0; i < prompt.length; i += CHUNK_SIZE) {
    chunks.push(prompt.slice(i, i + CHUNK_SIZE));
  }
  const results = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunkPrompt = `Part ${i + 1}/${chunks.length} of a large analysis request:\n\n${chunks[i]}\n\nGenerate a focused response for this section. If this is not the final part, end with "... [Continued]"`;
    try {
      const chunkResult = await callGeminiAPI(chunkPrompt, apiKey, capability, schema, {
        ...options,
        maxTokens: 4000,
        retryCount: 0
      });
      results.push(chunkResult);
    } catch (error) {
      results.push(`[Error processing chunk ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}]`);
    }
  }
  return results.join('\n\n---\n\n');
}

async function generateCacheKey(prompt: string, stageId: string, graphHash: string): Promise<string> {
  const data = new TextEncoder().encode(stageId + graphHash + prompt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
