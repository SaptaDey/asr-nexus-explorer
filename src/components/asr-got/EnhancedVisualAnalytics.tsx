/**
 * Enhanced Visual Analytics Hook - Provides comprehensive chart generation
 * Exports figures and data for integration with other components
 */

import { useState, useCallback, useEffect } from 'react';
import { GraphData, GraphNode, ResearchContext } from '@/types/asrGotTypes';
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
  geminiApiKey: string,
  researchContext: ResearchContext
) => {
  const [figures, setFigures] = useState<AnalyticsFigure[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate evidence-based analytical visualizations from actual research data
  const generateComprehensiveVisualizations = useCallback(async (): Promise<AnalyticsFigure[]> => {
    if (!apiRateLimiter.isAllowed('visualization')) {
      throw new Error('Rate limit exceeded. Please wait before generating more visualizations.');
    }

    // **CRITICAL: NO SYNTHETIC DATA - Use only evidence from Stage 4**
    console.log('🔍 Enhanced Analytics: Using ONLY evidence-based data (NO synthetic data)');
    
    // Extract evidence nodes from graph data
    const evidenceNodes = graphData.nodes.filter(node => node.type === 'evidence');
    
    if (evidenceNodes.length === 0) {
      console.warn('⚠️ No evidence nodes available - cannot generate charts without real data');
      return [];
    }

    // Extract actual quantitative data from evidence
    const evidenceContent = evidenceNodes.map(node => ({
      id: node.id,
      label: node.label || 'Research Evidence',
      content: node.metadata?.value || '',
      confidence: node.confidence?.[0] || 0.7
    }));

    const evidenceAnalysisPrompt = `
CRITICAL INSTRUCTION: Analyze the following ACTUAL RESEARCH EVIDENCE and create charts based ONLY on data mentioned in this evidence. DO NOT generate synthetic or "realistic" data.

Research Topic: ${researchContext.topic}
Field: ${researchContext.field}

ACTUAL EVIDENCE FROM STAGE 4:
${evidenceContent.map((ev, i) => `
Evidence ${i + 1}: ${ev.label}
Content: ${ev.content.substring(0, 800)}
Confidence: ${ev.confidence}
---`).join('\n')}

REQUIREMENTS:
1. Extract ONLY numerical data explicitly mentioned in the evidence above
2. Create charts that visualize patterns in this ACTUAL evidence
3. Reference specific evidence sources in chart titles
4. If insufficient quantitative data exists, return empty array []
5. DO NOT create synthetic, realistic, or example data

Return JSON array with charts based ONLY on actual evidence data:
[{"title": "Evidence-Based: [specific finding from evidence]", "type": "bar|scatter|line", "data": [{"x": [actual_categories_from_evidence], "y": [actual_values_from_evidence], "type": "bar"}], "layout": {"title": "Chart of Actual Evidence Data", "xaxis": {"title": "Categories from Evidence"}, "yaxis": {"title": "Values from Evidence"}}}]
`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: evidenceAnalysisPrompt }] }],
          generationConfig: { 
            maxOutputTokens: 8000,
            temperature: 0.1
          }
        })
      });

      if (!response.ok) throw new Error('Failed to generate visualizations');
      
      const data = await response.json();
      
      // **GRACEFUL ERROR HANDLING**: Check if response was truncated due to token limit
      if (data.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
        console.warn('⚠️ Visualization response truncated - using fallback strategy (no UI error)');
        const partialText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (partialText && partialText.includes('[')) {
          // Try to extract partial visualization configs
          try {
            const truncatedJson = partialText + ']'; // Close the array if truncated
            const partialConfigs = JSON.parse(truncatedJson);
            console.log(`✅ Extracted ${partialConfigs.length} partial visualizations (graceful degradation)`);
            // Continue with partial results instead of throwing error
            if (Array.isArray(partialConfigs) && partialConfigs.length > 0) {
              return partialConfigs.slice(0, 3); // Return limited set to prevent further issues
            }
          } catch (parseError) {
            console.warn('Could not parse truncated response - continuing without error propagation');
          }
        }
        // Return empty array to prevent UI errors - visualization is optional
        console.log('📊 Gracefully degrading to no enhanced visualizations (preserving UI stability)');
        return [];
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
      // **SILENT ERROR HANDLING**: Log error but don't propagate to UI
      console.warn('Enhanced visualization generation failed (graceful degradation):', error);
      // Return empty array instead of throwing - visualizations are optional
      return [];
    }
  }, [graphData, currentStage, geminiApiKey, researchContext]);

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
        } else {
          // Silent fallback - no error toast for optional visualizations
          console.log('📊 Enhanced visualizations not available - continuing with standard analysis');
        }
      } catch (error) {
        // **GRACEFUL ERROR HANDLING**: Log error but don't show error toast for optional features
        console.warn('Enhanced visualizations failed (graceful degradation):', error);
        // Don't show error toast - visualizations are enhancement, not critical
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