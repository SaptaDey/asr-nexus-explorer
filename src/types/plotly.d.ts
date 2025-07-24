// Centralized Plotly.js type definitions
// This file consolidates all Plotly declarations to avoid conflicts

declare global {
  interface Window {
    Plotly?: {
      // Core plotting functions
      newPlot: (element: HTMLElement | string, data: any[], layout?: any, config?: any) => Promise<void>;
      react: (element: HTMLElement | string, data: any[], layout?: any, config?: any) => Promise<void>;
      redraw: (element: HTMLElement | string) => Promise<void>;
      restyle: (element: HTMLElement | string, atrribute: any, indices?: number | number[]) => Promise<void>;
      relayout: (element: HTMLElement | string, layout: any) => Promise<void>;
      
      // Export and image functions
      toImage: (element: HTMLElement, options?: {
        format?: 'png' | 'jpeg' | 'webp' | 'svg' | 'pdf';
        width?: number;
        height?: number;
        scale?: number;
      }) => Promise<string>;
      
      downloadImage: (element: HTMLElement, options?: {
        format?: 'png' | 'jpeg' | 'webp' | 'svg' | 'pdf';
        width?: number;
        height?: number;
        filename?: string;
      }) => Promise<void>;
      
      // Utility functions
      purge: (element: HTMLElement | string) => void;
      validate: (data: any[], layout?: any) => boolean;
      
      // Event handling
      on: (element: HTMLElement | string, event: string, callback: Function) => void;
      removeListener: (element: HTMLElement | string, event: string, callback: Function) => void;
      
      // Additional properties that might be used
      [key: string]: any;
    };
  }
}

// Re-export for modules that might need explicit imports
export interface PlotlyInstance {
  newPlot: (element: HTMLElement | string, data: any[], layout?: any, config?: any) => Promise<void>;
  react: (element: HTMLElement | string, data: any[], layout?: any, config?: any) => Promise<void>;
  redraw: (element: HTMLElement | string) => Promise<void>;
  restyle: (element: HTMLElement | string, atrribute: any, indices?: number | number[]) => Promise<void>;
  relayout: (element: HTMLElement | string, layout: any) => Promise<void>;
  toImage: (element: HTMLElement, options?: any) => Promise<string>;
  downloadImage: (element: HTMLElement, options?: any) => Promise<void>;
  purge: (element: HTMLElement | string) => void;
  validate: (data: any[], layout?: any) => boolean;
  on: (element: HTMLElement | string, event: string, callback: Function) => void;
  removeListener: (element: HTMLElement | string, event: string, callback: Function) => void;
  [key: string]: any;
}

export type PlotlyConfig = {
  responsive?: boolean;
  displayModeBar?: boolean;
  modeBarButtonsToRemove?: string[];
  displaylogo?: boolean;
  editable?: boolean;
  staticPlot?: boolean;
  doubleClick?: 'reset' | 'autosize' | 'reset+autosize' | false;
  [key: string]: any;
};

export type PlotlyData = {
  x?: any[];
  y?: any[];
  z?: any[];
  labels?: string[];
  values?: number[];
  type?: string;
  mode?: string;
  marker?: any;
  line?: any;
  text?: string | string[];
  name?: string;
  hovertemplate?: string;
  [key: string]: any;
};

export type PlotlyLayout = {
  title?: string | { text: string; [key: string]: any };
  xaxis?: any;
  yaxis?: any;
  margin?: any;
  width?: number;
  height?: number;
  showlegend?: boolean;
  [key: string]: any;
};