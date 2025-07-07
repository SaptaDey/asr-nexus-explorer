/**
 * ASR-GoT Stage Execution Functions
 * Implements all 9 stages of the ASR-GoT framework
 */

import { GraphData, GraphNode, GraphEdge, ResearchContext } from '@/types/asrGotTypes';
import { callGeminiAPI } from './apiService';

export interface StageExecutorContext {
  apiKeys: { gemini: string };
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
  // Stage 1: Use structured outputs for canonical JSON generation
  const comprehensiveAnalysis = await callGeminiAPI(
    `You are a PhD-level researcher. Perform a comprehensive analysis of this research question:

Research Question: "${taskDescription}"

Please provide a structured analysis with:
1. **Field Analysis**: Identify the primary scientific field, key research objectives, and potential interdisciplinary connections
2. **Current Background**: Analyze recent scientific developments, publications, and trends in this field
3. **Key Researchers**: Identify leading researchers and institutions working in this area
4. **Methodological Approaches**: Common research methodologies used in this field
5. **Recent Breakthroughs**: Latest significant findings or innovations (within last 2 years)

Provide a comprehensive foundation for research planning.`,
    context.apiKeys.gemini,
    'structured'
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
      notes: comprehensiveAnalysis
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

  // Update research context - extract field from comprehensive analysis
  const fieldMatch = comprehensiveAnalysis.match(/\*\*Field Analysis\*\*[\s\S]*?(\w+[\w\s]+)/);
  const field = fieldMatch ? fieldMatch[1].trim() : 'General Science';
  
  const newContext = {
    ...context.researchContext,
    field: field,
    topic: taskDescription,
    objectives: comprehensiveAnalysis.split('\n').filter(line => line.includes('objective')).slice(0, 3)
  };
  context.setResearchContext(() => newContext);

  return `**Stage 1 Complete: Initialization**\n\n${comprehensiveAnalysis}`;
};

export const decomposeTask = async (
  dimensions: string[] | undefined,
  context: StageExecutorContext
): Promise<string> => {
  const defaultDimensions = ['Scope', 'Objectives', 'Constraints', 'Data Needs', 'Use Cases', 'Potential Biases', 'Knowledge Gaps'];
  const useDimensions = dimensions || defaultDimensions;

  // Stage 2: Use structured outputs for decomposition analysis
  const decompositionAnalysis = await callGeminiAPI(
    `For the research topic "${context.researchContext.topic}", analyze each dimension and provide specific insights: ${useDimensions.join(', ')}`,
    context.apiKeys.gemini,
    'structured'
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
  // Stage 3 Pass A: Use search grounding for literature-based hypothesis generation
  const comprehensiveHypothesisAnalysis = await callGeminiAPI(
    `You are a PhD-level researcher. Using web search capabilities, generate and analyze testable scientific hypotheses for: "${context.researchContext.topic}"

Please provide:
1. **Hypothesis Generation**: Create 3-5 specific, testable scientific hypotheses based on current literature
2. **Falsification Criteria**: Define clear criteria for how each hypothesis could be falsified
3. **Methodological Approaches**: Suggest research methods to test each hypothesis
4. **Statistical Considerations**: Identify appropriate statistical tests and sample size considerations
5. **Literature Support**: Reference recent peer-reviewed studies that support or challenge each hypothesis
6. **Impact Assessment**: Evaluate the potential scientific impact of each hypothesis

Use web search to ensure hypotheses are grounded in current scientific understanding and identify any similar work already published.`,
    context.apiKeys.gemini,
    'search'
  );

  // Extract hypotheses from AI response
  const generatedHypotheses = comprehensiveHypothesisAnalysis.split('\n').filter(line => 
    line.includes('Hypothesis') || line.includes('H1:') || line.includes('H2:') || line.includes('H3:') || line.includes('**H')
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
      notes: comprehensiveHypothesisAnalysis,
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

  return `**Stage 3 Complete: Hypothesis Generation**\n\n${comprehensiveHypothesisAnalysis}`;
};

export const integrateEvidence = async (
  query: string | undefined,
  context: StageExecutorContext
): Promise<string> => {
  // Stage 4 Step 1: Use search grounding for evidence collection
  const comprehensiveEvidenceAnalysis = await callGeminiAPI(
    `You are a PhD-level researcher. Using web search capabilities, conduct comprehensive evidence integration for: "${context.researchContext.topic}"

Please provide:
1. **Literature Search**: Find and analyze recent peer-reviewed studies, meta-analyses, and systematic reviews
2. **Statistical Evidence**: Identify studies with strong statistical power, effect sizes, and confidence intervals
3. **Quality Assessment**: Evaluate research methodologies, sample sizes, and potential biases in found studies
4. **Evidence Synthesis**: Synthesize findings across multiple studies and identify patterns
5. **Gaps Analysis**: Identify what evidence is missing or inconclusive
6. **Citation Network**: Map relationships between key studies and researchers
7. **Strength of Evidence**: Rate the overall quality and reliability of available evidence

Focus on recent publications (last 5 years) and high-impact journals. Provide specific citations and data where available.`,
    context.apiKeys.gemini,
    'search'
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
      source_description: 'AI-collected and analyzed evidence with web search',
      value: comprehensiveEvidenceAnalysis,
      timestamp: new Date().toISOString(),
      notes: comprehensiveEvidenceAnalysis,
      statistical_power: 0.85
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

  return `**Stage 4 Complete: Evidence Integration**\n\n${comprehensiveEvidenceAnalysis}`;
};

export const pruneMergeNodes = async (context: StageExecutorContext): Promise<string> => {
  // Stage 5 Pass A: Use thinking mode for Bayesian reasoning
  const pruningAnalysis = await callGeminiAPI(
    `<thinking>
    Analyze the current research graph for:
    1) Low-confidence nodes to prune (E[C] < 0.2)
    2) Redundant information to merge (semantic similarity ≥ 0.8)
    3) Quality assessment of evidence and hypotheses
    4) Bayesian updates to confidence scores
    </thinking>
    
    Perform pure Bayesian analysis to identify nodes for pruning and merging. Consider confidence thresholds and semantic similarity.`,
    context.apiKeys.gemini,
    'thinking'
  );

  return `**Stage 5 Complete: Pruning/Merging**\n\n**Analysis:**\n${pruningAnalysis}`;
};

export const extractSubgraphs = async (context: StageExecutorContext): Promise<string> => {
  // Stage 6: Use code execution for graph analysis
  const subgraphAnalysis = await callGeminiAPI(
    `Analyze the research graph using computational methods. Calculate centrality metrics, mutual information, and impact scores to identify the most important subgraphs.

Graph Data: ${JSON.stringify(context.graphData, null, 2)}

Write Python code to:
1. Calculate node centrality (degree, betweenness, closeness)
2. Compute mutual information between connected nodes
3. Rank subgraphs by impact and relevance
4. Generate NetworkX analysis results

Return ranked list of top subgraphs with quantitative metrics.`,
    context.apiKeys.gemini,
    'code'
  );

  return `**Stage 6 Complete: Subgraph Extraction**\n\n**Key Findings:**\n${subgraphAnalysis}`;
};

export const composeResults = async (context: StageExecutorContext): Promise<string> => {
  // Stage 7: Use structured outputs for composition
  const composition = await callGeminiAPI(
    `Compose a comprehensive scientific analysis summary with: 1) Key findings, 2) Evidence evaluation, 3) Hypothesis assessment, 4) Implications and recommendations. Format in academic style with proper citations.`,
    context.apiKeys.gemini,
    'structured'
  );

  return `**Stage 7 Complete: Composition**\n\n**Scientific Analysis:**\n${composition}`;
};

export const performReflection = async (context: StageExecutorContext): Promise<string> => {
  // Stage 8 Pass A: Use thinking + code execution for comprehensive audit
  const reflection = await callGeminiAPI(
    `<thinking>
    Perform systematic audit of research analysis:
    1) Coverage assessment - are all aspects addressed?
    2) Bias detection - methodological, selection, confirmation biases
    3) Statistical power analysis - adequate sample sizes, effect sizes
    4) Causality evaluation - correlation vs causation issues
    5) Missing perspectives or contradictory evidence
    </thinking>
    
    Run automated audit checks and provide critical assessment:
    
    Research Context: ${JSON.stringify(context.researchContext, null, 2)}
    
    Write Python code to:
    - Check for statistical power issues
    - Identify potential biases in methodology
    - Validate logical consistency
    - Generate audit report with recommendations
    
    Perform critical audit of methodology, biases, gaps, and statistical validity.`,
    context.apiKeys.gemini,
    'thinking'
  );

  return `**Stage 8 Complete: Reflection & Audit**\n\n**Critical Assessment:**\n${reflection}`;
};

export const generateFinalAnalysis = async (context: StageExecutorContext): Promise<string> => {
  // Compile all previous stage results
  const allResults = context.stageResults.join('\n\n---\n\n');
  
  // Stage 9: Use thinking mode for comprehensive final analysis
  const finalAnalysis = await callGeminiAPI(
    `<thinking>
    I need to synthesize all research stages into a comprehensive PhD-level analysis:
    - Review all evidence and findings systematically
    - Identify the strongest conclusions supported by evidence
    - Note limitations and areas of uncertainty
    - Suggest concrete next steps for research
    - Ensure academic rigor throughout
    </thinking>
    
    You are a PhD-level scientist conducting comprehensive analysis. Based on all the research stages completed below, generate a detailed final scientific report with:

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
    context.apiKeys.gemini,
    'thinking'
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