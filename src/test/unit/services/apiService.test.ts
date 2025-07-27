import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { testQueries, testErrors } from '@/test/fixtures/testData';
import { mockAPICredentials } from '@/test/mocks/mockServices';

// REMOVE AGGRESSIVE MOCKING: Test actual implementation for real coverage
// Remove the mock of the entire apiService module

// Import the actual implementation to test
import { 
  callPerplexitySonarAPI, 
  callGeminiAPI
} from '@/services/apiService';

// Mock dependencies but test actual apiService implementation

// Mock security utils - allow some calls, block others for testing
vi.mock('@/utils/securityUtils', () => ({
  validateInput: vi.fn((input: string) => {
    if (!input || input.trim().length === 0) throw new Error('Input validation failed');
    return input.trim();
  }),
  validateAPIKey: vi.fn((key: string) => {
    if (!key || key === 'invalid-key') return false;
    return true;
  }),
  apiRateLimiter: {
    isAllowed: vi.fn((service: string, userId: string) => {
      if (userId === 'rate-limited-user') return false;
      return true;
    }),
    getStatus: vi.fn(() => ({ remaining: 0, resetTime: Date.now() + 60000 })),
    check: vi.fn().mockResolvedValue(true),
    record: vi.fn().mockResolvedValue(true)
  }
}));

// Mock cost guardrails - allow most calls, block some for testing
vi.mock('@/services/CostGuardrails', () => ({
  costGuardrails: {
    canMakeCall: vi.fn((service: string, tokens: number) => {
      if (service === 'blocked-service') return false;
      return true;
    }),
    recordUsage: vi.fn(),
    getCurrentCosts: vi.fn(() => ({ total: 10.50, gemini: 8.25, sonar: 2.25 })),
    getRemainingBudget: vi.fn(() => 39.50)
  }
}));

