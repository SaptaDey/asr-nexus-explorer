
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { ASRGoTParameters } from '@/hooks/useASRGoT';

interface ParameterConfigProps {
  parameters: ASRGoTParameters;
  onUpdateParameters?: (parameters: ASRGoTParameters) => void;
}

const allParameters: ASRGoTParameters = {
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
  },
  'P1.9': {
    parameter_id: 'P1.9',
    type: 'Parameter - Network Structure',
    source_description: 'Methodology for Hyperedge Representation',
    value: 'Enable hyperedges for complex multi-way interactions between nodes',
    notes: 'Models complex multi-way interactions',
    enabled: true
  },
  'P1.10': {
    parameter_id: 'P1.10',
    type: 'Parameter - Edge Classification',
    source_description: 'Mandatory Edge Type Classification',
    value: 'Classify edges with mandatory edge_type metadata: Correlative, Supportive, Contradictory, Causal, Temporal',
    notes: 'Enhances semantic precision, incorporating causality and temporal patterns',
    enabled: true
  },
  'P1.11': {
    parameter_id: 'P1.11',
    type: 'Parameter - Formalism Definition',
    source_description: 'Formal Mathematical Definition of ASR-GoT State',
    value: 'Define ASR-GoT graph state Gₜ = (Vₜ, Eₜ∪Eₕₜ, Lₜ, T, Cₜ, Mₜ, Iₜ)',
    notes: 'Provides underlying mathematical structure',
    enabled: true
  },
  'P1.12': {
    parameter_id: 'P1.12',
    type: 'Parameter - Metadata Schema',
    source_description: 'Mandatory Detailed Metadata Schema',
    value: 'Comprehensive metadata for nodes and edges including provenance, confidence, epistemic status',
    notes: 'Ensures comprehensive record-keeping',
    enabled: true
  },
  'P1.13': {
    parameter_id: 'P1.13',
    type: 'Parameter - Hypothesis Competition',
    source_description: 'Methodology for Handling Competing Hypotheses',
    value: 'Identify mutually exclusive hypotheses and evaluate using complexity and predictive power',
    notes: 'Formalizes comparison with enhanced metrics',
    enabled: true
  },
  'P1.14': {
    parameter_id: 'P1.14',
    type: 'Parameter - Uncertainty Propagation',
    source_description: 'Probabilistic Uncertainty Representation and Propagation',
    value: 'Represent confidence components using probability distributions with Bayesian updates',
    notes: 'Implements sophisticated belief updating',
    enabled: true
  },
  'P1.15': {
    parameter_id: 'P1.15',
    type: 'Parameter - Knowledge Gap Detection',
    source_description: 'Methodology for Identifying and Representing Knowledge Gaps',
    value: 'Create Placeholder_Gap nodes and flag high-variance or low-connectivity areas',
    notes: 'Proactively identifies high-impact areas needing investigation',
    enabled: true
  },
  'P1.16': {
    parameter_id: 'P1.16',
    type: 'Parameter - Falsifiability Check',
    source_description: 'Requirement for Hypothesis Falsifiability Criteria',
    value: 'Require falsification_criteria metadata for all Hypothesis nodes',
    notes: 'Enforces scientific methodology',
    enabled: true
  },
  'P1.17': {
    parameter_id: 'P1.17',
    type: 'Parameter - Bias Detection',
    source_description: 'Protocol for Active Bias Detection and Mitigation',
    value: 'Include Potential Biases dimension and populate bias_flags metadata',
    notes: 'Integrates checks for cognitive and systemic biases',
    enabled: true
  },
  'P1.18': {
    parameter_id: 'P1.18',
    type: 'Parameter - Temporal Dynamics',
    source_description: 'Handling of Temporal Aspects',
    value: 'Utilize timestamp metadata and apply temporal decay to evidence impact',
    notes: 'Accounts for evolving knowledge and dynamic relationships',
    enabled: true
  },
  'P1.19': {
    parameter_id: 'P1.19',
    type: 'Parameter - Intervention Planning',
    source_description: 'Capability for Modeling and Evaluating Potential Interventions',
    value: 'Generate prospective subgraphs and estimate Expected Value of Information',
    notes: 'Supports strategic research planning with impact focus',
    enabled: true
  },
  'P1.20': {
    parameter_id: 'P1.20',
    type: 'Parameter - Hierarchical Abstraction',
    source_description: 'Mechanism for Multi-Level Conceptual Abstraction',
    value: 'Define abstraction levels allowing nodes to encapsulate subgraphs',
    notes: 'Manages complexity through hierarchical organization',
    enabled: true
  },
  'P1.21': {
    parameter_id: 'P1.21',
    type: 'Parameter - Computational Feasibility',
    source_description: 'Constraint Layer for Computational Resource Management',
    value: 'Estimate computational cost and switch to approximations when needed',
    notes: 'Ensures practical execution within resource constraints',
    enabled: true
  },
  'P1.22': {
    parameter_id: 'P1.22',
    type: 'Parameter - Network Structure',
    source_description: 'Enhancement for Dynamic Graph Topology',
    value: 'Enable graph restructuring with topology metrics and dynamic edge weighting',
    notes: 'Allows graph structure to evolve organically',
    enabled: true
  },
  'P1.23': {
    parameter_id: 'P1.23',
    type: 'Parameter - Network Structure',
    source_description: 'Enhancement for Multi-Layer Network Representation',
    value: 'Define distinct interconnected layers representing different scales or disciplines',
    notes: 'Formalizes representation of multi-faceted problems',
    enabled: true
  },
  'P1.24': {
    parameter_id: 'P1.24',
    type: 'Parameter - Edge Classification',
    source_description: 'Enhancement for Formal Causal Inference',
    value: 'Extend edge types with causal semantics and counterfactual reasoning',
    notes: 'Adds rigorous causal reasoning capabilities',
    enabled: true
  },
  'P1.25': {
    parameter_id: 'P1.25',
    type: 'Parameter - Edge Classification',
    source_description: 'Enhancement for Temporal Relationship Patterns',
    value: 'Support temporal patterns including cycles, delays, and sequences',
    notes: 'Models dynamic processes explicitly',
    enabled: true
  },
  'P1.26': {
    parameter_id: 'P1.26',
    type: 'Parameter - Evidence Evaluation',
    source_description: 'Enhancement for Statistical Power Analysis',
    value: 'Add power analysis metrics and sample size adequacy assessment',
    notes: 'Adds statistical rigor to evidence assessment',
    enabled: true
  },
  'P1.27': {
    parameter_id: 'P1.27',
    type: 'Parameter - Mathematical Formalism',
    source_description: 'Enhancement for Information Theoretical Measures',
    value: 'Incorporate entropy, KL divergence, mutual information, and MDL principles',
    notes: 'Provides quantitative measures of uncertainty and complexity',
    enabled: true
  },
  'P1.28': {
    parameter_id: 'P1.28',
    type: 'Parameter - Prioritization',
    source_description: 'Enhancement for Research Impact Estimation',
    value: 'Develop metrics for theoretical significance and practical utility',
    notes: 'Guides focus towards significant research contributions',
    enabled: true
  },
  'P1.29': {
    parameter_id: 'P1.29',
    type: 'Parameter - Collaboration Support',
    source_description: 'Enhancement for Collaborative Research Optimization',
    value: 'Support node attribution and expertise-based task allocation',
    notes: 'Facilitates use in team-based research',
    enabled: true
  }
};

