/**
 * Stage Progress Section Component
 * Displays the progress of the 9-stage research pipeline
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Loader2, Zap } from 'lucide-react';
import { 
  AnalysisProgressIllustration, 
  StageNavigationIllustration 
} from '@/components/ui/EngagingIllustrations';

interface StageProgressSectionProps {
  currentStage: number;
  stageResults: string[];
  isProcessing: boolean;
  processingMode: 'automatic' | 'manual';
  onContinueToNext: () => Promise<void>;
}

const stageNames = [
  'Initialization', 
  'Decomposition', 
  'Hypothesis/Planning', 
  'Evidence Integration', 
  'Pruning/Merging', 
  'Subgraph Extraction', 
  'Composition', 
  'Reflection', 
  'Final Analysis'
];

export const StageProgressSection: React.FC<StageProgressSectionProps> = ({
  currentStage,
  stageResults,
  isProcessing,
  processingMode,
  onContinueToNext,
}) => {
  return (
    <div className="space-y-6">
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
          {processingMode === 'automatic' 
            ? 'All stages will execute automatically in sequence' 
            : 'Click to manually proceed with the next stage of analysis'
          }
        </p>

        {processingMode === 'manual' && (
          <Button 
            onClick={onContinueToNext} 
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
        )}

        {processingMode === 'automatic' && (
          <Badge className="gradient-bg text-white text-base px-4 py-2">
            🤖 Automatic execution in progress...
          </Badge>
        )}
      </div>

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
        </div>
      )}
    </div>
  );
};