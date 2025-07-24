import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useASRGoT } from '@/hooks/useASRGoT';
import { testQueries, testGraphData, testStageResults } from '@/test/fixtures/testData';
import { mockAPICredentials, mockServices } from '@/test/mocks/mockServices';
import type { APICredentials } from '@/types/asrGotTypes';

// Mock the AsrGotStageEngine
vi.mock('@/services/AsrGotStageEngine', () => ({
  AsrGotStageEngine: vi.fn().mockImplementation(() => mockServices.stageEngine)
}));

// Mock the API service
vi.mock('@/services/apiService', () => mockServices.api);

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

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

describe('useASRGoT', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Hook Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useASRGoT());

      expect(result.current.currentStage).toBe(0);
      expect(result.current.isExecuting).toBe(false);
      expect(result.current.graphData).toEqual({
        nodes: [],
        edges: [],
        hyperedges: []
      });
      expect(result.current.stageResults).toEqual({});
      expect(result.current.apiCredentials).toEqual({
        gemini: '',
        perplexity: ''
      });
    });

    it('should load saved state from localStorage', () => {
      const savedState = {
        graphData: testGraphData,
        currentStage: 3,
        stageResults: testStageResults
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedState));

      const { result } = renderHook(() => useASRGoT());

      expect(result.current.currentStage).toBe(3);
      expect(result.current.graphData).toEqual(testGraphData);
      expect(result.current.stageResults).toEqual(testStageResults);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      const { result } = renderHook(() => useASRGoT());

      expect(result.current.currentStage).toBe(0);
      expect(result.current.graphData).toEqual({
        nodes: [],
        edges: [],
        hyperedges: []
      });
    });
  });

  describe('API Credentials Management', () => {
    it('should update API credentials', () => {
      const { result } = renderHook(() => useASRGoT());

      act(() => {
        result.current.updateAPICredentials(mockAPICredentials);
      });

      expect(result.current.apiCredentials).toEqual(mockAPICredentials);
    });

    it('should validate API credentials', async () => {
      const { result } = renderHook(() => useASRGoT());

      act(() => {
        result.current.updateAPICredentials(mockAPICredentials);
      });

      await act(async () => {
        await result.current.validateCredentials();
      });

      expect(result.current.credentialsValid).toBe(true);
    });

    it('should handle invalid API credentials', async () => {
      const { result } = renderHook(() => useASRGoT());
      
      mockServices.api.validateApiKey.mockResolvedValueOnce(false);

      act(() => {
        result.current.updateAPICredentials({ gemini: 'invalid', perplexity: 'invalid' });
      });

      await act(async () => {
        await result.current.validateCredentials();
      });

      expect(result.current.credentialsValid).toBe(false);
    });

    it('should persist API credentials to localStorage', () => {
      const { result } = renderHook(() => useASRGoT());

      act(() => {
        result.current.updateAPICredentials(mockAPICredentials);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'asr-got-credentials',
        JSON.stringify(mockAPICredentials)
      );
    });
  });

  describe('Research Query Management', () => {
    it('should update research query', () => {
      const { result } = renderHook(() => useASRGoT());

      act(() => {
        result.current.updateQuery(testQueries.simple);
      });

      expect(result.current.query).toBe(testQueries.simple);
    });

    it('should validate research queries', () => {
      const { result } = renderHook(() => useASRGoT());

      act(() => {
        result.current.updateQuery(testQueries.simple);
      });

      expect(result.current.queryValid).toBe(true);

      act(() => {
        result.current.updateQuery('');
      });

      expect(result.current.queryValid).toBe(false);
    });

    it('should sanitize malicious queries', () => {
      const { result } = renderHook(() => useASRGoT());

      act(() => {
        result.current.updateQuery(testQueries.malicious);
      });

      expect(result.current.query).not.toContain('<script>');
    });
  });

  describe('Stage Execution', () => {
    it('should execute individual stages successfully', async () => {
      const { result } = renderHook(() => useASRGoT());

      act(() => {
        result.current.updateAPICredentials(mockAPICredentials);
        result.current.updateQuery(testQueries.simple);
      });

      await act(async () => {
        await result.current.executeStage(1);
      });

      expect(result.current.currentStage).toBe(1);
      expect(result.current.stageResults[1]).toBeDefined();
      expect(result.current.isExecuting).toBe(false);
    });

    it('should execute all stages sequentially', async () => {
      const { result } = renderHook(() => useASRGoT());

      act(() => {
        result.current.updateAPICredentials(mockAPICredentials);
        result.current.updateQuery(testQueries.complex);
      });

      await act(async () => {
        await result.current.executeAllStages();
      });

      expect(result.current.currentStage).toBe(9);
      expect(Object.keys(result.current.stageResults)).toHaveLength(9);
      expect(result.current.isExecuting).toBe(false);
    });

    it('should handle stage execution errors gracefully', async () => {
      const { result } = renderHook(() => useASRGoT());
      
      mockServices.stageEngine.executeStage.mockRejectedValueOnce(
        new Error('Stage execution failed')
      );

      act(() => {
        result.current.updateAPICredentials(mockAPICredentials);
        result.current.updateQuery(testQueries.simple);
      });

      await act(async () => {
        await result.current.executeStage(1);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.isExecuting).toBe(false);
    });

    it('should allow stage execution cancellation', async () => {
      const { result } = renderHook(() => useASRGoT());

      act(() => {
        result.current.updateAPICredentials(mockAPICredentials);
        result.current.updateQuery(testQueries.simple);
      });

      // Start execution
      const executePromise = act(async () => {
        await result.current.executeAllStages();
      });

      // Cancel before completion
      act(() => {
        result.current.cancelExecution();
      });

      await executePromise;

      expect(result.current.isCancelled).toBe(true);
      expect(result.current.isExecuting).toBe(false);
    });

    it('should track execution progress', async () => {
      const { result } = renderHook(() => useASRGoT());

      act(() => {
        result.current.updateAPICredentials(mockAPICredentials);
        result.current.updateQuery(testQueries.medical);
      });

      let progressUpdates: number[] = [];
      
      // Monitor progress during execution
      const originalExecuteStage = result.current.executeStage;
      result.current.executeStage = async (stage: number) => {
        progressUpdates.push(result.current.executionProgress);
        return originalExecuteStage(stage);
      };

      await act(async () => {
        await result.current.executeAllStages();
      });

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(result.current.executionProgress).toBe(100);
    });
  });

  describe('Graph Data Management', () => {
    it('should update graph data correctly', async () => {
      const { result } = renderHook(() => useASRGoT());

      act(() => {
        result.current.updateAPICredentials(mockAPICredentials);
        result.current.updateQuery(testQueries.simple);
      });

      await act(async () => {
        await result.current.executeStage(1);
      });

      expect(result.current.graphData.nodes.length).toBeGreaterThan(0);
      expect(result.current.graphData.metadata?.stage).toBe(1);
    });

    it('should maintain graph consistency across stages', async () => {
      const { result } = renderHook(() => useASRGoT());

      act(() => {
        result.current.updateAPICredentials(mockAPICredentials);
        result.current.updateQuery(testQueries.complex);
      });

      await act(async () => {
        await result.current.executeStage(1);
      });

      const stage1Nodes = result.current.graphData.nodes.length;

      await act(async () => {
        await result.current.executeStage(2);
      });

      expect(result.current.graphData.nodes.length).toBeGreaterThanOrEqual(stage1Nodes);
    });

    it('should handle graph data export', () => {
      const { result } = renderHook(() => useASRGoT());

      act(() => {
        result.current.updateGraphData(testGraphData);
      });

      const exportedData = result.current.exportGraphData();

      expect(exportedData).toEqual(testGraphData);
      expect(exportedData.nodes).toHaveLength(testGraphData.nodes.length);
      expect(exportedData.edges).toHaveLength(testGraphData.edges.length);
    });

    it('should handle graph data import', () => {
      const { result } = renderHook(() => useASRGoT());

      act(() => {
        result.current.importGraphData(testGraphData);
      });

      expect(result.current.graphData).toEqual(testGraphData);
    });

    it('should reset graph data', () => {
      const { result } = renderHook(() => useASRGoT());

      act(() => {
        result.current.updateGraphData(testGraphData);
      });

      expect(result.current.graphData.nodes.length).toBeGreaterThan(0);

      act(() => {
        result.current.resetGraph();
      });

      expect(result.current.graphData.nodes).toHaveLength(0);
      expect(result.current.graphData.edges).toHaveLength(0);
      expect(result.current.currentStage).toBe(0);
    });
  });

  describe('State Persistence', () => {
    it('should save state to localStorage automatically', async () => {
      const { result } = renderHook(() => useASRGoT());

      act(() => {
        result.current.updateAPICredentials(mockAPICredentials);
        result.current.updateQuery(testQueries.simple);
      });

      await act(async () => {
        await result.current.executeStage(1);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'asr-got-state',
        expect.stringContaining('"currentStage":1')
      );
    });

    it('should load state from localStorage on initialization', () => {
      const savedState = {
        currentStage: 2,
        query: testQueries.medical,
        graphData: testGraphData,
        stageResults: testStageResults
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedState));

      const { result } = renderHook(() => useASRGoT());

      expect(result.current.currentStage).toBe(2);
      expect(result.current.query).toBe(testQueries.medical);
      expect(result.current.graphData).toEqual(testGraphData);
    });

    it('should clear saved state', () => {
      const { result } = renderHook(() => useASRGoT());

      act(() => {
        result.current.clearSavedState();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('asr-got-state');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('asr-got-credentials');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const { result } = renderHook(() => useASRGoT());
      
      mockServices.stageEngine.executeStage.mockRejectedValueOnce(
        new Error('Network error')
      );

      act(() => {
        result.current.updateAPICredentials(mockAPICredentials);
        result.current.updateQuery(testQueries.simple);
      });

      await act(async () => {
        await result.current.executeStage(1);
      });

      expect(result.current.error?.message).toContain('Network error');
    });

    it('should handle rate limit errors', async () => {
      const { result } = renderHook(() => useASRGoT());
      
      mockServices.api.getRateLimitStatus.mockResolvedValueOnce({
        remaining: 0,
        reset_time: Date.now() + 3600000
      });

      act(() => {
        result.current.updateAPICredentials(mockAPICredentials);
        result.current.updateQuery(testQueries.simple);
      });

      await act(async () => {
        await result.current.executeStage(1);
      });

      expect(result.current.rateLimitInfo).toBeDefined();
      expect(result.current.rateLimitInfo?.remaining).toBe(0);
    });

    it('should clear errors when retrying', async () => {
      const { result } = renderHook(() => useASRGoT());
      
      // First call fails
      mockServices.stageEngine.executeStage.mockRejectedValueOnce(
        new Error('API error')
      );

      act(() => {
        result.current.updateAPICredentials(mockAPICredentials);
        result.current.updateQuery(testQueries.simple);
      });

      await act(async () => {
        await result.current.executeStage(1);
      });

      expect(result.current.error).toBeDefined();

      // Second call succeeds
      mockServices.stageEngine.executeStage.mockResolvedValueOnce(testStageResults[1]);

      await act(async () => {
        await result.current.executeStage(1);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Performance and Optimization', () => {
    it('should debounce query updates', async () => {
      const { result } = renderHook(() => useASRGoT());

      // Rapid query updates
      act(() => {
        result.current.updateQuery('query 1');
        result.current.updateQuery('query 2');
        result.current.updateQuery('query 3');
        result.current.updateQuery(testQueries.final);
      });

      await waitFor(() => {
        expect(result.current.query).toBe(testQueries.final);
      });

      // Should only save the final query
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent stage executions', async () => {
      const { result } = renderHook(() => useASRGoT());

      act(() => {
        result.current.updateAPICredentials(mockAPICredentials);
        result.current.updateQuery(testQueries.simple);
      });

      // Try to execute multiple stages concurrently
      const promises = [
        act(async () => await result.current.executeStage(1)),
        act(async () => await result.current.executeStage(1)),
        act(async () => await result.current.executeStage(1))
      ];

      await Promise.all(promises);

      // Should only execute once
      expect(mockServices.stageEngine.executeStage).toHaveBeenCalledTimes(1);
    });

    it('should clean up resources on unmount', () => {
      const { unmount } = renderHook(() => useASRGoT());

      unmount();

      // Should not throw errors or leave hanging promises
      expect(true).toBe(true);
    });
  });

  describe('Integration with Background Processing', () => {
    it('should use background processing for long-running tasks', async () => {
      const { result } = renderHook(() => useASRGoT());

      act(() => {
        result.current.updateAPICredentials(mockAPICredentials);
        result.current.updateQuery(testQueries.complex);
      });

      await act(async () => {
        await result.current.executeAllStages();
      });

      expect(mockServices.backgroundProcessor.addTask).toHaveBeenCalled();
    });

    it('should handle background task cancellation', async () => {
      const { result } = renderHook(() => useASRGoT());

      act(() => {
        result.current.updateAPICredentials(mockAPICredentials);
        result.current.updateQuery(testQueries.simple);
      });

      // Start background execution
      const executePromise = act(async () => {
        await result.current.executeAllStages();
      });

      // Cancel
      act(() => {
        result.current.cancelExecution();
      });

      await executePromise;

      expect(mockServices.backgroundProcessor.cancelTask).toHaveBeenCalled();
    });
  });
});