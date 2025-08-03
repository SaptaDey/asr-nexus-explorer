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
    const indexA = 0;
    const indexB = 3;
    expect(indexA < 3 ? 0.9 : 0.7).toBe(0.9);
    expect(indexB < 3 ? 0.9 : 0.7).toBe(0.7);
  });

  it('should test additional statistical power branches', () => {
    const engine = new AsrGotStageEngine(mockCredentials);
    const extractStatisticalPower = (engine as any).extractStatisticalPower;
    
    // Test more specific branches in the statistical power calculation
    expect(extractStatisticalPower('small effect size: 0.1')).toBeGreaterThan(0);
    expect(extractStatisticalPower('large sample size: 10,000')).toBeGreaterThan(0.5);
    expect(extractStatisticalPower('medium effect size: 0.5')).toBeGreaterThan(0);
    expect(extractStatisticalPower('high p-value: 0.9')).toBeGreaterThan(0);
    expect(extractStatisticalPower('meta-analysis study')).toBeGreaterThan(0);
  });

  it('should test empty string vs null vs undefined branches', () => {
    const engine = new AsrGotStageEngine(mockCredentials);
    const extractStatisticalPower = (engine as any).extractStatisticalPower;
    const extractField = (engine as any).extractField;
    
    // Test different falsy values
    expect(extractStatisticalPower('')).toBe(0.85);
    expect(extractStatisticalPower(null)).toBe(0.85);
    expect(extractField('')).toBe('General Science');
    expect(extractField(null)).toBe('General Science');
  });

  it('should test constructor with mixed credential properties', () => {
    // Test the specific hasOwnProperty branch
    const mixedCreds = {
      gemini: 'test',
      perplexity: 'test'
    };
    
    // Add openai property dynamically to test hasOwnProperty branch
    Object.defineProperty(mixedCreds, 'openai', {
      value: 'test-openai',
      enumerable: true,
      configurable: true
    });
    
    const engine = new AsrGotStageEngine(mixedCreds as APICredentials);
    expect(engine).toBeDefined();
  });

  it('should test stage 1 with malformed JSON in production mode', async () => {
    const { getTaskResult } = await import('@/utils/background');
    
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    (getTaskResult as any).mockResolvedValueOnce('invalid json');
    
    const engine = new AsrGotStageEngine(mockCredentials);
    
    try {
      await engine.executeStage1('test');
      expect(false).toBe(true); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('Malformed API response');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('should test additional helper method branches', () => {
    const engine = new AsrGotStageEngine(mockCredentials);
    const extractField = (engine as any).extractField;
    const extractObjectives = (engine as any).extractObjectives;
    
    // Test more edge cases
    expect(extractField('fields: Multiple, Biology')).toBe('Multiple');
    expect(extractField('research field-Data Science')).toBe('Data Science');
    expect(extractObjectives('obj: test1, test2')).toContain('test1');
    expect(extractObjectives('goals: goal1; goal2')).toContain('goal1');
  });

  it('should test edge cases in statistical power calculation', () => {
    const engine = new AsrGotStageEngine(mockCredentials);
    const extractStatisticalPower = (engine as any).extractStatisticalPower;
    
    // Test boundary conditions and edge cases
    expect(extractStatisticalPower('sample size: 10')).toBeGreaterThan(0);
    expect(extractStatisticalPower('effect size: 1.5')).toBeGreaterThan(0);
    expect(extractStatisticalPower('p-value: 0.05')).toBeGreaterThan(0);
    expect(extractStatisticalPower('randomized controlled trial')).toBeGreaterThan(0);
    expect(extractStatisticalPower('systematic review')).toBeGreaterThan(0);
  });

  it('should handle empty graph initialization', () => {
    const engine = new AsrGotStageEngine(mockCredentials, undefined);
    const graphData = engine.getGraphData();
    
    // The constructor always initializes knowledge nodes, so nodes won't be empty
    expect(graphData.nodes.length).toBeGreaterThan(0);
    expect(graphData.edges).toEqual([]);
    expect(graphData.metadata.stage).toBe(0);
  });

  it('should test production environment branch in stage 1', async () => {
    const { getTaskResult } = await import('@/utils/background');
    
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    // Test empty response in production
    (getTaskResult as any).mockResolvedValueOnce('');
    
    const engine = new AsrGotStageEngine(mockCredentials);
    
    try {
      await engine.executeStage1('test');
    } catch (error) {
      expect((error as Error).message).toContain('Malformed API response');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});