import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AsrGotStageEngine } from '@/services/AsrGotStageEngine';
import type { APICredentials } from '@/types/asrGotTypes';

// Mock dependencies
vi.mock('@/utils/background/utils', () => ({
  queueGeminiCall: vi.fn().mockReturnValue('task-id'),
  getTaskResult: vi.fn().mockResolvedValue(JSON.stringify({
    primary_field: 'Test Science',
    objectives: ['Test objective']
  }))
}));

vi.mock('sonner', () => ({ 
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } 
}));

vi.mock('@/utils/informationTheory', () => ({
  calculateNodeInformationMetrics: vi.fn().mockReturnValue({ entropy: 0.5, complexity: 0.3, informationGain: 0.2 }),
  calculateEvidenceInformationMetrics: vi.fn().mockReturnValue({ entropy: 0.4, complexity: 0.2, informationGain: 0.3 }),
  calculateHypothesisInformationMetrics: vi.fn().mockReturnValue({ entropy: 0.6, complexity: 0.4, informationGain: 0.1 }),
  calculateGraphComplexity: vi.fn().mockReturnValue(2.5)
}));

describe('AsrGotStageEngine - Simple Branch Coverage', () => {
  let engine: AsrGotStageEngine;
  let mockCredentials: APICredentials;

  beforeEach(() => {
    mockCredentials = { gemini: 'test-key', perplexity: 'test-key' };
    vi.clearAllMocks();
  });

  describe('Constructor branches', () => {
    it('should handle credentials with openai property set', () => {
      const creds = { gemini: 'test', perplexity: 'test', openai: 'test-openai' };
      engine = new AsrGotStageEngine(creds);
      expect(engine).toBeInstanceOf(AsrGotStageEngine);
    });

    it('should handle undefined credentials', () => {
      engine = new AsrGotStageEngine();
      expect(engine).toBeInstanceOf(AsrGotStageEngine);
    });

    it('should handle empty credentials', () => {
      engine = new AsrGotStageEngine({} as APICredentials);
      expect(engine).toBeInstanceOf(AsrGotStageEngine);
    });

    it('should handle graph with metadata', () => {
      const graph = {
        nodes: [],
        edges: [],
        hyperedges: [],
        metadata: {
          version: '2.0.0',
          created: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          stage: 1,
          total_nodes: 0,
          total_edges: 0,
          graph_metrics: {}
        }
      };
      engine = new AsrGotStageEngine(mockCredentials, graph);
      expect(engine).toBeInstanceOf(AsrGotStageEngine);
    });

    it('should handle graph without metadata', () => {
      const graph = {
        nodes: [],
        edges: [],
        hyperedges: []
      } as any;
      engine = new AsrGotStageEngine(mockCredentials, graph);
      expect(engine).toBeInstanceOf(AsrGotStageEngine);
    });
  });

  describe('Basic stage execution branches', () => {
    beforeEach(() => {
      engine = new AsrGotStageEngine(mockCredentials);
    });

    it('should execute stage 1 successfully', async () => {
      const result = await engine.executeStage1('Test research task');
      expect(result).toBeDefined();
      expect(result.context.field).toBe('Test Science');
    });

    it('should handle test environment fallback', async () => {
      const { getTaskResult } = await import('@/utils/background/utils');
      vi.mocked(getTaskResult).mockResolvedValue('');

      const result = await engine.executeStage1('Empty response test');
      expect(result.context.field).toBe('Test Science');
    });

    it('should handle production environment error', async () => {
      const { getTaskResult } = await import('@/utils/background/utils');
      vi.mocked(getTaskResult).mockResolvedValue('invalid json');

      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        await expect(engine.executeStage1('Production test'))
          .rejects.toThrow('Malformed API response: Invalid or empty JSON');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('should execute stage 2 after stage 1', async () => {
      const { getTaskResult } = await import('@/utils/background/utils');
      
      vi.mocked(getTaskResult)
        .mockResolvedValueOnce(JSON.stringify({ primary_field: 'Test Science', objectives: ['Test'] }))
        .mockResolvedValueOnce(JSON.stringify({ dimensions: { scope: 'Test scope' } }));

      await engine.executeStage1('Test');
      const result = await engine.executeStage2();
      expect(result).toBeDefined();
    });

    it('should execute stage 3 after stages 1-2', async () => {
      const { getTaskResult } = await import('@/utils/background/utils');
      
      vi.mocked(getTaskResult)
        .mockResolvedValueOnce(JSON.stringify({ primary_field: 'Test Science', objectives: ['Test'] }))
        .mockResolvedValueOnce(JSON.stringify({ dimensions: { scope: 'Test scope' } }))
        .mockResolvedValueOnce('Hypothesis content');

      await engine.executeStage1('Test');
      await engine.executeStage2();
      const result = await engine.executeStage3();
      expect(result).toBeDefined();
    });

    it('should execute stage 4 after stages 1-3', async () => {
      const { getTaskResult } = await import('@/utils/background/utils');
      
      vi.mocked(getTaskResult)
        .mockResolvedValueOnce(JSON.stringify({ primary_field: 'Test Science', objectives: ['Test'] }))
        .mockResolvedValueOnce(JSON.stringify({ dimensions: { scope: 'Test scope' } }))
        .mockResolvedValueOnce('Hypothesis content')
        .mockResolvedValueOnce('Evidence with sample size: 1000, p-value: 0.05');

      await engine.executeStage1('Test');
      await engine.executeStage2();
      await engine.executeStage3();
      const result = await engine.executeStage4();
      expect(result).toBeDefined();
    });
  });

  describe('Method access through public interface', () => {
    beforeEach(() => {
      engine = new AsrGotStageEngine(mockCredentials);
    });

    it('should get graph data', () => {
      const graph = engine.getGraphData();
      expect(graph).toBeDefined();
      expect(graph.nodes).toBeDefined();
      expect(graph.edges).toBeDefined();
    });

    it('should get stage results initially empty', () => {
      const results = engine.getStageResults();
      expect(results).toEqual([]);
    });

    it('should get final HTML report initially null', () => {
      const html = engine.getFinalHtmlReport();
      expect(html).toBeNull();
    });
  });

  describe('Private method coverage via fallback paths', () => {
    beforeEach(() => {
      engine = new AsrGotStageEngine(mockCredentials);
    });

    it('should handle extractField with malformed content', async () => {
      const { getTaskResult } = await import('@/utils/background/utils');
      // Return malformed JSON that triggers extractField
      vi.mocked(getTaskResult).mockResolvedValue('{ field: Biology, incomplete');

      const result = await engine.executeStage1('Malformed test');
      expect(result.context.field).toBe('Biology'); // extractField fallback
    });

    it('should handle extractObjectives with malformed content', async () => {
      const { getTaskResult } = await import('@/utils/background/utils');
      // Return malformed JSON that triggers extractObjectives
      vi.mocked(getTaskResult).mockResolvedValue('{ objectives: Test obj 1, Test obj 2, incomplete');

      const result = await engine.executeStage1('Objectives test');
      expect(result.context.objectives).toContain('Test obj 1');
    });

    it('should handle missing dimension content', async () => {
      const { getTaskResult } = await import('@/utils/background/utils');
      
      vi.mocked(getTaskResult)
        .mockResolvedValueOnce(JSON.stringify({ primary_field: 'Test Science', objectives: ['Test'] }))
        .mockResolvedValueOnce(JSON.stringify({ dimensions: { scope: 'Available scope' } }));

      await engine.executeStage1('Test');
      const result = await engine.executeStage2();
      expect(result.graph.nodes.length).toBeGreaterThan(1);
    });

    it('should handle stage 3 without dimension nodes', async () => {
      const { getTaskResult } = await import('@/utils/background/utils');
      
      // Execute stage 1 only
      vi.mocked(getTaskResult).mockResolvedValue(JSON.stringify({
        primary_field: 'Test Science',
        objectives: ['Test']
      }));

      await engine.executeStage1('Test');
      
      // Execute stage 3 without stage 2
      vi.mocked(getTaskResult).mockResolvedValue('Hypothesis content');
      const result = await engine.executeStage3();
      expect(result.graph.nodes.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Different statistical indicators', () => {
    beforeEach(async () => {
      engine = new AsrGotStageEngine(mockCredentials);
      const { getTaskResult } = await import('@/utils/background/utils');
      
      // Set up stages 1-3
      vi.mocked(getTaskResult)
        .mockResolvedValueOnce(JSON.stringify({ primary_field: 'Stats Science', objectives: ['Test'] }))
        .mockResolvedValueOnce(JSON.stringify({ dimensions: { scope: 'Stats scope' } }))
        .mockResolvedValueOnce('Hypothesis content');

      await engine.executeStage1('Stats test');
      await engine.executeStage2();
      await engine.executeStage3();
    });

    it('should handle high quality evidence', async () => {
      const { getTaskResult } = await import('@/utils/background/utils');
      vi.mocked(getTaskResult).mockResolvedValue(
        'Evidence with sample size: 2000, effect size: 0.8, p-value: 0.001, randomized controlled trial, peer-reviewed'
      );

      const result = await engine.executeStage4();
      expect(result.graph.nodes.length).toBeGreaterThan(3);
    });

    it('should handle low quality evidence', async () => {
      const { getTaskResult } = await import('@/utils/background/utils');
      vi.mocked(getTaskResult).mockResolvedValue(
        'Evidence with sample size: 20, effect size: 0.1, p-value: 0.9, case study, anecdotal'
      );

      const result = await engine.executeStage4();
      expect(result.graph.nodes.length).toBeGreaterThan(3);
    });

    it('should handle meta-analysis evidence', async () => {
      const { getTaskResult } = await import('@/utils/background/utils');
      vi.mocked(getTaskResult).mockResolvedValue(
        'Evidence with meta-analysis, effect size: 0.6, p-value: 0.02, systematic review'
      );

      const result = await engine.executeStage4();
      expect(result.graph.nodes.length).toBeGreaterThan(3);
    });
  });
});