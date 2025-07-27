import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AsrGotStageEngine } from '@/services/AsrGotStageEngine';
import { mockAPICredentials, mockGraphData, mockStageResults } from '@/test/mocks/mockServices';
import { testQueries, testGraphData, testStageResults } from '@/test/fixtures/testData';
import type { APICredentials, GraphData, StageExecutionContext, ResearchContext } from '@/types/asrGotTypes';

// Mock the background utils to avoid circular import issues
vi.mock('@/utils/background/utils', () => ({
  queueGeminiCall: vi.fn().mockReturnValue('task-id-123'),
  getTaskResult: vi.fn().mockResolvedValue(JSON.stringify({
    primary_field: 'Environmental Science',
    secondary_fields: ['Biology', 'Chemistry'],
    objectives: ['Analyze climate impact', 'Study marine life changes'],
    interdisciplinary_connections: ['Oceanography', 'Ecology'],
    constraints: ['Data availability', 'Time constraints'],
    initial_scope: 'Comprehensive climate change analysis',
    
    // Stage 2 Decomposition mock data
    dimensions: {
      scope: 'Comprehensive environmental impact assessment',
      objectives: 'Study marine ecosystem changes due to climate factors',
      constraints: 'Limited to published research from 2020-2024',
      data_needs: 'Peer-reviewed studies, oceanographic data',
      use_cases: 'Policy recommendations, conservation strategies',
      potential_biases: 'Publication bias, geographic sampling bias',
      knowledge_gaps: 'Long-term ecosystem interaction effects'
    },
    
    // Stage 3 Hypothesis mock data  
    hypothesis_1: 'Ocean acidification significantly impacts coral reef systems',
    hypothesis_2: 'Rising temperatures alter marine food chain dynamics',
    hypothesis_3: 'Sea level changes affect coastal ecosystem migration',
    falsification_1: 'No correlation between pH levels and coral bleaching',
    falsification_2: 'Temperature changes show no ecosystem impact',
    falsification_3: 'Coastal changes are independent of sea level rise',
    
    // Stage 4 Evidence mock data
    evidence_sources: 15,
    causal_relationships: 8,
    confounding_factors: ['natural climate cycles', 'human pollution'],
    causal_mechanisms: 'pH reduction leads to calcium carbonate dissolution',
    temporal_patterns: 'accelerating trend over past decade',
    
    // Additional stage mock data
    complexity_score: 2.3,
    pathways_identified: 2,
    citations_count: 28,
    bias_flags: 0,
    statistical_tests: 12
  }))
}));

vi.mock('@/utils/background', () => ({
  queueGeminiCall: vi.fn().mockReturnValue('task-id-123'),
  getTaskResult: vi.fn().mockResolvedValue(JSON.stringify({
    primary_field: 'Environmental Science',
    secondary_fields: ['Biology', 'Chemistry'],
    objectives: ['Analyze climate impact', 'Study marine life changes'],
    interdisciplinary_connections: ['Oceanography', 'Ecology'],
    constraints: ['Data availability', 'Time constraints'],
    initial_scope: 'Comprehensive climate change analysis',
    
    // Mock formatted text responses that contain patterns for regex matching
    formatted_text: `
    Field: Environmental Science
    Objectives: Analyze climate impact, Study marine life changes
    Hypothesis 1: Ocean acidification significantly impacts coral reef systems
    Hypothesis 2: Rising temperatures alter marine food chain dynamics  
    Hypothesis 3: Sea level changes affect coastal ecosystem migration
    Falsification: No correlation between pH levels and coral bleaching
    Confounding factors: natural climate cycles, human pollution
    Causal mechanisms: pH reduction leads to calcium carbonate dissolution
    Temporal patterns: accelerating trend over past decade
    Statistical power: 0.85
    Sample size: 1,250
    Effect size: 0.4
    P-value: 0.001
    `
  })),
  backgroundProcessor: {
    addTask: vi.fn().mockReturnValue('task-id-123'),
    getTaskResult: vi.fn().mockResolvedValue(JSON.stringify({ 
      success: true, 
      data: `Field: Environmental Science
Objectives: Analyze climate impact, Study marine life changes
Hypothesis 1: Ocean acidification significantly impacts coral reef systems
Falsification: No correlation between pH levels and coral bleaching
Statistical power: 0.85`
    })),
    getTaskStatus: vi.fn().mockReturnValue('completed')
  }
}));

// Mock the API service
vi.mock('@/services/apiService', () => ({
  callPerplexitySonarAPI: vi.fn().mockResolvedValue({
    content: 'Mock Perplexity evidence',
    sources: ['https://example.com/source1'],
    usage: { total_tokens: 150 }
  })
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  }
}));

// Mock information theory utils
vi.mock('@/utils/informationTheory', () => ({
  calculateNodeInformationMetrics: vi.fn().mockReturnValue({
    entropy: 2.5,
    complexity: 1.8,
    information_gain: 0.7
  }),
  calculateEvidenceInformationMetrics: vi.fn().mockReturnValue({
    entropy: 2.1,
    complexity: 1.5,
    information_gain: 0.8
  }),
  calculateHypothesisInformationMetrics: vi.fn().mockReturnValue({
    entropy: 1.9,
    complexity: 2.0,
    information_gain: 0.9
  }),
  calculateGraphComplexity: vi.fn().mockReturnValue(2.3)
}));

