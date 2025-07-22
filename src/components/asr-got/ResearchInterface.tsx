import React, { useState } from 'react';
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
import { GraphData } from '@/hooks/useASRGoT';
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
  apiKeys?: {
    gemini: string;
  };
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
    if (currentStage === 0 && !stageResults[0]) {
      return <div className="space-y-4">
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
        </div>;
    }
    return <div className="space-y-4">
        <div className="text-center">
          <div className="mb-4">
            <Badge className="bg-purple-100 text-purple-800 text-lg px-4 py-2">
              Stage {currentStage + 1}: {stageNames[currentStage]}
            </Badge>
          </div>
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