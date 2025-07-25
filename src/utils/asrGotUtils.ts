/**
 * ASR-GoT Utility Functions
 * Export, reset, and other helper functions
 */

import { GraphData, ResearchContext, ASRGoTParameters, APICredentials } from '@/types/asrGotTypes';
import { exportAsHTML, exportAsJSON, exportGraphAsSVG as exportSVG } from './exportUtils';
import { decryptCredentials } from './securityUtils';

export const createInitialGraphData = (): GraphData => ({
  nodes: [],
  edges: [],
  metadata: {
    version: '1.0',
    created: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    stage: 0,
    total_nodes: 0,
    total_edges: 0,
    graph_metrics: {}
  }
});

export const createInitialResearchContext = (): ResearchContext => ({
  field: '',
  topic: '',
  objectives: [],
  hypotheses: [],
  constraints: [],
  biases_detected: [],
  knowledge_gaps: [],
  auto_generated: true
});

export const exportResultsAsMarkdown = (
  stageResults: string[],
  graphData: GraphData,
  researchContext: ResearchContext
): void => {
  const markdown = `# ASR-GoT Analysis Results

## Research Topic
${researchContext.topic}

## Research Field
${researchContext.field}

## Stage Results

${stageResults.map((result, index) => `### Stage ${index + 1}
${result}

`).join('')}

## Graph Data
- Total Nodes: ${graphData.nodes.length}
- Total Edges: ${graphData.edges.length}
- Node Types: ${Array.from(new Set(graphData.nodes.map(n => n.type))).join(', ')}

Generated on: ${new Date().toLocaleString()}
`;

  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'asr-got-analysis.md';
  a.click();
  URL.revokeObjectURL(url);
};

export const exportResultsAsHTML = async (
  stageResults: string[],
  graphData: GraphData,
  researchContext: ResearchContext,
  finalReport: string,
  parameters: ASRGoTParameters,
  sessionId?: string
) => {
  await exportAsHTML(stageResults, graphData, researchContext, finalReport, parameters, sessionId);
};

export const exportResultsAsJSON = (
  stageResults: string[],
  graphData: GraphData,
  researchContext: ResearchContext,
  finalReport: string,
  parameters: ASRGoTParameters
) => {
  exportAsJSON(stageResults, graphData, researchContext, finalReport, parameters);
};

export const exportGraphAsSVG = (graphData: GraphData) => {
  exportSVG(graphData);
};

/**
 * SECURITY: Clean up deprecated insecure credential storage
 * This function automatically removes any legacy insecure credential storage
 */
export const cleanupInsecureCredentialStorage = (): void => {
  const insecureKeys = [
    'asr-got-credentials',
    'asr-got-api-credentials', 
    'api-keys',
    'research-credentials',
    'gemini-key',
    'perplexity-key'
  ];
  
  insecureKeys.forEach(key => {
    if (sessionStorage.getItem(key)) {
      console.warn(`SECURITY: Removing insecure credential storage: ${key} from sessionStorage`);
      sessionStorage.removeItem(key);
    }
    if (localStorage.getItem(key)) {
      console.warn(`SECURITY: Removing insecure credential storage: ${key} from localStorage`);
      localStorage.removeItem(key);
    }
  });
  
  // Log successful cleanup
  if (typeof window !== 'undefined') {
    console.info('✅ Insecure credential storage cleanup completed');
  }
};

// Automatically run cleanup on module load
if (typeof window !== 'undefined') {
  cleanupInsecureCredentialStorage();
}