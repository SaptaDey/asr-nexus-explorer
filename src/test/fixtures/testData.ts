import type { 
  ASRGoTNode, 
  ASRGoTEdge, 
  ASRGoTHyperEdge, 
  StageResult,
  GraphData,
  ResearchSession,
  QueryHistoryEntry 
} from '@/types/asrGotTypes';

// Test research queries
export const testQueries = {
  simple: "What are the effects of climate change on marine ecosystems?",
  complex: "How do socioeconomic factors interact with genetic predisposition to influence the development of Type 2 diabetes in urban populations?",
  medical: "What is the relationship between gut microbiome diversity and inflammatory bowel disease progression?",
  technical: "How do quantum error correction codes improve the stability of quantum computing systems?",
  invalid: "",
  malicious: "<script>alert('xss')</script>What is machine learning?",
  longQuery: "A".repeat(10000) // Test very long queries
};

// Test node data with various confidence levels and metadata
export const testNodes: ASRGoTNode[] = [
  {
    id: 'root-node',
    label: 'Climate Change Effects on Marine Ecosystems',
    confidence: [0.95, 0.90, 0.85, 0.80],
    metadata: {
      stage: 1,
      type: 'root',
      source: 'user_input',
      timestamp: '2024-01-01T00:00:00Z',
      causal_metadata: {
        confounders: [],
        mechanisms: [],
        counterfactuals: []
      },
      temporal_metadata: {
        patterns: [],
        precedence: [],
        confidence: 0.95
      },
      information_theory: {
        entropy: 3.2,
        complexity: 2.1,
        information_gain: 1.0
      }
    }
  },
  {
    id: 'hypothesis-ocean-acidification',
    label: 'Ocean Acidification Hypothesis',
    confidence: [0.85, 0.80, 0.90, 0.75],
    metadata: {
      stage: 3,
      type: 'hypothesis',
      source: 'generated',
      timestamp: '2024-01-01T00:05:00Z',
      causal_metadata: {
        confounders: ['temperature', 'salinity', 'depth'],
        mechanisms: ['pH_reduction', 'carbonate_dissolution'],
        counterfactuals: ['pre_industrial_co2_levels']
      },
      temporal_metadata: {
        patterns: ['accelerating_trend'],
        precedence: ['root-node'],
        confidence: 0.85
      },
      information_theory: {
        entropy: 2.8,
        complexity: 2.5,
        information_gain: 0.8
      }
    }
  },
  {
    id: 'evidence-coral-bleaching',
    label: 'Coral Bleaching Evidence',
    confidence: [0.90, 0.95, 0.85, 0.88],
    metadata: {
      stage: 4,
      type: 'evidence',
      source: 'perplexity',
      timestamp: '2024-01-01T00:10:00Z',
      causal_metadata: {
        confounders: ['water_temperature', 'pollution'],
        mechanisms: ['symbiont_expulsion', 'stress_response'],
        counterfactuals: ['stable_temperature_scenario']
      },
      temporal_metadata: {
        patterns: ['seasonal_variation', 'increasing_frequency'],
        precedence: ['hypothesis-ocean-acidification'],
        confidence: 0.90
      },
      information_theory: {
        entropy: 2.1,
        complexity: 1.8,
        information_gain: 0.9
      }
    }
  },
  {
    id: 'low-confidence-node',
    label: 'Uncertain Finding',
    confidence: [0.30, 0.25, 0.35, 0.20],
    metadata: {
      stage: 5,
      type: 'pruned',
      source: 'generated',
      timestamp: '2024-01-01T00:15:00Z',
      causal_metadata: {
        confounders: ['unknown_factor'],
        mechanisms: [],
        counterfactuals: []
      },
      temporal_metadata: {
        patterns: [],
        precedence: [],
        confidence: 0.30
      },
      information_theory: {
        entropy: 3.8,
        complexity: 0.5,
        information_gain: 0.1
      }
    }
  }
];

