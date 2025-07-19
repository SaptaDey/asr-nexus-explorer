/**
 * Visual Analytics with Plotly.js Integration
 * Stage-4 evidence nodes trigger automatic code execution for figure generation
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { GraphData, GraphNode, ResearchContext } from '@/types/asrGotTypes';
import { BarChart3, LineChart, PieChart, Download, Play, AlertTriangle, Code } from 'lucide-react';
import { toast } from 'sonner';
import { safeJSONParse, validatePlotlyConfig, apiRateLimiter } from '@/utils/securityUtils';

// Import Plotly.js dynamically to avoid bundle size issues
declare global {
  interface Window {
    Plotly: any;
  }
}

interface AnalyticsFigure {
  id: string;
  title: string;
  code: string;
  data: any;
  layout: any;
  type: 'scatter' | 'bar' | 'histogram' | 'box' | 'heatmap' | 'pie';
  nodeId: string;
  generated: string;
  error?: string;
}

interface VisualAnalyticsProps {
  graphData: GraphData;
  currentStage: number;
  geminiApiKey: string;
  researchContext: ResearchContext;
}

export const VisualAnalytics: React.FC<VisualAnalyticsProps> = ({
  graphData,
  currentStage,
  geminiApiKey,
  researchContext
}) => {
  const [figures, setFigures] = useState<AnalyticsFigure[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFigure, setSelectedFigure] = useState<string | null>(null);
  const [plotlyLoaded, setPlotlyLoaded] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const plotContainerRefs = useRef<Record<string, HTMLDivElement>>({});

  // Load Plotly.js dynamically
  useEffect(() => {
    if (window.Plotly) {
      setPlotlyLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.plot.ly/plotly-3.0.1.min.js';
    script.onload = () => {
      setPlotlyLoaded(true);
      toast.success('Plotly.js loaded for visual analytics');
    };
    script.onerror = () => {
      toast.error('Failed to load Plotly.js');
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Generate comprehensive analytical visualizations
  const generateComprehensiveVisualizations = useCallback(async (): Promise<AnalyticsFigure[]> => {
    if (!apiRateLimiter.isAllowed('visualization')) {
      throw new Error('Rate limit exceeded. Please wait before generating more visualizations.');
    }

    const analysisPrompt = `
Based on the research topic "${researchContext.topic}" in the field of ${researchContext.field}, generate 15 comprehensive scientific charts relevant to this research:

Research Context: ${researchContext.topic}
Field: ${researchContext.field}

Generate charts that would be appropriate for this scientific topic with realistic data:

1. Primary data visualization (bar chart)
2. Correlation analysis (scatter plot)
3. Distribution analysis (histogram)
4. Comparative analysis (grouped bar chart)
5. Time series analysis (line chart)
6. Statistical power analysis (box plot)
7. Confidence intervals (error bars)
8. Heatmap correlation matrix
9. Pie chart categorical breakdown
10. Multi-dimensional scatter plot
11. Statistical significance testing (bar chart)
12. Trend analysis (line chart)
13. Classification accuracy (bar chart)
14. Regression analysis (scatter with trend)
15. Meta-analysis forest plot (horizontal bar with error bars)

Each chart should have realistic data relevant to the research field. For example:
- Medical research: patient outcomes, biomarker levels, treatment efficacy
- Genetics: gene expression, mutation frequencies, pathway analysis
- Physics: measurements, experimental results, theoretical predictions
- Psychology: survey responses, behavioral data, cognitive assessments

JSON format: [{"title": "Descriptive Title", "type": "bar|scatter|heatmap|histogram|pie|box", "data": [{"x": [realistic_labels], "y": [realistic_values], "type": "bar"}], "layout": {"title": "Chart Title", "xaxis": {"title": "X Label"}, "yaxis": {"title": "Y Label"}}}]
`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: analysisPrompt }] }],
          generationConfig: { 
            maxOutputTokens: 30000,
            temperature: 0.2
          }
        })
      });

      if (!response.ok) throw new Error('Gemini API error');
      
      const data = await response.json();
      
      // Check if response was truncated due to token limit
      if (data.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
        throw new Error('Response was truncated due to token limit. Please try again or use a shorter prompt.');
      }
      
      const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) {
        throw new Error('Gemini API returned invalid response structure');
      }
      
      // Extract JSON from code block if wrapped
      const jsonMatch = responseText.match(/```(?:javascript|json)?\s*(\[[\s\S]*\])\s*```/);
      const extractedJson = jsonMatch ? jsonMatch[1] : responseText;
      
      const chartConfigs = JSON.parse(extractedJson);
      
      return chartConfigs.map((config: any, index: number) => ({
        id: `comprehensive_${index}_${Date.now()}`,
        title: config.title,
        code: JSON.stringify(config),
        data: config.data,
        layout: config.layout,
        type: config.type as AnalyticsFigure['type'],
        nodeId: 'comprehensive_analysis',
        generated: new Date().toISOString()
      }));
      
    } catch (error) {
      throw new Error(`Comprehensive analysis failed: ${error}`);
    }
  }, [graphData, geminiApiKey, researchContext]);

  // Generate evidence-specific visualization
  const generateEvidenceVisualization = useCallback(async (evidenceNode: GraphNode): Promise<AnalyticsFigure> => {
    const prompt = `
Generate chart for evidence node "${evidenceNode.label}" (confidence: ${evidenceNode.confidence}):

Create evidence strength bar chart.

JSON: {"title": "Evidence Analysis: ${evidenceNode.label}", "data": [{"x": ["Support", "Against"], "y": [0.8, 0.2], "type": "bar"}], "layout": {"title": "Evidence Strength", "xaxis": {"title": "Category"}, "yaxis": {"title": "Score"}}}
`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            maxOutputTokens: 2000,
            temperature: 0.3
          }
        })
      });

      if (!response.ok) throw new Error('Gemini API error');
      
      const data = await response.json();
      
      // Check if response was truncated due to token limit
      if (data.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
        throw new Error('Response was truncated due to token limit. Please try again or use a shorter prompt.');
      }
      
      const code = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!code) {
        throw new Error('Gemini API returned invalid response structure');
      }
      
      const jsonMatch = code.match(/```(?:javascript|json)?\s*(\{[\s\S]*\})\s*```/);
      const extractedCode = jsonMatch ? jsonMatch[1] : code;
      
      const plotConfig = JSON.parse(extractedCode);
      
      return {
        id: `evidence_${evidenceNode.id}_${Date.now()}`,
        title: plotConfig.title || `Evidence Analysis: ${evidenceNode.label}`,
        code: extractedCode,
        data: plotConfig.data,
        layout: plotConfig.layout,
        type: plotConfig.data[0].type as AnalyticsFigure['type'],
        nodeId: evidenceNode.id,
        generated: new Date().toISOString()
      };
      
    } catch (error) {
      throw new Error(`Evidence visualization failed: ${error}`);
    }
  }, [geminiApiKey]);

  // Execute generated code safely without eval()
  const executeVisualizationCode = useCallback(async (code: string, nodeId: string): Promise<AnalyticsFigure> => {
    try {
      // Safe JSON parsing with validation
      const allowedKeys = ['data', 'layout', 'config'];
      const plotConfig = safeJSONParse(code, allowedKeys);
      
      // Validate the plot configuration
      if (!validatePlotlyConfig(plotConfig)) {
        throw new Error('Invalid or unsafe plot configuration');
      }

      // Determine chart type from the data
      const firstTrace = plotConfig.data[0];
      let chartType: AnalyticsFigure['type'] = 'scatter';
      
      if (firstTrace?.type === 'bar') chartType = 'bar';
      else if (firstTrace?.type === 'histogram') chartType = 'histogram';
      else if (firstTrace?.type === 'box') chartType = 'box';
      else if (firstTrace?.type === 'heatmap') chartType = 'heatmap';
      else if (firstTrace?.type === 'pie') chartType = 'pie';

      return {
        id: `fig_${nodeId}_${Date.now()}`,
        title: typeof plotConfig.layout.title === 'string' ? plotConfig.layout.title : `Analysis for ${nodeId}`,
        code: code,
        data: plotConfig.data,
        layout: plotConfig.layout,
        type: chartType,
        nodeId: nodeId,
        generated: new Date().toISOString()
      };
      
    } catch (error) {
      throw new Error(`Safe parsing failed: ${error}`);
    }
  }, []);

  // Create a cache key based on research context to prevent regeneration
  const getCacheKey = useCallback(() => {
    return `${researchContext.topic}-${researchContext.field}-${currentStage}-${graphData.nodes.length}`;
  }, [researchContext.topic, researchContext.field, currentStage, graphData.nodes.length]);

  // Load cached figures from sessionStorage
  useEffect(() => {
    const cacheKey = getCacheKey();
    const cached = sessionStorage.getItem(`visual-analytics-${cacheKey}`);
    if (cached) {
      try {
        const cachedFigures = JSON.parse(cached);
        setFigures(cachedFigures);
        setHasGenerated(true);
        console.log('Loaded cached figures:', cachedFigures.length);
      } catch (error) {
        console.warn('Failed to load cached figures:', error);
      }
    }
  }, [getCacheKey]);

  // Cache figures when they change
  useEffect(() => {
    if (figures.length > 0) {
      const cacheKey = getCacheKey();
      sessionStorage.setItem(`visual-analytics-${cacheKey}`, JSON.stringify(figures));
    }
  }, [figures, getCacheKey]);

  // Trigger comprehensive visualization generation for advanced stages
  useEffect(() => {
    if (currentStage < 4 || !plotlyLoaded || !geminiApiKey || hasGenerated) return;

    // Generate comprehensive analysis for stages 6-9, but only if not already generated
    if (currentStage >= 6 && figures.length === 0 && !hasGenerated) {
      const cacheKey = getCacheKey();
      const cached = sessionStorage.getItem(`visual-analytics-${cacheKey}`);
      
      if (cached) {
        // Figures are already loaded from cache, no need to regenerate
        return;
      }

      const generateAnalysis = async () => {
        setIsGenerating(true);
        try {
          // Generate comprehensive visualizations
          const comprehensiveFigures = await generateComprehensiveVisualizations();
          
          // Generate evidence-specific visualizations
          const evidenceNodes = graphData.nodes.filter(node => node.type === 'evidence').slice(0, 8);
          const evidenceFigures: AnalyticsFigure[] = [];
          
          for (const node of evidenceNodes) {
            try {
              const figure = await generateEvidenceVisualization(node);
              evidenceFigures.push(figure);
            } catch (error) {
              console.warn(`Failed to generate visualization for ${node.id}:`, error);
            }
          }
          
          const allFigures = [...comprehensiveFigures, ...evidenceFigures];
          setFigures(allFigures);
          setHasGenerated(true);
          
          toast.success(`Generated ${allFigures.length} comprehensive visualizations`);
        } catch (error) {
          toast.error(`Failed to generate comprehensive analysis: ${error}`);
        } finally {
          setIsGenerating(false);
        }
      };

      generateAnalysis();
    }
  }, [currentStage, plotlyLoaded, geminiApiKey, hasGenerated, graphData.nodes.length]);

  // Render Plotly figure
  const renderPlotlyFigure = useCallback((figure: AnalyticsFigure) => {
    if (!plotlyLoaded || figure.error) return null;

    const containerId = `plot-${figure.id}`;
    
    // Render plot after component mounts
    setTimeout(() => {
        const container = document.getElementById(containerId);
        if (container && window.Plotly && container.children.length === 0) {
        window.Plotly.newPlot(container, figure.data, figure.layout, {
          responsive: true,
          displayModeBar: true,
          modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d']
        });
      }
    }, 100);

    return (
      <div
        id={containerId}
        className="w-full h-[400px] border rounded-lg bg-white dark:bg-gray-900"
      />
    );
  }, [plotlyLoaded]);

  // Export figure as PNG
  const exportFigure = useCallback((figure: AnalyticsFigure) => {
    if (!window.Plotly) return;
    
    const container = document.getElementById(`plot-${figure.id}`);
    if (container) {
      window.Plotly.toImage(container, {
        format: 'png',
        width: 1200,
        height: 800
      }).then((dataUrl: string) => {
        const link = document.createElement('a');
        link.download = `${figure.title.replace(/\s+/g, '_')}.png`;
        link.href = dataUrl;
        link.click();
        toast.success(`Exported ${figure.title}`);
      });
    }
  }, []);

  // Export figure as data URL for HTML embedding
  const exportFigureAsDataURL = useCallback(async (figure: AnalyticsFigure): Promise<string> => {
    if (!window.Plotly) {
      throw new Error('Plotly not loaded');
    }
    
    const container = document.getElementById(`plot-${figure.id}`);
    if (!container) {
      // Create a temporary container and render the plot
      const tempContainer = document.createElement('div');
      tempContainer.style.width = '1200px';
      tempContainer.style.height = '800px';
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      document.body.appendChild(tempContainer);
      
      try {
        await window.Plotly.newPlot(tempContainer, figure.data, figure.layout, {
          responsive: false,
          displayModeBar: false
        });
        
        const dataUrl = await window.Plotly.toImage(tempContainer, {
          format: 'png',
          width: 1200,
          height: 800
        });
        
        document.body.removeChild(tempContainer);
        return dataUrl;
      } catch (error) {
        if (document.body.contains(tempContainer)) {
          document.body.removeChild(tempContainer);
        }
        throw error;
      }
    } else {
      return await window.Plotly.toImage(container, {
        format: 'png',
        width: 1200,
        height: 800
      });
    }
  }, []);

  // Expose figures and export function for external use (HTML export)
  React.useEffect(() => {
    // Attach to window for access by export functionality
    (window as any).visualAnalytics = {
      figures,
      exportFigure: exportFigureAsDataURL
    };
  }, [figures, exportFigureAsDataURL]);

  const getChartIcon = (type: AnalyticsFigure['type']) => {
    const icons = {
      scatter: LineChart,
      bar: BarChart3,
      histogram: BarChart3,
      box: BarChart3,
      heatmap: BarChart3,
      pie: PieChart
    };
    return icons[type] || BarChart3;
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
              📊 Visual Analytics & Figures
              <Badge variant="outline">
                {figures.length} Figure{figures.length !== 1 ? 's' : ''}
              </Badge>
              {isGenerating && (
                <Badge variant="secondary" className="animate-pulse">
                  Generating...
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  // Clear cache and regenerate
                  const cacheKey = getCacheKey();
                  sessionStorage.removeItem(`visual-analytics-${cacheKey}`);
                  setFigures([]);
                  toast.info('Clearing cache and regenerating visualizations...');
                }}
                disabled={isGenerating}
              >
                <Play className="h-4 w-4 mr-1" />
                Regenerate All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!plotlyLoaded && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Loading Plotly.js for interactive visualizations...
              </AlertDescription>
            </Alert>
          )}

          {figures.length === 0 && !isGenerating && currentStage >= 4 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No visualizations generated yet. Evidence nodes will automatically trigger figure generation in Stage 4.
              </AlertDescription>
            </Alert>
          )}

          {figures.length > 0 && (
            <Tabs value={selectedFigure || figures[0]?.id} onValueChange={setSelectedFigure}>
              <TabsList className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 h-auto p-2">
                {figures.map((figure) => {
                  const ChartIcon = getChartIcon(figure.type);
                  return (
                    <TabsTrigger
                      key={figure.id}
                      value={figure.id}
                      className="flex flex-col items-center gap-1 p-3 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <ChartIcon className="h-4 w-4" />
                      <span className="text-xs truncate max-w-[80px]">
                        {figure.title}
                      </span>
                      {figure.error && (
                        <Badge variant="destructive" className="text-xs">
                          Error
                        </Badge>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {figures.map((figure) => (
                <TabsContent key={figure.id} value={figure.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{figure.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Generated from node: {figure.nodeId} • {new Date(figure.generated).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => exportFigure(figure)}
                        disabled={!!figure.error || !plotlyLoaded}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export PNG
                      </Button>
                    </div>
                  </div>

                  {figure.error ? (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Visualization Error:</strong> {figure.error}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      {renderPlotlyFigure(figure)}
                      
                      <details className="border rounded-lg p-4">
                        <summary className="cursor-pointer font-semibold flex items-center gap-2">
                          <Code className="h-4 w-4" />
                          View Generated Code
                        </summary>
                        <pre className="mt-2 p-4 bg-muted rounded text-sm overflow-x-auto">
                          <code>{figure.code}</code>
                        </pre>
                      </details>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
