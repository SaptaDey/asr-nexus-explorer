import React, { useState, useEffect, useRef } from 'react';
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
import { GraphData, APICredentials } from '@/types/asrGotTypes';
import { toast } from 'sonner';
import { useAccessibilityContext } from '@/components/accessibility/AccessibilityProvider';
import { useAccessibleDescription, useFocusManagement } from '@/hooks/useAccessibility';

interface AccessibleResearchInterfaceProps {
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

export const AccessibleResearchInterface: React.FC<AccessibleResearchInterfaceProps> = ({
  currentStage,
  graphData,
  onExecuteStage,
  isProcessing,
  stageResults = [],
  researchContext,
  apiKeys = { gemini: '' },
  processingMode = 'manual',
  onShowApiModal,
  onSwitchToExport
}) => {
  const [researchQuery, setResearchQuery] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [activeTab, setActiveTab] = useState('input');
  
  const { announceLiveRegion } = useAccessibilityContext();
  const { generateVisualizationDescription, generateStageDescription } = useAccessibleDescription();
  const { setFocusWithAnnouncement } = useFocusManagement();
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);

  // Announce stage changes
  useEffect(() => {
    if (currentStage >= 0) {
      const description = generateStageDescription(currentStage, stageResults[currentStage]);
      announceLiveRegion(`Research progress update: ${description}`, 'polite');
    }
  }, [currentStage, stageResults, generateStageDescription, announceLiveRegion]);

  // Auto-switch to results tab when research completes
  useEffect(() => {
    const isCompleted = currentStage >= 8 && stageResults.length >= 9 && 
                      stageResults.filter(result => result && result.trim()).length >= 9;
    
    if (isCompleted && activeTab === 'progress') {
      setTimeout(() => {
        setActiveTab('results');
        announceLiveRegion('Research analysis complete! Automatically switched to Results tab.', 'assertive');
        toast.success('🎉 Research analysis complete! Switched to Results tab.');
      }, 2000);
    }
  }, [currentStage, stageResults, activeTab, announceLiveRegion]);

  const handleStartResearch = async () => {
    if (!taskDescription.trim()) {
      announceLiveRegion('Error: Please provide a research question or topic before starting research.', 'assertive');
      toast.error('Please provide a research question or topic');
      inputRef.current?.focus();
      return;
    }
    
    if (!apiKeys?.gemini) {
      announceLiveRegion('API key required to start research. Opening API configuration modal.', 'assertive');
      toast.info('API key required to start research');
      onShowApiModal?.();
      return;
    }

    // Announce start of research
    const enableAutoMode = processingMode === 'automatic';
    if (enableAutoMode) {
      announceLiveRegion('Starting automatic research mode. All 9 stages will execute sequentially.', 'assertive');
      toast.success('🤖 Automatic mode: All stages will execute sequentially');
    } else {
      announceLiveRegion('Starting manual research mode. Execute each stage individually.', 'assertive');
    }

    await onExecuteStage(0, taskDescription);
    setActiveTab('progress');
  };

  const handleExecuteNextStage = async () => {
    if (currentStage < 8) {
      const nextStage = currentStage + 1;
      const stageName = getStageDisplayName(nextStage);
      announceLiveRegion(`Starting ${stageName}`, 'assertive');
      await onExecuteStage(nextStage);
    }
  };

  const getStageDisplayName = (stage: number): string => {
    const stageNames = [
      'Stage 1: Initialization',
      'Stage 2: Decomposition',
      'Stage 3: Hypothesis Planning',
      'Stage 4: Evidence Integration',
      'Stage 5: Pruning and Merging',
      'Stage 6: Subgraph Extraction',
      'Stage 7: Composition',
      'Stage 8: Reflection',
      'Stage 9: Final Analysis'
    ];
    return stageNames[stage] || `Stage ${stage + 1}`;
  };

  const getStageIcon = (stage: number) => {
    const icons = [Brain, Search, Sparkles, FileText, Network, Zap, BarChart3, CheckCircle, Rocket];
    const IconComponent = icons[stage] || Brain;
    return <IconComponent className="h-4 w-4" aria-hidden="true" />;
  };

