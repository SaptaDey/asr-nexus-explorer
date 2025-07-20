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
  parameters: ASRGoTParameters
) => {
  await exportAsHTML(stageResults, graphData, researchContext, finalReport, parameters);
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

export const loadApiKeysFromStorage = (): APICredentials => {
  const cached = sessionStorage.getItem('asr-got-credentials');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (error) {
      console.warn('Failed to load cached credentials');
      return { gemini: '', perplexity: '' };
    }
  }
  return { gemini: '', perplexity: '' };
};

export const saveApiKeysToStorage = (apiKeys: APICredentials) => {
  sessionStorage.setItem('asr-got-credentials', JSON.stringify(apiKeys));
};