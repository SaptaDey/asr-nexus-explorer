/**
 * ASR-GoT Interface - Integrated Implementation
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Brain, Database, FileText, Download, Zap, Settings, Network, Play, RotateCcw, Mail, ToggleLeft, BookOpen } from 'lucide-react';
import { TreeOfReasoningVisualization } from '@/components/asr-got/TreeOfReasoningVisualization';
import { ResearchInterface } from '@/components/asr-got/ResearchInterface';
import { EnhancedGraphVisualization } from '@/components/asr-got/EnhancedGraphVisualization';
import { DeveloperMode } from '@/components/asr-got/DeveloperMode';
import { useASRGoT } from '@/hooks/useASRGoT';
import { useProcessingMode } from '@/hooks/asr-got/useProcessingMode';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const ASRGoTInterface: React.FC = () => {
  const {
    currentStage,
    graphData,
    parameters,
    stageProgress,
    isProcessing,
    apiKeys,
    stageResults,
    researchContext,
    finalReport,
    executeStage,
    resetFramework,
    setParameters,
    updateApiKeys,
    exportResults,
    isComplete,
    hasResults,
    canExportHtml
  } = useASRGoT();

  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [activeTab, setActiveTab] = useState('research');
  
  const { mode, toggleMode, isAutomatic } = useProcessingMode('manual');

  const handleTokenSave = () => {
    if (!tempToken) {
      toast.error('Gemini API token is required');
      return;
    }

    updateApiKeys({ gemini: tempToken });
    setShowTokenModal(false);
    toast.success('✅ Token saved. ASR-GoT ready.');
  };

  const handleExportHTML = () => {
    if (!hasResults) {
      toast.error('No results to export yet - run some analysis stages first');
      return;
    }
    
    const reportContent = stageResults.length > 0 ? stageResults.join('\n\n---\n\n') : 'No analysis completed yet';
    
    // Generate embedded charts and figures
    const embedCharts = () => {
      const charts = [];
      
      // Node distribution chart
      const nodeTypes = graphData.nodes.reduce((acc, node) => {
        acc[node.type] = (acc[node.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const nodeChartData = Object.entries(nodeTypes).map(([type, count]) => 
        `<div class="chart-bar" style="width: ${(count / graphData.nodes.length) * 100}%;">${type}: ${count}</div>`
      ).join('');
      
      charts.push(`
        <div class="chart-container">
          <h3>Knowledge Node Distribution</h3>
          <div class="chart">${nodeChartData}</div>
        </div>
      `);
      
      // Confidence analysis
      const confidences = graphData.nodes
        .filter(n => n.confidence && n.confidence.length > 0)
        .map(n => n.confidence.reduce((a, b) => a + b, 0) / n.confidence.length);
      
      if (confidences.length > 0) {
        const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
        charts.push(`
          <div class="stat-container">
            <h3>Analysis Confidence</h3>
            <div class="confidence-meter">
              <div class="confidence-bar" style="width: ${avgConfidence * 100}%;">
                ${(avgConfidence * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        `);
      }
      
      return charts.join('');
    };
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>Scientific Reasoning Analysis Report</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
              margin: 0; 
              padding: 0;
              line-height: 1.6;
              color: #333;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
            }
            .container { 
              max-width: 1200px; 
              margin: 0 auto; 
              background: white; 
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.1);
              overflow: hidden;
              margin: 40px auto;
            }
            .header { 
              background: linear-gradient(135deg, #7E5BEF 0%, #00D2FF 100%);
              color: white; 
              padding: 60px 40px;
              text-align: center;
              position: relative;
            }
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="white" opacity="0.1"><animate attributeName="opacity" values="0.1;0.3;0.1" dur="3s" repeatCount="indefinite"/></circle><circle cx="80" cy="40" r="1.5" fill="white" opacity="0.1"><animate attributeName="opacity" values="0.1;0.4;0.1" dur="2s" repeatCount="indefinite"/></circle><circle cx="40" cy="80" r="1" fill="white" opacity="0.1"><animate attributeName="opacity" values="0.1;0.5;0.1" dur="4s" repeatCount="indefinite"/></circle></svg>');
            }
            .header h1 { 
              margin: 0; 
              font-size: 3rem; 
              font-weight: 700; 
              position: relative;
              z-index: 1;
            }
            .header p { 
              font-size: 1.3rem; 
              margin: 20px 0 0; 
              opacity: 0.9;
              position: relative;
              z-index: 1;
            }
            .content { 
              padding: 40px; 
            }
            .executive-summary {
              background: linear-gradient(135deg, #f6f8ff 0%, #e8f2ff 100%);
              border: 1px solid #e1e8ff;
              border-radius: 15px;
              padding: 30px;
              margin: 30px 0;
              position: relative;
            }
            .executive-summary::before {
              content: '📊';
              position: absolute;
              top: 15px;
              right: 20px;
              font-size: 2rem;
            }
            .metadata { 
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              padding: 25px;
              margin: 25px 0;
              border-radius: 15px;
              border-left: 6px solid #7E5BEF;
              box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            }
            .metadata-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              margin-top: 15px;
            }
            .metadata-item {
              background: white;
              padding: 15px;
              border-radius: 10px;
              text-align: center;
              border: 1px solid #e1e5e9;
            }
            .metadata-value {
              font-size: 1.8rem;
              font-weight: bold;
              color: #7E5BEF;
              margin-bottom: 5px;
            }
            .metadata-label {
              font-size: 0.9rem;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .stage { 
              background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
              border: 1px solid #e1e5e9;
              border-radius: 15px;
              padding: 25px; 
              margin: 25px 0; 
              border-left: 6px solid #00D2FF;
              box-shadow: 0 4px 15px rgba(0,0,0,0.05);
              position: relative;
            }
            .stage h2 {
              color: #7E5BEF;
              margin-top: 0;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .stage h2::before {
              content: '🔬';
              font-size: 1.2em;
            }
            .chart-container {
              background: white;
              border-radius: 12px;
              padding: 20px;
              margin: 20px 0;
              box-shadow: 0 2px 10px rgba(0,0,0,0.05);
              border: 1px solid #f0f0f0;
            }
            .chart {
              margin-top: 15px;
            }
            .chart-bar {
              background: linear-gradient(90deg, #7E5BEF, #00D2FF);
              color: white;
              padding: 10px;
              margin: 5px 0;
              border-radius: 6px;
              font-weight: 500;
              min-width: 100px;
              box-shadow: 0 2px 8px rgba(126, 91, 239, 0.2);
            }
            .stat-container {
              background: white;
              border-radius: 12px;
              padding: 20px;
              margin: 20px 0;
              box-shadow: 0 2px 10px rgba(0,0,0,0.05);
              border: 1px solid #f0f0f0;
            }
            .confidence-meter {
              background: #f0f2f5;
              border-radius: 10px;
              height: 40px;
              position: relative;
              margin-top: 15px;
            }
            .confidence-bar {
              background: linear-gradient(90deg, #00D2FF, #14B8A6);
              height: 100%;
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              transition: width 0.5s ease;
            }
            .footer {
              background: #f8f9fa;
              padding: 30px;
              text-align: center;
              color: #666;
              border-top: 1px solid #e1e5e9;
            }
            .creator-info {
              background: linear-gradient(135deg, #e8f2ff 0%, #f6f8ff 100%);
              border: 1px solid #e1e8ff;
              border-radius: 15px;
              padding: 25px;
              margin: 25px 0;
            }
            .creator-info h3 {
              color: #7E5BEF;
              margin-top: 0;
            }
            pre { 
              white-space: pre-wrap; 
              background: #f8f9fa;
              padding: 20px;
              border-radius: 10px;
              border: 1px solid #e1e5e9;
              font-size: 0.95rem;
              line-height: 1.5;
            }
            h1, h2, h3 { color: #333; }
            h2 { 
              color: #7E5BEF; 
              border-bottom: 2px solid #00D2FF;
              padding-bottom: 10px;
            }
            @media print {
              body { background: white; }
              .container { box-shadow: none; margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <header class="header">
              <h1>Scientific Reasoning Analysis</h1>
              <p>Advanced AI-Powered Research Framework Report</p>
              <div style="font-size: 1rem; margin-top: 20px; opacity: 0.9;">
                Generated on ${new Date().toLocaleDateString()} • 
                Research Topic: ${researchContext.topic || 'Not specified'}
              </div>
            </header>

            <div class="content">
              <div class="executive-summary">
                <h2>Executive Summary</h2>
                <p>This comprehensive analysis was generated using the Scientific Reasoning framework, implementing 
                Graph of Thoughts methodology for systematic scientific inquiry and evidence synthesis.</p>
              </div>

              <div class="metadata">
                <h3 style="margin-top: 0; color: #7E5BEF;">Analysis Overview</h3>
                <div class="metadata-grid">
                  <div class="metadata-item">
                    <div class="metadata-value">${stageResults.length}</div>
                    <div class="metadata-label">Stages Completed</div>
                  </div>
                  <div class="metadata-item">
                    <div class="metadata-value">${graphData.nodes.length}</div>
                    <div class="metadata-label">Knowledge Nodes</div>
                  </div>
                  <div class="metadata-item">
                    <div class="metadata-value">${graphData.edges.length}</div>
                    <div class="metadata-label">Connections</div>
                  </div>
                  <div class="metadata-item">
                    <div class="metadata-value">${new Date().toLocaleDateString()}</div>
                    <div class="metadata-label">Generated</div>
                  </div>
                </div>
              </div>

              ${embedCharts()}

              <div class="stage">
                <h2>Detailed Analysis Results</h2>
                <pre>${reportContent}</pre>
              </div>

              <div class="creator-info">
                <h3>Framework Creator</h3>
                <p><strong>Dr. Sapta Dey</strong> - Biomedical Researcher & AI Developer</p>
                <p>Department of Dermatology, Medical University of Graz, Austria</p>
                <p><strong>Specializations:</strong> Computational Immunology, AI-Powered Research, Biomedical Data Science</p>
                <p><strong>Contact:</strong> saptaswa.dey@medunigraz.at | 
                <a href="https://github.com/SaptaDey">GitHub</a> | 
                <a href="https://orcid.org/0000-0001-7532-7858">ORCID</a></p>
              </div>
            </div>

            <footer class="footer">
              <p><strong>Scientific Reasoning Framework</strong> - Graph of Thoughts Implementation</p>
              <p>Advanced AI methodology for systematic scientific research and evidence synthesis</p>
              <p style="font-size: 0.9rem; margin-top: 15px;">
                This report combines automated reasoning, evidence integration, and bias detection 
                for comprehensive scientific analysis.
              </p>
            </footer>
          </div>
        </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asr-got-report-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('HTML report downloaded successfully');
  };

  const handleExportSVG = () => {
    // Look for SVG in the tree visualization area
    const treeContainer = document.querySelector('[data-testid="tree-scene"], .tree-scene');
    const svg = treeContainer?.querySelector('svg') || document.querySelector('svg');
    
    if (!svg) {
      toast.error('No visualization found to export. Try switching to Tree View tab first.');
      return;
    }
    
    try {
      // Clone the SVG to avoid modifying the original
      const svgClone = svg.cloneNode(true) as SVGElement;
      
      // Set proper dimensions and viewBox
      svgClone.setAttribute('width', '800');
      svgClone.setAttribute('height', '600');
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      
      const svgData = new XMLSerializer().serializeToString(svgClone);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `asr-got-tree-${new Date().toISOString().split('T')[0]}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Tree visualization exported as SVG');
    } catch (error) {
      console.error('SVG export error:', error);
      toast.error('Failed to export SVG - please try again');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* API Token Modal */}
      <Dialog open={showTokenModal} onOpenChange={setShowTokenModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              API Configuration Required
            </DialogTitle>
            <DialogDescription>
              To start ASR-GoT analysis, you need a Gemini API key. Don't have one? We'll show you how to get it!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* API Key Input */}
            <div>
              <Label htmlFor="gemini-token">Gemini API Key</Label>
              <Input
                id="gemini-token"
                type="password"
                placeholder="AIza..."
                value={tempToken}
                onChange={(e) => setTempToken(e.target.value)}
                className="mt-1"
              />
            </div>
            
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">🔑 How to Get Your Gemini API Key:</h4>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Visit <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">Google AI Studio</a></li>
                <li>Sign in with your Google account</li>
                <li>Click "Create API Key" button</li>
                <li>Select your Google Cloud project (or create a new one)</li>
                <li>Copy the generated API key and paste it above</li>
              </ol>
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                <strong>Note:</strong> The API key is stored locally in your browser and never sent to our servers.
              </div>
            </div>
            
            {/* Buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowTokenModal(false)} 
                variant="outline" 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleTokenSave} className="flex-1 gradient-bg">
                <Zap className="h-4 w-4 mr-2" />
                Save & Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Interface */}
      <div className="container mx-auto px-4 py-6">
        {/* Enhanced Header with Large Logo and Hero */}
        <div className="text-center mb-8">
          {/* Large Logo Section with Full Width Background */}
          <div className="relative mb-8 rounded-2xl overflow-hidden shadow-xl">
            {/* Full-width logo background with fade */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
              style={{
                backgroundImage: 'url("/img/logo.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            ></div>
            
            {/* Gradient overlay for text visibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/95"></div>
            
            {/* Content */}
            <div className="relative z-10 bg-gradient-to-br from-white/90 to-purple-50/80 p-8 border border-white/20 backdrop-blur-sm">
              <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
                {/* Logo with proper sizing */}
                <div className="flex-shrink-0">
                  <img 
                    src="/img/logo.png" 
                    alt="Scientific Reasoning Framework Logo" 
                    className="h-32 w-32 lg:h-40 lg:w-40 object-contain drop-shadow-lg"
                  />
                </div>
                
                {/* Enhanced Title Section */}
                <div className="text-center lg:text-left">
                  <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-3" style={{ color: '#1a365d' }}>
                    Scientific Reasoning
                  </h1>
                  <p className="text-xl lg:text-2xl mb-4 font-medium" style={{ color: '#4a5568' }}>
                    Graph of Thoughts Framework
                  </p>
                  <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-4">
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">AI-Powered</span>
                    <span className="px-3 py-1 bg-secondary/10 text-secondary-foreground rounded-full text-sm font-medium">Research Framework</span>
                    <span className="px-3 py-1 bg-accent/10 text-accent-foreground rounded-full text-sm font-medium">Graph Neural Networks</span>
                  </div>
                  <div className="flex flex-col lg:flex-row items-center gap-4">
                    <p className="max-w-2xl" style={{ color: '#2d3748' }}>
                      🚀 Next-Generation AI Reasoning Framework leveraging graph structures to transform scientific research methodologies
                    </p>
                    <Link to="/guide">
                      <Button variant="outline" className="bg-white/80 hover:bg-white">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Learn How It Works
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-muted-foreground text-lg mb-2">
            🚀 Next-Generation AI Reasoning Framework for Scientific Research
          </p>
          <p className="text-muted-foreground text-base mb-4">
            Leveraging graph structures to transform how AI systems approach scientific reasoning
          </p>
          <div className="flex items-center justify-center gap-4 mb-4">
            <Badge className="gradient-bg text-white">
              Stage {currentStage + 1}/9
            </Badge>
            <Progress value={stageProgress} className="w-32" />
            {isProcessing && <Badge variant="secondary">Processing...</Badge>}
          </div>
          
          {/* Enhanced Processing Mode Toggle & Contact */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-6">
            {/* Animated Processing Mode Toggle */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
              <div className="relative flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20 shadow-lg">
                <div className={`transition-all duration-300 ${isAutomatic ? 'text-green-600' : 'text-blue-600'}`}>
                  {isAutomatic ? 
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold">AUTO MODE</span>
                    </div> :
                    <div className="flex items-center gap-2">
                      <ToggleLeft className="h-4 w-4" />
                      <span className="text-sm font-semibold">MANUAL MODE</span>
                    </div>
                  }
                </div>
                <Button
                  onClick={toggleMode}
                  className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                    isAutomatic 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                  } text-white shadow-lg`}
                  size="sm"
                >
                  <span className="relative z-10">
                    Switch to {isAutomatic ? 'Manual' : 'Automatic'}
                  </span>
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </div>
            </div>
            
            {/* Contact Us Button */}
            <Link to="/contact">
              <Button 
                size="lg" 
                className="text-white shadow-md hover:shadow-lg transition-all duration-300"
                style={{ 
                  backgroundColor: '#009dff',
                  '--hover-bg': '#0085d9'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0085d9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#009dff'}
              >
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  <span className="font-semibold">Contact Us</span>
                </div>
              </Button>
            </Link>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/70">
            <TabsTrigger value="research" className="data-[state=active]:gradient-bg data-[state=active]:text-white">
              Research
            </TabsTrigger>
            <TabsTrigger value="tree" className="data-[state=active]:gradient-bg data-[state=active]:text-white">
              Tree View
            </TabsTrigger>
            <TabsTrigger value="graph" className="data-[state=active]:gradient-bg data-[state=active]:text-white">
              Graph View
            </TabsTrigger>
            <TabsTrigger value="developer" className="data-[state=active]:gradient-bg data-[state=active]:text-white">
              Developer
            </TabsTrigger>
            <TabsTrigger value="export" className="data-[state=active]:gradient-bg data-[state=active]:text-white">
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="research">
            <ResearchInterface
              currentStage={currentStage}
              graphData={graphData}
              onExecuteStage={executeStage}
              isProcessing={isProcessing}
              stageResults={stageResults}
              researchContext={researchContext}
              apiKeys={apiKeys}
              processingMode={mode}
              onShowApiModal={() => setShowTokenModal(true)}
            />
          </TabsContent>

          <TabsContent value="tree">
            <Card className="card-gradient">
              <CardHeader>
                <CardTitle className="gradient-text flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Tree of Reasoning Visualization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="tree-scene" data-testid="tree-scene">
                  <TreeOfReasoningVisualization 
                    graphData={graphData}
                    currentStage={currentStage}
                    isProcessing={isProcessing}
                    onStageSelect={(stage) => executeStage(stage)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="graph">
            <Card className="card-gradient">
              <CardHeader>
                <CardTitle className="gradient-text flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Enhanced Graph Visualization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedGraphVisualization graphData={graphData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="developer">
            <DeveloperMode 
              parameters={parameters}
              onParametersChange={setParameters}
            />
          </TabsContent>

          <TabsContent value="export">
            <Card className="card-gradient">
              <CardHeader>
                <CardTitle className="gradient-text flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={handleExportHTML} 
                    disabled={!hasResults} 
                    className="gradient-bg disabled:opacity-50"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export HTML Report
                  </Button>
                  <Button 
                    onClick={handleExportSVG} 
                    className="gradient-bg"
                    disabled={graphData.nodes.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Tree SVG
                  </Button>
                  <Button 
                    onClick={() => exportResults('json')} 
                    disabled={!hasResults} 
                    className="gradient-bg disabled:opacity-50"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Export JSON Data
                  </Button>
                  <Button onClick={resetFramework} variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Framework
                  </Button>
                </div>
                
                {isComplete && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-800 mb-2">Analysis Complete!</h3>
                    <p className="text-sm text-green-700">
                      Your comprehensive ASR-GoT analysis is ready for export.
                    </p>
                  </div>
                )}
                
                {!hasResults && (
                  <div className="text-center py-8">
                    <Play className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">
                      Start your research analysis to generate exportable results.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ASRGoTInterface;