import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the modules that are needed by apiService
vi.mock('@/utils/securityUtils', () => ({
  validateInput: vi.fn((input: string) => input.trim()),
  validateAPIKey: vi.fn(() => true),
  apiRateLimiter: {
    isAllowed: vi.fn(() => true),
    getStatus: vi.fn(() => ({ remaining: 100, resetTime: Date.now() + 60000, burstTokens: 50, inBackoff: false }))
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
  secureRequestWithTimeout: vi.fn(),
  createGeminiHeaders: vi.fn(() => ({ 'Authorization': 'Bearer test-key' })),
  validateApiKeyFormat: vi.fn(() => true)
}));

vi.mock('@/utils/errorSanitizer', () => ({
  sanitizeError: vi.fn((error) => error?.message || 'Sanitized error'),
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

describe('apiService - Specific Line Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup TextEncoder
    global.TextEncoder = class {
      encode(text: string) {
        return new Uint8Array(Array.from(text).map(c => c.charCodeAt(0)));
      }
    };
    
    // Setup crypto mock
    Object.defineProperty(global, 'crypto', {
      value: {
        subtle: {
          digest: vi.fn().mockResolvedValue(new ArrayBuffer(32))
        }
      },
      writable: true
    });
  });

  it('should trigger MAX_TOKENS error after retries (lines 218-219)', async () => {
    const { callGeminiAPI } = await import('@/services/apiService');
    const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
    
    // Mock MAX_TOKENS response repeatedly WITHOUT content to trigger the error path
    const maxTokensResponse = {
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          finishReason: 'MAX_TOKENS',
          content: null // No content to trigger the error
        }]
      })
    };
    
    (secureRequestWithTimeout as any).mockResolvedValue(maxTokensResponse);
    
    try {
      await callGeminiAPI('test prompt', 'valid-key', 'thinking-only', undefined, { maxTokens: 1000 });
      expect(false).toBe(true); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('MAX_TOKENS limit exceeded after');
      expect((error as Error).message).toContain('retry attempts');
    }
  });

  it('should trigger generateCacheKey function (lines 283-288)', async () => {
    const { callGeminiAPI } = await import('@/services/apiService');
    const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
    
    // Override the mocked TextEncoder to return the correct byte size
    global.TextEncoder = class {
      encode(text: string) {
        // Return an array with length proportional to string length
        // For caching test: make sure bytes > 200000 when text.length = 100000  
        const byteArray = new Uint8Array(text.length * 3); // 3 bytes per char
        return byteArray;
      }
    };
    
    // Mock successful response
    (secureRequestWithTimeout as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          content: { parts: [{ text: 'Cache response' }] }
        }]
      })
    });
    
    // Create a prompt: 100,000 chars * 3 bytes = 300,000 bytes > 200,000 (triggers caching)
    // 100,000 chars / 4 = 25,000 tokens < 32,000 (avoids chunking)
    const largeCachePrompt = 'x'.repeat(100000);
    
    const result = await callGeminiAPI(
      largeCachePrompt, 
      'valid-key', 
      'thinking-cache',
      undefined,
      { stageId: 'test-stage', graphHash: 'test-hash' }
    );
    
    expect(result).toBe('Cache response');
    expect(global.crypto.subtle.digest).toHaveBeenCalledWith('SHA-256', expect.any(Uint8Array));
  });

  it('should trigger handleLargePromptChunking function', async () => {
    const { callGeminiAPI } = await import('@/services/apiService');
    const { secureRequestWithTimeout } = await import('@/utils/secureNetworkRequest');
    
    // Mock successful chunking response
    (secureRequestWithTimeout as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          content: { parts: [{ text: 'Chunk response' }] }
        }]
      })
    });
    
    // Create prompt > 32000 * 4 = 128000 characters to trigger chunking
    const veryLargePrompt = 'y'.repeat(130000);
    
    const result = await callGeminiAPI(veryLargePrompt, 'valid-key');
    
    expect(result).toContain('Chunk response');
  });
});