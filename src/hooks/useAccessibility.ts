import { useState, useEffect, useCallback, useRef } from 'react';
import { systemNotificationManager } from '@/components/ui/FloatingIconSystem';

export interface AccessibilityPreferences {
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderMode: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xl';
  focusVisible: boolean;
  keyboardNavigation: boolean;
}

export interface KeyboardShortcuts {
  [key: string]: () => void;
}

export interface FocusManagement {
  trapFocus: (element: HTMLElement) => () => void;
  restoreFocus: (element?: HTMLElement) => void;
  announceLiveRegion: (message: string, priority?: 'polite' | 'assertive') => void;
}

/**
 * Comprehensive accessibility hook for ASR-GoT interface
 * Provides screen reader support, keyboard navigation, and accessibility preferences
 */
export const useAccessibility = () => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    highContrast: false,
    reducedMotion: false,
    screenReaderMode: false,
    fontSize: 'medium',
    focusVisible: true,
    keyboardNavigation: true,
  });

  const [isScreenReader, setIsScreenReader] = useState(false);
  const liveRegionRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Detect screen reader usage
  useEffect(() => {
    const detectScreenReader = () => {
      // Check for common screen reader indicators
      const hasScreenReader = 
        window.navigator?.userAgent?.includes('NVDA') ||
        window.navigator?.userAgent?.includes('JAWS') ||
        window.speechSynthesis !== undefined ||
        window.getSelection()?.toString() === '' && document.activeElement?.tagName === 'BODY';
      
      setIsScreenReader(hasScreenReader);
      if (hasScreenReader) {
        setPreferences(prev => ({ ...prev, screenReaderMode: true }));
      }
    };

    detectScreenReader();
    
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPreferences(prev => ({ ...prev, reducedMotion: mediaQuery.matches }));
    
    const handleMediaQueryChange = (e: MediaQueryListEvent) => {
      setPreferences(prev => ({ ...prev, reducedMotion: e.matches }));
    };
    
    mediaQuery.addEventListener('change', handleMediaQueryChange);
    return () => mediaQuery.removeEventListener('change', handleMediaQueryChange);
  }, []);

  // Load saved preferences
  useEffect(() => {
    const saved = localStorage.getItem('asr-got-accessibility-preferences');
    if (saved) {
      try {
        const savedPrefs = JSON.parse(saved);
        setPreferences(prev => ({ ...prev, ...savedPrefs }));
      } catch (error) {
        console.warn('Failed to load accessibility preferences:', error);
      }
    }
  }, []);

  // Save preferences when they change
  useEffect(() => {
    localStorage.setItem('asr-got-accessibility-preferences', JSON.stringify(preferences));
    
    // Apply CSS classes based on preferences
    const root = document.documentElement;
    
    root.classList.toggle('high-contrast', preferences.highContrast);
    root.classList.toggle('reduced-motion', preferences.reducedMotion);
    root.classList.toggle('screen-reader-mode', preferences.screenReaderMode);
    root.classList.toggle('large-text', preferences.fontSize === 'large' || preferences.fontSize === 'xl');
    root.classList.toggle('xl-text', preferences.fontSize === 'xl');
    root.classList.toggle('focus-visible', preferences.focusVisible);
  }, [preferences]);

  // Create live region for announcements
  useEffect(() => {
    if (!liveRegionRef.current) {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.setAttribute('aria-label', 'Live announcements');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
      liveRegionRef.current = liveRegion;
    }

    return () => {
      if (liveRegionRef.current) {
        document.body.removeChild(liveRegionRef.current);
        liveRegionRef.current = null;
      }
    };
  }, []);

  const updatePreferences = useCallback((updates: Partial<AccessibilityPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  }, []);

  // Enhanced announcement system using notification bell
  const announceLiveRegion = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Determine notification type based on message content
    let type: 'info' | 'warning' | 'success' | 'error' = 'info';
    
    if (message.toLowerCase().includes('error') || message.toLowerCase().includes('failed')) {
      type = 'error';
    } else if (message.toLowerCase().includes('warning') || message.toLowerCase().includes('limitation')) {
      type = 'warning';
    } else if (message.toLowerCase().includes('success') || message.toLowerCase().includes('complete')) {
      type = 'success';
    }

    // Determine category based on message content
    let category: 'system' | 'stage' | 'auth' | 'general' = 'general';
    
    if (message.toLowerCase().includes('stage') || message.toLowerCase().includes('research')) {
      category = 'stage';
    } else if (message.toLowerCase().includes('auth') || message.toLowerCase().includes('sign') || message.toLowerCase().includes('login')) {
      category = 'auth';
    } else if (message.toLowerCase().includes('backend') || message.toLowerCase().includes('service') || message.toLowerCase().includes('plotly')) {
      category = 'system';
    }

    // Add to system notification manager
    systemNotificationManager.addNotification(message, type, category);
    
    // For critical accessibility messages, still maintain quiet live region for screen readers
    if (priority === 'assertive' && preferences.screenReaderMode && liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', 'assertive');
      liveRegionRef.current.textContent = '';
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = message;
        }
      }, 100);
    }
  }, [preferences.screenReaderMode]);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const restoreFocus = useCallback((element?: HTMLElement) => {
    const targetElement = element || previousFocusRef.current;
    if (targetElement) {
      targetElement.focus();
      previousFocusRef.current = null;
    }
  }, []);

  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  const focusManagement: FocusManagement = {
    trapFocus,
    restoreFocus,
    announceLiveRegion,
  };

  return {
    preferences,
    updatePreferences,
    isScreenReader,
    focusManagement,
    saveFocus,
    announceLiveRegion,
  };
};

