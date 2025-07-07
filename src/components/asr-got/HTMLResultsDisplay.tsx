/**
 * HTML-only Results Display for ASR-GoT
 * Renders sanitized HTML output without raw markdown
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { ResearchContext } from '@/types/asrGotTypes';
import { sanitizeHTML } from '@/utils/securityUtils';

interface HTMLResultsDisplayProps {
  stageResults: string[];
  researchContext: ResearchContext;
  currentStage: number;
  finalReport?: string;
}

const parseMarkdownToHTML = (markdown: string): string => {
  const html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2 text-primary">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3 text-primary">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4 text-primary">$1</h1>')
    
    // Bold and Italic
    .replace(/\*\*(.*)\*\*/gim, '<strong class="font-semibold">$1</strong>')
    .replace(/\*(.*)\*/gim, '<em class="italic">$1</em>')
    
    // Code blocks
    .replace(/```([\s\S]*?)```/gim, '<pre class="bg-muted p-3 rounded-md text-sm overflow-x-auto my-3"><code>$1</code></pre>')
    .replace(/`([^`]*)`/gim, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
    
    // Lists
    .replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>')
    
    // Line breaks
    .replace(/\n\n/gim, '</p><p class="mb-3">')
    .replace(/\n/gim, '<br>')
    
    // Wrap in paragraphs
    .replace(/^(?!<[hlu])/gim, '<p class="mb-3">')
    .replace(/(?<![>])$/gim, '</p>');
    
  // Sanitize the HTML to prevent XSS
  return sanitizeHTML(html);
};

const StageCard: React.FC<{ 
  stageIndex: number; 
  result: string; 
  isActive: boolean;
  isCompleted: boolean;
}> = ({ stageIndex, result, isActive, isCompleted }) => {
  const stageNames = [
    'Initialization',
    'Decomposition', 
    'Hypothesis Generation',
    'Evidence Integration',
    'Pruning & Merging',
    'Subgraph Extraction',
    'Composition',
    'Reflection',
    'Final Analysis'
  ];

  const stageIcons = [
    '🎯', '🔧', '🔬', '📚', '✂️', '🔍', '📝', '🤔', '📊'
  ];

  return (
    <Card className={`transition-all duration-200 ${
      isActive ? 'ring-2 ring-primary shadow-lg' : 
      isCompleted ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : 
      'opacity-60'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{stageIcons[stageIndex]}</span>
            <CardTitle className="text-base">
              Stage {stageIndex + 1}: {stageNames[stageIndex]}
            </CardTitle>
          </div>
          <Badge variant={
            isCompleted ? 'default' : 
            isActive ? 'secondary' : 
            'outline'
          }>
            {isCompleted ? 'Complete' : isActive ? 'Active' : 'Pending'}
          </Badge>
        </div>
      </CardHeader>
      
      {result && (
        <CardContent className="pt-0">
          <ScrollArea className="h-[200px]">
            <div 
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: parseMarkdownToHTML(result) }}
            />
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
};

export const HTMLResultsDisplay: React.FC<HTMLResultsDisplayProps> = ({
  stageResults,
  researchContext,
  currentStage,
  finalReport
}) => {
  const completedStages = stageResults.filter(result => result && result.trim()).length;
  const progressPercentage = (completedStages / 9) * 100;

  return (
    <div className="space-y-6">
      {/* Research Overview */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🧪</span>
            Research Analysis Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-1">Research Field</h4>
              <p className="font-medium">{researchContext.field || 'Not determined'}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-1">Current Stage</h4>
              <p className="font-medium">Stage {currentStage + 1} of 9</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">Research Topic</h4>
            <p className="text-sm leading-relaxed">{researchContext.topic || 'No topic specified'}</p>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Analysis Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {researchContext.objectives && researchContext.objectives.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">Key Objectives</h4>
              <ul className="space-y-1">
                {researchContext.objectives.slice(0, 3).map((objective, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-primary">•</span>
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stage Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Stage Execution Results</h2>
          <Badge variant="outline">
            {completedStages} / 9 Completed
          </Badge>
        </div>
        
        <div className="grid gap-4">
          {Array.from({ length: 9 }, (_, index) => (
            <StageCard
              key={index}
              stageIndex={index}
              result={stageResults[index] || ''}
              isActive={index === currentStage}
              isCompleted={index < currentStage || (stageResults[index] && stageResults[index].trim().length > 0)}
            />
          ))}
        </div>
      </div>

      {/* Final Report */}
      {finalReport && (
        <>
          <Separator />
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <span>📋</span>
                Final Comprehensive Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: parseMarkdownToHTML(finalReport) }}
                />
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};