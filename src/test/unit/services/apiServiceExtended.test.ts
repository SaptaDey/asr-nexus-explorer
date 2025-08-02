import { vi } from 'vitest';
import * as apiService from '@/services/apiService';

describe('apiService', () => {
  it('should throw on invalid Gemini API key', async () => {
    await expect(apiService.callGeminiAPI('prompt', '', 'thinking-only')).rejects.toThrow('Invalid Gemini API key format');
  });

  it('should throw on empty prompt', async () => {
    // Use a valid API key format to test prompt validation
    await expect(apiService.callGeminiAPI('', 'AIzaSyD1234567890123456789012345678901234567890')).rejects.toThrow('API call failed: Invalid prompt');
  });

  it('should throw if rate limit exceeded for perplexity', async () => {
    // Use vitest mocking instead of jest
    const { apiRateLimiter } = await import('@/utils/securityUtils');
    const spy = vi.spyOn(apiRateLimiter, 'isAllowed').mockReturnValueOnce(false);
    const getStatus = vi.spyOn(apiRateLimiter, 'getStatus').mockReturnValue({ remaining: 0, resetTime: Date.now() + 5000 });
    await expect(apiService.callPerplexitySonarAPI('query', 'apikey')).rejects.toThrow(/Perplexity API rate limit exceeded/);
    spy.mockRestore();
    getStatus.mockRestore();
  });

  it('should throw if cost guardrails exceeded for Sonar', async () => {
    const { costGuardrails } = await import('@/services/CostGuardrails');
    const orig = costGuardrails.canMakeCall;
    costGuardrails.canMakeCall = () => false;
    await expect(apiService.callPerplexitySonarAPI('query', 'apikey')).rejects.toThrow('Cost guardrails exceeded for Sonar API');
    costGuardrails.canMakeCall = orig;
  });

  // You can add more tests for the chunking handler and errorLogger if desired
});
