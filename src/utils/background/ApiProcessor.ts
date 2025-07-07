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

  // Gemini API call
  static async callGeminiAPI(prompt: string, apiKey: string, capability: string = 'thinking', schema?: any, options: any = {}): Promise<any> {
    const requestBody: any = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: options.temperature || 0.4,
        maxOutputTokens: options.maxTokens || 120000,
        topP: 0.8,
        topK: 40,
        ...(options.thinkingBudget && { 
          thinkingBudget: options.thinkingBudget 
        })
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
        // Enable thinking mode with budget
        requestBody.systemInstruction.parts[0].text += " Use <thinking> tags to show your reasoning process.";
        if (options.thinkingBudget) {
          requestBody.generationConfig.thinkingBudget = options.thinkingBudget;
        }
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
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || '';
  }
}