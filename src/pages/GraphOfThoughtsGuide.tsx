import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Brain, Network, Zap, Database, Search, BookOpen, ArrowRight, Target, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const GraphOfThoughtsGuide = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-4">Graph of Thoughts Framework</h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Understanding the revolutionary AI reasoning methodology that powers Scientific Reasoning framework
          </p>
        </div>

        {/* Introduction */}
        <Card className="card-gradient mb-8">
          <CardHeader>
            <CardTitle className="gradient-text flex items-center gap-2">
              <Brain className="h-5 w-5" />
              What is Graph of Thoughts?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Graph of Thoughts (GoT) is an advanced AI reasoning paradigm that structures knowledge and reasoning processes 
              as interconnected graphs rather than linear chains. Unlike traditional approaches, GoT enables sophisticated 
              parallel processing, evidence integration, and multi-dimensional analysis.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <Network className="h-6 w-6 text-blue-600 mb-2" />
                <h3 className="font-semibold text-blue-800">Graph Structure</h3>
                <p className="text-sm text-blue-700">Knowledge represented as interconnected nodes and edges</p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <Zap className="h-6 w-6 text-purple-600 mb-2" />
                <h3 className="font-semibold text-purple-800">Parallel Processing</h3>
                <p className="text-sm text-purple-700">Multiple reasoning paths explored simultaneously</p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <Target className="h-6 w-6 text-green-600 mb-2" />
                <h3 className="font-semibold text-green-800">Evidence Integration</h3>
                <p className="text-sm text-green-700">Systematic synthesis of multi-source evidence</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Framework Stages */}
        <Card className="card-gradient mb-8">
          <CardHeader>
            <CardTitle className="gradient-text">9-Stage ASR-GoT Process</CardTitle>
            <CardDescription>
              The Scientific Reasoning framework implements a rigorous 9-stage process for comprehensive analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                {
                  stage: 1,
                  title: "Initialization",
                  description: "Root node creation with task understanding and confidence vectors",
                  icon: Target,
                  color: "blue"
                },
                {
                  stage: 2,
                  title: "Decomposition", 
                  description: "Multi-dimensional analysis: scope, objectives, constraints, data needs",
                  icon: Network,
                  color: "purple"
                },
                {
                  stage: 3,
                  title: "Hypothesis Generation",
                  description: "3-5 hypotheses per dimension with explicit plans and metadata",
                  icon: Brain,
                  color: "green"
                },
                {
                  stage: 4,
                  title: "Evidence Integration",
                  description: "Iterative evidence gathering based on confidence-to-cost ratios",
                  icon: Database,
                  color: "orange"
                },
                {
                  stage: 5,
                  title: "Pruning & Merging",
                  description: "Graph refinement through low-confidence edge removal and node merging",
                  icon: CheckCircle,
                  color: "red"
                },
                {
                  stage: 6,
                  title: "Subgraph Extraction",
                  description: "High-confidence pathway identification for focused analysis",
                  icon: Search,
                  color: "indigo"
                },
                {
                  stage: 7,
                  title: "Composition",
                  description: "Synthesis of findings with numeric labels and Vancouver citations",
                  icon: BookOpen,
                  color: "pink"
                },
                {
                  stage: 8,
                  title: "Reflection",
                  description: "Self-audit for coverage, bias detection, and gap identification",
                  icon: Brain,
                  color: "teal"
                },
                {
                  stage: 9,
                  title: "Final Report",
                  description: "Comprehensive output generation with transparency and traceability",
                  icon: CheckCircle,
                  color: "emerald"
                }
              ].map((stage, index) => {
                const Icon = stage.icon;
                return (
                  <div key={stage.stage} className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-${stage.color}-100 border-2 border-${stage.color}-200 flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 text-${stage.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="gradient-bg text-white">Stage {stage.stage}</Badge>
                        <h3 className="font-semibold text-lg">{stage.title}</h3>
                      </div>
                      <p className="text-muted-foreground">{stage.description}</p>
                    </div>
                    {index < 8 && <ArrowRight className="h-4 w-4 text-muted-foreground mt-4" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="gradient-text">Advanced Capabilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Multi-dimensional confidence vectors</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Bayesian uncertainty propagation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Automatic bias detection</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Cross-domain knowledge linking</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Evidence quality assessment</span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="gradient-text">Technical Foundation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Directed multigraph representation</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Hyperedge support for complex relationships</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-orange-600" />
                <span className="text-sm">Comprehensive metadata tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">API orchestration (Gemini + Perplexity)</span>
              </div>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-green-600" />
                <span className="text-sm">Vancouver citation integration</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications */}
        <Card className="card-gradient mb-8">
          <CardHeader>
            <CardTitle className="gradient-text">Research Applications</CardTitle>
            <CardDescription>
              Graph of Thoughts methodology excels in complex research scenarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                "Systematic literature reviews",
                "Meta-analysis and evidence synthesis", 
                "Interdisciplinary research integration",
                "Hypothesis generation and testing",
                "Knowledge gap identification",
                "Bias detection and mitigation",
                "Causal relationship analysis",
                "Research methodology optimization",
                "Scientific reproducibility assessment"
              ].map((application, index) => (
                <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{application}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold gradient-text mb-4">Ready to Experience Graph of Thoughts?</h2>
          <p className="text-muted-foreground mb-6">
            Start your research journey with the most advanced AI reasoning framework available
          </p>
          <Link to="/">
            <Button size="lg" className="gradient-bg text-white shadow-xl hover:shadow-2xl">
              <Zap className="h-5 w-5 mr-2" />
              Launch Scientific Reasoning Framework
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GraphOfThoughtsGuide;