/**
 * Refactored Research Interface Component
 * Modern, modular, and mobile-responsive research interface
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Search, FileText } from 'lucide-react';
import { GraphData, APICredentials } from '@/types/asrGotTypes';
import { ResearchInputSection } from './research-interface/ResearchInputSection';
import { StageProgressSection } from './research-interface/StageProgressSection';
import { ResearchResultsSection } from './research-interface/ResearchResultsSection';
import { CompletionCelebration } from './research-interface/CompletionCelebration';
import { MobileResponsiveWrapper } from './research-interface/MobileResponsiveWrapper';
import { useEnhancedVisualAnalytics } from './EnhancedVisualAnalytics';
import { useMonitoring } from '@/services/monitoring/ApplicationMonitor';
import { toast } from 'sonner';

interface RefactoredResearchInterfaceProps {
  currentStage: number;
  graphData: GraphData;
  onExecuteStage: (stageIndex: number, input?: string, enableAutoMode?: boolean) => Promise<void>;
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

export const RefactoredResearchInterface: React.FC<RefactoredResearchInterfaceProps> = ({
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
  const [taskDescription, setTaskDescription] = useState('');
  const [activeTab, setActiveTab] = useState('input');
  const { recordPerformance, recordError } = useMonitoring();

  // Enhanced visual analytics with proper error handling
  const {
    figures: analyticsFigures,
    isGenerating: analyticsGenerating,
    exportFigureAsDataURL
  } = useEnhancedVisualAnalytics(graphData, currentStage, apiKeys.gemini || '', {
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
      setTimeout(() => {
        setActiveTab('results');
        toast.success('🎉 Research analysis complete! Switched to Results tab.');
      }, 2000);
    }
  }, [currentStage, stageResults, activeTab]);

  const handleStartResearch = async () => {
    const startTime = performance.now();
    
    try {
      if (!taskDescription.trim()) {
        toast.error('Please provide a research question or topic');
        return;
      }
      
      if (!apiKeys?.gemini) {
        toast.info('API key required to start research');
        onShowApiModal?.();
        return;
      }

      const enableAutoMode = processingMode === 'automatic';
      if (enableAutoMode) {
        toast.success('🤖 Automatic mode: All stages will execute sequentially');
      }
      
      await onExecuteStage(0, taskDescription, enableAutoMode);
      setActiveTab('progress');
      
      recordPerformance('research_start', performance.now() - startTime, {
        processingMode,
        taskLength: taskDescription.length
      });
    } catch (error) {
      recordError(error as Error, { operation: 'handleStartResearch' }, 'medium');
      toast.error('Failed to start research. Please try again.');
    }
  };

  const handleContinueToNext = async () => {
    const startTime = performance.now();
    
    try {
      if (!apiKeys?.gemini) {
        toast.info('API key required to continue research');
        onShowApiModal?.();
        return;
      }
      
      await onExecuteStage(currentStage);
      
      recordPerformance('stage_continue', performance.now() - startTime, {
        stageIndex: currentStage
      });
    } catch (error) {
      recordError(error as Error, { operation: 'handleContinueToNext', stage: currentStage }, 'medium');
      toast.error('Failed to continue research. Please try again.');
    }
  };

  const renderStageInput = () => {
    const isCompleted = currentStage >= 8 && stageResults.length >= 9 && 
                       stageResults.filter(result => result && result.trim()).length >= 9;
    
    if (isCompleted) {
      return <CompletionCelebration />;
    }
    
    if (currentStage === 0 && !stageResults[0]) {
      return (
        <ResearchInputSection
          taskDescription={taskDescription}
          setTaskDescription={setTaskDescription}
          onStartResearch={handleStartResearch}
          isProcessing={isProcessing}
        />
      );
    }
    
    return (
      <StageProgressSection
        currentStage={currentStage}
        stageResults={stageResults}
        isProcessing={isProcessing}
        processingMode={processingMode}
        onContinueToNext={handleContinueToNext}
      />
    );
  };

  return (
    <MobileResponsiveWrapper>
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Tab Navigation - Always Visible */}
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="input" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Input & Setup</span>
              <span className="sm:hidden">Input</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI Analysis</span>
              <span className="sm:hidden">Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Results</span>
              <span className="sm:hidden">Results</span>
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
                {renderStageInput()}
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
                <ResearchResultsSection
                  stageResults={stageResults}
                  graphData={graphData}
                  researchContext={researchContext}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MobileResponsiveWrapper>
  );
};

export default RefactoredResearchInterface;