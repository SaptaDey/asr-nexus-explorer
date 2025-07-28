import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import type { ASRGoTNode, ASRGoTEdge, GraphData, StageResult, APICredentials } from '@/types/asrGotTypes';

// Create a test wrapper with all necessary providers
interface AllTheProvidersProps {
  children: React.ReactNode;
}

export const AllTheProviders: React.FC<AllTheProvidersProps> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Custom render function with providers
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Test data generators
export const createTestNode = (overrides: Partial<ASRGoTNode> = {}): ASRGoTNode => ({
  id: `test-node-${Math.random().toString(36).substr(2, 9)}`,
  label: 'Test Node',
  confidence: [0.8, 0.7, 0.9, 0.6],
  metadata: {
    stage: 1,
    type: 'hypothesis',
    source: 'test',
    timestamp: new Date().toISOString(),
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
      entropy: 2.1,
      complexity: 1.5,
      information_gain: 0.7
    }
  },
  ...overrides
});

export const createTestEdge = (
  sourceId?: string,
  targetId?: string,
  overrides: Partial<ASRGoTEdge> = {}
): ASRGoTEdge => ({
  source: sourceId || 'test-source',
  target: targetId || 'test-target',
  type: 'supportive',
  weight: 0.8,
  metadata: {
    strength: 'strong',
    evidence_count: 5,
    timestamp: new Date().toISOString()
  },
  ...overrides
});

export const createTestGraph = (
  nodeCount: number = 5,
  edgeCount: number = 4
): GraphData => {
  const nodes: ASRGoTNode[] = [];
  const edges: ASRGoTEdge[] = [];

  // Create nodes
  for (let i = 0; i < nodeCount; i++) {
    nodes.push(createTestNode({
      id: `node-${i}`,
      label: `Test Node ${i}`,
      metadata: {
        ...createTestNode().metadata,
        stage: Math.floor(Math.random() * 9) + 1
      }
    }));
  }

  // Create edges
  for (let i = 0; i < Math.min(edgeCount, nodeCount - 1); i++) {
    edges.push(createTestEdge(`node-${i}`, `node-${i + 1}`, {
      weight: Math.random()
    }));
  }

  return {
    nodes,
    edges,
    hyperedges: [],
    metadata: {
      version: '1.0.0',
      created: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      stage: Math.max(...nodes.map(n => n.metadata.stage || 1)),
      total_nodes: nodes.length,
      total_edges: edges.length,
      graph_metrics: {
        density: edges.length / (nodes.length * (nodes.length - 1)),
        avg_confidence: nodes.reduce((sum, n) => sum + n.confidence[0], 0) / nodes.length
      }
    }
  };
};

export const createTestStageResult = (
  stage: number,
  overrides: Partial<StageResult> = {}
): StageResult => ({
  stage,
  content: `Test stage ${stage} result content`,
  nodes: [createTestNode()],
  edges: stage > 1 ? [createTestEdge()] : [],
  hyperedges: [],
  status: 'completed',
  timestamp: new Date().toISOString(),
  metadata: {
    duration: Math.floor(Math.random() * 10000) + 1000,
    token_usage: {
      total: Math.floor(Math.random() * 500) + 100,
      input: Math.floor(Math.random() * 200) + 50,
      output: Math.floor(Math.random() * 300) + 50
    },
    confidence_score: Math.random() * 0.3 + 0.7
  },
  ...overrides
});

// Mock API responses
export const createMockAPIResponse = (content: string, tokens: number = 100) => ({
  content,
  usage: {
    total_tokens: tokens,
    input_tokens: Math.floor(tokens * 0.4),
    output_tokens: Math.floor(tokens * 0.6)
  }
});

// Test credentials
export const createTestCredentials = (): APICredentials => ({
  gemini: 'test-gemini-key-1234567890abcdef',
  perplexity: 'test-perplexity-key-1234567890abcdef'
});

// Performance testing utilities
export const measurePerformance = async <T,>(
  operation: () => Promise<T> | T,
  name: string = 'operation'
): Promise<{ result: T; duration: number; memory?: number }> => {
  const startTime = performance.now();
  const startMemory = (performance as any).memory?.usedJSHeapSize;
  
  const result = await operation();
  
  const endTime = performance.now();
  const endMemory = (performance as any).memory?.usedJSHeapSize;
  
  const duration = endTime - startTime;
  const memory = startMemory && endMemory ? endMemory - startMemory : undefined;
  
  console.log(`Performance: ${name} took ${duration.toFixed(2)}ms${memory ? `, memory: ${(memory / 1024 / 1024).toFixed(2)}MB` : ''}`);
  
  return { result, duration, memory };
};

