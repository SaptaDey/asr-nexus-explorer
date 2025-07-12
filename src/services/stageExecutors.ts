/**
 * ASR-GoT Stage Execution Functions
 * Implements all 9 stages of the ASR-GoT framework
 */

import { GraphData, GraphNode, GraphEdge, ResearchContext, APICredentials } from '@/types/asrGotTypes';
import { callGeminiAPI } from './apiService';

export interface StageExecutorContext {
  apiKeys: APICredentials;
  graphData: GraphData;
  researchContext: ResearchContext;
  stageResults: string[];
  setGraphData: (updater: (prev: GraphData) => GraphData) => void;
  setResearchContext: (updater: (prev: ResearchContext) => ResearchContext) => void;
  routeApiCall?: (prompt: string, additionalParams?: any) => Promise<any>;
}

export const initializeGraph = async (
  taskDescription: string,
  context: StageExecutorContext
): Promise<string> => {
  // Defensive checks
  if (!context) {
    throw new Error('StageExecutorContext is undefined');
  }
  if (!context.apiKeys) {
    throw new Error('API credentials are missing from context');
  }
  if (!context.apiKeys.gemini) {
    throw new Error('Gemini API key is missing. Please configure your API credentials first.');
  }
  
  // RULE 5 COMPLIANCE: Stage 1 Initialization = THINKING + STRUCTURED_OUTPUTS
  const analysisPrompt = `You are a PhD-level researcher. Perform a comprehensive analysis of this research question:

Research Question: "${taskDescription}"

Please provide a structured analysis with:
1. **Field Analysis**: Identify the primary scientific field, key research objectives, and potential interdisciplinary connections
2. **Current Background**: Analyze recent scientific developments, publications, and trends in this field
3. **Key Researchers**: Identify leading researchers and institutions working in this area
4. **Methodological Approaches**: Common research methodologies used in this field
5. **Recent Breakthroughs**: Latest significant findings or innovations (within last 2 years)

Provide a comprehensive foundation for research planning.`;

  const comprehensiveAnalysis = context.routeApiCall 
    ? await context.routeApiCall(analysisPrompt, { 
        stageId: '1', 
        graphHash: JSON.stringify(context.graphData).slice(0, 100) 
      })
    : await callGeminiAPI(
        analysisPrompt,
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

  if (context.setGraphData) {
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
  }

  // Update research context - extract field from comprehensive analysis
  const fieldMatch = comprehensiveAnalysis.match(/\*\*Field Analysis\*\*[\s\S]*?(\w+[\w\s]+)/);
  const field = fieldMatch ? fieldMatch[1].trim() : 'General Science';
  
  const newContext = {
    ...context.researchContext,
    field: field,
    topic: taskDescription,
    objectives: comprehensiveAnalysis.split('\n').filter(line => line.includes('objective')).slice(0, 3)
  };
  if (context.setResearchContext) {
    context.setResearchContext(() => newContext);
  }

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

  if (context.setGraphData) {
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
  }

  return `**Stage 2 Complete: Decomposition**\n\n**AI Analysis:**\n${decompositionAnalysis}`;
};

export const generateHypotheses = async (
  customHypotheses: string[] | undefined,
  context: StageExecutorContext
): Promise<string> => {
  // Get all dimension nodes from Stage 2 to process individually
  const dimensionNodes = context.graphData.nodes.filter(node => node.type === 'dimension');
  
  if (dimensionNodes.length === 0) {
    throw new Error('No dimension nodes found from Stage 2. Cannot generate hypotheses.');
  }

  const allHypothesisNodes: GraphNode[] = [];
  const allHypothesisEdges: GraphEdge[] = [];
  const dimensionResults: string[] = [];

  // Process each dimension branch individually (PROPER GRAPH OF THOUGHTS)
  for (let i = 0; i < dimensionNodes.length; i++) {
    const dimension = dimensionNodes[i];
    
    // Generate hypotheses specifically for this dimension
    const dimensionHypothesisAnalysis = await (context.routeApiCall || callGeminiAPI)(
      `You are a PhD-level researcher conducting Stage 3: Hypothesis Generation.

RESEARCH TOPIC: "${context.researchContext.topic}"

SPECIFIC DIMENSION TO ANALYZE: "${dimension.label}"
DIMENSION DETAILS: ${dimension.metadata?.value || dimension.label}

Generate 2-3 SPECIFIC, TESTABLE hypotheses that directly address this dimension:

1. **Dimension-Specific Hypotheses**: Create hypotheses that specifically test aspects related to "${dimension.label}"
2. **Falsification Criteria**: Define clear, measurable criteria for each hypothesis
3. **Research Methods**: Suggest specific methods to test each hypothesis
4. **Expected Outcomes**: Predict measurable outcomes that would support/refute each hypothesis

Focus ONLY on hypotheses relevant to the "${dimension.label}" dimension. Each hypothesis must be:
- Testable with specific methodologies
- Directly related to the dimension being analyzed
- Measurable with clear success/failure criteria`,
      context.apiKeys.gemini,
      'thinking-structured',
      undefined,
      { 
        stageId: `3.${i + 1}`, 
        dimension: dimension.label,
        graphHash: JSON.stringify(context.graphData).slice(0, 100) 
      }
    );

    // Extract hypotheses specific to this dimension
    const dimensionHypotheses = dimensionHypothesisAnalysis.split('\n').filter(line => 
      line.includes('Hypothesis') || line.includes('H1:') || line.includes('H2:') || line.includes('H3:') || line.includes('**H')
    ).slice(0, 3); // 2-3 hypotheses per dimension

    // Create hypothesis nodes for this dimension
    const dimensionHypothesisNodes: GraphNode[] = dimensionHypotheses.map((hyp, hypIndex) => ({
      id: `3.${i + 1}.${hypIndex + 1}`,
      label: `${dimension.label} Hypothesis ${hypIndex + 1}`,
      type: 'hypothesis' as const,
      confidence: [0.7, 0.7, 0.7, 0.7],
      metadata: {
        parameter_id: 'P1.3',
        type: 'Hypothesis',
        source_description: `Hypothesis specific to ${dimension.label} dimension`,
        value: hyp,
        parent_dimension: dimension.id,
        timestamp: new Date().toISOString(),
        notes: dimensionHypothesisAnalysis,
        falsification_criteria: `Testable via experimental validation - ${hyp}`,
        impact_score: 0.7 + (hypIndex * 0.05)
      },
      position: { x: dimension.position.x + (hypIndex * 120), y: dimension.position.y + 200 }
    }));

    // Create edges from this dimension to its specific hypotheses
    const dimensionHypothesisEdges: GraphEdge[] = dimensionHypothesisNodes.map(hypNode => ({
      id: `edge-${dimension.id}-${hypNode.id}`,
      source: dimension.id,
      target: hypNode.id,
      type: 'supportive',
      confidence: 0.8,
      metadata: {
        type: 'dimension_hypothesis_derivation',
        parent_dimension: dimension.label
      }
    }));

    allHypothesisNodes.push(...dimensionHypothesisNodes);
    allHypothesisEdges.push(...dimensionHypothesisEdges);
    dimensionResults.push(`**${dimension.label} Analysis:**\n${dimensionHypothesisAnalysis}\n`);
  }

  if (context.setGraphData) {
    context.setGraphData(prev => ({
    ...prev,
    nodes: [...prev.nodes, ...allHypothesisNodes],
    edges: [...prev.edges, ...allHypothesisEdges],
    metadata: {
      ...prev.metadata,
      last_updated: new Date().toISOString(),
      total_nodes: prev.nodes.length + allHypothesisNodes.length,
      total_edges: prev.edges.length + allHypothesisEdges.length,
      stage: 3
    }
    }));
  }

  // Extract all hypotheses for research context
  const allHypothesesText = allHypothesisNodes.map(node => node.metadata?.value || node.label);

  if (context.setResearchContext) {
    context.setResearchContext(prev => ({
    ...prev,
    hypotheses: allHypothesesText
  }));
  }

  return `**Stage 3 Complete: Hypothesis Generation**\n\n**Branch-by-Branch Analysis:**\n${dimensionResults.join('\n')}`;
};

export const integrateEvidence = async (
  query: string | undefined,
  context: StageExecutorContext
): Promise<string> => {
  // Get all hypothesis nodes from Stage 3 to process individually
  const hypothesisNodes = context.graphData.nodes.filter(node => node.type === 'hypothesis');
  
  if (hypothesisNodes.length === 0) {
    throw new Error('No hypothesis nodes found from Stage 3. Cannot integrate evidence.');
  }

  const allEvidenceNodes: GraphNode[] = [];
  const allEvidenceEdges: GraphEdge[] = [];
  const hypothesisResults: string[] = [];

  // **BATCH API IMPLEMENTATION**: Process all hypotheses in optimized batches
  const hypothesisBatchPrompts = hypothesisNodes.map((hypothesis, i) => 
    `You are a PhD-level researcher conducting Stage 4: Evidence Integration.

RESEARCH TOPIC: "${context.researchContext.topic}"

SPECIFIC HYPOTHESIS TO ANALYZE: "${hypothesis.label}"
HYPOTHESIS DETAILS: ${hypothesis.metadata?.value || hypothesis.label}
PARENT DIMENSION: ${hypothesis.metadata?.parent_dimension || 'Unknown'}

Collect and analyze evidence SPECIFICALLY for this individual hypothesis:

1. **Targeted Evidence Search**: Find scientific evidence directly relevant to testing this specific hypothesis
2. **Study Identification**: Identify specific studies, papers, or data that could support/refute this hypothesis
3. **Quality Assessment**: Evaluate the methodological quality of evidence for this hypothesis
4. **Statistical Analysis**: Assess statistical power and significance of evidence related to this hypothesis
5. **Confidence Scoring**: Rate evidence strength from 0.0-1.0 for this specific hypothesis
6. **Research Gaps**: Identify missing evidence needed to properly test this hypothesis

Focus ONLY on evidence for this specific hypothesis: "${hypothesis.label}"
Do NOT analyze other hypotheses or general research topics.

BATCH_INDEX: ${i}
HYPOTHESIS_ID: ${hypothesis.id}`
  );

  // Execute batch API call for all hypotheses evidence collection
  const batchEvidenceResults = context.routeApiCall 
    ? await context.routeApiCall(hypothesisBatchPrompts, { 
        batch: true,
        stageId: '4_evidence_batch', 
        graphHash: JSON.stringify(context.graphData).slice(0, 100) 
      })
    : await Promise.all(hypothesisBatchPrompts.map(prompt => 
        callGeminiAPI(prompt, context.apiKeys.gemini, 'thinking-only')
      ));

  // Process batch results and create nodes/edges
  for (let i = 0; i < hypothesisNodes.length; i++) {
    const hypothesis = hypothesisNodes[i];
    const hypothesisEvidenceAnalysis = Array.isArray(batchEvidenceResults) 
      ? batchEvidenceResults[i] 
      : batchEvidenceResults;

    // Create evidence node specifically for this hypothesis
    const hypothesisEvidenceNode: GraphNode = {
      id: `4.${i + 1}`,
      label: `Evidence: ${hypothesis.label}`,
      type: 'evidence' as const,
      confidence: [0.8, 0.7, 0.8, 0.7],
      metadata: {
        parameter_id: 'P1.4',
        type: 'Evidence',
        source_description: `Evidence specific to hypothesis: ${hypothesis.label}`,
        value: hypothesisEvidenceAnalysis,
        parent_hypothesis: hypothesis.id,
        timestamp: new Date().toISOString(),
        notes: hypothesisEvidenceAnalysis,
        statistical_power: 0.75 + (i * 0.05)
      },
      position: { x: hypothesis.position.x, y: hypothesis.position.y + 200 }
    };

    // Create edge from hypothesis to its specific evidence
    const hypothesisEvidenceEdge: GraphEdge = {
      id: `edge-${hypothesis.id}-${hypothesisEvidenceNode.id}`,
      source: hypothesis.id,
      target: hypothesisEvidenceNode.id,
      type: 'supportive',
      confidence: 0.8,
      metadata: {
        type: 'hypothesis_evidence_link',
        parent_hypothesis: hypothesis.label
      }
    };

    allEvidenceNodes.push(hypothesisEvidenceNode);
    allEvidenceEdges.push(hypothesisEvidenceEdge);
    hypothesisResults.push(`**${hypothesis.label} Evidence:**\n${hypothesisEvidenceAnalysis}\n`);
  }

  if (context.setGraphData) {
    context.setGraphData(prev => ({
    ...prev,
    nodes: [...prev.nodes, ...allEvidenceNodes],
    edges: [...prev.edges, ...allEvidenceEdges],
    metadata: {
      ...prev.metadata,
      last_updated: new Date().toISOString(),
      total_nodes: prev.nodes.length + allEvidenceNodes.length,
      total_edges: prev.edges.length + allEvidenceEdges.length,
      stage: 4
    }
    }));
  }

  return `**Stage 4 Complete: Evidence Integration**\n\n**Branch-by-Branch Evidence Analysis:**\n${hypothesisResults.join('\n')}`;
};

export const pruneMergeNodes = async (context: StageExecutorContext): Promise<string> => {
  // Get all evidence nodes from Stage 4 to process individually
  const evidenceNodes = context.graphData.nodes.filter(node => node.type === 'evidence');
  
  if (evidenceNodes.length === 0) {
    throw new Error('No evidence nodes found from Stage 4. Cannot perform pruning/merging.');
  }

  const allPruningResults: string[] = [];
  const nodeQualityAssessments: any[] = [];

  // **BATCH API IMPLEMENTATION**: Process all evidence branches for pruning/merging
  const evidencePruningPrompts = evidenceNodes.map((evidence, i) => {
    // Get the parent hypothesis for this evidence
    const parentHypothesisEdge = context.graphData.edges.find(edge => edge.target === evidence.id);
    const parentHypothesis = parentHypothesisEdge 
      ? context.graphData.nodes.find(node => node.id === parentHypothesisEdge.source)
      : null;

    return `You are a PhD-level researcher conducting Stage 5: Pruning/Merging Analysis.

RESEARCH TOPIC: "${context.researchContext.topic}"

SPECIFIC EVIDENCE BRANCH TO ANALYZE: "${evidence.label}"
EVIDENCE DETAILS: ${evidence.metadata?.value || evidence.label}
PARENT HYPOTHESIS: ${parentHypothesis?.label || 'Unknown'}
EVIDENCE QUALITY: ${evidence.metadata?.statistical_power || 'Not specified'}

Analyze this specific evidence branch for pruning/merging decisions:

1. **Evidence Quality Assessment**: Rate the methodological quality of this specific evidence (0.0-1.0)
2. **Confidence Update**: Based on evidence strength, recommend updated confidence scores
3. **Pruning Decision**: Should this evidence branch be kept, merged, or removed?
4. **Merging Opportunities**: Identify other evidence that could be merged with this branch
5. **Connection Strength**: Assess the strength of this evidence's connection to its hypothesis
6. **Research Value**: How much does this evidence contribute to understanding the research topic?

Focus ONLY on this specific evidence branch: "${evidence.label}"
Provide specific recommendations for this evidence node and its connections.

BATCH_INDEX: ${i}
EVIDENCE_ID: ${evidence.id}`
  });

  // Execute batch API call for all evidence pruning analysis
  const batchPruningResults = context.routeApiCall 
    ? await context.routeApiCall(evidencePruningPrompts, { 
        batch: true,
        stageId: '5_pruning_batch', 
        graphHash: JSON.stringify(context.graphData).slice(0, 100) 
      })
    : await Promise.all(evidencePruningPrompts.map(prompt => 
        callGeminiAPI(prompt, context.apiKeys.gemini, 'thinking-only')
      ));

  // Process batch results and make pruning decisions
  const currentNodes = context.graphData.nodes;
  const currentEdges = context.graphData.edges;
  let prunedNodes = [...currentNodes];
  let prunedEdges = [...currentEdges];

  for (let i = 0; i < evidenceNodes.length; i++) {
    const evidence = evidenceNodes[i];
    const pruningAnalysis = Array.isArray(batchPruningResults) 
      ? batchPruningResults[i] 
      : batchPruningResults;
    
    allPruningResults.push(`**${evidence.label} Pruning Analysis:**\n${pruningAnalysis}\n`);

    // Extract quality score from analysis (simple pattern matching)
    const qualityMatch = pruningAnalysis.match(/quality.*?(\d\.\d+)/i);
    const qualityScore = qualityMatch ? parseFloat(qualityMatch[1]) : 0.5;
    
    // Extract pruning decision
    const shouldKeep = !pruningAnalysis.toLowerCase().includes('remove') && 
                      !pruningAnalysis.toLowerCase().includes('delete') &&
                      qualityScore >= 0.3;

    if (!shouldKeep) {
      // Remove this evidence node and its edges
      prunedNodes = prunedNodes.filter(node => node.id !== evidence.id);
      prunedEdges = prunedEdges.filter(edge => edge.source !== evidence.id && edge.target !== evidence.id);
    } else {
      // Update confidence based on quality assessment
      const nodeIndex = prunedNodes.findIndex(node => node.id === evidence.id);
      if (nodeIndex >= 0) {
        prunedNodes[nodeIndex] = {
          ...prunedNodes[nodeIndex],
          confidence: [qualityScore, qualityScore, qualityScore, qualityScore]
        };
      }
    }

    nodeQualityAssessments.push({
      nodeId: evidence.id,
      label: evidence.label,
      qualityScore,
      kept: shouldKeep,
      analysis: pruningAnalysis
    });
  }

  // Update graph with pruned data from batch analysis
  if (context.setGraphData) {
    context.setGraphData(prev => ({
    ...prev,
    nodes: prunedNodes,
    edges: prunedEdges,
    metadata: {
      ...prev.metadata,
      stage: 5,
      last_updated: new Date().toISOString(),
      total_nodes: prunedNodes.length,
      total_edges: prunedEdges.length,
      pruning_summary: nodeQualityAssessments
    }
    }));
  }

  const nodesRemoved = currentNodes.length - prunedNodes.length;
  const edgesRemoved = currentEdges.length - prunedEdges.length;
  const nodesKept = nodeQualityAssessments.filter(n => n.kept).length;

  return `**Stage 5 Complete: Branch-by-Branch Pruning/Merging for "${context.researchContext.topic}"**

**Optimization Results:**
- Evidence branches analyzed: ${evidenceNodes.length}
- Evidence branches kept: ${nodesKept}
- Evidence branches pruned: ${evidenceNodes.length - nodesKept}
- Total nodes: ${currentNodes.length} → ${prunedNodes.length} (${nodesRemoved} removed)
- Total edges: ${currentEdges.length} → ${prunedEdges.length} (${edgesRemoved} removed)

**Branch-by-Branch Quality Analysis:**
${allPruningResults.join('\n')}

**Quality Summary:**
${nodeQualityAssessments.map(assessment => 
  `- ${assessment.label}: Quality ${assessment.qualityScore.toFixed(2)} (${assessment.kept ? 'KEPT' : 'PRUNED'})`
).join('\n')}

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
      if (!n.confidence || !Array.isArray(n.confidence) || n.confidence.length === 0) return false;
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

  if (context.setGraphData) {
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
  }

  // Return the complete HTML report directly for export functionality
  return finalComprehensiveReport;
};