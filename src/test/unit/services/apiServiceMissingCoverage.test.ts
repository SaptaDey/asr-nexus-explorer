import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { callGeminiAPI, callPerplexitySonarAPI, GeminiCapability } from '@/services/apiService';

// Mock all dependencies
vi.mock('@/utils/securityUtils', () => ({
  validateInput: vi.fn((input) => input),
  validateAPIKey: vi.fn(() => true),
  apiRateLimiter: {
    isAllowed: vi.fn(() => true),
    getStatus: vi.fn(() => ({ remaining: 100, resetTime: Date.now() + 60000, inBackoff: false, burstTokens: 50 }))
  }
}));

vi.mock('@/services/CostGuardrails', () => ({
  costGuardrails: {
    canMakeCall: vi.fn(() => true),
    recordUsage: vi.fn()
  }
}));

vi.mock('@/utils/secureNetworkRequest', () => ({
  secureNetworkRequest: vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({
      candidates: [{
        content: { parts: [{ text: 'Mocked response' }] },
        finishReason: 'STOP'
      }]
    })
  }),
  createGeminiHeaders: vi.fn(() => ({ 'Content-Type': 'application/json' })),
  validateApiKeyFormat: vi.fn(() => true),
  secureRequestWithTimeout: vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({
      candidates: [{
        content: { parts: [{ text: 'Mocked response' }] },
        finishReason: 'STOP'
      }]
    })
  })
}));

vi.mock('@/utils/errorSanitizer', () => ({
  sanitizeError: vi.fn((error) => error),
  secureConsoleError: vi.fn()
}));

vi.mock('@/services/securityEventLogger', () => ({
  logApiCall: vi.fn()
}));

vi.mock('@/services/ErrorLoggingService', () => ({
  errorLogger: {
    logAPIError: vi.fn()
  }
}));

describe('apiService - Missing Function Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('callPerplexitySonarAPI function coverage', () => {
    it('should handle callPerplexitySonarAPI with different options', async () => {
      const result = await callPerplexitySonarAPI('test query', 'api-key', {
        recency: true,
        focus: 'research',
        userId: 'test-user'
      });
      
      expect(result).toBeDefined();
    });

    it('should handle callPerplexitySonarAPI without options', async () => {
      const result = await callPerplexitySonarAPI('test query', 'valid-api-key');
      
      expect(result).toBeDefined();
    });
  });

  describe('handleLargePromptChunking function coverage', () => {
    it('should call handleLargePromptChunking for very large prompts', async () => {
      const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
      
      // Create a prompt that exceeds MAX_INPUT_TOKENS (32000 * 4 = 128000 characters)
      const largePrompt = 'A'.repeat(130000);
      
      // Mock successful response for each chunk
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: [{
            content: { parts: [{ text: 'Chunk response content' }] },
            finishReason: 'STOP'
          }]
        })
      };
      
      vi.mocked(secureRequestWithTimeout).mockResolvedValue(mockResponse);
      
      const result = await callGeminiAPI(largePrompt, 'test-api-key');
      
      expect(result).toContain('Chunk response content');
      expect(secureRequestWithTimeout).toHaveBeenCalled();
    });

    it('should handle errors in chunk processing', async () => {
      const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
      
      // Create a prompt that exceeds MAX_INPUT_TOKENS
      const largePrompt = 'B'.repeat(130000);
      
      // Mock first chunk success, second chunk failure
      let callCount = 0;
      vi.mocked(secureRequestWithTimeout).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: vi.fn().mockResolvedValue({
              candidates: [{
                content: { parts: [{ text: 'First chunk success' }] },
                finishReason: 'STOP'
              }]
            })
          });
        } else {
          return Promise.reject(new Error('Network error'));
        }
      });
      
      const result = await callGeminiAPI(largePrompt, 'test-api-key');
      
      expect(result).toContain('First chunk success');
      expect(result).toContain('[Error processing chunk');
    });
  });

  describe('Edge cases for better branch coverage', () => {
    it('should handle very large prompts with dynamic token adjustment', async () => {
      const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
      
      // Create a prompt that triggers different token limits
      const mediumPrompt = 'C'.repeat(50000); // Between 10000 and 20000 tokens (50000/4 = 12500 tokens)
      
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: [{
            content: { parts: [{ text: 'Medium prompt response' }] },
            finishReason: 'STOP'
          }]
        })
      };
      
      vi.mocked(secureRequestWithTimeout).mockResolvedValue(mockResponse);
      
      const result = await callGeminiAPI(mediumPrompt, 'test-api-key');
      
      expect(result).toBe('Medium prompt response');
    });

    it('should handle very large prompts that trigger smallest token limit', async () => {
      const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
      
      // Create a prompt that triggers the smallest token limit (> 20000 tokens)
      const veryLargePrompt = 'D'.repeat(90000); // 90000/4 = 22500 tokens > 20000
      
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: [{
            content: { parts: [{ text: 'Very large prompt response' }] },
            finishReason: 'STOP'
          }]
        })
      };
      
      vi.mocked(secureRequestWithTimeout).mockResolvedValue(mockResponse);
      
      const result = await callGeminiAPI(veryLargePrompt, 'test-api-key');
      
      expect(result).toBe('Very large prompt response');
    });

    it('should handle different GeminiCapability types for tool selection', async () => {
      const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
      
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: [{
            content: { parts: [{ text: 'Capability response' }] },
            finishReason: 'STOP'
          }]
        })
      };
      
      vi.mocked(secureRequestWithTimeout).mockResolvedValue(mockResponse);
      
      // Test different capabilities
      const capabilities: GeminiCapability[] = ['thinking-search', 'thinking-code', 'thinking-function', 'thinking-cache'];
      
      for (const capability of capabilities) {
        const result = await callGeminiAPI('Test prompt', 'test-api-key', capability);
        expect(result).toBe('Capability response');
      }
    });

    it('should handle structured capability with schema', async () => {
      const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
      
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: [{
            content: { parts: [{ text: '{"result": "structured"}' }] },
            finishReason: 'STOP'
          }]
        })
      };
      
      vi.mocked(secureRequestWithTimeout).mockResolvedValue(mockResponse);
      
      const schema = { type: 'object', properties: { result: { type: 'string' } } };
      const result = await callGeminiAPI('Test prompt', 'test-api-key', 'thinking-structured', schema);
      
      expect(result).toBe('{"result": "structured"}');
    });
  });
});