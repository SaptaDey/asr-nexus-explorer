import React, { createContext, useContext, useEffect } from 'react';
import { useAccessibility, AccessibilityPreferences, FocusManagement } from '@/hooks/useAccessibility';

interface AccessibilityContextType {
  preferences: AccessibilityPreferences;
  updatePreferences: (updates: Partial<AccessibilityPreferences>) => void;
  isScreenReader: boolean;
  focusManagement: FocusManagement;
  announceLiveRegion: (message: string, priority?: 'polite' | 'assertive') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibilityContext = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibilityContext must be used within an AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const accessibility = useAccessibility();

  // Set up global keyboard navigation listener
  useEffect(() => {
    const handleGlobalKeyboard = (event: KeyboardEvent) => {
      // Skip if we're in an input field
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return;
      }

      // Global keyboard shortcuts for accessibility
      switch (event.key) {
        case 'F1':
          event.preventDefault();
          accessibility.announceLiveRegion(
            'ASR-GoT Scientific Reasoning Interface. Use Tab to navigate, Enter to activate buttons, Space to select checkboxes. Press Alt+H for help.'
          );
          break;
        
        case 'h':
          if (event.altKey) {
            event.preventDefault();
            showKeyboardHelp();
          }
          break;

        case 'c':
          if (event.altKey) {
            event.preventDefault();
            accessibility.updatePreferences({ 
              highContrast: !accessibility.preferences.highContrast 
            });
            accessibility.announceLiveRegion(
              `High contrast mode ${accessibility.preferences.highContrast ? 'disabled' : 'enabled'}`
            );
          }
          break;

        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          if (event.altKey) {
            event.preventDefault();
            const stageNumber = parseInt(event.key);
            jumpToStage(stageNumber - 1);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleGlobalKeyboard);
    return () => document.removeEventListener('keydown', handleGlobalKeyboard);
  }, [accessibility]);

  const showKeyboardHelp = () => {
    const helpText = `
Keyboard Navigation Help for ASR-GoT Interface:

Basic Navigation:
- Tab: Move to next interactive element
- Shift+Tab: Move to previous interactive element
- Enter: Activate buttons and links
- Space: Toggle checkboxes and switches
- Escape: Close dialogs and modals

Interface Shortcuts:
- Alt+1 through Alt+9: Jump to research stages 1-9
- Alt+H: Show this help message
- Alt+C: Toggle high contrast mode
- F1: Announce current interface context

Research Interface:
- R: Start research (when in research tab)
- E: Switch to export tab
- P: Toggle processing mode (manual/automatic)
- S: Save current session (if signed in)

Graph Navigation:
- Arrow keys: Navigate through graph nodes
- Enter: Select graph node for details
- Tab: Move to graph controls

Accessibility Features:
- High contrast mode available
- Screen reader optimized with ARIA labels
- Reduced motion support
- Keyboard-only navigation supported
    `;
    
    accessibility.announceLiveRegion(helpText, 'assertive');
    
    // Also show visual help dialog for sighted users
    const helpDialog = document.createElement('div');
    helpDialog.setAttribute('role', 'dialog');
    helpDialog.setAttribute('aria-labelledby', 'help-title');
    helpDialog.setAttribute('aria-modal', 'true');
    helpDialog.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
    
    // SECURITY: Create DOM elements safely instead of using innerHTML
    const helpContent = document.createElement('div');
    helpContent.className = 'bg-white p-6 rounded-lg max-w-2xl max-h-96 overflow-y-auto';
    
    const helpTitle = document.createElement('h2');
    helpTitle.id = 'help-title';
    helpTitle.className = 'text-xl font-bold mb-4';
    helpTitle.textContent = 'Keyboard Navigation Help';
    
    const helpPre = document.createElement('pre');
    helpPre.className = 'text-sm whitespace-pre-wrap';
    helpPre.textContent = helpText;
    
    const closeButton = document.createElement('button');
    closeButton.id = 'close-help';
    closeButton.className = 'mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700';
    closeButton.textContent = 'Close (Escape)';
    
    helpContent.appendChild(helpTitle);
    helpContent.appendChild(helpPre);
    helpContent.appendChild(closeButton);
    helpDialog.appendChild(helpContent);
    
    document.body.appendChild(helpDialog);
    
    // Focus the close button for keyboard accessibility
    closeButton.focus();
    
    const closeHelp = () => {
      document.body.removeChild(helpDialog);
    };
    
    closeButton.addEventListener('click', closeHelp);
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeHelp();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
  };

  const jumpToStage = (stageIndex: number) => {
    // Try to find stage navigation element
    const stageElement = document.querySelector(`[data-stage="${stageIndex}"]`) as HTMLElement;
    if (stageElement) {
      stageElement.focus();
      accessibility.announceLiveRegion(`Focused on Stage ${stageIndex + 1}`);
    } else {
      accessibility.announceLiveRegion(`Stage ${stageIndex + 1} not currently available`);
    }
  };

  const contextValue: AccessibilityContextType = {
    preferences: accessibility.preferences,
    updatePreferences: accessibility.updatePreferences,
    isScreenReader: accessibility.isScreenReader,
    focusManagement: accessibility.focusManagement,
    announceLiveRegion: accessibility.announceLiveRegion,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
      
      {/* Skip Links */}
      <nav className="sr-only focus-within:not-sr-only">
        <ul className="fixed top-0 left-0 z-50 bg-blue-600 text-white p-2">
          <li>
            <a 
              href="#main-content" 
              className="underline"
              onFocus={() => accessibility.announceLiveRegion('Skip to main content link focused')}
            >
              Skip to main content
            </a>
          </li>
          <li>
            <a 
              href="#research-section" 
              className="underline ml-4"
              onFocus={() => accessibility.announceLiveRegion('Skip to research interface link focused')}
            >
              Skip to research interface
            </a>
          </li>
          <li>
            <a 
              href="#navigation" 
              className="underline ml-4"
              onFocus={() => accessibility.announceLiveRegion('Skip to navigation link focused')}
            >
              Skip to navigation
            </a>
          </li>
        </ul>
      </nav>

      {/* Screen Reader Instructions */}
      <div className="sr-only" aria-live="polite" id="sr-instructions">
        Welcome to ASR-GoT Scientific Reasoning Interface. This application provides AI-powered research analysis through a 9-stage framework. 
        Use Tab to navigate, Enter to activate buttons, and Alt+H for keyboard shortcuts help.
      </div>
    </AccessibilityContext.Provider>
  );
};