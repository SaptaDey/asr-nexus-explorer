/**
 * RAG Reanalysis Panel Component
 * Provides intelligent reanalysis capabilities using stored research sessions
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Brain, 
  Lightbulb, 
  TrendingUp, 
  Search, 
  RefreshCw, 
  Download, 
  ChevronDown, 
  ChevronRight,
  Sparkles,
  Target,
  Layers,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { ragReanalysisService, RAGReanalysisResult, RAGInsight } from '@/services/RAGReanalysisService';
import { toast } from 'sonner';

interface RAGReanalysisPanelProps {
  sessionId: string;
  sessionQuery: string;
  sessionField: string;
  onClose?: () => void;
  onApplyInsights?: (insights: RAGInsight[]) => void;
}

export const RAGReanalysisPanel: React.FC<RAGReanalysisPanelProps> = ({
  sessionId,
  sessionQuery,
  sessionField,
  onClose,
  onApplyInsights
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reanalysisResult, setReanalysisResult] = useState<RAGReanalysisResult | null>(null);
  const [enhancementQuery, setEnhancementQuery] = useState('');
  const [selectedInsights, setSelectedInsights] = useState<Set<number>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['insights']));
  const [analysisProgress, setAnalysisProgress] = useState(0);

  useEffect(() => {
    // Auto-trigger reanalysis on mount
    handleReanalysis();
  }, [sessionId]);

  const handleReanalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    try {
      toast.info('🔍 Starting RAG reanalysis...', {
        description: 'Analyzing stored sessions for insights'
      });

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const result = await ragReanalysisService.performReanalysis(
        sessionId,
        enhancementQuery || undefined
      );

      clearInterval(progressInterval);
      setAnalysisProgress(100);
      
      setReanalysisResult(result);
      toast.success(`✅ RAG reanalysis completed! Found ${result.crossSessionInsights.length} insights from related research.`);
      
    } catch (error) {
      console.error('Reanalysis failed:', error);
      toast.error('Failed to perform reanalysis');
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setAnalysisProgress(0), 2000);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const toggleInsightSelection = (index: number) => {
    const newSelected = new Set(selectedInsights);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedInsights(newSelected);
  };

  const handleApplySelectedInsights = () => {
    if (!reanalysisResult || selectedInsights.size === 0) return;
    
    const insights = Array.from(selectedInsights).map(index => 
      reanalysisResult.crossSessionInsights[index]
    );
    
    onApplyInsights?.(insights);
    toast.success(`Applied ${insights.length} insights to enhance your research!`);
  };

  const exportReanalysis = () => {
    if (!reanalysisResult) return;
    
    const exportData = {
      sessionId,
      originalQuery: sessionQuery,
      enhancedQuery: reanalysisResult.enhancedQuery,
      insights: reanalysisResult.crossSessionInsights,
      relatedSessions: reanalysisResult.relatedSessions.length,
      synthesizedFindings: reanalysisResult.synthesizedFindings,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rag-reanalysis-${sessionId.substring(0, 8)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('RAG reanalysis exported successfully!');
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'similar_research': return <Search className="h-4 w-4" />;
      case 'complementary_findings': return <Layers className="h-4 w-4" />;
      case 'methodological_improvement': return <TrendingUp className="h-4 w-4" />;
      case 'knowledge_gap': return <Target className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'similar_research': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'complementary_findings': return 'bg-green-100 text-green-800 border-green-200';
      case 'methodological_improvement': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'knowledge_gap': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-purple-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">RAG Reanalysis</h2>
            <p className="text-sm text-gray-600">Intelligent insights from related research sessions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {reanalysisResult && (
            <Button
              size="sm"
              variant="outline"
              onClick={exportReanalysis}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Original Session Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Original Research
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-sm font-medium text-gray-700">Query</Label>
            <p className="text-sm text-gray-900 mt-1">{sessionQuery}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Field</Label>
            <Badge variant="secondary" className="mt-1">{sessionField}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Enhancement Query */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Enhancement Query
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="enhancement-query">
              Optional: Specify aspects to focus on for reanalysis
            </Label>
            <Textarea
              id="enhancement-query"
              placeholder="e.g., Focus on methodological improvements, explore alternative approaches, identify knowledge gaps..."
              value={enhancementQuery}
              onChange={(e) => setEnhancementQuery(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
          <Button
            onClick={handleReanalysis}
            disabled={isAnalyzing}
            className="w-full flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4" />
                {reanalysisResult ? 'Reanalyze' : 'Start RAG Reanalysis'}
              </>
            )}
          </Button>
          
          {isAnalyzing && (
            <div className="space-y-2">
              <Progress value={analysisProgress} className="w-full" />
              <p className="text-sm text-gray-600 text-center">
                {analysisProgress < 30 && 'Building RAG context...'}
                {analysisProgress >= 30 && analysisProgress < 60 && 'Finding similar sessions...'}
                {analysisProgress >= 60 && analysisProgress < 90 && 'Generating insights...'}
                {analysisProgress >= 90 && 'Finalizing analysis...'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {reanalysisResult && (
        <div className="space-y-6">
          <Tabs defaultValue="insights" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="enhanced">Enhanced Query</TabsTrigger>
              <TabsTrigger value="related">Related Sessions</TabsTrigger>
              <TabsTrigger value="synthesis">Synthesis</TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      Cross-Session Insights ({reanalysisResult.crossSessionInsights.length})
                    </CardTitle>
                    {selectedInsights.size > 0 && (
                      <Button
                        size="sm"
                        onClick={handleApplySelectedInsights}
                        className="flex items-center gap-2"
                      >
                        <ArrowRight className="h-4 w-4" />
                        Apply {selectedInsights.size} Insights
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {reanalysisResult.crossSessionInsights.map((insight, index) => (
                        <Card key={index} className={`border-l-4 ${
                          selectedInsights.has(index) ? 'border-l-blue-500 bg-blue-50' : 'border-l-gray-200'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {getInsightIcon(insight.type)}
                                <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getInsightColor(insight.type)}`}
                                >
                                  {insight.type.replace('_', ' ')}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {Math.round(insight.relevanceScore * 100)}% relevant
                                </Badge>
                                <input
                                  type="checkbox"
                                  checked={selectedInsights.has(index)}
                                  onChange={() => toggleInsightSelection(index)}
                                  className="rounded border-gray-300"
                                />
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-700 mb-3">{insight.description}</p>
                            
                            {insight.evidence.length > 0 && (
                              <div className="mb-3">
                                <h5 className="text-xs font-medium text-gray-600 mb-1">Evidence:</h5>
                                <ul className="text-xs text-gray-600 space-y-1">
                                  {insight.evidence.map((evidence, evidenceIndex) => (
                                    <li key={evidenceIndex} className="flex items-start gap-1">
                                      <span className="text-gray-400">•</span>
                                      {evidence}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {insight.actionableRecommendations.length > 0 && (
                              <div>
                                <h5 className="text-xs font-medium text-gray-600 mb-1">Recommendations:</h5>
                                <ul className="text-xs text-gray-600 space-y-1">
                                  {insight.actionableRecommendations.map((rec, recIndex) => (
                                    <li key={recIndex} className="flex items-start gap-1">
                                      <span className="text-blue-500">→</span>
                                      {rec}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="enhanced" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Enhanced Research Query
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Original Query</Label>
                    <p className="text-sm text-gray-600 mt-1 p-3 bg-gray-50 rounded">{sessionQuery}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">RAG-Enhanced Query</Label>
                    <p className="text-sm text-gray-900 mt-1 p-3 bg-blue-50 rounded border-l-4 border-l-blue-500">
                      {reanalysisResult.enhancedQuery}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Recommended Approaches</Label>
                    <ul className="text-sm text-gray-700 mt-2 space-y-1">
                      {reanalysisResult.recommendedApproaches.map((approach, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-500 text-xs mt-1">✓</span>
                          {approach}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="related" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Related Research Sessions ({reanalysisResult.relatedSessions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {reanalysisResult.relatedSessions.map((session, index) => (
                        <Card key={session.sessionId} className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                              {session.query}
                            </h4>
                            <Badge variant="outline" className="text-xs ml-2">
                              {session.researchField}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span>Stages: {session.completedStages}/9</span>
                            <span>{session.figures.length} figures</span>
                            <span>{session.tables.length} tables</span>
                            <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="synthesis" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Synthesized Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Key Findings</Label>
                    <p className="text-sm text-gray-900 mt-2 p-4 bg-green-50 rounded border-l-4 border-l-green-500">
                      {reanalysisResult.synthesizedFindings}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Methodological Improvements</Label>
                    <ul className="text-sm text-gray-700 mt-2 space-y-2">
                      {reanalysisResult.methodologicalImprovements.map((improvement, index) => (
                        <li key={index} className="flex items-start gap-2 p-2 bg-purple-50 rounded">
                          <TrendingUp className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {!reanalysisResult && !isAnalyzing && (
        <Alert>
          <Brain className="h-4 w-4" />
          <AlertDescription>
            RAG reanalysis will search through your stored research sessions to find related work, 
            identify patterns, and provide actionable insights to enhance your research.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};