import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Play, Loader2 } from 'lucide-react';

interface StageManagerProps {
  currentStage: number;
  stages: string[];
  onExecuteStage: (stageIndex: number, input?: any) => void;
  isProcessing: boolean;
  stageResults: string[];
}

const stageDescriptions = [
  'Initialize the root node and set up the knowledge graph foundation',
  'Break down the task into comprehensive dimensions and components',
  'Generate hypotheses and create detailed research plans',
  'Integrate evidence and update confidence measures iteratively',
  'Prune low-confidence nodes and merge redundant information',
  'Extract relevant subgraphs based on impact and confidence',
  'Compose structured results with proper citations and annotations',
  'Perform comprehensive audit and reflection on the entire process'
];

const stageParameters = [
  ['P1.0', 'P1.1'],
  ['P1.2', 'P1.8', 'P1.17'],
  ['P1.3', 'P1.16', 'P1.28'],
  ['P1.4', 'P1.14', 'P1.24', 'P1.25', 'P1.26'],
  ['P1.5', 'P1.13', 'P1.27'],
  ['P1.6', 'P1.15', 'P1.19', 'P1.22'],
  ['P1.6', 'P1.18', 'P1.29'],
  ['P1.7', 'P1.21']
];

export const StageManager: React.FC<StageManagerProps> = ({
  currentStage,
  stages,
  onExecuteStage,
  isProcessing,
  stageResults
}) => {
  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall Progress</span>
            <Badge variant="outline">
              {Math.max(1, currentStage + 1)} / {stages.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Advanced Scientific Reasoning Graph-of-Thoughts Framework
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress 
            value={(currentStage / stages.length) * 100} 
            className="h-3"
          />
          <div className="mt-2 text-sm text-muted-foreground text-center">
            Current Stage: {stages[currentStage]}
          </div>
        </CardContent>
      </Card>

      {/* Stage Details */}
      <div className="grid gap-4">
        {stages.map((stage, index) => {
          const isCompleted = index < currentStage;
          const isCurrent = index === currentStage;
          const isUpcoming = index > currentStage;

          return (
            <Card 
              key={index}
              className={`transition-all ${
                isCurrent ? 'ring-2 ring-primary border-primary' : 
                isCompleted ? 'bg-muted/50' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className={`h-5 w-5 ${
                        isCurrent ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    )}
                    <div>
                      <CardTitle className="text-base">
                        Stage {index + 1}: {stage}
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {stageDescriptions[index]}
                      </CardDescription>
                    </div>
                  </div>
                  
                  {isCurrent && (
                    <Button
                      onClick={() => onExecuteStage(index)}
                      disabled={isProcessing}
                      size="sm"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Execute
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  <div className="text-xs text-muted-foreground mr-2">
                    Parameters:
                  </div>
                  {stageParameters[index]?.map(param => (
                    <Badge 
                      key={param} 
                      variant="secondary" 
                      className="text-xs"
                    >
                      {param}
                    </Badge>
                  ))}
                </div>
                
                {isCurrent && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium mb-2">
                      Stage Requirements:
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getStageRequirements(index)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

function getStageRequirements(stageIndex: number): string {
  const requirements = [
    'Provide a clear task description to initialize the root node',
    'Define task dimensions: Scope, Objectives, Constraints, Data Needs, Use Cases, Biases, Knowledge Gaps',
    '3-5 hypotheses per dimension with explicit research plans and falsification criteria',
    'Evidence collection, confidence updates, and cross-disciplinary linking',
    'Remove low-confidence nodes (< 0.2) and merge semantically similar nodes (>= 0.8)',
    'Extract high-confidence, high-impact subgraphs for focused analysis',
    'Generate structured output with Vancouver citations and node annotations',
    'Comprehensive audit covering bias, gaps, falsifiability, causality, and statistical rigor'
  ];
  
  return requirements[stageIndex] || 'Stage requirements not defined';
}