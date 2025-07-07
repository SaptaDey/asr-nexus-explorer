/**
 * ASR-GoT Utility Functions
 * Export, reset, and other helper functions
 */

import { GraphData, ResearchContext, ASRGoTParameters } from '@/types/asrGotTypes';
import { completeASRGoTParameters } from '@/config/asrGotParameters';

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

export const exportResultsAsJSON = (
  stageResults: string[],
  graphData: GraphData,
  researchContext: ResearchContext,
  finalReport: string,
  parameters: ASRGoTParameters
): void => {
  const exportData = {
    metadata: {
      exported_at: new Date().toISOString(),
      framework_version: 'ASR-GoT v2025.07.07',
      stages_completed: stageResults.length,
      total_nodes: graphData.nodes.length,
      total_edges: graphData.edges.length
    },
    research_context: researchContext,
    graph_data: graphData,
    stage_results: stageResults,
    final_report: finalReport,
    parameters_used: parameters
  };

  const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(jsonBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ASR-GoT-Analysis-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const loadApiKeysFromStorage = () => {
  const cached = sessionStorage.getItem('asr-got-credentials');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (error) {
      console.warn('Failed to load cached credentials');
      return { perplexity: '', gemini: '' };
    }
  }
  return { perplexity: '', gemini: '' };
};

export const saveApiKeysToStorage = (apiKeys: { perplexity: string; gemini: string }) => {
  sessionStorage.setItem('asr-got-credentials', JSON.stringify(apiKeys));
};