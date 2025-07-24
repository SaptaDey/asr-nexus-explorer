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
vi.mock('@/services/apiService', () => ({
  callGeminiAPI: vi.fn().mockResolvedValue('Mock Gemini response'),
  callPerplexitySonarAPI: vi.fn().mockResolvedValue('Mock Perplexity response')
}));

// Mock background utils to avoid import issues
vi.mock('@/utils/background', () => ({
  queueGeminiCall: vi.fn().mockReturnValue('task-id-123'),
  getTaskResult: vi.fn().mockResolvedValue('mock result'),
  backgroundProcessor: {
    addTask: vi.fn().mockReturnValue('task-id-123'),
    getTaskResult: vi.fn().mockResolvedValue('mock result'),
    getTaskStatus: vi.fn().mockReturnValue('completed')
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
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.graphData).toEqual(expect.objectContaining({
        nodes: [],
        edges: []
      }));
      expect(result.current.stageResults).toEqual([]);
      expect(result.current.apiKeys).toEqual({
        gemini: '',
        perplexity: ''
      });
    });

    it('should have required functions', () => {
      const { result } = renderHook(() => useASRGoT());

      expect(typeof result.current.executeStage).toBe('function');
      expect(typeof result.current.resetFramework).toBe('function');
      expect(typeof result.current.updateApiKeys).toBe('function');
      expect(typeof result.current.exportResults).toBe('function');
    });

    it('should handle API key updates', () => {
      const { result } = renderHook(() => useASRGoT());

      act(() => {
        result.current.updateApiKeys(mockAPICredentials);
      });

      expect(result.current.apiKeys).toEqual(mockAPICredentials);
    });

    it('should handle stage execution', async () => {
      const { result } = renderHook(() => useASRGoT());

      act(() => {
        result.current.updateApiKeys(mockAPICredentials);
      });

      // Check that stage execution function exists and can be called
      expect(typeof result.current.executeStage).toBe('function');
      
      // Test that the function can be called without throwing errors
      await expect(act(async () => {
        await result.current.executeStage(1, testQueries.simple);
      })).resolves.not.toThrow();
    });

    it('should handle framework reset', () => {
      const { result } = renderHook(() => useASRGoT());

      act(() => {
        result.current.resetFramework();
      });

      expect(result.current.currentStage).toBe(0);
      expect(result.current.isProcessing).toBe(false);
    });

    it('should handle parameter updates', () => {
      const { result } = renderHook(() => useASRGoT());

      const newParameters = { 'P1.0': true, 'P1.5': [0.8, 0.8, 0.8, 0.8] };

      act(() => {
        result.current.setParameters(newParameters);
      });

      expect(result.current.parameters).toEqual(expect.objectContaining(newParameters));
    });

    it('should handle auto mode toggle', () => {
      const { result } = renderHook(() => useASRGoT());

      act(() => {
        result.current.setAutoMode(true);
      });

      expect(result.current.autoMode).toBe(true);

      act(() => {
        result.current.setAutoMode(false);
      });

      expect(result.current.autoMode).toBe(false);
    });

    it('should provide session management functions', () => {
      const { result } = renderHook(() => useASRGoT());

      expect(typeof result.current.createSession).toBe('function');
      expect(typeof result.current.loadSession).toBe('function');
      expect(typeof result.current.pauseSession).toBe('function');
      expect(typeof result.current.resumeFromHistory).toBe('function');
      expect(typeof result.current.completeSession).toBe('function');
      // Session ID might be null initially, which is acceptable
      expect(result.current.currentSessionId == null || typeof result.current.currentSessionId === 'string').toBe(true);
    });

    it('should provide computed properties', () => {
      const { result } = renderHook(() => useASRGoT());

      expect(typeof result.current.isComplete).toBe('boolean');
      expect(typeof result.current.hasResults).toBe('boolean');
      expect(typeof result.current.canExportHtml).toBe('boolean');
      expect(typeof result.current.isAutoSaveEnabled).toBe('boolean');
      expect(typeof result.current.isConnected).toBe('boolean');
    });

    it('should handle export functionality', () => {
      const { result } = renderHook(() => useASRGoT());

      expect(typeof result.current.exportResults).toBe('function');
    });

    it('should handle auto-storage methods', () => {
      const { result } = renderHook(() => useASRGoT());

      expect(typeof result.current.forceSave).toBe('function');
      expect(typeof result.current.queueFigureForSaving).toBe('function');
      expect(typeof result.current.queueTableForSaving).toBe('function');
    });
  });
});