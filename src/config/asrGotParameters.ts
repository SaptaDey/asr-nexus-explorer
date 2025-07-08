// Complete ASR-GoT Parameter Definitions (P1.0 - P1.29)
// Based on ASR-GoT System Prompt Version 2025-07-07

import { ASRGoTParameters } from '@/types/asrGotTypes';

export const completeASRGoTParameters: ASRGoTParameters = {
  'P1.0': {
    parameter_id: 'P1.0',
    type: 'Parameter - Framework',
    source_description: 'Core GoT Protocol Definition (2025-04-24)',
    value: 'Mandatory 9-stage GoT execution: 1.Initialization, 2.Decomposition, 3.Hypothesis/Planning, 4.Evidence Integration, 5.Pruning/Merging, 6.Subgraph Extraction, 7.Composition, 8.Reflection, 9.Final Analysis',
    notes: 'Establishes the fundamental workflow ensuring structured reasoning with comprehensive final analysis',
    enabled: true,
    category: 'framework'
  },
  'P1.1': {
    parameter_id: 'P1.1',
    type: 'Parameter - Initialization',
    source_description: 'GoT Initialization Rule (2025-04-24)',
    value: 'Root node n₀ label=Task Understanding, confidence=C₀ multi-dimensional vector',
    notes: 'Defines the graphs starting state',
    enabled: true,
    category: 'initialization'
  },
  'P1.2': {
    parameter_id: 'P1.2',
    type: 'Parameter - Decomposition',
    source_description: 'Enhanced GoT Decomposition Dimensions (2025-04-24)',
    value: 'Default dimensions: Scope, Objectives, Constraints, Data Needs, Use Cases, Potential Biases, Knowledge Gaps',
    notes: 'Ensures comprehensive initial analysis',
    enabled: true,
    category: 'decomposition'
  },
  'P1.3': {
    parameter_id: 'P1.3',
    type: 'Parameter - Hypothesis',
    source_description: 'Enhanced GoT Hypothesis Generation Rules (2025-04-24)',
    value: 'Generate k=3-5 hypotheses per dimension node with explicit plans and metadata tagging',
    notes: 'Guides structured hypothesis exploration',
    enabled: true,
    category: 'hypothesis'
  },
  'P1.4': {
    parameter_id: 'P1.4',
    type: 'Parameter - Evidence Integration',
    source_description: 'Enhanced GoT Evidence Integration Process (2025-04-24)',
    value: 'Iterative loop based on multi-dimensional confidence-to-cost ratio and potential impact',
    notes: 'Defines the core learning and graph evolution cycle',
    enabled: true,
    category: 'evidence'
  },
  'P1.5': {
    parameter_id: 'P1.5',
    type: 'Parameter - Refinement & Confidence',
    source_description: 'Enhanced GoT Confidence Representation & Refinement Rules (2025-04-24)',
    value: 'Confidence C = [empirical_support, theoretical_basis, methodological_rigor, consensus_alignment]',
    notes: 'Defines belief representation and graph simplification rules',
    enabled: true,
    category: 'refinement'
  },
  'P1.6': {
    parameter_id: 'P1.6',
    type: 'Parameter - Output & Extraction',
    source_description: 'Enhanced GoT Output Generation & Subgraph Selection Rules (2025-04-24)',
    value: 'Numeric node labels, verbatim queries, reasoning trace, Vancouver citations',
    notes: 'Ensures transparent, traceable, user-aligned output',
    enabled: true,
    category: 'output'
  },
  'P1.7': {
    parameter_id: 'P1.7',
    type: 'Parameter - Verification',
    source_description: 'Enhanced GoT Self-Audit Protocol (2025-04-24)',
    value: 'Mandatory self-audit checking coverage, constraints, bias, gaps, falsifiability',
    notes: 'Mandates final quality control',
    enabled: true,
    category: 'verification'
  },
  'P1.8': {
    parameter_id: 'P1.8',
    type: 'Parameter - Cross-Domain Linking',
    source_description: 'Methodology for Interdisciplinary Bridge Nodes (IBNs)',
    value: 'Maintain explicit disciplinary_tags and create IBNs for cross-domain connections',
    notes: 'Facilitates integration across fields',
    enabled: true,
    category: 'advanced'
  },
  'P1.9': {
    parameter_id: 'P1.9',
    type: 'Parameter - Hyperedges',
    source_description: 'Hyperedge Support for Complex Multi-Node Relationships',
    value: 'Enable hyperedges for relationships involving >2 nodes, complex causal chains',
    notes: 'Supports advanced graph topology for complex reasoning patterns',
    enabled: true,
    category: 'advanced'
  },
  'P1.10': {
    parameter_id: 'P1.10',
    type: 'Parameter - Node Typing',
    source_description: 'Extended Node Type Classification System',
    value: 'Node types: root, dimension, hypothesis, evidence, bridge, gap, synthesis, reflection, temporal, causal',
    notes: 'Comprehensive node classification for reasoning structure',
    enabled: true,
    category: 'framework'
  },
  'P1.11': {
    parameter_id: 'P1.11',
    type: 'Parameter - Graph Structure',
    source_description: 'Formal Graph Representation Gt = (V, E, Eh, L, M)',
    value: 'Directed multigraph with nodes V, edges E, hyperedges Eh, labels L, metadata M',
    notes: 'Mathematical foundation for graph-based reasoning',
    enabled: true,
    category: 'framework'
  },
  'P1.12': {
    parameter_id: 'P1.12',
    type: 'Parameter - Metadata Schema',
    source_description: 'Comprehensive Node/Edge Metadata Requirements',
    value: 'Required: parameter_id, type, confidence, attribution, timestamp, impact_score',
    notes: 'Ensures full traceability and quality metrics',
    enabled: true,
    category: 'framework'
  },
  'P1.13': {
    parameter_id: 'P1.13',
    type: 'Parameter - Uncertainty Handling',
    source_description: 'Bayesian Uncertainty Propagation Rules',
    value: 'Propagate uncertainty through confidence vectors using Bayesian updates',
    notes: 'Mathematical framework for handling uncertainty in reasoning chains',
    enabled: true,
    category: 'advanced'
  },
  'P1.14': {
    parameter_id: 'P1.14',
    type: 'Parameter - Confidence Updates',
    source_description: 'Dynamic Confidence Vector Update Mechanism',
    value: 'Update confidence based on new evidence using weighted Bayesian inference',
    notes: 'Enables learning and belief revision throughout the reasoning process',
    enabled: true,
    category: 'refinement'
  },
  'P1.15': {
    parameter_id: 'P1.15',
    type: 'Parameter - Gap Detection',
    source_description: 'Knowledge Gap Identification and Flagging',
    value: 'Automatically detect and flag knowledge gaps, missing evidence, incomplete reasoning',
    notes: 'Ensures comprehensive coverage and identifies areas needing further investigation',
    enabled: true,
    category: 'verification'
  },
  'P1.16': {
    parameter_id: 'P1.16',
    type: 'Parameter - Evidence Quality',
    source_description: 'Evidence Quality Assessment and Ranking',
    value: 'Quality metrics: peer-review status, publication tier, statistical power, replication',
    notes: 'Ensures high-quality evidence integration',
    enabled: true,
    category: 'evidence'
  },
  'P1.17': {
    parameter_id: 'P1.17',
    type: 'Parameter - Bias Detection',
    source_description: 'Systematic Bias Detection and Mitigation',
    value: 'Detect confirmation bias, selection bias, publication bias, cultural bias',
    notes: 'Promotes objective and unbiased reasoning',
    enabled: true,
    category: 'verification'
  },
  'P1.18': {
    parameter_id: 'P1.18',
    type: 'Parameter - Citation Management',
    source_description: 'Vancouver Citation Style Integration',
    value: 'All claims must have superscripted numeric citations in Vancouver format',
    notes: 'Ensures academic rigor and traceability',
    enabled: true,
    category: 'output'
  },
  'P1.19': {
    parameter_id: 'P1.19',
    type: 'Parameter - Auto-Steering',
    source_description: 'Automatic Field Detection and Hypothesis Generation',
    value: 'Auto-infer disciplines, generate dimensions and hypotheses without user input',
    notes: 'Enables autonomous reasoning initiation',
    enabled: true,
    category: 'initialization'
  },
  'P1.20': {
    parameter_id: 'P1.20',
    type: 'Parameter - API Orchestration',
    source_description: 'Perplexity Sonar and Gemini 2.5 Pro Integration Rules',
    value: 'Sonar for search/evidence, Gemini for analysis/synthesis, async execution',
    notes: 'Defines AI model usage patterns',
    enabled: true,
    category: 'framework'
  },
  'P1.21': {
    parameter_id: 'P1.21',
    type: 'Parameter - Compute Management',
    source_description: 'Token Budget and Compute Cost Management',
    value: 'Sonar: 3000 tokens/call, Gemini: 6000 tokens/call, monitor costs',
    notes: 'Prevents runaway compute costs while maintaining quality',
    enabled: true,
    category: 'framework'
  },
  'P1.22': {
    parameter_id: 'P1.22',
    type: 'Parameter - Topology Metrics',
    source_description: 'Graph Topology Analysis and Metrics',
    value: 'Track centrality, clustering, path lengths, subgraph connectivity',
    notes: 'Enables graph structure optimization and analysis',
    enabled: true,
    category: 'advanced'
  },
  'P1.23': {
    parameter_id: 'P1.23',
    type: 'Parameter - Pruning Rules',
    source_description: 'Graph Pruning and Simplification Criteria',
    value: 'Remove low-confidence edges, merge similar nodes, eliminate redundancy',
    notes: 'Maintains graph clarity and computational efficiency',
    enabled: true,
    category: 'refinement'
  },
  'P1.24': {
    parameter_id: 'P1.24',
    type: 'Parameter - Causal Reasoning',
    source_description: 'Causal Edge Detection and Representation',
    value: 'Identify and represent causal relationships with confidence and direction',
    notes: 'Enables sophisticated causal reasoning capabilities',
    enabled: true,
    category: 'advanced'
  },
  'P1.25': {
    parameter_id: 'P1.25',
    type: 'Parameter - Temporal Reasoning',
    source_description: 'Temporal Edge and Time-Series Analysis',
    value: 'Track temporal relationships, sequence dependencies, time-based evolution',
    notes: 'Supports reasoning about time-dependent phenomena',
    enabled: true,
    category: 'advanced'
  },
  'P1.26': {
    parameter_id: 'P1.26',
    type: 'Parameter - Impact Scoring',
    source_description: 'Evidence Impact and Influence Scoring',
    value: 'Score evidence impact based on citation count, methodology, sample size',
    notes: 'Prioritizes high-impact evidence in reasoning',
    enabled: true,
    category: 'evidence'
  },
  'P1.27': {
    parameter_id: 'P1.27',
    type: 'Parameter - Information Metrics',
    source_description: 'Information Theory Metrics for Nodes and Edges',
    value: 'Calculate entropy, mutual information, information gain',
    notes: 'Quantifies information content and relationships',
    enabled: true,
    category: 'advanced'
  },
  'P1.28': {
    parameter_id: 'P1.28',
    type: 'Parameter - Export Formats',
    source_description: 'Multi-Format Export Capabilities',
    value: 'Export HTML, Markdown, JSON graph, PDF, interactive visualization',
    notes: 'Supports various output formats for different use cases',
    enabled: true,
    category: 'output'
  },
  'P1.29': {
    parameter_id: 'P1.29',
    type: 'Parameter - MCP Integration',
    source_description: 'Model Context Protocol Server Integration',
    value: 'POST graph snapshots to MCP servers at /api/v1/graphs endpoint',
    notes: 'Enables external system integration and extended capabilities',
    enabled: true,
    category: 'advanced'
  }
};

export const getParametersByCategory = (category: string) => {
  return Object.values(completeASRGoTParameters).filter(param => param.category === category);
};

export const getParameterCategories = () => {
  return Array.from(new Set(Object.values(completeASRGoTParameters).map(param => param.category)));
};