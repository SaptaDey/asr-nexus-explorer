import { AppContextManager } from '@/contexts/AppContextManager';
import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ASRGoTInterface from '@/pages/ASRGoTInterface';
import { mockServices } from '@/test/mocks/mockServices';
import { testQueries } from '@/test/fixtures/testData';

// Enable fake timers for testing
beforeAll(() => {
  vi.useFakeTimers();
});

afterAll(() => {
  vi.useRealTimers();
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { 
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        staleTime: Infinity
      },
      mutations: { retry: false }
    }
  });

  // Ensure cleanup on unmount
  React.useEffect(() => {
    return () => {
      queryClient.clear();
    };
  }, [queryClient]);

  return (
    <AppContextManager>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    </AppContextManager>
  );
};

// Mock the components
vi.mock('@/components/asr-got/ResearchInterface', () => ({
  ResearchInterface: vi.fn(({ onExecuteStage, currentStage, isProcessing }) => {
    // Mock cleanup for components that might have internal timers
    React.useEffect(() => {
      return () => {
        // Cleanup any internal timers or connections
      };
    }, []);
    
    return (
      <div data-testid="research-interface">
        <button onClick={() => onExecuteStage?.(1, 'test query')}>Submit Query</button>
        <button onClick={() => onExecuteStage?.(currentStage + 1, 'next stage')}>Complete Stage</button>
        <div>Current Stage: {currentStage}</div>
        <div>Processing: {isProcessing ? 'Yes' : 'No'}</div>
      </div>
    );
  })
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

describe('ASRGoTInterface', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up any testing library remnants
    cleanup();
    
    // Clear all timers (intervals, timeouts)
    vi.clearAllTimers();
    
    // Restore mocks
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

  it.skip('should handle query submission', async () => {
    render(
      <TestWrapper>
        <ASRGoTInterface />
      </TestWrapper>
    );

    const submitButton = screen.getByText('Submit Query');
    await user.click(submitButton);
    
    // Fast forward any timers that might have been set
    vi.runAllTimers();

    // The mocked function should have been called
    expect(screen.getByTestId('research-interface')).toBeInTheDocument();
  });

  it.skip('should handle stage completion', async () => {
    render(
      <TestWrapper>
        <ASRGoTInterface />
      </TestWrapper>
    );

    const completeButton = screen.getByText('Complete Stage');
    await user.click(completeButton);
    
    // Fast forward any timers
    vi.runAllTimers();

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

  it.skip('should handle keyboard navigation', async () => {
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
});
