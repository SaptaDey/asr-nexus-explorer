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

  // Generate Gemini code execution request for data visualization
  const generateVisualizationCode = useCallback(async (evidenceNode: GraphNode): Promise<string> => {
    const prompt = `
Analyze this research evidence node and generate a JavaScript visualization using Plotly.js:

Node ID: ${evidenceNode.id}
Label: ${evidenceNode.label}
Type: ${evidenceNode.type}
Metadata: ${JSON.stringify(evidenceNode.metadata, null, 2)}

Requirements:
1. Return ONLY executable JavaScript code for Plotly.js
2. Create appropriate visualization based on the data type
3. Include proper data array and layout configuration
4. Use meaningful titles, labels, and colors
5. Make the visualization publication-ready

Expected format:
{
  data: [/* Plotly data traces */],
  layout: {
    title: "Title Here",
    xaxis: { title: "X Axis Label" },
    yaxis: { title: "Y Axis Label" },
    // other layout options
  },
  config: { responsive: true }
}

Generate synthetic but realistic data if no actual data is available.
`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 2000 }
        })
      });

      if (!response.ok) throw new Error('Gemini API error');
      
      const data = await response.json();
      const code = data.candidates[0]?.content?.parts[0]?.text || '';
      
      // Extract JSON from code block if wrapped
      const jsonMatch = code.match(/```(?:javascript|json)?\s*(\{[\\s\\S]*\})\s*```/);
      return jsonMatch ? jsonMatch[1] : code;
      
    } catch (error) {
      throw new Error(`Code generation failed: ${error}`);
    }
  }, [geminiApiKey]);

  // Execute generated code in sandbox and create visualization
  const executeVisualizationCode = useCallback(async (code: string, nodeId: string): Promise<AnalyticsFigure> => {
    try {
      // Sandbox evaluation of the generated code
      const sanitizedCode = code.replace(/[^{}[\]:;,"'\s\w-]/g, ''); // Basic sanitization
      const plotConfig = eval(`(${sanitizedCode})`);
      
      if (!plotConfig.data || !plotConfig.layout) {
        throw new Error('Invalid plot configuration generated');
      }

      // Determine chart type from the data
      const firstTrace = plotConfig.data[0];
      let chartType: AnalyticsFigure['type'] = 'scatter';
      
      if (firstTrace.type === 'bar') chartType = 'bar';
      else if (firstTrace.type === 'histogram') chartType = 'histogram';
      else if (firstTrace.type === 'box') chartType = 'box';
      else if (firstTrace.type === 'heatmap') chartType = 'heatmap';
      else if (firstTrace.type === 'pie') chartType = 'pie';

      return {
        id: `fig_${nodeId}_${Date.now()}`,
        title: plotConfig.layout.title || `Analysis for ${nodeId}`,
        code: code,
        data: plotConfig.data,
        layout: plotConfig.layout,
        type: chartType,
        nodeId: nodeId,
        generated: new Date().toISOString()
      };
      
    } catch (error) {
      throw new Error(`Code execution failed: ${error}`);
    }
  }, []);

  // Trigger automatic visualization generation for Stage 4 evidence nodes
  useEffect(() => {
    if (currentStage !== 4 || !plotlyLoaded || !geminiApiKey) return;

    const evidenceNodes = graphData.nodes.filter(node => 
      node.type === 'evidence' && 
      !figures.some(fig => fig.nodeId === node.id)
    );

    if (evidenceNodes.length === 0) return;

    const generateFigures = async () => {
      setIsGenerating(true);
      const newFigures: AnalyticsFigure[] = [];

      for (const node of evidenceNodes.slice(0, 3)) { // Limit to 3 to avoid API limits
        try {
          const code = await generateVisualizationCode(node);
          const figure = await executeVisualizationCode(code, node.id);
          newFigures.push(figure);
          
          toast.success(`Generated visualization for ${node.label}`);
        } catch (error) {
          const errorFigure: AnalyticsFigure = {
            id: `error_${node.id}`,
            title: `Error: ${node.label}`,
            code: '',
            data: [],
            layout: {},
            type: 'scatter',
            nodeId: node.id,
            generated: new Date().toISOString(),
            error: String(error)
          };
          newFigures.push(errorFigure);
          toast.error(`Failed to generate visualization for ${node.label}`);
        }
      }

      setFigures(prev => [...prev, ...newFigures]);
      setIsGenerating(false);
    };

    generateFigures();
  }, [currentStage, graphData.nodes, plotlyLoaded, geminiApiKey, figures, generateVisualizationCode, executeVisualizationCode]);

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
