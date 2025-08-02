import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AsrGotStageEngine } from '@/services/AsrGotStageEngine';
import type { APICredentials, GraphData, GraphNode, GraphEdge, HyperEdge } from '@/types/asrGotTypes';

// Mock the background utils
vi.mock('@/utils/background/utils', () => ({
  queueGeminiCall: vi.fn().mockReturnValue('task-id-123'),
  getTaskResult: vi.fn().mockResolvedValue(JSON.stringify({
    analysis: 'Test analysis content',
    field: 'Computer Science',
    objectives: ['Obj1: Test objective', 'Obj2: Second objective'],
    complexity_score: 1.5,
    evidence_sources: 10,
    final_report: '<div>Test final report</div>'
  }))
}));

// Mock apiService
vi.mock('@/services/apiService', () => ({
  callPerplexitySonarAPI: vi.fn().mockResolvedValue('Test Perplexity response')
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

describe('AsrGotStageEngine - Additional Coverage', () => {
  let engine: AsrGotStageEngine;
  let mockCredentials: APICredentials;
  let mockGraphData: GraphData;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockCredentials = {
      gemini: 'test-gemini-key',
      perplexity: 'test-perplexity-key',
      openai: 'test-openai-key'
    };

    // Create a more complex graph for testing edge cases
    mockGraphData = {
      nodes: [
        {
          id: 'node1',
          label: 'Test Node 1',
          type: 'evidence',
          confidence: [0.8, 0.7, 0.9, 0.6],
          metadata: {
            parameter_id: 'P1.1',
            type: 'evidence_node',
            source_description: 'Test source',
            value: 'test value',
            timestamp: new Date().toISOString()
          }
        },
        {
          id: 'node2',
          label: 'Test Node 2',
          type: 'hypothesis',
          confidence: [0.9, 0.8, 0.7, 0.8],
          metadata: {
            parameter_id: 'P1.2',
            type: 'hypothesis_node',
            source_description: 'Test hypothesis',
            value: 'hypothesis value',
            timestamp: new Date().toISOString()
          }
        }
      ],
      edges: [
        {
          id: 'edge1',
          source: 'node1',
          target: 'node2',
          type: 'supportive',
          confidence: 0.75,
          metadata: {
            parameter_id: 'P1.3',
            type: 'relationship',
            source_description: 'Test relationship',
            value: 'edge value',
            timestamp: new Date().toISOString()
          }
        }
      ],
      hyperedges: [
        {
          id: 'hyperedge1',
          nodes: ['node1', 'node2'],
          type: 'complex_relationship',
          confidence: 0.8,
          metadata: {
            parameter_id: 'P1.4',
            type: 'hyperedge',
            source_description: 'Test hyperedge',
            value: 'hyperedge value',
            timestamp: new Date().toISOString()
          }
        }
      ],
      metadata: {
        version: '1.0.0',
        created: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        stage: 1,
        total_nodes: 2,
        total_edges: 1,
        graph_metrics: {
          density: 0.5,
          centrality: {
            'node1': 0.8,
            'node2': 0.6
          }
        }
      }
    };

    engine = new AsrGotStageEngine(mockCredentials, mockGraphData);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor Edge Cases', () => {
    it('should handle undefined credentials', () => {
      const engineWithoutCreds = new AsrGotStageEngine();
      expect(engineWithoutCreds).toBeDefined();
      // Access private credentials through any casting for testing
      const creds = (engineWithoutCreds as any).credentials;
      expect(creds.gemini).toBe('');
      expect(creds.perplexity).toBe('');
      expect(creds.openai).toBe('');
    });

    it('should handle partial credentials', () => {
      const partialCreds = { gemini: 'test-key' };
      const engineWithPartialCreds = new AsrGotStageEngine(partialCreds as APICredentials);
      const creds = (engineWithPartialCreds as any).credentials;
      expect(creds.gemini).toBe('test-key');
      expect(creds.perplexity).toBe('');
      // Note: openai key is not added if not explicitly provided
      expect(Object.prototype.hasOwnProperty.call(creds, 'openai')).toBe(false);
    });

    it('should handle empty credentials object', () => {
      const emptyCreds = {};
      const engineWithEmptyCreds = new AsrGotStageEngine(emptyCreds as APICredentials);
      const creds = (engineWithEmptyCreds as any).credentials;
      expect(creds.gemini).toBe('');
      expect(creds.perplexity).toBe('');
      expect(creds.openai).toBe('');
    });

    it('should initialize without initial graph', () => {
      const engineWithoutGraph = new AsrGotStageEngine(mockCredentials);
      const graphData = (engineWithoutGraph as any).graphData;
      
      // Should have 3 knowledge nodes (K1, K2, K3) initialized by default
      expect(graphData.nodes).toHaveLength(3);
      expect(graphData.nodes[0].id).toBe('K1');
      expect(graphData.nodes[1].id).toBe('K2');
      expect(graphData.nodes[2].id).toBe('K3');
      expect(graphData.edges).toEqual([]);
      expect(graphData.metadata.stage).toBe(0);
    });

    it('should initialize with minimal graph data', () => {
      const minimalGraph = { nodes: [], edges: [], metadata: {} };
      const engineWithMinimalGraph = new AsrGotStageEngine(mockCredentials, minimalGraph as GraphData);
      const graphData = (engineWithMinimalGraph as any).graphData;
      
      // Even with minimal graph, should still have the provided nodes (empty in this case)
      // But K1-K3 nodes are added during initialization
      expect(graphData.nodes).toHaveLength(3);
      expect(graphData.nodes[0].id).toBe('K1');
      expect(graphData.edges).toEqual([]);
      expect(graphData.metadata.version).toBe('1.0.0');
    });
  });

  describe('Private Method Coverage', () => {
    it('should extract field from analysis text', () => {
      const analysis = 'The primary field: Environmental Science, and it focuses on climate studies.';
      const extractField = (engine as any).extractField;
      const field = extractField.call(engine, analysis);
      expect(field).toBe('Environmental Science');
    });

    it('should extract field when no clear pattern exists', () => {
      const analysis = 'This is a general analysis without clear field indicators.';
      const extractField = (engine as any).extractField;
      const field = extractField.call(engine, analysis);
      // The actual implementation returns 'General Science' for unmatched patterns
      expect(field).toBe('General Science');
    });

    it('should extract objectives from various formats', () => {
      const extractObjectives = (engine as any).extractObjectives;
      
      // Test comma-separated format
      const analysis1 = 'Objectives: Study climate change, Analyze data patterns, Research implications';
      const objectives1 = extractObjectives.call(engine, analysis1);
      expect(objectives1).toHaveLength(3);
      expect(objectives1[0]).toBe('Study climate change');
      
      // Test bullet point format
      const analysis2 = 'Goals:\n• First objective\n• Second objective\n• Third objective';
      const objectives2 = extractObjectives.call(engine, analysis2);
      expect(objectives2).toHaveLength(3);
      expect(objectives2[1]).toBe('Second objective');

      // Test semicolon format
      const analysis3 = 'Obj: First goal; Second goal; Third goal';
      const objectives3 = extractObjectives.call(engine, analysis3);
      expect(objectives3).toHaveLength(3);
      expect(objectives3[2]).toBe('Third goal');
    });

    it('should get valid edges from graph', () => {
      const getValidEdges = (engine as any).getValidEdges;
      const validEdges = getValidEdges.call(engine);
      expect(Array.isArray(validEdges)).toBe(true);
      expect(validEdges.length).toBeGreaterThanOrEqual(0);
    });

    it('should get valid hyperedges from graph', () => {
      const getValidHyperedges = (engine as any).getValidHyperedges;
      const validHyperedges = getValidHyperedges.call(engine);
      expect(Array.isArray(validHyperedges)).toBe(true);
      expect(validHyperedges.length).toBeGreaterThanOrEqual(0);
    });

    it('should extract dimension content with fallback', () => {
      const extractDimensionContent = (engine as any).extractDimensionContent;
      
      // Test with content that has proper separation
      const analysis = 'scope: This is the project scope\n\nobjectives: These are the objectives';
      const scope = extractDimensionContent.call(engine, analysis, 'scope');
      expect(scope).toBe('This is the project scope');
      
      const missing = extractDimensionContent.call(engine, analysis, 'missing_dimension');
      expect(missing).toContain('missing_dimension analysis for');
      
      const undefinedAnalysis = extractDimensionContent.call(engine, undefined, 'scope');
      expect(undefinedAnalysis).toContain('scope analysis for');
    });

    it('should extract hypothesis content with numbered patterns', () => {
      const extractHypothesisContent = (engine as any).extractHypothesisContent;
      
      const analysis = 'hypothesis_1: First hypothesis\nH2: Second hypothesis\nhypothesis_3: Third hypothesis';
      const h1 = extractHypothesisContent.call(engine, analysis, 1);
      expect(h1).toBe('First hypothesis');
      
      const h2 = extractHypothesisContent.call(engine, analysis, 2);
      expect(h2).toBe('Second hypothesis');
      
      const missing = extractHypothesisContent.call(engine, analysis, 5);
      expect(missing).toContain('Hypothesis 5 for');
    });

    it('should extract falsification criteria with patterns', () => {
      const extractFalsificationCriteria = (engine as any).extractFalsificationCriteria;
      
      const analysis = 'falsification_1: First criteria\nF2: Second criteria\nfalsification_3: Third criteria';
      const f1 = extractFalsificationCriteria.call(engine, analysis, 1);
      expect(f1).toBe('First criteria');
      
      const f2 = extractFalsificationCriteria.call(engine, analysis, 2);
      expect(f2).toBe('Second criteria');
      
      const missing = extractFalsificationCriteria.call(engine, analysis, 5);
      expect(missing).toContain('Specific testable criteria for');
    });

    it('should calculate average confidence correctly', () => {
      const calculateAverageConfidence = (engine as any).calculateAverageConfidence;
      const avgConfidence = calculateAverageConfidence.call(engine);
      expect(typeof avgConfidence).toBe('number');
      expect(avgConfidence).toBeGreaterThanOrEqual(0);
      expect(avgConfidence).toBeLessThanOrEqual(1);
    });

    it('should calculate average confidence with empty graph', () => {
      const emptyEngine = new AsrGotStageEngine(mockCredentials);
      // Note: Even "empty" engine has K1-K3 knowledge nodes with confidence [1,1,1,1]
      const calculateAverageConfidence = (emptyEngine as any).calculateAverageConfidence;
      const avgConfidence = calculateAverageConfidence.call(emptyEngine);
      // Should be 1.0 since K1-K3 nodes have maximum confidence
      expect(avgConfidence).toBe(1);
    });
  });

  describe('Public Method Coverage', () => {
    it('should return null for final HTML report initially', () => {
      const report = engine.getFinalHtmlReport();
      expect(report).toBeNull();
    });

    it('should return stage results array', () => {
      const results = engine.getStageResults();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0); // Initially empty
    });
  });

  describe('Stage Execution Error Handling', () => {
    it('should handle API errors in stage execution', async () => {
      // Mock API failure
      const { queueGeminiCall } = await import('@/utils/background/utils');
      vi.mocked(queueGeminiCall).mockReturnValue('failed-task-id');
      
      const { getTaskResult } = await import('@/utils/background/utils');
      vi.mocked(getTaskResult).mockRejectedValue(new Error('API failure'));

      await expect(engine.executeStage1('test query')).rejects.toThrow();
    });

    it('should handle malformed API responses', async () => {
      const { getTaskResult } = await import('@/utils/background/utils');
      vi.mocked(getTaskResult).mockResolvedValue('invalid json');

      await expect(engine.executeStage1('test query')).rejects.toThrow();
    });

    it('should handle missing required fields in API response', async () => {
      const { getTaskResult } = await import('@/utils/background/utils');
      vi.mocked(getTaskResult).mockResolvedValue(JSON.stringify({}));

      const result = await engine.executeStage1('test query');
      expect(result).toBeDefined();
      expect(result.result).toContain('html');
    });
  });

  describe('Complex Graph Operations', () => {
    it('should handle stage 2 decomposition with complex analysis', async () => {
      const { getTaskResult } = await import('@/utils/background/utils');
      vi.mocked(getTaskResult).mockResolvedValue(JSON.stringify({
        dimensions: {
          scope: 'Complex multi-dimensional scope analysis',
          objectives: 'Multi-faceted research objectives',
          constraints: 'Resource and methodological constraints',
          data_needs: 'Comprehensive data requirements',
          use_cases: 'Applied research applications',
          potential_biases: 'Selection and confirmation biases',
          knowledge_gaps: 'Identified research gaps'
        }
      }));

      const result = await engine.executeStage2();
      expect(result).toBeDefined();
      expect(result.graph).toBeDefined();
      expect(result.result).toContain('html');
    });

    it('should handle stage 3 hypothesis generation with multiple hypotheses', async () => {
      const { getTaskResult } = await import('@/utils/background/utils');
      vi.mocked(getTaskResult).mockResolvedValue(JSON.stringify({
        hypothesis_1: 'Primary research hypothesis with detailed explanation',
        hypothesis_2: 'Secondary hypothesis addressing alternative mechanism',
        hypothesis_3: 'Tertiary hypothesis for edge case scenarios',
        falsification_1: 'Criteria for rejecting primary hypothesis',
        falsification_2: 'Alternative falsification criteria',
        falsification_3: 'Edge case falsification conditions'
      }));

      const result = await engine.executeStage3();
      expect(result).toBeDefined();
      expect(result.graph).toBeDefined();
      expect(result.context).toBeDefined();
      expect(result.result).toContain('html');
    });

    it('should handle stage 4 evidence integration with causal analysis', async () => {
      const { getTaskResult } = await import('@/utils/background/utils');
      vi.mocked(getTaskResult).mockResolvedValue(JSON.stringify({
        evidence_sources: 25,
        causal_relationships: 12,
        confounding_factors: ['factor1', 'factor2', 'factor3'],
        causal_mechanisms: 'Detailed causal mechanism analysis',
        temporal_patterns: 'Temporal relationship patterns',
        counterfactual_analysis: 'Counterfactual reasoning results'
      }));

      const result = await engine.executeStage4();
      expect(result).toBeDefined();
      expect(result.graph).toBeDefined();
      expect(result.result).toContain('html');
    });
  });

  describe('Edge Case Handling', () => {
    it('should handle very long analysis text', async () => {
      const longText = 'A'.repeat(10000) + ' field: Test Field. ' + 'B'.repeat(10000);
      const extractField = (engine as any).extractField;
      const field = extractField.call(engine, longText);
      expect(field).toBe('Test Field');
    });

    it('should handle special characters in analysis', () => {
      const specialText = 'Field: Data Science & Machine Learning (AI/ML) Research';
      const extractField = (engine as any).extractField;
      const field = extractField.call(engine, specialText);
      expect(field).toBe('Data Science & Machine Learning (AI/ML) Research');
    });

    it('should handle empty or whitespace-only analysis', () => {
      const extractField = (engine as any).extractField;
      const emptyField = extractField.call(engine, '');
      expect(emptyField).toBe('General Science');
      
      const whitespaceField = extractField.call(engine, '   \n\t  ');
      expect(whitespaceField).toBe('General Science');
    });

    it('should handle malformed objective lists', () => {
      const extractObjectives = (engine as any).extractObjectives;
      
      const malformed = 'Objectives: , , empty items, , another objective, ';
      const objectives = extractObjectives.call(engine, malformed);
      expect(objectives.length).toBeGreaterThan(0);
      expect(objectives.every(obj => obj.trim().length > 0)).toBe(true);
    });
  });
});