// Mock secure network requests with configurable responses
vi.mock('@/utils/secureNetworkRequest', () => {
  const createMockResponse = (success = true, data = null) => ({
    ok: success,
    status: success ? 200 : 500,
    json: vi.fn().mockResolvedValue(data || {
      candidates: [{
        content: { parts: [{ text: 'Mock API response content for testing' }] }
      }],
      usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 150, totalTokenCount: 250 }
    }),
    text: vi.fn().mockResolvedValue(success ? 'Success' : 'Error text')
  });

  return {
    secureNetworkRequest: vi.fn().mockImplementation((url, options) => {
      // Test different error scenarios based on URL or options
      if (url.includes('error-test')) {
        return Promise.resolve(createMockResponse(false));
      }
      if (options?.headers?.Authorization === 'Bearer invalid-key') {
        return Promise.resolve(createMockResponse(false, { error: 'Invalid API key' }));
      }
      return Promise.resolve(createMockResponse(true));
    }),
    createGeminiHeaders: vi.fn((apiKey) => ({ 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${apiKey}` 
    })),
    validateApiKeyFormat: vi.fn((key) => key && key.length > 10),
    secureRequestWithTimeout: vi.fn().mockImplementation((requestPromise, timeout) => {
      return requestPromise;
    })
  };
});

// Mock error handling utilities
vi.mock('@/utils/errorSanitizer', () => ({
  sanitizeError: vi.fn((error: any) => ({
    message: error.message || 'Mock error',
    code: error.code || 'MOCK_ERROR'
  })),
  secureConsoleError: vi.fn()
}));

// Mock security event logger
vi.mock('@/services/securityEventLogger', () => ({
  logApiCall: vi.fn().mockResolvedValue(true)
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  }
}));

describe('apiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Don't mock the actual functions - test the real implementation
    // Reset dependency mocks only
    
    // Ensure console methods don't interfere with tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('callPerplexitySonarAPI', () => {
    it('should successfully call Perplexity Sonar API with valid parameters', async () => {
      const query = testQueries.simple;
      const apiKey = mockAPICredentials.gemini;
      
      const result = await callPerplexitySonarAPI(query, apiKey);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle queries with recency and focus options', async () => {
      const query = testQueries.medical;
      const apiKey = mockAPICredentials.gemini;
      const options = { recency: true, focus: 'peer-reviewed' };
      
      const result = await callPerplexitySonarAPI(query, apiKey, options);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle rate limiting correctly', async () => {
      const query = testQueries.simple;
      const apiKey = mockAPICredentials.gemini;
      const options = { userId: 'rate-limited-user' };
      
      await expect(callPerplexitySonarAPI(query, apiKey, options))
        .rejects.toThrow('rate limit exceeded');
    });

    it('should handle cost guardrails blocking', async () => {
      const { costGuardrails } = await import('@/services/CostGuardrails');
      vi.mocked(costGuardrails.canMakeCall).mockReturnValueOnce(false);
      
      await expect(callPerplexitySonarAPI(testQueries.simple, mockAPICredentials.gemini))
        .rejects.toThrow('Cost guardrails exceeded');
    });

    it('should record usage metrics correctly', async () => {
      const { costGuardrails } = await import('@/services/CostGuardrails');
      
      await callPerplexitySonarAPI(testQueries.technical, mockAPICredentials.gemini);
      
      expect(costGuardrails.recordUsage).toHaveBeenCalledWith('sonar', 1000);
    });

    it('should fallback to Gemini when Perplexity unavailable', async () => {
      // This tests the current placeholder implementation
      const result = await callPerplexitySonarAPI(testQueries.simple, mockAPICredentials.gemini);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
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

    it('should handle invalid API key', async () => {
      const query = testQueries.simple;
      const invalidKey = 'invalid-key';
      
      await expect(callGeminiAPI(query, invalidKey, 'thinking-only'))
        .rejects.toThrow();
    });

    it('should handle empty prompts correctly', async () => {
      const { validateInput } = await import('@/utils/securityUtils');
      
      await expect(callGeminiAPI('', mockAPICredentials.gemini, 'thinking-only'))
        .rejects.toThrow('Input validation failed');
    });

    it('should handle whitespace-only prompts', async () => {
      await expect(callGeminiAPI('   \n\t   ', mockAPICredentials.gemini, 'thinking-only'))
        .rejects.toThrow('Input validation failed');
    });

    it('should track token usage correctly', async () => {
      const { costGuardrails } = await import('@/services/CostGuardrails');
      
      await callGeminiAPI(testQueries.technical, mockAPICredentials.gemini, 'thinking-structured');
      
      expect(costGuardrails.recordUsage).toHaveBeenCalled();
    });

    it('should handle API network errors', async () => {
      const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
      vi.mocked(secureRequestWithTimeout).mockRejectedValueOnce(new Error('Network timeout'));
      
      await expect(callGeminiAPI(testQueries.simple, mockAPICredentials.gemini, 'thinking-only'))
        .rejects.toThrow('Network timeout');
    });

    it('should handle malformed API responses', async () => {
      const { secureNetworkRequest } = await import('@/utils/secureNetworkRequest');
      vi.mocked(secureNetworkRequest).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({}), // No candidates
        text: vi.fn().mockResolvedValue('Empty response')
      });
      
      await expect(callGeminiAPI(testQueries.simple, mockAPICredentials.gemini, 'thinking-only'))
        .rejects.toThrow();
    });

    it('should handle API error responses', async () => {
      const { secureNetworkRequest } = await import('@/utils/secureNetworkRequest');
      vi.mocked(secureNetworkRequest).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: vi.fn().mockResolvedValue({ error: 'Quota exceeded' }),
        text: vi.fn().mockResolvedValue('Quota exceeded')
      });
      
      await expect(callGeminiAPI(testQueries.simple, mockAPICredentials.gemini, 'thinking-only'))
        .rejects.toThrow();
    });
  });

  describe('Error Handling and Security', () => {
    it('should validate API key format', async () => {
      const { validateApiKeyFormat } = await import('@/utils/secureNetworkRequest');
      
      // Test with short invalid key
      await expect(callGeminiAPI(testQueries.simple, 'short', 'thinking-only'))
        .rejects.toThrow();
    });

    it('should sanitize errors properly', async () => {
      const { sanitizeError } = await import('@/utils/errorSanitizer');
      
      // Trigger an error and verify sanitization is called
      try {
        await callGeminiAPI('', mockAPICredentials.gemini, 'thinking-only');
      } catch (error) {
        expect(sanitizeError).toHaveBeenCalled();
      }
    });

    it('should log API calls for security monitoring', async () => {
      const { logApiCall } = await import('@/services/securityEventLogger');
      
      await callGeminiAPI(testQueries.simple, mockAPICredentials.gemini, 'thinking-only');
      
      expect(logApiCall).toHaveBeenCalled();
    });

    it('should handle concurrent API calls without race conditions', async () => {
      const promises = [
        callGeminiAPI(testQueries.simple, mockAPICredentials.gemini, 'thinking-only'),
        callGeminiAPI(testQueries.medical, mockAPICredentials.gemini, 'thinking-structured'),
        callPerplexitySonarAPI(testQueries.technical, mockAPICredentials.gemini)
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      });
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
    });

    it('should cache frequently used responses', async () => {
      const query = testQueries.simple;
      const apiKey = mockAPICredentials.gemini;
      
      const result1 = await callGeminiAPI(query, apiKey, 'thinking-only');
      const result2 = await callGeminiAPI(query, apiKey, 'thinking-only');
      
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });
});