describe('AsrGotStageEngine', () => {
  let stageEngine: AsrGotStageEngine;
  let mockCredentials: APICredentials;
  let mockGraph: GraphData;

  beforeEach(() => {
    mockCredentials = { ...mockAPICredentials };
    mockGraph = JSON.parse(JSON.stringify(testGraphData));
    stageEngine = new AsrGotStageEngine(mockCredentials, mockGraph);
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with provided credentials and graph data', () => {
      expect(stageEngine).toBeInstanceOf(AsrGotStageEngine);
      expect(stageEngine['credentials']).toEqual(mockCredentials);
      // The constructor adds knowledge nodes (K1-K3) to the graph
      expect(stageEngine['graphData'].nodes.length).toBe(7); // 4 original + 3 knowledge nodes
      expect(stageEngine['graphData'].edges).toEqual(mockGraph.edges);
      expect(stageEngine['graphData'].metadata).toEqual(expect.objectContaining({
        version: mockGraph.metadata.version,
        stage: mockGraph.metadata.stage
      }));
      // Verify knowledge nodes were added
      const knowledgeNodes = stageEngine['graphData'].nodes.filter(node => 
        node.type === 'knowledge' && node.id?.startsWith('K')
      );
      expect(knowledgeNodes.length).toBe(3);
      // Verify original nodes are still there
      const originalNodes = stageEngine['graphData'].nodes.filter(node => 
        node.type !== 'knowledge'
      );
      expect(originalNodes.length).toBe(4);
    });

    it('should initialize with default values when no parameters provided', () => {
      const defaultEngine = new AsrGotStageEngine();
      
      expect(defaultEngine['credentials']).toEqual({ 
        gemini: '', 
        perplexity: '', 
        openai: '' 
      });
      // Knowledge nodes (K1-K3) are automatically added during initialization
      expect(defaultEngine['graphData'].nodes.length).toBeGreaterThan(0);
      expect(defaultEngine['graphData'].edges).toEqual([]);
      // Check that knowledge nodes are present
      const knowledgeNodes = defaultEngine['graphData'].nodes.filter(node => 
        node.type === 'knowledge' && node.id?.startsWith('K')
      );
      expect(knowledgeNodes.length).toBe(3); // K1, K2, K3
    });

    it('should initialize knowledge nodes (K1-K3)', () => {
      const graphData = stageEngine['graphData'];
      const knowledgeNodes = graphData.nodes?.filter(node => 
        node.id?.startsWith('K') && node.type === 'knowledge'
      );
      
      expect(knowledgeNodes).toBeDefined();
      expect(knowledgeNodes?.length).toBeGreaterThan(0);
    });
  });

  describe('Stage Execution', () => {
    it('should execute stage 1 (Initialization) successfully', async () => {
      const query = testQueries.simple;
      
      const result = await stageEngine.executeStage(1, query);
      
      expect(result).toBeDefined();
      expect(result.stage).toBe(1);
      expect(result.status).toBe('completed');
      expect(result.content).toContain('initialization');
      expect(result.nodes).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should execute stage 2 (Decomposition) with proper context chaining', async () => {
      const query = testQueries.complex;
      
      // First execute stage 1 to set up context
      await stageEngine.executeStage(1, query);
      
      // Then execute stage 2
      const result = await stageEngine.executeStage(2, query);
      
      expect(result).toBeDefined();
      expect(result.stage).toBe(2);
      expect(result.status).toBe('completed');
      expect(result.nodes?.length).toBeGreaterThan(0);
      expect(result.edges).toBeDefined();
    });

    it('should execute stage 3 (Hypothesis/Planning) with multiple hypotheses', async () => {
      const query = testQueries.medical;
      
      // Execute prerequisite stages
      await stageEngine.executeStage(1, query);
      await stageEngine.executeStage(2, query);
      
      const result = await stageEngine.executeStage(3, query);
      
      expect(result).toBeDefined();
      expect(result.stage).toBe(3);
      expect(result.status).toBe('completed');
      expect(result.nodes?.some(node => node.type === 'hypothesis')).toBe(true);
      expect(result.metadata?.hypotheses_count).toBeGreaterThan(0);
    });

    it('should execute stage 4 (Evidence Integration) with Perplexity calls', async () => {
      const query = testQueries.technical;
      
      // Execute prerequisite stages
      await stageEngine.executeStage(1, query);
      await stageEngine.executeStage(2, query);
      await stageEngine.executeStage(3, query);
      
      const result = await stageEngine.executeStage(4, query);
      
      expect(result).toBeDefined();
      expect(result.stage).toBe(4);
      expect(result.status).toBe('completed');
      expect(result.nodes?.some(node => node.type === 'evidence')).toBe(true);
      expect(result.metadata?.evidence_sources).toBeGreaterThan(0);
    });

    it('should execute stage 5 (Pruning/Merging) with graph optimization', async () => {
      const query = testQueries.simple;
      
      // Execute prerequisite stages
      for (let i = 1; i <= 4; i++) {
        await stageEngine.executeStage(i, query);
      }
      
      const result = await stageEngine.executeStage(5, query);
      
      expect(result).toBeDefined();
      expect(result.stage).toBe(5);
      expect(result.status).toBe('completed');
      expect(result.metadata?.pruned_nodes).toBeDefined();
      expect(result.metadata?.information_gain).toBeGreaterThan(0);
    });

    it('should execute stage 6 (Subgraph Extraction) with pathway identification', async () => {
      const query = testQueries.complex;
      
      // Execute prerequisite stages
      for (let i = 1; i <= 5; i++) {
        await stageEngine.executeStage(i, query);
      }
      
      const result = await stageEngine.executeStage(6, query);
      
      expect(result).toBeDefined();
      expect(result.stage).toBe(6);
      expect(result.status).toBe('completed');
      expect(result.metadata?.pathways_identified).toBeGreaterThan(0);
      expect(result.metadata?.complexity_score).toBeDefined();
    });

    it('should execute stage 7 (Composition) with HTML synthesis', async () => {
      const query = testQueries.medical;
      
      // Execute prerequisite stages
      for (let i = 1; i <= 6; i++) {
        await stageEngine.executeStage(i, query);
      }
      
      const result = await stageEngine.executeStage(7, query);
      
      expect(result).toBeDefined();
      expect(result.stage).toBe(7);
      expect(result.status).toBe('completed');
      expect(result.content).toContain('HTML');
      expect(result.metadata?.citations_count).toBeGreaterThan(0);
      expect(result.metadata?.word_count).toBeGreaterThan(0);
    });

    it('should execute stage 8 (Reflection) with bias detection', async () => {
      const query = testQueries.technical;
      
      // Execute prerequisite stages
      for (let i = 1; i <= 7; i++) {
        await stageEngine.executeStage(i, query);
      }
      
      const result = await stageEngine.executeStage(8, query);
      
      expect(result).toBeDefined();
      expect(result.stage).toBe(8);
      expect(result.status).toBe('completed');
      expect(result.metadata?.bias_flags).toBeDefined();
      expect(result.metadata?.consistency_score).toBeGreaterThan(0);
    });

    it('should execute stage 9 (Final Analysis) with comprehensive report', async () => {
      const query = testQueries.simple;
      
      // Execute all prerequisite stages
      for (let i = 1; i <= 8; i++) {
        await stageEngine.executeStage(i, query);
      }
      
      const result = await stageEngine.executeStage(9, query);
      
      expect(result).toBeDefined();
      expect(result.stage).toBe(9);
      expect(result.status).toBe('completed');
      expect(result.content).toContain('PhD-level');
      expect(result.metadata?.final_word_count).toBeGreaterThan(0);
      expect(result.metadata?.statistical_tests).toBeGreaterThan(0);
      expect(result.metadata?.recommendations).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid stage numbers', async () => {
      await expect(stageEngine.executeStage(0, testQueries.simple))
        .rejects.toThrow('Invalid stage number');
      
      await expect(stageEngine.executeStage(10, testQueries.simple))
        .rejects.toThrow('Invalid stage number');
    });

    it('should handle empty or invalid queries', async () => {
      await expect(stageEngine.executeStage(1, ''))
        .rejects.toThrow('Query cannot be empty');
      
      await expect(stageEngine.executeStage(1, '   \n  \t  '))
        .rejects.toThrow('Query cannot be empty');
    });

    it('should handle missing API credentials gracefully', async () => {
      const engineWithoutCreds = new AsrGotStageEngine();
      
      await expect(engineWithoutCreds.executeStage(1, testQueries.simple))
        .rejects.toThrow('API credentials required');
    });

    it('should handle API failures with proper error messages', async () => {
      // Mock API failure by importing the mocked module and making it properly reject
      const { queueGeminiCall, getTaskResult } = await import('@/utils/background');
      
      // First, make queueGeminiCall return a task ID
      vi.mocked(queueGeminiCall).mockReturnValueOnce('failed-task-id');
      
      // Then, make getTaskResult reject with the error
      vi.mocked(getTaskResult).mockRejectedValueOnce(new Error('API Error'));
      
      await expect(stageEngine.executeStage(1, testQueries.simple))
        .rejects.toThrow('API Error');
    });

    it('should handle malicious input sanitization', async () => {
      const maliciousQuery = testQueries.malicious;
      
      const result = await stageEngine.executeStage(1, maliciousQuery);
      
      expect(result.content).not.toContain('<script>');
      expect(result.content).not.toContain('alert(');
    });

    it('should handle JSON parsing errors in stage 1', async () => {
      const { getTaskResult } = await import('@/utils/background');
      
      // Mock malformed JSON response to trigger fallback parsing
      vi.mocked(getTaskResult).mockResolvedValueOnce('invalid json {');
      
      const result = await stageEngine.executeStage(1, testQueries.simple);
      
      expect(result).toBeDefined();
      expect(result.stage).toBe(1);
      expect(result.status).toBe('completed');
    });

    it('should handle API errors in stage 4 evidence collection', async () => {
      const { callPerplexitySonarAPI } = await import('@/services/apiService');
      
      // Mock Perplexity API failure to trigger Gemini fallback
      vi.mocked(callPerplexitySonarAPI).mockRejectedValueOnce(new Error('Perplexity API failed'));
      
      // Execute prerequisite stages
      await stageEngine.executeStage(1, testQueries.simple);
      await stageEngine.executeStage(2, testQueries.simple);
      await stageEngine.executeStage(3, testQueries.simple);
      
      const result = await stageEngine.executeStage(4, testQueries.simple);
      
      expect(result).toBeDefined();
      expect(result.stage).toBe(4);
      expect(result.status).toBe('completed');
    });

    it('should handle empty credentials object', async () => {
      const engineWithEmptyCreds = new AsrGotStageEngine({ gemini: '', perplexity: '', openai: '' });
      
      await expect(engineWithEmptyCreds.executeStage(1, testQueries.simple))
        .rejects.toThrow('API credentials required');
    });

    it('should handle null/undefined queries', async () => {
      await expect(stageEngine.executeStage(1, null as any))
        .rejects.toThrow('Query cannot be empty');
      
      await expect(stageEngine.executeStage(1, undefined as any))
        .rejects.toThrow('Query cannot be empty');
    });

    it('should handle negative stage numbers', async () => {
      await expect(stageEngine.executeStage(-1, testQueries.simple))
        .rejects.toThrow('Invalid stage number');
      
      await expect(stageEngine.executeStage(-5, testQueries.simple))
        .rejects.toThrow('Invalid stage number');
    });

    it('should handle very large stage numbers', async () => {
      await expect(stageEngine.executeStage(100, testQueries.simple))
        .rejects.toThrow('Invalid stage number');
      
      await expect(stageEngine.executeStage(999, testQueries.simple))
        .rejects.toThrow('Invalid stage number');
    });
  });

  describe('Graph Data Management', () => {
    it('should maintain graph data consistency across stages', async () => {
      const query = testQueries.simple;
      
      await stageEngine.executeStage(1, query);
      const stage1Graph = stageEngine.getGraphData();
      
      await stageEngine.executeStage(2, query);
      const stage2Graph = stageEngine.getGraphData();
      
      expect(stage2Graph.nodes?.length).toBeGreaterThanOrEqual(stage1Graph.nodes?.length || 0);
      expect(stage2Graph.metadata?.stage).toBe(2);
    });

    it('should properly update node confidence values', async () => {
      const query = testQueries.complex;
      
      const result = await stageEngine.executeStage(1, query);
      
      const nodes = result.nodes || [];
      nodes.forEach(node => {
        expect(node.confidence).toHaveLength(4);
        node.confidence.forEach(conf => {
          expect(conf).toBeGreaterThanOrEqual(0);
          expect(conf).toBeLessThanOrEqual(1);
        });
      });
    });

    it('should create valid edges with proper source/target references', async () => {
      const query = testQueries.medical;
      
      await stageEngine.executeStage(1, query);
      await stageEngine.executeStage(2, query);
      const result = await stageEngine.executeStage(3, query);
      
      const edges = result.edges || [];
      const nodeIds = (result.nodes || []).map(node => node.id);
      
      edges.forEach(edge => {
        expect(nodeIds).toContain(edge.source);
        expect(nodeIds).toContain(edge.target);
        expect(edge.weight).toBeGreaterThanOrEqual(0);
        expect(edge.weight).toBeLessThanOrEqual(1);
      });
    });

    it('should handle hyperedges correctly', async () => {
      const query = testQueries.technical;
      
      await stageEngine.executeStage(1, query);
      await stageEngine.executeStage(2, query);
      await stageEngine.executeStage(3, query);
      const result = await stageEngine.executeStage(4, query);
      
      const hyperedges = result.hyperedges || [];
      const nodeIds = (result.nodes || []).map(node => node.id);
      
      hyperedges.forEach(hyperedge => {
        expect(hyperedge.nodes).toBeDefined();
        expect(hyperedge.nodes.length).toBeGreaterThan(1);
        hyperedge.nodes.forEach(nodeId => {
          expect(nodeIds).toContain(nodeId);
        });
      });
    });
  });

  describe('Information Theory Integration', () => {
    it('should calculate and store information metrics for nodes', async () => {
      const query = testQueries.simple;
      
      const result = await stageEngine.executeStage(1, query);
      
      const nodes = result.nodes || [];
      nodes.forEach(node => {
        if (node.metadata?.information_theory) {
          expect(node.metadata.information_theory.entropy).toBeGreaterThan(0);
          expect(node.metadata.information_theory.complexity).toBeGreaterThan(0);
          expect(node.metadata.information_theory.information_gain).toBeGreaterThanOrEqual(0);
        }
      });
    });

    it('should calculate graph complexity metrics', async () => {
      const query = testQueries.complex;
      
      await stageEngine.executeStage(1, query);
      await stageEngine.executeStage(2, query);
      const result = await stageEngine.executeStage(5, query);
      
      expect(result.metadata?.complexity_score).toBeDefined();
      expect(result.metadata?.complexity_score).toBeGreaterThan(0);
    });
  });

  describe('Context and Memory Management', () => {
    it('should maintain research context across stages', async () => {
      const query = testQueries.medical;
      
      await stageEngine.executeStage(1, query);
      const context1 = stageEngine.getResearchContext();
      
      await stageEngine.executeStage(2, query);
      const context2 = stageEngine.getResearchContext();
      
      expect(context2.field).toBe(context1.field);
      expect(context2.topic).toBe(context1.topic);
      expect(context2.objectives.length).toBeGreaterThanOrEqual(context1.objectives.length);
    });

    it('should store stage execution contexts', async () => {
      const query = testQueries.technical;
      
      await stageEngine.executeStage(1, query);
      await stageEngine.executeStage(2, query);
      
      const contexts = stageEngine.getStageContexts();
      
      expect(contexts).toHaveLength(2);
      expect(contexts[0].stage_id).toBe(1);
      expect(contexts[1].stage_id).toBe(2);
      expect(contexts[0].execution_time).toBeDefined();
      expect(contexts[1].execution_time).toBeDefined();
    });
  });

  describe('Performance and Token Management', () => {
    it('should track token usage across stages', async () => {
      const query = testQueries.simple;
      
      const result = await stageEngine.executeStage(1, query);
      
      expect(result.metadata?.token_usage).toBeDefined();
      expect(result.metadata?.token_usage?.total).toBeGreaterThan(0);
      expect(result.metadata?.token_usage?.input).toBeGreaterThan(0);
      expect(result.metadata?.token_usage?.output).toBeGreaterThan(0);
    });

    it('should measure execution duration', async () => {
      const query = testQueries.complex;
      
      const result = await stageEngine.executeStage(1, query);
      
      expect(result.metadata?.duration).toBeDefined();
      expect(result.metadata?.duration).toBeGreaterThan(0);
    });

    it('should handle large graph data efficiently', async () => {
      const largeGraph = testGraphData;
      const engineWithLargeGraph = new AsrGotStageEngine(mockCredentials, largeGraph);
      
      const startTime = Date.now();
      const result = await engineWithLargeGraph.executeStage(1, testQueries.simple);
      const executionTime = Date.now() - startTime;
      
      expect(result).toBeDefined();
      expect(executionTime).toBeLessThan(30000); // Should complete within 30 seconds
    });
  });

  describe('Utility Methods', () => {
    it('should provide access to current graph data', () => {
      const graphData = stageEngine.getGraphData();
      
      expect(graphData).toBeDefined();
      expect(graphData.nodes).toBeDefined();
      expect(graphData.edges).toBeDefined();
      expect(graphData.metadata).toBeDefined();
    });

    it('should provide access to research context', () => {
      const context = stageEngine.getResearchContext();
      
      expect(context).toBeDefined();
      expect(context.field).toBeDefined();
      expect(context.topic).toBeDefined();
      expect(context.objectives).toBeDefined();
    });

    it('should provide access to stage contexts', () => {
      const contexts = stageEngine.getStageContexts();
      
      expect(contexts).toBeDefined();
      expect(Array.isArray(contexts)).toBe(true);
    });

    it('should validate stage results correctly', () => {
      const validResult = testStageResults[1];
      const isValid = stageEngine.validateStageResult(validResult);
      
      expect(isValid).toBe(true);
    });

    it('should calculate confidence scores properly', () => {
      const mockEvidence = ['evidence1', 'evidence2', 'evidence3'];
      const confidence = stageEngine.calculateConfidence(mockEvidence);
      
      expect(typeof confidence).toBe('number');
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
      
      // Test with more evidence
      const moreEvidence = ['e1', 'e2', 'e3', 'e4', 'e5'];
      const higherConfidence = stageEngine.calculateConfidence(moreEvidence);
      expect(higherConfidence).toBeGreaterThan(confidence);
    });

    it('should handle empty evidence array in confidence calculation', () => {
      const confidence = stageEngine.calculateConfidence([]);
      expect(confidence).toBe(0);
      
      const confidenceNull = stageEngine.calculateConfidence(null as any);
      expect(confidenceNull).toBe(0);
      
      const confidenceUndefined = stageEngine.calculateConfidence(undefined as any);
      expect(confidenceUndefined).toBe(0);
    });

    it('should validate invalid stage results', () => {
      expect(stageEngine.validateStageResult(null)).toBe(false);
      expect(stageEngine.validateStageResult(undefined)).toBe(false);
      expect(stageEngine.validateStageResult({})).toBe(false);
      expect(stageEngine.validateStageResult({ stage: 1 })).toBe(false);
      expect(stageEngine.validateStageResult({ stage: 1, status: 'completed' })).toBe(false);
      expect(stageEngine.validateStageResult({ stage: 'invalid', status: 'completed', content: 'test', timestamp: '2023-01-01' })).toBe(false);
    });

    it('should provide stage results access', () => {
      const results = stageEngine.getStageResults();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should provide final HTML report access', () => {
      const report = stageEngine.getFinalHtmlReport();
      expect(report).toBeNull(); // Initially null since stage 9 hasn't run
    });

    it('should handle average confidence calculation with empty nodes', () => {
      const emptyEngine = new AsrGotStageEngine();
      // Access private method through bracket notation for testing
      const avgConfidence = emptyEngine['calculateAverageConfidence']();
      expect(avgConfidence).toBe(0);
    });
  });

  describe('Branch Coverage Tests', () => {
    it('should test different analysis string conditions in extractField', async () => {
      // Test with empty analysis
      const emptyEngine = new AsrGotStageEngine(mockCredentials);
      const field1 = emptyEngine['extractField']('');
      expect(field1).toBe('General Science');
      
      const field2 = emptyEngine['extractField'](undefined as any);
      expect(field2).toBe('General Science');
      
      const field3 = emptyEngine['extractField'](null as any);
      expect(field3).toBe('General Science');
    });

    it('should test different analysis string conditions in extractObjectives', async () => {
      const emptyEngine = new AsrGotStageEngine(mockCredentials);
      
      const obj1 = emptyEngine['extractObjectives']('');
      expect(obj1).toEqual(['Comprehensive analysis']);
      
      const obj2 = emptyEngine['extractObjectives'](undefined as any);
      expect(obj2).toEqual(['Comprehensive analysis']);
      
      const obj3 = emptyEngine['extractObjectives'](null as any);
      expect(obj3).toEqual(['Comprehensive analysis']);
    });

    it('should test extractDimensionContent with various inputs', async () => {
      const emptyEngine = new AsrGotStageEngine(mockCredentials);
      
      const content1 = emptyEngine['extractDimensionContent']('', 'Scope');
      expect(content1).toContain('Scope analysis');
      
      const content2 = emptyEngine['extractDimensionContent'](undefined, 'Objectives');
      expect(content2).toContain('Objectives analysis');
      
      const content3 = emptyEngine['extractDimensionContent']('Some analysis text with Scope: detailed scope analysis here', 'Scope');
      expect(content3).toContain('detailed scope analysis');
    });

    it('should test extractHypothesisContent with various inputs', async () => {
      const emptyEngine = new AsrGotStageEngine(mockCredentials);
      
      const hyp1 = emptyEngine['extractHypothesisContent']('', 1);
      expect(hyp1).toContain('Hypothesis 1');
      
      const hyp2 = emptyEngine['extractHypothesisContent'](undefined, 2);
      expect(hyp2).toContain('Hypothesis 2');
      
      const hyp3 = emptyEngine['extractHypothesisContent']('Hypothesis 1: Test hypothesis content here', 1);
      expect(hyp3).toContain('Test hypothesis content');
    });

    it('should test extractFalsificationCriteria with various inputs', async () => {
      const emptyEngine = new AsrGotStageEngine(mockCredentials);
      
      const crit1 = emptyEngine['extractFalsificationCriteria']('', 1);
      expect(crit1).toContain('testable criteria');
      
      const crit2 = emptyEngine['extractFalsificationCriteria'](undefined, 2);
      expect(crit2).toContain('testable criteria');
      
      const crit3 = emptyEngine['extractFalsificationCriteria']('falsification: specific test criteria', 1);
      expect(crit3).toContain('specific test criteria');
    });

    it('should test all confidence extraction methods with empty/null inputs', async () => {
      const emptyEngine = new AsrGotStageEngine(mockCredentials);
      
      // Test extractEmpiricalSupport
      const emp1 = emptyEngine['extractEmpiricalSupport']('');
      expect(emp1).toBe(0.8);
      
      const emp2 = emptyEngine['extractEmpiricalSupport'](undefined);
      expect(emp2).toBe(0.8);
      
      // Test extractTheoreticalBasis
      const theo1 = emptyEngine['extractTheoreticalBasis']('');
      expect(theo1).toBe(0.7);
      
      const theo2 = emptyEngine['extractTheoreticalBasis'](undefined);
      expect(theo2).toBe(0.7);
      
      // Test extractMethodologicalRigor
      const meth1 = emptyEngine['extractMethodologicalRigor']('');
      expect(meth1).toBe(0.9);
      
      const meth2 = emptyEngine['extractMethodologicalRigor'](undefined);
      expect(meth2).toBe(0.9);
      
      // Test extractConsensusAlignment
      const cons1 = emptyEngine['extractConsensusAlignment']('');
      expect(cons1).toBe(0.6);
      
      const cons2 = emptyEngine['extractConsensusAlignment'](undefined);
      expect(cons2).toBe(0.6);
    });

    it('should test statistical analysis content parsing branches', async () => {
      const emptyEngine = new AsrGotStageEngine(mockCredentials);
      
      // Test different statistical content types
      const analysis1 = 'meta-analysis with large sample n > 1000 and p < 0.001';
      const emp1 = emptyEngine['extractEmpiricalSupport'](analysis1);
      expect(emp1).toBeGreaterThan(0.8);
      
      const analysis2 = 'case study with small sample n < 30 and not significant results';
      const emp2 = emptyEngine['extractEmpiricalSupport'](analysis2);
      expect(emp2).toBeLessThan(0.5);
      
      const analysis3 = 'well-established theory with extensive citations';
      const theo1 = emptyEngine['extractTheoreticalBasis'](analysis3);
      expect(theo1).toBeGreaterThan(0.7);
      
      const analysis4 = 'rigorous methodology with controlled for confounders and double-blind design';
      const meth1 = emptyEngine['extractMethodologicalRigor'](analysis4);
      expect(meth1).toBeGreaterThan(0.8);
      
      const analysis5 = 'scientific consensus with widely accepted results';
      const cons1 = emptyEngine['extractConsensusAlignment'](analysis5);
      expect(cons1).toBeGreaterThan(0.7);
      
      const analysis6 = 'controversial with conflicting evidence and disputed findings';
      const cons2 = emptyEngine['extractConsensusAlignment'](analysis6);
      expect(cons2).toBeLessThan(0.5);
    });

    it('should test causal analysis classification branches', async () => {
      const emptyEngine = new AsrGotStageEngine(mockCredentials);
      
      // Test different causal types
      expect(emptyEngine['extractCausalType']('causal_direct relationship')).toBe('causal_direct');
      expect(emptyEngine['extractCausalType']('causal_counterfactual analysis')).toBe('causal_counterfactual');
      expect(emptyEngine['extractCausalType']('causal_confounded by factors')).toBe('causal_confounded');
      expect(emptyEngine['extractCausalType']('contradictory evidence')).toBe('contradictory');
      expect(emptyEngine['extractCausalType']('correlative relationship')).toBe('correlative');
      expect(emptyEngine['extractCausalType']('unknown relationship')).toBe('supportive');
    });

    it('should test temporal confidence calculation branches', async () => {
      const emptyEngine = new AsrGotStageEngine(mockCredentials);
      
      // Test different time differences
      expect(emptyEngine['calculateTemporalConfidence'](30 * 60 * 1000)).toBe(0.9); // 30 minutes
      expect(emptyEngine['calculateTemporalConfidence'](12 * 60 * 60 * 1000)).toBe(0.8); // 12 hours
      expect(emptyEngine['calculateTemporalConfidence'](3 * 24 * 60 * 60 * 1000)).toBe(0.7); // 3 days
      expect(emptyEngine['calculateTemporalConfidence'](15 * 24 * 60 * 60 * 1000)).toBe(0.6); // 15 days
      expect(emptyEngine['calculateTemporalConfidence'](40 * 24 * 60 * 60 * 1000)).toBe(0.5); // 40 days
    });

    it('should test statistical power extraction with various formats', async () => {
      const emptyEngine = new AsrGotStageEngine(mockCredentials);
      
      // Test with empty/undefined analysis
      const power1 = emptyEngine['extractStatisticalPower']('');
      expect(power1).toBe(0.85);
      
      const power2 = emptyEngine['extractStatisticalPower'](undefined);
      expect(power2).toBe(0.85);
      
      // Test with various statistical content
      const analysis1 = 'statistical power: 0.9 with sample size: 1500 and effect size: 0.8 and p-value: 0.001';
      const power3 = emptyEngine['extractStatisticalPower'](analysis1);
      expect(power3).toBe(0.9);
      
      const analysis2 = 'randomized controlled trial with large effect peer-reviewed study';
      const power4 = emptyEngine['extractStatisticalPower'](analysis2);
      expect(power4).toBeGreaterThan(0.8);
      
      const analysis3 = 'case study with anecdotal evidence';
      const power5 = emptyEngine['extractStatisticalPower'](analysis3);
      expect(power5).toBeLessThan(0.5);
    });

    it('should test conditional branches in stage 5 pruning', async () => {
      // Execute prerequisite stages to set up graph with edges
      await stageEngine.executeStage(1, testQueries.simple);
      await stageEngine.executeStage(2, testQueries.simple);
      await stageEngine.executeStage(3, testQueries.simple);
      await stageEngine.executeStage(4, testQueries.simple);
      
      // Test pruning logic by executing stage 5
      const result = await stageEngine.executeStage(5, testQueries.simple);
      
      expect(result).toBeDefined();
      expect(result.stage).toBe(5);
      expect(result.status).toBe('completed');
    });

    it('should test hyperedge creation branches', async () => {
      // Execute stages to create nodes for hyperedge testing
      await stageEngine.executeStage(1, testQueries.complex);
      await stageEngine.executeStage(2, testQueries.complex);
      await stageEngine.executeStage(3, testQueries.complex);
      await stageEngine.executeStage(4, testQueries.complex);
      
      const graphData = stageEngine.getGraphData();
      const evidenceNodes = graphData.nodes.filter(n => n.type === 'evidence');
      const hypotheses = graphData.nodes.filter(n => n.type === 'hypothesis');
      
      // Test hyperedge creation logic
      const hyperedges = stageEngine['createHyperedges'](evidenceNodes, hypotheses);
      expect(Array.isArray(hyperedges)).toBe(true);
    });

    it('should test temporal pattern analysis branches', async () => {
      const emptyEngine = new AsrGotStageEngine(mockCredentials);
      
      // Create mock nodes with different timestamps
      const sourceNode = {
        id: 'source',
        type: 'hypothesis',
        confidence: [0.8, 0.7, 0.6, 0.8],
        metadata: { timestamp: new Date('2023-01-01T10:00:00Z').toISOString() }
      } as any;
      
      const targetNode = {
        id: 'target',
        type: 'evidence',
        confidence: [0.9, 0.8, 0.7, 0.9],
        metadata: { timestamp: new Date('2023-01-01T10:02:00Z').toISOString() }
      } as any;
      
      // Test temporal analysis
      const temporalAnalysis = emptyEngine['analyzeTemporalPatterns'](sourceNode, targetNode);
      
      expect(temporalAnalysis).toBeDefined();
      expect(temporalAnalysis.temporalType).toBeDefined();
      expect(temporalAnalysis.temporalMetadata).toBeDefined();
    });

    it('should test confounders extraction branches', async () => {
      const emptyEngine = new AsrGotStageEngine(mockCredentials);
      
      // Test with empty/undefined analysis
      const conf1 = emptyEngine['extractConfounders']('');
      expect(Array.isArray(conf1)).toBe(true);
      expect(conf1.length).toBeGreaterThan(0);
      
      const conf2 = emptyEngine['extractConfounders'](undefined);
      expect(Array.isArray(conf2)).toBe(true);
      
      // Test with formatted confounders text
      const analysisWithConfounders = `
        confounding variables:
        - socioeconomic status
        - age factors
        - genetic predisposition
      `;
      const conf3 = emptyEngine['extractConfounders'](analysisWithConfounders);
      expect(conf3.length).toBeGreaterThan(2);
    });

    it('should test different sample size and effect size branches', async () => {
      const emptyEngine = new AsrGotStageEngine(mockCredentials);
      
      // Test different sample sizes
      const largeSample = 'sample size: 2000 with significant results';
      const power1 = emptyEngine['extractStatisticalPower'](largeSample);
      expect(power1).toBeGreaterThan(0.65);
      
      const mediumSample = 'sample size: 500 with moderate effects';
      const power2 = emptyEngine['extractStatisticalPower'](mediumSample);
      expect(power2).toBeGreaterThan(0.55);
      
      const smallSample = 'sample size: 150 with limited power';
      const power3 = emptyEngine['extractStatisticalPower'](smallSample);
      expect(power3).toBeGreaterThan(0.45);
      
      const verySmallSample = 'sample size: 25 with very limited power';
      const power4 = emptyEngine['extractStatisticalPower'](verySmallSample);
      expect(power4).toBeLessThan(0.4);
      
      // Test different effect sizes
      const largeEffect = 'effect size: 0.9 with strong impact';
      const power5 = emptyEngine['extractStatisticalPower'](largeEffect);
      expect(power5).toBeGreaterThan(0.6);
      
      const mediumEffect = 'effect size: 0.6 with moderate impact';
      const power6 = emptyEngine['extractStatisticalPower'](mediumEffect);
      expect(power6).toBeGreaterThan(0.55);
      
      const smallEffect = 'effect size: 0.3 with minimal impact';
      const power7 = emptyEngine['extractStatisticalPower'](smallEffect);
      expect(power7).toBeGreaterThan(0.5);
      
      const verySmallEffect = 'effect size: 0.1 with negligible impact';
      const power8 = emptyEngine['extractStatisticalPower'](verySmallEffect);
      expect(power8).toBeLessThan(0.5);
    });

    it('should test different p-value branches in statistical power', async () => {
      const emptyEngine = new AsrGotStageEngine(mockCredentials);
      
      // Test different p-value thresholds
      const highlySignificant = 'p-value: 0.001 highly significant results';
      const power1 = emptyEngine['extractStatisticalPower'](highlySignificant);
      expect(power1).toBeGreaterThan(0.6);
      
      const significant = 'p-value: 0.02 significant findings';
      const power2 = emptyEngine['extractStatisticalPower'](significant);
      expect(power2).toBeGreaterThan(0.55);
      
      const marginal = 'p-value: 0.08 marginally significant';
      const power3 = emptyEngine['extractStatisticalPower'](marginal);
      expect(power3).toBeGreaterThan(0.5);
      
      const notSignificant = 'p-value: 0.15 not significant';
      const power4 = emptyEngine['extractStatisticalPower'](notSignificant);
      expect(power4).toBeLessThan(0.5);
    });

    it('should test hypothesis extraction with matching patterns', async () => {
      const emptyEngine = new AsrGotStageEngine(mockCredentials);
      
      const analysisWithHypotheses = `
        Hypothesis 1: First test hypothesis
        Hypothesis 2: Second research hypothesis
        Hypothesis 3: Third experimental hypothesis
      `;
      
      const hyp1 = emptyEngine['extractHypothesisContent'](analysisWithHypotheses, 1);
      expect(hyp1).toContain('First test hypothesis');
      
      const hyp2 = emptyEngine['extractHypothesisContent'](analysisWithHypotheses, 2);
      expect(hyp2).toContain('Second research hypothesis');
      
      const hyp3 = emptyEngine['extractHypothesisContent'](analysisWithHypotheses, 3);
      expect(hyp3).toContain('Third experimental hypothesis');
    });

    it('should test falsification criteria extraction with matching patterns', async () => {
      const emptyEngine = new AsrGotStageEngine(mockCredentials);
      
      const analysisWithCriteria = `
        falsification: criteria one for first hypothesis
        falsification: criteria two for second hypothesis
        falsification: criteria three for third hypothesis
      `;
      
      const crit1 = emptyEngine['extractFalsificationCriteria'](analysisWithCriteria, 1);
      expect(crit1).toContain('criteria one');
      
      const crit2 = emptyEngine['extractFalsificationCriteria'](analysisWithCriteria, 2);
      expect(crit2).toContain('criteria two');
      
      const crit3 = emptyEngine['extractFalsificationCriteria'](analysisWithCriteria, 3);
      expect(crit3).toContain('criteria three');
    });
  });
});