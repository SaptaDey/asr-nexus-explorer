import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Zap, 
  Target, 
  TrendingUp, 
  Search, 
  CheckCircle, 
  ArrowLeft,
  Home,
  Cpu,
  Network,
  BarChart3,
  Lightbulb
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AIPowered = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Soft Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50"></div>
      
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
              <div className="w-16 h-16 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center">
                <Brain className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-slate-800 mb-4">🤖 AI-Powered Intelligence</h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Discover how our advanced artificial intelligence capabilities drive scientific reasoning and automated research processes
            </p>
          </div>

          {/* Overview */}
          <Card className="mb-8 bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200">
            <CardHeader>
              <CardTitle className="text-blue-600 flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Advanced AI Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 leading-relaxed mb-6">
                Our AI-powered system leverages cutting-edge machine learning algorithms and natural language processing 
                to automate complex scientific reasoning tasks. The system combines multiple AI technologies to provide 
                intelligent analysis, hypothesis generation, and evidence synthesis.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <Brain className="h-6 w-6 text-blue-600 mb-2" />
                  <h3 className="font-semibold text-blue-800 mb-2">Natural Language Processing</h3>
                  <p className="text-sm text-blue-700">Advanced NLP for understanding and processing scientific literature</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <Network className="h-6 w-6 text-purple-600 mb-2" />
                  <h3 className="font-semibold text-purple-800 mb-2">Knowledge Graph AI</h3>
                  <p className="text-sm text-purple-700">AI-driven knowledge graph construction and reasoning</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <Lightbulb className="h-6 w-6 text-green-600 mb-2" />
                  <h3 className="font-semibold text-green-800 mb-2">Intelligent Hypothesis Generation</h3>
                  <p className="text-sm text-green-700">Automated generation of testable research hypotheses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200">
              <CardHeader>
                <CardTitle className="text-blue-600 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Automated Research Processing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Automatic literature review and analysis</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Real-time evidence synthesis and integration</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Intelligent bias detection and mitigation</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Automated report generation with citations</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200">
              <CardHeader>
                <CardTitle className="text-purple-600 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Intelligent Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Statistical significance assessment</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Pattern recognition in research data</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Predictive modeling for research outcomes</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Quality assessment and validation</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Technologies */}
          <Card className="mb-8 bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200">
            <CardHeader>
              <CardTitle className="text-slate-800">AI Technologies Stack</CardTitle>
              <CardDescription>
                The advanced AI technologies powering our scientific reasoning framework
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  "Large Language Models (LLMs)",
                  "Graph Neural Networks", 
                  "Transformer Architectures",
                  "Attention Mechanisms",
                  "Reinforcement Learning",
                  "Bayesian Networks",
                  "Neural Information Retrieval",
                  "Automated Reasoning Systems"
                ].map((tech, index) => (
                  <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-slate-700">{tech}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card className="mb-8 bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200">
            <CardHeader>
              <CardTitle className="text-green-600 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Benefits & Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2">95% Faster Research</h3>
                  <p className="text-sm text-slate-600">Dramatically reduce research time through intelligent automation</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Search className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2">Enhanced Accuracy</h3>
                  <p className="text-sm text-slate-600">AI-powered validation ensures higher research quality and reliability</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Lightbulb className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2">Novel Insights</h3>
                  <p className="text-sm text-slate-600">Discover connections and patterns invisible to traditional methods</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Experience AI-Powered Research</h2>
            <p className="text-slate-600 mb-6">
              Start leveraging advanced AI capabilities for your scientific research today
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/">
                <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white">
                  <Zap className="h-5 w-5 mr-2" />
                  Try AI-Powered Research
                </Button>
              </Link>
              <Link to="/guide">
                <Button size="lg" variant="outline">
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

export default AIPowered;