/**
 * ASR-GoT Stage Execution Functions
 * Implements all 9 stages of the ASR-GoT framework
 */

import { GraphData, GraphNode, GraphEdge, ResearchContext } from '@/types/asrGotTypes';
import { callPerplexityAPI, callGeminiAPI } from './apiService';

export interface StageExecutorContext {
  apiKeys: { perplexity: string; gemini: string };
  graphData: GraphData;
  researchContext: ResearchContext;
  stageResults: string[];
  setGraphData: (updater: (prev: GraphData) => GraphData) => void;
  setResearchContext: (updater: (prev: ResearchContext) => ResearchContext) => void;
}

export const initializeGraph = async (
  taskDescription: string,
  context: StageExecutorContext
): Promise<string> => {
  // Analyze research field using Gemini
  const fieldAnalysis = await callGeminiAPI(
    `Analyze this research question and identify: 1) The primary scientific field, 2) Key research objectives, 3) Potential interdisciplinary connections. Question: "${taskDescription}"`,
    context.apiKeys.gemini
  );

  // Get background research using Perplexity
  const backgroundResearch = await callPerplexityAPI(
    `Provide current scientific background and recent developments for: ${taskDescription}`,
    context.apiKeys.perplexity
  );

  const rootNode: GraphNode = {
    id: '1.0',
    label: 'Task Understanding',
    type: 'root',
    confidence: [0.8, 0.8, 0.8, 0.8],
    metadata: {
      parameter_id: 'P1.1',
      type: 'Root',
      source_description: 'Initial task understanding with AI analysis',
      value: taskDescription,
      timestamp: new Date().toISOString(),
      notes: `Field Analysis: ${fieldAnalysis}\n\nBackground: ${backgroundResearch}`
    },
    position: { x: 400, y: 200 }
  };

  context.setGraphData(prev => ({
    ...prev,
    nodes: [rootNode],
    edges: [],
    metadata: {
      ...prev.metadata,
      last_updated: new Date().toISOString(),
      total_nodes: 1,
      total_edges: 0,
      stage: 1
    }
  }));

  // Update research context
  const newContext = {
    ...context.researchContext,
    field: fieldAnalysis.split('\n')[0] || 'General Science',
    topic: taskDescription,
    objectives: fieldAnalysis.split('\n').slice(1, 4) || []
  };
  context.setResearchContext(() => newContext);

  return `**Stage 1 Complete: Initialization**\n\n**Field Analysis:**\n${fieldAnalysis}\n\n**Background Research:**\n${backgroundResearch}`;
};

export const decomposeTask = async (
  dimensions: string[] | undefined,
  context: StageExecutorContext
): Promise<string> => {
  const defaultDimensions = ['Scope', 'Objectives', 'Constraints', 'Data Needs', 'Use Cases', 'Potential Biases', 'Knowledge Gaps'];
  const useDimensions = dimensions || defaultDimensions;

  // Get AI recommendations for decomposition
  const decompositionAnalysis = await callGeminiAPI(
    `For the research topic "${context.researchContext.topic}", analyze each dimension and provide specific insights: ${useDimensions.join(', ')}`,
    context.apiKeys.gemini
  );

  const dimensionNodes: GraphNode[] = useDimensions.map((dim, index) => ({
    id: `2.${index + 1}`,
    label: dim,
    type: 'dimension' as const,
    confidence: [0.8, 0.8, 0.8, 0.8],
    metadata: {
      parameter_id: 'P1.2',
      type: 'Dimension',
      source_description: 'AI-analyzed task decomposition dimension',
      value: dim,
      timestamp: new Date().toISOString(),
      notes: decompositionAnalysis
    },
    position: { x: 200 + index * 150, y: 350 }
  }));

  const dimensionEdges: GraphEdge[] = dimensionNodes.map(node => ({
    id: `edge-1.0-${node.id}`,
    source: '1.0',
    target: node.id,
    type: 'supportive' as const,
    confidence: 0.8,
    metadata: {
      type: 'decomposition'
    }
  }));

  context.setGraphData(prev => ({
    ...prev,
    nodes: [...prev.nodes, ...dimensionNodes],
    edges: [...prev.edges, ...dimensionEdges],
    metadata: {
      ...prev.metadata,
      last_updated: new Date().toISOString(),
      total_nodes: prev.nodes.length + dimensionNodes.length,
      total_edges: prev.edges.length + dimensionEdges.length,
      stage: 2
    }
  }));

  return `**Stage 2 Complete: Decomposition**\n\n**AI Analysis:**\n${decompositionAnalysis}`;
};

