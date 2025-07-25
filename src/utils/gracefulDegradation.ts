/**
 * Graceful Degradation System
 * Provides fallbacks and alternative approaches when features fail
 */

import React from 'react';
import { toast } from 'sonner';
import { ErrorHandler, ErrorCategory, ErrorSeverity } from './errorHandling';

// Feature availability flags
interface FeatureFlags {
  plotlyVisualization: boolean;
  cytoscapeGraphs: boolean;
  reactFlowGraphs: boolean;
  htmlExport: boolean;
  pdfExport: boolean;
  webSearch: boolean;
  aiProcessing: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  clipboard: boolean;
  fileDownload: boolean;
  notifications: boolean;
}

// Degradation strategies for different features
export enum DegradationStrategy {
  DISABLE = 'disable',
  FALLBACK = 'fallback',
  SIMPLIFIED = 'simplified',
  ALTERNATIVE = 'alternative',
  RETRY = 'retry'
}

interface DegradationConfig {
  strategy: DegradationStrategy;
  fallbackFunction?: () => any;
  alternativeComponent?: React.ComponentType<any>;
  retryLimit?: number;
  userMessage?: string;
}

class GracefulDegradationManager {
  private featureFlags: FeatureFlags;
  private errorHandler: ErrorHandler;
  private degradationConfigs: Map<string, DegradationConfig>;
  private retryCounters: Map<string, number>;

  constructor() {
    this.featureFlags = this.initializeFeatureFlags();
    this.errorHandler = new ErrorHandler();
    this.degradationConfigs = new Map();
    this.retryCounters = new Map();
    this.setupDegradationConfigs();
    this.performInitialFeatureDetection();
  }

  private initializeFeatureFlags(): FeatureFlags {
    return {
      plotlyVisualization: true,
      cytoscapeGraphs: true,
      reactFlowGraphs: true,
      htmlExport: true,
      pdfExport: true,
      webSearch: true,
      aiProcessing: true,
      localStorage: this.checkLocalStorage(),
      sessionStorage: this.checkSessionStorage(),
      clipboard: this.checkClipboard(),
      fileDownload: this.checkFileDownload(),
      notifications: this.checkNotifications(),
    };
  }

