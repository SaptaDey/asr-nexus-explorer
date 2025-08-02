import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { callPerplexitySonarAPI, callGeminiAPI, GeminiCapability } from '@/services/apiService';

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
    recordUsage: vi.fn(),
    getStatus: vi.fn(() => ({ daily: { used: 0, limit: 1000 } }))
  }
}));

vi.mock('@/utils/secureNetworkRequest', () => ({
  secureNetworkRequest: vi.fn(),
  createGeminiHeaders: vi.fn(() => ({})),
  validateApiKeyFormat: vi.fn(() => true),
  secureRequestWithTimeout: vi.fn()
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

// Mock crypto.subtle for cache key generation
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32))
    }
  }
});

describe('apiService - Enhanced Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('callPerplexitySonarAPI', () => {
    beforeEach(() => {
      // Ensure fresh mocks for each test
      vi.clearAllMocks();
      
      // Set up default mocks that should work for all tests
      const { validateAPIKey } = require('@/utils/securityUtils');
      const { validateApiKeyFormat } = require('@/utils/secureNetworkRequest');
      vi.mocked(validateAPIKey).mockReturnValue(true);
      vi.mocked(validateApiKeyFormat).mockReturnValue(true);
    });
    it('should handle rate limiting properly', async () => {
      const { apiRateLimiter } = await import('@/utils/securityUtils');
      vi.mocked(apiRateLimiter.isAllowed).mockReturnValue(false);
      vi.mocked(apiRateLimiter.getStatus).mockReturnValue({
        remaining: 0,
        resetTime: Date.now() + 30000,
        inBackoff: false,
        burstTokens: 0
      });

      await expect(callPerplexitySonarAPI('test query')).rejects.toThrow('Perplexity API rate limit exceeded');
    });

    it('should handle cost guardrails exceeded', async () => {
      const { costGuardrails } = await import('@/services/CostGuardrails');
      vi.mocked(costGuardrails.canMakeCall).mockReturnValue(false);

      await expect(callPerplexitySonarAPI('test query')).rejects.toThrow('Cost guardrails exceeded for Sonar API');
    });

    it('should call with recency option', async () => {      
      // Mock successful Gemini call
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: [{
            content: { parts: [{ text: 'Test response' }] },
            finishReason: 'STOP'
          }]
        })
      };
      
      const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
      vi.mocked(secureRequestWithTimeout).mockResolvedValue(mockResponse as any);

      const result = await callPerplexitySonarAPI('test query', 'test-key', { 
        recency: true, 
        focus: 'research', 
        userId: 'user123' 
      });
      
      expect(result).toBe('Test response');
    });

    it('should handle undefined options', async () => {      
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: [{
            content: { parts: [{ text: 'Test response' }] },
            finishReason: 'STOP'
          }]
        })
      };
      
      const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
      vi.mocked(secureRequestWithTimeout).mockResolvedValue(mockResponse as any);

      const result = await callPerplexitySonarAPI('test query');
      expect(result).toBe('Test response');
    });
  });

  describe('callGeminiAPI', () => {
    it('should handle invalid API key', async () => {
      const { validateAPIKey } = await import('@/utils/securityUtils');
      vi.mocked(validateAPIKey).mockReturnValue(false);

      await expect(callGeminiAPI('test prompt', 'invalid-key')).rejects.toThrow('Invalid Gemini API key format');
    });

    it('should handle invalid API key format', async () => {
      const { validateApiKeyFormat } = await import('@/utils/secureNetworkRequest');
      vi.mocked(validateApiKeyFormat).mockReturnValue(false);

      await expect(callGeminiAPI('test prompt', 'invalid-format-key')).rejects.toThrow('Invalid Gemini API key format');
    });

    it('should handle rate limiting with backoff', async () => {
      const { apiRateLimiter } = await import('@/utils/securityUtils');
      vi.mocked(apiRateLimiter.isAllowed).mockReturnValue(false);
      vi.mocked(apiRateLimiter.getStatus).mockReturnValue({
        remaining: 0,
        resetTime: Date.now() + 45000,
        inBackoff: true,
        burstTokens: 0
      });

      await expect(callGeminiAPI('test prompt', 'valid-key')).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle empty prompt', async () => {
      await expect(callGeminiAPI('', 'valid-key')).rejects.toThrow('Invalid prompt - must be a non-empty string');
      await expect(callGeminiAPI('   ', 'valid-key')).rejects.toThrow('Invalid prompt - must be a non-empty string');
    });

    it('should handle non-string prompt', async () => {
      await expect(callGeminiAPI(null as any, 'valid-key')).rejects.toThrow('Invalid prompt - must be a non-empty string');
      await expect(callGeminiAPI(undefined as any, 'valid-key')).rejects.toThrow('Invalid prompt - must be a non-empty string');
      await expect(callGeminiAPI(123 as any, 'valid-key')).rejects.toThrow('Invalid prompt - must be a non-empty string');
    });

    it('should handle large prompt chunking', async () => {
      const largePrompt = 'A'.repeat(200000); // Very large prompt
      
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: [{
            content: { parts: [{ text: 'Chunk response' }] },
            finishReason: 'STOP'
          }]
        })
      };
      
      const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
      vi.mocked(secureRequestWithTimeout).mockResolvedValue(mockResponse as any);

      const result = await callGeminiAPI(largePrompt, 'valid-key');
      expect(result).toContain('Chunk response');
    });

    it('should handle different capabilities', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: [{
            content: { parts: [{ text: 'Capability response' }] },
            finishReason: 'STOP'
          }]
        })
      };
      
      const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
      vi.mocked(secureRequestWithTimeout).mockResolvedValue(mockResponse as any);

      // Test different capabilities
      const capabilities: GeminiCapability[] = [
        'thinking-structured',
        'thinking-search', 
        'thinking-code',
        'thinking-function',
        'thinking-cache',
        'thinking-only'
      ];

      for (const capability of capabilities) {
        const result = await callGeminiAPI('test prompt', 'valid-key', capability);
        expect(result).toBe('Capability response');
      }
    });

    it('should handle API response errors', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValue('Bad Request Error')
      };
      
      const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
      vi.mocked(secureRequestWithTimeout).mockResolvedValue(mockResponse as any);

      await expect(callGeminiAPI('test prompt', 'valid-key')).rejects.toThrow('Gemini API error: 400');
    });

    it('should handle missing candidates in response', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: []
        })
      };
      
      const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
      vi.mocked(secureRequestWithTimeout).mockResolvedValue(mockResponse as any);

      await expect(callGeminiAPI('test prompt', 'valid-key')).rejects.toThrow('No candidates in Gemini API response');
    });

    it('should handle MAX_TOKENS finish reason with retry', async () => {
      let callCount = 0;
      const mockResponse = {
        ok: true,
        json: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({
              candidates: [{
                content: { parts: [{ text: 'Partial response' }] },
                finishReason: 'MAX_TOKENS'
              }]
            });
          } else {
            return Promise.resolve({
              candidates: [{
                content: { parts: [{ text: 'Complete response' }] },
                finishReason: 'STOP'
              }]
            });
          }
        })
      };
      
      const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
      vi.mocked(secureRequestWithTimeout).mockResolvedValue(mockResponse as any);

      const result = await callGeminiAPI('test prompt', 'valid-key');
      expect(result).toBe('Complete response');
      expect(callCount).toBe(2);
    });

    it('should handle MAX_TOKENS finish reason after max retries', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: [{
            content: { parts: [{ text: 'Partial response' }] },
            finishReason: 'MAX_TOKENS'
          }]
        })
      };
      
      const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
      vi.mocked(secureRequestWithTimeout).mockResolvedValue(mockResponse as any);

      const result = await callGeminiAPI('test prompt', 'valid-key');
      expect(result).toContain('Partial response');
      expect(result).toContain('[Note: Response was truncated after multiple retry attempts');
    });

    it('should handle invalid candidate structure', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: [{
            content: { parts: [] }
          }]
        })
      };
      
      const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
      vi.mocked(secureRequestWithTimeout).mockResolvedValue(mockResponse as any);

      await expect(callGeminiAPI('test prompt', 'valid-key')).rejects.toThrow('Invalid candidate structure');
    });

    it('should handle missing text content', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: [{
            content: { parts: [{ notText: 'invalid' }] }
          }]
        })
      };
      
      const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
      vi.mocked(secureRequestWithTimeout).mockResolvedValue(mockResponse as any);

      await expect(callGeminiAPI('test prompt', 'valid-key')).rejects.toThrow('No text content in response');
    });

    it('should handle network errors', async () => {
      const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
      vi.mocked(secureRequestWithTimeout).mockRejectedValue(new Error('Network error'));

      await expect(callGeminiAPI('test prompt', 'valid-key')).rejects.toThrow('Network error');
    });

    it('should sanitize error messages containing API keys', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue('Unauthorized: AIzaSyGrYvK7i8k_BUNCz7ZB3hKqKjkjFsdfgsdf Bearer token123')
      };
      
      const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
      vi.mocked(secureRequestWithTimeout).mockResolvedValue(mockResponse as any);

      await expect(callGeminiAPI('test prompt', 'valid-key')).rejects.toThrow('[REDACTED_API_KEY]');
    });

    it('should handle schema parameter', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: [{
            content: { parts: [{ text: 'Schema response' }] },
            finishReason: 'STOP'
          }]
        })
      };
      
      const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
      vi.mocked(secureRequestWithTimeout).mockResolvedValue(mockResponse as any);

      const schema = { type: 'object', properties: { result: { type: 'string' } } };
      const result = await callGeminiAPI('test prompt', 'valid-key', 'thinking-structured', schema);
      expect(result).toBe('Schema response');
    });

    it('should handle custom options', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: [{
            content: { parts: [{ text: 'Options response' }] },
            finishReason: 'STOP'
          }]
        })
      };
      
      const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
      vi.mocked(secureRequestWithTimeout).mockResolvedValue(mockResponse as any);

      const options = {
        thinkingBudget: 5000,
        stageId: 'stage-1',
        graphHash: 'hash123',
        temperature: 0.7,
        maxTokens: 2000
      };

      const result = await callGeminiAPI('test prompt', 'valid-key', 'thinking-only', undefined, options);
      expect(result).toBe('Options response');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle chunk processing errors', async () => {
      const largePrompt = 'A'.repeat(200000);
      
      let callCount = 0;
      const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
      vi.mocked(secureRequestWithTimeout).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('First chunk failed'));
        } else {
          return Promise.resolve({
            ok: true,
            json: vi.fn().mockResolvedValue({
              candidates: [{
                content: { parts: [{ text: 'Second chunk success' }] },
                finishReason: 'STOP'
              }]
            })
          } as any);
        }
      });

      const result = await callGeminiAPI(largePrompt, 'valid-key');
      expect(result).toContain('[Error processing chunk 1');
      expect(result).toContain('Second chunk success');
    });

    it('should generate cache keys correctly', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: [{
            content: { parts: [{ text: 'Cached response' }] },
            finishReason: 'STOP'
          }]
        })
      };
      
      const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
      vi.mocked(secureRequestWithTimeout).mockResolvedValue(mockResponse as any);

      // Mock crypto.subtle.digest to return a predictable hash
      const mockHashBuffer = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer;
      if (global.crypto && global.crypto.subtle) {
        global.crypto.subtle.digest = vi.fn().mockResolvedValue(mockHashBuffer);
      }

      const result = await callGeminiAPI('test prompt', 'valid-key', 'thinking-cache', undefined, {
        stageId: 'cache-test',
        graphHash: 'graph-hash'
      });
      
      expect(result).toBe('Cached response');
      if (global.crypto && global.crypto.subtle) {
        expect(global.crypto.subtle.digest).toHaveBeenCalled();
      }
    });

    it('should handle non-Error exceptions', async () => {
      const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
      vi.mocked(secureRequestWithTimeout).mockRejectedValue('String error');

      await expect(callGeminiAPI('test prompt', 'valid-key')).rejects.toThrow('Unknown API error');
    });

    it('should handle response with null content parts', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: [{
            content: { parts: [null] }
          }]
        })
      };
      
      const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
      vi.mocked(secureRequestWithTimeout).mockResolvedValue(mockResponse as any);

      await expect(callGeminiAPI('test prompt', 'valid-key')).rejects.toThrow('No text content in response');
    });

    it('should handle rate limiting for multiple user IDs', async () => {
      const { apiRateLimiter } = await import('@/utils/securityUtils');
      
      // First call with different user should work
      vi.mocked(apiRateLimiter.isAllowed)
        .mockReturnValueOnce(true)  // perplexity rate limit
        .mockReturnValueOnce(true)  // gemini-api rate limit
        .mockReturnValueOnce(true); // gemini rate limit

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: [{
            content: { parts: [{ text: 'Success' }] },
            finishReason: 'STOP'
          }]
        })
      };
      
      const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
      vi.mocked(secureRequestWithTimeout).mockResolvedValue(mockResponse as any);

      const result = await callPerplexitySonarAPI('test query', 'test-key', { userId: 'user-special' });
      expect(result).toBe('Success');
    });
  });
});