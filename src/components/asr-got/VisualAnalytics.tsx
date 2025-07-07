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
import { GraphData, GraphNode } from '@/types/asrGotTypes';
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
}

export const VisualAnalytics: React.FC<VisualAnalyticsProps> = ({
  graphData,
  currentStage,
  geminiApiKey
}) => {
  const [figures, setFigures] = useState<AnalyticsFigure[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFigure, setSelectedFigure] = useState<string | null>(null);
  const [plotlyLoaded, setPlotlyLoaded] = useState(false);
  const plotContainerRefs = useRef<Record<string, HTMLDivElement>>({});

  // Load Plotly.js dynamically
  useEffect(() => {
    if (window.Plotly) {
      setPlotlyLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.plot.ly/plotly-latest.min.js';
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
Generate comprehensive research visualizations based on this ASR-GoT graph data:

Nodes: ${graphData.nodes.length}
Edges: ${graphData.edges.length}
Evidence Nodes: ${graphData.nodes.filter(n => n.type === 'evidence').length}
Hypothesis Nodes: ${graphData.nodes.filter(n => n.type === 'hypothesis').length}

Create multiple visualization configurations for Plotly.js. Return a JSON array with these chart types:

1. NETWORK TOPOLOGY ANALYSIS:
- Node degree distribution histogram
- Confidence levels scatter plot
- Evidence strength heatmap

2. STATISTICAL ANALYSIS:
- Effect size forest plot
- Confidence interval analysis
- Research stage progression

3. COMPARATIVE ANALYSIS:
- Hypothesis vs Evidence comparison
- Cross-disciplinary correlation matrix
- Research quality metrics

Format each as:
[
  {
    "title": "Chart Title",
    "type": "bar|scatter|heatmap|histogram",
    "data": [{"x": [], "y": [], "type": "bar"}],
    "layout": {"title": "", "xaxis": {"title": ""}, "yaxis": {"title": ""}}
  }
]

Generate 6-8 publication-ready charts with realistic synthetic data. Return only the JSON array.
`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: analysisPrompt }] }],
          generationConfig: { 
            maxOutputTokens: 4000,
            temperature: 0.2
          }
        })
      });

      if (!response.ok) throw new Error('Gemini API error');
      
      const data = await response.json();
      let responseText = data.candidates[0]?.content?.parts[0]?.text || '';
      
      // Extract JSON from code block if wrapped
      const jsonMatch = responseText.match(/```(?:javascript|json)?\s*(\[[\s\S]*\])\s*```/);
      responseText = jsonMatch ? jsonMatch[1] : responseText;
      
      const chartConfigs = JSON.parse(responseText);
      
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
  }, [graphData, geminiApiKey]);

  // Generate evidence-specific visualization
  const generateEvidenceVisualization = useCallback(async (evidenceNode: GraphNode): Promise<AnalyticsFigure> => {
    const prompt = `
Generate a publication-ready visualization for this evidence node:

Node: ${evidenceNode.label}
Type: ${evidenceNode.type}
Confidence: ${evidenceNode.confidence}

Create a statistical visualization showing:
1. Evidence strength analysis
2. Confidence intervals
3. Supporting data distribution
4. Quality metrics

Return format:
{
  "title": "Evidence Analysis: [Node Label]",
  "data": [{"x": [], "y": [], "type": "bar|scatter|box"}],
  "layout": {"title": "", "xaxis": {"title": ""}, "yaxis": {"title": ""}}
}
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
      let code = data.candidates[0]?.content?.parts[0]?.text || '';
      
      const jsonMatch = code.match(/```(?:javascript|json)?\s*(\{[\s\S]*\})\s*```/);
      code = jsonMatch ? jsonMatch[1] : code;
      
      const plotConfig = JSON.parse(code);
      
      return {
        id: `evidence_${evidenceNode.id}_${Date.now()}`,
        title: plotConfig.title || `Evidence Analysis: ${evidenceNode.label}`,
        code: code,
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

  // Trigger comprehensive visualization generation for advanced stages
  useEffect(() => {
    if (currentStage < 4 || !plotlyLoaded || !geminiApiKey) return;

    // Generate comprehensive analysis for stages 6-9
    if (currentStage >= 6 && figures.length === 0) {
      const generateAnalysis = async () => {
        setIsGenerating(true);
        try {
          // Generate comprehensive visualizations
          const comprehensiveFigures = await generateComprehensiveVisualizations();
          
          // Generate evidence-specific visualizations
          const evidenceNodes = graphData.nodes.filter(node => node.type === 'evidence').slice(0, 3);
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
          
          toast.success(`Generated ${allFigures.length} comprehensive visualizations`);
        } catch (error) {
          toast.error(`Failed to generate comprehensive analysis: ${error}`);
        } finally {
          setIsGenerating(false);
        }
      };

      generateAnalysis();
    }
  }, [currentStage, graphData, plotlyLoaded, geminiApiKey, figures.length, generateComprehensiveVisualizations, generateEvidenceVisualization]);

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
                onClick={() => window.location.reload()}
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