// Mock implementations for common services
export const createMockAsrGotStageEngine = () => ({
  executeStage: vi.fn().mockImplementation(async (stage: number) => 
    createTestStageResult(stage)
  ),
  getGraphData: vi.fn().mockReturnValue(createTestGraph()),
  getResearchContext: vi.fn().mockReturnValue({
    field: 'test-field',
    topic: 'test-topic',
    objectives: ['objective1', 'objective2'],
    hypotheses: ['hypothesis1'],
    constraints: [],
    biases_detected: [],
    knowledge_gaps: [],
    auto_generated: true
  }),
  validateStageResult: vi.fn().mockReturnValue(true),
  calculateConfidence: vi.fn().mockReturnValue([0.8, 0.7, 0.9, 0.6]),
  exportResults: vi.fn().mockResolvedValue('mock-export-data'),
  getStageContexts: vi.fn().mockReturnValue([])
});

export const createMockApiService = () => ({
  callGemini: vi.fn().mockResolvedValue('Mock Gemini response'),
  callPerplexity: vi.fn().mockResolvedValue('Mock Perplexity response'),
  validateApiKey: vi.fn().mockResolvedValue(true),
  getRateLimitStatus: vi.fn().mockResolvedValue({
    remaining: 100,
    reset_time: Date.now() + 3600000
  })
});

export const createMockSupabaseClient = () => ({
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
    single: vi.fn().mockResolvedValue({ data: {}, error: null }),
    then: vi.fn().mockResolvedValue({ data: [], error: null })
  }),
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: 'mock-path' }, error: null }),
      download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
      remove: vi.fn().mockResolvedValue({ data: [], error: null })
    })
  }
});

// Wait utilities
export const waitForElement = (selector: string, timeout: number = 5000): Promise<Element> => {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
};

export const waitForCondition = (
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      if (condition()) {
        resolve();
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Condition not met within ${timeout}ms`));
        return;
      }
      
      setTimeout(check, interval);
    };
    
    check();
  });
};

// Async testing utilities
export const flushPromises = (): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

export const advanceTimersByTime = (ms: number): void => {
  vi.advanceTimersByTime(ms);
};

// Error boundary for testing
export class TestErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <div data-testid="error-boundary">Something went wrong</div>;
    }

    return this.props.children;
  }
}

// Security testing utilities
export const createSecurityTestCases = () => ({
  xssPayloads: [
    '<script>alert("xss")</script>',
    'javascript:alert("xss")',
    '<img src=x onerror=alert("xss")>',
    '<svg onload=alert("xss")>',
    'data:text/html,<script>alert("xss")</script>'
  ],
  sqlInjectionPayloads: [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "' UNION SELECT * FROM users --",
    "'; DELETE FROM users WHERE '1'='1",
    "' OR 1=1 --"
  ],
  commandInjectionPayloads: [
    '; cat /etc/passwd',
    '&& rm -rf /',
    '| whoami',
    '`id`',
    '$(whoami)'
  ]
});

// Accessibility testing utilities
export const createAccessibilityTests = () => ({
  checkAriaLabels: (container: HTMLElement) => {
    const interactiveElements = container.querySelectorAll(
      'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    interactiveElements.forEach(element => {
      const hasAriaLabel = element.getAttribute('aria-label') ||
                          element.getAttribute('aria-labelledby') ||
                          element.querySelector('label');
      
      if (!hasAriaLabel) {
        console.warn('Interactive element missing ARIA label:', element);
      }
    });
  },
  
  checkColorContrast: (element: HTMLElement) => {
    const styles = window.getComputedStyle(element);
    const backgroundColor = styles.backgroundColor;
    const color = styles.color;
    
    // Basic contrast check (would need more sophisticated implementation)
    if (backgroundColor === 'rgb(255, 255, 255)' && color === 'rgb(255, 255, 255)') {
      console.warn('Poor color contrast detected:', element);
    }
  },
  
  checkKeyboardNavigation: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
    );
    
    return focusableElements.length > 0;
  }
});

// Export commonly used re-exports for convenience
export * from '@testing-library/react';
export * from '@testing-library/user-event';
export { vi } from 'vitest';