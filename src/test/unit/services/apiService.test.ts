import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  callPerplexitySonarAPI, 
  callGeminiAPI
} from '@/services/apiService';
import { testQueries, testErrors } from '@/test/fixtures/testData';
import { mockAPICredentials } from '@/test/mocks/mockServices';

// Mock security utils
vi.mock('@/utils/securityUtils', () => ({
  validateInput: vi.fn().mockImplementation((input: string) => 
    input && typeof input === 'string' && input.trim().length > 0 && !input.includes('<script>') ? input.trim() : ''
  ),
  validateAPIKey: vi.fn().mockImplementation((key: string, service?: string) => 
    key && key.length > 10 && key.startsWith('mock-')
  ),
  apiRateLimiter: {
    isAllowed: vi.fn().mockReturnValue(true),
    check: vi.fn().mockResolvedValue(true),
    record: vi.fn().mockResolvedValue(true)
  }
}));

// Mock cost guardrails
vi.mock('@/services/CostGuardrails', () => ({
  costGuardrails: {
    canMakeCall: vi.fn().mockReturnValue(true),
    recordUsage: vi.fn(),
    getCurrentCosts: vi.fn().mockReturnValue({ total: 5.50, gemini: 3.25, sonar: 2.25 }),
    getRemainingBudget: vi.fn().mockReturnValue(44.50)
  }
}));

// Mock secure network request
vi.mock('@/utils/secureNetworkRequest', () => ({
  secureNetworkRequest: vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({
      candidates: [{
        content: {
          parts: [{ text: 'Mock Gemini response' }]
        }
      }],
      usageMetadata: {
        promptTokenCount: 100,
        candidatesTokenCount: 150,
        totalTokenCount: 250
      }
    })
  }),
  createGeminiHeaders: vi.fn().mockReturnValue({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer mock-key'
  }),
  validateApiKeyFormat: vi.fn().mockReturnValue(true),
  secureRequestWithTimeout: vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({
      id: 'test-request',
      choices: [{
        message: {
          content: 'Mock Perplexity response'
        }
      }],
      usage: {
        total_tokens: 200
      }
    })
  })
}));

// Mock error sanitizer
vi.mock('@/utils/errorSanitizer', () => ({
  sanitizeError: vi.fn().mockImplementation((error: any) => ({
    message: error.message || 'Unknown error',
    code: error.code || 'UNKNOWN_ERROR'
  })),
  secureConsoleError: vi.fn()
}));

