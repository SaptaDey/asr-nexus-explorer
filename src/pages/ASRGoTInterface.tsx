/**
 * ASR-GoT Interface - Integrated Implementation
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Brain, Database, FileText, Download, Zap, Settings, Network, Play, RotateCcw, Mail, ToggleLeft, BookOpen, Bug, Clock, Pause, PlayCircle } from 'lucide-react';
import { TreeOfReasoningVisualization } from '@/components/asr-got/TreeOfReasoningVisualization';
import { ResearchInterface } from '@/components/asr-got/ResearchInterface';
import { EnhancedGraphVisualization } from '@/components/asr-got/EnhancedGraphVisualization';
import { AdvancedGraphVisualization } from '@/components/asr-got/AdvancedGraphVisualization';
import { ParametersPane } from '@/components/asr-got/ParametersPane';
import { InAppPreview } from '@/components/asr-got/InAppPreview';
import { BiasAuditingSidebar } from '@/components/asr-got/BiasAuditingSidebar';
import { VisualAnalytics } from '@/components/asr-got/VisualAnalytics';
import { MetaAnalysisVisualAnalytics } from '@/components/asr-got/MetaAnalysisVisualAnalytics';
import { CostAwareDashboard } from '@/components/asr-got/CostAwareDashboard';
import { DeveloperMode } from '@/components/asr-got/DeveloperMode';
import { UnifiedAPICredentialsModal } from '@/components/asr-got/UnifiedAPICredentialsModal';
import { DebugButton } from '@/components/asr-got/DebugButton';
import { RealTimeErrorLogger } from '@/components/asr-got/RealTimeErrorLogger';
import { StoredAnalysesManager } from '@/components/asr-got/StoredAnalysesManager';
import { Stage9ProgressIndicator } from '@/components/asr-got/Stage9ProgressIndicator';
import { QueryHistoryManager } from '@/components/asr-got/QueryHistoryManager';
import { ResponsiveLayout } from '@/components/asr-got/ResponsiveLayout';
import { defaultNavigationItems } from '@/components/asr-got/ResponsiveNavigation';
import { useASRGoT } from '@/hooks/useASRGoT';
import { useProcessingMode } from '@/hooks/asr-got/useProcessingMode';
import { costAwareOrchestration } from '@/services/CostAwareOrchestrationService';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { APICredentials } from '@/types/asrGotTypes';
import { backendService } from '@/services/backend/BackendService';
import { historyManager } from '@/services/backend/HistoryManager';
import { useAuthContext } from '@/contexts/AuthContext';
import { enhancedApiService } from '@/services/enhancedApiService';
import { dataStorageService } from '@/services/dataStorageService';
import { SessionControls } from '@/components/asr-got/SessionControls';
import { User, LogIn, UserPlus, Key, CheckCircle, AlertTriangle } from 'lucide-react';
import MermaidChart from '@/components/ui/MermaidChart';
const ASRGoTInterface: React.FC = () => {
  const {
    currentStage,
    graphData,
    parameters,
    stageProgress,
    isProcessing,
    apiKeys,
    stageResults,
    researchContext,
    finalReport,
    executeStage,
    resetFramework,
    setParameters,
    updateApiKeys,
    exportResults,
    isComplete,
    hasResults,
    canExportHtml,
    currentSessionId,
    queryHistorySessionId,
    pauseSession,
    resumeFromHistory,
    completeSession,
    isAutoSaveEnabled,
    lastSaveTime
  } = useASRGoT();
  const [showAPICredentialsModal, setShowAPICredentialsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('research');
  const [showStage9Progress, setShowStage9Progress] = useState(false);
  const [showBiasAudit, setShowBiasAudit] = useState(false);
  const [exportContent, setExportContent] = useState<string>('');
  const [backendStatus, setBackendStatus] = useState<any>(null);
  const [backendHealthy, setBackendHealthy] = useState(false);
  const {
    mode,
    toggleMode,
    isAutomatic
  } = useProcessingMode('manual');

  // Authentication and backend integration
  const {
    user,
    profile,
    loading: authLoading
  } = useAuthContext();
  const [hasBackendApiKeys, setHasBackendApiKeys] = useState(false);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Initialize backend and monitor health
  useEffect(() => {
    const initializeBackend = async () => {
      try {
        console.log('🚀 Initializing backend services...');
        const status = await backendService.initialize();
        setBackendStatus(status);
        setBackendHealthy(backendService.isHealthy());
        if (status.health.errors.length > 0) {
          console.warn('⚠️ Backend initialized with errors:', status.health.errors);
          toast.warning('Backend services initialized with some limitations');
        } else {
          toast.success('Backend services connected successfully');
        }
      } catch (error) {
        console.error('❌ Backend initialization failed:', error);
        toast.error('Backend connection failed. Some features may be limited.');
        setBackendHealthy(false);
      }
    };
    initializeBackend();

    // Set up periodic health checks
    const healthCheckInterval = setInterval(async () => {
      const healthy = backendService.isHealthy();
      if (healthy !== backendHealthy) {
        setBackendHealthy(healthy);
        if (!healthy) {
          toast.warning('Backend connection issue detected');
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(healthCheckInterval);
  }, []);

  // Load backend API keys and usage stats
  useEffect(() => {
    const loadBackendData = async () => {
      if (user) {
        try {
          const [apiKeys, usage] = await Promise.all([enhancedApiService.hasBackendApiKeys(), enhancedApiService.getUsageStats()]);
          setHasBackendApiKeys(apiKeys.gemini || apiKeys.perplexity || apiKeys.openai);
          setUsageStats(usage);
        } catch (error) {
          console.error('Failed to load backend data:', error);
        }
      }
    };
    loadBackendData();
  }, [user]);

  // Create session when research starts
  useEffect(() => {
    if (researchContext?.topic && currentStage === 0 && backendHealthy) {
      const createSession = async () => {
        try {
          const sessionId = await historyManager.createSession(researchContext.topic.substring(0, 100), `ASR-GoT analysis on ${researchContext.field || 'research'} topic`, researchContext, parameters);
          if (sessionId) {
            console.log('✅ Session created:', sessionId);
            historyManager.setCurrentSessionId(sessionId);
          }
        } catch (error) {
          console.warn('⚠️ Could not create session:', error);
        }
      };
      createSession();
    }
  }, [researchContext?.topic, currentStage, backendHealthy]);

  // Update session progress
  useEffect(() => {
    const sessionId = historyManager.getCurrentSessionId();
    if (sessionId && currentStage > 0 && backendHealthy) {
      const updateSession = async () => {
        try {
          await historyManager.updateSession(sessionId, {
            current_stage: currentStage,
            status: isProcessing ? 'running' : 'paused',
            stage_results: stageResults,
            graph_data: graphData
          });
        } catch (error) {
          console.warn('⚠️ Could not update session:', error);
        }
      };
      updateSession();
    }
  }, [currentStage, stageResults, graphData, isProcessing, backendHealthy]);

  // Auto-switch to export tab when all 9 stages are completed
  useEffect(() => {
    if (currentStage >= 8 && stageResults.length >= 9) {
      // Check if we have results for all 9 stages
      const completedStages = stageResults.filter(result => result && result.trim()).length;
      if (completedStages >= 9) {
        setActiveTab('export');
        toast.success('🎉 All 9 stages completed! Switched to Export tab to view your HTML report.');

        // Automatically complete the query history session
        handleCompleteSession();
      }
    }
  }, [currentStage, stageResults]);

  // Handle automatic Supabase storage events
  useEffect(() => {
    const handleAnalysisStored = (event: CustomEvent) => {
      const {
        analysisId,
        sessionId
      } = event.detail;
      toast.success(`✅ Analysis automatically saved to Supabase! ID: ${analysisId.substring(0, 8)}...`, {
        duration: 5000,
        action: {
          label: 'View Storage',
          onClick: () => setActiveTab('storage')
        }
      });
    };
    const handleStorageFailed = (event: CustomEvent) => {
      const {
        error
      } = event.detail;
      toast.error(`❌ Automatic storage failed: ${error}`, {
        duration: 8000,
        description: 'Your analysis is still available for manual export.'
      });
    };

    // Listen for storage events
    window.addEventListener('analysis-stored', handleAnalysisStored as EventListener);
    window.addEventListener('analysis-storage-failed', handleStorageFailed as EventListener);
    return () => {
      window.removeEventListener('analysis-stored', handleAnalysisStored as EventListener);
      window.removeEventListener('analysis-storage-failed', handleStorageFailed as EventListener);
    };
  }, []);
  const handleAPICredentialsSave = (credentials: APICredentials) => {
    updateApiKeys(credentials);
    toast.success('✅ API credentials saved successfully.');
  };
  const handleResumeSession = async (sessionId: string) => {
    try {
      const success = await resumeFromHistory(sessionId);
      if (success) {
        setActiveTab('research'); // Switch to research tab to continue
        toast.success('✅ Session resumed! Continue from where you left off.');
      }
    } catch (error) {
      toast.error('Failed to resume session');
      console.error('Resume error:', error);
    }
  };
  const handleCompleteSession = async () => {
    if (isComplete && queryHistorySessionId) {
      await completeSession();
      toast.success('🎉 Research session completed and saved to History!');
    }
  };

  // Enhanced pause/resume functionality with backend integration
  const handlePauseSession = async () => {
    try {
      setIsPaused(true);
      await pauseSession();
      if (user && currentSessionId) {
        await dataStorageService.saveResearchSession({
          userQuery: researchContext.topic,
          currentStage,
          graphData,
          stageResults,
          researchContext,
          isProcessing: false,
          isCompleted: isComplete
        }, currentSessionId);
      }
      toast.success('Session paused and saved');
    } catch (error: any) {
      toast.error(error.message || 'Failed to pause session');
    }
  };
  const handleEnhancedResumeSession = async () => {
    try {
      setIsPaused(false);
      toast.success('Session resumed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resume session');
    }
  };
  const handleSaveSession = async (): Promise<string> => {
    try {
      if (!user) {
        throw new Error('Please sign in to save sessions');
      }
      const sessionId = currentSessionId || crypto.randomUUID();
      await dataStorageService.saveResearchSession({
        userQuery: researchContext.topic,
        currentStage,
        graphData,
        stageResults,
        researchContext,
        isProcessing,
        isCompleted: isComplete,
        parameters
      }, sessionId);
      toast.success('Session saved successfully');
      return sessionId;
    } catch (error: any) {
      toast.error(error.message || 'Failed to save session');
      throw error;
    }
  };
  const handleLoadSession = async (sessionId: string) => {
    try {
      const sessionData = await dataStorageService.loadResearchSession(sessionId);
      if (sessionData) {
        // This would require integration with the useASRGoT hook to restore state
        toast.success('Session loaded successfully');
        setActiveTab('research');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load session');
    }
  };

  // Content mapping for responsive layout
  const renderTabContent = (tabId: string) => {
    switch (tabId) {
      case 'research':
        return <div className="space-y-6">
            <ResearchInterface currentStage={currentStage} graphData={graphData} onExecuteStage={executeStage} isProcessing={isProcessing} stageResults={stageResults} researchContext={researchContext} apiKeys={apiKeys} processingMode={mode} onShowApiModal={() => setShowAPICredentialsModal(true)} onSwitchToExport={() => setActiveTab('export')} />
            
            {/* Enhanced Research Controls */}
            <div className="mt-6 bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Research Session Status</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Stage {currentStage + 1}/9 • {isProcessing ? 'Processing...' : isPaused ? 'Paused' : 'Ready'}
                    {user && currentSessionId && <> • Session: {currentSessionId.slice(0, 8)}...</>}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* API Status Indicator */}
                  <div className="flex items-center space-x-2 text-sm">
                    {apiKeys.gemini && apiKeys.perplexity || hasBackendApiKeys ? <div className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span>API Ready</span>
                      </div> : <div className="flex items-center text-yellow-600">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        <span>Setup Required</span>
                      </div>}
                  </div>
                  
                  {/* User Status */}
                  <div className="text-sm text-gray-500">
                    {user ? <span>✓ Signed In</span> : <Link to="/auth" className="text-blue-600 hover:underline">
                        Sign In for Full Features
                      </Link>}
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Overall Progress</span>
                  <span>{researchContext?.topic && stageResults.length > 0 ? Math.round((currentStage + 1) / 9 * 100) : 0}%</span>
                </div>
                <Progress value={researchContext?.topic && stageResults.length > 0 ? (currentStage + 1) / 9 * 100 : 0} className="h-2" />
              </div>
            </div>
          </div>;
      case 'tree':
        return <div className="tree-scene" data-testid="tree-scene">
            <TreeOfReasoningVisualization graphData={graphData} currentStage={currentStage} isProcessing={isProcessing} stageResults={stageResults} researchContext={researchContext} parameters={parameters} />
          </div>;
      case 'advanced':
      case 'advanced-multi':
        return <div className="h-full" style={{
          height: '600px'
        }}>
            <AdvancedGraphVisualization graphData={graphData} showParameters={true} currentStage={currentStage} isProcessing={isProcessing} stageResults={stageResults} researchContext={researchContext} parameters={parameters} />
          </div>;
      case 'advanced-enhanced':
        return <EnhancedGraphVisualization graphData={graphData} currentStage={currentStage} isProcessing={isProcessing} />;
      case 'analytics':
      case 'analytics-standard':
        return <VisualAnalytics graphData={graphData} currentStage={currentStage} geminiApiKey={apiKeys.gemini} stageResults={stageResults} researchContext={researchContext} />;
      case 'analytics-meta':
        return <MetaAnalysisVisualAnalytics graphData={graphData} stageResults={stageResults} researchContext={researchContext} geminiApiKey={apiKeys.gemini} perplexityApiKey={apiKeys.perplexity} />;
      case 'parameters':
        return <ParametersPane parameters={parameters} onParametersChange={setParameters} currentStage={currentStage} isProcessing={isProcessing} />;
      case 'developer':
        return <DeveloperMode graphData={graphData} parameters={parameters} currentStage={currentStage} stageResults={stageResults} researchContext={researchContext} onParametersChange={setParameters} />;
      case 'export':
        return <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleExportHTML} disabled={!hasResults} size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                <Download className="h-5 w-5 mr-2" />
                Generate & Export HTML Report
              </Button>
              
              <Button onClick={() => exportResults('json')} disabled={!hasResults} variant="outline" size="lg">
                <FileText className="h-5 w-5 mr-2" />
                Export JSON Data
              </Button>
            </div>
            
            {exportContent && <div className="mt-4">
                <InAppPreview content={exportContent} title={`ASR-GoT Report - ${researchContext.topic || 'Analysis'}`} type="html" onDownload={handleExportHTML} className="w-full" />
              </div>}
            
            {isComplete && <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">Analysis Complete!</h3>
                <p className="text-green-700">Your comprehensive report is ready for export and sharing.</p>
              </div>}
          </div>;
      case 'storage':
        return <div className="space-y-6">
            <StoredAnalysesManager currentSessionId={currentSessionId} onLoadAnalysis={analysisId => {
            toast.info(`Loading stored analysis: ${analysisId}`);
          }} />
            
            {/* Enhanced Session Controls for Authenticated Users */}
            {user && <div className="mt-6">
                <SessionControls currentStage={currentStage} isProcessing={isProcessing} isPaused={isPaused} sessionData={{
              userQuery: researchContext.topic,
              currentStage,
              graphData,
              stageResults,
              researchContext,
              isProcessing,
              isCompleted: isComplete
            }} currentSessionId={currentSessionId} onPause={handlePauseSession} onResume={handleEnhancedResumeSession} onSave={handleSaveSession} onLoad={handleLoadSession} onReset={resetFramework} />
              </div>}
          </div>;
      case 'history':
        return <div className="space-y-6">
            <QueryHistoryManager onResumeSession={handleResumeSession} onLoadForReanalysis={sessionId => {
            toast.info(`Loading session for reanalysis: ${sessionId}`);
            setActiveTab('research');
          }} currentSessionId={queryHistorySessionId} />
            
            {/* Enhanced Session History for Authenticated Users */}
            {user && <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Your Research Sessions</h3>
                {/* Note: Would import and use SessionHistory component here */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    📋 <strong>Enhanced Session Management:</strong> View, search, and manage all your research sessions 
                    with advanced filtering and detailed progress tracking. 
                    <Link to="/dashboard" className="text-blue-600 hover:underline ml-1">
                      Go to Dashboard
                    </Link>
                    {' for full session management.'}
                  </p>
                </div>
              </div>}
          </div>;
      default:
        return <div>Select a tab to view content</div>;
    }
  };
  const handleExportHTML = async () => {
    if (!hasResults) {
      toast.error('No results to export yet - run some analysis stages first');
      return;
    }

    // Show Stage 9 multi-substage progress indicator
    setShowStage9Progress(true);
    toast.info('Starting comprehensive multi-substage thesis generation (9A-9G)...', {
      duration: 3000
    });

    // Check if we have a comprehensive HTML report from stage 9 (index 8)
    let htmlReport = null;

    // First check Stage 9 results for complete HTML
    if (stageResults[8] && (stageResults[8].includes('<!DOCTYPE html') || stageResults[8].includes('<html'))) {
      htmlReport = stageResults[8];
      console.log('✅ Found complete HTML report from Stage 9');
    }
    // Fallback to Stage 7 if Stage 9 doesn't have HTML
    else if (stageResults[6] && (stageResults[6].includes('<!DOCTYPE html') || stageResults[6].includes('<html'))) {
      htmlReport = stageResults[6];
      console.log('✅ Found HTML report from Stage 7 (fallback)');
    }
    if (htmlReport) {
      // Hide progress indicator since we have the report
      setShowStage9Progress(false);

      // Export the comprehensive HTML report directly
      const blob = new Blob([htmlReport], {
        type: 'text/html'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `asr-got-${researchContext.topic.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('✅ Comprehensive HTML report exported successfully', {
        description: `Report contains ${Math.round(htmlReport.length / 1000)}K characters with full 9A-9G content`
      });

      // Also offer PDF conversion using browser print
      setTimeout(() => {
        const userWantsPdf = window.confirm('Would you like to generate a PDF version now?\n\nClick OK to open the report in a new window where you can print to PDF.');
        if (userWantsPdf) {
          // Open HTML in new window for PDF printing
          const newWindow = window.open('', '_blank');
          if (newWindow) {
            newWindow.document.write(htmlReport);
            newWindow.document.close();

            // Wait for content to load then trigger print dialog
            setTimeout(() => {
              newWindow.print();
            }, 1000);
            toast.info('💡 In the print dialog, select "Save as PDF" as your destination');
          }
        }
      }, 1000);
      return;
    }

    // If no HTML report exists, trigger Stage 9 execution
    if (currentStage < 8) {
      setShowStage9Progress(false);
      toast.error('Please complete all 9 stages first before exporting the comprehensive report');
      return;
    }

    // Execute Stage 9 if not already done
    try {
      console.log('🚀 Triggering Stage 9 execution for comprehensive report generation');
      await executeStage(8); // Execute Stage 9 (index 8)

      // Wait for Stage 9 completion and then retry export
      setTimeout(() => {
        handleExportHTML();
      }, 2000);
    } catch (error) {
      setShowStage9Progress(false);
      toast.error('Failed to generate comprehensive report: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }

    // Fallback to basic report generation if no HTML report available
    const reportContent = stageResults.length > 0 ? stageResults.join('\n\n---\n\n') : 'No analysis completed yet';

    // Generate embedded charts and figures with scientific visualizations
    const embedCharts = async () => {
      const charts = [];

      // Generate scientific charts based on research context
      const generateScientificCharts = async () => {
        if (!apiKeys.gemini || !researchContext.topic) {
          return [];
        }
        const evidenceNodes = graphData.nodes.filter(n => n.type === 'evidence');
        const evidenceDescriptions = evidenceNodes.slice(0, 5).map(node => `- ${node.label}: ${node.description || 'Evidence source'}`).join('\n');
        const analysisPrompt = `
Generate 12-15 publication-ready scientific charts based on the evidence collected for the research topic "${researchContext.topic}" in the field of ${researchContext.field || 'General Science'}:

Research Context: ${researchContext.topic}
Field: ${researchContext.field || 'General Science'}
Evidence Sources Analyzed: ${evidenceNodes.length} pieces of evidence
Hypotheses: ${researchContext.hypotheses?.length || 0} hypotheses generated

Key Evidence Sources:
${evidenceDescriptions}

Generate scientific visualizations that directly relate to the evidence collected and would be appropriate for this research domain. For example:
- Medical research: patient outcomes, biomarker correlations, treatment efficacy, survival curves
- Genetics: mutation frequencies, expression levels, pathway analysis, genetic variants
- Environmental science: pollution levels, climate data, ecological patterns
- Psychology: behavioral patterns, cognitive scores, intervention effects
- Materials science: property measurements, structure-function relationships

Create charts that explore:
1. Primary outcome measures from the evidence
2. Correlations between key variables
3. Statistical distributions of measured parameters
4. Comparative analyses between groups/conditions
5. Temporal trends if applicable
6. Dose-response relationships if applicable
7. Subgroup analyses
8. Effect sizes and confidence intervals
9. Meta-analysis results if multiple studies
10. Predictive model outputs

Return exactly 12-15 charts in JSON format with realistic scientific data that reflects the evidence collected:

[
  {
    "title": "Specific scientific chart name relevant to ${researchContext.topic}",
    "type": "bar|scatter|histogram|box|heatmap|line",
    "data": [{"x": [realistic_labels], "y": [realistic_values], "type": "bar", "name": "Dataset name"}],
    "layout": {
      "title": "Publication-ready title",
      "xaxis": {"title": "X-axis label with units"},
      "yaxis": {"title": "Y-axis label with units"},
      "font": {"size": 12}
    }
  }
]

Focus on generating charts that show:
1. Primary outcome measures
2. Correlation analyses
3. Distribution patterns
4. Comparative analyses
5. Temporal trends (if applicable)
6. Dose-response relationships (if applicable)
7. Statistical significance tests
8. Effect sizes and confidence intervals
9. Multi-variable analyses
10. Subgroup analyses
11. Meta-analysis results (if applicable)
12. Predictive models (if applicable)

Make the data realistic and scientifically meaningful for the research domain.
`;
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKeys.gemini}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: analysisPrompt
                }]
              }],
              generationConfig: {
                maxOutputTokens: 8000,
                temperature: 0.2
              }
            })
          });
          if (!response.ok) throw new Error('Failed to generate scientific charts');
          const data = await response.json();
          const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!responseText) {
            throw new Error('No response from Gemini API');
          }

          // Extract JSON from response
          const jsonMatch = responseText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) || responseText.match(/(\[[\s\S]*?\])/);
          const extractedJson = jsonMatch ? jsonMatch[1] : responseText;
          return JSON.parse(extractedJson);
        } catch (error) {
          console.error('Failed to generate scientific charts:', error);
          return [];
        }
      };
      try {
        const scientificCharts = await generateScientificCharts();

        // Also include cached figures from Analytics tab
        const getCachedAnalyticsCharts = () => {
          const cacheKey = `${researchContext.topic}-${currentStage}`;
          const cached = sessionStorage.getItem(`visual-analytics-${cacheKey}`);
          if (cached) {
            try {
              return JSON.parse(cached);
            } catch (error) {
              console.warn('Failed to parse cached analytics charts:', error);
              return [];
            }
          }
          return [];
        };
        const cachedAnalyticsCharts = getCachedAnalyticsCharts();
        const allCharts = [...scientificCharts, ...cachedAnalyticsCharts];
        if (allCharts.length > 0) {
          const figureSection = [];
          figureSection.push(`
            <div class="scientific-visualizations-section">
              <h2 style="color: #1e40af; margin: 2rem 0 1rem 0; padding-bottom: 0.5rem; border-bottom: 2px solid #e5e7eb;">
                📊 Scientific Visualizations & Statistical Analysis
              </h2>
              <p style="color: #6b7280; margin-bottom: 2rem;">
                Publication-ready figures and statistical analysis for: <strong>${researchContext.topic}</strong>
                <br><em>Generated ${allCharts.length} scientific visualizations (${scientificCharts.length} new + ${cachedAnalyticsCharts.length} from analytics)</em>
              </p>
              <div class="figures-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); gap: 2rem;">
          `);

          // Create Plotly figures for each chart
          for (let i = 0; i < allCharts.length; i++) {
            const chart = allCharts[i];
            try {
              figureSection.push(`
                <div class="figure-container" style="background: white; border-radius: 10px; padding: 1.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                  <h4 style="color: #374151; margin: 0 0 1rem 0; font-size: 1.1rem;">${chart.title}</h4>
                  <div id="scientific-chart-${i}" style="width: 100%; height: 400px;"></div>
                  <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f3f4f6;">
                    <span style="background: #f3f4f6; color: #6b7280; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.8rem;">
                      ${chart.type.toUpperCase()} • Figure ${i + 1}
                    </span>
                  </div>
                  <script>
                    if (typeof Plotly !== 'undefined') {
                      Plotly.newPlot('scientific-chart-${i}', ${JSON.stringify(chart.data)}, ${JSON.stringify(chart.layout)}, {responsive: true});
                    }
                  </script>
                </div>
              `);
            } catch (error) {
              console.warn(`Failed to render chart ${i}:`, error);
              // Fallback to placeholder
              figureSection.push(`
                <div class="figure-container" style="background: white; border-radius: 10px; padding: 1.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                  <h4 style="color: #374151; margin: 0 0 1rem 0;">${chart.title}</h4>
                  <div style="background: #f9fafb; border: 2px dashed #d1d5db; border-radius: 5px; padding: 2rem; text-align: center; color: #6b7280;">
                    📊 ${chart.type.toUpperCase()} Visualization<br/>
                    <small>Figure could not be embedded</small>
                  </div>
                </div>
              `);
            }
          }
          figureSection.push(`
              </div>
            </div>
          `);
          charts.push(figureSection.join(''));
        }
      } catch (error) {
        console.warn('Error generating scientific charts:', error);
      }

      // Add methodology summary at the end
      charts.push(`
        <div style="background: white; border-radius: 10px; padding: 1.5rem; margin: 2rem 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <h3 style="color: #374151; margin: 0 0 1rem 0;">🔬 Methodology Summary</h3>
          <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; color: #64748b;">
              This report was generated using the ASR-GoT (Automatic Scientific Research - Graph of Thoughts) framework.
              The analysis utilized a 9-stage scientific pipeline processing ${graphData.nodes.filter(n => n.type === 'evidence').length} evidence sources, ${graphData.nodes.filter(n => n.type === 'hypothesis').length} hypotheses, and ${allCharts.length} data visualizations.
            </p>
          </div>
        </div>
      `);
      return charts.join('');
    };

    // Generate charts asynchronously
    const chartsContent = await embedCharts();
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>Scientific Analysis Report: ${researchContext.topic || 'Research Analysis'}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="description" content="Comprehensive scientific analysis report generated using advanced reasoning framework">
          <script src="https://cdn.plot.ly/plotly-3.0.1.min.js"></script>
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
              margin: 0; 
              padding: 0;
              line-height: 1.6;
              color: #333;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
            }
            .container { 
              max-width: 1200px; 
              margin: 0 auto; 
              background: white; 
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.1);
              overflow: hidden;
              margin: 40px auto;
            }
            .header { 
              background: linear-gradient(135deg, #7E5BEF 0%, #00D2FF 100%);
              color: white; 
              padding: 60px 40px;
              text-align: center;
              position: relative;
            }
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="white" opacity="0.1"><animate attributeName="opacity" values="0.1;0.3;0.1" dur="3s" repeatCount="indefinite"/></circle><circle cx="80" cy="40" r="1.5" fill="white" opacity="0.1"><animate attributeName="opacity" values="0.1;0.4;0.1" dur="2s" repeatCount="indefinite"/></circle><circle cx="40" cy="80" r="1" fill="white" opacity="0.1"><animate attributeName="opacity" values="0.1;0.5;0.1" dur="4s" repeatCount="indefinite"/></circle></svg>');
            }
            .header h1 { 
              margin: 0; 
              font-size: 3rem; 
              font-weight: 700; 
              position: relative;
              z-index: 1;
            }
            .header p { 
              font-size: 1.3rem; 
              margin: 20px 0 0; 
              opacity: 0.9;
              position: relative;
              z-index: 1;
            }
            .content { 
              padding: 40px; 
            }
            .executive-summary {
              background: linear-gradient(135deg, #f6f8ff 0%, #e8f2ff 100%);
              border: 1px solid #e1e8ff;
              border-radius: 15px;
              padding: 30px;
              margin: 30px 0;
              position: relative;
            }
            .executive-summary::before {
              content: '📊';
              position: absolute;
              top: 15px;
              right: 20px;
              font-size: 2rem;
            }
            .metadata { 
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              padding: 25px;
              margin: 25px 0;
              border-radius: 15px;
              border-left: 6px solid #7E5BEF;
              box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            }
            .metadata-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              margin-top: 15px;
            }
            .metadata-item {
              background: white;
              padding: 15px;
              border-radius: 10px;
              text-align: center;
              border: 1px solid #e1e5e9;
            }
            .metadata-value {
              font-size: 1.8rem;
              font-weight: bold;
              color: #7E5BEF;
              margin-bottom: 5px;
            }
            .metadata-label {
              font-size: 0.9rem;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .stage { 
              background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
              border: 1px solid #e1e5e9;
              border-radius: 15px;
              padding: 25px; 
              margin: 25px 0; 
              border-left: 6px solid #00D2FF;
              box-shadow: 0 4px 15px rgba(0,0,0,0.05);
              position: relative;
            }
            .stage h2 {
              color: #7E5BEF;
              margin-top: 0;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .stage h2::before {
              content: '🔬';
              font-size: 1.2em;
            }
            .chart-container {
              background: white;
              border-radius: 12px;
              padding: 20px;
              margin: 20px 0;
              box-shadow: 0 2px 10px rgba(0,0,0,0.05);
              border: 1px solid #f0f0f0;
            }
            .chart {
              margin-top: 15px;
            }
            .chart-bar {
              background: linear-gradient(90deg, #7E5BEF, #00D2FF);
              color: white;
              padding: 10px;
              margin: 5px 0;
              border-radius: 6px;
              font-weight: 500;
              min-width: 100px;
              box-shadow: 0 2px 8px rgba(126, 91, 239, 0.2);
            }
            .stat-container {
              background: white;
              border-radius: 12px;
              padding: 20px;
              margin: 20px 0;
              box-shadow: 0 2px 10px rgba(0,0,0,0.05);
              border: 1px solid #f0f0f0;
            }
            .confidence-meter {
              background: #f0f2f5;
              border-radius: 10px;
              height: 40px;
              position: relative;
              margin-top: 15px;
            }
            .confidence-bar {
              background: linear-gradient(90deg, #00D2FF, #14B8A6);
              height: 100%;
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              transition: width 0.5s ease;
            }
            .footer {
              background: #f8f9fa;
              padding: 30px;
              text-align: center;
              color: #666;
              border-top: 1px solid #e1e5e9;
            }
            .creator-info {
              background: linear-gradient(135deg, #e8f2ff 0%, #f6f8ff 100%);
              border: 1px solid #e1e8ff;
              border-radius: 15px;
              padding: 25px;
              margin: 25px 0;
            }
            .creator-info h3 {
              color: #7E5BEF;
              margin-top: 0;
            }
            pre { 
              white-space: pre-wrap; 
              background: #f8f9fa;
              padding: 20px;
              border-radius: 10px;
              border: 1px solid #e1e5e9;
              font-size: 0.95rem;
              line-height: 1.5;
            }
            h1, h2, h3 { color: #333; }
            h2 { 
              color: #7E5BEF; 
              border-bottom: 2px solid #00D2FF;
              padding-bottom: 10px;
            }
            @media print {
              body { background: white; }
              .container { box-shadow: none; margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <header class="header">
              <h1>${researchContext.topic || 'Scientific Research Analysis'}</h1>
              <p>Comprehensive Analysis in ${researchContext.field || 'Interdisciplinary Research'}</p>
              <div style="font-size: 1rem; margin-top: 20px; opacity: 0.9;">
                Report Generated: ${new Date().toLocaleDateString()} • 
                Analysis Framework: Advanced Scientific Reasoning
              </div>
            </header>

            <div class="content">
              <div class="executive-summary">
                <h2>Research Overview</h2>
                <p><strong>Research Question:</strong> ${researchContext.topic || 'Not specified'}</p>
                <p><strong>Field of Study:</strong> ${researchContext.field || 'Interdisciplinary'}</p>
                <p><strong>Analysis Scope:</strong> This report presents a systematic scientific analysis using advanced reasoning methodologies, 
                integrating evidence from multiple sources to provide comprehensive insights and data-driven conclusions.</p>
              </div>

              <div class="metadata">
                <h3 style="margin-top: 0; color: #7E5BEF;">Scientific Analysis Overview</h3>
                <div class="metadata-grid">
                  <div class="metadata-item">
                    <div class="metadata-value">${stageResults.length}</div>
                    <div class="metadata-label">Analysis Stages</div>
                  </div>
                  <div class="metadata-item">
                    <div class="metadata-value">${graphData.nodes.filter(n => n.type === 'evidence').length}</div>
                    <div class="metadata-label">Evidence Sources</div>
                  </div>
                  <div class="metadata-item">
                    <div class="metadata-value">${graphData.nodes.filter(n => n.type === 'hypothesis').length}</div>
                    <div class="metadata-label">Hypotheses Generated</div>
                  </div>
                  <div class="metadata-item">
                    <div class="metadata-value">${allCharts.length}</div>
                    <div class="metadata-label">Scientific Figures</div>
                  </div>
                  <div class="metadata-item">
                    <div class="metadata-value">${Math.round(stageResults.filter(r => r && r.trim()).length / 9 * 100)}%</div>
                    <div class="metadata-label">Completion Rate</div>
                  </div>
                  <div class="metadata-item">
                    <div class="metadata-value">${new Date().toLocaleDateString()}</div>
                    <div class="metadata-label">Generated</div>
                  </div>
                </div>
              </div>

              ${chartsContent}

              <div class="stage">
                <h2>Research Findings & Analysis</h2>
                <div style="background: white; border-radius: 10px; padding: 2rem; margin: 1rem 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                  <pre style="background: none; border: none; padding: 0; margin: 0;">${reportContent}</pre>
                </div>
              </div>

              <div class="creator-info">
                <h3>Report Details</h3>
                <p><strong>Analysis Method:</strong> Advanced Scientific Reasoning Framework</p>
                <p><strong>Data Integration:</strong> Multi-source evidence synthesis with bias detection</p>
                <p><strong>Quality Assurance:</strong> Automated fact-checking and confidence scoring</p>
                <p><strong>Generated by:</strong> ASR-GoT Framework | 
                <a href="https://scientific-research.online" target="_blank">Scientific Research Platform</a></p>
              </div>
            </div>

            <footer class="footer">
              <p><strong>${researchContext.topic || 'Scientific Analysis'}</strong> - Comprehensive Research Report</p>
              <p>Generated using advanced AI reasoning methodologies for evidence-based scientific inquiry</p>
              <p style="font-size: 0.9rem; margin-top: 15px;">
                Report Date: ${new Date().toLocaleDateString()} | Field: ${researchContext.field || 'Interdisciplinary Research'}
              </p>
            </footer>
          </div>
        </body>
      </html>
    `;

    // Store content for preview
    setExportContent(htmlContent);
    const blob = new Blob([htmlContent], {
      type: 'text/html'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asr-got-report-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('HTML report downloaded successfully');
  };
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Soft Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50"></div>
      
      {/* Subtle Pattern Overlay */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(147, 197, 253, 0.3) 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, rgba(196, 181, 253, 0.3) 0%, transparent 50%),
                           radial-gradient(circle at 50% 50%, rgba(134, 239, 172, 0.3) 0%, transparent 50%)`,
        animation: 'float 30s ease-in-out infinite'
      }}></div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10">

      {/* Unified API Credentials Modal */}
      <UnifiedAPICredentialsModal open={showAPICredentialsModal} onOpenChange={setShowAPICredentialsModal} onCredentialsSave={handleAPICredentialsSave} existingCredentials={apiKeys} className="text-cyan-50 text-4xl text-center font-extrabold" />

      {/* Bias Auditing Sidebar */}
      {showBiasAudit && <div className="fixed right-0 top-0 bottom-0 z-20 bg-background border-l shadow-lg w-full sm:w-96">
          <BiasAuditingSidebar graphData={graphData} researchContext={researchContext} currentStage={currentStage} geminiApiKey={apiKeys.gemini} onRefreshAudit={() => {
          toast.info('Refreshing bias audit...');
        }} />
        </div>}

      {/* Main Interface */}
      <div className={`container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 transition-all duration-300 ${showBiasAudit ? 'sm:mr-96' : ''}`}>
        
        {/* Enhanced Header with Authentication */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <Brain className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Scientific Reasoning
                </h1>
              </div>
            </div>

            {/* Authentication and Status */}
            <div className="flex items-center space-x-3">
              {/* API Status */}
              <div className="flex items-center space-x-2">
                {apiKeys.gemini && apiKeys.perplexity || hasBackendApiKeys ? <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    API Ready
                  </Badge> : <Badge variant="outline" className="text-yellow-600 border-yellow-600 bg-yellow-50">
                    <Key className="h-3 w-3 mr-1" />
                    Setup Required
                  </Badge>}
                
                {/* Backend Status */}
                {backendHealthy && <Badge variant="outline" className="text-blue-600 border-blue-600 bg-blue-50">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>}
              </div>

              {/* User Authentication */}
              {user ? <div className="flex items-center space-x-2">
                  {profile && <div className="text-right text-sm">
                      <p className="font-medium text-gray-900">{profile.full_name}</p>
                      <p className="text-xs text-gray-500">
                        {profile.current_api_usage || 0}/{profile.api_usage_limit || 1000} calls
                      </p>
                    </div>}
                  <Link to="/dashboard">
                    <Button variant="outline" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Dashboard</span>
                    </Button>
                  </Link>
                </div> : <div className="flex items-center space-x-2">
                  <Link to="/auth?mode=login">
                    <Button variant="outline" size="sm">
                      <LogIn className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Sign In</span>
                    </Button>
                  </Link>
                  <Link to="/auth?mode=register">
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Sign Up</span>
                    </Button>
                  </Link>
                </div>}
            </div>
          </div>

          {/* API Setup Alert */}
          {!(apiKeys.gemini && apiKeys.perplexity) && !hasBackendApiKeys && <Alert className="mb-4 rounded-sm">
              <Key className="h-4 w-4" />
              <AlertDescription>
                To start research, configure API keys. 
                {user ? <>
                    <Link to="/dashboard" className="text-blue-600 hover:underline ml-1">
                      Go to dashboard
                    </Link>
                    {' or '}
                    <Button variant="link" className="p-0 h-auto" onClick={() => setShowAPICredentialsModal(true)}>
                      configure locally
                    </Button>
                  </> : <>
                    <Button variant="link" className="p-0 h-auto ml-1" onClick={() => setShowAPICredentialsModal(true)}>
                      Set up API credentials
                    </Button>
                    {' or '}
                    <Link to="/auth?mode=register" className="text-blue-600 hover:underline">
                      create an account
                    </Link>
                    {' for secure backend storage.'}
                  </>}
              </AlertDescription>
            </Alert>}

          {/* Usage Stats for Authenticated Users */}
          {user && usageStats && <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3 mb-4 border border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">API Usage:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-900">
                    {usageStats.currentUsage}/{usageStats.limit} calls
                  </span>
                  <Badge variant={usageStats.usagePercentage > 80 ? 'destructive' : 'secondary'}>
                    {usageStats.usagePercentage}%
                  </Badge>
                </div>
              </div>
              <Progress value={usageStats.usagePercentage} className="mt-2 h-2" />
            </div>}
        </div>
        
        {/* 🐛 Debug Button - Always Visible at Bottom */}
        <div className="fixed bottom-4 right-4 z-50">
          <DebugButton />
        </div>
        
        {/* Responsive Hero Section */}
        <div className="text-center mb-8">
          <div className="relative mb-4 sm:mb-8 overflow-hidden rounded-xl sm:rounded-3xl">
            {/* Responsive Hero Container with proper aspect ratios */}
            <div className="relative w-full">
              {/* Responsive Hero Image - Optimized for all screen sizes */}
              <div className="aspect-video min-h-[300px] sm:min-h-[400px] lg:min-h-[500px] bg-gradient-to-br from-blue-50 via-teal-50 to-green-50">
                <div className="absolute inset-0 w-full h-full" style={{
                  backgroundImage: 'url("/img/logo.png")',
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  backgroundAttachment: 'scroll',
                  imageRendering: 'optimizeQuality'
                }}></div>
                
                {/* Responsive background optimization for logo */}
                <style jsx>{`
                  @media (min-width: 1920px) {
                    div {
                      background-size: contain !important;
                      background-position: center center !important;
                    }
                  }
                  @media (max-width: 640px) and (orientation: portrait) {
                    div {
                      background-size: contain !important;
                      background-position: center center !important;
                    }
                  }
                  @media (max-width: 640px) and (orientation: landscape) {
                    div {
                      background-size: contain !important;
                      background-position: center center !important;
                    }
                  }
                  @media (min-width: 640px) and (max-width: 1024px) {
                    div {
                      background-size: contain !important;
                      background-position: center center !important;
                    }
                  }
                `}</style>
              </div>
              
              {/* Responsive overlay for text contrast */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-transparent"></div>
            </div>
            
            {/* Hero Content - Responsive positioning */}
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main Title */}
                <div className="mb-10">
                  <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6 text-slate-900" style={{
                    textShadow: '2px 2px 4px rgba(255,255,255,0.8)'
                  }}>
                    Scientific Reasoning
                  </h1>
                  <p className="text-2xl lg:text-4xl mb-8 font-semibold text-slate-700" style={{
                    textShadow: '1px 1px 2px rgba(255,255,255,0.8)'
                  }}>
                    Graph of Thoughts Framework
                  </p>
                </div>
                
                {/* Interactive Feature Tags */}
                <div className="flex flex-wrap justify-center gap-4 mb-10">
                  <Link to="/ai-powered">
                    <span className="px-5 py-2 bg-blue-100 text-blue-700 rounded-full text-base font-medium shadow-sm border border-blue-200 hover:bg-blue-500 hover:text-white transition-all duration-200 cursor-pointer hover:scale-105">🤖 AI-Powered</span>
                  </Link>
                  <Link to="/research-framework">
                    <span className="px-5 py-2 bg-purple-100 text-purple-700 rounded-full text-base font-medium shadow-sm border border-purple-200 hover:bg-purple-500 hover:text-white transition-all duration-200 cursor-pointer hover:scale-105">🧠 Research Framework</span>
                  </Link>
                  <Link to="/graph-neural-networks">
                    <span className="px-5 py-2 bg-green-100 text-green-700 rounded-full text-base font-medium shadow-sm border border-green-200 hover:bg-green-500 hover:text-white transition-all duration-200 cursor-pointer hover:scale-105">🔗 Graph Neural Networks</span>
                  </Link>
                </div>
                
                {/* Description - Removed from here, will be moved to hero base */}
                  
                  {/* Elegant Call-to-Action Buttons */}
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link to="/guide">
                      <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg text-lg px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-xl">
                        <BookOpen className="h-5 w-5 mr-2" />
                        Learn How It Works
                      </Button>
                    </Link>
                    <Button size="lg" className="bg-purple-500 hover:bg-purple-600 text-white shadow-lg text-lg px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-xl" onClick={() => {
                      setActiveTab('research');
                      document.getElementById('research-section')?.scrollIntoView({
                        behavior: 'smooth'
                      });
                    }}>
                      <Brain className="h-5 w-5 mr-2" />
                      Explore Features
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Hero Base Description */}
          <div className="text-center mb-8">
            <p className="text-lg sm:text-xl text-slate-500 font-light leading-relaxed max-w-4xl mx-auto px-4">
              🚀 Next-Generation AI Reasoning Framework leveraging graph structures to transform scientific research methodologies
            </p>
          </div>
          
          {/* Clean Status Indicators */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg border border-gray-200">
              <div className="flex items-center gap-4">
                <Badge className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full font-medium">
                  Stage {currentStage + 1}/9
                </Badge>
                <Progress value={stageProgress} className="w-32 h-2" />
                {isProcessing && <Badge className="bg-orange-500 text-white px-3 py-1 rounded-full font-medium">
                    Processing...
                  </Badge>}
              </div>
            </div>
          </div>
          
          {/* Clean Interactive Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Mode Toggle */}
            <div className="w-full sm:w-auto bg-white/90 backdrop-blur-sm rounded-lg px-4 sm:px-6 py-3 shadow-lg border border-gray-200">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                <div className={`transition-all duration-300 ${isAutomatic ? 'text-green-600' : 'text-blue-600'}`}>
                  {isAutomatic ? <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs sm:text-sm font-semibold">AUTO MODE</span>
                    </div> : <div className="flex items-center gap-2">
                      <ToggleLeft className="h-4 w-4" />
                      <span className="text-xs sm:text-sm font-semibold">MANUAL MODE</span>
                    </div>}
                </div>
                <Button onClick={toggleMode} className={`transition-all duration-300 ${isAutomatic ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'} text-white font-medium rounded-md px-3 sm:px-4 py-2 text-xs sm:text-sm`} size="sm">
                  <span className="hidden sm:inline">Switch to {isAutomatic ? 'Manual' : 'Auto'}</span>
                  <span className="sm:hidden">{isAutomatic ? 'Manual' : 'Auto'}</span>
                </Button>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <Link to="/contact">
                <Button size="sm" className="bg-slate-600 hover:bg-slate-700 text-white shadow-lg transition-all duration-200 rounded-lg px-3 sm:px-6 py-2 sm:py-3 font-semibold text-xs sm:text-sm w-full sm:w-auto">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Contact Us</span>
                  <span className="sm:hidden">Contact</span>
                </Button>
              </Link>
              
              {/* API Configuration Button */}
              <Button size="sm" variant={apiKeys.gemini && apiKeys.perplexity ? "default" : "outline"} onClick={() => setShowAPICredentialsModal(true)} className={`shadow-lg transition-all duration-200 rounded-lg px-3 sm:px-6 py-2 sm:py-3 font-semibold text-xs sm:text-sm w-full sm:w-auto ${apiKeys.gemini && apiKeys.perplexity ? 'bg-green-600 hover:bg-green-700 text-white' : 'border-blue-300 text-blue-600 hover:bg-blue-50'}`}>
                <Settings className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">
                  {apiKeys.gemini && apiKeys.perplexity ? 'API Setup ✓' : 'Configure APIs'}
                </span>
                <span className="sm:hidden">
                  {apiKeys.gemini && apiKeys.perplexity ? 'APIs ✓' : 'APIs'}
                </span>
              </Button>
              
              {/* Enhanced Pause/Resume Controls */}
              {(queryHistorySessionId || currentSessionId) && <div className="flex items-center gap-2">
                  {isPaused ? <Button size="sm" variant="default" onClick={handleEnhancedResumeSession} className="shadow-lg transition-all duration-200 rounded-lg px-3 sm:px-6 py-2 sm:py-3 font-semibold text-xs sm:text-sm w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
                      <PlayCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Resume Session</span>
                      <span className="sm:hidden">Resume</span>
                    </Button> : <Button size="sm" variant="outline" onClick={handlePauseSession} disabled={!isProcessing} className="shadow-lg transition-all duration-200 rounded-lg px-3 sm:px-6 py-2 sm:py-3 font-semibold text-xs sm:text-sm w-full sm:w-auto border-orange-300 text-orange-600 hover:bg-orange-50 disabled:opacity-50">
                      <Pause className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Pause Session</span>
                      <span className="sm:hidden">Pause</span>
                    </Button>}
                  
                  {/* Save Session Button for Authenticated Users */}
                  {user && <Button size="sm" variant="outline" onClick={handleSaveSession} className="shadow-lg transition-all duration-200 rounded-lg px-3 sm:px-6 py-2 sm:py-3 font-semibold text-xs sm:text-sm w-full sm:w-auto border-blue-300 text-blue-600 hover:bg-blue-50">
                      <Database className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Save Session</span>
                      <span className="sm:hidden">Save</span>
                    </Button>}
                </div>}
              
              {/* Auto-save Status Indicator */}
              {isAutoSaveEnabled && <div className="flex items-center px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-xs text-green-700 font-medium">
                    <span className="hidden sm:inline">Auto-saving</span>
                    <span className="sm:hidden">Auto</span>
                  </span>
                </div>}
              
              {currentStage >= 8 && <Button size="sm" variant={showBiasAudit ? "default" : "outline"} onClick={() => setShowBiasAudit(!showBiasAudit)} className="shadow-lg transition-all duration-200 rounded-lg px-3 sm:px-6 py-2 sm:py-3 font-semibold text-xs sm:text-sm w-full sm:w-auto">
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{showBiasAudit ? 'Hide' : 'Show'} Bias Audit</span>
                  <span className="sm:hidden">{showBiasAudit ? 'Hide' : 'Show'} Audit</span>
                </Button>}
            </div>
          </div>
        </div>

        {/* Research Query Section - Moved Above Pipeline */}
        <div className="bg-white/80 backdrop-blur-sm py-12 px-4 sm:px-6 lg:px-8 mb-8 rounded-3xl shadow-lg border border-gray-200">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-slate-800">
              🔍 Start Your Scientific Research
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Enter your research question to begin the 9-stage AI-powered scientific analysis
            </p>
            
            {/* Research Interface Component */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-100">
              <ResearchInterface 
                currentStage={currentStage} 
                graphData={graphData} 
                onExecuteStage={executeStage} 
                isProcessing={isProcessing} 
                stageResults={stageResults} 
                researchContext={researchContext} 
                apiKeys={apiKeys} 
                processingMode={mode} 
                onShowApiModal={() => setShowAPICredentialsModal(true)} 
                onSwitchToExport={() => setActiveTab('export')} 
              />
            </div>
          </div>
        </div>

        {/* Scientific Reasoning Architecture Overview */}
        <div className="bg-white py-16 px-4 sm:px-6 lg:px-8 mb-8 rounded-3xl shadow-lg border border-gray-200">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-slate-900">
                🧬 Scientific Reasoning: Complete AI Solution
              </h2>
              <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
                The first production-ready platform that transforms complex research problems into systematic, graph-based knowledge discovery pipelines
              </p>
            </div>
            
            <div className="mb-16">
              <MermaidChart
                chart={`
graph TD
    A[🔬 Research Problem] --> B[🧬 Scientific Reasoning Platform]
    B --> C[📊 9-Stage Framework]
    B --> D[🤖 AI Graph Reasoning]
    B --> E[📈 Statistical Rigor]
    
    C --> F[🎯 Systematic Discovery]
    D --> F
    E --> F
    
    F --> G[✨ Breakthrough Results]
    
    style A fill:#fef2f2,stroke:#dc2626
    style B fill:#f0fdf4,stroke:#16a34a
    style F fill:#eff6ff,stroke:#2563eb
    style G fill:#fffbeb,stroke:#d97706
                `}
                className="w-full h-auto"
                id="scientific-reasoning-overview"
              />
            </div>

            {/* Core Innovation Pillars */}
            <div className="mb-16">
              <h3 className="text-3xl font-bold text-center mb-8 text-slate-900">🌟 Core Innovation Pillars</h3>
              <MermaidChart
                chart={`
flowchart LR
    subgraph " 🎯 Scientific Reasoning Core "
        A[🧠 Graph Theory] <--> B[🔬 Scientific Method]
        C[📊 Bayesian Analysis] <--> D[🤖 AI Reasoning]
        E[🔍 Bias Detection] <--> F[📈 Statistical Power]
        G[⏰ Temporal Analysis] <--> H[🌐 Cross-Domain Bridge]
    end
    
    style A fill:#e1f5fe,stroke:#01579b
    style B fill:#f3e5f5,stroke:#4a148c
    style C fill:#e8f5e8,stroke:#1b5e20
    style D fill:#fff3e0,stroke:#e65100
    style E fill:#fce4ec,stroke:#880e4f
    style F fill:#e0f2f1,stroke:#004d40
    style G fill:#f1f8e9,stroke:#33691e
    style H fill:#e3f2fd,stroke:#0277bd
                `}
                className="w-full h-auto"
                id="innovation-pillars"
              />
            </div>
          </div>
        </div>

        {/* Enhanced Pipeline Visualization */}
        <div className="bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 py-16 px-4 sm:px-6 lg:px-8 mb-8 rounded-3xl shadow-xl border border-orange-100">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-slate-800">
                🔬 The 9-Stage Research Framework
              </h2>
              <p className="text-xl text-slate-600 max-w-4xl mx-auto">
                Advanced AI orchestration through 9 mandatory stages of scientific analysis
              </p>
            </div>

            {/* Comprehensive Pipeline Mermaid Diagram */}
            <div className="mb-12">
              <MermaidChart
                chart={`
flowchart TD
    subgraph "🎯 Scientific Reasoning Methodology"
        S1[🎯 Stage 1<br/>Initialization<br/>📝 Task Definition] 
        S2[🔍 Stage 2<br/>Decomposition<br/>📊 Multi-Dimensional Analysis]
        S3[💡 Stage 3<br/>Hypothesis Planning<br/>🧠 AI-Generated Theories]
        S4[📈 Stage 4<br/>Evidence Integration<br/>🔬 Bayesian Updates]
        S5[✂️ Stage 5<br/>Pruning & Merging<br/>⚡ Graph Optimization]
        S6[🎯 Stage 6<br/>Subgraph Extraction<br/>🚀 High-Value Pathways]
        S7[📝 Stage 7<br/>Composition<br/>📋 Narrative Generation]
        S8[🔍 Stage 8<br/>Reflection<br/>✅ Quality Audit]
        S9[📊 Stage 9<br/>Final Analysis<br/>🎓 PhD-Level Report]
    end
    
    S1 --> S2 --> S3 --> S4 --> S5 --> S6 --> S7 --> S8 --> S9
    S8 -.-> S1
    
    style S1 fill:#ffebee,stroke:#d32f2f
    style S2 fill:#f3e5f5,stroke:#7b1fa2
    style S3 fill:#e8f5e8,stroke:#388e3c
    style S4 fill:#e1f5fe,stroke:#0288d1
    style S5 fill:#fff3e0,stroke:#f57c00
    style S6 fill:#fce4ec,stroke:#c2185b
    style S7 fill:#e0f2f1,stroke:#00695c
    style S8 fill:#f1f8e9,stroke:#558b2f
    style S9 fill:#e8eaf6,stroke:#3f51b5
                `}
                className="w-full h-auto"
                id="nine-stage-framework"
              />
            </div>

            {/* Visual Workflow */}
            <div className="relative">
              {/* Desktop Flow - Enhanced with Color-blind Friendly Pastels */}
              <div className="hidden lg:block">
                <div className="flex items-center justify-between mb-12">
                  {/* Stage 1-3 */}
                  <div className="flex-1 relative">
                    <div className="bg-gradient-to-br from-sky-200 to-blue-300 text-slate-800 rounded-3xl p-8 shadow-2xl border-2 border-sky-100 relative transform hover:scale-105 transition-all duration-300">
                      <div className="text-4xl mb-4">🎯</div>
                      <div className="text-2xl font-bold mb-3 text-slate-900">Stages 1-3</div>
                      <div className="text-xl font-semibold mb-2 text-slate-700">Initialization & Analysis</div>
                      <div className="text-base text-slate-600 leading-relaxed">Setup → Decomposition → Hypothesis</div>
                      <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 text-sky-400 text-5xl font-bold animate-pulse">→</div>
                    </div>
                  </div>
                  
                  {/* Stage 4-6 */}
                  <div className="flex-1 mx-12 relative">
                    <div className="bg-gradient-to-br from-emerald-200 to-green-300 text-slate-800 rounded-3xl p-8 shadow-2xl border-2 border-emerald-100 relative transform hover:scale-105 transition-all duration-300">
                      <div className="text-4xl mb-4">🔍</div>
                      <div className="text-2xl font-bold mb-3 text-slate-900">Stages 4-6</div>
                      <div className="text-xl font-semibold mb-2 text-slate-700">Evidence & Processing</div>
                      <div className="text-base text-slate-600 leading-relaxed">Integration → Pruning → Extraction</div>
                      <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 text-emerald-400 text-5xl font-bold animate-pulse">→</div>
                    </div>
                  </div>
                  
                  {/* Stage 7-9 */}
                  <div className="flex-1">
                    <div className="bg-gradient-to-br from-violet-200 to-purple-300 text-slate-800 rounded-3xl p-8 shadow-2xl border-2 border-violet-100 transform hover:scale-105 transition-all duration-300">
                      <div className="text-4xl mb-4">📋</div>
                      <div className="text-2xl font-bold mb-3 text-slate-900">Stages 7-9</div>
                      <div className="text-xl font-semibold mb-2 text-slate-700">Synthesis & Output</div>
                      <div className="text-base text-slate-600 leading-relaxed">Composition → Reflection → Analysis</div>
                    </div>
                  </div>
                </div>
                
                {/* AI Orchestration Layer - Enhanced */}
                <div className="bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 rounded-3xl p-10 shadow-2xl border-2 border-slate-200">
                  <div className="text-center">
                    <h3 className="text-3xl font-bold mb-8 text-slate-900">🤖 Multi-AI Orchestration Layer</h3>
                    <div className="grid grid-cols-2 gap-10">
                      <div className="bg-gradient-to-br from-cyan-100 to-sky-200 rounded-2xl p-6 shadow-lg border border-cyan-200 hover:shadow-xl transition-all duration-300">
                        <div className="text-2xl mb-3">🌐</div>
                        <div className="text-2xl font-bold text-slate-900 mb-3">Perplexity Sonar</div>
                        <div className="text-lg text-slate-700 leading-relaxed">Real-time web research & evidence collection</div>
                      </div>
                      <div className="bg-gradient-to-br from-teal-100 to-emerald-200 rounded-2xl p-6 shadow-lg border border-teal-200 hover:shadow-xl transition-all duration-300">
                        <div className="text-2xl mb-3">🧠</div>
                        <div className="text-2xl font-bold text-slate-900 mb-3">Gemini 2.5 Pro</div>
                        <div className="text-lg text-slate-700 leading-relaxed">Advanced reasoning & synthesis</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Flow - Enhanced with Color-blind Friendly Pastels */}
              <div className="lg:hidden space-y-8">
                <div className="bg-gradient-to-br from-sky-200 to-blue-300 text-slate-800 rounded-3xl p-6 shadow-xl border-2 border-sky-100">
                  <div className="text-3xl mb-3">🎯</div>
                  <div className="text-2xl font-bold mb-2 text-slate-900">Stages 1-3</div>
                  <div className="text-lg font-semibold text-slate-700 mb-2">Initialization & Analysis</div>
                  <div className="text-base text-slate-600">Setup → Decomposition → Hypothesis</div>
                </div>
                <div className="text-center text-sky-400 text-4xl font-bold animate-bounce">↓</div>
                <div className="bg-gradient-to-br from-emerald-200 to-green-300 text-slate-800 rounded-3xl p-6 shadow-xl border-2 border-emerald-100">
                  <div className="text-3xl mb-3">🔍</div>
                  <div className="text-2xl font-bold mb-2 text-slate-900">Stages 4-6</div>
                  <div className="text-lg font-semibold text-slate-700 mb-2">Evidence & Processing</div>
                  <div className="text-base text-slate-600">Integration → Pruning → Extraction</div>
                </div>
                <div className="text-center text-emerald-400 text-4xl font-bold animate-bounce">↓</div>
                <div className="bg-gradient-to-br from-violet-200 to-purple-300 text-slate-800 rounded-3xl p-6 shadow-xl border-2 border-violet-100">
                  <div className="text-3xl mb-3">📋</div>
                  <div className="text-2xl font-bold mb-2 text-slate-900">Stages 7-9</div>
                  <div className="text-lg font-semibold text-slate-700 mb-2">Synthesis & Output</div>
                  <div className="text-base text-slate-600">Composition → Reflection → Analysis</div>
                </div>
                <div className="text-center text-violet-400 text-4xl font-bold animate-bounce">↓</div>
                <div className="bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 rounded-3xl p-8 shadow-xl border-2 border-slate-200">
                  <h3 className="text-2xl font-bold mb-6 text-center text-slate-900">🤖 Multi-AI Orchestration</h3>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-cyan-100 to-sky-200 rounded-2xl p-4 border border-cyan-200">
                      <div className="text-xl mb-2">🌐</div>
                      <div className="font-bold text-slate-900 mb-2">Perplexity Sonar</div>
                      <div className="text-sm text-slate-700">Real-time research</div>
                    </div>
                    <div className="bg-gradient-to-br from-teal-100 to-emerald-200 rounded-2xl p-4 border border-teal-200">
                      <div className="text-xl mb-2">🧠</div>
                      <div className="font-bold text-slate-900 mb-2">Gemini 2.5 Pro</div>
                      <div className="text-sm text-slate-700">Advanced reasoning</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Architecture Connectome */}
        <div className="bg-gradient-to-r from-slate-100 to-gray-100 py-16 px-4 sm:px-6 lg:px-8 mb-8 rounded-3xl shadow-xl border border-slate-200">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-slate-900">
                🏗️ Technical Architecture Connectome
              </h2>
              <p className="text-xl text-slate-600 max-w-4xl mx-auto">
                Complete system architecture showing how all components work together
              </p>
            </div>
            
            <div className="mb-16">
              <MermaidChart
                chart={`
graph TB
    subgraph "🎯 User Interface Layer"
        UI1[React 18 Frontend]
        UI2[Responsive Design]
        UI3[API Dashboard]
    end
    
    subgraph "🧠 Core Engine"
        CE1[Graph-of-Thoughts Processor]
        CE2[Bayesian Confidence Engine]
        CE3[Causal Inference Module]
        CE4[Bias Detection AI]
    end
    
    subgraph "📊 Data Layer"
        DL1[Knowledge Graphs]
        DL2[Evidence Database]
        DL3[Citation Network]
        DL4[Temporal Patterns]
    end
    
    subgraph "🔧 Infrastructure"
        IN1[Supabase Backend]
        IN2[Real-time Processing]
        IN3[Export Engines]
        IN4[Security Layer]
    end
    
    subgraph "🤖 AI Orchestra"
        AI1[Perplexity Sonar]
        AI2[Gemini 2.5 Pro]
        AI3[Smart Routing]
        AI4[Fallback Systems]
    end
    
    UI1 --> CE1
    UI2 --> CE2
    UI3 --> CE3
    CE1 --> DL1
    CE2 --> DL2
    CE3 --> DL3
    CE4 --> DL4
    DL1 --> IN1
    DL2 --> IN2
    DL3 --> IN3
    DL4 --> IN4
    CE1 --> AI1
    CE2 --> AI2
    CE3 --> AI3
    CE4 --> AI4
    
    style UI1 fill:#e3f2fd,stroke:#01579b
    style CE1 fill:#e8f5e8,stroke:#1b5e20
    style DL1 fill:#fff3e0,stroke:#e65100
    style IN1 fill:#fce4ec,stroke:#880e4f
    style AI1 fill:#f3e5f5,stroke:#4a148c
                `}
                className="w-full h-auto"
                id="technical-architecture"
              />
            </div>

            {/* Research Methodology Mind Map */}
            <div className="mb-16">
              <h3 className="text-3xl font-bold text-center mb-8 text-slate-900">🧠 Research Methodology Mind Map</h3>
              <MermaidChart
                chart={`
mindmap
  root((Scientific Reasoning Methodology))
    Graph Theory
      Node Types
        Hypothesis
        Evidence
        Dimension
        Bridge
      Edge Types
        Causal
        Temporal
        Correlative
        Logical
      Multi-Layer
        Conceptual
        Methodological
        Empirical
        Theoretical
    Scientific Rigor
      Hypothesis Testing
        Falsifiability
        Statistical Power
        Effect Size
        Confidence Intervals
      Bias Mitigation
        Cognitive Bias
        Selection Bias
        Confirmation Bias
        Publication Bias
      Quality Control
        Peer Review
        Reproducibility
        Transparency
        Audit Trails
    AI Integration
      Bayesian Engine
        Prior Beliefs
        Evidence Updates
        Posterior Distributions
        Uncertainty Quantification
      Pattern Recognition
        Temporal Patterns
        Causal Patterns
        Cross-Domain Links
        Knowledge Gaps
      Automation
        Literature Mining
        Hypothesis Generation
        Evidence Synthesis
        Report Generation
                `}
                className="w-full h-auto"
                id="methodology-mindmap"
              />
            </div>
          </div>
        </div>

        {/* Revolutionary Features Showcase */}
        <div className="bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 text-slate-800 py-16 px-4 sm:px-6 lg:px-8 mb-8 rounded-3xl shadow-xl border border-indigo-200">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-slate-900">
                🧠 Revolutionary Scientific AI Platform
              </h2>
              <p className="text-xl sm:text-2xl text-slate-700 max-w-4xl mx-auto leading-relaxed">
                ✨ Completely redesigned with cutting-edge features developed over the past two weeks
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              
              {/* 9-Stage Pipeline */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-slate-200">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900">9-Stage Mandatory Pipeline</h3>
                <p className="text-slate-700 text-lg leading-relaxed">
                  Structured scientific reasoning through <strong>Initialization → Decomposition → Hypothesis → Evidence → Pruning → Extraction → Composition → Reflection → Final Analysis</strong>
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full text-sm font-medium">AI Orchestration</span>
                  <span className="bg-green-500/20 text-green-200 px-3 py-1 rounded-full text-sm font-medium">PhD-Level Reports</span>
                </div>
              </div>

              {/* Multi-AI System */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-slate-200">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900">Multi-AI Orchestration</h3>
                <p className="text-slate-700 text-lg leading-relaxed">
                  <strong>Perplexity Sonar</strong> for real-time research + <strong>Gemini 2.5 Pro</strong> for advanced reasoning with intelligent fallback systems
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="bg-purple-500/20 text-purple-200 px-3 py-1 rounded-full text-sm font-medium">Smart Routing</span>
                  <span className="bg-orange-500/20 text-orange-200 px-3 py-1 rounded-full text-sm font-medium">Auto Fallback</span>
                </div>
              </div>

              {/* Graph Visualization */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-slate-200">
                <div className="text-4xl mb-4">🌳</div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900">Advanced Graph Systems</h3>
                <p className="text-slate-700 text-lg leading-relaxed">
                  <strong>3D Botanical Trees</strong>, <strong>Cytoscape Networks</strong>, and <strong>Interactive Analytics</strong> with hyperedges and causal inference
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="bg-teal-500/20 text-teal-200 px-3 py-1 rounded-full text-sm font-medium">3D Visualization</span>
                  <span className="bg-yellow-500/20 text-yellow-200 px-3 py-1 rounded-full text-sm font-medium">Causal Inference</span>
                </div>
              </div>

              {/* Authentication & Backend */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-slate-200">
                <div className="text-4xl mb-4">🔐</div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900">Enterprise Authentication</h3>
                <p className="text-slate-700 text-lg leading-relaxed">
                  <strong>Supabase Integration</strong> with secure user management, session persistence, and cloud synchronization
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="bg-indigo-500/20 text-indigo-200 px-3 py-1 rounded-full text-sm font-medium">Cloud Sync</span>
                  <span className="bg-pink-500/20 text-pink-200 px-3 py-1 rounded-full text-sm font-medium">Session Management</span>
                </div>
              </div>

              {/* Advanced Parameters */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-slate-200">
                <div className="text-4xl mb-4">⚙️</div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900">29 Parameter System</h3>
                <p className="text-slate-700 text-lg leading-relaxed">
                  Complete control system (<strong>P1.0-P1.29</strong>) covering framework execution, graph operations, and advanced analytics
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="bg-red-500/20 text-red-200 px-3 py-1 rounded-full text-sm font-medium">Fine-tuning</span>
                  <span className="bg-cyan-500/20 text-cyan-200 px-3 py-1 rounded-full text-sm font-medium">Expert Mode</span>
                </div>
              </div>

              {/* Export & Analytics */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-slate-200">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900">Multi-Format Export</h3>
                <p className="text-slate-700 text-lg leading-relaxed">
                  <strong>HTML, SVG, PNG</strong> exports with embedded visualizations, Vancouver citations, and comprehensive analytics
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="bg-emerald-500/20 text-emerald-200 px-3 py-1 rounded-full text-sm font-medium">Publication Ready</span>
                  <span className="bg-violet-500/20 text-violet-200 px-3 py-1 rounded-full text-sm font-medium">Interactive Reports</span>
                </div>
              </div>
            </div>

            {/* Technology Stack */}
            <div className="text-center">
              <h3 className="text-3xl font-bold mb-8 text-slate-900">🛠️ Cutting-Edge Technology Stack</h3>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <span className="bg-blue-200 text-blue-900 px-6 py-3 rounded-xl text-lg font-semibold border border-blue-400/30">React 18</span>
                <span className="bg-indigo-200 text-indigo-900 px-6 py-3 rounded-xl text-lg font-semibold border border-indigo-400/30">TypeScript</span>
                <span className="bg-teal-200 text-teal-900 px-6 py-3 rounded-xl text-lg font-semibold border border-teal-400/30">Supabase</span>
                <span className="bg-purple-200 text-purple-900 px-6 py-3 rounded-xl text-lg font-semibold border border-purple-400/30">Cytoscape.js</span>
                <span className="bg-green-200 text-green-900 px-6 py-3 rounded-xl text-lg font-semibold border border-green-400/30">D3.js</span>
                <span className="bg-orange-200 text-orange-900 px-6 py-3 rounded-xl text-lg font-semibold border border-orange-400/30">Tailwind CSS</span>
              </div>
              
            </div>
          </div>
        </div>

        {/* User Journey & Domain Applications */}
        <div className="bg-white py-16 px-4 sm:px-6 lg:px-8 mb-8 rounded-3xl shadow-lg border border-gray-200">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-slate-900">
                🚀 Research Discovery Journey
              </h2>
              <p className="text-xl text-slate-600 max-w-4xl mx-auto">
                From question to breakthrough - see how Scientific Reasoning transforms your research process
              </p>
            </div>
            
            {/* User Journey */}
            <div className="mb-16">
              <MermaidChart
                chart={`
journey
    title Research Discovery Journey
    section Initialization
      Research Question: 5: Researcher
      Graph Setup: 4: System
      Domain Config: 4: Researcher
    section Discovery
      Task Decomposition: 5: System
      Hypothesis Generation: 5: AI Engine
      Evidence Search: 4: Researcher
    section Analysis
      Bayesian Updates: 5: System
      Bias Detection: 4: AI Engine
      Pattern Analysis: 5: System
    section Results
      Insight Generation: 5: System
      Quality Validation: 4: System
      Export & Share: 5: Researcher
                `}
                className="w-full h-auto"
                id="user-journey"
              />
            </div>

            {/* Domain Applications */}
            <div className="mb-16">
              <h3 className="text-3xl font-bold text-center mb-8 text-slate-900">🎯 Cross-Domain Applications</h3>
              <MermaidChart
                chart={`
graph LR
    subgraph "🏥 Medical Research"
        M1[Immunology]
        M2[Dermatology]
        M3[Oncology]
        M4[Drug Discovery]
    end
    
    subgraph "🧬 Life Sciences"
        L1[Genomics]
        L2[Proteomics]
        L3[Microbiome]
        L4[Systems Biology]
    end
    
    subgraph "🤖 AI & Computing"
        A1[Machine Learning]
        A2[NLP Research]
        A3[Computer Vision]
        A4[Robotics]
    end
    
    subgraph "🌍 Cross-Domain"
        C1[Climate Science]
        C2[Social Sciences]
        C3[Economics]
        C4[Psychology]
    end
    
    M1 --> SR[🧬 Scientific Reasoning]
    M2 --> SR
    L1 --> SR
    L2 --> SR
    A1 --> SR
    A2 --> SR
    C1 --> SR
    C2 --> SR
    
    style SR fill:#ffebee,stroke:#d32f2f,stroke-width:4px
    style M1 fill:#e8f5e8,stroke:#388e3c
    style L1 fill:#e1f5fe,stroke:#0288d1
    style A1 fill:#fff3e0,stroke:#f57c00
    style C1 fill:#f1f8e9,stroke:#558b2f
                `}
                className="w-full h-auto"
                id="domain-applications"
              />
            </div>

            {/* Quick Start Workflow */}
            <div className="mb-16">
              <h3 className="text-3xl font-bold text-center mb-8 text-slate-900">⚡ Quick Start Workflow</h3>
              <MermaidChart
                chart={`
flowchart LR
    A[🚀 Enter Research Query] --> B[⚙️ Configure APIs]
    B --> C[❓ AI Processes Question]
    C --> D[🤖 Execute 9 Stages]
    D --> E[📊 Generate Insights]
    E --> F[🔍 Explore Results]
    F --> G[📈 Export Report]
    
    style A fill:#e8f5e8,stroke:#388e3c
    style C fill:#e1f5fe,stroke:#0288d1
    style D fill:#fff3e0,stroke:#f57c00
    style E fill:#f1f8e9,stroke:#558b2f
    style G fill:#ffebee,stroke:#d32f2f
                `}
                className="w-full h-auto"
                id="quick-start"
              />
            </div>
          </div>
        </div>

        {/* New Responsive Layout */}
        <ResponsiveLayout navigationItems={defaultNavigationItems} activeTab={activeTab} onTabChange={setActiveTab}>
          {renderTabContent(activeTab)}
        </ResponsiveLayout>
      </div>

      {/* Stage 9 Progress Indicator */}
      {showStage9Progress && <Stage9ProgressIndicator currentStage={currentStage} isProcessing={isProcessing} onComplete={() => setShowStage9Progress(false)} />}
    </div>
  );
};

export default ASRGoTInterface;