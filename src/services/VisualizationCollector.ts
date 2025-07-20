/**
 * Visualization Collector Service
 * Automatically collects and converts visualizations from the current analysis
 */

export class VisualizationCollector {
  /**
   * Collect all visualizations from the current page
   */
  static async collectAllVisualizations(): Promise<File[]> {
    const files: File[] = [];
    
    try {
      // 1. Collect from canvas elements (Plotly charts, etc.)
      const canvases = document.querySelectorAll('canvas');
      for (let i = 0; i < canvases.length; i++) {
        const canvas = canvases[i];
        try {
          const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, 'image/png');
          });
          
          if (blob) {
            const file = new File([blob], `canvas_chart_${i + 1}.png`, { type: 'image/png' });
            files.push(file);
          }
        } catch (error) {
          console.warn(`Failed to capture canvas ${i}:`, error);
        }
      }
      
      // 2. Collect from SVG elements
      const svgs = document.querySelectorAll('svg');
      for (let i = 0; i < svgs.length; i++) {
        const svg = svgs[i];
        try {
          const svgData = new XMLSerializer().serializeToString(svg);
          const blob = new Blob([svgData], { type: 'image/svg+xml' });
          const file = new File([blob], `svg_chart_${i + 1}.svg`, { type: 'image/svg+xml' });
          files.push(file);
        } catch (error) {
          console.warn(`Failed to capture SVG ${i}:`, error);
        }
      }
      
      // 3. Collect from data URL images
      const dataImages = document.querySelectorAll('img[src^="data:"]');
      for (let i = 0; i < dataImages.length; i++) {
        const img = dataImages[i] as HTMLImageElement;
        try {
          const response = await fetch(img.src);
          const blob = await response.blob();
          const file = new File([blob], `data_image_${i + 1}.png`, { type: blob.type || 'image/png' });
          files.push(file);
        } catch (error) {
          console.warn(`Failed to capture data image ${i}:`, error);
        }
      }
      
      // 4. Collect from Plotly div elements
      const plotlyDivs = document.querySelectorAll('.plotly-graph-div');
      for (let i = 0; i < plotlyDivs.length; i++) {
        const plotlyDiv = plotlyDivs[i] as HTMLElement;
        try {
          // Try to use Plotly's toImage function if available
          if (window.Plotly && window.Plotly.toImage) {
            const imageData = await window.Plotly.toImage(plotlyDiv, {
              format: 'png',
              width: 800,
              height: 600
            });
            
            const response = await fetch(imageData);
            const blob = await response.blob();
            const file = new File([blob], `plotly_chart_${i + 1}.png`, { type: 'image/png' });
            files.push(file);
          }
        } catch (error) {
          console.warn(`Failed to capture Plotly chart ${i}:`, error);
        }
      }
      
      console.log(`📊 Successfully collected ${files.length} visualization files`);
      return files;
      
    } catch (error) {
      console.error('❌ Failed to collect visualizations:', error);
      return [];
    }
  }
  
  /**
   * Convert HTML element to image file
   */
  static async elementToFile(element: HTMLElement, filename: string): Promise<File | null> {
    try {
      // Use html2canvas if available, otherwise try other methods
      if (window.html2canvas) {
        const canvas = await window.html2canvas(element, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true
        });
        
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/png');
        });
        
        if (blob) {
          return new File([blob], filename, { type: 'image/png' });
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to convert element to file:', error);
      return null;
    }
  }
}

// Add global type declarations
declare global {
  interface Window {
    Plotly?: {
      toImage: (element: HTMLElement, options: any) => Promise<string>;
      [key: string]: any;
    };
    html2canvas?: (element: HTMLElement, options: any) => Promise<HTMLCanvasElement>;
  }
}