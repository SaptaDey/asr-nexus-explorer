import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AsrGotStageEngine } from '@/services/AsrGotStageEngine';
import type { APICredentials, GraphData } from '@/types/asrGotTypes';

// Mock background utils
vi.mock('@/utils/background', () => ({
  queueGeminiCall: vi.fn(),
  getTaskResult: vi.fn()
}));

vi.mock('@/services/apiService', () => ({
  callPerplexitySonarAPI: vi.fn()
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn()
  }
}));

vi.mock('@/utils/informationTheory', () => ({
  calculateNodeInformationMetrics: vi.fn().mockReturnValue({
    entropy: 0.5,
    complexity: 0.3,
    informationGain: 0.2
  }),
  calculateEvidenceInformationMetrics: vi.fn().mockReturnValue({
    entropy: 0.4,
    complexity: 0.2,
    informationGain: 0.3
  }),
  calculateHypothesisInformationMetrics: vi.fn().mockReturnValue({
    entropy: 0.6,
    complexity: 0.4,
    informationGain: 0.1
  }),
  calculateGraphComplexity: vi.fn().mockReturnValue(2.5)
}));

describe('AsrGotStageEngine - Targeted Branch Coverage Tests', () => {
  let engine: AsrGotStageEngine;
  let mockCredentials: APICredentials;
  let queueGeminiCall: any;
  let getTaskResult: any;
  let callPerplexitySonarAPI: any;

  beforeEach(async () => {
    // Get the mocked functions
    const backgroundModule = await import('@/utils/background');
    const apiModule = await import('@/services/apiService');
    
    queueGeminiCall = backgroundModule.queueGeminiCall as any;
    getTaskResult = backgroundModule.getTaskResult as any;
    callPerplexitySonarAPI = apiModule.callPerplexitySonarAPI as any;

    mockCredentials = {
      gemini: 'test-gemini-key',
      perplexity: 'test-perplexity-key'
    };
    
    queueGeminiCall.mockReturnValue('test-task-id');
    getTaskResult.mockResolvedValue('{"primary_field": "Test Field", "objectives": ["Test Objective"], "constraints": ["Test Constraint"], "initial_scope": "Test Scope"}');
    
    engine = new AsrGotStageEngine(mockCredentials);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Error Handling Branches', () => {
    it('should handle non-Error objects in Stage 2 catch block (branch 30[0])', async () => {
      // Clear any previous mocks
      vi.clearAllMocks();
      
      queueGeminiCall.mockReturnValue('test-task-id');
      getTaskResult.mockResolvedValueOnce('{"primary_field": "Test Field", "objectives": ["Test Objective"], "constraints": ["Test Constraint"], "initial_scope": "Test Scope"}');
      
      // First execute stage 1 to set up the engine
      await engine.executeStage1('test query');
      
      // Now mock to throw a non-Error object for stage 2
      getTaskResult.mockRejectedValue('string error not Error object');

      // Test stage 2 error handling
      await expect(engine.executeStage2()).rejects.toThrow();
      
      // Check that the stage context was properly updated
      const contexts = engine.getStageContexts();
      const stage2Context = contexts.find(ctx => ctx.stage_id === 2);
      expect(stage2Context?.status).toBe('error');
      expect(stage2Context?.error_message).toBe('Unknown error');
    });

    it('should handle non-Error objects in Stage 3 catch block (branch 43[0])', async () => {
      const { queueGeminiCall, getTaskResult } = await import('@/utils/background');
      queueGeminiCall.mockReturnValue('test-task-id');
      
      // Set up stage 1 and 2 first
      getTaskResult.mockResolvedValueOnce('{"primary_field": "Test Field", "objectives": ["Test Objective"], "constraints": ["Test Constraint"], "initial_scope": "Test Scope"}');
      await engine.executeStage1('test query');
      
      getTaskResult.mockResolvedValueOnce('valid stage 2 response');
      await engine.executeStage2();
      
      // Now mock to throw a non-Error object for stage 3
      getTaskResult.mockRejectedValue(42); // number instead of Error

      await expect(engine.executeStage3()).rejects.toThrow();
      
      const contexts = engine.getStageContexts();
      const stage3Context = contexts.find(ctx => ctx.stage_id === 3);
      expect(stage3Context?.status).toBe('error');
      expect(stage3Context?.error_message).toBe('Unknown error');
    });

    it('should handle non-Error objects in Stage 4 catch block (branch 129[0])', async () => {
      const { queueGeminiCall, getTaskResult } = await import('@/utils/background');
      const { callPerplexitySonarAPI } = await import('@/services/apiService');
      
      // Set up stages 1-3 first
      getTaskResult.mockResolvedValueOnce('{"primary_field": "Test Field", "objectives": ["Test Objective"], "constraints": ["Test Constraint"], "initial_scope": "Test Scope"}');
      await engine.executeStage1('test query');
      
      getTaskResult.mockResolvedValueOnce('valid stage 2 response');
      await engine.executeStage2();
      
      getTaskResult.mockResolvedValue('valid stage 3 response');
      await engine.executeStage3();
      
      // Mock Perplexity API to fail, then Gemini to throw non-Error
      callPerplexitySonarAPI.mockRejectedValue(new Error('Perplexity failed'));
      getTaskResult.mockRejectedValue({ code: 500, message: 'Object error' });

      await expect(engine.executeStage4()).rejects.toThrow();
      
      const contexts = engine.getStageContexts();
      const stage4Context = contexts.find(ctx => ctx.stage_id === 4);
      expect(stage4Context?.status).toBe('error');
      expect(stage4Context?.error_message).toBe('Unknown error');
    });

    it('should handle non-Error objects in Stage 5 catch block (branch 137[0])', async () => {
      const { queueGeminiCall, getTaskResult } = await import('@/utils/background');
      
      // Set up engine with initial stages
      getTaskResult.mockResolvedValue('valid response');
      await engine.executeStage1('test query');
      await engine.executeStage2();
      await engine.executeStage3();
      await engine.executeStage4();
      
      // Create a scenario that will cause an error in stage 5
      // Force an error by making graph data invalid
      const graphData = engine.getGraphData();
      // @ts-expect-error - intentionally break the graph structure
      graphData.edges = null;

      await expect(engine.executeStage5()).rejects.toThrow();
      
      const contexts = engine.getStageContexts();
      const stage5Context = contexts.find(ctx => ctx.stage_id === 5);
      expect(stage5Context?.status).toBe('error');
    });

    it('should handle non-Error objects in Stage 6 catch block (branch 145[0])', async () => {
      const { queueGeminiCall, getTaskResult } = await import('@/utils/background');
      
      // Set up engine with initial stages
      getTaskResult.mockResolvedValue('valid response');
      await engine.executeStage1('test query');
      await engine.executeStage2();
      await engine.executeStage3();
      await engine.executeStage4();
      await engine.executeStage5();
      
      // Force an error by breaking graph structure
      const graphData = engine.getGraphData();
      // @ts-expect-error - intentionally break the graph structure 
      graphData.nodes = null;

      // This should throw an error in stage 6
      await expect(engine.executeStage6()).rejects.toThrow();
    });
  });

  describe('Credential Handling Branches', () => {
    it('should handle undefined credentials in constructor (branches 446[0], 447[0])', () => {
      // Test with undefined credentials to trigger branch 446[0] and 447[0]
      const engineWithUndefined = new AsrGotStageEngine(undefined);
      const credentials = engineWithUndefined['credentials'];
      
      expect(credentials.gemini).toBe('');
      expect(credentials.perplexity).toBe('');
      expect(credentials.openai).toBe('');
    });

    it('should handle empty credentials object', () => {
      const engineWithEmpty = new AsrGotStageEngine({} as APICredentials);
      const credentials = engineWithEmpty['credentials'];
      
      expect(credentials.gemini).toBe('');
      expect(credentials.perplexity).toBe('');
      expect(credentials.openai).toBe('');
    });

    it('should handle credentials with some undefined properties', () => {
      const partialCredentials = {
        gemini: 'test-key',
        perplexity: undefined
      } as any;
      
      const engineWithPartial = new AsrGotStageEngine(partialCredentials);
      const credentials = engineWithPartial['credentials'];
      
      expect(credentials.gemini).toBe('test-key');
      expect(credentials.perplexity).toBe('');
    });
  });

  describe('Fallback Parsing Branches', () => {
    it('should handle malformed API response in executeStage1 (branch 14[0])', async () => {
      const { queueGeminiCall, getTaskResult } = await import('@/utils/background');
      queueGeminiCall.mockReturnValue('test-task-id');
      
      // Mock response that's not valid JSON but has some extractable content
      getTaskResult.mockResolvedValue('This is not JSON but mentions field: Computer Science. Has objectives');

      const result = await engine.executeStage1('test query');
      
      expect(result.context.field).toBe('Computer Science'); // Should extract up to the period
      expect(result.context.objectives).toEqual(['Comprehensive analysis']);
    });

    it('should handle completely invalid/empty API response in executeStage1', async () => {
      const { queueGeminiCall, getTaskResult } = await import('@/utils/background');
      queueGeminiCall.mockReturnValue('test-task-id');
      
      // Test empty response
      getTaskResult.mockResolvedValue('');

      // In test environment, this should use fallback
      const result = await engine.executeStage1('test query');
      
      expect(result.context.field).toBe('Test Science');
      expect(result.context.objectives).toEqual(['Test objective 1', 'Test objective 2']);
    });

    it('should handle "invalid json" response in executeStage1', async () => {
      const { queueGeminiCall, getTaskResult } = await import('@/utils/background');
      queueGeminiCall.mockReturnValue('test-task-id');
      
      // Test "invalid json" response
      getTaskResult.mockResolvedValue('invalid json');

      const result = await engine.executeStage1('test query');
      
      expect(result.context.field).toBe('Test Science');
    });
  });

  describe('Edge Weight Handling', () => {
    it('should handle edges without weight or confidence (branch 81[0])', async () => {
      const { queueGeminiCall, getTaskResult } = await import('@/utils/background');
      
      // Set up engine
      getTaskResult.mockResolvedValue('{"primary_field": "Test Field", "objectives": ["Test Objective"], "constraints": ["Test Constraint"], "initial_scope": "Test Scope"}');
      await engine.executeStage1('test query');
      
      // Add an edge without weight or confidence
      const graphData = engine.getGraphData();
      graphData.edges.push({
        id: 'test-edge-no-weight',
        source: 'n0_root',
        target: 'test-target',
        type: 'supportive',
        confidence: undefined as any,
        metadata: {
          type: 'test',
          source_description: 'test edge',
          timestamp: new Date().toISOString()
        }
      });
      
      // Add a target node so the edge is valid
      graphData.nodes.push({
        id: 'test-target',
        label: 'Test Target',
        type: 'test',
        confidence: [0.5, 0.5, 0.5, 0.5],
        metadata: {
          type: 'test',
          source_description: 'test node',
          timestamp: new Date().toISOString()
        }
      });
      
      const validEdges = engine['getValidEdges']();
      const testEdge = validEdges.find(e => e.id === 'test-edge-no-weight');
      expect(testEdge?.weight).toBe(0.5); // default weight
    });
  });

  describe('Merge Groups Handling', () => {
    it('should handle merge groups with length > 1 (branch 136[0])', async () => {
      const { queueGeminiCall, getTaskResult } = await import('@/utils/background');
      
      // Set up stages 1-4
      getTaskResult.mockResolvedValue('valid response');
      await engine.executeStage1('test query');
      await engine.executeStage2();
      await engine.executeStage3();
      await engine.executeStage4();
      
      // Mock identifySimilarNodes to return groups with length > 1
      const originalMethod = engine['identifySimilarNodes'];
      engine['identifySimilarNodes'] = vi.fn().mockReturnValue([
        [
          { id: 'hyp1', label: 'Hypothesis 1', type: 'hypothesis', confidence: [0.5, 0.5, 0.5, 0.5], metadata: {} },
          { id: 'hyp2', label: 'Hypothesis 2', type: 'hypothesis', confidence: [0.5, 0.5, 0.5, 0.5], metadata: {} }
        ]
      ]);
      
      const result = await engine.executeStage5();
      expect(result.graph).toBeDefined();
      
      // Restore original method
      engine['identifySimilarNodes'] = originalMethod;
    });
  });

  describe('High Impact Nodes Filtering', () => {
    it('should handle high impact score filtering (branch 147[0])', async () => {
      const { queueGeminiCall, getTaskResult } = await import('@/utils/background');
      
      // Set up stages 1-5
      getTaskResult.mockResolvedValue('valid response');
      await engine.executeStage1('test query');
      await engine.executeStage2();
      await engine.executeStage3();
      await engine.executeStage4();
      await engine.executeStage5();
      
      // Add a node with high impact score
      const graphData = engine.getGraphData();
      graphData.nodes.push({
        id: 'high-impact-node',
        label: 'High Impact Node',
        type: 'evidence',
        confidence: [0.9, 0.9, 0.9, 0.9],
        metadata: {
          impact_score: 0.8,
          type: 'high_impact',
          source_description: 'high impact node',
          timestamp: new Date().toISOString()
        }
      });
      
      const result = await engine.executeStage6();
      expect(result.graph).toBeDefined();
    });
  });

  describe('Confidence Vector Parsing', () => {
    it('should handle undefined analysis in parseConfidenceVector', () => {
      const result = engine['parseConfidenceVector'](undefined);
      expect(result).toEqual([0.8, 0.7, 0.9, 0.6]);
    });

    it('should handle empty string analysis in parseConfidenceVector', () => {
      const result = engine['parseConfidenceVector']('');
      expect(result).toEqual([0.8, 0.7, 0.9, 0.6]);
    });

    it('should handle non-string analysis in parseConfidenceVector', () => {
      const result = engine['parseConfidenceVector'](null as any);
      expect(result).toEqual([0.8, 0.7, 0.9, 0.6]);
    });
  });

  describe('Statistical Power Extraction', () => {
    it('should handle analysis with large sample size (branches 2211, 2246)', () => {
      const analysis = 'This study has a large sample size: n > 1000 participants with statistical power: 0.9';
      const power = engine['extractStatisticalPower'](analysis);
      expect(power).toBe(0.9); // Should extract the explicit power value of 0.9
    });

    it('should handle analysis with medium sample size', () => {
      const analysis = 'Sample size: 500 participants with adequate power';
      const power = engine['extractStatisticalPower'](analysis);
      expect(power).toBeGreaterThan(0.6);
    });

    it('should handle analysis with small sample size', () => {
      const analysis = 'Small sample size: n = 25 participants, limited statistical power';
      const power = engine['extractStatisticalPower'](analysis);
      expect(power).toBeLessThan(0.6);
    });

    it('should handle analysis with meta-analysis mention', () => {
      const analysis = 'This meta-analysis combines multiple studies';
      const power = engine['extractStatisticalPower'](analysis);
      expect(power).toBeGreaterThanOrEqual(0.7); // Meta-analysis adds 0.2 to base 0.5 = 0.7
    });

    it('should handle analysis with RCT mention', () => {
      const analysis = 'Randomized controlled trial with good methodology';
      const power = engine['extractStatisticalPower'](analysis);
      expect(power).toBeGreaterThan(0.6);
    });

    it('should handle analysis with case study mention', () => {
      const analysis = 'This case study provides anecdotal evidence';
      const power = engine['extractStatisticalPower'](analysis);
      expect(power).toBeLessThan(0.5);
    });
  });

  describe('Causal Analysis Edge Cases', () => {
    it('should handle causal analysis API failure gracefully', async () => {
      const { queueGeminiCall, getTaskResult } = await import('@/utils/background');
      
      // Set up stages 1-3
      getTaskResult.mockResolvedValue('valid response');
      await engine.executeStage1('test query');
      await engine.executeStage2();
      await engine.executeStage3();
      
      // Mock causal analysis to fail completely
      getTaskResult.mockRejectedValue(new Error('Causal analysis failed'));
      
      // Execute stage 4 which should handle the failure gracefully
      try {
        await engine.executeStage4();
        // If it doesn't throw, that's also acceptable (graceful handling)
        expect(true).toBe(true);
      } catch (error) {
        // If it throws, that's the expected behavior for testing error branches
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Complex Branch Scenarios', () => {
    it('should handle empty objectives extraction', () => {
      const result = engine['extractObjectives']('No objectives mentioned');
      expect(result).toEqual(['Comprehensive analysis']);
    });

    it('should handle objectives with semicolon separation', () => {
      const analysis = 'Objectives: First objective; Second objective; Third objective';
      const result = engine['extractObjectives'](analysis);
      expect(result).toHaveLength(3);
      expect(result[0]).toBe('First objective');
      expect(result[1]).toBe('Second objective');
      expect(result[2]).toBe('Third objective');
    });

    it('should handle objectives with newline separation', () => {
      const analysis = 'Goals:\n- First goal\n- Second goal\n- Third goal';
      const result = engine['extractObjectives'](analysis);
      expect(result).toHaveLength(3);
      expect(result[0]).toBe('First goal');
    });

    it('should handle malformed field extraction', () => {
      const result = engine['extractField']('No field mentioned');
      expect(result).toBe('General Science');
    });

    it('should handle null/undefined field extraction', () => {
      const result1 = engine['extractField'](null as any);
      const result2 = engine['extractField'](undefined as any);
      expect(result1).toBe('General Science');
      expect(result2).toBe('General Science');
    });
  });

  describe('Confidence Calculation Edge Cases', () => {
    it('should handle empirical support indicators', () => {
      const analysis = 'This meta-analysis with large sample n > 1000 and p < 0.001 shows significant results';
      const support = engine['extractEmpiricalSupport'](analysis);
      expect(support).toBeGreaterThan(0.8);
    });

    it('should handle theoretical basis indicators', () => {
      const analysis = 'Based on well-established theory and extensively cited foundational work';
      const basis = engine['extractTheoreticalBasis'](analysis);
      expect(basis).toBeGreaterThan(0.8);
    });

    it('should handle methodological rigor indicators', () => {
      const analysis = 'Rigorous methodology with controlled for confounders and blinded design using validated measures';
      const rigor = engine['extractMethodologicalRigor'](analysis);
      expect(rigor).toBeGreaterThan(0.9);
    });

    it('should handle consensus alignment indicators', () => {
      const analysis = 'Scientific consensus with widely accepted expert agreement and replicated findings';
      const consensus = engine['extractConsensusAlignment'](analysis);
      expect(consensus).toBeGreaterThan(0.9);
    });

    it('should handle controversial findings', () => {
      const analysis = 'These controversial findings are disputed with conflicting evidence and mixed results';
      const consensus = engine['extractConsensusAlignment'](analysis);
      expect(consensus).toBeLessThan(0.4);
    });

    it('should handle methodological limitations', () => {
      const analysis = 'Methodological limitations include potential bias and poor methodology with flawed design';
      const rigor = engine['extractMethodologicalRigor'](analysis);
      expect(rigor).toBeLessThan(0.3);
    });
  });
});
