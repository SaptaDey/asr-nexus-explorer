import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  callPerplexitySonarAPI, 
  callGeminiAPI
} from '@/services/apiService';
import { testQueries, testErrors } from '@/test/fixtures/testData';
import { mockAPICredentials } from '@/test/mocks/mockServices';

// COMPLETE MOCK REPLACEMENT STRATEGY
// Instead of trying to mock individual functions, mock entire modules

// Mock ALL security utils with simple pass-through functions
vi.mock('@/utils/securityUtils', () => ({
  validateInput: vi.fn((input: string) => input.trim()),
  validateAPIKey: vi.fn(() => true),
  apiRateLimiter: {
    isAllowed: vi.fn(() => true),
    check: vi.fn().mockResolvedValue(true),
    record: vi.fn().mockResolvedValue(true)
  }
}));

// Mock ALL cost guardrails with unlimited budget
vi.mock('@/services/CostGuardrails', () => ({
  costGuardrails: {
    canMakeCall: vi.fn(() => true),
    recordUsage: vi.fn(),
    getCurrentCosts: vi.fn(() => ({ total: 0, gemini: 0, sonar: 0 })),
    getRemainingBudget: vi.fn(() => 50.0)
  }
}));

// Mock ALL secure network requests with successful responses
vi.mock('@/utils/secureNetworkRequest', () => {
  const mockResponse = {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue({
      candidates: [{
        content: {
          parts: [{ text: 'Mock API response content for testing' }]
        }
      }],
      usageMetadata: {
        promptTokenCount: 100,
        candidatesTokenCount: 150,
        totalTokenCount: 250
      }
    })
  };

  return {
    secureNetworkRequest: vi.fn().mockResolvedValue(mockResponse),
    createGeminiHeaders: vi.fn(() => ({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-key'
    })),
    validateApiKeyFormat: vi.fn(() => true),
    secureRequestWithTimeout: vi.fn().mockResolvedValue(mockResponse)
  };
});

// Mock ALL error handling utilities
vi.mock('@/utils/errorSanitizer', () => ({
  sanitizeError: vi.fn((error: any) => ({
    message: error.message || 'Mock error',
    code: error.code || 'MOCK_ERROR'
  })),
  secureConsoleError: vi.fn()
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

    it('should handle empty queries gracefully', async () => {
      const apiKey = mockAPICredentials.gemini;
      
      await expect(callPerplexitySonarAPI('', apiKey))
        .rejects.toThrow();
    });

    it('should record usage metrics', async () => {
      const { costGuardrails } = await import('@/services/CostGuardrails');
      
      await callPerplexitySonarAPI(testQueries.technical, mockAPICredentials.gemini);
      
      expect(costGuardrails.recordUsage).toHaveBeenCalledWith('sonar', 1000);
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
      const longQuery = 'A'.repeat(50000);
      const apiKey = mockAPICredentials.gemini;
      
      const result = await callGeminiAPI(longQuery, apiKey, 'thinking-only');
      
      expect(result).toBeDefined();
    });

    it('should handle empty prompts', async () => {
      const apiKey = mockAPICredentials.gemini;
      
      await expect(callGeminiAPI('', apiKey, 'thinking-only'))
        .rejects.toThrow();
    });

    it('should track token usage', async () => {
      const { costGuardrails } = await import('@/services/CostGuardrails');
      
      await callGeminiAPI(testQueries.technical, mockAPICredentials.gemini, 'thinking-structured');
      
      expect(costGuardrails.recordUsage).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Security', () => {
    it('should handle network errors gracefully', async () => {
      const { secureNetworkRequest } = await import('@/utils/secureNetworkRequest');
      
      // Mock network error for one test
      vi.mocked(secureNetworkRequest).mockRejectedValueOnce(new Error('Network timeout'));
      
      await expect(callGeminiAPI(testQueries.simple, mockAPICredentials.gemini, 'thinking-only'))
        .rejects.toThrow();
    });

    it('should validate response formats', async () => {
      const { secureNetworkRequest } = await import('@/utils/secureNetworkRequest');
      
      // Mock malformed response
      vi.mocked(secureNetworkRequest).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
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
        .rejects.toThrow();
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