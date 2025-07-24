import { vi } from 'vitest';
import type { 
  ASRGoTNode, 
  ASRGoTEdge, 
  ASRGoTHyperEdge, 
  StageResult,
  GraphData,
  APICredentials 
} from '@/types/asrGotTypes';

// Mock graph data for testing
export const mockGraphData: GraphData = {
  nodes: [
    {
      id: 'node-1',
      label: 'Root Research Question',
      confidence: [0.9, 0.8, 0.7, 0.6],
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
          confidence: 0.8
        },
        information_theory: {
          entropy: 2.5,
          complexity: 1.8,
          information_gain: 0.7
        }
      }
    },
    {
      id: 'node-2', 
      label: 'Hypothesis A',
      confidence: [0.8, 0.7, 0.9, 0.5],
      metadata: {
        stage: 3,
        type: 'hypothesis',
        source: 'generated',
        timestamp: '2024-01-01T00:05:00Z',
        causal_metadata: {
          confounders: ['age', 'gender'],
          mechanisms: ['direct_effect'],
          counterfactuals: ['control_scenario']
        },
        temporal_metadata: {
          patterns: ['increasing_trend'],
          precedence: ['node-1'],
          confidence: 0.7
        },
        information_theory: {
          entropy: 1.9,
          complexity: 1.5,
          information_gain: 0.6
        }
      }
    }
  ],
  edges: [
    {
      source: 'node-1',
      target: 'node-2',
      type: 'supportive',
      weight: 0.8,
      metadata: {
        strength: 'strong',
        evidence_count: 5,
        timestamp: '2024-01-01T00:05:00Z'
      }
    }
  ],
  hyperedges: [
    {
      id: 'hyperedge-1',
      nodes: ['node-1', 'node-2'],
      type: 'multi_causal',
      weight: 0.7,
      metadata: {
        relationship_type: 'complex_interaction',
        evidence_sources: ['study_1', 'study_2']
      }
    }
  ],
  metadata: {
    version: '1.0.0',
    created: '2024-01-01T00:00:00Z',
    last_updated: '2024-01-01T00:00:00Z',
    stage: 2,
    total_nodes: 2,
    total_edges: 1,
    graph_metrics: {
      complexity: 1.5,
      density: 0.5,
      clustering_coefficient: 0.0
    }
  }
};

// Mock stage results
export const mockStageResults: Record<number, StageResult> = {
  1: {
    stage: 1,
    content: 'Mock initialization stage result',
    nodes: [mockGraphData.nodes[0]],
    edges: [],
    hyperedges: [],
    status: 'completed',
    timestamp: '2024-01-01T00:00:00Z',
    metadata: {
      duration: 5000,
      token_usage: { total: 100, input: 50, output: 50 },
      confidence_score: 0.9
    }
  },
  2: {
    stage: 2,
    content: 'Mock decomposition stage result',
    nodes: mockGraphData.nodes,
    edges: mockGraphData.edges,
    hyperedges: [],
    status: 'completed',
    timestamp: '2024-01-01T00:05:00Z',
    metadata: {
      duration: 8000,
      token_usage: { total: 200, input: 100, output: 100 },
      confidence_score: 0.85
    }
  }
};

// Mock API credentials with valid formats
export const mockAPICredentials: APICredentials = {
  gemini: 'AIzaSyTest123456789012345678901234567890', // Valid Gemini format: starts with AIza, >30 chars
  perplexity: 'pplx-test1234567890123456789012345678901234' // Valid Perplexity format: starts with pplx-, >20 chars
};

// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    signUp: vi.fn().mockResolvedValue({ 
      data: { user: { id: 'test-user', email: 'test@example.com' } }, 
      error: null 
    }),
    signInWithPassword: vi.fn().mockResolvedValue({ 
      data: { session: { access_token: 'mock-token' } }, 
      error: null 
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    getSession: vi.fn().mockResolvedValue({ 
      data: { session: { access_token: 'mock-token' } }, 
      error: null 
    }),
    getUser: vi.fn().mockResolvedValue({ 
      data: { user: { id: 'test-user', email: 'test@example.com' } }, 
      error: null 
    }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: mockGraphData, error: null }),
    then: vi.fn().mockResolvedValue({ data: [mockGraphData], error: null })
  }),
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: 'mock-path' }, error: null }),
      download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
      remove: vi.fn().mockResolvedValue({ data: [], error: null })
    })
  }
};

