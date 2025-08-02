import { AsrGotStageEngine } from '@/services/AsrGotStageEngine';

describe('AsrGotStageEngine', () => {
  const dummyCredentials = { gemini: 'test-gemini-key', perplexity: 'test-perplexity-key', openai: 'test-openai-key' };

  it('should instantiate with default values', () => {
    const engine = new AsrGotStageEngine(dummyCredentials);
    expect(engine.getGraphData()).toBeDefined();
    expect(engine.getResearchContext()).toBeDefined();
    expect(engine.getStageContexts()).toEqual([]);
  });

  it('should throw on invalid stage number in executeStage', async () => {
    const engine = new AsrGotStageEngine(dummyCredentials);
    await expect(engine.executeStage(0)).rejects.toThrow('Invalid stage number');
    await expect(engine.executeStage(10)).rejects.toThrow('Invalid stage number');
  });

  it('should throw if stage 1 is called without query', async () => {
    const engine = new AsrGotStageEngine(dummyCredentials);
    // @ts-expect-error test missing query
    await expect(engine.executeStage(1)).rejects.toThrow('Query cannot be empty');
  });

  it('should throw if API credentials missing', async () => {
    const engine = new AsrGotStageEngine({ gemini: '', perplexity: '', openai: '' });
    await expect(engine.executeStage(1, 'a query')).rejects.toThrow('API credentials required');
  });

  it('should validateStageResult correctly', () => {
    const engine = new AsrGotStageEngine(dummyCredentials);
    expect(engine.validateStageResult(null)).toBe(false);
    expect(engine.validateStageResult({})).toBe(false);
    expect(engine.validateStageResult({
      stage: 1,
      status: 'completed',
      content: 'abc',
      timestamp: new Date().toISOString()
    })).toBe(true);
  });

  it('should calculateConfidence as expected', () => {
    const engine = new AsrGotStageEngine(dummyCredentials);
    expect(engine.calculateConfidence([])).toBe(0);
    expect(engine.calculateConfidence(['a'])).toBe(0.15);
    // Fix floating-point precision issue by using toBeCloseTo for decimal comparisons
    expect(engine.calculateConfidence(['a', 'b', 'c', 'd', 'e', 'f'])).toBeCloseTo(1.0, 10);
  });

  it('should getStageResults returns a copy', () => {
    const engine = new AsrGotStageEngine(dummyCredentials);
    const results = engine.getStageResults();
    expect(Array.isArray(results)).toBe(true);
    expect(results).not.toBe(engine['stageResults']);
  });

  it('should getFinalHtmlReport returns null if not set', () => {
    const engine = new AsrGotStageEngine(dummyCredentials);
    expect(engine.getFinalHtmlReport()).toBe(null);
  });

  // Branch coverage for extractField, extractObjectives, extractDimensionContent, extractHypothesisContent, extractFalsificationCriteria
  it('should handle extraction helpers with missing/invalid input', () => {
    const engine = new AsrGotStageEngine(dummyCredentials);
    expect(engine['extractField']('')).toBe('General Science');
    expect(engine['extractObjectives']('')).toEqual(['Comprehensive analysis']);
    expect(engine['extractDimensionContent']('', 'Scope')).toMatch(/Scope analysis/);
    expect(engine['extractHypothesisContent']('', 1)).toMatch(/Hypothesis 1/);
    expect(engine['extractFalsificationCriteria']('', 1)).toMatch(/Specific testable criteria/);
  });

  // Test parseConfidenceVector with undefined
  it('should handle parseConfidenceVector with undefined', () => {
    const engine = new AsrGotStageEngine(dummyCredentials);
    expect(engine['parseConfidenceVector']('')).toHaveLength(4);
  });

  // Test private methods for coverage (using any type-cast for access)
  it('should assess evidence quality', () => {
    const engine = new AsrGotStageEngine(dummyCredentials) as any;
    expect(engine.assessEvidenceQuality('anything')).toBe('high');
  });

  it('should calculate evidence impact', () => {
    const engine = new AsrGotStageEngine(dummyCredentials) as any;
    expect(engine.calculateEvidenceImpact('')).toBe(0.8);
  });

  it('should handle identifySimilarNodes and mergeNodes', () => {
    const engine = new AsrGotStageEngine(dummyCredentials) as any;
    expect(engine.identifySimilarNodes([])).toEqual([]);
    expect(engine.mergeNodes([{ id: 1 }])).toEqual({ id: 1 });
  });
});
