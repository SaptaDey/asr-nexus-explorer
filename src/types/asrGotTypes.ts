// ASR-GoT Core Type Definitions
// Based on ASR-GoT System Prompt Version 2025-07-07

export interface ASRGoTMetadata {
  // Core P1.12 Schema
  parameter_id?: string;
  type?: string;
  source_description?: string;
  value?: any;
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
  
  // Enhanced metadata for P1.11 compliance
  approximation?: boolean;
  evidence_quality?: 'high' | 'medium' | 'low';
  publication_rank?: number;
  conference_tier?: string;
  doi?: string;
  url?: string;
  power_metrics?: Record<string, number>;
  uncertainty_bounds?: [number, number];
  peer_review_status?: 'peer-reviewed' | 'preprint' | 'grey-literature';
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'root' | 'dimension' | 'hypothesis' | 'evidence' | 'bridge' | 'gap' | 'synthesis' | 'reflection' | 'knowledge';
  confidence: number[]; // Multi-dimensional confidence vector per P1.5
  metadata: ASRGoTMetadata;
  position?: { x: number; y: number };
  children?: string[]; // Child node IDs
  parents?: string[]; // Parent node IDs
}

// Knowledge Nodes (K1-K3) for framework integration
export interface KnowledgeNode extends GraphNode {
  type: 'knowledge';
  knowledgeType: 'communication' | 'content' | 'profile';
  knowledgeData: CommunicationPreferences | ContentRequirements | UserProfile;
}

export interface CommunicationPreferences {
  tone: 'formal' | 'informal';
  style: 'informative' | 'narrative' | 'technical';
  citationStyle: 'vancouver' | 'apa' | 'mla';
  length: 'extensive' | 'brief' | 'medium';
  addressingStyle: 'formal' | 'casual';
}

export interface ContentRequirements {
  accuracy: 'high' | 'medium' | 'low';
  modality: string[];
  innovation: 'progressive' | 'conservative';
  querySpecificity: 'research' | 'general' | 'application';
}

export interface UserProfile {
  identity: string;
  experience: string;
  researchFocus: string[];
  methodologies: string[];
  philosophy: string;
  interests: string[];
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'correlative' | 'supportive' | 'contradictory' | 'causal' | 'temporal' | 'prerequisite' | 'hyperedge' | 
        'causal_direct' | 'causal_counterfactual' | 'causal_confounded' | 'temporal_precedence' | 'temporal_cyclic' | 
        'temporal_delayed' | 'temporal_sequential';
  confidence: number;
  metadata: ASRGoTMetadata;
  weight?: number;
  bidirectional?: boolean;
}

export interface HyperEdge {
  id: string;
  nodes: string[]; // Multiple nodes connected by this hyperedge
  type: 'complex_relationship' | 'multi_causal' | 'interdisciplinary';
  confidence: number;
  metadata: ASRGoTMetadata;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  hyperedges?: HyperEdge[];
  metadata: {
    version: string;
    created: string;
    last_updated: string;
    stage: number;
    total_nodes: number;
    total_edges: number;
    graph_metrics: Record<string, number>;
  };
}

export interface ASRGoTParameter {
  parameter_id: string;
  type: string;
  source_description: string;
  value: string | number | boolean | any[];
  notes: string;
  enabled: boolean;
  category: 'framework' | 'initialization' | 'decomposition' | 'hypothesis' | 'evidence' | 'refinement' | 'output' | 'verification' | 'advanced';
  validation_rules?: string[];
  dependencies?: string[];
}

export interface ASRGoTParameters {
  [key: string]: ASRGoTParameter;
}

export interface APICredentials {
  gemini: string;
  perplexity?: string;
  mcp_servers?: string[];
}

export interface StageExecutionContext {
  stage_id: number;
  stage_name: string;
  input_data: any;
  output_data?: any;
  execution_time: number;
  api_calls_made: number;
  tokens_consumed: number;
  confidence_achieved: number;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  error_message?: string;
}

export interface ResearchContext {
  field: string;
  topic: string;
  objectives: string[];
  hypotheses: string[];
  constraints: string[];
  biases_detected: string[];
  knowledge_gaps: string[];
  auto_generated: boolean;
}

export interface BackgroundTask {
  id: string;
  type: 'api_call' | 'graph_processing' | 'stage_execution';
  priority: 'high' | 'medium' | 'low';
  payload: any;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  result?: any;
  error?: string;
}

// Cost-Aware Orchestration Types
export type AIModel = 'sonar-deep-research' | 'gemini-2.5-flash' | 'gemini-2.5-pro';

export type CapabilityFlag = 
  | 'STRUCTURED_OUTPUTS'
  | 'SEARCH_GROUNDING'
  | 'FUNCTION_CALLING'
  | 'CODE_EXECUTION'
  | 'THINKING'
  | 'CACHING';

export interface ModelCapability {
  model: AIModel;
  capability: CapabilityFlag;
  batchSize: number;
  purpose: string;
  outputType: string;
  maxTokens: number;
  thinkingBudget?: number;
}

export interface StageModelAssignment {
  stage: string;
  microPass?: string;
  modelCapability: ModelCapability;
  costEstimate: {
    inputTokens: number;
    outputTokens: number;
    priceUSD: number;
  };
}

export interface CostDashboardEntry {
  stage: string;
  model: AIModel;
  promptTokens: number;
  outputTokens: number;
  priceUSD: number;
  timestamp: string;
  batchSize?: number;
}

export interface TokenBudget {
  promptSizeEnvelope: number;
  thinkingBudget: number;
  outputLimit: number;
}

export interface BatchRequest {
  requests: Array<{
    prompt: string;
    model: AIModel;
    capability: CapabilityFlag;
    maxTokens: number;
    thinkingBudget?: number;
  }>;
  batchId: string;
  estimatedCost: number;
}

export interface SonarSearchRequest {
  queries: string[];
  maxDocs: number;
  batch: boolean;
  costPerQuery: number;
  query?: string;
  maxTokens?: number;
  searchMode?: 'academic' | 'general' | 'news';
  dateFilter?: string;
  domainFilter?: string[];
  stageId?: string;
  researchDomain?: string;
  customSystemPrompt?: string;
}