// Mock AsrGotStageEngine
export const mockAsrGotStageEngine = {
  executeStage: vi.fn().mockImplementation((stage: number) => {
    return Promise.resolve(mockStageResults[stage] || {
      stage,
      content: `Mock result for stage ${stage}`,
      nodes: [],
      edges: [],
      hyperedges: [],
      status: 'completed',
      timestamp: new Date().toISOString(),
      metadata: {
        duration: 5000,
        token_usage: { total: 100, input: 50, output: 50 },
        confidence_score: 0.8
      }
    });
  }),
  generateGraphVisualization: vi.fn().mockResolvedValue({
    svg: '<svg>Mock SVG</svg>',
    positions: { 'node-1': { x: 0, y: 0 }, 'node-2': { x: 100, y: 100 } }
  }),
  exportResults: vi.fn().mockResolvedValue('Mock exported results'),
  validateStageResult: vi.fn().mockReturnValue(true),
  calculateConfidence: vi.fn().mockReturnValue([0.8, 0.7, 0.9, 0.6]),
  optimizeGraph: vi.fn().mockResolvedValue(mockGraphData)
};

// Mock API service
export const mockApiService = {
  callGemini: vi.fn().mockResolvedValue({
    content: 'Mock Gemini response',
    usage: { total_tokens: 100 }
  }),
  callPerplexity: vi.fn().mockResolvedValue({
    content: 'Mock Perplexity response',
    sources: ['https://example.com'],
    usage: { total_tokens: 150 }
  }),
  validateApiKey: vi.fn().mockResolvedValue(true),
  getRateLimitStatus: vi.fn().mockResolvedValue({
    remaining: 100,
    reset_time: Date.now() + 3600000
  })
};

// Mock background processors
export const mockBackgroundProcessor = {
  addTask: vi.fn().mockResolvedValue('task-id'),
  getTaskStatus: vi.fn().mockResolvedValue('completed'),
  getTaskResult: vi.fn().mockResolvedValue({ success: true, data: mockGraphData }),
  cancelTask: vi.fn().mockResolvedValue(true),
  clearQueue: vi.fn().mockResolvedValue(true)
};

// Mock visualization services
export const mockVisualizationService = {
  generateCytoscapeGraph: vi.fn().mockResolvedValue({
    elements: {
      nodes: mockGraphData.nodes.map(node => ({ data: node })),
      edges: mockGraphData.edges.map(edge => ({ data: edge }))
    },
    layout: { name: 'dagre' }
  }),
  generate3DTree: vi.fn().mockResolvedValue({
    scene: 'mock-3d-scene',
    animations: []
  }),
  exportVisualization: vi.fn().mockResolvedValue('data:image/svg+xml;base64,PHN2Zz4='),
  calculateLayout: vi.fn().mockResolvedValue({
    positions: { 'node-1': { x: 0, y: 0 }, 'node-2': { x: 100, y: 100 } }
  })
};

// Mock security services
export const mockSecurityService = {
  sanitizeInput: vi.fn().mockImplementation((input: string) => input.replace(/<script>/g, '')),
  validateCredentials: vi.fn().mockResolvedValue(true),
  encryptData: vi.fn().mockImplementation((data: any) => `encrypted_${JSON.stringify(data)}`),
  decryptData: vi.fn().mockImplementation((encrypted: string) => 
    JSON.parse(encrypted.replace('encrypted_', ''))
  ),
  checkPermissions: vi.fn().mockResolvedValue(true),
  auditLog: vi.fn().mockResolvedValue(true)
};

// Mock performance services
export const mockPerformanceService = {
  measureExecutionTime: vi.fn().mockResolvedValue(1000),
  optimizeMemoryUsage: vi.fn().mockResolvedValue(true),
  cacheResult: vi.fn().mockResolvedValue(true),
  getCachedResult: vi.fn().mockResolvedValue(mockGraphData),
  clearCache: vi.fn().mockResolvedValue(true),
  getPerformanceMetrics: vi.fn().mockResolvedValue({
    memory_usage: '50MB',
    execution_time: '1.2s',
    cache_hit_rate: 0.85
  })
};

// Export all mocks
export const mockServices = {
  supabase: mockSupabaseClient,
  stageEngine: mockAsrGotStageEngine,
  api: mockApiService,
  backgroundProcessor: mockBackgroundProcessor,
  visualization: mockVisualizationService,
  security: mockSecurityService,
  performance: mockPerformanceService
};