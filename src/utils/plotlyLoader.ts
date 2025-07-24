/**
 * Dynamic Plotly.js Loader with Error Handling
 * Implements lazy loading with fallbacks and caching
 */

import { toast } from 'sonner';

interface PlotlyModule {
  default: any;
  newPlot: (div: HTMLElement, data: any[], layout?: any, config?: any) => Promise<void>;
  react: (div: HTMLElement, data: any[], layout?: any, config?: any) => Promise<void>;
  purge: (div: HTMLElement) => void;
  downloadImage: (div: HTMLElement, options?: any) => Promise<string>;
}

// Global cache for loaded Plotly instance
let plotlyInstance: PlotlyModule | null = null;
let loadingPromise: Promise<PlotlyModule> | null = null;

/**
 * Dynamically loads Plotly.js with error handling and fallbacks
 */
export const loadPlotly = async (): Promise<PlotlyModule> => {
  // Return cached instance if available
  if (plotlyInstance) {
    return plotlyInstance;
  }

  // Return existing loading promise if already loading
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      // Try to load the main plotly module
      const module = await import('plotly.js-dist-min');
      
      // Verify the module loaded correctly
      if (!module.default && !module.newPlot) {
        throw new Error('Plotly module loaded but missing required functions');
      }

      plotlyInstance = {
        default: module.default || module,
        newPlot: module.newPlot || module.default?.newPlot,
        react: module.react || module.default?.react,
        purge: module.purge || module.default?.purge,
        downloadImage: module.downloadImage || module.default?.downloadImage,
      };

      console.log('📊 Plotly.js loaded successfully');
      return plotlyInstance;
    } catch (error) {
      console.error('❌ Failed to load Plotly.js:', error);
      
      // Reset loading promise so we can retry
      loadingPromise = null;
      
      // Try fallback approach
      try {
        // Fallback: try loading from window if available (CDN)
        if (typeof window !== 'undefined' && (window as any).Plotly) {
          const windowPlotly = (window as any).Plotly;
          plotlyInstance = {
            default: windowPlotly,
            newPlot: windowPlotly.newPlot,
            react: windowPlotly.react,
            purge: windowPlotly.purge,
            downloadImage: windowPlotly.downloadImage,
          };
          console.log('📊 Plotly.js loaded from window object');
          return plotlyInstance;
        }
      } catch (fallbackError) {
        console.error('❌ Fallback loading also failed:', fallbackError);
      }

      // Create minimal mock for graceful degradation
      const mockPlotly: PlotlyModule = {
        default: null,
        newPlot: async () => {
          toast.error('Chart visualization unavailable - Plotly.js failed to load');
          console.warn('🚫 Plotly newPlot called but library not available');
        },
        react: async () => {
          toast.error('Chart visualization unavailable - Plotly.js failed to load');
          console.warn('🚫 Plotly react called but library not available');
        },
        purge: () => {
          console.warn('🚫 Plotly purge called but library not available');
        },
        downloadImage: async () => {
          toast.error('Chart export unavailable - Plotly.js failed to load');
          console.warn('🚫 Plotly downloadImage called but library not available');
          return '';
        },
      };

      plotlyInstance = mockPlotly;
      throw new Error(`Failed to load Plotly.js: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  })();

  return loadingPromise;
};

/**
 * Safe wrapper for creating Plotly charts with error handling
 */
export const createPlotlyChart = async (
  element: HTMLElement | string,
  data: any[],
  layout?: any,
  config?: any
): Promise<boolean> => {
  try {
    const plotly = await loadPlotly();
    
    if (!plotly.newPlot) {
      throw new Error('Plotly newPlot function not available');
    }

    const div = typeof element === 'string' ? document.getElementById(element) : element;
    if (!div) {
      throw new Error('Chart container element not found');
    }

    // Add default config for better performance
    const defaultConfig = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'autoScale2d'],
      ...config
    };

    // Add default layout for better appearance
    const defaultLayout = {
      font: { family: 'Inter, system-ui, sans-serif', size: 12 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      margin: { l: 50, r: 50, t: 50, b: 50 },
      ...layout
    };

    await plotly.newPlot(div, data, defaultLayout, defaultConfig);
    return true;
  } catch (error) {
    console.error('❌ Failed to create Plotly chart:', error);
    
    // Show fallback content
    const div = typeof element === 'string' ? document.getElementById(element) : element;
    if (div) {
      div.innerHTML = `
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
            <div style="font-weight: 500;">Chart Unavailable</div>
            <div style="font-size: 0.875rem; margin-top: 0.25rem;">
              Visualization failed to load
            </div>
          </div>
        </div>
      `;
    }
    
    return false;
  }
};

/**
 * Safe wrapper for updating Plotly charts
 */
export const updatePlotlyChart = async (
  element: HTMLElement | string,
  data: any[],
  layout?: any
): Promise<boolean> => {
  try {
    const plotly = await loadPlotly();
    
    if (!plotly.react) {
      // Fallback to newPlot if react is not available
      return createPlotlyChart(element, data, layout);
    }

    const div = typeof element === 'string' ? document.getElementById(element) : element;
    if (!div) {
      throw new Error('Chart container element not found');
    }

    await plotly.react(div, data, layout);
    return true;
  } catch (error) {
    console.error('❌ Failed to update Plotly chart:', error);
    return false;
  }
};

/**
 * Safe cleanup for Plotly charts
 */
export const cleanupPlotlyChart = (element: HTMLElement | string): void => {
  try {
    if (!plotlyInstance?.purge) {
      return;
    }

    const div = typeof element === 'string' ? document.getElementById(element) : element;
    if (div) {
      plotlyInstance.purge(div);
    }
  } catch (error) {
    console.error('❌ Failed to cleanup Plotly chart:', error);
  }
};

/**
 * Export chart as image with error handling
 */
export const exportPlotlyChart = async (
  element: HTMLElement | string,
  options?: { format?: 'png' | 'svg' | 'jpeg'; width?: number; height?: number }
): Promise<string | null> => {
  try {
    const plotly = await loadPlotly();
    
    if (!plotly.downloadImage) {
      throw new Error('Plotly downloadImage function not available');
    }

    const div = typeof element === 'string' ? document.getElementById(element) : element;
    if (!div) {
      throw new Error('Chart container element not found');
    }

    const defaultOptions = {
      format: 'png' as const,
      width: 800,
      height: 600,
      ...options
    };

    return await plotly.downloadImage(div, defaultOptions);
  } catch (error) {
    console.error('❌ Failed to export Plotly chart:', error);
    toast.error('Failed to export chart');
    return null;
  }
};

/**
 * Check if Plotly is available without loading it
 */
export const isPlotlyAvailable = (): boolean => {
  return plotlyInstance !== null;
};

/**
 * Preload Plotly for better performance
 */
export const preloadPlotly = (): void => {
  // Start loading in background but don't wait for it
  loadPlotly().catch(() => {
    // Ignore errors during preloading
  });
};