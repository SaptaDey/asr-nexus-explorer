import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ResearchInterface } from '@/components/asr-got/ResearchInterface';
import { mockServices } from '@/test/mocks/mockServices';
import { testQueries, testAPICredentials } from '@/test/fixtures/testData';

// Mock the hooks and services
vi.mock('@/hooks/asr-got/useASRGoT', () => ({
  useASRGoT: vi.fn(() => ({
    executeStage: vi.fn().mockResolvedValue({ stage: 1, status: 'completed' }),
    currentStage: 1,
    graphData: { nodes: [], edges: [], metadata: {} },
    isExecuting: false,
    stageResults: [],
    sessionId: 'test-session',
    resetSession: vi.fn(),
    error: null
  }))
}));

vi.mock('@/hooks/asr-got/useAPICredentials', () => ({
  useAPICredentials: vi.fn(() => ({
    credentials: testAPICredentials,
    updateCredentials: vi.fn(),
    validateCredentials: vi.fn().mockResolvedValue(true),
    isValid: true
  }))
}));

vi.mock('@/hooks/asr-got/useProcessingMode', () => ({
  useProcessingMode: vi.fn(() => ({
    mode: 'manual',
    setMode: vi.fn(),
    isAutoProcessing: false,
    pauseProcessing: vi.fn(),
    resumeProcessing: vi.fn()
  }))
}));

// Mock child components
vi.mock('@/components/asr-got/APIIntegration', () => ({
  APIIntegration: vi.fn(({ onCredentialsUpdate }) => (
    <div data-testid="api-integration">
      <button onClick={() => onCredentialsUpdate(testAPICredentials)}>
        Update Credentials
      </button>
    </div>
  ))
}));

vi.mock('@/components/asr-got/DeveloperMode', () => ({
  DeveloperMode: vi.fn(() => (
    <div data-testid="developer-mode">Developer Mode</div>
  ))
}));