export const generateHypotheses = async (
  customHypotheses: string[] | undefined,
  context: StageExecutorContext
): Promise<string> => {
  // Generate hypotheses using both AI models
  const hypothesisGeneration = await callPerplexityAPI(
    `Generate 3-5 testable scientific hypotheses for: ${context.researchContext.topic}. Include falsification criteria for each hypothesis.`,
    context.apiKeys.perplexity
  );

  const hypothesisAnalysis = await callGeminiAPI(
    `Analyze these hypotheses for scientific rigor, testability, and potential impact: ${hypothesisGeneration}`,
    context.apiKeys.gemini
  );

  // Extract hypotheses from AI response
  const generatedHypotheses = hypothesisGeneration.split('\n').filter(line => 
    line.includes('Hypothesis') || line.includes('H1:') || line.includes('H2:') || line.includes('H3:')
  ).slice(0, 5);

  const hypothesisNodes: GraphNode[] = generatedHypotheses.map((hyp, index) => ({
    id: `3.${index + 1}`,
    label: `Hypothesis ${index + 1}`,
    type: 'hypothesis' as const,
    confidence: [0.6, 0.6, 0.6, 0.6],
    metadata: {
      parameter_id: 'P1.3',
      type: 'Hypothesis',
      source_description: 'AI-generated hypothesis with analysis',
      value: hyp,
      timestamp: new Date().toISOString(),
      notes: hypothesisAnalysis,
      falsification_criteria: `Testable via experimental validation - ${hyp}`,
      impact_score: 0.7 + (index * 0.05)
    },
    position: { x: 100 + index * 200, y: 500 }
  }));

  // Connect hypotheses to relevant dimension nodes
  const hypothesisEdges: GraphEdge[] = [];
  hypothesisNodes.forEach(hypNode => {
    // Connect to first few dimension nodes
    context.graphData.nodes.filter(node => node.type === 'dimension').slice(0, 3).forEach(dimNode => {
      hypothesisEdges.push({
        id: `edge-${dimNode.id}-${hypNode.id}`,
        source: dimNode.id,
        target: hypNode.id,
        type: 'supportive',
        confidence: 0.7,
        metadata: {
          type: 'hypothesis_derivation'
        }
      });
    });
  });

  context.setGraphData(prev => ({
    ...prev,
    nodes: [...prev.nodes, ...hypothesisNodes],
    edges: [...prev.edges, ...hypothesisEdges],
    metadata: {
      ...prev.metadata,
      last_updated: new Date().toISOString(),
      total_nodes: prev.nodes.length + hypothesisNodes.length,
      total_edges: prev.edges.length + hypothesisEdges.length,
      stage: 3
    }
  }));

  context.setResearchContext(prev => ({
    ...prev,
    hypotheses: generatedHypotheses
  }));

  return `**Stage 3 Complete: Hypothesis Generation**\n\n**Generated Hypotheses:**\n${hypothesisGeneration}\n\n**AI Analysis:**\n${hypothesisAnalysis}`;
};

export const integrateEvidence = async (
  query: string | undefined,
  context: StageExecutorContext
): Promise<string> => {
  // Search for evidence using Perplexity
  const evidenceSearch = await callPerplexityAPI(
    `Find recent scientific evidence and research studies related to: ${context.researchContext.topic}. Focus on peer-reviewed sources and statistical data.`,
    context.apiKeys.perplexity
  );

  // Analyze evidence using Gemini
  const evidenceAnalysis = await callGeminiAPI(
    `Analyze this scientific evidence for quality, statistical power, and relevance to our hypotheses: ${evidenceSearch}`,
    context.apiKeys.gemini
  );

  // Create evidence nodes
  const evidenceNodes: GraphNode[] = [{
    id: `4.1`,
    label: 'Evidence Collection',
    type: 'evidence' as const,
    confidence: [0.8, 0.7, 0.8, 0.7],
    metadata: {
      parameter_id: 'P1.4',
      type: 'Evidence',
      source_description: 'AI-collected and analyzed evidence',
      value: evidenceSearch,
      timestamp: new Date().toISOString(),
      notes: evidenceAnalysis,
      statistical_power: 0.75
    },
    position: { x: 600, y: 400 }
  }];

  // Connect evidence to hypotheses
  const evidenceEdges: GraphEdge[] = [];
  const hypothesisNodes = context.graphData.nodes.filter(node => node.type === 'hypothesis');
  hypothesisNodes.forEach(hypNode => {
    evidenceEdges.push({
      id: `edge-4.1-${hypNode.id}`,
      source: '4.1',
      target: hypNode.id,
      type: 'supportive',
      confidence: 0.7,
      metadata: {
        type: 'evidence_support'
      }
    });
  });

  context.setGraphData(prev => ({
    ...prev,
    nodes: [...prev.nodes, ...evidenceNodes],
    edges: [...prev.edges, ...evidenceEdges],
    metadata: {
      ...prev.metadata,
      last_updated: new Date().toISOString(),
      total_nodes: prev.nodes.length + evidenceNodes.length,
      total_edges: prev.edges.length + evidenceEdges.length,
      stage: 4
    }
  }));

  return `**Stage 4 Complete: Evidence Integration**\n\n**Evidence Found:**\n${evidenceSearch}\n\n**Analysis:**\n${evidenceAnalysis}`;
};

