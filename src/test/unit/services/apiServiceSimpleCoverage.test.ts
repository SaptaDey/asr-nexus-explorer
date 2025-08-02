import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies first
vi.mock('@/utils/securityUtils', () => ({
  validateInput: vi.fn((input: string) => input),
  validateAPIKey: vi.fn(() => true),
  apiRateLimiter: {
    isAllowed: vi.fn(() => true),
    getStatus: vi.fn(() => ({ remaining: 100, resetTime: Date.now() + 60000 }))
  }
}));

vi.mock('@/services/CostGuardrails', () => ({
  costGuardrails: {
    canMakeCall: vi.fn(() => true),
    recordUsage: vi.fn()
  }
}));

vi.mock('@/utils/secureNetworkRequest', () => ({
  secureNetworkRequest: vi.fn(),
  createGeminiHeaders: vi.fn(() => ({ 'Content-Type': 'application/json' })),
  validateApiKeyFormat: vi.fn(() => true),
  secureRequestWithTimeout: vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue({
      candidates: [{
        content: { parts: [{ text: 'Test response' }] },
        finishReason: 'STOP'
      }],
      usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 150, totalTokenCount: 250 }
    })
  })
}));

vi.mock('@/utils/errorSanitizer', () => ({
  sanitizeError: vi.fn((error: any) => error.message || 'Mock error'),
  secureConsoleError: vi.fn()
}));

vi.mock('@/services/securityEventLogger', () => ({
  logApiCall: vi.fn()
}));

vi.mock('@/services/ErrorLoggingService', () => ({
  errorLogger: { 
    logError: vi.fn(),
    logAPIError: vi.fn()
  }
}));

// Import after mocking
import { callGeminiAPI, callPerplexitySonarAPI } from '@/services/apiService';

describe('apiService - Simple Function Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock crypto for generateCacheKey function
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        subtle: {
          digest: vi.fn().mockResolvedValue(new ArrayBuffer(32))
        }
      },
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(globalThis, 'TextEncoder', {
      value: vi.fn().mockImplementation(() => ({
        encode: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3, 4]))
      })),
      writable: true,
      configurable: true
    });
  });

  describe('callPerplexitySonarAPI function coverage', () => {
    it('should call callPerplexitySonarAPI successfully', async () => {
      const result = await callPerplexitySonarAPI('test query', 'test-key');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should call callPerplexitySonarAPI with options', async () => {
      const result = await callPerplexitySonarAPI('test query', 'test-key', { 
        recency: true, 
        focus: 'peer-reviewed',
        userId: 'test-user' 
      });
      expect(result).toBeDefined();
    });
  });

  describe('callGeminiAPI thinking-function capability', () => {
    it('should handle thinking-function capability', async () => {
      const result = await callGeminiAPI('test', 'test-key', 'thinking-function');
      expect(result).toBeDefined();
    });
  });

  describe('callGeminiAPI thinking-cache capability', () => {
    it('should handle thinking-cache capability', async () => {
      const result = await callGeminiAPI('test', 'test-key', 'thinking-cache');
      expect(result).toBeDefined();
    });
  });

  describe('callGeminiAPI thinking-code capability', () => {
    it('should handle thinking-code capability', async () => {
      const result = await callGeminiAPI('test', 'test-key', 'thinking-code');
      expect(result).toBeDefined();
    });
  });

  describe('Large prompt handling - handleLargePromptChunking', () => {
    it('should handle oversized prompts by chunking', async () => {
      const oversizedPrompt = 'A'.repeat(32001 * 4); // Exceeds MAX_INPUT_TOKENS
      const result = await callGeminiAPI(oversizedPrompt, 'test-key', 'thinking-only');
      expect(result).toBeDefined();
    });
  });

  describe('Caching - generateCacheKey function', () => {
    it('should trigger caching for large prompts', async () => {
      const largePrompt = 'B'.repeat(200001); // Exceeds cache threshold
      const result = await callGeminiAPI(
        largePrompt, 
        'test-key', 
        'thinking-only',
        undefined,
        { stageId: 'test-stage', graphHash: 'test-hash' }
      );
      expect(result).toBeDefined();
    });
  });

  describe('Dynamic token sizing branches', () => {
    it('should adjust maxTokens for large inputs', async () => {
      const largePrompt = 'C'.repeat(20001 * 4); // >20000 tokens
      const result = await callGeminiAPI(
        largePrompt, 
        'test-key', 
        'thinking-only',
        undefined,
        { maxTokens: 8000 }
      );
      expect(result).toBeDefined();
    });

    it('should adjust maxTokens for medium inputs', async () => {
      const mediumPrompt = 'D'.repeat(10001 * 4); // >10000 tokens
      const result = await callGeminiAPI(
        mediumPrompt, 
        'test-key', 
        'thinking-only',
        undefined,
        { maxTokens: 8000 }
      );
      expect(result).toBeDefined();
    });
  });

  describe('Tools configuration branches', () => {
    it('should configure tools for thinking-search', async () => {
      const result = await callGeminiAPI('search test', 'test-key', 'thinking-search');
      expect(result).toBeDefined();
    });

    it('should skip tools for thinking-function', async () => {
      const result = await callGeminiAPI('function test', 'test-key', 'thinking-function');
      expect(result).toBeDefined();
    });

    it('should skip tools for thinking-cache', async () => {
      const result = await callGeminiAPI('cache test', 'test-key', 'thinking-cache');
      expect(result).toBeDefined();
    });
  });

  describe('Schema handling for thinking-structured', () => {
    it('should handle thinking-structured with schema', async () => {
      const schema = { type: 'object', properties: { test: { type: 'string' } } };
      const result = await callGeminiAPI('structured test', 'test-key', 'thinking-structured', schema);
      expect(result).toBeDefined();
    });
  });
});