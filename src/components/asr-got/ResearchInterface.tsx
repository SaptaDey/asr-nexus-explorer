
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
import { 
  Play, 
  Brain, 
  Search, 
  FileText, 
  Network,
  Loader2,
  CheckCircle,
  Sparkles,
  Rocket,
  Zap
} from 'lucide-react';
import { GraphData } from '@/hooks/useASRGoT';
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
}

export const ResearchInterface: React.FC<ResearchInterfaceProps> = ({
  currentStage,
  graphData,
  onExecuteStage,
  isProcessing,
  stageResults = [],
  researchContext
}) => {
  const [researchQuery, setResearchQuery] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [activeTab, setActiveTab] = useState('input');

  const handleStartResearch = async () => {
    if (!taskDescription.trim()) {
      toast.error('Please provide a research question or topic');
      return;
    }

    await onExecuteStage(0, taskDescription);
    setActiveTab('progress');
  };

  const handleContinueToNext = async () => {
    await onExecuteStage(currentStage);
  };

  const stageNames = [
    'Initialization', 'Decomposition', 'Hypothesis/Planning', 
    'Evidence Integration', 'Pruning/Merging', 'Subgraph Extraction',
    'Composition', 'Reflection', 'Final Analysis'
  ];

  const renderStageInput = () => {
    if (currentStage === 0 && !stageResults[0]) {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="task-description" className="text-lg font-semibold">Research Question or Topic</Label>
            <Textarea
              id="task-description"
              placeholder="Enter your scientific research question or topic of interest. The AI will automatically analyze the field, generate hypotheses, and conduct comprehensive research..."
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-2">AI-Powered Research Process</h4>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Automatic field identification and background research</li>
              <li>• AI-generated hypotheses and research dimensions</li>
              <li>• Real-time evidence collection via Perplexity Sonar</li>
              <li>• Advanced analysis with Gemini 2.5 Pro</li>
              <li>• Comprehensive scientific reasoning and validation</li>
            </ul>
          </div>
          <Button onClick={handleStartResearch} disabled={isProcessing} className="w-full gradient-bg">
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                AI is analyzing and researching...
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4 mr-2" />
                Start AI-Powered Research
              </>
            )}
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="mb-4">
            <Badge className="bg-purple-100 text-purple-800 text-lg px-4 py-2">
              Stage {currentStage + 1}: {stageNames[currentStage]}
            </Badge>
          </div>
          <p className="text-muted-foreground mb-4">
            The AI will automatically proceed with the next stage of analysis
          </p>
          <Button 
            onClick={handleContinueToNext}
            disabled={isProcessing || currentStage >= 9}
            className="gradient-bg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                AI Processing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Continue AI Analysis
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-white/50">
          <TabsTrigger value="input" className="data-[state=active]:gradient-bg data-[state=active]:text-white">Research Input</TabsTrigger>
          <TabsTrigger value="progress" className="data-[state=active]:gradient-bg data-[state=active]:text-white">AI Analysis</TabsTrigger>
          <TabsTrigger value="results" className="data-[state=active]:gradient-bg data-[state=active]:text-white">Results</TabsTrigger>
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
                <Sparkles className="h-5 w-5" />
                AI-Powered Research Progress
              </CardTitle>
              <CardDescription>
                Monitor the ASR-GoT framework execution with real-time AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Research Context */}
              {researchContext?.topic && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border">
                  <h3 className="font-semibold gradient-text mb-2">Current Research</h3>
                  <p className="text-sm"><strong>Topic:</strong> {researchContext.topic}</p>
                  {researchContext.field && (
                    <p className="text-sm"><strong>Field:</strong> {researchContext.field}</p>
                  )}
                </div>
              )}

              {/* Progress Overview */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Overall Progress</span>
                  <span className="gradient-text font-bold">{Math.round(((currentStage + 1) / 9) * 100)}%</span>
                </div>
                <Progress 
                  value={((currentStage + 1) / 9) * 100} 
                  className="h-3 bg-purple-100"
                />
              </div>

              {/* Stage Results */}
              <div className="space-y-4">
                <h3 className="font-semibold gradient-text">Stage Analysis Results</h3>
                <ScrollArea className="h-96 w-full">
                  <div className="space-y-4 pr-4">
                    {stageResults.map((result, index) => (
                      <Card key={index} className="card-gradient">
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <CardTitle className="text-sm">
                              Stage {index + 1}: {stageNames[index]}
                            </CardTitle>
                            <Badge variant="secondary" className="text-xs">
                              Completed
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="text-sm prose prose-sm max-w-none">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: ({children}) => <h1 className="gradient-text text-lg font-bold mb-2">{children}</h1>,
                                h2: ({children}) => <h2 className="gradient-text text-base font-semibold mb-2">{children}</h2>,
                                h3: ({children}) => <h3 className="text-purple-700 text-sm font-semibold mb-1">{children}</h3>,
                                p: ({children}) => <p className="mb-2 text-sm">{children}</p>,
                                ul: ({children}) => <ul className="list-disc pl-4 mb-2 text-sm">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal pl-4 mb-2 text-sm">{children}</ol>,
                                code: ({children}) => <code className="bg-purple-100 px-1 py-0.5 rounded text-xs">{children}</code>,
                                pre: ({children}) => <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{children}</pre>,
                                table: ({children}) => <table className="border-collapse border border-gray-300 text-xs w-full mb-2">{children}</table>,
                                th: ({children}) => <th className="border border-gray-300 px-2 py-1 bg-purple-50 font-semibold">{children}</th>,
                                td: ({children}) => <td className="border border-gray-300 px-2 py-1">{children}</td>,
                              }}
                            >
                              {result}
                            </ReactMarkdown>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {/* Current Processing Stage */}
                    {isProcessing && (
                      <Card className="card-gradient border-purple-200 border-2">
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                            <CardTitle className="text-sm gradient-text">
                              Stage {currentStage + 1}: {stageNames[currentStage]}
                            </CardTitle>
                            <Badge className="gradient-bg text-white text-xs">
                              Processing
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="text-sm text-muted-foreground">
                            AI is analyzing and processing this stage...
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Graph Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="card-gradient">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold gradient-text">{graphData.nodes.length}</div>
                    <div className="text-sm text-muted-foreground">Knowledge Nodes</div>
                  </CardContent>
                </Card>
                <Card className="card-gradient">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold gradient-text">{graphData.edges.length}</div>
                    <div className="text-sm text-muted-foreground">Reasoning Links</div>
                  </CardContent>
                </Card>
              </div>

              {/* Continue Button - Enhanced */}
              {!isProcessing && currentStage < 8 && (
                <div className="space-y-2">
                  <Button 
                    onClick={handleContinueToNext}
                    className="w-full gradient-bg"
                    disabled={currentStage >= 8}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Execute Stage {currentStage + 1}: {stageNames[currentStage]}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Click to proceed manually through each stage
                  </p>
                </div>
              )}
              
              {/* Final Analysis Complete */}
              {stageResults.length >= 9 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold text-green-800">Analysis Complete!</h3>
                  </div>
                  <p className="text-sm text-green-700 mb-3">
                    Comprehensive PhD-level scientific analysis has been generated.
                  </p>
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    <FileText className="h-4 w-4 mr-2" />
                    Export Final Report (HTML)
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
              {stageResults.length > 0 ? (
                <div className="space-y-6">
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
                        {Array.from(new Set(graphData.nodes.map(n => n.type))).map(type => (
                          <Badge key={type} variant="secondary" className="mr-1">
                            {type} ({graphData.nodes.filter(n => n.type === type).length})
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold gradient-text mb-2">Relationship Types</h4>
                      <div className="space-y-1">
                        {Array.from(new Set(graphData.edges.map(e => e.type))).map(type => (
                          <Badge key={type} variant="outline" className="mr-1">
                            {type} ({graphData.edges.filter(e => e.type === type).length})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Export Button */}
                  <Button className="w-full gradient-bg">
                    <FileText className="h-4 w-4 mr-2" />
                    Export Complete Analysis
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No Results Yet</h3>
                  <p className="text-muted-foreground">
                    Start the research process to generate comprehensive AI-powered insights.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
