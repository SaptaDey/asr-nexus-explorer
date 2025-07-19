/**
 * Meta-Analysis Visual Analytics Component
 * Advanced dataset collection and visualization for scientific research
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, Download, Play, AlertTriangle, BarChart3, 
  Network, Activity, Microscope, FlaskConical, TrendingUp,
  FileText, Image, Table, FolderOpen, Zap, Brain, DnaIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { datasetCollectionService, ScientificDataset, DataExtractionResult } from '@/services/DatasetCollectionService';
import { advancedVisualizationService, VisualizationSpec, MetaAnalysisResult } from '@/services/AdvancedVisualizationService';
import { ResearchContext } from '@/types/asrGotTypes';

interface MetaAnalysisVisualAnalyticsProps {
  researchContext: ResearchContext;
  geminiApiKey: string;
  perplexityApiKey?: string;
  currentStage: number;
}

export const MetaAnalysisVisualAnalytics: React.FC<MetaAnalysisVisualAnalyticsProps> = ({
  researchContext,
  geminiApiKey,
  perplexityApiKey = '',
  currentStage
}) => {
  const [isCollecting, setIsCollecting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [collectionProgress, setCollectionProgress] = useState(0);
  const [extractionResult, setExtractionResult] = useState<DataExtractionResult | null>(null);
  const [metaAnalysisResult, setMetaAnalysisResult] = useState<MetaAnalysisResult | null>(null);
  const [selectedVisualization, setSelectedVisualization] = useState<string | null>(null);
  const [plotlyLoaded, setPlotlyLoaded] = useState(false);
  const [hasPerformedAnalysis, setHasPerformedAnalysis] = useState(false);

  // Load Plotly.js dynamically
  useEffect(() => {
    if (window.Plotly) {
      setPlotlyLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.plot.ly/plotly-3.0.1.min.js';
    script.onload = () => setPlotlyLoaded(true);
    script.onerror = () => toast.error('Failed to load Plotly.js');
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize API keys
  useEffect(() => {
    if (geminiApiKey) {
      datasetCollectionService.setApiKeys(geminiApiKey, perplexityApiKey);
      advancedVisualizationService.setApiKey(geminiApiKey);
    }
  }, [geminiApiKey, perplexityApiKey]);

  // Cache key for meta-analysis results
  const getCacheKey = useCallback(() => {
    return `meta-analysis-${researchContext.topic}-${currentStage}`;
  }, [researchContext.topic, currentStage]);

  // Load cached results
  useEffect(() => {
    const cacheKey = `meta-analysis-${researchContext.topic}-${currentStage}`;
    const cachedExtraction = sessionStorage.getItem(`${cacheKey}-extraction`);
    const cachedMetaAnalysis = sessionStorage.getItem(`${cacheKey}-meta`);
    
    if (cachedExtraction) {
      try {
        setExtractionResult(JSON.parse(cachedExtraction));
        setHasPerformedAnalysis(true);
      } catch (error) {
        console.warn('Failed to load cached extraction results:', error);
      }
    }
    
    if (cachedMetaAnalysis) {
      try {
        setMetaAnalysisResult(JSON.parse(cachedMetaAnalysis));
      } catch (error) {
        console.warn('Failed to load cached meta-analysis results:', error);
      }
    }
  }, [researchContext.topic, currentStage]);

  // Cache results when they change
  useEffect(() => {
    if (extractionResult) {
      const cacheKey = `meta-analysis-${researchContext.topic}-${currentStage}`;
      sessionStorage.setItem(`${cacheKey}-extraction`, JSON.stringify(extractionResult));
    }
  }, [extractionResult, researchContext.topic, currentStage]);

  useEffect(() => {
    if (metaAnalysisResult) {
      const cacheKey = `meta-analysis-${researchContext.topic}-${currentStage}`;
      sessionStorage.setItem(`${cacheKey}-meta`, JSON.stringify(metaAnalysisResult));
    }
  }, [metaAnalysisResult, researchContext.topic, currentStage]);

  /**
   * Start comprehensive dataset collection and analysis
   */
  const startMetaAnalysis = useCallback(async () => {
    if (!geminiApiKey) {
      toast.error('Gemini API key required for meta-analysis');
      return;
    }

    if (!researchContext.topic) {
      toast.error('Research topic required for dataset collection');
      return;
    }

    // Check if analysis has already been performed
    if (hasPerformedAnalysis && extractionResult) {
      toast.info('📊 Analysis already completed. Results are cached.');
      return;
    }

    try {
      setIsCollecting(true);
      setCollectionProgress(0);

      // Phase 1: Dataset Collection
      toast.info('🔍 Starting comprehensive dataset collection...');
      setCollectionProgress(20);

      const extractionResult = await datasetCollectionService.collectDatasetsForQuery(researchContext.topic);
      setExtractionResult(extractionResult);
      setCollectionProgress(60);

      if (extractionResult.datasets.length === 0) {
        toast.warning('No datasets found for analysis. Try refining your research query.');
        return;
      }

      // Phase 2: Data Processing and Harmonization
      toast.info('🧬 Processing and harmonizing datasets...');
      setCollectionProgress(80);

      // Download and process datasets
      for (const dataset of extractionResult.datasets.slice(0, 10)) { // Limit to 10 datasets
        try {
          const downloadedData = await datasetCollectionService.downloadDataset(dataset);
          dataset.extractedData = downloadedData;
        } catch (error) {
          console.warn(`Failed to download dataset ${dataset.id}:`, error);
        }
      }

      setCollectionProgress(100);
      setIsCollecting(false);

      // Phase 3: Advanced Visualization Generation
      setIsAnalyzing(true);
      toast.info('📊 Generating advanced scientific visualizations...');

      const metaResult = await advancedVisualizationService.generateComprehensiveVisualizations(
        extractionResult.datasets.filter(d => d.extractedData && d.extractedData.length > 0),
        researchContext.topic
      );

      setMetaAnalysisResult(metaResult);
      setIsAnalyzing(false);
      setHasPerformedAnalysis(true);

      toast.success(`✅ Meta-analysis complete! Generated ${metaResult.visualizations.length} advanced visualizations from ${metaResult.summary.datasetCount} datasets.`);

    } catch (error) {
      console.error('Meta-analysis failed:', error);
      toast.error('Failed to complete meta-analysis');
      setIsCollecting(false);
      setIsAnalyzing(false);
    }
  }, [geminiApiKey, perplexityApiKey, researchContext.topic, hasPerformedAnalysis, extractionResult]);

  /**
   * Render individual visualization
   */
  const renderVisualization = useCallback((viz: VisualizationSpec) => {
    if (!plotlyLoaded) return null;

    const containerId = `meta-plot-${viz.id}`;
    
    // Render plot after component mounts
    setTimeout(() => {
      const container = document.getElementById(containerId);
      if (container && window.Plotly && container.children.length === 0) {
        window.Plotly.newPlot(container, viz.data, viz.layout, {
          responsive: true,
          displayModeBar: true,
          modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d']
        }).catch(console.error);
      }
    }, 100);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{viz.title}</CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline">{viz.type.toUpperCase()}</Badge>
                <Badge variant="secondary">{viz.datasets.length} datasets</Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{viz.description}</p>
          </CardHeader>
          <CardContent>
            <div
              id={containerId}
              className="w-full h-[500px] border rounded-lg bg-white dark:bg-gray-900"
            />
            
            {/* Scientific Context */}
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                🔬 Scientific Context
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {viz.scientificContext}
              </p>
            </div>

            {/* Statistical Tests */}
            {viz.statisticalTests && viz.statisticalTests.length > 0 && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  📈 Statistical Analysis
                </h4>
                <div className="space-y-2">
                  {viz.statisticalTests.map((test, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-green-800 dark:text-green-200">{test.test}</span>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono ${test.significance ? 'text-red-600' : 'text-gray-600'}`}>
                          p = {test.pValue.toFixed(4)}
                        </span>
                        {test.significance && (
                          <Badge variant="destructive" className="text-xs">Significant</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }, [plotlyLoaded]);

  /**
   * Get visualization type icon
   */
  const getVisualizationIcon = (type: string) => {
    const icons = {
      boxplot: BarChart3,
      violin: Activity,
      heatmap: TrendingUp,
      network: Network,
      survival: Activity,
      scatter: BarChart3,
      pca: Brain,
      correlation: Network
    };
    return icons[type as keyof typeof icons] || BarChart3;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DnaIcon className="h-6 w-6 text-blue-600" />
              Meta-Analysis & Advanced Visualizations
              {metaAnalysisResult && (
                <Badge variant="outline" className="ml-2">
                  {metaAnalysisResult.visualizations.length} Advanced Plots
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                onClick={startMetaAnalysis}
                disabled={isCollecting || isAnalyzing || !geminiApiKey}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isCollecting || isAnalyzing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    {isCollecting ? 'Collecting...' : 'Analyzing...'}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Start Meta-Analysis
                  </div>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {!plotlyLoaded && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Loading advanced visualization engine...
              </AlertDescription>
            </Alert>
          )}

          {!geminiApiKey && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Gemini API key required for dataset collection and analysis.
              </AlertDescription>
            </Alert>
          )}

          {/* Collection Progress */}
          {(isCollecting || isAnalyzing) && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {isCollecting ? 'Collecting Datasets' : 'Generating Visualizations'}
                </span>
                <span className="text-sm text-muted-foreground">
                  {isCollecting ? `${collectionProgress}%` : 'Processing...'}
                </span>
              </div>
              <Progress value={isCollecting ? collectionProgress : undefined} className="w-full" />
            </div>
          )}

          {/* Results Tabs */}
          {(extractionResult || metaAnalysisResult) && (
            <Tabs defaultValue="visualizations" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="visualizations" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Visualizations
                </TabsTrigger>
                <TabsTrigger value="datasets" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Datasets
                </TabsTrigger>
                <TabsTrigger value="summary" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="sources" className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Sources
                </TabsTrigger>
              </TabsList>

              {/* Advanced Visualizations */}
              <TabsContent value="visualizations" className="mt-6">
                {metaAnalysisResult && metaAnalysisResult.visualizations.length > 0 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {metaAnalysisResult.visualizations.map(viz => {
                        const IconComponent = getVisualizationIcon(viz.type);
                        return (
                          <Card 
                            key={viz.id}
                            className={`cursor-pointer transition-all ${
                              selectedVisualization === viz.id ? 'ring-2 ring-blue-500' : ''
                            }`}
                            onClick={() => setSelectedVisualization(viz.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <IconComponent className="h-5 w-5 text-blue-600" />
                                <div>
                                  <p className="font-medium text-sm">{viz.title}</p>
                                  <p className="text-xs text-muted-foreground">{viz.type.toUpperCase()}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    <AnimatePresence>
                      {selectedVisualization && (
                        <motion.div
                          key={selectedVisualization}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          {metaAnalysisResult.visualizations
                            .filter(viz => viz.id === selectedVisualization)
                            .map(viz => renderVisualization(viz))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {!selectedVisualization && (
                      <div className="text-center py-8 text-muted-foreground">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Select a visualization above to view detailed analysis</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Start meta-analysis to generate advanced visualizations</p>
                  </div>
                )}
              </TabsContent>

              {/* Datasets Tab */}
              <TabsContent value="datasets" className="mt-6">
                {extractionResult && extractionResult.datasets.length > 0 ? (
                  <div className="space-y-4">
                    {extractionResult.datasets.map(dataset => (
                      <Card key={dataset.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{dataset.title}</h4>
                              <p className="text-sm text-muted-foreground mb-2">{dataset.source}</p>
                              <div className="flex gap-2 mb-2">
                                <Badge variant="outline">{dataset.dataType}</Badge>
                                <Badge variant="secondary">{dataset.format}</Badge>
                                <Badge variant="outline">
                                  {dataset.metadata.sampleSize} samples
                                </Badge>
                              </div>
                              <div className="flex gap-4 text-xs text-muted-foreground">
                                <span>Quality: {(dataset.quality.completeness * 100).toFixed(0)}%</span>
                                <span>Relevance: {(dataset.quality.relevance * 100).toFixed(0)}%</span>
                                <span>Variables: {dataset.metadata.variables.length}</span>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4 mr-1" />
                              Export
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No datasets collected yet</p>
                  </div>
                )}
              </TabsContent>

              {/* Summary Tab */}
              <TabsContent value="summary" className="mt-6">
                {metaAnalysisResult ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                          <div className="text-2xl font-bold">{metaAnalysisResult.summary.datasetCount}</div>
                          <div className="text-sm text-muted-foreground">Datasets</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Microscope className="h-8 w-8 mx-auto mb-2 text-green-600" />
                          <div className="text-2xl font-bold">{metaAnalysisResult.summary.totalSamples.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">Total Samples</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                          <div className="text-2xl font-bold">{metaAnalysisResult.visualizations.length}</div>
                          <div className="text-sm text-muted-foreground">Visualizations</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <TrendingUp className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                          <div className="text-2xl font-bold">{metaAnalysisResult.harmonizedVariables.length}</div>
                          <div className="text-sm text-muted-foreground">Variables</div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Key Findings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {metaAnalysisResult.summary.majorFindings.map((finding, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                              <span className="text-sm">{finding}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Study Limitations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {metaAnalysisResult.summary.limitations.map((limitation, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                              <span className="text-sm">{limitation}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Complete meta-analysis to view summary</p>
                  </div>
                )}
              </TabsContent>

              {/* Sources Tab */}
              <TabsContent value="sources" className="mt-6">
                {extractionResult ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Table className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                          <div className="text-lg font-bold">{extractionResult.tables.length}</div>
                          <div className="text-sm text-muted-foreground">Tables Extracted</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Image className="h-8 w-8 mx-auto mb-2 text-green-600" />
                          <div className="text-lg font-bold">{extractionResult.figures.length}</div>
                          <div className="text-sm text-muted-foreground">Figures Found</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <FolderOpen className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                          <div className="text-lg font-bold">{extractionResult.supplementaryFiles.length}</div>
                          <div className="text-sm text-muted-foreground">Supplementary Files</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Detailed source breakdown would go here */}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No sources analyzed yet</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Initial State */}
          {!extractionResult && !metaAnalysisResult && !isCollecting && !isAnalyzing && (
            <div className="text-center py-12">
              <FlaskConical className="h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Advanced Meta-Analysis Ready</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Collect datasets from scientific literature, combine multiple data sources, 
                and generate sophisticated visualizations including box plots, violin plots, 
                survival analyses, correlation networks, and more.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                <div className="text-center">
                  <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-sm font-medium">Dataset Collection</div>
                </div>
                <div className="text-center">
                  <Network className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="text-sm font-medium">Network Analysis</div>
                </div>
                <div className="text-center">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-sm font-medium">Advanced Plots</div>
                </div>
                <div className="text-center">
                  <Brain className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <div className="text-sm font-medium">Statistical Tests</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MetaAnalysisVisualAnalytics;