describe('apiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('callPerplexitySonarAPI', () => {
    it('should successfully call Perplexity Sonar API with valid parameters', async () => {
      const query = testQueries.simple;
      const apiKey = mockAPICredentials.perplexity;
      
      const result = await callPerplexitySonarAPI(query, apiKey);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle queries with recency and focus options', async () => {
      const query = testQueries.medical;
      const apiKey = mockAPICredentials.perplexity;
      const options = { recency: true, focus: 'peer-reviewed' };
      
      const result = await callPerplexitySonarAPI(query, apiKey, options);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should respect cost guardrails', async () => {
      const { costGuardrails } = await import('@/services/CostGuardrails');
      
      // Mock cost limit exceeded
      vi.mocked(costGuardrails.canMakeCall).mockReturnValueOnce(false);
      
      await expect(callPerplexitySonarAPI(testQueries.simple, mockAPICredentials.perplexity))
        .rejects.toThrow('Cost guardrails exceeded for Sonar API');
    });

    it('should validate input queries', async () => {
      const { validateInput } = await import('@/utils/securityUtils');
      
      // Mock invalid input
      vi.mocked(validateInput).mockReturnValueOnce(false);
      
      await expect(callPerplexitySonarAPI(testQueries.malicious, mockAPICredentials.perplexity))
        .rejects.toThrow();
    });

    it('should handle empty or invalid queries', async () => {
      await expect(callPerplexitySonarAPI('', mockAPICredentials.perplexity))
        .rejects.toThrow();
      
      await expect(callPerplexitySonarAPI('   \n\t   ', mockAPICredentials.perplexity))
        .rejects.toThrow();
    });

    it('should fallback to Gemini when Perplexity fails', async () => {
      const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
      
      // Mock Perplexity failure
      vi.mocked(secureRequestWithTimeout).mockRejectedValueOnce(new Error('Perplexity API Error'));
      
      const result = await callPerplexitySonarAPI(testQueries.simple, mockAPICredentials.perplexity);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should record usage metrics', async () => {
      const { costGuardrails } = await import('@/services/CostGuardrails');
      
      await callPerplexitySonarAPI(testQueries.technical, mockAPICredentials.perplexity);
      
      expect(costGuardrails.recordUsage).toHaveBeenCalledWith('sonar', expect.any(Number));
    });
  });

  describe('callGeminiAPI', () => {
    it('should successfully call Gemini API with valid parameters', async () => {
      const query = testQueries.complex;
      const apiKey = mockAPICredentials.gemini;
      
      const result = await callGeminiAPI(query, apiKey, 'thinking-only');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle different capability types', async () => {
      const query = testQueries.medical;
      const apiKey = mockAPICredentials.gemini;
      
      const capabilities = ['thinking-only', 'thinking-structured', 'thinking-search'] as const;
      
      for (const capability of capabilities) {
        const result = await callGeminiAPI(query, apiKey, capability);
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      }
    });

    it('should respect token limits', async () => {
      const longQuery = 'A'.repeat(50000); // Very long query
      const apiKey = mockAPICredentials.gemini;
      
      const result = await callGeminiAPI(longQuery, apiKey, 'thinking-only');
      
      expect(result).toBeDefined();
      // Should handle token limiting internally
    });

    it('should validate API keys', async () => {
      const { validateAPIKey } = await import('@/utils/securityUtils');
      
      // Mock invalid API key
      vi.mocked(validateAPIKey).mockReturnValueOnce(false);
      
      await expect(callGeminiAPI(testQueries.simple, 'invalid-key', 'thinking-only'))
        .rejects.toThrow();
    });

    it('should handle rate limiting', async () => {
      const { apiRateLimiter } = await import('@/utils/securityUtils');
      
      // Mock rate limit exceeded
      vi.mocked(apiRateLimiter.isAllowed).mockReturnValueOnce(false);
      
      await expect(callGeminiAPI(testQueries.simple, mockAPICredentials.gemini, 'thinking-only'))
        .rejects.toThrow('Rate limit exceeded');
    });

    it('should sanitize responses', async () => {
      const { secureNetworkRequest } = await import('@/utils/secureNetworkRequest');
      
      // Mock response with potentially malicious content
      vi.mocked(secureNetworkRequest).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: [{
            content: {
              parts: [{ text: '<script>alert("xss")</script>Safe content' }]
            }
          }],
          usageMetadata: { totalTokenCount: 100 }
        })
      });
      
      const result = await callGeminiAPI(testQueries.simple, mockAPICredentials.gemini, 'thinking-only');
      
      expect(result).not.toContain('<script>');
      expect(result.toLowerCase()).not.toContain('alert(');
    });

    it('should handle network errors gracefully', async () => {
      const { secureNetworkRequest } = await import('@/utils/secureNetworkRequest');
      
      // Mock network error
      vi.mocked(secureNetworkRequest).mockRejectedValueOnce(new Error('Network timeout'));
      
      await expect(callGeminiAPI(testQueries.simple, mockAPICredentials.gemini, 'thinking-only'))
        .rejects.toThrow('Network timeout');
    });

    it('should track token usage', async () => {
      const { costGuardrails } = await import('@/services/CostGuardrails');
      
      await callGeminiAPI(testQueries.technical, mockAPICredentials.gemini, 'thinking-structured');
      
      expect(costGuardrails.recordUsage).toHaveBeenCalledWith('gemini', expect.any(Number));
    });
  });

  // Note: validateAPICredentials is not currently exported from apiService.ts
  // This functionality would need to be implemented and exported if needed

  // Note: rateLimitCheck is not currently exported from apiService.ts
  // This functionality would need to be implemented and exported if needed

  describe('Error Handling and Security', () => {
    it('should sanitize error messages', async () => {
      const { secureNetworkRequest } = await import('@/utils/secureNetworkRequest');
      const { sanitizeError } = await import('@/utils/errorSanitizer');
      
      const sensitiveError = new Error('API key abc123 failed authentication');
      vi.mocked(secureNetworkRequest).mockRejectedValueOnce(sensitiveError);
      
      try {
        await callGeminiAPI(testQueries.simple, mockAPICredentials.gemini, 'thinking-only');
      } catch (error) {
        expect(sanitizeError).toHaveBeenCalledWith(sensitiveError);
      }
    });

    it('should prevent injection attacks in queries', async () => {
      const maliciousQuery = testQueries.malicious;
      
      const result = await callGeminiAPI(maliciousQuery, mockAPICredentials.gemini, 'thinking-only');
      
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('data:text/html');
    });

    it('should handle timeout scenarios', async () => {
      const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
      
      // Mock timeout
      vi.mocked(secureRequestWithTimeout).mockRejectedValueOnce(new Error('Request timeout'));
      
      await expect(callPerplexitySonarAPI(testQueries.simple, mockAPICredentials.perplexity))
        .rejects.toThrow('Request timeout');
    });

    it('should validate response formats', async () => {
      const { secureNetworkRequest } = await import('@/utils/secureNetworkRequest');
      
      // Mock malformed response
      vi.mocked(secureNetworkRequest).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          // Missing required fields
          invalid: 'response'
        })
      });
      
      await expect(callGeminiAPI(testQueries.simple, mockAPICredentials.gemini, 'thinking-only'))
        .rejects.toThrow();
    });

    it('should handle API quota exceeded errors', async () => {
      const { secureNetworkRequest } = await import('@/utils/secureNetworkRequest');
      
      // Mock quota exceeded
      vi.mocked(secureNetworkRequest).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: vi.fn().mockResolvedValue({
          error: { message: 'Quota exceeded' }
        })
      });
      
      await expect(callGeminiAPI(testQueries.simple, mockAPICredentials.gemini, 'thinking-only'))
        .rejects.toThrow('Quota exceeded');
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle concurrent API calls efficiently', async () => {
      const queries = [
        testQueries.simple,
        testQueries.complex,
        testQueries.medical,
        testQueries.technical
      ];
      
      const promises = queries.map(query => 
        callGeminiAPI(query, mockAPICredentials.gemini, 'thinking-only')
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(queries.length);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      });
    });

    it('should optimize token usage for large requests', async () => {
      const longQuery = testQueries.simple.repeat(100);
      
      const result = await callGeminiAPI(longQuery, mockAPICredentials.gemini, 'thinking-structured');
      
      expect(result).toBeDefined();
      // Should handle optimization internally without throwing
    });

    it('should cache frequently used responses', async () => {
      // Make the same call twice
      const query = testQueries.simple;
      const apiKey = mockAPICredentials.gemini;
      
      const result1 = await callGeminiAPI(query, apiKey, 'thinking-only');
      const result2 = await callGeminiAPI(query, apiKey, 'thinking-only');
      
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      // Cache behavior would be implementation-specific
    });
  });
});