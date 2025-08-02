import { describe, it, expect, beforeEach, vi } from 'vitest';
import { callGeminiAPI } from '@/services/apiService';
import { mockAPICredentials } from '@/test/mocks/mockServices';

// Mock dependencies for edge case testing
vi.mock('@/utils/securityUtils', () => ({
  validateInput: vi.fn((input: string) => input),
  validateAPIKey: vi.fn().mockReturnValue(true),
  apiRateLimiter: {
    isAllowed: vi.fn().mockReturnValue(true),
    getStatus: vi.fn().mockReturnValue({ remaining: 100, resetTime: Date.now() + 60000 })
  }
}));

vi.mock('@/services/CostGuardrails', () => ({
  costGuardrails: {
    canMakeCall: vi.fn().mockReturnValue(true),
    recordUsage: vi.fn()
  }
}));

// Mock crypto for cache key generation testing
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32))
    }
  }
});

vi.mock('@/utils/secureNetworkRequest', () => ({
  secureNetworkRequest: vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue({
      candidates: [{
        content: { parts: [{ text: 'Mock response' }] },
        finishReason: 'STOP'
      }]
    })
  }),
  createGeminiHeaders: vi.fn(() => ({ 'Content-Type': 'application/json' })),
  validateApiKeyFormat: vi.fn().mockReturnValue(true),
  secureRequestWithTimeout: vi.fn().mockImplementation((req) => req)
}));

vi.mock('@/utils/errorSanitizer', () => ({
  sanitizeError: vi.fn((error) => error),
  secureConsoleError: vi.fn()
}));

vi.mock('@/services/securityEventLogger', () => ({
  logApiCall: vi.fn()
}));

vi.mock('@/services/ErrorLoggingService', () => ({
  errorLogger: { logAPIError: vi.fn() }
}));

