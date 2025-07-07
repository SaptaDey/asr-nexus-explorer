/**
 * API Service for ASR-GoT Framework
 * Handles Perplexity and Gemini API interactions with security validation
 */

import { validateInput, validateAPIKey, apiRateLimiter } from '@/utils/securityUtils';

export interface APICredentials {
  perplexity: string;
  gemini: string;
}

export const callPerplexityAPI = async (query: string, apiKey: string): Promise<string> => {
  // Validate API key
  if (!apiKey || !validateAPIKey(apiKey, 'perplexity')) {
    throw new Error('Invalid Perplexity API key');
  }

  // Validate and sanitize input
  const sanitizedQuery = validateInput(query, 'query');

  // Rate limiting
  if (!apiRateLimiter.isAllowed('perplexity')) {
    throw new Error('Rate limit exceeded for Perplexity API');
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-reasoning-pro',
        messages: [
          {
            role: 'user',
            content: sanitizedQuery
          }
        ],
        max_tokens: 120000,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content || typeof content !== 'string') {
      throw new Error('Invalid response from Perplexity API');
    }
    
    return content;
  } catch (error) {
    console.error('Perplexity API call failed:', error);
    throw error;
  }
};

export const callGeminiAPI = async (prompt: string, apiKey: string): Promise<string> => {
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
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent', {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
        tools: [
          {
            googleSearchRetrieval: {
              dynamicRetrievalConfig: {
                mode: "MODE_DYNAMIC",
                dynamicThreshold: 0.7
              }
            }
          },
          {
            codeExecution: {}
          }
        ]
      }),
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