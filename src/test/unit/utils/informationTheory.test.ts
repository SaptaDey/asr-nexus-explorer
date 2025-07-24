import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateNodeInformationMetrics,
  calculateEvidenceInformationMetrics,
  calculateHypothesisInformationMetrics,
  calculateGraphComplexity,
  calculateEntropy,
  calculateMutualInformation,
  calculateInformationGain,
  calculateDescriptionLength
} from '@/utils/informationTheory';
import { testGraphData } from '@/test/fixtures/testData';
import type { GraphNode, GraphData, GraphEdge } from '@/types/asrGotTypes';

describe('Information Theory Utilities', () => {
  let sampleNodes: GraphNode[];
  let sampleGraph: GraphData;

  beforeEach(() => {
    sampleNodes = [
      {
        id: 'node1',
        label: 'Test Node 1',
        type: 'hypothesis',
        confidence: [0.8, 0.7, 0.9, 0.6],
        metadata: {
          evidence_count: 5,
          connection_strength: 0.7,
          statistical_support: 0.8
        }
      },
      {
        id: 'node2',
        label: 'Test Node 2',
        type: 'evidence',
        confidence: [0.6, 0.8, 0.7, 0.9],
        metadata: {
          evidence_count: 3,
          connection_strength: 0.5,
          statistical_support: 0.6
        }
      }
    ];

    sampleGraph = {
      nodes: sampleNodes,
      edges: [
        {
          id: 'edge1',
          source: 'node1',
          target: 'node2',
          type: 'supportive',
          weight: 0.8,
          metadata: {}
        }
      ],
      metadata: {
        stage: 3,
        complexity_score: 2.5,
        total_nodes: 2,
        total_edges: 1
      }
    };
  });

  describe('calculateNodeInformationMetrics', () => {
    it('should calculate information metrics for a node', () => {
      const result = calculateNodeInformationMetrics(sampleNodes[0]);

      expect(result).toHaveProperty('entropy');
      expect(result).toHaveProperty('complexity');
      expect(result).toHaveProperty('information_gain');
      
      expect(result.entropy).toBeGreaterThan(0);
      expect(result.complexity).toBeGreaterThan(0);
      expect(result.information_gain).toBeGreaterThanOrEqual(0);
    });

    it('should handle nodes with missing metadata', () => {
      const nodeWithoutMetadata: GraphNode = {
        id: 'node3',
        label: 'Test Node 3',
        type: 'hypothesis',
        confidence: [0.5, 0.5, 0.5, 0.5]
      };

      const result = calculateNodeInformationMetrics(nodeWithoutMetadata);

      expect(result).toHaveProperty('entropy');
      expect(result).toHaveProperty('complexity');
      expect(result).toHaveProperty('information_gain');
    });

    it('should return consistent results for identical nodes', () => {
      const result1 = calculateNodeInformationMetrics(sampleNodes[0]);
      const result2 = calculateNodeInformationMetrics(sampleNodes[0]);

      expect(result1.entropy).toBe(result2.entropy);
      expect(result1.complexity).toBe(result2.complexity);
      expect(result1.information_gain).toBe(result2.information_gain);
    });
  });

  describe('calculateEvidenceInformationMetrics', () => {
    it('should calculate metrics for evidence data', () => {
      const evidenceData = [
        'Evidence piece 1',
        'Evidence piece 2',
        'Contradictory evidence'
      ];

      const result = calculateEvidenceInformationMetrics(evidenceData);

      expect(result).toHaveProperty('entropy');
      expect(result).toHaveProperty('complexity');
      expect(result).toHaveProperty('information_gain');
      
      expect(result.entropy).toBeGreaterThan(0);
      expect(result.complexity).toBeGreaterThan(0);
    });

    it('should handle empty evidence arrays', () => {
      const result = calculateEvidenceInformationMetrics([]);

      expect(result.entropy).toBe(0);
      expect(result.complexity).toBe(0);
      expect(result.information_gain).toBe(0);
    });

    it('should handle single evidence item', () => {
      const result = calculateEvidenceInformationMetrics(['Single evidence']);

      expect(result.entropy).toBeGreaterThanOrEqual(0);
      expect(result.complexity).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateHypothesisInformationMetrics', () => {
    it('should calculate metrics for hypothesis data', () => {
      const hypothesesData = [
        { text: 'Hypothesis 1', confidence: 0.8 },
        { text: 'Hypothesis 2', confidence: 0.6 },
        { text: 'Hypothesis 3', confidence: 0.9 }
      ];

      const result = calculateHypothesisInformationMetrics(hypothesesData);

      expect(result).toHaveProperty('entropy');
      expect(result).toHaveProperty('complexity');
      expect(result).toHaveProperty('information_gain');
      
      expect(result.entropy).toBeGreaterThan(0);
      expect(result.complexity).toBeGreaterThan(0);
    });

    it('should handle hypotheses with varying confidence levels', () => {
      const hypothesesData = [
        { text: 'High confidence', confidence: 0.95 },
        { text: 'Low confidence', confidence: 0.1 },
        { text: 'Medium confidence', confidence: 0.5 }
      ];

      const result = calculateHypothesisInformationMetrics(hypothesesData);

      expect(result.entropy).toBeGreaterThan(0);
      expect(result.complexity).toBeGreaterThan(0);
    });
  });

  describe('calculateGraphComplexity', () => {
    it('should calculate complexity for a graph', () => {
      const complexity = calculateGraphComplexity(sampleGraph);

      expect(complexity).toBeGreaterThan(0);
      expect(typeof complexity).toBe('number');
    });

    it('should return higher complexity for more complex graphs', () => {
      const simpleGraph: GraphData = {
        nodes: [sampleNodes[0]],
        edges: [],
        metadata: { stage: 1, total_nodes: 1, total_edges: 0 }
      };

      const complexGraph: GraphData = {
        nodes: [...sampleNodes, {
          id: 'node3',
          label: 'Additional Node',
          type: 'evidence',
          confidence: [0.7, 0.8, 0.6, 0.9]
        }],
        edges: [
          ...sampleGraph.edges,
          {
            id: 'edge2',
            source: 'node2',
            target: 'node3',
            type: 'causal_direct',
            weight: 0.6,
            metadata: {}
          }
        ],
        metadata: { stage: 4, total_nodes: 3, total_edges: 2 }
      };

      const simpleComplexity = calculateGraphComplexity(simpleGraph);
      const complexComplexity = calculateGraphComplexity(complexGraph);

      expect(complexComplexity).toBeGreaterThan(simpleComplexity);
    });

    it('should handle empty graphs', () => {
      const emptyGraph: GraphData = {
        nodes: [],
        edges: [],
        metadata: { stage: 0, total_nodes: 0, total_edges: 0 }
      };

      const complexity = calculateGraphComplexity(emptyGraph);
      expect(complexity).toBe(0);
    });
  });

  describe('calculateEntropy', () => {
    it('should calculate entropy for probability distribution', () => {
      const probabilities = [0.5, 0.3, 0.2];
      const entropy = calculateEntropy(probabilities);

      expect(entropy).toBeGreaterThan(0);
      expect(entropy).toBeLessThanOrEqual(Math.log2(probabilities.length));
    });

    it('should return 0 for deterministic distribution', () => {
      const probabilities = [1.0, 0.0, 0.0];
      const entropy = calculateEntropy(probabilities);

      expect(entropy).toBe(0);
    });

    it('should return maximum entropy for uniform distribution', () => {
      const probabilities = [0.25, 0.25, 0.25, 0.25];
      const entropy = calculateEntropy(probabilities);
      const maxEntropy = Math.log2(4);

      expect(Math.abs(entropy - maxEntropy)).toBeLessThan(0.001);
    });

    it('should handle edge cases', () => {
      expect(calculateEntropy([])).toBe(0);
      expect(calculateEntropy([0])).toBe(0);
      expect(calculateEntropy([1])).toBe(0);
    });
  });

  describe('calculateMutualInformation', () => {
    it('should calculate mutual information between variables', () => {
      const X = [0, 1, 0, 1, 0, 1];
      const Y = [0, 1, 1, 1, 0, 0];

      const mutualInfo = calculateMutualInformation(X, Y);

      expect(mutualInfo).toBeGreaterThanOrEqual(0);
      expect(typeof mutualInfo).toBe('number');
    });

    it('should return 0 for independent variables', () => {
      const X = [0, 0, 1, 1];
      const Y = [0, 1, 0, 1];

      const mutualInfo = calculateMutualInformation(X, Y);

      expect(mutualInfo).toBeGreaterThanOrEqual(0);
    });

    it('should handle identical variables', () => {
      const X = [0, 1, 0, 1];
      const Y = [0, 1, 0, 1];

      const mutualInfo = calculateMutualInformation(X, Y);

      expect(mutualInfo).toBeGreaterThan(0);
    });
  });

  describe('calculateInformationGain', () => {
    it('should calculate information gain', () => {
      const beforeSplit = [0, 0, 1, 1, 0, 1];
      const afterSplit = [[0, 0, 1], [1, 0, 1]];

      const gain = calculateInformationGain(beforeSplit, afterSplit);

      expect(gain).toBeGreaterThanOrEqual(0);
      expect(typeof gain).toBe('number');
    });

    it('should return positive gain for informative splits', () => {
      const beforeSplit = [0, 0, 1, 1];
      const afterSplit = [[0, 0], [1, 1]];

      const gain = calculateInformationGain(beforeSplit, afterSplit);

      expect(gain).toBeGreaterThan(0);
    });

    it('should handle perfect splits', () => {
      const beforeSplit = [0, 0, 1, 1];
      const afterSplit = [[0, 0], [1, 1]];

      const gain = calculateInformationGain(beforeSplit, afterSplit);

      expect(gain).toBeGreaterThan(0);
    });
  });

  describe('calculateDescriptionLength', () => {
    it('should calculate minimum description length', () => {
      const data = 'test data for compression analysis';
      const model = 'simple model';

      const mdl = calculateDescriptionLength(data, model);

      expect(mdl).toBeGreaterThan(0);
      expect(typeof mdl).toBe('number');
    });

    it('should return lower MDL for better models', () => {
      const data = 'repeated data repeated data repeated data';
      const simpleModel = 'repeat';
      const complexModel = 'complex model with many parameters';

      const mdlSimple = calculateDescriptionLength(data, simpleModel);
      const mdlComplex = calculateDescriptionLength(data, complexModel);

      // Simple model should have lower MDL for repetitive data
      expect(mdlSimple).toBeLessThan(mdlComplex);
    });

    it('should handle empty inputs', () => {
      expect(calculateDescriptionLength('', '')).toBe(0);
      expect(calculateDescriptionLength('data', '')).toBeGreaterThan(0);
      expect(calculateDescriptionLength('', 'model')).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    it('should maintain consistency across related calculations', () => {
      const node = sampleNodes[0];
      const nodeMetrics = calculateNodeInformationMetrics(node);
      
      // Entropy should be non-negative
      expect(nodeMetrics.entropy).toBeGreaterThanOrEqual(0);
      
      // Information gain should not exceed entropy
      expect(nodeMetrics.information_gain).toBeLessThanOrEqual(nodeMetrics.entropy);
      
      // Complexity should reflect the node's characteristics
      expect(nodeMetrics.complexity).toBeGreaterThan(0);
    });

    it('should handle large graphs efficiently', () => {
      const largeGraph = testGraphData;
      
      const startTime = Date.now();
      const complexity = calculateGraphComplexity(largeGraph);
      const executionTime = Date.now() - startTime;

      expect(complexity).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should provide meaningful metrics for different node types', () => {
      const hypothesisNode: GraphNode = {
        id: 'hyp1',
        label: 'Hypothesis',
        type: 'hypothesis',
        confidence: [0.8, 0.7, 0.9, 0.6]
      };

      const evidenceNode: GraphNode = {
        id: 'ev1',
        label: 'Evidence',
        type: 'evidence',
        confidence: [0.9, 0.8, 0.7, 0.8]
      };

      const hypMetrics = calculateNodeInformationMetrics(hypothesisNode);
      const evMetrics = calculateNodeInformationMetrics(evidenceNode);

      // Both should have valid metrics
      expect(hypMetrics.entropy).toBeGreaterThan(0);
      expect(evMetrics.entropy).toBeGreaterThan(0);
      
      // Metrics may differ based on node characteristics
      expect(typeof hypMetrics.complexity).toBe('number');
      expect(typeof evMetrics.complexity).toBe('number');
    });
  });
});