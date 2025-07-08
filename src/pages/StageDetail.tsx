import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  Network, 
  Zap, 
  Database, 
  Search, 
  BookOpen, 
  Target, 
  CheckCircle, 
  ArrowLeft,
  Home,
  Settings,
  TrendingUp,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface StageInfo {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  detailedDescription: string;
  objectives: string[];
  parameters: {
    name: string;
    description: string;
    type: string;
    defaultValue: string;
    importance: 'high' | 'medium' | 'low';
  }[];
  inputRequirements: string[];
  outputDeliverables: string[];
  technicalDetails: string[];
  bestPractices: string[];
  commonChallenges: string[];
}

const stageData: Record<number, StageInfo> = {
  1: {
    id: 1,
    title: "Initialization",
    description: "Root node creation with task understanding and confidence vectors",
    icon: Target,
    color: "blue",
    detailedDescription: "The Initialization stage establishes the foundation of the ASR-GoT framework by creating the root node of the knowledge graph. This stage involves comprehensive task understanding, setting up confidence vectors, and defining the initial parameters that will guide the entire reasoning process.",
    objectives: [
      "Create the root node with comprehensive task understanding",
      "Initialize multi-dimensional confidence vectors",
      "Establish baseline parameters for the reasoning process",
      "Set up the graph data structure with proper metadata",
      "Define success criteria and evaluation metrics"
    ],
    parameters: [
      {
        name: "confidence_threshold",
        description: "Minimum confidence level required for node acceptance",
        type: "float",
        defaultValue: "0.7",
        importance: "high"
      },
      {
        name: "max_graph_depth",
        description: "Maximum depth of the knowledge graph",
        type: "integer",
        defaultValue: "8",
        importance: "medium"
      },
      {
        name: "initial_node_weight",
        description: "Starting weight for the root node",
        type: "float",
        defaultValue: "1.0",
        importance: "medium"
      },
      {
        name: "metadata_tracking",
        description: "Enable comprehensive metadata tracking",
        type: "boolean",
        defaultValue: "true",
        importance: "high"
      }
    ],
    inputRequirements: [
      "Research question or problem statement",
      "Task scope and boundaries",
      "Available data sources and APIs",
      "Quality and confidence thresholds",
      "Time and resource constraints"
    ],
    outputDeliverables: [
      "Root node with task representation",
      "Initialized confidence vectors",
      "Graph structure with metadata",
      "Parameter configuration",
      "Success criteria definition"
    ],
    technicalDetails: [
      "Implements directed multigraph structure",
      "Uses Bayesian confidence propagation",
      "Supports hyperedge relationships",
      "Includes comprehensive metadata tracking",
      "Integrates with API orchestration layer"
    ],
    bestPractices: [
      "Clearly define the research question scope",
      "Set realistic confidence thresholds",
      "Establish proper metadata tracking from the start",
      "Consider computational resource constraints",
      "Define clear success criteria"
    ],
    commonChallenges: [
      "Ambiguous or overly broad research questions",
      "Inappropriate confidence threshold settings",
      "Insufficient metadata specification",
      "Resource constraint conflicts",
      "Unclear success criteria"
    ]
  },
  2: {
    id: 2,
    title: "Decomposition",
    description: "Multi-dimensional analysis: scope, objectives, constraints, data needs",
    icon: Network,
    color: "purple",
    detailedDescription: "The Decomposition stage breaks down the complex research task into manageable dimensions and components. This systematic decomposition ensures comprehensive coverage of all aspects of the research question while maintaining tractability and focus.",
    objectives: [
      "Decompose the research question into key dimensions",
      "Identify scope boundaries and constraints",
      "Determine data requirements and sources",
      "Establish sub-objectives and priorities",
      "Create dimensional analysis framework"
    ],
    parameters: [
      {
        name: "max_dimensions",
        description: "Maximum number of dimensions to analyze",
        type: "integer",
        defaultValue: "6",
        importance: "high"
      },
      {
        name: "decomposition_depth",
        description: "Depth of decomposition analysis",
        type: "integer",
        defaultValue: "3",
        importance: "medium"
      },
      {
        name: "priority_weighting",
        description: "Enable priority-based dimension weighting",
        type: "boolean",
        defaultValue: "true",
        importance: "medium"
      },
      {
        name: "constraint_analysis",
        description: "Include constraint analysis in decomposition",
        type: "boolean",
        defaultValue: "true",
        importance: "high"
      }
    ],
    inputRequirements: [
      "Root node from initialization stage",
      "Domain knowledge and context",
      "Available data sources",
      "Time and resource constraints",
      "Stakeholder requirements"
    ],
    outputDeliverables: [
      "Dimensional analysis framework",
      "Scope and boundary definitions",
      "Data requirement specifications",
      "Sub-objective hierarchy",
      "Constraint mapping"
    ],
    technicalDetails: [
      "Implements recursive decomposition algorithms",
      "Uses constraint satisfaction techniques",
      "Supports multi-criteria decision analysis",
      "Includes dependency mapping",
      "Integrates domain-specific knowledge"
    ],
    bestPractices: [
      "Ensure dimensions are mutually exclusive",
      "Maintain clear hierarchical relationships",
      "Document all assumptions and constraints",
      "Validate decomposition with domain experts",
      "Consider interdependencies between dimensions"
    ],
    commonChallenges: [
      "Overlapping or redundant dimensions",
      "Insufficient domain knowledge",
      "Overly complex decomposition",
      "Missing critical constraints",
      "Unclear dimension boundaries"
    ]
  },
  3: {
    id: 3,
    title: "Hypothesis Generation",
    description: "3-5 hypotheses per dimension with explicit plans and metadata",
    icon: Brain,
    color: "green",
    detailedDescription: "The Hypothesis Generation stage creates testable hypotheses for each dimension identified in the decomposition phase. This stage emphasizes generating diverse, well-structured hypotheses with explicit testing plans and comprehensive metadata to guide the evidence collection process.",
    objectives: [
      "Generate 3-5 testable hypotheses per dimension",
      "Create explicit testing plans for each hypothesis",
      "Establish hypothesis priorities and relationships",
      "Define evidence requirements and success criteria",
      "Set up hypothesis tracking and metadata"
    ],
    parameters: [
      {
        name: "hypotheses_per_dimension",
        description: "Number of hypotheses to generate per dimension",
        type: "integer",
        defaultValue: "4",
        importance: "high"
      },
      {
        name: "creativity_factor",
        description: "Balance between conservative and creative hypotheses",
        type: "float",
        defaultValue: "0.6",
        importance: "medium"
      },
      {
        name: "evidence_threshold",
        description: "Minimum evidence quality required for hypothesis testing",
        type: "float",
        defaultValue: "0.65",
        importance: "high"
      },
      {
        name: "hypothesis_diversity",
        description: "Ensure diverse hypothesis generation",
        type: "boolean",
        defaultValue: "true",
        importance: "medium"
      }
    ],
    inputRequirements: [
      "Dimensional analysis from decomposition stage",
      "Domain knowledge and literature",
      "Available testing methodologies",
      "Resource and time constraints",
      "Quality and evidence standards"
    ],
    outputDeliverables: [
      "Structured hypothesis set per dimension",
      "Testing plans and methodologies",
      "Evidence requirement specifications",
      "Hypothesis priority rankings",
      "Metadata and tracking systems"
    ],
    technicalDetails: [
      "Uses knowledge graph expansion techniques",
      "Implements hypothesis diversity algorithms",
      "Supports multiple evidence types",
      "Includes automated quality assessment",
      "Integrates with literature mining systems"
    ],
    bestPractices: [
      "Ensure hypotheses are testable and falsifiable",
      "Maintain balance between breadth and depth",
      "Create clear testing criteria",
      "Document all assumptions",
      "Consider alternative explanations"
    ],
    commonChallenges: [
      "Generating truly diverse hypotheses",
      "Balancing creativity with feasibility",
      "Insufficient domain knowledge",
      "Unclear testing criteria",
      "Resource constraints limiting testing"
    ]
  },
  4: {
    id: 4,
    title: "Evidence Integration",
    description: "Iterative evidence gathering based on confidence-to-cost ratios",
    icon: Database,
    color: "orange",
    detailedDescription: "The Evidence Integration stage systematically gathers and integrates evidence to test the hypotheses generated in the previous stage. This process uses confidence-to-cost ratios to optimize evidence collection efforts and ensures comprehensive coverage while maintaining efficiency.",
    objectives: [
      "Gather evidence systematically for each hypothesis",
      "Optimize evidence collection using confidence-to-cost ratios",
      "Integrate multi-source evidence effectively",
      "Update confidence measures iteratively",
      "Maintain evidence quality and provenance"
    ],
    parameters: [
      {
        name: "evidence_sources",
        description: "Number of evidence sources to query",
        type: "integer",
        defaultValue: "8",
        importance: "high"
      },
      {
        name: "confidence_cost_ratio",
        description: "Threshold for confidence-to-cost optimization",
        type: "float",
        defaultValue: "0.75",
        importance: "high"
      },
      {
        name: "evidence_quality_min",
        description: "Minimum quality threshold for evidence acceptance",
        type: "float",
        defaultValue: "0.6",
        importance: "medium"
      },
      {
        name: "integration_method",
        description: "Method for evidence integration",
        type: "string",
        defaultValue: "bayesian_update",
        importance: "high"
      }
    ],
    inputRequirements: [
      "Hypothesis set from generation stage",
      "Access to evidence sources and databases",
      "Quality assessment criteria",
      "Resource allocation parameters",
      "Time constraints and deadlines"
    ],
    outputDeliverables: [
      "Comprehensive evidence database",
      "Updated confidence measures",
      "Evidence quality assessments",
      "Source provenance tracking",
      "Integration methodology documentation"
    ],
    technicalDetails: [
      "Implements Bayesian evidence integration",
      "Uses multiple API endpoints for data gathering",
      "Supports various evidence types and formats",
      "Includes automated quality scoring",
      "Provides real-time confidence updates"
    ],
    bestPractices: [
      "Diversify evidence sources",
      "Maintain clear provenance records",
      "Use consistent quality metrics",
      "Balance speed with thoroughness",
      "Document all integration decisions"
    ],
    commonChallenges: [
      "Conflicting evidence from multiple sources",
      "Insufficient high-quality evidence",
      "Biased or incomplete data sources",
      "Time and resource constraints",
      "Difficulty in evidence quality assessment"
    ]
  },
  5: {
    id: 5,
    title: "Pruning & Merging",
    description: "Graph refinement through low-confidence edge removal and node merging",
    icon: CheckCircle,
    color: "red",
    detailedDescription: "The Pruning & Merging stage refines the knowledge graph by removing low-confidence connections and merging redundant or highly similar nodes. This optimization process improves graph clarity and computational efficiency while maintaining the essential knowledge structure.",
    objectives: [
      "Remove low-confidence edges and nodes",
      "Merge redundant or similar nodes",
      "Optimize graph structure for efficiency",
      "Maintain knowledge integrity during refinement",
      "Improve graph interpretability"
    ],
    parameters: [
      {
        name: "pruning_threshold",
        description: "Confidence threshold for edge/node removal",
        type: "float",
        defaultValue: "0.3",
        importance: "high"
      },
      {
        name: "similarity_threshold",
        description: "Threshold for node merging based on similarity",
        type: "float",
        defaultValue: "0.85",
        importance: "high"
      },
      {
        name: "preserve_core_nodes",
        description: "Always preserve high-importance nodes",
        type: "boolean",
        defaultValue: "true",
        importance: "medium"
      },
      {
        name: "merge_strategy",
        description: "Strategy for merging similar nodes",
        type: "string",
        defaultValue: "weighted_average",
        importance: "medium"
      }
    ],
    inputRequirements: [
      "Knowledge graph with evidence integration",
      "Confidence scores for all nodes and edges",
      "Node similarity metrics",
      "Core node importance rankings",
      "Graph optimization criteria"
    ],
    outputDeliverables: [
      "Refined and optimized knowledge graph",
      "Pruning and merging logs",
      "Updated confidence distributions",
      "Graph structure metrics",
      "Optimization performance report"
    ],
    technicalDetails: [
      "Uses graph clustering algorithms",
      "Implements confidence-based filtering",
      "Supports various similarity measures",
      "Includes graph connectivity preservation",
      "Provides optimization analytics"
    ],
    bestPractices: [
      "Preserve critical knowledge pathways",
      "Document all pruning decisions",
      "Validate merged node integrity",
      "Monitor graph connectivity",
      "Balance optimization with completeness"
    ],
    commonChallenges: [
      "Over-pruning leading to information loss",
      "Incorrect node merging decisions",
      "Maintaining graph connectivity",
      "Balancing efficiency with completeness",
      "Handling edge cases in merging"
    ]
  },
  6: {
    id: 6,
    title: "Subgraph Extraction",
    description: "High-confidence pathway identification for focused analysis",
    icon: Search,
    color: "indigo",
    detailedDescription: "The Subgraph Extraction stage identifies and extracts high-confidence pathways from the refined knowledge graph. This process focuses the analysis on the most reliable and relevant knowledge structures, enabling deeper investigation of key relationships and patterns.",
    objectives: [
      "Identify high-confidence knowledge pathways",
      "Extract relevant subgraphs for focused analysis",
      "Maintain pathway integrity and context",
      "Rank subgraphs by relevance and confidence",
      "Prepare subgraphs for composition stage"
    ],
    parameters: [
      {
        name: "pathway_confidence_min",
        description: "Minimum confidence for pathway inclusion",
        type: "float",
        defaultValue: "0.8",
        importance: "high"
      },
      {
        name: "subgraph_size_max",
        description: "Maximum size of extracted subgraphs",
        type: "integer",
        defaultValue: "50",
        importance: "medium"
      },
      {
        name: "pathway_depth_max",
        description: "Maximum depth of pathways to extract",
        type: "integer",
        defaultValue: "6",
        importance: "medium"
      },
      {
        name: "relevance_weighting",
        description: "Weight relevance vs confidence in extraction",
        type: "float",
        defaultValue: "0.6",
        importance: "high"
      }
    ],
    inputRequirements: [
      "Refined knowledge graph from pruning stage",
      "Confidence scores and relevance metrics",
      "Pathway extraction criteria",
      "Focus areas and priorities",
      "Subgraph size and complexity limits"
    ],
    outputDeliverables: [
      "High-confidence subgraph collection",
      "Pathway ranking and prioritization",
      "Subgraph metadata and context",
      "Extraction methodology documentation",
      "Focused analysis preparation"
    ],
    technicalDetails: [
      "Uses graph traversal algorithms",
      "Implements confidence-based filtering",
      "Supports multiple extraction strategies",
      "Includes pathway optimization",
      "Provides subgraph analytics"
    ],
    bestPractices: [
      "Maintain pathway coherence",
      "Balance depth with breadth",
      "Preserve important context",
      "Document extraction criteria",
      "Validate subgraph completeness"
    ],
    commonChallenges: [
      "Maintaining pathway context",
      "Balancing subgraph size and completeness",
      "Handling disconnected high-confidence nodes",
      "Ensuring representative extraction",
      "Managing computational complexity"
    ]
  },
  7: {
    id: 7,
    title: "Composition",
    description: "Synthesis of findings with numeric labels and Vancouver citations",
    icon: BookOpen,
    color: "pink",
    detailedDescription: "The Composition stage synthesizes the findings from the extracted subgraphs into a coherent, well-structured report. This stage emphasizes proper academic formatting, including Vancouver-style citations, numeric labeling, and comprehensive documentation of all findings and their supporting evidence.",
    objectives: [
      "Synthesize findings into coherent narrative",
      "Apply Vancouver citation style formatting",
      "Create numeric labeling system",
      "Structure findings hierarchically",
      "Ensure traceability to source evidence"
    ],
    parameters: [
      {
        name: "citation_style",
        description: "Citation formatting style",
        type: "string",
        defaultValue: "vancouver",
        importance: "high"
      },
      {
        name: "evidence_citation_required",
        description: "Require citations for all evidence",
        type: "boolean",
        defaultValue: "true",
        importance: "high"
      },
      {
        name: "structure_depth",
        description: "Hierarchical structure depth",
        type: "integer",
        defaultValue: "4",
        importance: "medium"
      },
      {
        name: "narrative_style",
        description: "Narrative composition style",
        type: "string",
        defaultValue: "academic",
        importance: "medium"
      }
    ],
    inputRequirements: [
      "High-confidence subgraphs from extraction",
      "Evidence database with source information",
      "Findings synthesis requirements",
      "Citation formatting specifications",
      "Report structure guidelines"
    ],
    outputDeliverables: [
      "Structured findings report",
      "Complete citation database",
      "Numeric labeling system",
      "Evidence traceability matrix",
      "Formatted academic output"
    ],
    technicalDetails: [
      "Implements Vancouver citation formatting",
      "Uses automatic reference management",
      "Supports multiple output formats",
      "Includes evidence linking",
      "Provides structure validation"
    ],
    bestPractices: [
      "Maintain clear logical flow",
      "Ensure complete citation coverage",
      "Use consistent formatting",
      "Preserve evidence traceability",
      "Follow academic writing standards"
    ],
    commonChallenges: [
      "Maintaining narrative coherence",
      "Proper citation formatting",
      "Balancing detail with readability",
      "Ensuring complete evidence coverage",
      "Managing complex cross-references"
    ]
  },
  8: {
    id: 8,
    title: "Reflection",
    description: "Self-audit for coverage, bias detection, and gap identification",
    icon: Brain,
    color: "teal",
    detailedDescription: "The Reflection stage performs a comprehensive self-audit of the entire analysis process. This critical evaluation phase identifies potential biases, coverage gaps, methodological limitations, and areas for improvement, ensuring the highest quality and reliability of the final output.",
    objectives: [
      "Conduct comprehensive self-audit",
      "Identify potential biases and limitations",
      "Detect coverage gaps and omissions",
      "Assess methodological rigor",
      "Provide recommendations for improvement"
    ],
    parameters: [
      {
        name: "bias_detection_sensitivity",
        description: "Sensitivity level for bias detection",
        type: "float",
        defaultValue: "0.7",
        importance: "high"
      },
      {
        name: "coverage_completeness_min",
        description: "Minimum coverage threshold for completeness",
        type: "float",
        defaultValue: "0.85",
        importance: "high"
      },
      {
        name: "methodological_rigor_check",
        description: "Enable methodological rigor assessment",
        type: "boolean",
        defaultValue: "true",
        importance: "high"
      },
      {
        name: "gap_identification_depth",
        description: "Depth of gap identification analysis",
        type: "integer",
        defaultValue: "3",
        importance: "medium"
      }
    ],
    inputRequirements: [
      "Complete analysis from composition stage",
      "Methodological documentation",
      "Evidence coverage metrics",
      "Bias detection criteria",
      "Quality assessment standards"
    ],
    outputDeliverables: [
      "Comprehensive self-audit report",
      "Bias detection results",
      "Coverage gap analysis",
      "Methodological assessment",
      "Improvement recommendations"
    ],
    technicalDetails: [
      "Uses automated bias detection algorithms",
      "Implements coverage analysis metrics",
      "Supports multiple assessment criteria",
      "Includes methodological validation",
      "Provides improvement suggestions"
    ],
    bestPractices: [
      "Apply rigorous self-evaluation",
      "Document all identified limitations",
      "Provide actionable recommendations",
      "Maintain objective assessment",
      "Consider multiple perspectives"
    ],
    commonChallenges: [
      "Detecting subtle biases",
      "Balancing criticism with usefulness",
      "Identifying all relevant gaps",
      "Maintaining objectivity",
      "Providing actionable improvements"
    ]
  },
  9: {
    id: 9,
    title: "Final Report",
    description: "Comprehensive output generation with transparency and traceability",
    icon: CheckCircle,
    color: "emerald",
    detailedDescription: "The Final Report stage generates the comprehensive output that integrates all findings, reflections, and recommendations into a complete, transparent, and traceable research report. This stage ensures that all work is properly documented and accessible for review, replication, and future research.",
    objectives: [
      "Generate comprehensive final report",
      "Ensure complete transparency and traceability",
      "Integrate all findings and recommendations",
      "Provide clear methodology documentation",
      "Create reproducible research output"
    ],
    parameters: [
      {
        name: "report_format",
        description: "Final report output format",
        type: "string",
        defaultValue: "comprehensive",
        importance: "high"
      },
      {
        name: "transparency_level",
        description: "Level of transparency and detail",
        type: "string",
        defaultValue: "full",
        importance: "high"
      },
      {
        name: "include_metadata",
        description: "Include all metadata in final report",
        type: "boolean",
        defaultValue: "true",
        importance: "medium"
      },
      {
        name: "reproducibility_documentation",
        description: "Include reproducibility documentation",
        type: "boolean",
        defaultValue: "true",
        importance: "high"
      }
    ],
    inputRequirements: [
      "All previous stage outputs",
      "Self-audit and reflection results",
      "Complete methodology documentation",
      "Evidence and citation database",
      "Quality assessment reports"
    ],
    outputDeliverables: [
      "Final comprehensive research report",
      "Complete methodology documentation",
      "Transparency and traceability matrix",
      "Reproducibility guidelines",
      "Executive summary and recommendations"
    ],
    technicalDetails: [
      "Integrates all stage outputs",
      "Generates multiple output formats",
      "Includes complete audit trail",
      "Supports various export options",
      "Provides quality assurance metrics"
    ],
    bestPractices: [
      "Ensure complete documentation",
      "Maintain full traceability",
      "Provide clear executive summary",
      "Include actionable recommendations",
      "Support reproducibility efforts"
    ],
    commonChallenges: [
      "Balancing completeness with readability",
      "Ensuring all components are integrated",
      "Maintaining consistency across sections",
      "Providing adequate detail without overwhelming",
      "Creating actionable deliverables"
    ]
  }
};

