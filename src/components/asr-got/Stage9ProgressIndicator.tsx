/**
 * Stage 9 Multi-Substage Progress Indicator
 * Shows real-time progress of the 9A-9G thesis generation process
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, FileText, BookOpen, BarChart, MessageSquare, Target, Archive } from 'lucide-react';

interface SubstageInfo {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  estimatedTokens: number;
  targetWords: number;
}

interface Stage9ProgressProps {
  isVisible: boolean;
  onComplete?: (report: any) => void;
  onError?: (error: string) => void;
}

export const Stage9ProgressIndicator: React.FC<Stage9ProgressProps> = ({
  isVisible,
  onComplete,
  onError
}) => {
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentSubstage, setCurrentSubstage] = useState<string>('');
  const [completedSubstages, setCompletedSubstages] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationStats, setGenerationStats] = useState({
    totalTokens: 0,
    totalWords: 0,
    totalTime: 0,
    figuresProcessed: 0
  });

  const substages: SubstageInfo[] = [
    {
      id: '9A',
      title: 'Abstract & Executive Summary',
      description: 'Publication-quality abstract with key statistical findings and research significance',
      icon: <FileText className="h-4 w-4" />,
      estimatedTokens: 600,
      targetWords: 700
    },
    {
      id: '9B', 
      title: 'Introduction & Literature Review',
      description: 'Comprehensive background with extensive literature integration and research rationale',
      icon: <BookOpen className="h-4 w-4" />,
      estimatedTokens: 2200,
      targetWords: 2300
    },
    {
      id: '9C',
      title: 'Methodology & Framework',
      description: 'Detailed ASR-GoT implementation with technical specifications and validation protocols',
      icon: <BarChart className="h-4 w-4" />,
      estimatedTokens: 1800,
      targetWords: 2000
    },
    {
      id: '9D',
      title: 'Results & Statistical Analysis',
      description: 'Comprehensive results with figure integration, statistical analysis, and clinical correlations',
      icon: <BarChart className="h-4 w-4" />,
      estimatedTokens: 2800,
      targetWords: 2750
    },
    {
      id: '9E',
      title: 'Discussion & Clinical Implications',
      description: 'Deep scientific interpretation, mechanistic insights, and clinical translation pathways',
      icon: <MessageSquare className="h-4 w-4" />,
      estimatedTokens: 3000,
      targetWords: 3000
    },
    {
      id: '9F',
      title: 'Conclusions & Future Directions',
      description: 'Evidence-based conclusions, practice recommendations, and future research priorities',
      icon: <Target className="h-4 w-4" />,
      estimatedTokens: 1200,
      targetWords: 1350
    },
    {
      id: '9G',
      title: 'References & Technical Appendices',
      description: 'Vancouver-style references, technical appendices, and supplementary documentation',
      icon: <Archive className="h-4 w-4" />,
      estimatedTokens: 1000,
      targetWords: 1100
    }
  ];

  useEffect(() => {
    if (!isVisible) return;

    // Reset state when becoming visible
    setCurrentProgress(0);
    setCurrentSubstage('');
    setCompletedSubstages(new Set());
    setIsGenerating(true);
    setError(null);

    const handleProgress = (event: CustomEvent) => {
      const { substage, progress } = event.detail;
      setCurrentProgress(progress);
      setCurrentSubstage(substage);
      setIsGenerating(true);
      
      // Mark substages as completed based on progress milestones
      const progressToSubstage = {
        15: '9A',
        30: '9B', 
        45: '9C',
        60: '9D',
        75: '9E',
        85: '9F',
        95: '9G'
      };
      
      Object.entries(progressToSubstage).forEach(([threshold, stage]) => {
        if (progress >= parseInt(threshold)) {
          setCompletedSubstages(prev => new Set([...prev, stage]));
        }
      });
    };

    const handleComplete = (event: CustomEvent) => {
      const { report } = event.detail;
      setCurrentProgress(100);
      setIsGenerating(false);
      setCompletedSubstages(new Set(substages.map(s => s.id)));
      
      setGenerationStats({
        totalTokens: report.totalTokensUsed || 0,
        totalWords: report.totalWordCount || 0,
        totalTime: report.totalGenerationTime || 0,
        figuresProcessed: report.figureMetadata?.length || 0
      });
      
      if (onComplete) {
        onComplete(report);
      }
    };

    const handleError = (event: CustomEvent) => {
      const { error: errorMessage } = event.detail;
      setError(errorMessage);
      setIsGenerating(false);
      setCurrentProgress(0);
      
      if (onError) {
        onError(errorMessage);
      }
    };

    // Listen for progress events
    window.addEventListener('stage9-progress', handleProgress as EventListener);
    window.addEventListener('stage9-complete', handleComplete as EventListener);
    window.addEventListener('stage9-error', handleError as EventListener);

    return () => {
      window.removeEventListener('stage9-progress', handleProgress as EventListener);
      window.removeEventListener('stage9-complete', handleComplete as EventListener);
      window.removeEventListener('stage9-error', handleError as EventListener);
    };
  }, [isVisible, onComplete, onError]);

  if (!isVisible) return null;

  const getSubstageStatus = (substageId: string) => {
    if (completedSubstages.has(substageId)) return 'completed';
    if (currentSubstage.includes(substageId)) return 'active';
    return 'pending';
  };

  const totalEstimatedTokens = substages.reduce((sum, s) => sum + s.estimatedTokens, 0);
  const totalTargetWords = substages.reduce((sum, s) => sum + s.targetWords, 0);

  return (
    <Card className="w-full max-w-4xl mx-auto border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <BookOpen className="h-6 w-6" />
          Multi-Substage Thesis Generation (9A-9G)
        </CardTitle>
        <div className="space-y-2">
          <Progress value={currentProgress} className="h-3" />
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress: {currentProgress}%</span>
            <span>Target: 150+ page thesis with {substages.length} substages</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-red-800 font-medium">Generation Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Current Status */}
        {isGenerating && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-500 animate-spin" />
              <span className="text-blue-800 font-medium">
                Currently Generating: {currentSubstage}
              </span>
            </div>
            <p className="text-blue-600 text-sm">
              Using Gemini 2.5 Pro with progressive context chaining for optimal quality and token efficiency.
            </p>
          </div>
        )}

        {/* Substage Progress Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {substages.map((substage) => {
            const status = getSubstageStatus(substage.id);
            const isActive = status === 'active';
            const isCompleted = status === 'completed';
            
            return (
              <div 
                key={substage.id}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-green-50 border-green-200' 
                    : isActive 
                      ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' 
                      : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                    isCompleted 
                      ? 'bg-green-100 text-green-600' 
                      : isActive 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-400'
                  }`}>
                    {isCompleted ? <CheckCircle className="h-4 w-4" /> : substage.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-medium text-sm ${
                        isCompleted ? 'text-green-800' : isActive ? 'text-blue-800' : 'text-gray-600'
                      }`}>
                        Stage {substage.id}
                      </h4>
                      <Badge 
                        variant={isCompleted ? 'default' : isActive ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {isCompleted ? 'Complete' : isActive ? 'Generating' : 'Pending'}
                      </Badge>
                    </div>
                    
                    <h5 className={`font-medium text-xs mb-2 ${
                      isCompleted ? 'text-green-700' : isActive ? 'text-blue-700' : 'text-gray-500'
                    }`}>
                      {substage.title}
                    </h5>
                    
                    <p className={`text-xs leading-relaxed ${
                      isCompleted ? 'text-green-600' : isActive ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {substage.description}
                    </p>
                    
                    <div className={`mt-2 text-xs ${
                      isCompleted ? 'text-green-500' : isActive ? 'text-blue-500' : 'text-gray-400'
                    }`}>
                      Target: {substage.targetWords} words • {substage.estimatedTokens} tokens
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Generation Statistics */}
        {(currentProgress > 0 || generationStats.totalWords > 0) && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3">Generation Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total Words:</span>
                <p className="font-medium text-gray-800">
                  {generationStats.totalWords > 0 ? generationStats.totalWords.toLocaleString() : `~${Math.round(totalTargetWords * (currentProgress / 100)).toLocaleString()}`}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Total Tokens:</span>
                <p className="font-medium text-gray-800">
                  {generationStats.totalTokens > 0 ? generationStats.totalTokens.toLocaleString() : `~${Math.round(totalEstimatedTokens * (currentProgress / 100)).toLocaleString()}`}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Generation Time:</span>
                <p className="font-medium text-gray-800">
                  {generationStats.totalTime > 0 ? `${generationStats.totalTime}s` : 'In progress...'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Figures Processed:</span>
                <p className="font-medium text-gray-800">
                  {generationStats.figuresProcessed > 0 ? generationStats.figuresProcessed : '21+'} with legends
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Completion Summary */}
        {currentProgress === 100 && !error && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-medium">Comprehensive Thesis Generation Complete!</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
              <div>
                <span className="text-green-600">Final Word Count:</span>
                <p className="font-medium text-green-800">{generationStats.totalWords.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-green-600">Total Tokens Used:</span>
                <p className="font-medium text-green-800">{generationStats.totalTokens.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-green-600">Generation Time:</span>
                <p className="font-medium text-green-800">{generationStats.totalTime}s</p>
              </div>
              <div>
                <span className="text-green-600">Figures Included:</span>
                <p className="font-medium text-green-800">{generationStats.figuresProcessed} with legends</p>
              </div>
            </div>
            <p className="text-green-700 text-sm mt-2">
              Your 150+ page thesis has been generated successfully with all substages (9A-9G), 
              comprehensive figure integration, and Vancouver-style references.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};