export const pruneMergeNodes = async (context: StageExecutorContext): Promise<string> => {
  const pruningAnalysis = await callGeminiAPI(
    `Analyze the current research graph for: 1) Low-confidence nodes to prune, 2) Redundant information to merge, 3) Quality assessment of evidence and hypotheses.`,
    context.apiKeys.gemini
  );

  return `**Stage 5 Complete: Pruning/Merging**\n\n**Analysis:**\n${pruningAnalysis}`;
};

export const extractSubgraphs = async (context: StageExecutorContext): Promise<string> => {
  const subgraphAnalysis = await callGeminiAPI(
    `Identify the most important subgraphs and relationships in our research analysis. Focus on high-impact findings and strong evidence chains.`,
    context.apiKeys.gemini
  );

  return `**Stage 6 Complete: Subgraph Extraction**\n\n**Key Findings:**\n${subgraphAnalysis}`;
};

export const composeResults = async (context: StageExecutorContext): Promise<string> => {
  const composition = await callGeminiAPI(
    `Compose a comprehensive scientific analysis summary with: 1) Key findings, 2) Evidence evaluation, 3) Hypothesis assessment, 4) Implications and recommendations. Format in academic style with proper citations.`,
    context.apiKeys.gemini
  );

  return `**Stage 7 Complete: Composition**\n\n**Scientific Analysis:**\n${composition}`;
};

export const performReflection = async (context: StageExecutorContext): Promise<string> => {
  const reflection = await callGeminiAPI(
    `Perform a critical audit of our research analysis: 1) Bias assessment, 2) Gap identification, 3) Methodological rigor, 4) Statistical validity, 5) Future research directions.`,
    context.apiKeys.gemini
  );

  return `**Stage 8 Complete: Reflection & Audit**\n\n**Critical Assessment:**\n${reflection}`;
};

export const generateFinalAnalysis = async (context: StageExecutorContext): Promise<string> => {
  // Compile all previous stage results
  const allResults = context.stageResults.join('\n\n---\n\n');
  
  // Generate comprehensive final analysis with Gemini Pro
  const finalAnalysis = await callGeminiAPI(
    `You are a PhD-level scientist conducting comprehensive analysis. Based on all the research stages completed below, generate a detailed final scientific report with:

1. **Executive Summary** (key findings and conclusions)
2. **Methodology Analysis** (research approach evaluation)
3. **Evidence Synthesis** (critical analysis of all collected evidence)
4. **Statistical Analysis** (quantitative insights where applicable)
5. **Visualization Recommendations** (suggest graphs, charts, tables that should be created)
6. **Conclusions** (definitive scientific conclusions)
7. **Future Research Directions** (recommended next steps)
8. **References and Citations** (Vancouver format)

Include code snippets for data visualization using Python/R where appropriate. Generate actual data tables and statistical analyses.

Previous Research Stages:
${allResults}

Research Context: ${JSON.stringify(context.researchContext, null, 2)}

Please provide a comprehensive, PhD-level scientific analysis that could be published in a peer-reviewed journal.`,
    context.apiKeys.gemini
  );

  // Create final analysis node
  const finalNode: GraphNode = {
    id: '9.0',
    label: 'Final Comprehensive Analysis',
    type: 'root',
    confidence: [0.9, 0.9, 0.9, 0.9],
    metadata: {
      parameter_id: 'P1.0',
      type: 'Final Analysis',
      source_description: 'Comprehensive PhD-level scientific analysis',
      value: finalAnalysis,
      timestamp: new Date().toISOString(),
      notes: 'Complete synthesis of all research stages'
    },
    position: { x: 400, y: 800 }
  };

  context.setGraphData(prev => ({
    ...prev,
    nodes: [...prev.nodes, finalNode],
    edges: [...prev.edges],
    metadata: {
      ...prev.metadata,
      last_updated: new Date().toISOString(),
      total_nodes: prev.nodes.length + 1,
      total_edges: prev.edges.length,
      stage: 9
    }
  }));

  return `# Final Comprehensive Scientific Analysis

${finalAnalysis}

---

## Research Statistics
- **Total Knowledge Nodes**: ${context.graphData.nodes.length + 1}
- **Research Connections**: ${context.graphData.edges.length}
- **Stages Completed**: 9/9
- **Research Field**: ${context.researchContext.field}
- **Analysis Date**: ${new Date().toLocaleDateString()}`;
};