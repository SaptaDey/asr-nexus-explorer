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

  const [showTokenModal, setShowTokenModal] = useState(!apiKeys.perplexity || !apiKeys.gemini);
  const [tempTokens, setTempTokens] = useState({ perplexity: '', gemini: '' });
  const [activeTab, setActiveTab] = useState('research');

  const handleTokenSave = () => {
    if (!tempTokens.perplexity || !tempTokens.gemini) {
      toast.error('Both API tokens are required');
      return;
    }

    updateApiKeys(tempTokens);
    setShowTokenModal(false);
    toast.success('✅ Tokens saved. ASR-GoT ready.');
  };

  const handleExportHTML = () => {
    if (!canExportHtml) {
      toast.error('Complete the analysis first');
      return;
    }
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>ASR-GoT Analysis Report</title>
          <style>
            body { font-family: system-ui; margin: 2rem; }
            .header { color: #7E5BEF; }
          </style>
        </head>
        <body>
          <h1 class="header">ASR-GoT Analysis Report</h1>
          <div>${finalReport}</div>
        </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asr-got-report.html';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('HTML report downloaded');
  };

  const handleExportSVG = () => {
    const svg = document.querySelector('.tree-scene svg');
    if (!svg) {
      toast.error('No tree visualization to export');
      return;
    }
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tree-visualization.svg';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('SVG exported');
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
              <Label htmlFor="perplexity-token">Perplexity API Key</Label>
              <Input
                id="perplexity-token"
                type="password"
                placeholder="pplx-..."
                value={tempTokens.perplexity}
                onChange={(e) => setTempTokens(prev => ({ ...prev, perplexity: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="gemini-token">Gemini API Key</Label>
              <Input
                id="gemini-token"
                type="password"
                placeholder="AIza..."
                value={tempTokens.gemini}
                onChange={(e) => setTempTokens(prev => ({ ...prev, gemini: e.target.value }))}
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
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">
            ASR-GoT Framework
          </h1>
          <p className="text-muted-foreground text-lg mb-4">
            Advanced Scientific Reasoning - Graph of Thoughts
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
                <div className="tree-scene">
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
                  <Button onClick={handleExportHTML} disabled={!canExportHtml} className="gradient-bg">
                    <FileText className="h-4 w-4 mr-2" />
                    Export HTML Report
                  </Button>
                  <Button onClick={handleExportSVG} className="gradient-bg">
                    <Download className="h-4 w-4 mr-2" />
                    Export Tree SVG
                  </Button>
                  <Button onClick={exportResults} disabled={!hasResults} className="gradient-bg">
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