/**
 * Hook for managing keyboard shortcuts
 */
export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const combo = [
        event.ctrlKey && 'ctrl',
        event.altKey && 'alt',
        event.shiftKey && 'shift',
        key
      ].filter(Boolean).join('+');

      const action = shortcuts[combo] || shortcuts[key];
      if (action) {
        event.preventDefault();
        action();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
};

/**
 * Hook for enhanced focus management
 */
export const useFocusManagement = () => {
  const activeElementRef = useRef<HTMLElement | null>(null);

  const setFocusWithAnnouncement = useCallback((element: HTMLElement, announcement?: string) => {
    element.focus();
    activeElementRef.current = element;
    
    if (announcement) {
      // Announce focus change to screen readers
      setTimeout(() => {
        const event = new CustomEvent('focus-announcement', { 
          detail: { message: announcement } 
        });
        document.dispatchEvent(event);
      }, 100);
    }
  }, []);

  const moveFocusToNext = useCallback(() => {
    const focusableElements = Array.from(document.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )) as HTMLElement[];

    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    const nextIndex = (currentIndex + 1) % focusableElements.length;
    
    if (focusableElements[nextIndex]) {
      setFocusWithAnnouncement(focusableElements[nextIndex]);
    }
  }, [setFocusWithAnnouncement]);

  const moveFocusToPrevious = useCallback(() => {
    const focusableElements = Array.from(document.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )) as HTMLElement[];

    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    const prevIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
    
    if (focusableElements[prevIndex]) {
      setFocusWithAnnouncement(focusableElements[prevIndex]);
    }
  }, [setFocusWithAnnouncement]);

  return {
    setFocusWithAnnouncement,
    moveFocusToNext,
    moveFocusToPrevious,
    activeElement: activeElementRef.current,
  };
};

/**
 * Hook for generating accessible descriptions for complex content
 */
export const useAccessibleDescription = () => {
  const generateVisualizationDescription = useCallback((graphData: any, currentStage: number) => {
    const nodeCount = graphData?.nodes?.length || 0;
    const edgeCount = graphData?.edges?.length || 0;
    const evidenceNodes = graphData?.nodes?.filter((n: any) => n.type === 'evidence')?.length || 0;
    const hypothesisNodes = graphData?.nodes?.filter((n: any) => n.type === 'hypothesis')?.length || 0;

    return `Graph visualization showing ${nodeCount} nodes and ${edgeCount} connections. 
    Research progress: Stage ${currentStage + 1} of 9. 
    Contains ${evidenceNodes} evidence sources and ${hypothesisNodes} hypotheses. 
    Use arrow keys to navigate through graph elements, or press Tab to move to graph controls.`;
  }, []);

  const generateStageDescription = useCallback((stageIndex: number, stageResult?: string) => {
    const stageNames = [
      'Initialization - Setting up research parameters',
      'Decomposition - Breaking down the research question',
      'Hypothesis Planning - Generating research hypotheses',
      'Evidence Integration - Collecting and analyzing evidence',
      'Pruning and Merging - Optimizing research connections',
      'Subgraph Extraction - Identifying key research pathways',
      'Composition - Synthesizing findings into narrative',
      'Reflection - Quality assurance and bias checking',
      'Final Analysis - Generating comprehensive PhD-level report'
    ];

    const stageName = stageNames[stageIndex] || `Stage ${stageIndex + 1}`;
    const hasResult = stageResult && stageResult.trim().length > 0;
    const resultLength = stageResult?.length || 0;

    return `${stageName}. ${hasResult ? `Completed with ${Math.round(resultLength / 100)} hundred characters of analysis.` : 'Not yet completed.'}`;
  }, []);

  return {
    generateVisualizationDescription,
    generateStageDescription,
  };
};