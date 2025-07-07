/**
 * API Service for ASR-GoT Framework
 * Handles Perplexity and Gemini API interactions with security validation
 */

import { validateInput, validateAPIKey, apiRateLimiter } from '@/utils/securityUtils';

export interface APICredentials {
  gemini: string;
}

// Perplexity API removed - using only Gemini with web search

export type GeminiCapability = 'search' | 'structured' | 'code' | 'function' | 'thinking' | 'cache';

export const callGeminiAPI = async (
  prompt: string, 
  apiKey: string, 
  capability: GeminiCapability = 'thinking',
  schema?: any
): Promise<string> => {
  // Validate API key
  if (!apiKey || !validateAPIKey(apiKey, 'gemini')) {
    throw new Error('Invalid Gemini API key');
  }

  // Validate and sanitize input
  const sanitizedPrompt = validateInput(prompt, 'prompt');

  // Rate limiting
  if (!apiRateLimiter.isAllowed('gemini')) {
    throw new Error('Rate limit exceeded for Gemini API');
  }

  try {
    const requestBody: any = {
      contents: [
        {
          parts: [
            { text: sanitizedPrompt }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 120000,
      },
      systemInstruction: {
        parts: [
          { text: "You are an expert AI research assistant. Always think step-by-step and provide detailed, accurate responses." }
        ]
      }
    };

    // Configure based on capability - only one at a time
    switch (capability) {
      case 'search':
        requestBody.tools = [
          {
            googleSearchRetrieval: {
              dynamicRetrievalConfig: {
                mode: "MODE_DYNAMIC",
                dynamicThreshold: 0.7
              }
            }
          }
        ];
        break;
      case 'structured':
        if (schema) {
          requestBody.generationConfig.responseSchema = schema;
          requestBody.generationConfig.responseMimeType = "application/json";
        }
        break;
      case 'code':
        requestBody.tools = [
          {
            codeExecution: {}
          }
        ];
        break;
      case 'function':
        // Function calling tools would be added here when needed
        break;
      case 'thinking':
        // Enable thinking mode
        requestBody.systemInstruction.parts[0].text += " Use <thinking> tags to show your reasoning process.";
        break;
      case 'cache':
        // Caching would be configured here when needed
        break;
    }

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent', {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.candidates[0]?.content?.parts[0]?.text;
    
    if (!content || typeof content !== 'string') {
      throw new Error('Invalid response from Gemini API');
    }
    
    return content;
  } catch (error) {
    console.error('Gemini API call failed:', error);
    throw error;
  }
};