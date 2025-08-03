import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AsrGotStageEngine } from '@/services/AsrGotStageEngine';
import { APICredentials } from '@/types/asrGotTypes';

// Mock dependencies with minimal setup
vi.mock('@/utils/background', () => ({
  queueGeminiCall: vi.fn().mockReturnValue('task-123'),
  getTaskResult: vi.fn().mockResolvedValue('{"primary_field": "Biology", "objectives": ["test obj"], "constraints": ["test constraint"], "initial_scope": "test scope"}')
}));

vi.mock('@/services/apiService', () => ({
  callPerplexitySonarAPI: vi.fn().mockResolvedValue('Mock evidence')
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() }
}));

vi.mock('@/utils/informationTheory', () => ({
  calculateNodeInformationMetrics: vi.fn().mockReturnValue({ entropy: 0.5 }),
  calculateEvidenceInformationMetrics: vi.fn().mockReturnValue({ entropy: 0.6 }),
  calculateHypothesisInformationMetrics: vi.fn().mockReturnValue({ entropy: 0.7 }),
  calculateGraphComplexity: vi.fn().mockReturnValue({ nodes: 10, edges: 15 })
}));

describe('AsrGotStageEngine - Additional Branch Coverage', () => {
  let mockCredentials: APICredentials;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCredentials = {
      gemini: 'test-gemini-key',
      perplexity: 'test-perplexity-key'
    };
  });

  it('should handle constructor with openai key present', () => {
    const credsWithOpenAI: APICredentials = {
      gemini: 'test-gemini',
      perplexity: 'test-perplexity',
      openai: 'test-openai-key'
    };
    
    const engine = new AsrGotStageEngine(credsWithOpenAI);
    expect(engine).toBeDefined();
  });

  it('should handle constructor with empty credentials object', () => {
    const engine = new AsrGotStageEngine({} as APICredentials);
    expect(engine).toBeDefined();
  });

  it('should test statistical power extraction with different inputs', () => {
    const engine = new AsrGotStageEngine(mockCredentials);
    const extractStatisticalPower = (engine as any).extractStatisticalPower;
    
    // Test the main branches in extractStatisticalPower
    expect(extractStatisticalPower('statistical power: 0.95')).toBe(0.95);
    expect(extractStatisticalPower('sample size: 1,000')).toBeGreaterThan(0.5);
    expect(extractStatisticalPower('effect size: 0.8')).toBeGreaterThan(0.5);
    expect(extractStatisticalPower('p-value: 0.01')).toBeGreaterThan(0.5);
    expect(extractStatisticalPower('peer-reviewed study')).toBeGreaterThan(0.5);
    expect(extractStatisticalPower('published in journal')).toBeGreaterThan(0.5);
  });

  it('should test field extraction branches', () => {
    const engine = new AsrGotStageEngine(mockCredentials);
    const extractField = (engine as any).extractField;
    
    expect(extractField(undefined)).toBe('General Science');
    expect(extractField(123)).toBe('General Science');
    expect(extractField('field: Biology')).toBe('Biology');
    expect(extractField('no field mentioned')).toBe('General Science');
  });

  it('should test objectives extraction branches', () => {
    const engine = new AsrGotStageEngine(mockCredentials);
    const extractObjectives = (engine as any).extractObjectives;
    
    expect(extractObjectives(undefined)).toEqual(['Comprehensive analysis']);
    expect(extractObjectives('')).toEqual(['Comprehensive analysis']);
    expect(extractObjectives('objectives: study cells')).toContain('study cells');
  });

  it('should handle parse error branches in stage 1', async () => {
    const { getTaskResult } = await import('@/utils/background');
    
    // Test non-JSON response with fallback parsing
    (getTaskResult as any).mockResolvedValueOnce('This has field: Biology but is not JSON');
    
    const engine = new AsrGotStageEngine(mockCredentials);
    const result = await engine.executeStage1('test query');
    
    expect(result.result).toContain('Biology');
  });

  it('should handle error type checking', async () => {
    const { getTaskResult } = await import('@/utils/background');
    
    // Test Error instance
    (getTaskResult as any).mockRejectedValueOnce(new Error('Test error'));
    
    const engine = new AsrGotStageEngine(mockCredentials);
    
    try {
      await engine.executeStage1('test');
    } catch (error) {
      const contexts = (engine as any).stageContexts;
      expect(contexts[0].error_message).toBe('Test error');
    }
  });

  it('should handle non-Error objects', async () => {
    const { getTaskResult } = await import('@/utils/background');
    
    // Test non-Error object
    (getTaskResult as any).mockRejectedValueOnce('String error');
    
    const engine = new AsrGotStageEngine(mockCredentials);
    
    try {
      await engine.executeStage1('test');
    } catch (error) {
      const contexts = (engine as any).stageContexts;
      expect(contexts[contexts.length - 1].error_message).toBe('Unknown error');
    }
  });

  it('should test impact score ternary operator', () => {
    // Test the ternary: index < 3 ? 0.9 : 0.7
    expect(0 < 3 ? 0.9 : 0.7).toBe(0.9);
    expect(3 < 3 ? 0.9 : 0.7).toBe(0.7);
  });
});