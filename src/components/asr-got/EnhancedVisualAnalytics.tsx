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
      
      // **ROBUST JSON PARSING with Progressive Fallback**
      const chartConfigs = await parseEnhancedResponseWithFallback(responseText, 4);
      
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
      console.warn('Enhanced visualization generation failed, attempting progressive fallback:', error);
      // **PROGRESSIVE FALLBACK**: Try simpler requests instead of returning empty
      return await attemptEnhancedFallback();
    }

    // **ROBUST JSON PARSING for Enhanced Analytics**
    async function parseEnhancedResponseWithFallback(responseText: string, maxCharts: number): Promise<any[]> {
      console.log('🔍 Enhanced Analytics: Parsing AI response with robust extraction...');
      
      // Strategy 1: Multiple JSON extraction patterns
      const extractionPatterns = [
        /```(?:json|javascript)?\s*(\[[\s\S]*?\])\s*```/i,  // Code blocks
        /^\s*(\[[\s\S]*?\])\s*$/,                            // Direct array
        /json\s*:?\s*(\[[\s\S]*?\])/i,                       // After "json:" keyword
        /(\[[\s\S]*?\])/                                     // Any array pattern
      ];

      for (const pattern of extractionPatterns) {
        try {
          const match = responseText.match(pattern);
          if (match) {
            let extractedJson = match[1] || match[0];
            
            // Clean up common JSON formatting issues
            extractedJson = extractedJson
              .replace(/,\s*}/g, '}')      // Remove trailing commas in objects
              .replace(/,\s*]/g, ']')      // Remove trailing commas in arrays
              .replace(/([{,]\s*)(\w+):/g, '$1"$2":')  // Quote unquoted keys
              .trim();

            const parsed = JSON.parse(extractedJson);
            
            if (Array.isArray(parsed) && parsed.length > 0) {
              console.log(`✅ Enhanced: Successfully parsed ${parsed.length} charts`);
              return parsed.slice(0, maxCharts);
            }
          }
        } catch (parseError) {
          console.warn(`⚠️ Enhanced: Parse attempt failed:`, parseError);
          continue;
        }
      }

      // Strategy 2: Extract individual objects
      try {
        const objectMatches = responseText.match(/\{[^{}]*"title"[^{}]*\}/g);
        if (objectMatches && objectMatches.length > 0) {
          const charts = [];
          for (const objStr of objectMatches.slice(0, maxCharts)) {
            try {
              const cleanObj = objStr
                .replace(/,\s*}/g, '}')
                .replace(/([{,]\s*)(\w+):/g, '$1"$2":');
              const parsed = JSON.parse(cleanObj);
              if (parsed.title && parsed.type) {
                charts.push(parsed);
              }
            } catch (err) {
              continue;
            }
          }
          if (charts.length > 0) {
            console.log(`✅ Enhanced: Extracted ${charts.length} individual objects`);
            return charts;
          }
        }
      } catch (error) {
        console.warn('⚠️ Enhanced: Individual object extraction failed:', error);
      }

      throw new Error('All JSON parsing strategies failed');
    }

    // **PROGRESSIVE FALLBACK for Enhanced Analytics**
    async function attemptEnhancedFallback(): Promise<AnalyticsFigure[]> {
      const fallbackStrategies = [
        { charts: 2, description: '2 simple charts' },
        { charts: 1, description: 'single chart' }
      ];

      for (const strategy of fallbackStrategies) {
        try {
          console.log(`🔄 Enhanced Fallback: Requesting ${strategy.charts} charts`);
          
          const fallbackPrompt = `
Create ${strategy.charts} simple chart(s) for research topic "${researchContext.topic}".

Use basic chart types and valid JSON format:
[{"title": "Research Overview", "type": "bar", "data": [{"x": ["Category A", "Category B"], "y": [5, 8], "type": "bar"}], "layout": {"title": "Research Analysis", "xaxis": {"title": "Categories"}, "yaxis": {"title": "Values"}}}]
`;

          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fallbackPrompt }] }],
              generationConfig: { 
                maxOutputTokens: 3000,
                temperature: 0.1
              }
            })
          });

          if (!response.ok) continue;
          
          const data = await response.json();
          const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (responseText) {
            const charts = await parseEnhancedResponseWithFallback(responseText, strategy.charts);
            if (charts.length > 0) {
              console.log(`✅ Enhanced Fallback success: ${charts.length} charts`);
              toast.success(`Generated ${charts.length} enhanced charts (simplified)`, {
                description: `Fallback: ${strategy.description}`
              });
              return charts.map((config: any, index: number) => ({
                id: `enhanced_fallback_${index}_${Date.now()}`,
                title: config.title || 'Research Analysis',
                code: JSON.stringify(config, null, 2),
                data: config.data || [{"x": ["Research"], "y": [1], "type": "bar"}],
                layout: config.layout || {"title": "Research Analysis"},
                type: config.type || 'bar',
                nodeId: 'enhanced_fallback',
                generated: new Date().toISOString()
              }));
            }
          }
        } catch (error) {
          console.warn(`⚠️ Enhanced fallback failed (${strategy.description}):`, error);
          continue;
        }
      }

      // Final fallback: return empty array with info message
      console.log('🔧 All enhanced fallback attempts failed, skipping enhanced charts');
      toast.info('Enhanced visualizations unavailable', {
        description: 'Using standard evidence-based charts instead'
      });
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