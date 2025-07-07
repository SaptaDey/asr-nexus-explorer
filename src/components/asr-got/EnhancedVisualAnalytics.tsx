/**
 * Enhanced Visual Analytics Hook - Provides comprehensive chart generation
 * Exports figures and data for integration with other components
 */

import { useState, useCallback, useEffect } from 'react';
import { GraphData, GraphNode } from '@/types/asrGotTypes';
import { toast } from 'sonner';
import { apiRateLimiter } from '@/utils/securityUtils';

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

export const useEnhancedVisualAnalytics = (
  graphData: GraphData,
  currentStage: number,
  geminiApiKey: string
) => {
  const [figures, setFigures] = useState<AnalyticsFigure[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate comprehensive analytical visualizations
  const generateComprehensiveVisualizations = useCallback(async (): Promise<AnalyticsFigure[]> => {
    if (!apiRateLimiter.isAllowed('visualization')) {
      throw new Error('Rate limit exceeded. Please wait before generating more visualizations.');
    }

    const analysisPrompt = `
Generate 4 research charts for ASR-GoT analysis (Nodes: ${graphData.nodes.length}, Edges: ${graphData.edges.length}, Stage: ${currentStage}):

1. Node degree histogram
2. Confidence scatter plot  
3. Research quality heatmap
4. Effect size comparison

Return JSON array only:
[{"title": "Chart Name", "type": "bar|scatter|heatmap", "data": [{"x": [1,2,3], "y": [4,5,6], "type": "bar"}], "layout": {"title": "Title", "xaxis": {"title": "X"}, "yaxis": {"title": "Y"}}}]
`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: analysisPrompt }] }],
          generationConfig: { 
            maxOutputTokens: 8000,
            temperature: 0.1
          }
        })
      });

      if (!response.ok) throw new Error('Failed to generate visualizations');
      
      const data = await response.json();
      
      // Check if response was truncated due to token limit
      if (data.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
        throw new Error('Response was truncated due to token limit. Please try again or use a shorter prompt.');
      }
      
      // Robust API response extraction
      const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) {
        throw new Error('Invalid API response structure');
      }
      
      // Multiple extraction strategies for JSON with robust parsing
      let extractedJson = responseText.trim();
      
      // Remove leading/trailing markdown code blocks
      extractedJson = extractedJson.replace(/^```(?:json|javascript)?\s*/i, '');
      extractedJson = extractedJson.replace(/\s*```$/i, '');
      
      // Extract JSON array from various formats
      const patterns = [
        /```(?:json|javascript)?\s*(\[[\s\S]*?\])\s*```/i,  // Code blocks
        /^\s*(\[[\s\S]*?\])\s*$/,                           // Direct array
        /json\s*(\[[\s\S]*?\])/i,                          // After "json" keyword
        /(\[[\s\S]*?\])/                                    // Any array pattern
      ];
      
      for (const pattern of patterns) {
        const match = responseText.match(pattern);
        if (match) {
          extractedJson = match[1];
          break;
        }
      }
      
      // Final cleanup
      extractedJson = extractedJson.trim();
      
      let chartConfigs;
      try {
        chartConfigs = JSON.parse(extractedJson);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Raw response:', responseText);
        console.error('Extracted JSON:', extractedJson);
        throw new Error(`JSON parsing failed: ${parseError}`);
      }
      
      // Validate array structure
      if (!Array.isArray(chartConfigs)) {
        throw new Error('Response is not a valid array of chart configurations');
      }
      
      return chartConfigs.map((config: any, index: number) => ({
        id: `enhanced_${index}_${Date.now()}`,
        title: config.title,
        code: JSON.stringify(config, null, 2),
        data: config.data,
        layout: config.layout,
        type: config.type as AnalyticsFigure['type'],
        nodeId: 'comprehensive_analysis',
        generated: new Date().toISOString()
      }));
      
    } catch (error) {
      console.error('Enhanced visualization generation failed:', error);
      return [];
    }
  }, [graphData, currentStage, geminiApiKey]);

  // Auto-generate visualizations for stages 6+
  useEffect(() => {
    if (currentStage < 6 || !geminiApiKey || figures.length > 0) return;

    const generateVisualizations = async () => {
      setIsGenerating(true);
      try {
        const newFigures = await generateComprehensiveVisualizations();
        setFigures(newFigures);
        
        if (newFigures.length > 0) {
          toast.success(`Generated ${newFigures.length} comprehensive research visualizations`);
        }
      } catch (error) {
        toast.error('Failed to generate enhanced visualizations');
      } finally {
        setIsGenerating(false);
      }
    };

    generateVisualizations();
  }, [currentStage, geminiApiKey, figures.length, generateComprehensiveVisualizations]);

  // Export figure as data URL for HTML embedding
  const exportFigureAsDataURL = useCallback(async (figure: AnalyticsFigure): Promise<string> => {
    if (typeof window !== 'undefined' && window.Plotly) {
      try {
        const container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '600px';
        
        await window.Plotly.newPlot(container, figure.data, figure.layout, {
          responsive: true,
          displayModeBar: false
        });
        
        const dataUrl = await window.Plotly.toImage(container, {
          format: 'png',
          width: 800,
          height: 600
        });
        
        return dataUrl;
      } catch (error) {
        console.error('Failed to export figure:', error);
        return '';
      }
    }
    return '';
  }, []);

  return {
    figures,
    isGenerating,
    exportFigureAsDataURL,
    generateComprehensiveVisualizations
  };
};