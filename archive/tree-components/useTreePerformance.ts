/**
 * useTreePerformance.ts - Performance monitoring for botanical tree visualization
 * Frame time tracking and performance optimization utilities
 */

import { useCallback } from 'react';

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const measureFrameTime = useCallback(() => {
    performance.mark('frame-start');
    
    requestAnimationFrame(() => {
      performance.mark('frame-end');
      performance.measure('frame-duration', 'frame-start', 'frame-end');
      
      const entries = performance.getEntriesByName('frame-duration');
      const lastEntry = entries[entries.length - 1];
      
      if (lastEntry && lastEntry.duration > 16) {
        console.warn(`Frame drop detected: ${lastEntry.duration}ms (target: 16ms)`);
      }
      
      performance.clearMarks();
      performance.clearMeasures();
    });
  }, []);

  return { measureFrameTime };
};