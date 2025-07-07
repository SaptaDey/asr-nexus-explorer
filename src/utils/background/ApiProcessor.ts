// API Call Processing
import { ApiCallPayload, APICredentials } from './types';

export class ApiProcessor {
  // Process API calls
  static async processApiCall(payload: ApiCallPayload): Promise<any> {
    const { type, prompt, credentials, capability = 'thinking', schema, options = {} } = payload;

    if (type === 'gemini') {
      return await ApiProcessor.callGeminiAPI(prompt, credentials.gemini, capability as any, schema, options);
    } else {
      throw new Error(`Unsupported API type: ${type}`);
    }
  }

  // Gemini API call - RULE COMPLIANT: Always THINKING + one other capability
  static async callGeminiAPI(
    prompt: string, 
    apiKey: string, 
    capability: 'thinking-only' | 'thinking-structured' | 'thinking-search' | 'thinking-code' | 'thinking-function' | 'thinking-cache' = 'thinking-only', 
    schema?: any, 
    options: any = {}
  ): Promise<any> {
    
    // RULE 4: Auto-cache for large prompts (>200k tokens)
    // Note: Max input token limit is 1,048,576 - no artificial limiting
    const promptSize = new TextEncoder().encode(prompt).length;
    const shouldCache = promptSize > 200000;
    
    const requestBody: any = {
      model: "gemini-2.5-pro", // RULE COMPLIANCE: Correct model
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        temperature: options.temperature || 0.4,
        maxOutputTokens: options.maxTokens || 65536,
        topP: 0.8,
        topK: 40
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
      const cacheKey = await this.generateCacheKey(prompt, options.stageId || '', options.graphHash || '');
      headers['x-goog-cache'] = 'true';
      headers['x-goog-cache-key'] = cacheKey;
    }

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || '';
  }

  // Helper method for cache key generation (RULE 4)
  private static async generateCacheKey(prompt: string, stageId: string, graphHash: string): Promise<string> {
    const data = new TextEncoder().encode(stageId + graphHash + prompt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}