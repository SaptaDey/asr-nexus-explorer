import '@testing-library/jest-dom';
import { beforeAll, afterEach, vi, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// Mock environment variables
beforeAll(() => {
  // Mock environment variables for testing
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
  
  // Start MSW server for API mocking
  server.listen({
    onUnhandledRequest: 'warn',
  });

  // Mock global objects that might not exist in test environment
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock ResizeObserver
  Object.defineProperty(global, 'ResizeObserver', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }))
  });

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock requestAnimationFrame
  global.requestAnimationFrame = vi.fn().mockImplementation(cb => setTimeout(cb, 16));
  global.cancelAnimationFrame = vi.fn().mockImplementation(id => clearTimeout(id));

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: localStorageMock,
  });

  // Mock console methods to prevent test noise
  global.console = {
    ...console,
    // Uncomment the next line if you want to silence console.log during tests
    // log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  // Mock URL.createObjectURL
  global.URL.createObjectURL = vi.fn().mockImplementation(() => 'mock-object-url');
  global.URL.revokeObjectURL = vi.fn();

  // Mock Blob
  global.Blob = vi.fn().mockImplementation(() => ({
    size: 0,
    type: '',
  }));

  // Mock File
  global.File = vi.fn().mockImplementation(() => ({
    name: 'test-file.txt',
    size: 0,
    type: 'text/plain',
  }));

  // Mock crypto for secure random generation
  Object.defineProperty(global, 'crypto', {
    value: {
      getRandomValues: vi.fn().mockImplementation(arr => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      }),
      randomUUID: vi.fn().mockImplementation(() => 
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        })
      ),
    },
  });

  // Mock WebSocket
  Object.defineProperty(global, 'WebSocket', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      close: vi.fn(),
      send: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      readyState: 1,
      CONNECTING: 0,
      OPEN: 1,
      CLOSING: 2,
      CLOSED: 3,
    }))
  });

  // Mock TextEncoder/TextDecoder with proper implementations
  const { TextEncoder: NodeTextEncoder, TextDecoder: NodeTextDecoder } = require('util');
  global.TextEncoder = NodeTextEncoder;
  global.TextDecoder = NodeTextDecoder;
});

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.clearAllTimers();
  server.resetHandlers();
});

// Clean up after all tests
afterAll(() => {
  server.close();
  vi.restoreAllMocks();
});

// Custom matchers for ASR-GoT specific testing
expect.extend({
  toBeValidNode(received) {
    const pass = received && 
                 typeof received.id === 'string' &&
                 typeof received.confidence === 'object' &&
                 Array.isArray(received.confidence) &&
                 received.confidence.length === 4;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid ASR-GoT node`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid ASR-GoT node with id, confidence array of length 4`,
        pass: false,
      };
    }
  },
  
  toBeValidEdge(received) {
    const pass = received && 
                 typeof received.source === 'string' &&
                 typeof received.target === 'string' &&
                 typeof received.type === 'string';
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid ASR-GoT edge`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid ASR-GoT edge with source, target, and type`,
        pass: false,
      };
    }
  },

  toBeValidStageResult(received) {
    const pass = received && 
                 typeof received.stage === 'number' &&
                 typeof received.content === 'string' &&
                 received.stage >= 1 && received.stage <= 9;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid stage result`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid stage result with stage number (1-9) and content`,
        pass: false,
      };
    }
  },
});

// Declare custom matchers for TypeScript
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeValidNode(): T;
    toBeValidEdge(): T;
    toBeValidStageResult(): T;
  }
  interface AsymmetricMatchersContaining {
    toBeValidNode(): any;
    toBeValidEdge(): any;
    toBeValidStageResult(): any;
  }
}