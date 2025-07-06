import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Brain, 
  Search, 
  FileText, 
  Network,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { GraphData } from '@/hooks/useASRGoT';
import { toast } from 'sonner';

interface ResearchInterfaceProps {
  currentStage: number;
  graphData: GraphData;
  onExecuteStage: (stageIndex: number, input?: any) => void;
  isProcessing: boolean;
}

export const ResearchInterface: React.FC<ResearchInterfaceProps> = ({
  currentStage,
  graphData,
  onExecuteStage,
  isProcessing
}) => {
  const [researchQuery, setResearchQuery] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);
  const [hypotheses, setHypotheses] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('input');

  const defaultDimensions = [
    'Scope', 'Objectives', 'Constraints', 'Data Needs', 
    'Use Cases', 'Potential Biases', 'Knowledge Gaps'
  ];

  const handleStartResearch = async () => {
    if (!taskDescription.trim()) {
      toast.error('Please provide a task description');
      return;
    }

    await onExecuteStage(0, taskDescription);
    setActiveTab('progress');
  };

  const handleDecomposition = async () => {
    const dimensions = selectedDimensions.length > 0 ? selectedDimensions : defaultDimensions;
    await onExecuteStage(1, dimensions);
  };

  const handleHypothesisGeneration = async () => {
    if (hypotheses.length === 0) {
      toast.error('Please add at least one hypothesis');
      return;
    }
    await onExecuteStage(2, hypotheses);
  };

  const addHypothesis = () => {
    setHypotheses([...hypotheses, '']);
  };

  const updateHypothesis = (index: number, value: string) => {
    const updated = [...hypotheses];
    updated[index] = value;
    setHypotheses(updated);
  };

  const removeHypothesis = (index: number) => {
    setHypotheses(hypotheses.filter((_, i) => i !== index));
  };

  const toggleDimension = (dimension: string) => {
    setSelectedDimensions(prev => 
      prev.includes(dimension) 
        ? prev.filter(d => d !== dimension)
        : [...prev, dimension]
    );
  };

  const stageInputs = {
    0: (
      <div className="space-y-4">
        <div>
          <Label htmlFor="task-description">Research Task Description</Label>
          <Textarea
            id="task-description"
            placeholder="Describe your research question or scientific problem..."
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            rows={4}
          />
        </div>
        <Button onClick={handleStartResearch} disabled={isProcessing}>
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Initializing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Start Research
            </>
          )}
        </Button>
      </div>
    ),
    1: (
      <div className="space-y-4">
        <div>
          <Label>Task Decomposition Dimensions</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {defaultDimensions.map(dimension => (
              <div 
                key={dimension}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedDimensions.includes(dimension) 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:bg-muted'
                }`}
                onClick={() => toggleDimension(dimension)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{dimension}</span>
                  {selectedDimensions.includes(dimension) && (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <Button onClick={handleDecomposition} disabled={isProcessing}>
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Decomposing...
            </>
          ) : (
            <>
              <Network className="h-4 w-4 mr-2" />
              Execute Decomposition
            </>
          )}
        </Button>
      </div>
    ),
    2: (
      <div className="space-y-4">
        <div>
          <Label>Research Hypotheses</Label>
          <div className="space-y-3 mt-2">
            {hypotheses.map((hypothesis, index) => (
              <div key={index} className="flex gap-2">
                <Textarea
                  placeholder={`Hypothesis ${index + 1}...`}
                  value={hypothesis}
                  onChange={(e) => updateHypothesis(index, e.target.value)}
                  rows={2}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeHypothesis(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={addHypothesis}
            className="mt-2"
          >
            Add Hypothesis
          </Button>
        </div>
        <Button onClick={handleHypothesisGeneration} disabled={isProcessing}>
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Generate Hypotheses
            </>
          )}
        </Button>
      </div>
    ),
    3: (
      <div className="space-y-4">
        <div>
          <Label htmlFor="research-query">Research Query for Evidence</Label>
          <Input
            id="research-query"
            placeholder="Enter specific research query for Perplexity..."
            value={researchQuery}
            onChange={(e) => setResearchQuery(e.target.value)}
          />
        </div>
        <Button 
          onClick={() => onExecuteStage(3, researchQuery)} 
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Integrating Evidence...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Integrate Evidence
            </>
          )}
        </Button>
      </div>
    )
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="input">Research Input</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Stage {currentStage + 1}: {
                  ['Initialization', 'Decomposition', 'Hypothesis/Planning', 'Evidence Integration',
                   'Pruning/Merging', 'Subgraph Extraction', 'Composition', 'Reflection'][currentStage]
                }
              </CardTitle>
              <CardDescription>
                Provide the required inputs for the current stage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stageInputs[currentStage] || (
                <div className="text-center py-8">
                  <Button 
                    onClick={() => onExecuteStage(currentStage)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Execute Stage
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Research Progress</CardTitle>
              <CardDescription>
                Monitor the ASR-GoT framework execution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span>{Math.round(((currentStage + 1) / 8) * 100)}%</span>
                </div>
                <Progress value={((currentStage + 1) / 8) * 100} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{graphData.nodes.length}</div>
                  <div className="text-sm text-muted-foreground">Nodes Created</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{graphData.edges.length}</div>
                  <div className="text-sm text-muted-foreground">Edges Created</div>
                </div>
              </div>

              {isProcessing && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Processing stage {currentStage + 1}...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Research Results</CardTitle>
              <CardDescription>
                View generated insights and conclusions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {graphData.nodes.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Generated Knowledge Graph</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Node Types</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Array.from(new Set(graphData.nodes.map(n => n.type))).map(type => (
                            <Badge key={type} variant="secondary">{type}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Edge Types</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Array.from(new Set(graphData.edges.map(e => e.type))).map(type => (
                            <Badge key={type} variant="outline">{type}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Export Results
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No results available yet. Start the research process to generate insights.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};