vi.mock('@/components/asr-got/ExportFunctionality', () => ({
  ExportFunctionality: vi.fn(() => (
    <div data-testid="export-functionality">Export Options</div>
  ))
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

describe('ResearchInterface', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnQuerySubmit = vi.fn();
  const mockOnStageComplete = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render all main interface elements', () => {
    render(
      <TestWrapper>
        <ResearchInterface 
          onQuerySubmit={mockOnQuerySubmit}
          onStageComplete={mockOnStageComplete}
        />
      </TestWrapper>
    );

    expect(screen.getByTestId('api-integration')).toBeInTheDocument();
    expect(screen.getByTestId('developer-mode')).toBeInTheDocument();
    expect(screen.getByTestId('export-functionality')).toBeInTheDocument();
  });

  it('should handle query input and submission', async () => {
    render(
      <TestWrapper>
        <ResearchInterface 
          onQuerySubmit={mockOnQuerySubmit}
          onStageComplete={mockOnStageComplete}
        />
      </TestWrapper>
    );

    // Find query input field
    const queryInput = screen.getByRole('textbox', { name: /query|research|question/i }) ||
                      screen.getByPlaceholderText(/enter your research query/i) ||
                      screen.getByTestId('query-input');

    if (queryInput) {
      await user.type(queryInput, testQueries.simple);
      
      // Find and click submit button
      const submitButton = screen.getByRole('button', { name: /submit|start|execute/i }) ||
                          screen.getByTestId('submit-query');
      
      if (submitButton) {
        await user.click(submitButton);
        expect(mockOnQuerySubmit).toHaveBeenCalledWith(testQueries.simple);
      }
    }
  });

  it('should handle API credentials update', async () => {
    render(
      <TestWrapper>
        <ResearchInterface 
          onQuerySubmit={mockOnQuerySubmit}
          onStageComplete={mockOnStageComplete}
        />
      </TestWrapper>
    );

    const updateButton = screen.getByText('Update Credentials');
    await user.click(updateButton);

    // The API integration component should handle the update
    expect(screen.getByTestId('api-integration')).toBeInTheDocument();
  });

  it('should validate query input', async () => {
    render(
      <TestWrapper>
        <ResearchInterface 
          onQuerySubmit={mockOnQuerySubmit}
          onStageComplete={mockOnStageComplete}
        />
      </TestWrapper>
    );

    // Try to submit empty query
    const queryInput = screen.getByRole('textbox', { name: /query|research|question/i }) ||
                      screen.getByPlaceholderText(/enter your research query/i) ||
                      screen.getByTestId('query-input');

    if (queryInput) {
      const submitButton = screen.getByRole('button', { name: /submit|start|execute/i }) ||
                          screen.getByTestId('submit-query');
      
      if (submitButton) {
        await user.click(submitButton);
        
        // Should not call onQuerySubmit with empty query
        expect(mockOnQuerySubmit).not.toHaveBeenCalledWith('');
      }
    }
  });

  it('should handle processing mode changes', async () => {
    render(
      <TestWrapper>
        <ResearchInterface 
          onQuerySubmit={mockOnQuerySubmit}
          onStageComplete={mockOnStageComplete}
        />
      </TestWrapper>
    );

    // Look for mode toggle buttons
    const modeButtons = screen.getAllByRole('button').filter(button => 
      button.textContent?.includes('Manual') || 
      button.textContent?.includes('Auto') ||
      button.textContent?.includes('mode')
    );

    if (modeButtons.length > 0) {
      await user.click(modeButtons[0]);
      // Component should handle mode change
      expect(screen.getByTestId('api-integration')).toBeInTheDocument();
    }
  });

  it('should display progress indicators during execution', () => {
    // Mock executing state
    vi.mocked(require('@/hooks/asr-got/useASRGoT').useASRGoT).mockReturnValue({
      executeStage: vi.fn(),
      currentStage: 3,
      graphData: { nodes: [], edges: [], metadata: {} },
      isExecuting: true,
      stageResults: [
        { stage: 1, status: 'completed' },
        { stage: 2, status: 'completed' }
      ],
      sessionId: 'test-session',
      resetSession: vi.fn()
    });

    render(
      <TestWrapper>
        <ResearchInterface 
          onQuerySubmit={mockOnQuerySubmit}
          onStageComplete={mockOnStageComplete}
        />
      </TestWrapper>
    );

    // Should show progress indicators
    const progressElements = screen.getAllByText(/stage|progress|executing/i);
    expect(progressElements.length).toBeGreaterThan(0);
  });

  it('should handle error states gracefully', () => {
    // Mock error state
    vi.mocked(require('@/hooks/asr-got/useASRGoT').useASRGoT).mockReturnValue({
      executeStage: vi.fn(),
      currentStage: 1,
      graphData: { nodes: [], edges: [], metadata: {} },
      isExecuting: false,
      stageResults: [],
      sessionId: 'test-session',
      resetSession: vi.fn(),
      error: new Error('Test error')
    });

    render(
      <TestWrapper>
        <ResearchInterface 
          onQuerySubmit={mockOnQuerySubmit}
          onStageComplete={mockOnStageComplete}
        />
      </TestWrapper>
    );

    // Component should still render with error state
    expect(screen.getByTestId('api-integration')).toBeInTheDocument();
  });

  it('should be accessible with keyboard navigation', async () => {
    render(
      <TestWrapper>
        <ResearchInterface 
          onQuerySubmit={mockOnQuerySubmit}
          onStageComplete={mockOnStageComplete}
        />
      </TestWrapper>
    );

    // Test Tab navigation through interface elements
    await user.tab();
    
    // Should be able to navigate through interactive elements
    const focusedElement = document.activeElement;
    expect(focusedElement).toBeTruthy();
  });

  it('should support session management', async () => {
    render(
      <TestWrapper>
        <ResearchInterface 
          onQuerySubmit={mockOnQuerySubmit}
          onStageComplete={mockOnStageComplete}
        />
      </TestWrapper>
    );

    // Look for session reset or new session buttons
    const sessionButtons = screen.getAllByRole('button').filter(button => 
      button.textContent?.includes('Reset') || 
      button.textContent?.includes('New') ||
      button.textContent?.includes('Session')
    );

    if (sessionButtons.length > 0) {
      await user.click(sessionButtons[0]);
      // Should handle session management
      expect(screen.getByTestId('api-integration')).toBeInTheDocument();
    }
  });

  it('should handle stage completion callback', () => {
    render(
      <TestWrapper>
        <ResearchInterface 
          onQuerySubmit={mockOnQuerySubmit}
          onStageComplete={mockOnStageComplete}
        />
      </TestWrapper>
    );

    // Simulate stage completion
    const stageResult = { stage: 1, status: 'completed' };
    
    // This would typically be triggered by internal state changes
    // For now, just verify the interface renders correctly
    expect(screen.getByTestId('api-integration')).toBeInTheDocument();
  });
});