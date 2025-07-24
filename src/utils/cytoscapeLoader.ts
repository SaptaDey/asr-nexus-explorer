/**
 * Safe Cytoscape Loader with Extension Management
 * Handles dynamic loading of Cytoscape and its extensions with error recovery
 */

import { toast } from 'sonner';

interface CytoscapeInstance {
  core: any;
  extensions: {
    dagre?: boolean;
    cola?: boolean;
    fcose?: boolean;
  };
}

// Global cache for Cytoscape instance
let cytoscapeInstance: CytoscapeInstance | null = null;
let loadingPromise: Promise<CytoscapeInstance> | null = null;

/**
 * Safely loads Cytoscape with extensions
 */
export const loadCytoscape = async (): Promise<CytoscapeInstance> => {
  // Return cached instance if available
  if (cytoscapeInstance) {
    return cytoscapeInstance;
  }

  // Return existing loading promise if already loading
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      console.log('📊 Loading Cytoscape.js...');
      
      // Load main Cytoscape module
      const Cytoscape = await import('cytoscape');
      const cytoscape = Cytoscape.default || Cytoscape;
      
      if (!cytoscape) {
        throw new Error('Cytoscape failed to load');
      }

      const instance: CytoscapeInstance = {
        core: cytoscape,
        extensions: {}
      };

      // Try to load extensions with individual error handling
      try {
        const dagre = await import('cytoscape-dagre');
        cytoscape.use(dagre.default || dagre);
        instance.extensions.dagre = true;
        console.log('✅ Cytoscape dagre extension loaded');
      } catch (error) {
        console.warn('⚠️ Failed to load dagre extension:', error);
        instance.extensions.dagre = false;
      }

      // Try to load additional layout extensions
      try {
        // Try to load fcose for better force-directed layouts
        const fcose = await import('cytoscape-fcose');
        cytoscape.use(fcose.default || fcose);
        instance.extensions.fcose = true;
        console.log('✅ Cytoscape fcose extension loaded');
      } catch (error) {
        console.warn('⚠️ Failed to load fcose extension (optional):', error);
        instance.extensions.fcose = false;
      }

      cytoscapeInstance = instance;
      console.log('📊 Cytoscape.js loaded successfully');
      return instance;
    } catch (error) {
      console.error('❌ Failed to load Cytoscape.js:', error);
      
      // Reset loading promise so we can retry
      loadingPromise = null;
      
      // Create minimal mock for graceful degradation
      const mockCytoscape = {
        core: null,
        extensions: { dagre: false, cola: false, fcose: false }
      };

      cytoscapeInstance = mockCytoscape;
      throw new Error(`Failed to load Cytoscape.js: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  })();

  return loadingPromise;
};

/**
 * Gets available layout algorithms based on loaded extensions
 */
export const getAvailableLayouts = async (): Promise<string[]> => {
  try {
    const instance = await loadCytoscape();
    const layouts = ['grid', 'circle', 'concentric', 'breadthfirst', 'cose'];
    
    if (instance.extensions.dagre) {
      layouts.push('dagre');
    }
    
    if (instance.extensions.fcose) {
      layouts.push('fcose');
    }
    
    return layouts;
  } catch (error) {
    console.error('❌ Failed to get available layouts:', error);
    return ['grid', 'circle']; // Fallback basic layouts
  }
};

/**
 * Creates a safe Cytoscape layout configuration
 */
export const createSafeLayoutConfig = async (
  preferredLayout: string = 'dagre',
  nodeCount: number = 0
): Promise<any> => {
  try {
    const availableLayouts = await getAvailableLayouts();
    let layoutName = availableLayouts.includes(preferredLayout) ? preferredLayout : 'cose';
    
    // Adjust layout based on node count for performance
    if (nodeCount > 100) {
      layoutName = availableLayouts.includes('fcose') ? 'fcose' : 
                   availableLayouts.includes('cose') ? 'cose' : 'grid';
    }
    
    console.log(`🎯 Using layout: ${layoutName} for ${nodeCount} nodes`);
    
    const baseConfig = {
      name: layoutName,
      animate: nodeCount < 50,
      animationDuration: Math.min(1000, Math.max(200, nodeCount * 10)),
      fit: true,
      padding: 50,
      randomize: false,
      componentSpacing: 40,
      nodeRepulsion: 400000,
      nodeOverlap: 10,
      idealEdgeLength: 50,
      edgeElasticity: 100,
      nestingFactor: 5,
      gravity: 80,
      numIter: Math.min(1000, Math.max(100, nodeCount * 5)),
      initialTemp: 200,
      coolingFactor: 0.99,
      minTemp: 1.0
    };

    // Layout-specific configurations
    switch (layoutName) {
      case 'dagre':
        return {
          ...baseConfig,
          name: 'dagre',
          nodeSep: 30,
          edgeSep: 10,
          rankSep: 50,
          rankDir: 'TB',
          ranker: 'network-simplex',
        };
        
      case 'fcose':
        return {
          ...baseConfig,
          name: 'fcose',
          quality: nodeCount < 100 ? 'default' : 'draft',
          numIter: Math.min(2500, Math.max(500, nodeCount * 10)),
          sampleSize: Math.min(nodeCount, 25),
          nodeSeparation: 75,
          piTol: 0.0000001,
          nodeRepulsion: node => 4500,
          idealEdgeLength: edge => 50,
          edgeElasticity: edge => 0.45,
          nestingFactor: 0.1,
          gravity: 0.4,
          gravityRangeCompound: 1.5,
          gravityCompound: 1.0,
          gravityRange: 3.8,
          initialEnergyOnIncremental: 0.3,
        };
        
      case 'cose':
        return {
          ...baseConfig,
          name: 'cose',
          nodeOverlap: 20,
          refresh: 20,
          randomize: nodeCount < 20,
        };
        
      case 'grid':
        return {
          name: 'grid',
          fit: true,
          padding: 30,
          boundingBox: undefined,
          avoidOverlap: true,
          avoidOverlapPadding: 10,
          nodeDimensionsIncludeLabels: false,
          spacingFactor: undefined,
          condense: false,
          rows: Math.ceil(Math.sqrt(nodeCount)),
          cols: undefined,
          position: function(node) { return undefined; },
          sort: undefined,
          animate: false,
        };
        
      default:
        return baseConfig;
    }
  } catch (error) {
    console.error('❌ Failed to create layout config:', error);
    
    // Return most basic configuration as fallback
    return {
      name: 'grid',
      fit: true,
      padding: 30,
      animate: false
    };
  }
};

/**
 * Creates safe Cytoscape style configuration
 */
export const createSafeStyleConfig = (): any[] => {
  try {
    return [
      // Node styles
      {
        selector: 'node',
        style: {
          'background-color': 'data(color)',
          'label': 'data(label)',
          'width': 'data(size)',
          'height': 'data(size)',
          'text-valign': 'center',
          'text-halign': 'center',
          'font-size': '12px',
          'font-family': 'Inter, system-ui, sans-serif',
          'color': 'white',
          'text-outline-width': 2,
          'text-outline-color': 'data(color)',
          'border-width': 2,
          'border-color': 'data(borderColor)',
          'shape': 'data(shape)',
        }
      },
      
      // Edge styles
      {
        selector: 'edge',
        style: {
          'width': 'data(weight)',
          'line-color': 'data(color)',
          'target-arrow-color': 'data(color)',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'arrow-scale': 1.5,
        }
      },
      
      // Selected node style
      {
        selector: 'node:selected',
        style: {
          'border-width': 4,
          'border-color': '#3b82f6',
          'background-color': 'data(selectedColor)',
        }
      },
      
      // Selected edge style
      {
        selector: 'edge:selected',
        style: {
          'width': 4,
          'line-color': '#3b82f6',
          'target-arrow-color': '#3b82f6',
        }
      },
      
      // Hover effects
      {
        selector: 'node:active',
        style: {
          'overlay-opacity': 0.2,
          'overlay-color': '#3b82f6',
        }
      },
      
      // Cluster nodes
      {
        selector: 'node[type="cluster"]',
        style: {
          'shape': 'round-rectangle',
          'background-color': '#ec4899',
          'border-width': 3,
          'border-color': '#be185d',
          'font-weight': 'bold',
        }
      },
    ];
  } catch (error) {
    console.error('❌ Failed to create style config:', error);
    
    // Return minimal style as fallback
    return [
      {
        selector: 'node',
        style: {
          'background-color': '#6b7280',
          'label': 'data(id)',
          'width': 30,
          'height': 30,
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 2,
          'line-color': '#9ca3af',
          'target-arrow-color': '#9ca3af',
          'target-arrow-shape': 'triangle',
        }
      }
    ];
  }
};

/**
 * Safely executes a Cytoscape layout with error handling
 */
export const executeLayoutSafely = async (
  cyRef: any,
  layoutConfig: any,
  onComplete?: () => void,
  onError?: (error: Error) => void
): Promise<boolean> => {
  try {
    if (!cyRef || !cyRef.current) {
      throw new Error('Cytoscape reference not available');
    }

    const cy = cyRef.current;
    
    console.log(`🎯 Executing layout: ${layoutConfig.name}`);
    
    const layout = cy.layout(layoutConfig);
    
    // Set up event handlers
    let completed = false;
    
    const handleComplete = () => {
      if (!completed) {
        completed = true;
        console.log(`✅ Layout ${layoutConfig.name} completed successfully`);
        onComplete?.();
      }
    };
    
    const handleError = (error: any) => {
      if (!completed) {
        completed = true;
        console.error(`❌ Layout ${layoutConfig.name} failed:`, error);
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    };
    
    // Set timeout as fallback
    const timeout = setTimeout(() => {
      if (!completed) {
        console.warn(`⚠️ Layout ${layoutConfig.name} timed out`);
        handleError(new Error('Layout execution timed out'));
      }
    }, 10000); // 10 second timeout
    
    layout.one('layoutstop', () => {
      clearTimeout(timeout);
      handleComplete();
    });
    
    layout.on('layouterror', (event: any) => {
      clearTimeout(timeout);
      handleError(event.error || new Error('Layout error'));
    });
    
    // Start the layout
    layout.run();
    
    return true;
  } catch (error) {
    console.error('❌ Failed to execute layout:', error);
    onError?.(error instanceof Error ? error : new Error(String(error)));
    return false;
  }
};

/**
 * Check if Cytoscape is available without loading it
 */
export const isCytoscapeAvailable = (): boolean => {
  return cytoscapeInstance !== null && cytoscapeInstance.core !== null;
};

/**
 * Preload Cytoscape for better performance
 */
export const preloadCytoscape = (): void => {
  // Start loading in background but don't wait for it
  loadCytoscape().catch(() => {
    // Ignore errors during preloading
  });
};