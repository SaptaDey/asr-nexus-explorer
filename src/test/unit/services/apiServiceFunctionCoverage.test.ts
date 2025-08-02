import { describe, it, expect, beforeEach, vi } from 'vitest';

// Import directly to test internal functions
import * as apiServiceModule from '@/services/apiService';

// Mock dependencies
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

describe('apiService - Function Coverage Enhancement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GeminiCapability type coverage', () => {
    it('should test all GeminiCapability enum values', async () => {
      const capabilities: apiServiceModule.GeminiCapability[] = [
        'thinking-only',
        'thinking-structured', 
        'thinking-search',
        'thinking-code',
        'thinking-function',
        'thinking-cache'
      ];
      
      for (const capability of capabilities) {
        const result = await apiServiceModule.callGeminiAPI('Test prompt', 'test-key', capability);
        expect(result).toBeDefined();
      }
    });
  });

  describe('callPerplexitySonarAPI comprehensive coverage', () => {
    it('should cover all parameter combinations', async () => {
      // Test with valid apiKey
      const result1 = await apiServiceModule.callPerplexitySonarAPI('query1', 'valid-key');
      expect(result1).toBeDefined();
      
      // Test with apiKey but no options
      const result2 = await apiServiceModule.callPerplexitySonarAPI('query2', 'valid-key');
      expect(result2).toBeDefined();
      
      // Test with empty options object  
      const result3 = await apiServiceModule.callPerplexitySonarAPI('query3', 'valid-key', {});
      expect(result3).toBeDefined();
      
      // Test with partial options
      const result4 = await apiServiceModule.callPerplexitySonarAPI('query4', 'valid-key', { recency: true });
      expect(result4).toBeDefined();
      
      const result5 = await apiServiceModule.callPerplexitySonarAPI('query5', 'valid-key', { focus: 'test' });
      expect(result5).toBeDefined();
      
      const result6 = await apiServiceModule.callPerplexitySonarAPI('query6', 'valid-key', { userId: 'user123' });
      expect(result6).toBeDefined();
    });
  });

  describe('callGeminiAPI parameter variations', () => {
    it('should test all optional parameter combinations', async () => {
      // Test with minimal parameters
      const result1 = await apiServiceModule.callGeminiAPI('Test', 'key');
      expect(result1).toBeDefined();
      
      // Test with capability only
      const result2 = await apiServiceModule.callGeminiAPI('Test', 'key', 'thinking-only');
      expect(result2).toBeDefined();
      
      // Test with capability and schema
      const result3 = await apiServiceModule.callGeminiAPI('Test', 'key', 'thinking-structured', { type: 'object' });
      expect(result3).toBeDefined();
      
      // Test with all options
      const result4 = await apiServiceModule.callGeminiAPI('Test', 'key', 'thinking-only', undefined, {
        thinkingBudget: 1000,
        stageId: 'test-stage',
        graphHash: 'test-hash',
        temperature: 0.5,
        maxTokens: 4000,
        retryCount: 0
      });
      expect(result4).toBeDefined();
      
      // Test with partial options
      const result5 = await apiServiceModule.callGeminiAPI('Test', 'key', 'thinking-only', undefined, {
        temperature: 0.8
      });
      expect(result5).toBeDefined();
    });
  });
});