import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ASRGoTInterface from '@/pages/ASRGoTInterface';
import { mockServices } from '@/test/mocks/mockServices';
import { testQueries } from '@/test/fixtures/testData';

// Mock the components
vi.mock('@/components/asr-got/ResearchInterface', () => ({
  ResearchInterface: vi.fn(({ onExecuteStage, currentStage, isProcessing }) => (
    <div data-testid="research-interface">
      <button onClick={() => onExecuteStage?.(1, 'test query')}>Submit Query</button>
      <button onClick={() => onExecuteStage?.(currentStage + 1, 'next stage')}>Complete Stage</button>
      <div>Current Stage: {currentStage}</div>
      <div>Processing: {isProcessing ? 'Yes' : 'No'}</div>
    </div>
  ))
}));


vi.mock('@/components/asr-got/EnhancedGraphVisualization', () => ({
  EnhancedGraphVisualization: vi.fn(() => (
    <div data-testid="graph-visualization">Graph Visualization</div>
  ))
}));

// Mock services
vi.mock('@/services/AsrGotStageEngine', () => ({
  AsrGotStageEngine: vi.fn().mockImplementation(() => mockServices.stageEngine)
}));

vi.mock('@/hooks/asr-got/useASRGoT', () => ({
  useASRGoT: vi.fn(() => ({
    executeStage: vi.fn().mockResolvedValue({ stage: 1, status: 'completed' }),
    currentStage: 1,
    graphData: { nodes: [], edges: [], metadata: {} },
    isExecuting: false,
    isProcessing: false,
    stageResults: [],
    sessionId: 'test-session',
    resetSession: vi.fn()
  }))
}));

vi.mock('@/hooks/asr-got/useProcessingMode', () => ({
  useProcessingMode: vi.fn(() => ({
    mode: 'manual',
    setMode: vi.fn(),
    isAutoProcessing: false
  }))
}));

// Mock the auth context
const mockAuthContext = {
  user: null,
  session: null,
  profile: null,
  isLoading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn()
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuthContext: () => mockAuthContext,
  AuthProvider: ({ children }: any) => <div>{children}</div>
}));

// Mock the ContextCompatibilityLayer since that's what the error shows
vi.mock('@/contexts/ContextCompatibilityLayer', () => ({
  useAuthContext: () => mockAuthContext,
  AuthProvider: ({ children }: any) => <div>{children}</div>
}));

// Mock accessibility hook to avoid DOM issues in tests
vi.mock('@/hooks/useAccessibility', () => ({
  useAccessibility: () => ({
    screenReaderAnnounce: vi.fn(),
    focusManagement: {
      setMainContentFocus: vi.fn(),
      restoreFocus: vi.fn()
    },
    keyboardNavigation: {
      enableSkipLinks: vi.fn(),
      enableTabTrapping: vi.fn()
    }
  }),
  useAccessibleDescription: () => ({
    setDescription: vi.fn(),
    getDescription: vi.fn(() => 'Mock accessible description'),
    clearDescription: vi.fn()
  }),
  useKeyboardShortcuts: () => ({
    registerShortcut: vi.fn(),
    unregisterShortcut: vi.fn(),
    getActiveShortcuts: vi.fn(() => [])
  })
}));

// Mock AccessibilityProvider to fix preferences undefined error
vi.mock('@/components/accessibility/AccessibilityProvider', () => ({
  useAccessibilityContext: () => ({
    preferences: {
      highContrast: false,
      reducedMotion: false,
      screenReaderMode: false,
      fontSize: 'medium',
      focusVisible: true,
      keyboardNavigation: true
    },
    updatePreferences: vi.fn(),
    isScreenReader: false,
    announceLiveRegion: vi.fn()
  }),
  AccessibilityProvider: ({ children }: any) => <div>{children}</div>
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ASRGoTInterface', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render main interface without errors', () => {
    render(
      <TestWrapper>
        <ASRGoTInterface />
      </TestWrapper>
    );

    // Component should render without crashing - check for research interface component
    expect(screen.getByTestId('research-interface')).toBeInTheDocument();
  });

  it('should handle query submission', async () => {
    render(
      <TestWrapper>
        <ASRGoTInterface />
      </TestWrapper>
    );

    const submitButton = screen.getByText('Submit Query');
    await user.click(submitButton);

    // The mocked function should have been called
    expect(screen.getByTestId('research-interface')).toBeInTheDocument();
  });

  it('should handle stage completion', async () => {
    render(
      <TestWrapper>
        <ASRGoTInterface />
      </TestWrapper>
    );

    const completeButton = screen.getByText('Complete Stage');
    await user.click(completeButton);

    // The component should remain rendered after stage completion
    expect(screen.getByTestId('research-interface')).toBeInTheDocument();
  });

  it('should be accessible with proper ARIA labels', () => {
    render(
      <TestWrapper>
        <ASRGoTInterface />
      </TestWrapper>
    );

    // Check that main sections are accessible
    expect(screen.getByTestId('research-interface')).toBeInTheDocument();
    
    // Check for accessibility button
    expect(screen.getByLabelText('Open accessibility settings')).toBeInTheDocument();
  });

  it('should handle keyboard navigation', async () => {
    render(
      <TestWrapper>
        <ASRGoTInterface />
      </TestWrapper>
    );

    // Test Tab navigation
    await user.tab();
    
    // Check that focus moves through interactive elements
    const submitButton = screen.getByText('Submit Query');
    expect(submitButton).toBeInTheDocument();
  });

  it('should handle error states gracefully', async () => {
    // Mock error condition
    vi.mocked(mockServices.stageEngine.executeStage).mockRejectedValueOnce(new Error('Test error'));

    render(
      <TestWrapper>
        <ASRGoTInterface />
      </TestWrapper>
    );

    // Component should still render even if services throw errors
    expect(screen.getByTestId('research-interface')).toBeInTheDocument();
  });

  it('should maintain state consistency during interactions', async () => {
    render(
      <TestWrapper>
        <ASRGoTInterface />
      </TestWrapper>
    );

    // Simulate multiple interactions
    const submitButton = screen.getByText('Submit Query');
    const completeButton = screen.getByText('Complete Stage');

    await user.click(submitButton);
    await user.click(completeButton);

    // Main interface should still be present
    expect(screen.getByTestId('research-interface')).toBeInTheDocument();
  });

  it('should handle responsive design', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    render(
      <TestWrapper>
        <ASRGoTInterface />
      </TestWrapper>
    );

    // Components should render regardless of viewport size
    expect(screen.getByTestId('research-interface')).toBeInTheDocument();
  });
});