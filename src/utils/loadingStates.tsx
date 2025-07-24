/**
 * Comprehensive Loading States and Progress Indicators
 * Provides consistent loading UX across the application
 */

import React from 'react';
import { Loader2, AlertCircle, CheckCircle, Clock, Zap, Brain, Search, FileText, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Loading state types
export enum LoadingStateType {
  INITIAL = 'initial',
  PROCESSING = 'processing',  
  ANALYZING = 'analyzing',
  SEARCHING = 'searching',
  GENERATING = 'generating',
  EXPORTING = 'exporting',
  SAVING = 'saving',
  LOADING = 'loading',
  COMPLETING = 'completing'
}

export interface LoadingStateData {
  type: LoadingStateType;
  message: string;
  progress?: number;
  subMessage?: string;
  estimatedTime?: number;
  stage?: string;
  canCancel?: boolean;
  onCancel?: () => void;
}

// Stage-specific loading configurations
const STAGE_LOADING_CONFIGS = {
  1: {
    icon: <Brain className="h-6 w-6" />,
    title: 'Initialization',
    description: 'Setting up research framework and parsing objectives',
    estimatedTime: 15000,
    steps: ['Parsing objectives', 'Creating root node', 'Initializing knowledge base']
  },
  2: {
    icon: <Search className="h-6 w-6" />,
    title: 'Decomposition',
    description: 'Breaking down research into analyzable dimensions',
    estimatedTime: 20000,
    steps: ['Analyzing scope', 'Identifying dimensions', 'Mapping constraints']
  },
  3: {
    icon: <Zap className="h-6 w-6" />,
    title: 'Hypothesis Generation',
    description: 'Creating testable hypotheses for each dimension',
    estimatedTime: 25000,
    steps: ['Generating hypotheses', 'Scoring impact', 'Creating test nodes']
  },
  4: {
    icon: <Search className="h-6 w-6" />,
    title: 'Evidence Integration',
    description: 'Searching and analyzing supporting evidence',
    estimatedTime: 45000,
    steps: ['Web search', 'Content analysis', 'Evidence synthesis']
  },
  5: {
    icon: <FileText className="h-6 w-6" />,
    title: 'Pruning & Merging',
    description: 'Optimizing graph structure and removing redundancy',
    estimatedTime: 30000,
    steps: ['Analyzing connections', 'Merging similar nodes', 'Pruning low-value paths']
  },
  6: {
    icon: <Brain className="h-6 w-6" />,
    title: 'Subgraph Extraction',
    description: 'Identifying high-impact research pathways',
    estimatedTime: 20000,
    steps: ['Calculating impact scores', 'Extracting pathways', 'Analyzing complexity']
  },
  7: {
    icon: <FileText className="h-6 w-6" />,
    title: 'Composition',
    description: 'Synthesizing findings into coherent analysis',
    estimatedTime: 35000,
    steps: ['Content synthesis', 'Citation formatting', 'Statistical analysis']
  },
  8: {
    icon: <CheckCircle className="h-6 w-6" />,
    title: 'Reflection',
    description: 'Self-auditing for bias and consistency',
    estimatedTime: 25000,
    steps: ['Bias detection', 'Temporal analysis', 'Quality assessment']
  },
  9: {
    icon: <FileText className="h-6 w-6" />,
    title: 'Final Analysis',
    description: 'Generating comprehensive PhD-level report',
    estimatedTime: 40000,
    steps: ['Report generation', 'Visual analytics', 'Final validation']
  }
};

/**
 * Main loading state component with adaptive UI
 */
interface LoadingStateProps {
  state: LoadingStateData;
  className?: string;
  compact?: boolean;
  showProgress?: boolean;
  showEstimatedTime?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  state,
  className = '',
  compact = false,
  showProgress = true,
  showEstimatedTime = true
}) => {
  const getLoadingIcon = (type: LoadingStateType) => {
    switch (type) {
      case LoadingStateType.ANALYZING:
        return <Brain className="h-5 w-5 animate-pulse" />;
      case LoadingStateType.SEARCHING:
        return <Search className="h-5 w-5 animate-bounce" />;
      case LoadingStateType.GENERATING:
        return <Zap className="h-5 w-5 animate-pulse" />;
      case LoadingStateType.EXPORTING:
        return <Download className="h-5 w-5 animate-bounce" />;
      case LoadingStateType.SAVING:
        return <CheckCircle className="h-5 w-5 animate-pulse" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin" />;
    }
  };

  const getLoadingColor = (type: LoadingStateType) => {
    switch (type) {
      case LoadingStateType.ANALYZING:
        return 'text-blue-600';
      case LoadingStateType.SEARCHING:
        return 'text-green-600';
      case LoadingStateType.GENERATING:
        return 'text-purple-600';
      case LoadingStateType.EXPORTING:
        return 'text-orange-600';
      case LoadingStateType.COMPLETING:
        return 'text-emerald-600';
      default:
        return 'text-primary';
    }
  };

  const formatEstimatedTime = (ms?: number) => {
    if (!ms) return '';
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `~${seconds}s`;
    const minutes = Math.round(seconds / 60);
    return `~${minutes}m`;
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={getLoadingColor(state.type)}>
          {getLoadingIcon(state.type)}
        </div>
        <span className="text-sm text-muted-foreground">{state.message}</span>
        {showEstimatedTime && state.estimatedTime && (
          <Badge variant="outline" className="text-xs">
            {formatEstimatedTime(state.estimatedTime)}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 ${getLoadingColor(state.type)}`}>
            {getLoadingIcon(state.type)}
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-lg">{state.message}</h3>
              {state.subMessage && (
                <p className="text-muted-foreground text-sm mt-1">{state.subMessage}</p>
              )}
            </div>
            
            {showProgress && typeof state.progress === 'number' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{Math.round(state.progress)}%</span>
                </div>
                <Progress value={state.progress} className="h-2" />
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {showEstimatedTime && state.estimatedTime && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatEstimatedTime(state.estimatedTime)}</span>
                  </div>
                )}
                
                {state.stage && (
                  <Badge variant="secondary" className="text-xs">
                    Stage {state.stage}
                  </Badge>
                )}
              </div>
              
              {state.canCancel && state.onCancel && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={state.onCancel}
                  className="text-destructive hover:text-destructive"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Stage-specific loading component with detailed progress
 */
interface StageLoadingProps {
  stageNumber: number;
  progress?: number;
  currentStep?: string;
  onCancel?: () => void;
  className?: string;
}

export const StageLoading: React.FC<StageLoadingProps> = ({
  stageNumber,
  progress = 0,
  currentStep,
  onCancel,
  className = ''
}) => {
  const config = STAGE_LOADING_CONFIGS[stageNumber as keyof typeof STAGE_LOADING_CONFIGS];
  
  if (!config) {
    return (
      <LoadingState 
        state={{
          type: LoadingStateType.PROCESSING,
          message: `Processing Stage ${stageNumber}`,
          progress,
          canCancel: !!onCancel,
          onCancel
        }}
        className={className}
      />
    );
  }

  const currentStepIndex = currentStep 
    ? config.steps.findIndex(step => step.toLowerCase().includes(currentStep.toLowerCase()))
    : -1;

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="text-primary">
              {config.icon}
            </div>
            <div>
              <h3 className="font-semibold text-lg">Stage {stageNumber}: {config.title}</h3>
              <p className="text-muted-foreground text-sm">{config.description}</p>
            </div>
          </div>
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
          
          {/* Current Step */}
          {currentStep && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="font-medium text-sm">Current Step</span>
              </div>
              <p className="text-sm text-muted-foreground">{currentStep}</p>
            </div>
          )}
          
          {/* Steps Overview */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Process Steps</h4>
            <div className="grid gap-2">
              {config.steps.map((step, index) => {
                const isCompleted = currentStepIndex > index;
                const isCurrent = currentStepIndex === index;
                
                return (
                  <div 
                    key={index}
                    className={`flex items-center gap-2 text-sm p-2 rounded ${
                      isCompleted ? 'bg-green-50 text-green-700' :
                      isCurrent ? 'bg-blue-50 text-blue-700' :
                      'text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : isCurrent ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Est. {Math.round(config.estimatedTime / 1000)}s</span>
            </div>
            
            {onCancel && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onCancel}
                className="text-destructive hover:text-destructive"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Skeleton loading placeholders for different content types
 */
export const GraphSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-[600px] w-full border border-border rounded-lg bg-muted/20 animate-pulse ${className}`}>
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="h-12 w-12 bg-muted rounded-full mx-auto animate-pulse" />
        <div className="h-4 w-32 bg-muted rounded mx-auto animate-pulse" />
        <div className="h-3 w-24 bg-muted rounded mx-auto animate-pulse" />
      </div>
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; columns?: number; className?: string }> = ({ 
  rows = 5, 
  columns = 4, 
  className = '' 
}) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex gap-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div 
            key={colIndex} 
            className={`h-4 bg-muted rounded animate-pulse ${
              colIndex === 0 ? 'w-24' : colIndex === 1 ? 'w-32' : 'w-20'
            }`} 
          />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <Card className={className}>
    <CardContent className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-muted rounded animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          <div className="h-3 w-48 bg-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-muted rounded animate-pulse" />
        <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
      </div>
    </CardContent>
  </Card>
);

/**
 * Error state component with retry functionality
 */
interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  onCancel?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  onRetry,
  onCancel,
  className = ''
}) => (
  <Card className={`w-full border-destructive ${className}`}>
    <CardContent className="p-6 text-center space-y-4">
      <div className="text-destructive">
        <AlertCircle className="h-12 w-12 mx-auto" />
      </div>
      
      <div>
        <h3 className="font-semibold text-lg text-destructive mb-2">{title}</h3>
        <p className="text-muted-foreground">{message}</p>
      </div>
      
      <div className="flex gap-2 justify-center">
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
        )}
        {onCancel && (
          <Button onClick={onCancel} variant="ghost">
            Cancel
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);

/**
 * Success state component
 */
interface SuccessStateProps {
  title: string;
  message?: string;
  onContinue?: () => void;
  className?: string;
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  title,
  message,
  onContinue,
  className = ''
}) => (
  <Card className={`w-full border-green-200 bg-green-50 ${className}`}>
    <CardContent className="p-6 text-center space-y-4">
      <div className="text-green-600">
        <CheckCircle className="h-12 w-12 mx-auto" />
      </div>
      
      <div>
        <h3 className="font-semibold text-lg text-green-800 mb-2">{title}</h3>
        {message && (
          <p className="text-green-700 text-sm">{message}</p>
        )}
      </div>
      
      {onContinue && (
        <Button onClick={onContinue} className="bg-green-600 hover:bg-green-700">
          Continue
        </Button>
      )}
    </CardContent>
  </Card>
);