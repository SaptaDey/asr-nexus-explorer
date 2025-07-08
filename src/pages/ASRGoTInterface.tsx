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
import { Brain, Database, FileText, Download, Zap, Settings, Network, Play, RotateCcw, Mail, ToggleLeft } from 'lucide-react';
import { TreeOfReasoningVisualization } from '@/components/asr-got/TreeOfReasoningVisualization';
import { ResearchInterface } from '@/components/asr-got/ResearchInterface';
import { EnhancedGraphVisualization } from '@/components/asr-got/EnhancedGraphVisualization';
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

  const [showTokenModal, setShowTokenModal] = useState(!apiKeys.gemini);
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
      <Dialog open={showTokenModal} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              API Configuration
            </DialogTitle>
            <DialogDescription>
              Enter your API tokens to start ASR-GoT analysis
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="gemini-token">Gemini API Key</Label>
              <Input
                id="gemini-token"
                type="password"
                placeholder="AIza..."
                value={tempToken}
                onChange={(e) => setTempToken(e.target.value)}
              />
            </div>
            <Button onClick={handleTokenSave} className="w-full gradient-bg">
              <Zap className="h-4 w-4 mr-2" />
              Initialize ASR-GoT
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Interface */}
      <div className="container mx-auto px-4 py-6">
        {/* Header with Logo and Hero */}
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <img 
              src="/img/logo.png" 
              alt="Scientific Reasoning Framework Logo" 
              className="h-24 w-24 object-contain"
            />
            <div className="text-center">
              <h1 className="text-4xl font-bold gradient-text leading-tight">
                Scientific Reasoning
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                Graph of Thoughts Framework
              </p>
            </div>
          </div>
          
          {/* Hero Banner */}
          <div className="relative mb-6 rounded-lg overflow-hidden">
            <img 
              src="/img/hero.png" 
              alt="ASR-GoT Research Framework" 
              className="w-full h-48 object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
              <div className="text-left pl-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Advanced Scientific Reasoning
                </h2>
                <p className="text-white/90 text-lg">
                  Graph of Thoughts Framework
                </p>
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
          
          {/* Processing Mode Toggle & Contact */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 bg-white/70 rounded-lg px-3 py-2">
              <ToggleLeft className="h-4 w-4" />
              <span className="text-sm font-medium">
                {isAutomatic ? 'Automatic' : 'Manual'} Mode
              </span>
              <Button
                onClick={toggleMode}
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
              >
                Switch to {isAutomatic ? 'Manual' : 'Automatic'}
              </Button>
            </div>
            <Link to="/contact">
              <Button variant="outline" size="sm" className="bg-white/70">
                <Mail className="h-4 w-4 mr-2" />
                Contact Us
              </Button>
            </Link>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/70">
            <TabsTrigger value="research" className="data-[state=active]:gradient-bg data-[state=active]:text-white">
              Research
            </TabsTrigger>
            <TabsTrigger value="tree" className="data-[state=active]:gradient-bg data-[state=active]:text-white">
              Tree View
            </TabsTrigger>
            <TabsTrigger value="graph" className="data-[state=active]:gradient-bg data-[state=active]:text-white">
              Graph View
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