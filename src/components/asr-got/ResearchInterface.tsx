import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Brain, Search, FileText, Network, Loader2, CheckCircle, Sparkles, Rocket, Zap, BarChart3 } from 'lucide-react';
import { ResearchHeroIllustration, AnalysisProgressIllustration, StageNavigationIllustration, CompletionCelebrationIllustration } from '@/components/ui/EngagingIllustrations';
import { GraphData, APICredentials } from '@/types/asrGotTypes';
import { VisualAnalytics } from './VisualAnalytics';
import { useEnhancedVisualAnalytics } from './EnhancedVisualAnalytics';
import { toast } from 'sonner';
interface ResearchInterfaceProps {
  currentStage: number;
  graphData: GraphData;
  onExecuteStage: (stageIndex: number, input?: any) => void;
  isProcessing: boolean;
  stageResults?: string[];
  researchContext?: {
    field: string;
    topic: string;
    objectives: string[];
    hypotheses: string[];
  };
  apiKeys?: APICredentials;
  processingMode?: 'automatic' | 'manual';
  onShowApiModal?: () => void;
  onSwitchToExport?: () => void;
}
export const ResearchInterface: React.FC<ResearchInterfaceProps> = ({
  currentStage,
  graphData,
  onExecuteStage,
  isProcessing,
  stageResults = [],
  researchContext,
  apiKeys = {
    gemini: ''
  },
  processingMode = 'manual',
  onShowApiModal,
  onSwitchToExport
}) => {
  const [researchQuery, setResearchQuery] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [activeTab, setActiveTab] = useState('input');

  // Enhanced visual analytics for comprehensive chart generation
  const {
    figures: analyticsFigures,
    isGenerating: analyticsGenerating,
    exportFigureAsDataURL
  } = useEnhancedVisualAnalytics(graphData, currentStage, apiKeys.gemini, {
    topic: researchContext?.topic || '',
    field: researchContext?.field || '',
    objectives: researchContext?.objectives || [],
    hypotheses: researchContext?.hypotheses || [],
    constraints: [],
    biases_detected: [],
    knowledge_gaps: [],
    auto_generated: false
  });

  // Auto-switch to results tab when research completes
  useEffect(() => {
    const isCompleted = currentStage >= 8 && stageResults.length >= 9 && 
                      stageResults.filter(result => result && result.trim()).length >= 9;
    
    if (isCompleted && activeTab === 'progress') {
      // Small delay to let users see the completion animation
      setTimeout(() => {
        setActiveTab('results');
        toast.success('🎉 Research analysis complete! Switched to Results tab.');
      }, 2000);
    }
  }, [currentStage, stageResults, activeTab]);

  const handleStartResearch = async () => {
    if (!taskDescription.trim()) {
      toast.error('Please provide a research question or topic');
      return;
    }
    if (!apiKeys?.gemini) {
      toast.info('API key required to start research');
      onShowApiModal?.();
      return;
    }

    // Execute first stage with auto mode enabled if in automatic mode
    const enableAutoMode = processingMode === 'automatic';
    if (enableAutoMode) {
      toast.success('🤖 Automatic mode: All stages will execute sequentially');
    }
    await onExecuteStage(0, taskDescription, enableAutoMode);
    setActiveTab('progress');
  };
  const handleContinueToNext = async () => {
    if (!apiKeys?.gemini) {
      toast.info('API key required to continue research');
      onShowApiModal?.();
      return;
    }
    await onExecuteStage(currentStage);
  };
  const stageNames = ['Initialization', 'Decomposition', 'Hypothesis/Planning', 'Evidence Integration', 'Pruning/Merging', 'Subgraph Extraction', 'Composition', 'Reflection', 'Final Analysis'];
  const renderStageInput = () => {
    // Check if all stages are completed
    const isCompleted = currentStage >= 8 && stageResults.length >= 9 && 
                       stageResults.filter(result => result && result.trim()).length >= 9;
    
    if (isCompleted) {
      return <div className="space-y-6">
          {/* Completion Celebration */}
          <div className="text-center space-y-4">
            <CompletionCelebrationIllustration className="mx-auto" width={280} height={180} />
            <div>
              <h3 className="text-2xl font-bold text-green-700 mb-2">
                🎉 Research Analysis Complete!
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed max-w-md mx-auto mb-4">
                All 9 stages of scientific analysis have been completed successfully. Your comprehensive research report is ready!
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Analysis completed • Report generated • Results available for export</span>
              </div>
            </div>
          </div>
        </div>;
    }
    
    if (currentStage === 0 && !stageResults[0]) {
      return <div className="space-y-6">
          {/* Hero Illustration Section */}
          <div className="text-center space-y-4">
            <ResearchHeroIllustration className="mx-auto" width={350} height={240} />
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                🧠 AI-Powered Scientific Research
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed max-w-md mx-auto">
                Transform your research questions into comprehensive scientific analysis using our advanced 9-stage AI framework
              </p>
            </div>
          </div>
          
          {/* Research Input */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="task-description" className="text-lg font-semibold">Research Question or Topic</Label>
              <Textarea id="task-description" placeholder="Enter your scientific research question or topic of interest. The AI will automatically analyze the field, generate hypotheses, and conduct comprehensive research..." value={taskDescription} onChange={e => setTaskDescription(e.target.value)} rows={4} className="mt-2" />
            </div>
            <Button onClick={handleStartResearch} disabled={isProcessing} className="w-full gradient-bg bg-cyan-800 hover:bg-cyan-700">
              {isProcessing ? <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  AI is analyzing and researching...
                </> : <>
                  <Rocket className="h-4 w-4 mr-2" />
                  Start AI-Powered Research
                </>}
            </Button>
          </div>
        </div>;
    }
    return <div className="space-y-6">
        <div className="text-center space-y-4">
          {/* Stage Navigation Illustration */}
          <StageNavigationIllustration className="mx-auto" width={320} height={80} />
          
          <div className="mb-4">
            <Badge className="bg-purple-100 text-purple-800 text-lg px-4 py-2">
              Stage {currentStage + 1}: {stageNames[currentStage]}
            </Badge>
          </div>
          
          {/* Analysis Progress Illustration when processing */}
          {isProcessing && (
            <div className="flex justify-center">
              <AnalysisProgressIllustration className="" width={200} height={140} />
            </div>
          )}
          
          <p className="text-muted-foreground mb-4">
            {processingMode === 'automatic' ? 'All stages will execute automatically in sequence' : 'Click to manually proceed with the next stage of analysis'}
          </p>
          {processingMode === 'manual' && <Button onClick={handleContinueToNext} disabled={isProcessing || currentStage >= 9} className="gradient-bg">
              {isProcessing ? <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  AI Processing...
                </> : <>
                  <Zap className="h-4 w-4 mr-2" />
                  Continue AI Analysis
                </>}
            </Button>}
          {processingMode === 'automatic' && <Badge className="gradient-bg text-white text-base px-4 py-2">
              🤖 Automatic execution in progress...
            </Badge>}
        </div>
      </div>;
  };
  return <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Tab Navigation - Always Visible */}
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="input" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Input & Setup
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Analysis
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-6">
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="gradient-text flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Research Configuration
              </CardTitle>
              <CardDescription>
                Enter your research topic and let AI guide the complete analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderStageInput()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="gradient-text flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Analysis Progress
              </CardTitle>
              <CardDescription>
                Real-time monitoring of the 9-stage scientific research pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Overall Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.min(stageResults.length, 9)}/9 stages completed
                  </span>
                </div>
                <Progress value={(Math.min(stageResults.length, 9) / 9) * 100} className="h-2" />
              </div>

              {/* Stage-by-Stage Progress */}
              <div className="space-y-4">
                {stageNames.map((stageName, index) => {
                  const isCompleted = stageResults[index] && stageResults[index].trim();
                  const isCurrent = index === currentStage && isProcessing;
                  const isPending = index > currentStage || (!isCompleted && !isCurrent);
                  
                  return (
                    <div key={index} className={`p-4 rounded-lg border-2 transition-all ${
                      isCompleted ? 'border-green-200 bg-green-50' :
                      isCurrent ? 'border-blue-200 bg-blue-50 animate-pulse' :
                      'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          isCompleted ? 'bg-green-500 text-white' :
                          isCurrent ? 'bg-blue-500 text-white' :
                          'bg-gray-300 text-gray-600'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : isCurrent ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">
                            Stage {index + 1}: {stageName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {isCompleted ? 'Completed successfully' :
                             isCurrent ? 'Currently processing...' :
                             'Pending'}
                          </p>
                        </div>
                        <Badge variant={
                          isCompleted ? 'default' :
                          isCurrent ? 'secondary' :
                          'outline'
                        }>
                          {isCompleted ? 'Done' :
                           isCurrent ? 'Processing' :
                           'Waiting'}
                        </Badge>
                      </div>
                      
                      {/* Show result preview for completed stages */}
                      {isCompleted && stageResults[index] && (
                        <div className="mt-3 pt-3 border-t">
                          <details className="cursor-pointer">
                            <summary className="text-sm font-medium text-blue-600 hover:text-blue-800">
                              View stage result preview
                            </summary>
                            <div className="mt-2 p-3 bg-white rounded border text-sm">
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                className="prose prose-sm max-w-none"
                              >
                                {stageResults[index].substring(0, 300)}
                                {stageResults[index].length > 300 ? '...' : ''}
                              </ReactMarkdown>
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Processing Status */}
              {isProcessing && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="font-semibold">AI is actively researching...</span>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    This comprehensive analysis typically takes 20-25 minutes. 
                    The AI is conducting thorough research, analysis, and generating insights.
                  </p>
                </div>
              )}

              {/* Process Complete */}
              {currentStage >= 8 && stageResults.length >= 9 && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-bold text-green-800">Analysis Complete!</h3>
                  <p className="text-sm text-green-600">
                    All 9 stages completed successfully. Check the Results tab for your comprehensive report.
                  </p>
                  <Button 
                    onClick={() => setActiveTab('results')} 
                    className="mt-3 bg-green-600 hover:bg-green-700 text-white"
                  >
                    View Results
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="gradient-text flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Comprehensive Research Results
              </CardTitle>
              <CardDescription>
                AI-generated insights and comprehensive scientific analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stageResults.length > 0 ? <div className="space-y-6">
                  {/* Research Summary */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
                    <h3 className="font-bold gradient-text text-lg mb-4">Research Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Research Field</div>
                        <div className="font-medium">{researchContext?.field || 'General Science'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Stages Completed</div>
                        <div className="font-medium">{stageResults.length} / 9</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Knowledge Nodes</div>
                        <div className="font-medium">{graphData.nodes.length}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Reasoning Connections</div>
                        <div className="font-medium">{graphData.edges.length}</div>
                      </div>
                    </div>
                  </div>

                  {/* Node and Edge Analysis */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold gradient-text mb-2">Knowledge Types</h4>
                      <div className="space-y-1">
                        {Array.from(new Set(graphData.nodes.map(n => n.type))).map(type => <Badge key={type} variant="secondary" className="mr-1">
                            {type} ({graphData.nodes.filter(n => n.type === type).length})
                          </Badge>)}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold gradient-text mb-2">Relationship Types</h4>
                      <div className="space-y-1">
                        {Array.from(new Set(graphData.edges.map(e => e.type))).map(type => <Badge key={type} variant="outline" className="mr-1">
                            {type} ({graphData.edges.filter(e => e.type === type).length})
                          </Badge>)}
                      </div>
                    </div>
                  </div>

                  {/* Export Button */}
                  <Button onClick={() => {
                const reportContent = stageResults.length > 0 ? stageResults.join('\n\n---\n\n') : 'No analysis completed yet';
                const jsonData = {
                  metadata: {
                    exported: new Date().toISOString(),
                    version: '1.0.0',
                    framework: 'ASR-GoT'
                  },
                  researchContext: researchContext || {},
                  stages: stageResults.map((result, index) => ({
                    stage: index + 1,
                    result: result || ''
                  })),
                  graph: {
                    nodes: graphData.nodes.length,
                    edges: graphData.edges.length,
                    nodeTypes: Array.from(new Set(graphData.nodes.map(n => n.type))),
                    edgeTypes: Array.from(new Set(graphData.edges.map(e => e.type)))
                  },
                  completeAnalysis: reportContent
                };
                const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
                  type: 'application/json'
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `asr-got-complete-analysis-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast.success('Complete analysis exported successfully');
              }} className="w-full gradient-bg">
                    <FileText className="h-4 w-4 mr-2" />
                    Export Complete Analysis
                  </Button>
                </div> : <div className="text-center py-12">
                  <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No Results Yet</h3>
                  <p className="text-muted-foreground">
                    Start the research process to generate comprehensive AI-powered insights.
                  </p>
                </div>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>;
};