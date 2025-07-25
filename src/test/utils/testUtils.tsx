
/**
 * Test Utilities for ASR-GoT Application
 * Provides mock data and testing helpers
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a custom render function that includes providers
export function renderWithProviders(
  ui: React.ReactElement,
  options: RenderOptions = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

// Mock data generators
export const mockNode = (id: string, overrides: any = {}) => ({
  id,
  confidence: [0.8, 0.7, 0.9, 0.6],
  content: `Mock content for node ${id}`,
  stage: 1,
  ...overrides
});

export const mockEdge = (source: string, target: string, overrides: any = {}) => ({
  source,
  target,
  type: 'reasoning',
  weight: 1.0,
  ...overrides
});

export const mockStageResult = (stage: number, overrides: any = {}) => ({
  stage,
  content: `Mock stage ${stage} result`,
  timestamp: new Date().toISOString(),
  ...overrides
});

export const mockSession = (id: string, overrides: any = {}) => ({
  id,
  user_id: 'test-user',
  research_context: {
    field: 'Computer Science',
    topic: 'Test Topic',
    query: 'Test Query'
  },
  created_at: new Date().toISOString(),
  ...overrides
});

// Re-export commonly used testing utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
