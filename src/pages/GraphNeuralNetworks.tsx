import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Network, 
  Brain, 
  Target, 
  Zap, 
  Database, 
  CheckCircle, 
  ArrowLeft,
  Home,
  GitBranch,
  Layers,
  Share2,
  TrendingUp,
  Cpu,
  Link as LinkIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';

const GraphNeuralNetworks = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Soft Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50"></div>
      
      {/* Main Content */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          {/* Navigation */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2">
              <Link to="/">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 border-2 border-green-200 flex items-center justify-center">
                <Network className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-slate-800 mb-4">🔗 Graph Neural Networks</h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Advanced neural architectures designed to process graph-structured data for scientific reasoning and knowledge representation
            </p>
          </div>

          {/* GNN Overview */}
          <Card className="mb-8 bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200">
            <CardHeader>
              <CardTitle className="text-green-600 flex items-center gap-2">
                <Network className="h-5 w-5" />
                Graph Neural Networks Explained
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 leading-relaxed mb-6">
                Graph Neural Networks (GNNs) are a class of deep learning models specifically designed to work with 
                graph-structured data. They excel at capturing relationships, dependencies, and patterns in complex 
                networks, making them ideal for scientific reasoning tasks that involve interconnected knowledge.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <GitBranch className="h-6 w-6 text-green-600 mb-2" />
                  <h3 className="font-semibold text-green-800 mb-2">Node Representation</h3>
                  <p className="text-sm text-green-700">Learning rich representations for individual graph nodes</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <Share2 className="h-6 w-6 text-blue-600 mb-2" />
                  <h3 className="font-semibold text-blue-800 mb-2">Relationship Modeling</h3>
                  <p className="text-sm text-blue-700">Capturing complex relationships between connected entities</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <Layers className="h-6 w-6 text-purple-600 mb-2" />
                  <h3 className="font-semibold text-purple-800 mb-2">Multi-layer Processing</h3>
                  <p className="text-sm text-purple-700">Deep architectures for complex pattern recognition</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GNN Architecture */}
          <Card className="mb-8 bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200">
            <CardHeader>
              <CardTitle className="text-slate-800">GNN Architecture Components</CardTitle>
              <CardDescription>
                Key components that enable graph-based learning and reasoning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-blue-600" />
                    Core Components
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700">Message Passing Mechanisms</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700">Aggregation Functions</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700">Update Functions</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700">Attention Mechanisms</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    Advanced Features
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700">Graph Convolution Operations</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700">Pooling and Readout Functions</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700">Skip Connections</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700">Normalization Layers</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GNN Types */}
          <Card className="mb-8 bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200">
            <CardHeader>
              <CardTitle className="text-green-600 flex items-center gap-2">
                <Layers className="h-5 w-5" />
                GNN Architectures in Our Framework
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: "Graph Convolutional Networks (GCN)", desc: "Standard convolution operations on graphs", color: "blue" },
                  { name: "Graph Attention Networks (GAT)", desc: "Attention-based node representation learning", color: "purple" },
                  { name: "GraphSAGE", desc: "Scalable inductive graph learning", color: "green" },
                  { name: "Graph Transformer", desc: "Transformer architecture for graphs", color: "orange" },
                  { name: "Relational GCN", desc: "Handling different edge types and relations", color: "red" },
                  { name: "Temporal GNN", desc: "Dynamic graph learning over time", color: "indigo" }
                ].map((gnn, index) => (
                  <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-800 text-sm mb-2">{gnn.name}</h3>
                    <p className="text-xs text-green-700">{gnn.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Applications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200">
              <CardHeader>
                <CardTitle className="text-green-600 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Scientific Applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Knowledge graph completion and reasoning</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Scientific literature analysis</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Molecular property prediction</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Social network analysis</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Protein structure prediction</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200">
              <CardHeader>
                <CardTitle className="text-blue-600 flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Technical Capabilities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Large-scale graph processing</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Dynamic graph adaptation</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Multi-relational reasoning</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Inductive learning capabilities</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Uncertainty quantification</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Advantages */}
          <Card className="mb-8 bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200">
            <CardHeader>
              <CardTitle className="text-emerald-600 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Advantages in Scientific Reasoning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <LinkIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2">Relationship Capture</h3>
                  <p className="text-sm text-slate-600">Excel at modeling complex interdependencies</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2">Scalability</h3>
                  <p className="text-sm text-slate-600">Handle large-scale knowledge graphs efficiently</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Brain className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2">Interpretability</h3>
                  <p className="text-sm text-slate-600">Provide explainable reasoning paths</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2">Flexibility</h3>
                  <p className="text-sm text-slate-600">Adapt to various graph structures and domains</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Stack */}
          <Card className="mb-8 bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200">
            <CardHeader>
              <CardTitle className="text-slate-800">Implementation Stack</CardTitle>
              <CardDescription>
                Technologies and frameworks powering our GNN implementation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  "PyTorch Geometric",
                  "DGL (Deep Graph Library)", 
                  "NetworkX",
                  "CUDA Acceleration",
                  "Graph Attention Mechanisms",
                  "Multi-GPU Training",
                  "Distributed Computing",
                  "Real-time Inference"
                ].map((tech, index) => (
                  <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <Network className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-slate-700">{tech}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Explore Graph Neural Networks</h2>
            <p className="text-slate-600 mb-6">
              Experience the power of graph-based AI for scientific reasoning and knowledge discovery
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/">
                <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white">
                  <Network className="h-5 w-5 mr-2" />
                  Try Graph Analysis
                </Button>
              </Link>
              <Link to="/guide">
                <Button size="lg" variant="outline">
                  <GitBranch className="h-4 w-4 mr-2" />
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphNeuralNetworks;