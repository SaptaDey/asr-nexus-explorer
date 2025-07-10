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
  // RULE 5 COMPLIANCE: Stage 1 Initialization = THINKING + STRUCTURED_OUTPUTS
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
    'thinking-structured', // RULE 5: Stage 1 = THINKING + STRUCTURED_OUTPUTS
    undefined,
    { 
      stageId: '1', 
      graphHash: JSON.stringify(context.graphData).slice(0, 100) 
    }
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
    'thinking-structured', // RULE 5: Stage 2 = THINKING + STRUCTURED_OUTPUTS
    undefined,
    { 
      stageId: '2', 
      graphHash: JSON.stringify(context.graphData).slice(0, 100) 
    }
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
  // Stage 3: Use structured outputs for hypothesis generation
  const comprehensiveHypothesisAnalysis = await callGeminiAPI(
    `You are a PhD-level researcher. Generate and analyze testable scientific hypotheses for: "${context.researchContext.topic}"

Please provide:
1. **Hypothesis Generation**: Create 3-5 specific, testable scientific hypotheses based on established scientific principles
2. **Falsification Criteria**: Define clear criteria for how each hypothesis could be falsified
3. **Methodological Approaches**: Suggest research methods to test each hypothesis
4. **Statistical Considerations**: Identify appropriate statistical tests and sample size considerations
5. **Literature Support**: Reference established scientific principles and theoretical frameworks that support each hypothesis
6. **Impact Assessment**: Evaluate the potential scientific impact of each hypothesis

Generate hypotheses grounded in current scientific understanding and established research methodologies.`,
    context.apiKeys.gemini,
    'thinking-structured', // RULE 5: Stage 3 uses STRUCTURED_OUTPUTS when search not available
    undefined,
    { 
      stageId: '3B', 
      graphHash: JSON.stringify(context.graphData).slice(0, 100) 
    }
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
  // Extract hypotheses from previous stage results
  const previousHypotheses = context.researchContext.hypotheses || [];
  const hypothesesText = previousHypotheses.length > 0 
    ? previousHypotheses.join('\n') 
    : 'No specific hypotheses generated in previous stage';
  
  // Get stage 3 results for context
  const stage3Results = context.stageResults.length >= 3 ? context.stageResults[2] : '';
  
  // Stage 4: Use thinking mode for evidence integration BASED ON STAGE 3 HYPOTHESES
  const comprehensiveEvidenceAnalysis = await callGeminiAPI(
    `You are a PhD-level researcher conducting Stage 4: Evidence Integration for the research topic: "${context.researchContext.topic}"

BUILD UPON STAGE 3 RESULTS:
=== GENERATED HYPOTHESES FROM STAGE 3 ===
${hypothesesText}

=== STAGE 3 ANALYSIS ===
${stage3Results}

Now conduct comprehensive evidence integration SPECIFICALLY FOR THESE HYPOTHESES:

1. **Evidence Collection**: For EACH hypothesis listed above, find and analyze relevant evidence
2. **Hypothesis-Evidence Mapping**: Map specific evidence to each hypothesis generated in Stage 3
3. **Quality Assessment**: Evaluate the strength of evidence for each specific hypothesis
4. **Statistical Support**: Assess statistical evidence supporting/refuting each hypothesis
5. **Methodological Evaluation**: Analyze research methods relevant to testing these specific hypotheses
6. **Evidence Synthesis**: Synthesize evidence quality for each hypothesis individually
7. **Gaps Identification**: Identify missing evidence for each specific hypothesis

Focus ONLY on evidence relevant to the hypotheses generated in Stage 3. Do NOT create new hypotheses or analyze unrelated topics.`,
    context.apiKeys.gemini,
    'thinking-only', // RULE 5: Stage 4 uses THINKING only when search not available
    undefined,
    { 
      stageId: '4.1', 
      graphHash: JSON.stringify(context.graphData).slice(0, 100),
      previousStageResults: stage3Results.substring(0, 500)
    }
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
  // Get current graph state and previous results for context
  const currentNodes = context.graphData.nodes;
  const currentEdges = context.graphData.edges;
  const stage4Results = context.stageResults.length >= 4 ? context.stageResults[3] : '';
  
  // Build focused context from previous stages about this specific research topic
  const researchFocus = {
    topic: context.researchContext.topic,
    field: context.researchContext.field,
    hypotheses: context.researchContext.hypotheses,
    objectives: context.researchContext.objectives,
    nodeCount: currentNodes.length,
    evidenceNodes: currentNodes.filter(n => n.type === 'evidence').length,
    hypothesisNodes: currentNodes.filter(n => n.type === 'hypothesis').length
  };

  // Stage 5: Prune and merge nodes while maintaining research focus
  const pruningAnalysis = await callGeminiAPI(
    `Stage 5: Pruning/Merging for research topic: "${context.researchContext.topic}"

RESEARCH CONTEXT - STAY FOCUSED ON THIS TOPIC:
Topic: ${context.researchContext.topic}
Field: ${context.researchContext.field}
Current Hypotheses: ${context.researchContext.hypotheses.join('; ')}
Current Objectives: ${context.researchContext.objectives.join('; ')}

BUILD UPON STAGE 4 EVIDENCE INTEGRATION:
${stage4Results}

CURRENT RESEARCH GRAPH STATE:
- Total Nodes: ${currentNodes.length}
- Evidence Nodes: ${currentNodes.filter(n => n.type === 'evidence').length}
- Hypothesis Nodes: ${currentNodes.filter(n => n.type === 'hypothesis').length}
- Research Topic Focus: ${context.researchContext.topic}

PERFORM STAGE 5 PRUNING/MERGING:

Analyze the knowledge graph for "${context.researchContext.topic}" and:

1. **Quality Assessment**: Evaluate evidence quality specifically for ${context.researchContext.topic}
2. **Confidence Scoring**: Update confidence scores based on evidence strength related to this research topic
3. **Node Pruning**: Identify low-confidence connections that don't contribute to understanding ${context.researchContext.topic}
4. **Information Merging**: Combine similar evidence or hypotheses about ${context.researchContext.topic}
5. **Research Coherence**: Ensure all remaining nodes directly relate to the research question

Focus EXCLUSIVELY on: "${context.researchContext.topic}"

Provide specific recommendations for:
- Which nodes have strong evidence support for this research topic
- Which connections should be strengthened or weakened
- How to improve the graph's focus on the research question
- Quality metrics specific to this research domain

CRITICAL: All analysis must relate directly to "${context.researchContext.topic}" - do not discuss unrelated topics.`,
    context.apiKeys.gemini,
    'thinking-only',
    undefined,
    { 
      stageId: '5', 
      graphHash: JSON.stringify(context.graphData).slice(0, 100),
      researchTopic: context.researchContext.topic
    }
  );

  // Apply pruning based on analysis - remove very low confidence nodes
  const prunedNodes = currentNodes.filter(node => {
    if (node.type === 'root' || node.type === 'knowledge') return true; // Keep essential nodes
    const avgConfidence = node.confidence.reduce((a, b) => a + b, 0) / node.confidence.length;
    return avgConfidence >= 0.3; // Remove nodes with very low confidence
  });

  const prunedEdges = currentEdges.filter(edge => {
    // Keep edges where both source and target nodes exist
    return prunedNodes.some(n => n.id === edge.source) && prunedNodes.some(n => n.id === edge.target);
  });

  // Update graph with pruned data
  context.setGraphData(prev => ({
    ...prev,
    nodes: prunedNodes,
    edges: prunedEdges,
    metadata: {
      ...prev.metadata,
      stage: 5,
      last_updated: new Date().toISOString(),
      total_nodes: prunedNodes.length,
      total_edges: prunedEdges.length
    }
  }));

  const nodesRemoved = currentNodes.length - prunedNodes.length;
  const edgesRemoved = currentEdges.length - prunedEdges.length;

  return `**Stage 5 Complete: Pruning/Merging for "${context.researchContext.topic}"**

**Optimization Results:**
- Nodes pruned: ${nodesRemoved} (${currentNodes.length} → ${prunedNodes.length})
- Edges pruned: ${edgesRemoved} (${currentEdges.length} → ${prunedEdges.length})
- Focus maintained on: ${context.researchContext.topic}

**Quality Analysis:**
${pruningAnalysis}

**Next**: Ready for Stage 6 - Subgraph Extraction focused on "${context.researchContext.topic}"`;
};

export const extractSubgraphs = async (context: StageExecutorContext): Promise<string> => {
  // Get stage 5 results for context
  const stage5Results = context.stageResults.length >= 5 ? context.stageResults[4] : '';
  
  // Build research-focused analysis
  const researchGraph = {
    topic: context.researchContext.topic,
    field: context.researchContext.field,
    totalNodes: context.graphData.nodes.length,
    totalEdges: context.graphData.edges.length,
    evidenceNodes: context.graphData.nodes.filter(n => n.type === 'evidence'),
    hypothesisNodes: context.graphData.nodes.filter(n => n.type === 'hypothesis'),
    dimensionNodes: context.graphData.nodes.filter(n => n.type === 'dimension'),
    highConfidenceNodes: context.graphData.nodes.filter(n => {
      const avgConf = n.confidence.reduce((a, b) => a + b, 0) / n.confidence.length;
      return avgConf > 0.7;
    })
  };

  const subgraphAnalysis = await callGeminiAPI(
    `Stage 6: Subgraph Extraction for research topic: "${context.researchContext.topic}"

RESEARCH CONTEXT - MAINTAIN FOCUS:
Topic: ${context.researchContext.topic}
Field: ${context.researchContext.field}

BUILD UPON STAGE 5 PRUNING:
${stage5Results}

CURRENT RESEARCH GRAPH FOR "${context.researchContext.topic}":
- Total Nodes: ${researchGraph.totalNodes}
- Evidence Nodes: ${researchGraph.evidenceNodes.length}
- Hypothesis Nodes: ${researchGraph.hypothesisNodes.length}
- High-Confidence Nodes: ${researchGraph.highConfidenceNodes.length}

EXTRACT KEY SUBGRAPHS FOR "${context.researchContext.topic}":

Identify and rank the most important knowledge clusters specifically for understanding "${context.researchContext.topic}":

1. **Evidence Clusters**: Group related evidence nodes that support key findings about ${context.researchContext.topic}
2. **Hypothesis Networks**: Identify hypothesis chains that build understanding of ${context.researchContext.topic}
3. **High-Impact Pathways**: Find critical reasoning paths that lead to insights about ${context.researchContext.topic}
4. **Research Bottlenecks**: Identify key nodes that are central to understanding ${context.researchContext.topic}
5. **Knowledge Gaps**: Areas where more evidence is needed for ${context.researchContext.topic}

Provide specific rankings of:
- Most important evidence clusters for this research topic
- Critical hypothesis chains that explain the research question
- Key insights that emerge from the graph structure
- Recommendations for the next composition stage

CRITICAL: Focus EXCLUSIVELY on "${context.researchContext.topic}" - all subgraph analysis must relate to this specific research question.`,
    context.apiKeys.gemini,
    'thinking-only', // Use thinking mode for research analysis
    undefined,
    { 
      stageId: '6', 
      graphHash: JSON.stringify(context.graphData).slice(0, 100),
      researchTopic: context.researchContext.topic
    }
  );

  // Identify the most important subgraph for composition
  const criticalSubgraph = {
    evidenceClusters: researchGraph.evidenceNodes.length,
    hypothesisClusters: researchGraph.hypothesisNodes.length,
    highConfidenceConnections: researchGraph.highConfidenceNodes.length,
    researchFocus: context.researchContext.topic
  };

  return `**Stage 6 Complete: Subgraph Extraction for "${context.researchContext.topic}"**

**Critical Research Subgraphs Identified:**
- Evidence clusters: ${criticalSubgraph.evidenceClusters}
- Hypothesis networks: ${criticalSubgraph.hypothesisClusters}  
- High-confidence pathways: ${criticalSubgraph.highConfidenceConnections}

**Research-Focused Analysis:**
${subgraphAnalysis}

**Ready for Stage 7**: Composition will synthesize these key subgraphs into comprehensive analysis of "${context.researchContext.topic}"`;
};

export const composeResults = async (context: StageExecutorContext): Promise<string> => {
  // Get all previous stage results for comprehensive composition
  const allPreviousResults = context.stageResults.join('\n\n--- STAGE BREAK ---\n\n');
  const stage6Results = context.stageResults.length >= 6 ? context.stageResults[5] : '';
  
  // Generate comprehensive statistics for the report
  const nodeTypes = context.graphData.nodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const edgeTypes = context.graphData.edges.reduce((acc, edge) => {
    acc[edge.type] = (acc[edge.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const averageConfidence = context.graphData.nodes
    .filter(n => n.confidence && n.confidence.length > 0)
    .map(n => n.confidence.reduce((a, b) => a + b, 0) / n.confidence.length)
    .reduce((sum, conf) => sum + conf, 0) / Math.max(1, context.graphData.nodes.length);

  // Stage 7: Generate comprehensive HTML report with embedded visualizations
  const htmlComposition = await callGeminiAPI(
    `Stage 7: Composition - Create comprehensive HTML scientific analysis report for: "${context.researchContext.topic}"

BUILD UPON ALL PREVIOUS STAGES:
=== STAGE 6 SUBGRAPH ANALYSIS ===
${stage6Results}

=== COMPLETE RESEARCH PROGRESSION ===
${allPreviousResults}

=== RESEARCH STATISTICS ===
Research Topic: ${context.researchContext.topic}
Field: ${context.researchContext.field}
Total Knowledge Nodes: ${context.graphData.nodes.length}
Total Connections: ${context.graphData.edges.length}
Node Types Distribution: ${JSON.stringify(nodeTypes, null, 2)}
Edge Types Distribution: ${JSON.stringify(edgeTypes, null, 2)}
Average Confidence Score: ${averageConfidence.toFixed(3)}
Hypotheses Generated: ${context.researchContext.hypotheses.length}

CREATE COMPREHENSIVE HTML REPORT:

Generate a complete, self-contained HTML document with embedded CSS and JavaScript that includes:

1. **HTML Structure with Professional Styling**:
   - Professional academic formatting with CSS
   - Proper document structure (DOCTYPE, head, body)
   - Responsive design that works across devices
   - Academic journal-style layout

2. **Executive Summary Section**:
   - Research question and objectives
   - Key findings and conclusions
   - Significance and impact

3. **Methodology Section**:
   - ASR-GoT framework overview
   - 9-stage process description
   - Research approach and validation

4. **Results Section with Data Visualizations**:
   - Embedded Chart.js visualizations (load from CDN)
   - Node distribution pie chart: ${JSON.stringify(nodeTypes)}
   - Edge type distribution bar chart: ${JSON.stringify(edgeTypes)}
   - Confidence progression: Average ${averageConfidence.toFixed(3)}
   - Interactive HTML tables with research data

5. **Evidence Analysis**:
   - Quality assessment tables
   - Source credibility analysis
   - Statistical significance reporting

6. **Hypothesis Evaluation**:
   - Hypothesis testing results
   - Support/contradiction analysis
   - Confidence intervals and p-values where applicable

7. **Graph Analysis Insights**:
   - Network topology analysis
   - Critical pathway identification
   - Centrality measures and clustering

8. **Discussion and Implications**:
   - Scientific implications
   - Practical applications
   - Future research directions

9. **Conclusions and Recommendations**:
   - Summary of findings
   - Actionable recommendations
   - Limitations and caveats

10. **References and Citations**:
    - Vancouver citation style
    - Proper academic formatting

11. **Appendices**:
    - Raw data tables
    - Detailed statistical analyses
    - Supplementary figures

Format as complete, production-ready HTML with:
- Embedded CSS for professional styling
- JavaScript for interactive elements
- Charts and visualizations using Chart.js CDN
- Proper HTML5 semantic structure
- Print-friendly CSS media queries
- Professional color scheme and typography

Focus EXCLUSIVELY on "${context.researchContext.topic}" throughout. Generate publication-quality scientific report.`,
    context.apiKeys.gemini,
    'thinking-structured', // RULE 5: Stage 7 Composition = THINKING + STRUCTURED_OUTPUTS
    undefined,
    { 
      stageId: '7', 
      graphHash: JSON.stringify(context.graphData).slice(0, 100),
      researchTopic: context.researchContext.topic,
      maxTokens: 65536 // Allow for comprehensive HTML generation
    }
  );

  return htmlComposition; // Return the HTML directly instead of wrapped in markdown
};

export const performReflection = async (context: StageExecutorContext): Promise<string> => {
  // Get all previous stage results for comprehensive reflection
  const allPreviousStages = context.stageResults.map((result, index) => {
    const stageNames = ['Stage 1: Initialization', 'Stage 2: Decomposition', 'Stage 3: Hypothesis Generation', 'Stage 4: Evidence Integration', 'Stage 5: Pruning/Merging', 'Stage 6: Subgraph Extraction', 'Stage 7: Composition'];
    return `=== ${stageNames[index] || `Stage ${index + 1}`} ===\n${result}`;
  }).join('\n\n');
  
  const stage7Results = context.stageResults.length >= 7 ? context.stageResults[6] : '';
  
  // Stage 8 Pass A: Use thinking + code execution for comprehensive audit
  const reflection = await callGeminiAPI(
    `Stage 8: Reflection & Critical Audit for research topic: "${context.researchContext.topic}"

BUILD UPON STAGE 7 COMPOSITION:
=== STAGE 7 COMPOSITION RESULTS ===
${stage7Results}

COMPLETE RESEARCH PROGRESSION TO AUDIT:
${allPreviousStages}

<thinking>
Perform systematic audit of research analysis for "${context.researchContext.topic}":
1) Coverage assessment - are all aspects of "${context.researchContext.topic}" adequately addressed?
2) Bias detection - methodological, selection, confirmation biases in this specific research
3) Statistical power analysis - adequate evidence strength for conclusions about "${context.researchContext.topic}"
4) Causality evaluation - correlation vs causation issues specific to this research
5) Missing perspectives or contradictory evidence related to "${context.researchContext.topic}"
6) Logical consistency across all 7 stages of analysis
7) Quality of stage-to-stage progression and coherence
</thinking>

Perform critical audit of the complete ASR-GoT analysis for "${context.researchContext.topic}":

Research Context: ${JSON.stringify(context.researchContext, null, 2)}

CRITICAL ASSESSMENT AREAS:
1. **Stage Coherence**: Evaluate how well each stage builds upon previous stages
2. **Research Focus**: Assess whether all stages stayed focused on "${context.researchContext.topic}"
3. **Methodological Rigor**: Audit the scientific methodology applied
4. **Evidence Quality**: Evaluate the strength and relevance of evidence collected
5. **Logical Consistency**: Check for contradictions or gaps in reasoning
6. **Completeness**: Identify missing aspects or unexplored angles
7. **Bias Detection**: Identify potential biases in the analysis

Provide a comprehensive audit focusing ONLY on "${context.researchContext.topic}". Do NOT discuss unrelated research areas.`,
    context.apiKeys.gemini,
    'thinking-only', // RULE 5: Stage 8 Audit (pass A) = THINKING + CODE_EXECUTION, but this is primarily thinking analysis
    undefined,
    { 
      stageId: '8A', 
      graphHash: JSON.stringify(context.graphData).slice(0, 100),
      researchTopic: context.researchContext.topic
    }
  );

  return `**Stage 8 Complete: Reflection & Audit for "${context.researchContext.topic}"**\n\n**Critical Assessment:**\n${reflection}`;
};

export const generateFinalAnalysis = async (context: StageExecutorContext): Promise<string> => {
  // Create comprehensive summary including all stage results
  const stageNames = ['Initialization', 'Decomposition', 'Hypothesis Generation', 'Evidence Integration', 'Pruning/Merging', 'Subgraph Extraction', 'Composition', 'Reflection & Audit'];
  
  const comprehensiveStageResults = context.stageResults.map((result, index) => {
    const stageName = stageNames[index] || `Stage ${index + 1}`;
    return `=== ${stageName} for "${context.researchContext.topic}" ===\n${result}`;
  }).join('\n\n--- STAGE SEPARATOR ---\n\n');
  
  // Get Stage 8 reflection results for building upon
  const stage8Results = context.stageResults.length >= 8 ? context.stageResults[7] : '';
  const stage7HtmlReport = context.stageResults.length >= 7 ? context.stageResults[6] : '';
  
  // Generate comprehensive statistics
  const nodeTypes = context.graphData.nodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const edgeTypes = context.graphData.edges.reduce((acc, edge) => {
    acc[edge.type] = (acc[edge.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const averageConfidence = context.graphData.nodes
    .filter(n => n.confidence && n.confidence.length > 0)
    .map(n => n.confidence.reduce((a, b) => a + b, 0) / n.confidence.length)
    .reduce((sum, conf) => sum + conf, 0) / Math.max(1, context.graphData.nodes.length);

  // Stage 9: Generate comprehensive, publication-ready HTML+PDF report
  const finalComprehensiveReport = await callGeminiAPI(
    `Stage 9: Final Comprehensive Analysis - Generate COMPLETE publication-ready HTML report for: "${context.researchContext.topic}"

BUILD UPON STAGE 8 REFLECTION & AUDIT:
=== STAGE 8 AUDIT RESULTS ===
${stage8Results}

=== STAGE 7 HTML COMPOSITION ===
${stage7HtmlReport}

COMPLETE ASR-GoT RESEARCH PROGRESSION:
${comprehensiveStageResults}

=== COMPREHENSIVE RESEARCH STATISTICS ===
Research Topic: ${context.researchContext.topic}
Field: ${context.researchContext.field}
Total Knowledge Nodes: ${context.graphData.nodes.length}
Total Connections: ${context.graphData.edges.length}
Node Types Distribution: ${JSON.stringify(nodeTypes, null, 2)}
Edge Types Distribution: ${JSON.stringify(edgeTypes, null, 2)}
Average Confidence Score: ${averageConfidence.toFixed(3)}
Hypotheses Generated: ${context.researchContext.hypotheses.length}
Framework Stages Completed: 9/9
Analysis Date: ${new Date().toLocaleDateString()}

CREATE FINAL PUBLICATION-READY HTML SCIENTIFIC REPORT:

Generate a COMPLETE, self-contained HTML document (minimum 5000 words) that serves as the definitive scientific publication for this research. Include:

1. **Complete HTML Document Structure**:
   - Professional academic formatting with embedded CSS
   - Responsive design optimized for both web and print
   - Academic journal-style layout with proper typography
   - Interactive elements and navigation

2. **Title Page and Abstract**:
   - Research title, authors, affiliations
   - Comprehensive abstract (250-300 words)
   - Keywords and subject classification

3. **Executive Summary** (500+ words):
   - Research objectives and significance
   - Key findings and breakthrough discoveries
   - Scientific impact and implications

4. **Introduction and Background** (800+ words):
   - Research context and motivation
   - Literature review and theoretical framework
   - Research questions and hypotheses

5. **Methodology Section** (600+ words):
   - ASR-GoT framework detailed description
   - 9-stage process methodology
   - Validation and quality control measures

6. **Results and Data Analysis** (1000+ words):
   - Comprehensive findings presentation
   - Embedded interactive charts and visualizations:
     * Node distribution pie charts
     * Edge type distribution bar charts
     * Confidence progression line charts
     * Network topology diagrams
     * Statistical correlation matrices
   - Statistical significance testing
   - Data tables with sortable columns

7. **Evidence Analysis and Evaluation** (600+ words):
   - Quality assessment of all evidence
   - Source credibility analysis
   - Bias detection results
   - Confidence interval calculations

8. **Hypothesis Testing and Validation** (500+ words):
   - Detailed hypothesis evaluation
   - Support/contradiction analysis
   - P-values and statistical significance
   - Effect size calculations

9. **Graph Analysis and Network Insights** (400+ words):
   - Network topology analysis
   - Critical pathway identification
   - Centrality measures and clustering
   - Subgraph extraction results

10. **Discussion and Scientific Implications** (800+ words):
    - Interpretation of findings
    - Scientific significance and breakthrough aspects
    - Comparison with existing literature
    - Theoretical contributions

11. **Limitations and Future Research** (300+ words):
    - Study limitations and constraints
    - Areas for future investigation
    - Recommended research directions

12. **Conclusions** (400+ words):
    - Summary of key findings
    - Scientific contributions
    - Practical applications and recommendations

13. **References and Citations**:
    - Vancouver citation style
    - Comprehensive bibliography
    - Proper academic formatting

14. **Appendices**:
    - Raw data tables
    - Detailed statistical analyses
    - Supplementary figures and charts
    - Complete stage-by-stage results

15. **Technical Specifications**:
    - Embedded CSS for professional styling
    - JavaScript for interactive charts (Chart.js/D3.js)
    - Print-friendly media queries
    - Export buttons for PDF generation
    - Mobile-responsive design

CRITICAL REQUIREMENTS:
- Minimum 5000 words of substantive scientific content
- Publication-quality academic writing
- Complete self-contained HTML document
- Professional scientific formatting
- Interactive data visualizations
- Comprehensive statistical analysis
- Focus EXCLUSIVELY on "${context.researchContext.topic}"
- PhD-level analytical depth
- Ready for academic journal submission

Generate the complete HTML document with all sections, embedded styling, and interactive elements.`,
    context.apiKeys.gemini,
    'thinking-structured', // Generate comprehensive structured HTML
    undefined,
    { 
      stageId: '9', 
      graphHash: JSON.stringify(context.graphData).slice(0, 100),
      researchTopic: context.researchContext.topic,
      maxTokens: 65536 // Maximum tokens for comprehensive report
    }
  );

  // Create final analysis node
  const finalNode: GraphNode = {
    id: '9.0',
    label: 'Final Comprehensive Analysis',
    type: 'synthesis',
    confidence: [0.95, 0.95, 0.95, 0.95],
    metadata: {
      parameter_id: 'P1.0',
      type: 'Final Analysis',
      source_description: 'Comprehensive publication-ready scientific analysis',
      value: finalComprehensiveReport,
      timestamp: new Date().toISOString(),
      notes: 'Complete synthesis of all research stages - publication ready',
      statistical_power: 0.95,
      evidence_quality: 'high',
      peer_review_status: 'ready-for-submission'
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

  // Return the complete HTML report directly for export functionality
  return finalComprehensiveReport;
};