// Test edge data with various relationship types
export const testEdges: ASRGoTEdge[] = [
  {
    source: 'root-node',
    target: 'hypothesis-ocean-acidification',
    type: 'supportive',
    weight: 0.85,
    metadata: {
      strength: 'strong',
      evidence_count: 12,
      timestamp: '2024-01-01T00:05:00Z',
      causal_type: 'causal_direct',
      temporal_type: 'temporal_precedence'
    }
  },
  {
    source: 'hypothesis-ocean-acidification',
    target: 'evidence-coral-bleaching',
    type: 'causal_direct',
    weight: 0.92,
    metadata: {
      strength: 'very_strong',
      evidence_count: 25,
      timestamp: '2024-01-01T00:10:00Z',
      causal_type: 'causal_direct',
      temporal_type: 'temporal_sequential'
    }
  },
  {
    source: 'evidence-coral-bleaching',
    target: 'low-confidence-node',
    type: 'contradictory',
    weight: 0.15,
    metadata: {
      strength: 'weak',
      evidence_count: 2,
      timestamp: '2024-01-01T00:15:00Z',
      causal_type: 'causal_confounded',
      temporal_type: 'temporal_delayed'
    }
  }
];

// Test hyperedge data
export const testHyperedges: ASRGoTHyperEdge[] = [
  {
    id: 'climate-ecosystem-interaction',
    nodes: ['root-node', 'hypothesis-ocean-acidification', 'evidence-coral-bleaching'],
    type: 'interdisciplinary',
    weight: 0.88,
    metadata: {
      relationship_type: 'complex_system_interaction',
      evidence_sources: ['IPCC_2023', 'Nature_Climate_2024', 'Science_2024'],
      confidence_factors: ['observational_data', 'model_predictions', 'expert_consensus']
    }
  },
  {
    id: 'uncertainty-pruning',
    nodes: ['evidence-coral-bleaching', 'low-confidence-node'],
    type: 'multi_causal',
    weight: 0.25,
    metadata: {
      relationship_type: 'conflicting_evidence',
      evidence_sources: ['limited_study_1', 'preliminary_data'],
      confidence_factors: ['small_sample_size', 'methodological_concerns']
    }
  }
];

// Complete test graph data
export const testGraphData: GraphData = {
  nodes: testNodes,
  edges: testEdges,
  hyperedges: testHyperedges,
  metadata: {
    version: '1.0.0',
    created: '2024-01-01T00:00:00Z',
    last_updated: '2024-01-01T00:15:00Z',
    stage: 4,
    total_nodes: 4,
    total_edges: 3,
    graph_metrics: {
      complexity: 2.1,
      density: 0.75,
      clustering_coefficient: 0.33,
      average_path_length: 1.5
    }
  }
};

