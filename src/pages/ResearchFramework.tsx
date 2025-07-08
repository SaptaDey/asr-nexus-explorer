import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  FileText, 
  Target, 
  Database, 
  Search, 
  CheckCircle, 
  ArrowLeft,
  Home,
  BookOpen,
  Microscope,
  BarChart3,
  Users,
  Clock,
  Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ResearchFramework = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Soft Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50"></div>
      
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
              <div className="w-16 h-16 rounded-full bg-purple-100 border-2 border-purple-200 flex items-center justify-center">
                <Microscope className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-slate-800 mb-4">🧠 Research Framework</h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              A comprehensive, systematic approach to scientific research that combines traditional methodologies with cutting-edge AI technologies
            </p>
          </div>

          {/* Framework Overview */}
          <Card className="mb-8 bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200">
            <CardHeader>
              <CardTitle className="text-purple-600 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Framework Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 leading-relaxed mb-6">
                Our research framework provides a structured, reproducible approach to scientific inquiry. It integrates 
                traditional research methodologies with modern AI capabilities to ensure rigorous, efficient, and 
                comprehensive research processes.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <Target className="h-6 w-6 text-blue-600 mb-2" />
                  <h3 className="font-semibold text-blue-800 mb-2">Systematic Methodology</h3>
                  <p className="text-sm text-blue-700">Structured 9-stage process ensuring comprehensive coverage</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <Shield className="h-6 w-6 text-purple-600 mb-2" />
                  <h3 className="font-semibold text-purple-800 mb-2">Quality Assurance</h3>
                  <p className="text-sm text-purple-700">Built-in validation and bias detection mechanisms</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <BarChart3 className="h-6 w-6 text-green-600 mb-2" />
                  <h3 className="font-semibold text-green-800 mb-2">Evidence-Based</h3>
                  <p className="text-sm text-green-700">Rigorous evidence collection and synthesis processes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Research Stages */}
          <Card className="mb-8 bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200">
            <CardHeader>
              <CardTitle className="text-slate-800">9-Stage Research Process</CardTitle>
              <CardDescription>
                A comprehensive methodology covering all aspects of scientific research
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { stage: 1, title: "Initialization", desc: "Problem definition and framework setup", color: "blue" },
                  { stage: 2, title: "Decomposition", desc: "Breaking down complex research questions", color: "purple" },
                  { stage: 3, title: "Hypothesis Generation", desc: "Creating testable research hypotheses", color: "green" },
                  { stage: 4, title: "Evidence Integration", desc: "Systematic evidence collection and analysis", color: "orange" },
                  { stage: 5, title: "Pruning & Merging", desc: "Refining and optimizing knowledge structures", color: "red" },
                  { stage: 6, title: "Subgraph Extraction", desc: "Identifying key relationships and patterns", color: "indigo" },
                  { stage: 7, title: "Composition", desc: "Synthesizing findings into coherent results", color: "pink" },
                  { stage: 8, title: "Reflection", desc: "Self-audit and bias detection", color: "teal" },
                  { stage: 9, title: "Final Report", desc: "Comprehensive documentation and findings", color: "emerald" }
                ].map((item, index) => (
                  <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border">
                    <div className="flex items-start gap-3">
                      <Badge className="bg-purple-500 text-white">Stage {item.stage}</Badge>
                      <div>
                        <h3 className="font-semibold text-slate-800 text-sm mb-1">{item.title}</h3>
                        <p className="text-xs text-slate-600">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Key Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200">
              <CardHeader>
                <CardTitle className="text-purple-600 flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Research Capabilities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Systematic literature reviews</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Meta-analysis and evidence synthesis</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Hypothesis generation and testing</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Interdisciplinary research integration</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Knowledge gap identification</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200">
              <CardHeader>
                <CardTitle className="text-blue-600 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Quality Assurance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Automated bias detection</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Reproducibility validation</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Methodological rigor assessment</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Comprehensive peer review</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Evidence quality scoring</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Benefits */}
          <Card className="mb-8 bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200">
            <CardHeader>
              <CardTitle className="text-green-600 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Framework Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2">Time Efficiency</h3>
                  <p className="text-sm text-slate-600">Streamlined process reduces research time by 80%</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2">Higher Accuracy</h3>
                  <p className="text-sm text-slate-600">Systematic approach ensures comprehensive coverage</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2">Collaboration</h3>
                  <p className="text-sm text-slate-600">Facilitates interdisciplinary research teams</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2">Reproducibility</h3>
                  <p className="text-sm text-slate-600">Standardized process ensures repeatable results</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Applications */}
          <Card className="mb-8 bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200">
            <CardHeader>
              <CardTitle className="text-slate-800">Research Applications</CardTitle>
              <CardDescription>
                Versatile framework applicable across scientific disciplines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  "Biomedical Research",
                  "Clinical Studies", 
                  "Environmental Science",
                  "Social Sciences",
                  "Technology Research",
                  "Policy Analysis",
                  "Market Research",
                  "Educational Studies",
                  "Behavioral Science"
                ].map((application, index) => (
                  <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2">
                      <Microscope className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-slate-700">{application}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Start Your Research Journey</h2>
            <p className="text-slate-600 mb-6">
              Apply our proven research framework to your next scientific investigation
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/">
                <Button size="lg" className="bg-purple-500 hover:bg-purple-600 text-white">
                  <Microscope className="h-5 w-5 mr-2" />
                  Begin Research
                </Button>
              </Link>
              <Link to="/guide">
                <Button size="lg" variant="outline">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Learn Methodology
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchFramework;