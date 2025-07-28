import Cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

// Initialize Cytoscape extensions immediately
try {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  Cytoscape.use(dagre);
  console.log('✅ Cytoscape dagre extension registered successfully');
} catch (error) {
  console.error('❌ Failed to register Cytoscape dagre extension:', error);
}

// Export both the configured Cytoscape and the types
export { Core, EdgeSingular, NodeSingular } from 'cytoscape';
export default Cytoscape;