  return (
    <Card 
      className="w-full max-w-4xl mx-auto" 
      role="region" 
      aria-labelledby="research-interface-title"
    >
      <CardHeader>
        <CardTitle id="research-interface-title" className="flex items-center">
          <Brain className="h-5 w-5 mr-2" aria-hidden="true" />
          ASR-GoT Research Interface
        </CardTitle>
        <CardDescription>
          AI-powered scientific research through 9-stage analysis framework
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => {
            setActiveTab(value);
            announceLiveRegion(`Switched to ${value} tab`);
          }}
          className="w-full"
        >
          <TabsList 
            className="grid w-full grid-cols-3"
            role="tablist"
            aria-label="Research interface navigation"
          >
            <TabsTrigger 
              value="input"
              role="tab"
              aria-controls="input-panel"
              aria-selected={activeTab === 'input'}
            >
              Input & Setup
            </TabsTrigger>
            <TabsTrigger 
              value="progress"
              role="tab"
              aria-controls="progress-panel"
              aria-selected={activeTab === 'progress'}
            >
              Research Progress
            </TabsTrigger>
            <TabsTrigger 
              value="results"
              role="tab"
              aria-controls="results-panel"
              aria-selected={activeTab === 'results'}
            >
              Results & Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent 
            value="input" 
            className="space-y-4"
            role="tabpanel"
            id="input-panel"
            aria-labelledby="input-tab"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="research-topic">
                  Research Topic or Question
                  <span className="text-red-500 ml-1" aria-label="required">*</span>
                </Label>
                <Textarea
                  id="research-topic"
                  ref={inputRef}
                  placeholder="Enter your research question, hypothesis, or topic of interest..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="min-h-[120px]"
                  required
                  aria-describedby="research-topic-help"
                />
                <p id="research-topic-help" className="text-sm text-gray-600">
                  Provide a clear research question or topic. The AI will analyze this through 9 scientific stages.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  ref={startButtonRef}
                  onClick={handleStartResearch}
                  disabled={isProcessing || !taskDescription.trim()}
                  className="flex-1"
                  data-testid="start-research"
                  aria-describedby="start-research-help"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                      <span aria-live="polite">Processing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" aria-hidden="true" />
                      Start Research Analysis
                    </>
                  )}
                </Button>
                
                {!apiKeys?.gemini && (
                  <Button
                    variant="outline"
                    onClick={onShowApiModal}
                    aria-describedby="api-setup-help"
                  >
                    Configure API Keys
                  </Button>
                )}
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <p id="start-research-help">
                  <strong>Processing Mode:</strong> {processingMode === 'automatic' ? 'Automatic' : 'Manual'} - 
                  {processingMode === 'automatic' ? ' All stages will run sequentially' : ' Execute each stage individually'}
                </p>
                {!apiKeys?.gemini && (
                  <p id="api-setup-help" className="text-yellow-700">
                    ⚠️ API keys are required to start research analysis.
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent 
            value="progress" 
            className="space-y-4"
            role="tabpanel"
            id="progress-panel"
            aria-labelledby="progress-tab"
          >
            <div className="space-y-4">
              {/* Overall Progress */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Research Progress</h3>
                  <Badge variant={currentStage >= 8 ? "default" : "secondary"}>
                    Stage {currentStage + 1} of 9
                  </Badge>
                </div>
                
                <Progress 
                  value={(currentStage + 1) / 9 * 100}
                  className="h-3"
                  role="progressbar"
                  aria-valuenow={(currentStage + 1) / 9 * 100}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Research progress: ${Math.round((currentStage + 1) / 9 * 100)}% complete`}
                />
                
                <p className="text-sm text-gray-600">
                  {Math.round((currentStage + 1) / 9 * 100)}% complete
                  {researchContext?.topic && ` - Analyzing: "${researchContext.topic}"`}
                </p>
              </div>

              {/* Stage Details */}
              <div className="grid gap-3">
                {Array.from({length: 9}, (_, i) => {
                  const isCompleted = i < currentStage || (i === currentStage && stageResults[i]);
                  const isCurrent = i === currentStage;
                  const isPending = i > currentStage;
                  
                  return (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border ${
                        isCompleted ? 'bg-green-50 border-green-200' :
                        isCurrent ? 'bg-blue-50 border-blue-200' :
                        'bg-gray-50 border-gray-200'
                      }`}
                      role="region"
                      aria-labelledby={`stage-${i}-title`}
                      data-stage={i}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getStageIcon(i)}
                          <h4 id={`stage-${i}-title`} className="font-medium">
                            {getStageDisplayName(i)}
                          </h4>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {isCompleted && (
                            <CheckCircle className="h-4 w-4 text-green-600" aria-label="Completed" />
                          )}
                          {isCurrent && isProcessing && (
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" aria-label="Processing" />
                          )}
                          {isCurrent && !isProcessing && processingMode === 'manual' && !isCompleted && (
                            <Button
                              size="sm"
                              onClick={handleExecuteNextStage}
                              aria-label={`Execute ${getStageDisplayName(i)}`}
                            >
                              Execute
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {stageResults[i] && (
                        <div className="mt-2">
                          <details className="text-sm">
                            <summary className="cursor-pointer hover:text-blue-600">
                              View stage result ({stageResults[i].length} characters)
                            </summary>
                            <ScrollArea className="h-32 mt-2 p-2 bg-white rounded border">
                              <pre className="whitespace-pre-wrap text-xs">
                                {stageResults[i].substring(0, 500)}
                                {stageResults[i].length > 500 && '...'}
                              </pre>
                            </ScrollArea>
                          </details>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Graph Visualization Description */}
              {graphData?.nodes?.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium mb-2">Research Graph Status</h4>
                  <p className="text-sm text-gray-700">
                    {generateVisualizationDescription(graphData, currentStage)}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent 
            value="results" 
            className="space-y-4"
            role="tabpanel"
            id="results-panel"
            aria-labelledby="results-tab"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Research Analysis Results</h3>
                {currentStage >= 8 && stageResults.length >= 9 && (
                  <Button
                    onClick={onSwitchToExport}
                    className="bg-green-600 hover:bg-green-700"
                    aria-describedby="export-help"
                  >
                    <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
                    Export Full Report
                  </Button>
                )}
              </div>
              
              <p id="export-help" className="text-sm text-gray-600">
                {currentStage >= 8 && stageResults.length >= 9 
                  ? 'Research complete! Export your comprehensive HTML report with all findings.'
                  : 'Research results will appear here as stages are completed.'
                }
              </p>

              {stageResults.length > 0 ? (
                <ScrollArea className="h-96 border rounded-lg p-4">
                  <div className="space-y-4">
                    {stageResults.map((result, index) => result && (
                      <div key={index} className="border-b pb-4">
                        <h4 className="font-medium mb-2">
                          {getStageDisplayName(index)}
                        </h4>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <pre className="whitespace-pre-wrap">
                            {result.substring(0, 1000)}
                            {result.length > 1000 && '... (truncated)'}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
                  <p>No research results yet. Start your analysis to see results here.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};