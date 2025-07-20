import Cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

// Initialize Cytoscape extensions once
let initialized = false;

const setupCytoscapeExtensions = () => {
  if (!initialized && typeof window !== 'undefined') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    Cytoscape.use(dagre);
    initialized = true;
  }
  return Cytoscape;
};

// Auto-initialize on import
setupCytoscapeExtensions();

export default Cytoscape;