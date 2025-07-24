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
      // Mock API failure
      vi.mocked(vi.importActual('@/utils/background')).queueGeminiCall
        .mockRejectedValueOnce(new Error('API Error'));
      
      await expect(stageEngine.executeStage(1, testQueries.simple))
        .rejects.toThrow('API Error');
    });

    it('should handle malicious input sanitization', async () => {
      const maliciousQuery = testQueries.malicious;
      
      const result = await stageEngine.executeStage(1, maliciousQuery);
      
      expect(result.content).not.toContain('<script>');
      expect(result.content).not.toContain('alert(');
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
      expect(contexts[0].stage).toBe(1);
      expect(contexts[1].stage).toBe(2);
      expect(contexts[0].timestamp).toBeDefined();
      expect(contexts[1].timestamp).toBeDefined();
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
  });
});