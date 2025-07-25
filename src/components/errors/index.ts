
/**
 * Error Boundary Components Index
 * Comprehensive error handling for different parts of the ASR-GoT application
 */

import React from 'react';

export { DatabaseErrorBoundary, useDatabaseErrorHandler, DatabaseLoadingState, DatabaseConnectionStatus } from './DatabaseErrorBoundary';
export { APIErrorBoundary, useAPIErrorHandler } from './APIErrorBoundary';
export { VisualizationErrorBoundary, SimpleFallbackVisualization, useVisualizationErrorHandler } from './VisualizationErrorBoundary';

// Re-export the main ErrorBoundary from parent directory
export { default as ErrorBoundary } from '../ErrorBoundary';

// Error boundary wrapper utility
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: {
    fallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  }
) {
  return function WrappedComponent(props: P) {
    const ErrorBoundary = require('../ErrorBoundary').default;
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Error boundary types for different use cases
export type ErrorBoundaryType = 'general' | 'database' | 'api' | 'visualization';

/**
 * Factory function to get the appropriate error boundary for a given context
 */
export function getErrorBoundary(type: ErrorBoundaryType) {
  const ErrorBoundary = require('../ErrorBoundary').default;
  
  switch (type) {
    case 'database':
      return DatabaseErrorBoundary;
    case 'api':
      return APIErrorBoundary;
    case 'visualization':
      return VisualizationErrorBoundary;
    default:
      return ErrorBoundary;
  }
}

/**
 * Error context for sharing error state across components
 */
interface ErrorContextType {
  errors: Array<{
    id: string;
    message: string;
    type: ErrorBoundaryType;
    timestamp: Date;
  }>;
  addError: (message: string, type: ErrorBoundaryType) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
}

export const ErrorContext = React.createContext<ErrorContextType | undefined>(undefined);

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [errors, setErrors] = React.useState<ErrorContextType['errors']>([]);

  const addError = React.useCallback((message: string, type: ErrorBoundaryType) => {
    const id = Math.random().toString(36).substr(2, 9);
    setErrors(prev => [...prev, { id, message, type, timestamp: new Date() }]);
  }, []);

  const removeError = React.useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  }, []);

  const clearErrors = React.useCallback(() => {
    setErrors([]);
  }, []);

  return (
    <ErrorContext.Provider value={{ errors, addError, removeError, clearErrors }}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useErrorContext() {
  const context = React.useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorContext must be used within an ErrorProvider');
  }
  return context;
}