// Test stage results for all 9 stages
export const testStageResults: Record<number, StageResult> = {
  1: {
    stage: 1,
    content: 'Research question initialized: Climate change effects on marine ecosystems',
    nodes: [testNodes[0]],
    edges: [],
    hyperedges: [],
    status: 'completed',
    timestamp: '2024-01-01T00:00:00Z',
    metadata: {
      duration: 2500,
      token_usage: { total: 85, input: 45, output: 40 },
      confidence_score: 0.95,
      knowledge_nodes: {
        K1: 'formal_academic_communication',
        K2: 'high_accuracy_progressive_insights',
        K3: 'environmental_researcher_profile'
      }
    }
  },
  2: {
    stage: 2,
    content: 'Decomposition complete: Identified 5 key dimensions for analysis',
    nodes: testNodes.slice(0, 2),
    edges: testEdges.slice(0, 1),
    hyperedges: [],
    status: 'completed',
    timestamp: '2024-01-01T00:05:00Z',
    metadata: {
      duration: 8200,
      token_usage: { total: 245, input: 120, output: 125 },
      confidence_score: 0.88,
      dimensions: ['biological_impact', 'chemical_processes', 'temporal_patterns', 'geographic_distribution', 'mitigation_strategies']
    }
  },
  3: {
    stage: 3,
    content: 'Hypothesis generation: 4 testable hypotheses formulated',
    nodes: testNodes.slice(0, 3),
    edges: testEdges.slice(0, 2),
    hyperedges: [],
    status: 'completed',
    timestamp: '2024-01-01T00:10:00Z',
    metadata: {
      duration: 12000,
      token_usage: { total: 420, input: 200, output: 220 },
      confidence_score: 0.85,
      hypotheses_count: 4,
      impact_scores: [0.92, 0.85, 0.78, 0.65]
    }
  },
  4: {
    stage: 4,
    content: 'Evidence integration: 15 sources analyzed with causal inference',
    nodes: testNodes,
    edges: testEdges,
    hyperedges: testHyperedges.slice(0, 1),
    status: 'completed',
    timestamp: '2024-01-01T00:15:00Z',
    metadata: {
      duration: 18500,
      token_usage: { total: 680, input: 320, output: 360 },
      confidence_score: 0.90,
      evidence_sources: 15,
      causal_relationships: 8
    }
  },
  5: {
    stage: 5,
    content: 'Graph optimization: Pruned 3 low-confidence nodes, merged 2 redundant edges',
    nodes: testNodes.filter(n => n.confidence[0] > 0.5),
    edges: testEdges.filter(e => e.weight > 0.5),
    hyperedges: testHyperedges,
    status: 'completed',
    timestamp: '2024-01-01T00:20:00Z',
    metadata: {
      duration: 6800,
      token_usage: { total: 180, input: 80, output: 100 },
      confidence_score: 0.92,
      pruned_nodes: 3,
      merged_edges: 2,
      information_gain: 0.85
    }
  },
  6: {
    stage: 6,
    content: 'Subgraph extraction: Identified 2 high-impact pathways',
    nodes: testNodes.slice(0, 3),
    edges: testEdges.slice(0, 2),
    hyperedges: testHyperedges,
    status: 'completed',
    timestamp: '2024-01-01T00:25:00Z',
    metadata: {
      duration: 9200,
      token_usage: { total: 320, input: 150, output: 170 },
      confidence_score: 0.89,
      pathways_identified: 2,
      complexity_score: 2.3
    }
  },
  7: {
    stage: 7,
    content: 'HTML synthesis: Generated comprehensive report with Vancouver citations',
    nodes: testNodes.slice(0, 3),
    edges: testEdges.slice(0, 2),
    hyperedges: testHyperedges,
    status: 'completed',
    timestamp: '2024-01-01T00:30:00Z',
    metadata: {
      duration: 15000,
      token_usage: { total: 850, input: 400, output: 450 },
      confidence_score: 0.91,
      citations_count: 28,
      word_count: 3200
    }
  },
  8: {
    stage: 8,
    content: 'Reflection audit: Bias detection complete, temporal consistency verified',
    nodes: testNodes.slice(0, 3),
    edges: testEdges.slice(0, 2),
    hyperedges: testHyperedges,
    status: 'completed',
    timestamp: '2024-01-01T00:35:00Z',
    metadata: {
      duration: 7500,
      token_usage: { total: 280, input: 130, output: 150 },
      confidence_score: 0.93,
      bias_flags: 0,
      consistency_score: 0.94
    }
  },
  9: {
    stage: 9,
    content: 'Final analysis: PhD-level report with quantitative insights generated',
    nodes: testNodes.slice(0, 3),
    edges: testEdges.slice(0, 2),
    hyperedges: testHyperedges,
    status: 'completed',
    timestamp: '2024-01-01T00:40:00Z',
    metadata: {
      duration: 20000,
      token_usage: { total: 1200, input: 600, output: 600 },
      confidence_score: 0.95,
      final_word_count: 8500,
      statistical_tests: 12,
      recommendations: 8
    }
  }
};

