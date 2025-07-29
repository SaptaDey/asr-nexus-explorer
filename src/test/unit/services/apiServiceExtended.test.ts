import * as apiService from '@/services/apiService';

describe('apiService', () => {
  it('should throw on invalid Gemini API key', async () => {
    await expect(apiService.callGeminiAPI('prompt', '', 'thinking-only')).rejects.toThrow('Invalid Gemini API key format');
  });

  it('should throw on empty prompt', async () => {
    await expect(apiService.callGeminiAPI('', 'apikey')).rejects.toThrow('API call failed: Invalid prompt');
  });

  it('should throw if rate limit exceeded for perplexity', async () => {
    // mock apiRateLimiter
    const spy = jest.spyOn(require('@/utils/securityUtils').apiRateLimiter, 'isAllowed').mockReturnValueOnce(false);
    const getStatus = jest.spyOn(require('@/utils/securityUtils').apiRateLimiter, 'getStatus').mockReturnValue({ remaining: 0, resetTime: Date.now() + 5000 });
    await expect(apiService.callPerplexitySonarAPI('query', 'apikey')).rejects.toThrow(/Perplexity API rate limit exceeded/);
    spy.mockRestore();
    getStatus.mockRestore();
  });

  it('should throw if cost guardrails exceeded for Sonar', async () => {
    const orig = require('@/services/CostGuardrails').costGuardrails.canMakeCall;
    require('@/services/CostGuardrails').costGuardrails.canMakeCall = () => false;
    await expect(apiService.callPerplexitySonarAPI('query', 'apikey')).rejects.toThrow('Cost guardrails exceeded for Sonar API');
    require('@/services/CostGuardrails').costGuardrails.canMakeCall = orig;
  });

  // You can add more tests for the chunking handler and errorLogger if desired
});