export const ParameterConfig: React.FC<ParameterConfigProps> = ({ 
  parameters, 
  onUpdateParameters 
}) => {
  const [localParameters, setLocalParameters] = React.useState(allParameters);

  const handleParameterToggle = (paramId: string, enabled: boolean) => {
    setLocalParameters(prev => ({
      ...prev,
      [paramId]: { ...prev[paramId], enabled }
    }));
  };

  const handleParameterUpdate = (paramId: string, field: string, value: string) => {
    setLocalParameters(prev => ({
      ...prev,
      [paramId]: { ...prev[paramId], [field]: value }
    }));
  };

  const resetToDefaults = () => {
    setLocalParameters(allParameters);
  };

  const saveParameters = () => {
    onUpdateParameters?.(localParameters);
  };

  const getParameterTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'Parameter - Framework': 'bg-purple-100 text-purple-800 border-purple-200',
      'Parameter - Initialization': 'bg-blue-100 text-blue-800 border-blue-200',
      'Parameter - Decomposition': 'bg-green-100 text-green-800 border-green-200',
      'Parameter - Hypothesis': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Parameter - Evidence Integration': 'bg-red-100 text-red-800 border-red-200',
      'Parameter - Refinement & Confidence': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Parameter - Output & Extraction': 'bg-pink-100 text-pink-800 border-pink-200',
      'Parameter - Verification': 'bg-gray-100 text-gray-800 border-gray-200',
      'Parameter - Cross-Domain Linking': 'bg-teal-100 text-teal-800 border-teal-200',
      'Parameter - Network Structure': 'bg-orange-100 text-orange-800 border-orange-200',
      'Parameter - Edge Classification': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'Parameter - Formalism Definition': 'bg-violet-100 text-violet-800 border-violet-200',
      'Parameter - Metadata Schema': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Parameter - Hypothesis Competition': 'bg-lime-100 text-lime-800 border-lime-200',
      'Parameter - Uncertainty Propagation': 'bg-sky-100 text-sky-800 border-sky-200',
      'Parameter - Knowledge Gap Detection': 'bg-rose-100 text-rose-800 border-rose-200',
      'Parameter - Falsifiability Check': 'bg-amber-100 text-amber-800 border-amber-200',
      'Parameter - Bias Detection': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
      'Parameter - Temporal Dynamics': 'bg-slate-100 text-slate-800 border-slate-200',
      'Parameter - Intervention Planning': 'bg-stone-100 text-stone-800 border-stone-200',
      'Parameter - Hierarchical Abstraction': 'bg-zinc-100 text-zinc-800 border-zinc-200',
      'Parameter - Computational Feasibility': 'bg-neutral-100 text-neutral-800 border-neutral-200',
      'Parameter - Prioritization': 'bg-red-100 text-red-800 border-red-200',
      'Parameter - Collaboration Support': 'bg-blue-100 text-blue-800 border-blue-200',
      'Parameter - Mathematical Formalism': 'bg-purple-100 text-purple-800 border-purple-200',
      'Parameter - Evidence Evaluation': 'bg-green-100 text-green-800 border-green-200'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold gradient-text">Parameter Configuration</h2>
            <p className="text-muted-foreground">Configure ASR-GoT Framework Parameters (P1.0 - P1.29)</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={resetToDefaults} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={saveParameters} size="sm" className="gradient-bg">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="card-gradient">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {Object.values(localParameters).filter(p => p.enabled).length}
            </div>
            <div className="text-sm text-muted-foreground">Enabled Parameters</div>
          </CardContent>
        </Card>
        <Card className="card-gradient">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-pink-600">
              {Object.keys(localParameters).length}
            </div>
            <div className="text-sm text-muted-foreground">Total Parameters</div>
          </CardContent>
        </Card>
        <Card className="card-gradient">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {new Set(Object.values(localParameters).map(p => p.type)).size}
            </div>
            <div className="text-sm text-muted-foreground">Parameter Types</div>
          </CardContent>
        </Card>
      </div>

      {/* Parameter Cards */}
      <div className="grid gap-4">
        {Object.entries(localParameters).map(([key, param]) => (
          <Card key={key} className={`card-gradient transition-all duration-300 hover:shadow-lg ${param.enabled ? 'ring-2 ring-purple-200' : 'opacity-75'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={getParameterTypeColor(param.type)}>
                    {param.parameter_id}
                  </Badge>
                  <CardTitle className="text-lg">{param.type}</CardTitle>
                </div>
                <Switch
                  checked={param.enabled}
                  onCheckedChange={(enabled) => handleParameterToggle(key, enabled)}
                />
              </div>
              <CardDescription className="text-sm">
                {param.source_description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor={`${key}-value`} className="text-sm font-medium">
                  Parameter Value
                </Label>
                <Textarea
                  id={`${key}-value`}
                  value={param.value}
                  onChange={(e) => handleParameterUpdate(key, 'value', e.target.value)}
                  className="mt-1"
                  rows={2}
                  disabled={!param.enabled}
                />
              </div>
              
              <div>
                <Label htmlFor={`${key}-notes`} className="text-xs font-medium text-muted-foreground">
                  Notes
                </Label>
                <Input
                  id={`${key}-notes`}
                  value={param.notes}
                  onChange={(e) => handleParameterUpdate(key, 'notes', e.target.value)}
                  className="mt-1 text-xs"
                  disabled={!param.enabled}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
