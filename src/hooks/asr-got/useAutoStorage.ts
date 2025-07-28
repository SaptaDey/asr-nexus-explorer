/**
 * Auto-Storage Hook for ASR-GoT Framework
 * Automatically saves all stage data, figures, and tables to Supabase in real-time
 */

import { useEffect, useRef, useCallback } from 'react';
import { GraphData, ResearchContext } from '@/types/asrGotTypes';
import { queryHistoryService } from '@/services/QueryHistoryService';
import { toast } from 'sonner';

interface AutoStorageOptions {
  enabled: boolean;
  saveInterval: number; // in milliseconds
  saveOnStageComplete: boolean;
  includeProgressIndicators: boolean;
}

export function useAutoStorage(
  currentSessionId: string | null,
  currentStage: number,
  stageResults: string[],
  graphData: GraphData,
  researchContext: ResearchContext | null,
  options: AutoStorageOptions = {
    enabled: true,
    saveInterval: 10000, // 10 seconds
    saveOnStageComplete: true,
    includeProgressIndicators: true
  }
) {
  const lastSavedState = useRef<{
    stage: number;
    resultsLength: number;
    lastSaveTime: number;
  }>({
    stage: -1,
    resultsLength: 0,
    lastSaveTime: 0
  });

  const autoSaveInterval = useRef<NodeJS.Timeout | null>(null);
  const pendingFigures = useRef<any[]>([]);
  const pendingTables = useRef<any[]>([]);

  /**
   * Create new session when research starts
   */
  const createNewSession = useCallback(async (query: string, context: ResearchContext): Promise<string | null> => {
    if (!options.enabled || !context) return null;

    try {
      const sessionId = await queryHistoryService.createSession(query, context);
      
      if (options.includeProgressIndicators) {
        toast.success('📁 Auto-storage enabled - all progress automatically saved', {
          duration: 3000
        });
      }

      return sessionId;
    } catch (error) {
      console.error('Failed to create auto-storage session:', error);
      if (options.includeProgressIndicators) {
        toast.error('⚠️ Auto-storage setup failed - manual saving recommended');
      }
      return null;
    }
  }, [options.enabled, options.includeProgressIndicators]);

  /**
   * Save current state
   */
  const saveCurrentState = useCallback(async (): Promise<void> => {
    if (!options.enabled || !currentSessionId || !researchContext) return;

    try {
      // Check if there's new data to save
      const currentResultsLength = stageResults.filter(r => r && r.trim()).length;
      const hasNewData = 
        currentStage !== lastSavedState.current.stage ||
        currentResultsLength !== lastSavedState.current.resultsLength ||
        Date.now() - lastSavedState.current.lastSaveTime > options.saveInterval;

      if (!hasNewData) return;

      // Save stage progress if there are results
      if (currentStage >= 0 && stageResults[currentStage]) {
        const executionTime = Math.floor((Date.now() - lastSavedState.current.lastSaveTime) / 1000);
        const tokenUsed = Math.ceil(stageResults[currentStage].length / 4); // Rough estimate

        await queryHistoryService.updateStageProgress(
          currentSessionId,
          currentStage,
          stageResults[currentStage],
          graphData,
          tokenUsed,
          executionTime
        );
      }

      // Save pending figures
      if (pendingFigures.current.length > 0) {
        for (const figure of pendingFigures.current) {
          await queryHistoryService.storeFigure(
            currentSessionId,
            figure.stage,
            figure.title,
            figure.description,
            figure.type,
            figure.blob,
            figure.metadata
          );
        }
        pendingFigures.current = [];
      }

      // Save pending tables
      if (pendingTables.current.length > 0) {
        for (const table of pendingTables.current) {
          await queryHistoryService.storeTable(
            currentSessionId,
            table.stage,
            table.title,
            table.description,
            table.data,
            table.schema
          );
        }
        pendingTables.current = [];
      }

      // Update last saved state
      lastSavedState.current = {
        stage: currentStage,
        resultsLength: currentResultsLength,
        lastSaveTime: Date.now()
      };

      console.log(`💾 Auto-saved session ${currentSessionId} at stage ${currentStage}`);
      
    } catch (error) {
      console.error('Auto-save failed:', error);
      if (options.includeProgressIndicators) {
        toast.error('⚠️ Auto-save failed - data may not be preserved');
      }
    }
  }, [
    options.enabled, 
    options.saveInterval, 
    options.includeProgressIndicators,
    currentSessionId, 
    currentStage, 
    stageResults, 
    graphData, 
    researchContext
  ]);

  /**
   * Add figure to pending queue
   */
  const queueFigureForSaving = useCallback((
    stage: number,
    title: string,
    description: string,
    type: 'chart' | 'graph' | 'visualization' | 'plot',
    blob: Blob,
    metadata: any = {}
  ) => {
    if (!options.enabled) return;

    pendingFigures.current.push({
      stage,
      title,
      description,
      type,
      blob,
      metadata
    });

    console.log(`📊 Queued figure for saving: ${title} (Stage ${stage})`);
  }, [options.enabled]);

  /**
   * Add table to pending queue
   */
  const queueTableForSaving = useCallback((
    stage: number,
    title: string,
    description: string,
    data: any[],
    schema: any = {}
  ) => {
    if (!options.enabled) return;

    pendingTables.current.push({
      stage,
      title,
      description,
      data,
      schema
    });

    console.log(`📋 Queued table for saving: ${title} (Stage ${stage})`);
  }, [options.enabled]);

  /**
   * Force immediate save
   */
  const forceSave = useCallback(async (): Promise<void> => {
    await saveCurrentState();
    
    if (options.includeProgressIndicators) {
      toast.success('💾 Progress saved successfully');
    }
  }, [saveCurrentState, options.includeProgressIndicators]);

  /**
   * Pause current session
   */
  const pauseSession = useCallback(async (): Promise<void> => {
    if (!currentSessionId) return;

    try {
      // Save current state before pausing
      await saveCurrentState();
      
      // Mark session as paused
      await queryHistoryService.pauseSession(currentSessionId);
      
      if (options.includeProgressIndicators) {
        toast.success('⏸️ Session paused and saved - can resume later from History tab');
      }
    } catch (error) {
      console.error('Failed to pause session:', error);
      if (options.includeProgressIndicators) {
        toast.error('Failed to pause session');
      }
    }
  }, [currentSessionId, saveCurrentState, options.includeProgressIndicators]);

  /**
   * Complete current session
   */
  const completeSession = useCallback(async (): Promise<void> => {
    if (!currentSessionId) return;

    try {
      // Final save
      await saveCurrentState();
      
      // Mark session as completed
      await queryHistoryService.completeSession(currentSessionId);
      
      if (options.includeProgressIndicators) {
        toast.success('✅ Research session completed and saved to History');
      }
    } catch (error) {
      console.error('Failed to complete session:', error);
      if (options.includeProgressIndicators) {
        toast.error('Failed to complete session');
      }
    }
  }, [currentSessionId, saveCurrentState, options.includeProgressIndicators]);

  /**
   * Set up auto-save interval
   */
  useEffect(() => {
    if (!options.enabled || !currentSessionId) return;

    // Clear existing interval
    if (autoSaveInterval.current) {
      clearInterval(autoSaveInterval.current);
    }

    // Set up new interval
    autoSaveInterval.current = setInterval(() => {
      saveCurrentState();
    }, options.saveInterval);

    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
    };
  }, [options.enabled, options.saveInterval, currentSessionId, saveCurrentState]);

  /**
   * Save on stage completion
   */
  useEffect(() => {
    if (options.enabled && options.saveOnStageComplete && currentSessionId) {
      // Save when stage results change (indicating completion)
      saveCurrentState();
    }
  }, [
    stageResults, 
    currentStage, 
    options.enabled, 
    options.saveOnStageComplete, 
    currentSessionId, 
    saveCurrentState
  ]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
    };
  }, []);

  return {
    createNewSession,
    saveCurrentState,
    queueFigureForSaving,
    queueTableForSaving,
    forceSave,
    pauseSession,
    completeSession,
    isAutoSaveEnabled: options.enabled,
    lastSaveTime: lastSavedState.current.lastSaveTime
  };
}