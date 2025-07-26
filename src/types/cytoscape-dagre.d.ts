declare module 'cytoscape-dagre' {
  import cytoscape from 'cytoscape';

  interface DagreLayoutOptions extends cytoscape.BaseLayoutOptions {
    name: 'dagre';
    nodeSep?: number;
    edgeSep?: number;
    rankSep?: number;
    rankDir?: 'TB' | 'BT' | 'LR' | 'RL';
    align?: 'UL' | 'UR' | 'DL' | 'DR';
    acyclicer?: 'greedy' | undefined;
    ranker?: 'network-simplex' | 'tight-tree' | 'longest-path';
    minLen?: (edge: any) => number;
    edgeWeight?: (edge: any) => number;
    // Add other dagre-specific options as needed
  }

  const dagre: cytoscape.Ext;
  export = dagre;
}