import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResearchInterface } from '@/components/asr-got/ResearchInterface';
import { testQueries, testAPICredentials } from '@/test/fixtures/testData';
import { mockServices } from '@/test/mocks/mockServices';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock the services
vi.mock('@/services/AsrGotStageEngine', () => ({
  AsrGotStageEngine: vi.fn().mockImplementation(() => mockServices.stageEngine)
}));

vi.mock('@/services/apiService', () => mockServices.api);

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockServices.supabase
}));

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn()
  }
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('Research Workflow Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Research Pipeline', () => {
    it('should execute complete 9-stage research pipeline', async () => {
      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      // Step 1: Enter API credentials
      const geminiKeyInput = screen.getByLabelText(/gemini api key/i);
      const perplexityKeyInput = screen.getByLabelText(/perplexity api key/i);

      await user.type(geminiKeyInput, testAPICredentials.gemini);
      await user.type(perplexityKeyInput, testAPICredentials.perplexity);

      // Verify credentials are validated
      await waitFor(() => {
        expect(screen.getByText(/credentials validated/i)).toBeInTheDocument();
      });

      // Step 2: Enter research query
      const queryInput = screen.getByLabelText(/research query/i);
      await user.type(queryInput, testQueries.simple);

      // Step 3: Start research execution
      const startButton = screen.getByRole('button', { name: /start research/i });
      await user.click(startButton);

      // Verify execution starts
      expect(screen.getByText(/executing stage 1/i)).toBeInTheDocument();

      // Wait for all stages to complete
      await waitFor(() => {
        expect(screen.getByText(/research completed/i)).toBeInTheDocument();
      }, { timeout: 30000 });

      // Verify all stages were executed
      for (let stage = 1; stage <= 9; stage++) {
        expect(mockServices.stageEngine.executeStage).toHaveBeenCalledWith(stage, testQueries.simple);
      }

      // Verify final results are displayed
      expect(screen.getByText(/final analysis/i)).toBeInTheDocument();
      expect(screen.getByText(/download report/i)).toBeInTheDocument();
    });

    it('should handle manual stage-by-stage execution', async () => {
      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      // Setup credentials and query
      await user.type(screen.getByLabelText(/gemini api key/i), testAPICredentials.gemini);
      await user.type(screen.getByLabelText(/perplexity api key/i), testAPICredentials.perplexity);
      await user.type(screen.getByLabelText(/research query/i), testQueries.complex);

      // Switch to manual mode
      const manualModeToggle = screen.getByLabelText(/manual execution/i);
      await user.click(manualModeToggle);

      // Execute each stage individually
      for (let stage = 1; stage <= 9; stage++) {
        const stageButton = screen.getByRole('button', { name: new RegExp(`execute stage ${stage}`, 'i') });
        await user.click(stageButton);

        await waitFor(() => {
          expect(screen.getByText(new RegExp(`stage ${stage} completed`, 'i'))).toBeInTheDocument();
        });

        // Verify stage-specific content appears
        if (stage === 1) {
          expect(screen.getByText(/initialization/i)).toBeInTheDocument();
        } else if (stage === 9) {
          expect(screen.getByText(/final analysis/i)).toBeInTheDocument();
        }
      }

      // Verify all stages were executed in order
      expect(mockServices.stageEngine.executeStage).toHaveBeenCalledTimes(9);
    });

    it('should handle research pipeline cancellation', async () => {
      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      // Setup and start research
      await user.type(screen.getByLabelText(/gemini api key/i), testAPICredentials.gemini);
      await user.type(screen.getByLabelText(/perplexity api key/i), testAPICredentials.perplexity);
      await user.type(screen.getByLabelText(/research query/i), testQueries.medical);

      const startButton = screen.getByRole('button', { name: /start research/i });
      await user.click(startButton);

      // Wait for execution to start
      await waitFor(() => {
        expect(screen.getByText(/executing/i)).toBeInTheDocument();
      });

      // Cancel execution
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Verify cancellation
      await waitFor(() => {
        expect(screen.getByText(/cancelled/i)).toBeInTheDocument();
      });

      expect(mockServices.backgroundProcessor.cancelTask).toHaveBeenCalled();
    });
  });

  describe('Graph Visualization Integration', () => {
    it('should update graph visualization as stages execute', async () => {
      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      // Setup and start research
      await user.type(screen.getByLabelText(/gemini api key/i), testAPICredentials.gemini);
      await user.type(screen.getByLabelText(/perplexity api key/i), testAPICredentials.perplexity);
      await user.type(screen.getByLabelText(/research query/i), testQueries.technical);

      const startButton = screen.getByRole('button', { name: /start research/i });
      await user.click(startButton);

      // Verify initial graph appears
      await waitFor(() => {
        expect(screen.getByTestId('graph-visualization')).toBeInTheDocument();
      });

      // Verify graph updates after each stage
      await waitFor(() => {
        const graphNodes = screen.getAllByTestId(/graph-node/);
        expect(graphNodes.length).toBeGreaterThan(0);
      });

      // Check for different visualization views
      const viewToggle = screen.getByRole('button', { name: /3d view/i });
      await user.click(viewToggle);

      expect(screen.getByTestId('3d-tree-visualization')).toBeInTheDocument();
    });

    it('should allow graph interaction and node inspection', async () => {
      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      // Setup minimal research session
      await user.type(screen.getByLabelText(/gemini api key/i), testAPICredentials.gemini);
      await user.type(screen.getByLabelText(/research query/i), testQueries.simple);

      // Execute first stage to get nodes
      const manualToggle = screen.getByLabelText(/manual execution/i);
      await user.click(manualToggle);

      const stage1Button = screen.getByRole('button', { name: /execute stage 1/i });
      await user.click(stage1Button);

      await waitFor(() => {
        expect(screen.getByTestId('graph-visualization')).toBeInTheDocument();
      });

      // Click on a graph node
      const graphNode = screen.getByTestId('graph-node-root');
      await user.click(graphNode);

      // Verify node details appear
      expect(screen.getByText(/node details/i)).toBeInTheDocument();
      expect(screen.getByText(/confidence/i)).toBeInTheDocument();
    });

    it('should export graph visualizations', async () => {
      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      // Complete minimal research
      await user.type(screen.getByLabelText(/gemini api key/i), testAPICredentials.gemini);
      await user.type(screen.getByLabelText(/research query/i), testQueries.simple);

      const startButton = screen.getByRole('button', { name: /start research/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/research completed/i)).toBeInTheDocument();
      });

      // Export graph
      const exportButton = screen.getByRole('button', { name: /export graph/i });
      await user.click(exportButton);

      // Verify export options
      expect(screen.getByText(/export as svg/i)).toBeInTheDocument();
      expect(screen.getByText(/export as png/i)).toBeInTheDocument();

      const svgExportButton = screen.getByRole('button', { name: /svg/i });
      await user.click(svgExportButton);

      expect(mockServices.visualization.exportVisualization).toHaveBeenCalledWith('svg');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle API key validation errors', async () => {
      // Mock API key validation failure
      mockServices.api.validateApiKey.mockResolvedValueOnce(false);

      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/gemini api key/i), 'invalid-key');
      await user.type(screen.getByLabelText(/perplexity api key/i), 'invalid-key');

      // Try to start research
      const startButton = screen.getByRole('button', { name: /start research/i });
      await user.click(startButton);

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/invalid api credentials/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /start research/i })).toBeDisabled();
    });

    it('should handle stage execution failures with retry', async () => {
      // Mock stage execution failure then success
      mockServices.stageEngine.executeStage
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(testStageResults[1]);

      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      // Setup and start research
      await user.type(screen.getByLabelText(/gemini api key/i), testAPICredentials.gemini);
      await user.type(screen.getByLabelText(/research query/i), testQueries.simple);

      const startButton = screen.getByRole('button', { name: /start research/i });
      await user.click(startButton);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Retry
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      // Verify retry succeeds
      await waitFor(() => {
        expect(screen.getByText(/stage 1 completed/i)).toBeInTheDocument();
      });
    });

    it('should handle rate limiting gracefully', async () => {
      // Mock rate limit exceeded
      mockServices.api.getRateLimitStatus.mockResolvedValueOnce({
        remaining: 0,
        reset_time: Date.now() + 3600000
      });

      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/gemini api key/i), testAPICredentials.gemini);
      await user.type(screen.getByLabelText(/research query/i), testQueries.simple);

      const startButton = screen.getByRole('button', { name: /start research/i });
      await user.click(startButton);

      // Verify rate limit message
      await waitFor(() => {
        expect(screen.getByText(/rate limit exceeded/i)).toBeInTheDocument();
        expect(screen.getByText(/try again in/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Persistence and Session Management', () => {
    it('should save research session automatically', async () => {
      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      // Complete minimal research
      await user.type(screen.getByLabelText(/gemini api key/i), testAPICredentials.gemini);
      await user.type(screen.getByLabelText(/research query/i), testQueries.simple);

      const startButton = screen.getByRole('button', { name: /start research/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/research completed/i)).toBeInTheDocument();
      });

      // Verify session was saved
      expect(mockServices.supabase.from).toHaveBeenCalledWith('research_sessions');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'asr-got-state',
        expect.stringContaining('currentStage')
      );
    });

    it('should restore previous research session', async () => {
      // Mock saved session
      const savedSession = {
        currentStage: 3,
        query: testQueries.medical,
        stageResults: { 1: testStageResults[1], 2: testStageResults[2], 3: testStageResults[3] }
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedSession));

      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      // Verify session was restored
      await waitFor(() => {
        expect(screen.getByDisplayValue(testQueries.medical)).toBeInTheDocument();
        expect(screen.getByText(/stage 3/i)).toBeInTheDocument();
      });

      // Verify continue option is available
      expect(screen.getByRole('button', { name: /continue research/i })).toBeInTheDocument();
    });

    it('should export complete research report', async () => {
      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      // Complete research
      await user.type(screen.getByLabelText(/gemini api key/i), testAPICredentials.gemini);
      await user.type(screen.getByLabelText(/research query/i), testQueries.technical);

      const startButton = screen.getByRole('button', { name: /start research/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/research completed/i)).toBeInTheDocument();
      });

      // Export report
      const exportButton = screen.getByRole('button', { name: /download report/i });
      await user.click(exportButton);

      // Verify export format options
      expect(screen.getByText(/html report/i)).toBeInTheDocument();
      expect(screen.getByText(/pdf report/i)).toBeInTheDocument();
      expect(screen.getByText(/json data/i)).toBeInTheDocument();

      const htmlExportButton = screen.getByRole('button', { name: /html/i });
      await user.click(htmlExportButton);

      expect(mockServices.stageEngine.exportResults).toHaveBeenCalledWith('html');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large research queries efficiently', async () => {
      const largeQuery = testQueries.simple.repeat(100);

      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/gemini api key/i), testAPICredentials.gemini);
      await user.type(screen.getByLabelText(/research query/i), largeQuery);

      const startTime = Date.now();
      
      const startButton = screen.getByRole('button', { name: /start research/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/executing/i)).toBeInTheDocument();
      });

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });

    it('should handle concurrent user interactions', async () => {
      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      // Setup research
      await user.type(screen.getByLabelText(/gemini api key/i), testAPICredentials.gemini);
      await user.type(screen.getByLabelText(/research query/i), testQueries.complex);

      // Start research
      const startButton = screen.getByRole('button', { name: /start research/i });
      await user.click(startButton);

      // Try multiple concurrent actions
      const promises = [
        user.click(screen.getByRole('button', { name: /cancel/i })),
        user.click(screen.getByRole('button', { name: /settings/i })),
        user.click(screen.getByRole('button', { name: /export/i }))
      ];

      // Should handle concurrent actions without crashing
      await Promise.allSettled(promises);

      expect(screen.getByTestId('research-interface')).toBeInTheDocument();
    });

    it('should provide real-time progress feedback', async () => {
      render(
        <TestWrapper>
          <ResearchInterface />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/gemini api key/i), testAPICredentials.gemini);
      await user.type(screen.getByLabelText(/research query/i), testQueries.medical);

      const startButton = screen.getByRole('button', { name: /start research/i });
      await user.click(startButton);

      // Verify progress indicators
      await waitFor(() => {
        expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
        expect(screen.getByText(/stage 1 of 9/i)).toBeInTheDocument();
      });

      // Verify progress updates
      await waitFor(() => {
        expect(screen.getByText(/11%|22%|33%/)).toBeInTheDocument(); // Progress percentages
      });
    });
  });
});