declare module 'react-cytoscapejs' {
  import { Component } from 'react';
  import cytoscape from 'cytoscape';

  interface CytoscapeComponentProps {
    elements: cytoscape.ElementDefinition[];
    style?: cytoscape.Stylesheet[];
    layout?: cytoscape.LayoutOptions;
    stylesheet?: cytoscape.Stylesheet[];
    cy?: (cy: cytoscape.Core) => void;
    className?: string;
    boxSelectionEnabled?: boolean;
    autounselectify?: boolean;
    userZoomingEnabled?: boolean;
    userPanningEnabled?: boolean;
    minZoom?: number;
    maxZoom?: number;
    zoom?: number;
    pan?: cytoscape.Position;
    [key: string]: any;
  }

  export default class CytoscapeComponent extends Component<CytoscapeComponentProps> {}
}