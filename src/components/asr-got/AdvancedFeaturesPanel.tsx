/**
 * Advanced Features Panel for ASR-GoT Phase 4
 * Integrates code execution, citations, and bias detection
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Code, FileText, AlertTriangle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { CodeExecutionService, FigureGenerationRequest } from '@/services/CodeExecutionService';
import { CitationManager, Citation } from '@/services/CitationManager';
import { BiasDetectionService, BiasDetectionResult } from '@/services/BiasDetectionService';
import { ResearchContext, GraphData } from '@/types/asrGotTypes';

interface AdvancedFeaturesPanelProps {
  apiKeys: { gemini: string };
  researchContext: ResearchContext;
  graphData: GraphData;
  stageResults: string[];
}

export const AdvancedFeaturesPanel: React.FC<AdvancedFeaturesPanelProps> = ({
  apiKeys,
  researchContext,
  graphData,
  stageResults
}) => {
  const [codeExecutionService] = useState(() => new CodeExecutionService(apiKeys.gemini));
  const [citationManager] = useState(() => new CitationManager());
  const [biasDetectionService] = useState(() => new BiasDetectionService(apiKeys.gemini));
  
  const [pythonCode, setPythonCode] = useState('');
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [biasAnalysis, setBiasAnalysis] = useState<BiasDetectionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleCodeExecution = async () => {
    if (!pythonCode.trim()) {
      toast.error('Please enter Python code to execute');
      return;
    }

    setIsExecuting(true);
    try {
      const result = await codeExecutionService.executePythonCode(pythonCode);
      setExecutionResult(result);
      
      if (result.success) {
        toast.success('Code executed successfully');
      } else {
        toast.error('Code execution failed');
      }
    } catch (error) {
      toast.error('Execution error occurred');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleBiasAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await biasDetectionService.analyzeResearchBiases(
        researchContext,
        stageResults,
        graphData
      );
      setBiasAnalysis(result);
      toast.success(`Bias analysis complete - ${result.biases_detected.length} biases detected`);
    } catch (error) {
      toast.error('Bias analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateSampleFigure = async () => {
    const sampleData = [
      { x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 6 }, { x: 4, y: 8 }, { x: 5, y: 10 }
    ];

    const request: FigureGenerationRequest = {
      data: sampleData,
      chart_type: 'scatter',
      title: 'Sample Scientific Plot',
      x_label: 'Independent Variable',
      y_label: 'Dependent Variable',
      theme: 'scientific'
    };

    setIsExecuting(true);
    try {
      const result = await codeExecutionService.generateScientificFigure(request);
      setExecutionResult(result);
    } catch (error) {
      toast.error('Figure generation failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const addSampleCitation = () => {
    const sampleCitation: Citation = {
      id: '',
      type: 'journal',
      title: 'Advanced Scientific Research Using Graph of Thoughts',
      authors: ['Smith J', 'Johnson A', 'Williams B'],
      journal: 'Nature Scientific Reports',
      volume: '13',
      issue: '1',
      pages: '1-15',
      year: 2024,
      doi: '10.1038/s41598-024-12345-6'
    };

    const id = citationManager.addCitation(sampleCitation);
    toast.success(`Citation added: ${citationManager.getInTextCitation(id)}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Advanced Research Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="code" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="code" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Code & Figures
              </TabsTrigger>
              <TabsTrigger value="citations" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Citations
              </TabsTrigger>
              <TabsTrigger value="bias" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Bias Detection
              </TabsTrigger>
            </TabsList>

            {/* Code Execution Tab */}
            <TabsContent value="code" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Python Code Execution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Enter Python code for statistical analysis or figure generation..."
                    value={pythonCode}
                    onChange={(e) => setPythonCode(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                  />
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCodeExecution}
                      disabled={isExecuting || !apiKeys.gemini}
                    >
                      {isExecuting ? 'Executing...' : 'Execute Code'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={generateSampleFigure}
                      disabled={isExecuting}
                    >
                      Generate Sample Plot
                    </Button>
                  </div>

                  {executionResult && (
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          Execution Result
                          <Badge variant={executionResult.success ? "default" : "destructive"}>
                            {executionResult.success ? 'Success' : 'Failed'}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[200px]">
                          <pre className="text-xs bg-muted p-3 rounded">
                            {executionResult.output || executionResult.error}
                          </pre>
                        </ScrollArea>
                        <div className="text-xs text-muted-foreground mt-2">
                          Execution time: {executionResult.execution_time}ms
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Citations Tab */}
            <TabsContent value="citations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Vancouver Style Citations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button onClick={addSampleCitation}>
                      Add Sample Citation
                    </Button>
                    <Button variant="outline">
                      Import Citations
                    </Button>
                  </div>

                  <div className="border rounded p-4">
                    <h4 className="font-medium mb-2">Reference List</h4>
                    <ScrollArea className="h-[200px]">
                      <div className="text-sm whitespace-pre-wrap">
                        {citationManager.generateReferenceList()}
                      </div>
                    </ScrollArea>
                  </div>

                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      Citations follow Vancouver style formatting. Use {citationManager.getInTextCitation('sample')} for in-text references.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bias Detection Tab */}
            <TabsContent value="bias" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Research Bias Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={handleBiasAnalysis}
                    disabled={isAnalyzing || !apiKeys.gemini || stageResults.length === 0}
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Research Biases'}
                  </Button>

                  {biasAnalysis && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-destructive">
                            {biasAnalysis.biases_detected.length}
                          </div>
                          <div className="text-sm text-muted-foreground">Biases Detected</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-amber-600">
                            {biasAnalysis.knowledge_gaps.length}
                          </div>
                          <div className="text-sm text-muted-foreground">Knowledge Gaps</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-primary">
                            {Math.round(biasAnalysis.confidence_score * 100)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Confidence</div>
                        </div>
                      </div>

                      <ScrollArea className="h-[300px]">
                        <div className="space-y-3">
                          {biasAnalysis.biases_detected.map((bias, index) => (
                            <Alert key={index} className="border-destructive/20">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                <div className="font-medium">{bias.type.replace('_', ' ')}</div>
                                <div className="text-sm mt-1">{bias.description}</div>
                                <Badge variant="outline" className="mt-2">
                                  {bias.severity} severity
                                </Badge>
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {!apiKeys.gemini && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Gemini API key required for bias detection analysis.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};