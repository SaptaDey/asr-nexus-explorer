import { useState, useCallback } from 'react';

export type ProcessingMode = 'automatic' | 'manual';

export const useProcessingMode = (initialMode: ProcessingMode = 'manual') => {
  const [mode, setMode] = useState<ProcessingMode>(initialMode);
  const [autoStageDelay, setAutoStageDelay] = useState(3000); // 3 second delay between auto stages

  const toggleMode = useCallback(() => {
    setMode(prev => prev === 'automatic' ? 'manual' : 'automatic');
  }, []);

  const isAutomatic = mode === 'automatic';
  const isManual = mode === 'manual';

  return {
    mode,
    setMode,
    toggleMode,
    isAutomatic,
    isManual,
    autoStageDelay,
    setAutoStageDelay
  };
};