// Test research session data
export const testResearchSession: ResearchSession = {
  id: 'test-session-123',
  user_id: 'test-user-456',
  session_name: 'Climate Change Marine Impact Study',
  research_query: testQueries.simple,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:40:00Z',
  graph_data: testGraphData,
  stage_results: testStageResults,
  status: 'completed',
  metadata: {
    total_duration: 120000,
    total_tokens: 4200,
    api_calls: 45,
    parameters_used: {
      'P1.0': true,
      'P1.5': [0.85, 0.80, 0.90, 0.75],
      'P1.9': true,
      'P1.24': true,
      'P1.25': true
    }
  }
};

// Test query history entries
export const testQueryHistory: QueryHistoryEntry[] = [
  {
    id: 'query-1',
    user_id: 'test-user-456',
    query_text: testQueries.simple,
    session_id: 'test-session-123',
    results_summary: 'Analyzed climate change effects on marine ecosystems',
    created_at: '2024-01-01T00:00:00Z',
    metadata: {
      stages_completed: 9,
      confidence_score: 0.92,
      nodes_generated: 15,
      edges_generated: 23
    }
  },
  {
    id: 'query-2',
    user_id: 'test-user-456',
    query_text: testQueries.medical,
    session_id: 'test-session-124',
    results_summary: 'Research on gut microbiome and IBD progression',
    created_at: '2024-01-02T00:00:00Z',
    metadata: {
      stages_completed: 7,
      confidence_score: 0.88,
      nodes_generated: 22,
      edges_generated: 31
    }
  }
];

// Test API credentials
export const testAPICredentials = {
  gemini: 'AIzaSyTest123456789012345678901234567890',
  perplexity: 'pplx-test1234567890123456789012345678901234'
};

// Test error scenarios
export const testErrors = {
  apiKeyMissing: {
    code: 'API_KEY_MISSING',
    message: 'API key is required for this operation',
    details: { service: 'gemini' }
  },
  rateLimitExceeded: {
    code: 'RATE_LIMIT_EXCEEDED', 
    message: 'Rate limit exceeded for API service',
    details: { service: 'perplexity', reset_time: Date.now() + 3600000 }
  },
  invalidQuery: {
    code: 'INVALID_QUERY',
    message: 'Query validation failed',
    details: { reason: 'empty_query' }
  },
  networkError: {
    code: 'NETWORK_ERROR',
    message: 'Failed to connect to external service',
    details: { service: 'gemini', timeout: 30000 }
  },
  authenticationFailed: {
    code: 'AUTHENTICATION_FAILED',
    message: 'User authentication failed',
    details: { reason: 'invalid_token' }
  }
};

// Performance test data
export const performanceTestData = {
  largeGraph: {
    nodes: Array.from({ length: 1000 }, (_, i) => ({
      id: `large-node-${i}`,
      label: `Large Graph Node ${i}`,
      confidence: [
        Math.random() * 0.3 + 0.7,
        Math.random() * 0.3 + 0.7,
        Math.random() * 0.3 + 0.7,
        Math.random() * 0.3 + 0.7
      ],
      metadata: {
        stage: Math.floor(Math.random() * 9) + 1,
        type: ['root', 'hypothesis', 'evidence', 'conclusion'][Math.floor(Math.random() * 4)],
        source: 'generated',
        timestamp: new Date().toISOString(),
        causal_metadata: { confounders: [], mechanisms: [], counterfactuals: [] },
        temporal_metadata: { patterns: [], precedence: [], confidence: Math.random() },
        information_theory: { entropy: Math.random() * 4, complexity: Math.random() * 3, information_gain: Math.random() }
      }
    })),
    edges: Array.from({ length: 2000 }, (_, i) => ({
      source: `large-node-${Math.floor(Math.random() * 1000)}`,
      target: `large-node-${Math.floor(Math.random() * 1000)}`,
      type: ['supportive', 'contradictory', 'causal_direct', 'correlative'][Math.floor(Math.random() * 4)],
      weight: Math.random(),
      metadata: {
        strength: ['weak', 'medium', 'strong'][Math.floor(Math.random() * 3)],
        evidence_count: Math.floor(Math.random() * 20) + 1,
        timestamp: new Date().toISOString()
      }
    })),
    hyperedges: []
  }
};