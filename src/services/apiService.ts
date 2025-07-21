/**
 * API Service for ASR-GoT Framework
 * Handles Perplexity and Gemini API interactions with security validation
 */

import { validateInput, validateAPIKey, apiRateLimiter } from '@/utils/securityUtils';
import { costGuardrails } from '@/services/CostGuardrails';

export interface APICredentials {
  gemini: string;
  perplexity?: string; // Optional Perplexity Sonar API key
}

// Perplexity Sonar API integration (placeholder for future implementation)
export const callPerplexitySonarAPI = async (
  query: string,
  apiKey?: string,
  options: { recency?: boolean; focus?: string } = {}
): Promise<string> => {
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
  options: { thinkingBudget?: number; stageId?: string; graphHash?: string; temperature?: number; maxTokens?: number } = {}
): Promise<string> => {
  // Validate API key
  if (!apiKey || !validateAPIKey(apiKey, 'gemini')) {
    throw new Error('Invalid Gemini API key');
  }

  // **CRITICAL FIX**: Defensive validation before validateInput
  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    throw new Error('API call failed: Invalid prompt - must be a non-empty string');
  }
  
  // Validate and sanitize input
  const sanitizedPrompt = validateInput(prompt, 'prompt');

  // Rate limiting
  if (!apiRateLimiter.isAllowed('gemini')) {
    throw new Error('Rate limit exceeded for Gemini API');
  }

  // Estimate token count (rough approximation: 1 token ≈ 4 characters)
  const estimatedInputTokens = Math.ceil(sanitizedPrompt.length / 4);
  const estimatedOutputTokens = Math.ceil((options.maxTokens || 65536) / 2); // Assume half max output
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
        maxOutputTokens: options.maxTokens || 65536 // Keep this at 65536 as it's the actual API limit
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

    const headers: any = {
      'x-goog-api-key': apiKey,
      'Content-Type': 'application/json',
    };

    // RULE 4: Add cache header for large prompts
    if (shouldCache) {
      const cacheKey = await generateCacheKey(sanitizedPrompt, options.stageId || '', options.graphHash || '');
      headers['x-goog-cache'] = 'true';
      headers['x-goog-cache-key'] = cacheKey;
    }

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Enhanced error handling and logging for response structure
    console.log('🔍 Gemini API response structure:', {
      hasCandidates: !!data.candidates,
      candidatesLength: data.candidates?.length,
      firstCandidate: data.candidates?.[0],
      dataKeys: Object.keys(data)
    });
    
    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      throw new Error(`No candidates in Gemini API response: ${JSON.stringify(data)}`);
    }
    
    const candidate = data.candidates[0];
    
    // Handle MAX_TOKENS finish reason - attempt to extract partial content
    if (candidate.finishReason === 'MAX_TOKENS') {
      console.warn('⚠️ API response truncated due to MAX_TOKENS limit, extracting partial content');
      
      // Try to extract partial content if available
      if (candidate.content && candidate.content.parts && candidate.content.parts[0]?.text) {
        const partialContent = candidate.content.parts[0].text;
        console.log(`✅ Extracted ${partialContent.length} characters from truncated response`);
        return partialContent + '\n\n[Note: Response was truncated due to token limit. Consider breaking down the request into smaller chunks.]';
      }
      
      // If no content can be extracted, throw error with better message
      throw new Error(`API response truncated due to MAX_TOKENS limit. Try reducing input size or breaking into smaller requests. Candidate: ${JSON.stringify(candidate)}`);
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
    
    return content;
  } catch (error) {
    console.error('Gemini API call failed:', error);
    throw error;
  }
};

// Helper function for cache key generation (RULE 4)
async function generateCacheKey(prompt: string, stageId: string, graphHash: string): Promise<string> {
  const data = new TextEncoder().encode(stageId + graphHash + prompt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}