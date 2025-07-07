/**
 * API Service for ASR-GoT Framework
 * Handles Perplexity and Gemini API interactions
 */

export interface APICredentials {
  perplexity: string;
  gemini: string;
}

export const callPerplexityAPI = async (query: string, apiKey: string): Promise<string> => {
  if (!apiKey) {
    throw new Error('Perplexity API key not configured');
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
            content: query
          }
        ],
        max_tokens: 128000,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response from Perplexity API';
  } catch (error) {
    console.error('Perplexity API call failed:', error);
    throw error;
  }
};

export const callGeminiAPI = async (prompt: string, apiKey: string): Promise<string> => {
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent', {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 128000,
        },
        tools: [
          {
            codeExecution: {}
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || 'No response from Gemini API';
  } catch (error) {
    console.error('Gemini API call failed:', error);
    throw error;
  }
};