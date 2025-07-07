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
import { Brain, Database, FileText, Download, Zap, Settings, Network, Play, RotateCcw } from 'lucide-react';
import { TreeOfReasoningVisualization } from '@/components/asr-got/TreeOfReasoningVisualization';
import { ResearchInterface } from '@/components/asr-got/ResearchInterface';
import { EnhancedGraphVisualization } from '@/components/asr-got/EnhancedGraphVisualization';
import { useASRGoT } from '@/hooks/useASRGoT';
import { toast } from 'sonner';

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
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>ASR-GoT Analysis Report</title>
          <meta charset="UTF-8">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; 
              margin: 2rem; 
              line-height: 1.6;
              max-width: 1200px;
              margin: 0 auto;
              padding: 2rem;
            }
            .header { 
              color: #7E5BEF; 
              border-bottom: 3px solid #7E5BEF;
              padding-bottom: 1rem;
              margin-bottom: 2rem;
            }
            .stage { 
              background: #f8f9fa; 
              padding: 1.5rem; 
              margin: 1rem 0; 
              border-left: 4px solid #7E5BEF;
              border-radius: 4px;
            }
            .metadata {
              background: #e9ecef;
              padding: 1rem;
              margin: 1rem 0;
              border-radius: 4px;
              font-family: monospace;
              font-size: 0.9em;
            }
            pre { white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1 class="header">ASR-GoT Analysis Report</h1>
          <div class="metadata">
            <strong>Generated:</strong> ${new Date().toISOString()}<br>
            <strong>Stages Completed:</strong> ${stageResults.length}/9<br>
            <strong>Research Topic:</strong> ${researchContext.topic || 'Not specified'}<br>
            <strong>Nodes:</strong> ${graphData.nodes.length}<br>
            <strong>Connections:</strong> ${graphData.edges.length}
          </div>
          <div class="stage">
            <pre>${reportContent}</pre>
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
          <div className="flex items-center justify-center gap-4 mb-6">
            <img 
              src="/img/logo.png" 
              alt="ASR-GoT Logo" 
              className="h-16 w-16 object-contain"
            />
            <h1 className="text-4xl font-bold gradient-text">
              ASR-GoT
            </h1>
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
          <div className="flex items-center justify-center gap-4">
            <Badge className="gradient-bg text-white">
              Stage {currentStage + 1}/9
            </Badge>
            <Progress value={stageProgress} className="w-32" />
            {isProcessing && <Badge variant="secondary">Processing...</Badge>}
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