const StageDetail = () => {
  const { stageId } = useParams<{ stageId: string }>();
  const stageNumber = parseInt(stageId || '1');
  const stage = stageData[stageNumber];

  if (!stage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-red-600 mb-4">Stage Not Found</h1>
            <p className="text-lg text-muted-foreground mb-6">
              The requested stage does not exist. Please check the stage number.
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/guide">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Guide
                </Button>
              </Link>
              <Link to="/">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const Icon = stage.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <Link to="/guide">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Guide
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>
          <div className="flex gap-2">
            {stageNumber > 1 && (
              <Link to={`/stage/${stageNumber - 1}`}>
                <Button variant="outline" size="sm">
                  Previous Stage
                </Button>
              </Link>
            )}
            {stageNumber < 9 && (
              <Link to={`/stage/${stageNumber + 1}`}>
                <Button variant="outline" size="sm">
                  Next Stage
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-full bg-${stage.color}-100 border-2 border-${stage.color}-200 flex items-center justify-center`}>
              <Icon className={`h-8 w-8 text-${stage.color}-600`} />
            </div>
          </div>
          <Badge className="mb-4 gradient-bg text-white">Stage {stage.id}</Badge>
          <h1 className="text-4xl font-bold gradient-text mb-4">{stage.title}</h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {stage.description}
          </p>
        </div>

        {/* Overview */}
        <Card className="card-gradient mb-8">
          <CardHeader>
            <CardTitle className="gradient-text">Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {stage.detailedDescription}
            </p>
          </CardContent>
        </Card>

        {/* Objectives */}
        <Card className="card-gradient mb-8">
          <CardHeader>
            <CardTitle className="gradient-text flex items-center gap-2">
              <Target className="h-5 w-5" />
              Objectives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stage.objectives.map((objective, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{objective}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Parameters */}
        <Card className="card-gradient mb-8">
          <CardHeader>
            <CardTitle className="gradient-text flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stage.parameters.map((param, index) => (
                <div key={index} className="border rounded-lg p-4 bg-white/50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{param.name}</h4>
                    <div className="flex gap-2">
                      <Badge variant="outline">{param.type}</Badge>
                      <Badge 
                        variant={param.importance === 'high' ? 'default' : 'secondary'}
                        className={param.importance === 'high' ? 'bg-red-500' : ''}
                      >
                        {param.importance}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{param.description}</p>
                  <div className="text-sm">
                    <strong>Default:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{param.defaultValue}</code>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Input/Output */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="gradient-text flex items-center gap-2">
                <Database className="h-5 w-5" />
                Input Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stage.inputRequirements.map((req, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-muted-foreground">{req}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="gradient-text flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Output Deliverables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stage.outputDeliverables.map((output, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-muted-foreground">{output}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technical Details */}
        <Card className="card-gradient mb-8">
          <CardHeader>
            <CardTitle className="gradient-text flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Technical Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stage.technicalDetails.map((detail, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-muted-foreground">{detail}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Best Practices & Challenges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="gradient-text flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stage.bestPractices.map((practice, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{practice}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="gradient-text flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Common Challenges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stage.commonChallenges.map((challenge, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{challenge}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Footer */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Link to="/guide">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Guide
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>
          <div className="flex gap-2">
            {stageNumber > 1 && (
              <Link to={`/stage/${stageNumber - 1}`}>
                <Button variant="outline">
                  Previous Stage
                </Button>
              </Link>
            )}
            {stageNumber < 9 && (
              <Link to={`/stage/${stageNumber + 1}`}>
                <Button variant="outline">
                  Next Stage
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StageDetail;