  private checkLocalStorage(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private checkSessionStorage(): boolean {
    try {
      const test = '__sessionStorage_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private checkClipboard(): boolean {
    return navigator.clipboard && typeof navigator.clipboard.writeText === 'function';
  }

  private checkFileDownload(): boolean {
    return typeof document !== 'undefined' && 'createElement' in document;
  }

  private checkNotifications(): boolean {
    return 'Notification' in window;
  }

  private setupDegradationConfigs(): void {
    // Visualization fallbacks
    this.degradationConfigs.set('plotlyVisualization', {
      strategy: DegradationStrategy.FALLBACK,
      fallbackFunction: this.getPlotlyFallback,
      userMessage: 'Advanced charts unavailable. Using simplified visualization.'
    });

    this.degradationConfigs.set('cytoscapeGraphs', {
      strategy: DegradationStrategy.ALTERNATIVE,
      alternativeComponent: this.getGraphFallbackComponent,
      userMessage: 'Interactive graph unavailable. Using alternative layout.'
    });

    // Export fallbacks
    this.degradationConfigs.set('htmlExport', {
      strategy: DegradationStrategy.SIMPLIFIED,
      fallbackFunction: this.getSimplifiedHTMLExport,
      userMessage: 'Rich HTML export unavailable. Using basic format.'
    });

    this.degradationConfigs.set('fileDownload', {
      strategy: DegradationStrategy.ALTERNATIVE,
      fallbackFunction: this.getCopyToClipboardFallback,
      userMessage: 'File download unavailable. Content copied to clipboard.'
    });

    // Storage fallbacks
    this.degradationConfigs.set('localStorage', {
      strategy: DegradationStrategy.ALTERNATIVE,
      fallbackFunction: this.getMemoryStorageFallback,
      userMessage: 'Local storage unavailable. Data will be lost on page refresh.'
    });

    // API fallbacks
    this.degradationConfigs.set('webSearch', {
      strategy: DegradationStrategy.RETRY,
      retryLimit: 3,
      fallbackFunction: this.getWebSearchFallback,
      userMessage: 'Web search temporarily unavailable. Using cached data.'
    });

    this.degradationConfigs.set('aiProcessing', {
      strategy: DegradationStrategy.RETRY,
      retryLimit: 2,
      fallbackFunction: this.getAIProcessingFallback,
      userMessage: 'AI processing temporarily unavailable. Using simplified analysis.'
    });
  }

  private async performInitialFeatureDetection(): Promise<void> {
    // Test Plotly availability
    try {
      await import('plotly.js-dist-min');
    } catch {
      this.featureFlags.plotlyVisualization = false;
      console.warn('📊 Plotly.js not available, will use fallback visualization');
    }

    // Test Cytoscape availability
    try {
      await import('cytoscape');
    } catch {
      this.featureFlags.cytoscapeGraphs = false;
      console.warn('🕸️ Cytoscape not available, will use alternative graph rendering');
    }

    // Test other features
    this.featureFlags.localStorage = this.checkLocalStorage();
    this.featureFlags.sessionStorage = this.checkSessionStorage();
    this.featureFlags.clipboard = this.checkClipboard();
  }

  /**
   * Main degradation handler - decides what to do when a feature fails
   */
  public handleFeatureFailure<T>(
    featureName: keyof FeatureFlags,
    error: Error,
    fallbackData?: T
  ): T | null {
    console.warn(`🔄 Feature failure detected: ${featureName}`, error);

    // Mark feature as unavailable
    this.featureFlags[featureName] = false;

    // Get degradation config
    const config = this.degradationConfigs.get(featureName);
    if (!config) {
      console.warn(`No degradation config found for ${featureName}`);
      return fallbackData || null;
    }

    // Handle based on strategy
    switch (config.strategy) {
      case DegradationStrategy.DISABLE:
        this.showDegradationMessage(featureName, config.userMessage);
        return null;

      case DegradationStrategy.FALLBACK:
        if (config.fallbackFunction) {
          try {
            const result = config.fallbackFunction();
            this.showDegradationMessage(featureName, config.userMessage);
            return result;
          } catch (fallbackError) {
            console.error(`Fallback also failed for ${featureName}:`, fallbackError);
            return fallbackData || null;
          }
        }
        break;

      case DegradationStrategy.RETRY:
        const retryCount = this.retryCounters.get(featureName) || 0;
        const retryLimit = config.retryLimit || 3;
        
        if (retryCount < retryLimit) {
          this.retryCounters.set(featureName, retryCount + 1);
          console.log(`🔄 Retrying ${featureName} (attempt ${retryCount + 1}/${retryLimit})`);
          
          // Schedule retry after delay
          setTimeout(() => {
            this.featureFlags[featureName] = true;
          }, Math.pow(2, retryCount) * 1000); // Exponential backoff
          
          return fallbackData || null;
        } else {
          // Max retries reached, use fallback
          this.showDegradationMessage(featureName, config.userMessage);
          return config.fallbackFunction ? config.fallbackFunction() : fallbackData || null;
        }

      case DegradationStrategy.SIMPLIFIED:
      case DegradationStrategy.ALTERNATIVE:
        if (config.fallbackFunction) {
          const result = config.fallbackFunction();
          this.showDegradationMessage(featureName, config.userMessage);
          return result;
        }
        break;
    }

    return fallbackData || null;
  }

  private showDegradationMessage(featureName: string, message?: string): void {
    if (message) {
      toast.info(message, {
        duration: 5000,
        description: `Feature: ${featureName}`
      });
    }
  }

  /**
   * Check if a feature is available
   */
  public isFeatureAvailable(featureName: keyof FeatureFlags): boolean {
    return this.featureFlags[featureName];
  }

  /**
   * Get all feature statuses
   */
  public getFeatureStatuses(): FeatureFlags {
    return { ...this.featureFlags };
  }

  /**
   * Force re-enable a feature (for user-triggered retries)
   */
  public retryFeature(featureName: keyof FeatureFlags): void {
    this.featureFlags[featureName] = true;
    this.retryCounters.delete(featureName);
    console.log(`🔄 Feature ${featureName} manually re-enabled`);
  }

  // Fallback implementations
  private getPlotlyFallback = () => {
    return {
      createChart: (element: HTMLElement, data: any[], layout?: any) => {
        element.innerHTML = `
          <div style="
            display: flex; 
            align-items: center; 
            justify-content: center; 
            height: 100%; 
            min-height: 200px;
            background: #f8f9fa;
            border: 2px dashed #dee2e6;
            border-radius: 8px;
            color: #6c757d;
            font-family: Inter, system-ui, sans-serif;
            text-align: center;
          ">
            <div>
              <div style="font-size: 2rem; margin-bottom: 0.5rem;">📊</div>
              <div style="font-weight: 500;">Chart Data Available</div>
              <div style="font-size: 0.875rem; margin-top: 0.25rem;">
                ${data.length} data series • ${layout?.title || 'Untitled Chart'}
              </div>
            </div>
          </div>
        `;
      }
    };
  };

  private getGraphFallbackComponent = () => {
    return ({ nodes = [], edges = [] }: any) => (
      <div className="h-[600px] w-full border border-border rounded-lg overflow-hidden bg-background flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-4xl mb-4">🕸️</div>
          <h3 className="text-lg font-semibold mb-2">Graph Data Available</h3>
          <p className="text-muted-foreground mb-4">
            {nodes.length} nodes • {edges.length} connections
          </p>
          <div className="text-sm text-muted-foreground">
            Interactive graph rendering is unavailable
          </div>
        </div>
      </div>
    );
  };

  private getSimplifiedHTMLExport = () => {
    return (data: any) => {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>ASR-GoT Analysis Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 2rem; line-height: 1.6; }
            .header { border-bottom: 2px solid #ccc; padding-bottom: 1rem; margin-bottom: 2rem; }
            .section { margin: 2rem 0; padding: 1rem; background: #f9f9f9; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ASR-GoT Analysis Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="section">
            <h2>Research Overview</h2>
            <p><strong>Field:</strong> ${data.researchContext?.field || 'Not specified'}</p>
            <p><strong>Topic:</strong> ${data.researchContext?.topic || 'Not specified'}</p>
          </div>
          <div class="section">
            <h2>Analysis Results</h2>
            <p>This is a simplified export due to limited system capabilities.</p>
            <p>For full functionality, please ensure all required libraries are available.</p>
          </div>
        </body>
        </html>
      `;
    };
  };

  private getCopyToClipboardFallback = () => {
    return (content: string) => {
      if (this.featureFlags.clipboard) {
        navigator.clipboard.writeText(content).then(() => {
          toast.success('Content copied to clipboard');
        }).catch(() => {
          toast.error('Failed to copy to clipboard');
        });
      } else {
        // Show content in modal or textarea for manual copying
        const textarea = document.createElement('textarea');
        textarea.value = content;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
          document.execCommand('copy');
          toast.success('Content copied to clipboard');
        } catch {
          toast.error('Manual copy required - content prepared');
        }
        
        document.body.removeChild(textarea);
      }
    };
  };

  private getMemoryStorageFallback = () => {
    const memoryStorage = new Map<string, string>();
    
    return {
      setItem: (key: string, value: string) => {
        memoryStorage.set(key, value);
      },
      getItem: (key: string) => {
        return memoryStorage.get(key) || null;
      },
      removeItem: (key: string) => {
        memoryStorage.delete(key);
      },
      clear: () => {
        memoryStorage.clear();
      }
    };
  };

  private getWebSearchFallback = () => {
    return {
      search: async (query: string) => {
        console.warn('🔍 Web search unavailable, using cached/mock data');
        return {
          results: [],
          message: 'Web search temporarily unavailable. Please try again later.',
          fallback: true
        };
      }
    };
  };

  private getAIProcessingFallback = () => {
    return {
      process: async (data: any) => {
        console.warn('🧠 AI processing unavailable, using simplified logic');
        return {
          result: 'Simplified analysis completed without AI assistance.',
          confidence: 0.5,
          fallback: true
        };
      }
    };
  }

  /**
   * Create a higher-order component that provides graceful degradation
   */
  public withGracefulDegradation<P extends object>(
    Component: React.ComponentType<P>,
    featureName: keyof FeatureFlags,
    FallbackComponent?: React.ComponentType<P>
  ) {
    return (props: P) => {
      if (this.isFeatureAvailable(featureName)) {
        return <Component {...props} />;
      } else if (FallbackComponent) {
        return <FallbackComponent {...props} />;
      } else {
        return (
          <div className="p-6 text-center border border-dashed border-muted-foreground rounded-lg">
            <div className="text-2xl mb-2">⚠️</div>
            <p className="font-medium mb-1">Feature Unavailable</p>
            <p className="text-sm text-muted-foreground">
              {featureName} is currently unavailable
            </p>
          </div>
        );
      }
    };
  }
}

// Global instance
export const gracefulDegradation = new GracefulDegradationManager();

// Utility functions for common degradation scenarios
export const safeAsync = async <T>(
  operation: () => Promise<T>,
  fallback: T,
  featureName?: keyof FeatureFlags
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    console.warn('🔄 Async operation failed, using fallback:', error);
    
    if (featureName) {
      return gracefulDegradation.handleFeatureFailure(
        featureName,
        error instanceof Error ? error : new Error(String(error)),
        fallback
      ) || fallback;
    }
    
    return fallback;
  }
};

export const safeSync = <T>(
  operation: () => T,
  fallback: T,
  featureName?: keyof FeatureFlags
): T => {
  try {
    return operation();
  } catch (error) {
    console.warn('🔄 Sync operation failed, using fallback:', error);
    
    if (featureName) {
      return gracefulDegradation.handleFeatureFailure(
        featureName,
        error instanceof Error ? error : new Error(String(error)),
        fallback
      ) || fallback;
    }
    
    return fallback;
  }
};

// React hooks for graceful degradation
import { useState, useEffect } from 'react';

export const useFeatureAvailability = (featureName: keyof FeatureFlags) => {
  const [isAvailable, setIsAvailable] = useState(
    gracefulDegradation.isFeatureAvailable(featureName)
  );

  useEffect(() => {
    // Set up periodic checks or event listeners if needed
    const checkAvailability = () => {
      setIsAvailable(gracefulDegradation.isFeatureAvailable(featureName));
    };

    checkAvailability();
    
    // Optional: Set up interval to recheck
    const interval = setInterval(checkAvailability, 30000); // Check every 30s
    
    return () => clearInterval(interval);
  }, [featureName]);

  const retry = () => {
    gracefulDegradation.retryFeature(featureName);
    setIsAvailable(true);
  };

  return { isAvailable, retry };
};

export default gracefulDegradation;