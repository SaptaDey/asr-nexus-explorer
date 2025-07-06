
import { useState, useCallback, useEffect } from 'react';
import { toast } from "sonner";

export interface GraphNode {
  id: string;
  label: string;
  type: 'root' | 'dimension' | 'hypothesis' | 'evidence' | 'bridge' | 'gap';
  confidence: number[];
  metadata: {
    parameter_id?: string;
    type?: string;
    source_description?: string;
    value?: string;
    notes?: string;
    disciplinary_tags?: string[];
    falsification_criteria?: string;
    bias_flags?: string[];
    layer_id?: string;
    impact_score?: number;
    attribution?: string;
    timestamp?: string;
    statistical_power?: number;
    info_metrics?: Record<string, number>;
    topology_metrics?: Record<string, number>;
    causal_metadata?: Record<string, any>;
    temporal_metadata?: Record<string, any>;
  };
  position?: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'correlative' | 'supportive' | 'contradictory' | 'causal' | 'temporal' | 'prerequisite';
  confidence: number;
  metadata: {
    edge_type?: string;
    causal_metadata?: any;
    temporal_metadata?: any;
  };
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ASRGoTParameters {
  [key: string]: {
    parameter_id: string;
    type: string;
    source_description: string;
    value: string;
    notes: string;
    enabled: boolean;
  };
}

const defaultParameters: ASRGoTParameters = {
  'P1.0': {
    parameter_id: 'P1.0',
    type: 'Parameter - Framework',
    source_description: 'Core GoT Protocol Definition (2025-04-24)',
    value: 'Mandatory 8-stage GoT execution: 1.Initialization, 2.Decomposition, 3.Hypothesis/Planning, 4.Evidence Integration, 5.Pruning/Merging, 6.Subgraph Extraction, 7.Composition, 8.Reflection',
    notes: 'Establishes the fundamental workflow ensuring structured reasoning',
    enabled: true
  },
  'P1.1': {
    parameter_id: 'P1.1',
    type: 'Parameter - Initialization',
    source_description: 'GoT Initialization Rule (2025-04-24)',
    value: 'Root node n₀ label=Task Understanding, confidence=C₀ multi-dimensional vector',
    notes: 'Defines the graphs starting state',
    enabled: true
  },
  'P1.2': {
    parameter_id: 'P1.2',
    type: 'Parameter - Decomposition',
    source_description: 'Enhanced GoT Decomposition Dimensions (2025-04-24)',
    value: 'Default dimensions: Scope, Objectives, Constraints, Data Needs, Use Cases, Potential Biases, Knowledge Gaps',
    notes: 'Ensures comprehensive initial analysis',
    enabled: true
  },
  'P1.3': {
    parameter_id: 'P1.3',
    type: 'Parameter - Hypothesis',
    source_description: 'Enhanced GoT Hypothesis Generation Rules (2025-04-24)',
    value: 'Generate k=3-5 hypotheses per dimension node with explicit plans and metadata tagging',
    notes: 'Guides structured hypothesis exploration',
    enabled: true
  },
  'P1.4': {
    parameter_id: 'P1.4',
    type: 'Parameter - Evidence Integration',
    source_description: 'Enhanced GoT Evidence Integration Process (2025-04-24)',
    value: 'Iterative loop based on multi-dimensional confidence-to-cost ratio and potential impact',
    notes: 'Defines the core learning and graph evolution cycle',
    enabled: true
  },
  'P1.5': {
    parameter_id: 'P1.5',
    type: 'Parameter - Refinement & Confidence',
    source_description: 'Enhanced GoT Confidence Representation & Refinement Rules (2025-04-24)',
    value: 'Confidence C = [empirical_support, theoretical_basis, methodological_rigor, consensus_alignment]',
    notes: 'Defines belief representation and graph simplification rules',
    enabled: true
  },
  'P1.6': {
    parameter_id: 'P1.6',
    type: 'Parameter - Output & Extraction',
    source_description: 'Enhanced GoT Output Generation & Subgraph Selection Rules (2025-04-24)',
    value: 'Numeric node labels, verbatim queries, reasoning trace, Vancouver citations',
    notes: 'Ensures transparent, traceable, user-aligned output',
    enabled: true
  },
  'P1.7': {
    parameter_id: 'P1.7',
    type: 'Parameter - Verification',
    source_description: 'Enhanced GoT Self-Audit Protocol (2025-04-24)',
    value: 'Mandatory self-audit checking coverage, constraints, bias, gaps, falsifiability',
    notes: 'Mandates final quality control',
    enabled: true
  },
  'P1.8': {
    parameter_id: 'P1.8',
    type: 'Parameter - Cross-Domain Linking',
    source_description: 'Methodology for Interdisciplinary Bridge Nodes (IBNs)',
    value: 'Maintain explicit disciplinary_tags and create IBNs for cross-domain connections',
    notes: 'Facilitates integration across fields',
    enabled: true
  }
};

interface APIKeys {
  perplexity: string;
  gemini: string;
}

export const useASRGoT = () => {
  const [currentStage, setCurrentStage] = useState(0);
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    edges: []
  });
  const [parameters, setParameters] = useState<ASRGoTParameters>(defaultParameters);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKeys, setApiKeys] = useState<APIKeys>({ perplexity: '', gemini: '' });
  const [stageResults, setStageResults] = useState<string[]>([]);
  const [researchContext, setResearchContext] = useState<{
    field: string;
    topic: string;
    objectives: string[];
    hypotheses: string[];
  }>({ field: '', topic: '', objectives: [], hypotheses: [] });

  // Load API keys from localStorage on mount
  useEffect(() => {
    const savedKeys = localStorage.getItem('asr-got-api-keys');
    if (savedKeys) {
      setApiKeys(JSON.parse(savedKeys));
    }
  }, []);

  // Save API keys to localStorage when they change
  const updateApiKeys = useCallback((keys: APIKeys) => {
    setApiKeys(keys);
    localStorage.setItem('asr-got-api-keys', JSON.stringify(keys));
  }, []);

  const stageProgress = ((currentStage + 1) / 8) * 100;

  const callPerplexityAPI = async (query: string): Promise<string> => {
    if (!apiKeys.perplexity) {
      throw new Error('Perplexity API key not configured');
    }

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKeys.perplexity}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar-reasoning-pro',
          messages: [
            {
              role: 'user',
              content: query
            }
          ],
          max_tokens: 2000,
          temperature: 0.3
        }),
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'No response from Perplexity API';
    } catch (error) {
      console.error('Perplexity API call failed:', error);
      throw error;
    }
  };

  const callGeminiAPI = async (prompt: string): Promise<string> => {
    if (!apiKeys.gemini) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKeys.gemini,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2000,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0]?.content?.parts[0]?.text || 'No response from Gemini API';
    } catch (error) {
      console.error('Gemini API call failed:', error);
      throw error;
    }
  };

  const executeStage = useCallback(async (stageIndex: number, input?: any) => {
    if (!apiKeys.perplexity || !apiKeys.gemini) {
      toast.error('Please configure API keys first');
      return;
    }

    setIsProcessing(true);
    
    try {
      let result = '';
      
      switch (stageIndex) {
        case 0: // Initialization
          result = await initializeGraph(input);
          break;
        case 1: // Decomposition
          result = await decomposeTask(input);
          break;
        case 2: // Hypothesis/Planning
          result = await generateHypotheses(input);
          break;
        case 3: // Evidence Integration
          result = await integrateEvidence(input);
          break;
        case 4: // Pruning/Merging
          result = await pruneMergeNodes();
          break;
        case 5: // Subgraph Extraction
          result = await extractSubgraphs();
          break;
        case 6: // Composition
          result = await composeResults();
          break;
        case 7: // Reflection
          result = await performReflection();
          break;
      }
      
      setStageResults(prev => {
        const newResults = [...prev];
        newResults[stageIndex] = result;
        return newResults;
      });
      
      if (stageIndex === currentStage) {
        setCurrentStage(prev => Math.min(prev + 1, 7));
      }
      
      toast.success(`Stage ${stageIndex + 1} completed successfully`);
    } catch (error) {
      toast.error(`Error in stage ${stageIndex + 1}: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  }, [currentStage, apiKeys]);

  const initializeGraph = async (taskDescription: string): Promise<string> => {
    // Analyze research field using Gemini
    const fieldAnalysis = await callGeminiAPI(
      `Analyze this research question and identify: 1) The primary scientific field, 2) Key research objectives, 3) Potential interdisciplinary connections. Question: "${taskDescription}"`
    );

    // Get background research using Perplexity
    const backgroundResearch = await callPerplexityAPI(
      `Provide current scientific background and recent developments for: ${taskDescription}`
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

    setGraphData(prev => ({
      ...prev,
      nodes: [rootNode],
      edges: []
    }));

    // Update research context
    const context = {
      field: fieldAnalysis.split('\n')[0] || 'General Science',
      topic: taskDescription,
      objectives: fieldAnalysis.split('\n').slice(1, 4) || [],
      hypotheses: []
    };
    setResearchContext(context);

    return `**Stage 1 Complete: Initialization**\n\n**Field Analysis:**\n${fieldAnalysis}\n\n**Background Research:**\n${backgroundResearch}`;
  };

  const decomposeTask = async (dimensions?: string[]): Promise<string> => {
    const defaultDimensions = ['Scope', 'Objectives', 'Constraints', 'Data Needs', 'Use Cases', 'Potential Biases', 'Knowledge Gaps'];
    const useDimensions = dimensions || defaultDimensions;

    // Get AI recommendations for decomposition
    const decompositionAnalysis = await callGeminiAPI(
      `For the research topic "${researchContext.topic}", analyze each dimension and provide specific insights: ${useDimensions.join(', ')}`
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
        edge_type: 'decomposition'
      }
    }));

    setGraphData(prev => ({
      nodes: [...prev.nodes, ...dimensionNodes],
      edges: [...prev.edges, ...dimensionEdges]
    }));

    return `**Stage 2 Complete: Decomposition**\n\n**AI Analysis:**\n${decompositionAnalysis}`;
  };

  const generateHypotheses = async (customHypotheses?: string[]): Promise<string> => {
    // Generate hypotheses using both AI models
    const hypothesisGeneration = await callPerplexityAPI(
      `Generate 3-5 testable scientific hypotheses for: ${researchContext.topic}. Include falsification criteria for each hypothesis.`
    );

    const hypothesisAnalysis = await callGeminiAPI(
      `Analyze these hypotheses for scientific rigor, testability, and potential impact: ${hypothesisGeneration}`
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
      graphData.nodes.filter(node => node.type === 'dimension').slice(0, 3).forEach(dimNode => {
        hypothesisEdges.push({
          id: `edge-${dimNode.id}-${hypNode.id}`,
          source: dimNode.id,
          target: hypNode.id,
          type: 'supportive',
          confidence: 0.7,
          metadata: { edge_type: 'hypothesis_derivation' }
        });
      });
    });

    setGraphData(prev => ({
      nodes: [...prev.nodes, ...hypothesisNodes],
      edges: [...prev.edges, ...hypothesisEdges]
    }));

    setResearchContext(prev => ({
      ...prev,
      hypotheses: generatedHypotheses
    }));

    return `**Stage 3 Complete: Hypothesis Generation**\n\n**Generated Hypotheses:**\n${hypothesisGeneration}\n\n**AI Analysis:**\n${hypothesisAnalysis}`;
  };

  const integrateEvidence = async (query?: string): Promise<string> => {
    // Search for evidence using Perplexity
    const evidenceSearch = await callPerplexityAPI(
      `Find recent scientific evidence and research studies related to: ${researchContext.topic}. Focus on peer-reviewed sources and statistical data.`
    );

    // Analyze evidence using Gemini
    const evidenceAnalysis = await callGeminiAPI(
      `Analyze this scientific evidence for quality, statistical power, and relevance to our hypotheses: ${evidenceSearch}`
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
    const hypothesisNodes = graphData.nodes.filter(node => node.type === 'hypothesis');
    hypothesisNodes.forEach(hypNode => {
      evidenceEdges.push({
        id: `edge-4.1-${hypNode.id}`,
        source: '4.1',
        target: hypNode.id,
        type: 'supportive',
        confidence: 0.7,
        metadata: { edge_type: 'evidence_support' }
      });
    });

    setGraphData(prev => ({
      nodes: [...prev.nodes, ...evidenceNodes],
      edges: [...prev.edges, ...evidenceEdges]
    }));

    return `**Stage 4 Complete: Evidence Integration**\n\n**Evidence Found:**\n${evidenceSearch}\n\n**Analysis:**\n${evidenceAnalysis}`;
  };

  const pruneMergeNodes = async (): Promise<string> => {
    const pruningAnalysis = await callGeminiAPI(
      `Analyze the current research graph for: 1) Low-confidence nodes to prune, 2) Redundant information to merge, 3) Quality assessment of evidence and hypotheses.`
    );

    return `**Stage 5 Complete: Pruning/Merging**\n\n**Analysis:**\n${pruningAnalysis}`;
  };

  const extractSubgraphs = async (): Promise<string> => {
    const subgraphAnalysis = await callGeminiAPI(
      `Identify the most important subgraphs and relationships in our research analysis. Focus on high-impact findings and strong evidence chains.`
    );

    return `**Stage 6 Complete: Subgraph Extraction**\n\n**Key Findings:**\n${subgraphAnalysis}`;
  };

  const composeResults = async (): Promise<string> => {
    const composition = await callGeminiAPI(
      `Compose a comprehensive scientific analysis summary with: 1) Key findings, 2) Evidence evaluation, 3) Hypothesis assessment, 4) Implications and recommendations. Format in academic style with proper citations.`
    );

    return `**Stage 7 Complete: Composition**\n\n**Scientific Analysis:**\n${composition}`;
  };

  const performReflection = async (): Promise<string> => {
    const reflection = await callGeminiAPI(
      `Perform a critical audit of our research analysis: 1) Bias assessment, 2) Gap identification, 3) Methodological rigor, 4) Statistical validity, 5) Future research directions.`
    );

    return `**Stage 8 Complete: Reflection & Audit**\n\n**Critical Assessment:**\n${reflection}`;
  };

  const resetFramework = useCallback(() => {
    setCurrentStage(0);
    setGraphData({ nodes: [], edges: [] });
    setParameters(defaultParameters);
    setStageResults([]);
    setResearchContext({ field: '', topic: '', objectives: [], hypotheses: [] });
    toast.info('Framework reset to initial state');
  }, []);

  const exportResults = useCallback(() => {
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
  }, [stageResults, graphData, researchContext]);

  return {
    currentStage,
    graphData,
    parameters,
    stageProgress,
    isProcessing,
    apiKeys,
    stageResults,
    researchContext,
    executeStage,
    resetFramework,
    setParameters,
    updateApiKeys,
    exportResults
  };
};
