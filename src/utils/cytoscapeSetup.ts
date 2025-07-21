import Cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

// Initialize Cytoscape extensions once on module load
let initialized = false;

const setupCytoscapeExtensions = () => {
  if (!initialized) {
    try {
      Cytoscape.use(dagre);
      initialized = true;
      console.log('✅ Cytoscape dagre extension registered successfully');
    } catch (error) {
      console.error('❌ Failed to register Cytoscape dagre extension:', error);
    }
  }
  return Cytoscape;
};

// Auto-initialize on import - ensure this happens before any component uses Cytoscape
const cytoscapeWithExtensions = setupCytoscapeExtensions();

// Export both the configured Cytoscape and the types
export { Core, EdgeSingular, NodeSingular } from 'cytoscape';
export default cytoscapeWithExtensions;