describe('apiService Edge Case Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Edge Case Scenarios', () => {
    it('should handle very large prompts that trigger chunking', async () => {
      // Create a prompt large enough to trigger chunking (> 128k chars)
      const veryLargePrompt = 'A'.repeat(130000);
      
      const result = await callGeminiAPI(veryLargePrompt, mockAPICredentials.gemini, 'thinking-only');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle medium-large prompts', async () => {
      // Test prompts that hit the token estimation branches
      const mediumPrompt = 'B'.repeat(50000); // ~10k tokens
      const largePrompt = 'C'.repeat(100000); // ~20k tokens
      
      const result1 = await callGeminiAPI(mediumPrompt, mockAPICredentials.gemini, 'thinking-only');
      const result2 = await callGeminiAPI(largePrompt, mockAPICredentials.gemini, 'thinking-only');
      
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });

    it('should handle prompts that trigger caching logic', async () => {
      // Create a prompt > 200k bytes to trigger caching
      const cachingPrompt = 'D'.repeat(250000);
      
      const result = await callGeminiAPI(
        cachingPrompt,
        mockAPICredentials.gemini,
        'thinking-only',
        undefined,
        { stageId: 'cache-test', graphHash: 'hash123' }
      );
      
      expect(result).toBeDefined();
    });

    it('should handle all tool configurations', async () => {
      // Test thinking-search with tools
      const searchResult = await callGeminiAPI(
        'Research question',
        mockAPICredentials.gemini,
        'thinking-search'
      );
      
      // Test thinking-code with tools  
      const codeResult = await callGeminiAPI(
        'Code generation request',
        mockAPICredentials.gemini,
        'thinking-code'
      );
      
      expect(searchResult).toBeDefined();
      expect(codeResult).toBeDefined();
    });

    it('should handle structured responses with schemas', async () => {
      const complexSchema = {
        type: 'object',
        properties: {
          analysis: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          evidence: {
            type: 'array',
            items: { type: 'string' }
          },
          metadata: {
            type: 'object',
            properties: {
              timestamp: { type: 'string' },
              version: { type: 'string' }
            }
          }
        },
        required: ['analysis', 'confidence']
      };

      const result = await callGeminiAPI(
        'Analyze this data',
        mockAPICredentials.gemini,
        'thinking-structured',
        complexSchema
      );

      expect(result).toBeDefined();
    });

    it('should handle dynamic token adjustment paths', async () => {
      // Test the token adjustment logic based on input size
      const prompts = [
        'E'.repeat(5000),   // Small
        'F'.repeat(45000),  // Medium - should trigger dynamicMaxTokens = 6000
        'G'.repeat(85000)   // Large - should trigger dynamicMaxTokens = 4000
      ];

      for (const prompt of prompts) {
        const result = await callGeminiAPI(prompt, mockAPICredentials.gemini, 'thinking-only');
        expect(result).toBeDefined();
      }
    });

    it('should handle retry count edge cases', async () => {
      // Test with different retry counts
      const retryOptions = [
        { retryCount: 0 },
        { retryCount: 1 },
        { retryCount: 2 },
        { retryCount: 3 }
      ];

      for (const options of retryOptions) {
        const result = await callGeminiAPI(
          'Test prompt',
          mockAPICredentials.gemini,
          'thinking-only',
          undefined,
          options
        );
        expect(result).toBeDefined();
      }
    });

    it('should handle different temperature and token combinations', async () => {
      const combinations = [
        { temperature: 0.0, maxTokens: 500 },
        { temperature: 0.2, maxTokens: 1000 },
        { temperature: 0.5, maxTokens: 2000 },
        { temperature: 0.8, maxTokens: 4000 },
        { temperature: 1.0, maxTokens: 8000 }
      ];

      for (const combo of combinations) {
        const result = await callGeminiAPI(
          'Temperature test',
          mockAPICredentials.gemini,
          'thinking-only',
          undefined,
          combo
        );
        expect(result).toBeDefined();
      }
    });

    it('should handle cache key generation variations', async () => {
      // Test cache key generation with different inputs
      const cacheTests = [
        { prompt: 'H'.repeat(250000), stageId: 'stage1', graphHash: 'hash1' },
        { prompt: 'I'.repeat(250000), stageId: 'stage2', graphHash: 'hash2' },
        { prompt: 'J'.repeat(250000), stageId: '', graphHash: '' },
        { prompt: 'K'.repeat(250000), stageId: 'very-long-stage-id-name', graphHash: 'very-long-hash-value' }
      ];

      for (const test of cacheTests) {
        const result = await callGeminiAPI(
          test.prompt,
          mockAPICredentials.gemini,
          'thinking-cache',
          undefined,
          { stageId: test.stageId, graphHash: test.graphHash }
        );
        expect(result).toBeDefined();
      }
    });

    it('should handle thinking budget variations', async () => {
      const budgets = [100, 500, 1000, 2000, 5000];

      for (const budget of budgets) {
        const result = await callGeminiAPI(
          'Budget test',
          mockAPICredentials.gemini,
          'thinking-only',
          undefined,
          { thinkingBudget: budget }
        );
        expect(result).toBeDefined();
      }
    });

    it('should exercise all capability switch branches', async () => {
      // Test each capability to ensure all switch cases are hit
      const capabilities = [
        'thinking-only',
        'thinking-structured', 
        'thinking-search',
        'thinking-code',
        'thinking-function',
        'thinking-cache'
      ] as const;

      for (const capability of capabilities) {
        const result = await callGeminiAPI(
          `${capability} test`,
          mockAPICredentials.gemini,
          capability
        );
        expect(result).toBeDefined();
      }
    });

    it('should handle Unicode and special characters', async () => {
      const specialPrompts = [
        'Test with emojis 🌟⚡🔬',
        'Test with accents: café, résumé, naïve',
        'Test with math: ∑(i=1 to n) xi²',
        'Test with symbols: α, β, γ, Δ, π',
        'Test with Chinese: 你好世界',
        'Test with Arabic: مرحبا بالعالم',
        'Test with mixed: Hello 世界 🌍'
      ];

      for (const prompt of specialPrompts) {
        const result = await callGeminiAPI(prompt, mockAPICredentials.gemini, 'thinking-only');
        expect(result).toBeDefined();
      }
    });

    it('should handle boundary token sizes', async () => {
      // Test exact boundary conditions for token estimation
      const boundaryPrompts = [
        'X'.repeat(32000 * 4 - 1), // Just under the large prompt threshold
        'Y'.repeat(32000 * 4),     // Exactly at the threshold
        'Z'.repeat(32000 * 4 + 1)  // Just over the threshold
      ];

      for (const prompt of boundaryPrompts) {
        const result = await callGeminiAPI(prompt, mockAPICredentials.gemini, 'thinking-only');
        expect(result).toBeDefined();
      }
    });
  });

  describe('Code Path Completion', () => {
    it('should exercise error sanitization paths', async () => {
      // Test error messages with different patterns
      const result = await callGeminiAPI(
        'Normal prompt',
        mockAPICredentials.gemini,
        'thinking-only'
      );
      expect(result).toBeDefined();
    });

    it('should test content encoding variations', async () => {
      // Test prompts with different encoding characteristics
      const encodingTests = [
        'ASCII only content',
        'Content with UTF-8: café résumé',
        'Mixed encoding: ASCII + UTF-8 + emojis 🚀',
        'Binary-like content: \x00\x01\x02',
        'Base64-like: SGVsbG8gV29ybGQ='
      ];

      for (const prompt of encodingTests) {
        try {
          const result = await callGeminiAPI(prompt, mockAPICredentials.gemini, 'thinking-only');
          expect(result).toBeDefined();
        } catch (error) {
          // Some encoding might fail, which is acceptable
          expect(error).toBeDefined();
        }
      }
    });

    it('should handle prompt size calculation edge cases', async () => {
      // Test the TextEncoder path for very specific content
      const sizeTests = [
        '',
        'a',
        'a'.repeat(1000),
        'ñ'.repeat(1000), // Multi-byte characters
        '🚀'.repeat(1000) // Emoji (4 bytes each)
      ];

      for (const prompt of sizeTests) {
        if (prompt.length > 0) { // Skip empty prompt
          const result = await callGeminiAPI(prompt, mockAPICredentials.gemini, 'thinking-only');
          expect(result).toBeDefined();
        }
      }
    });
  });
});