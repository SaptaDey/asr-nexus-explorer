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
import { sanitizePlotlyConfig } from '@/utils/htmlSanitizer';
import { EvidenceDataExtractor, EvidenceBasedChart } from '@/services/EvidenceDataExtractor';

// Import Plotly.js dynamically to avoid bundle size issues
// Type definitions are now in src/types/plotly.d.ts

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
  // Track timeouts for cleanup to prevent memory leaks
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());

  // **PERFORMANCE OPTIMIZATION STATE**
  const [currentPage, setCurrentPage] = useState(0);
  const [renderedFigures, setRenderedFigures] = useState<Set<string>>(new Set());
  const [renderingInProgress, setRenderingInProgress] = useState<Set<string>>(new Set());
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    renderTimes: Record<string, number>;
    totalRenderTime: number;
    averageRenderTime: number;
  }>({ renderTimes: {}, totalRenderTime: 0, averageRenderTime: 0 });
  
  // **PAGINATION CONFIGURATION**
  const CHARTS_PER_PAGE = 4; // Render only 4 charts at a time
  const LAZY_LOAD_THRESHOLD = 2; // Start loading next batch when within 2 charts of end

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

  // Cleanup timeouts on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clear all pending timeouts
      timeoutsRef.current.forEach(timeout => {
        clearTimeout(timeout);
      });
      timeoutsRef.current.clear();
    };
  }, []);

  // Generate evidence-based analytical visualizations
  const generateComprehensiveVisualizations = useCallback(async (): Promise<AnalyticsFigure[]> => {
    if (!apiRateLimiter.isAllowed('visualization')) {
      throw new Error('Rate limit exceeded. Please wait before generating more visualizations.');
    }

    // **MAJOR IMPROVEMENT: Use real evidence data instead of random data**
    console.log('📊 Generating evidence-based charts from Stage 4 data...');
    
    // Extract evidence nodes from graph data
    const evidenceNodes = graphData.nodes.filter(node => node.type === 'evidence');
    
    if (evidenceNodes.length === 0) {
      throw new Error('No evidence data available. Please complete Stage 4 (Evidence Integration) first to generate meaningful visualizations.');
    }

    // Extract quantitative data from evidence nodes
    const extractedDatasets = EvidenceDataExtractor.extractQuantitativeData(evidenceNodes, researchContext);
    
    if (extractedDatasets.length === 0) {
      // Fallback to enhanced AI-generated charts with evidence context
      return await generateAIEnhancedCharts(evidenceNodes);
    }

    // Generate evidence-based charts
    const evidenceCharts = EvidenceDataExtractor.generateEvidenceBasedCharts(extractedDatasets, researchContext);
    
    // Convert to AnalyticsFigure format
    const analyticsFigures: AnalyticsFigure[] = evidenceCharts.map((chart, index) => ({
      id: `evidence-chart-${index}`,
      title: chart.title,
      type: chart.type,
      data: chart.data,
      layout: chart.layout,
      isLoading: false,
      error: null,
      metadata: {
        source: 'evidence-based',
        confidence: chart.confidence,
        evidenceNodes: chart.evidenceNodes,
        generatedAt: new Date().toISOString()
      }
    }));

    // Add supplementary AI-enhanced charts if we have fewer than 8 evidence-based charts
    if (analyticsFigures.length < 8) {
      const supplementaryCharts = await generateAIEnhancedCharts(evidenceNodes, 8 - analyticsFigures.length);
      analyticsFigures.push(...supplementaryCharts);
    }

    toast.success(`Generated ${analyticsFigures.length} evidence-based visualizations from ${evidenceNodes.length} evidence sources`, {
      description: `${extractedDatasets.length} datasets extracted from real research findings`
    });

    return analyticsFigures;

    // Helper function for AI-enhanced charts with evidence context
    async function generateAIEnhancedCharts(evidenceNodes: GraphNode[], maxCharts: number = 15): Promise<AnalyticsFigure[]> {
      // Extract evidence content for context
      const evidenceContext = evidenceNodes.map(node => ({
        source: node.label || 'Research Evidence',
        content: node.metadata?.value?.substring(0, 500) || 'Evidence data',
        confidence: node.confidence?.[0] || 0.7
      }));

      const enhancedPrompt = `
Based on the research topic "${researchContext.topic}" in the field of ${researchContext.field}, analyze the following REAL EVIDENCE and generate ${maxCharts} scientific charts:

REAL EVIDENCE FROM STAGE 4:
${evidenceContext.map((ev, i) => `
Evidence ${i + 1} (${ev.source}):
${ev.content}
Confidence: ${ev.confidence}
`).join('\n')}

Create charts that analyze and visualize patterns from this ACTUAL EVIDENCE, not synthetic data. Focus on:
1. Statistical findings mentioned in the evidence
2. Comparative analysis between evidence sources  
3. Confidence levels across different evidence
4. Quantitative trends identified in the research
5. Meta-analysis of the evidence quality

For each chart, reference the specific evidence source and extract actual numbers/patterns mentioned.

JSON format: [{"title": "Evidence-Based Analysis Title", "type": "bar|scatter|line|histogram|box", "data": [{"x": [labels_from_evidence], "y": [values_from_evidence], "type": "bar"}], "layout": {"title": "Chart analyzing real evidence", "xaxis": {"title": "Evidence Categories"}, "yaxis": {"title": "Values from Research"}}}]
`;

      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: enhancedPrompt }] }],
            generationConfig: { 
              maxOutputTokens: 30000,
              temperature: 0.2
            }
          })
        });

        if (!response.ok) throw new Error('Gemini API error');
        
        const data = await response.json();
        
        const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!responseText) {
          throw new Error('Gemini API returned invalid response structure');
        }
        
        // **ROBUST JSON PARSING with Progressive Fallback**
        const chartConfigs = await parseAIResponseWithFallback(responseText, maxCharts, evidenceNodes);
        
        return chartConfigs.map((config: any, index: number) => ({
          id: `evidence-enhanced-${index}`,
          title: config.title,
          type: config.type,
          data: config.data,
          layout: config.layout,
          nodeId: config.nodeId || 'evidence-analysis',
          generated: new Date().toISOString(),
          metadata: {
            source: 'evidence-enhanced-ai',
            confidence: 0.8,
            evidenceNodes: evidenceNodes.map(n => n.id),
            generatedAt: new Date().toISOString()
          }
        }));
        
      } catch (error) {
        console.error('AI-enhanced chart generation failed, attempting fallback:', error);
        // **GRACEFUL FALLBACK**: Try progressive retry with fewer charts
        return await attemptProgressiveFallback(evidenceNodes, maxCharts);
      }
    }

    // **ROBUST JSON PARSING with Multiple Extraction Strategies**
    async function parseAIResponseWithFallback(responseText: string, maxCharts: number, evidenceNodes: GraphNode[]): Promise<any[]> {
      console.log('🔍 Attempting to parse AI response with robust extraction...');
      
      // Strategy 1: Try multiple JSON extraction patterns
      const extractionPatterns = [
        /```(?:json|javascript)?\s*(\[[\s\S]*?\])\s*```/i,  // Code blocks
        /^\s*(\[[\s\S]*?\])\s*$/,                            // Direct array
        /json\s*:?\s*(\[[\s\S]*?\])/i,                       // After "json:" keyword
        /(\[[\s\S]*?\])/,                                     // Any array pattern
        /\{[\s\S]*?\}/g                                       // Individual objects (to build array)
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

            console.log(`📄 Trying extraction pattern: ${pattern.source.substring(0, 30)}...`);
            const parsed = JSON.parse(extractedJson);
            
            if (Array.isArray(parsed) && parsed.length > 0) {
              console.log(`✅ Successfully parsed ${parsed.length} charts with pattern`);
              return parsed.slice(0, maxCharts); // Limit to requested count
            }
          }
        } catch (parseError) {
          console.warn(`⚠️ Parse attempt failed with pattern ${pattern.source.substring(0, 20)}:`, parseError);
          continue;
        }
      }

      // Strategy 2: Try to extract individual chart objects and build array
      try {
        console.log('🔄 Attempting individual object extraction...');
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
              console.warn('⚠️ Failed to parse individual object:', err);
            }
          }
          if (charts.length > 0) {
            console.log(`✅ Extracted ${charts.length} individual chart objects`);
            return charts;
          }
        }
      } catch (error) {
        console.warn('⚠️ Individual object extraction failed:', error);
      }

      // Strategy 3: Last resort - generate minimal charts from evidence
      console.log('🚨 JSON parsing failed completely, generating minimal evidence charts...');
      return generateMinimalEvidenceCharts(evidenceNodes, Math.min(3, maxCharts));
    }

    // **PROGRESSIVE FALLBACK STRATEGY**
    async function attemptProgressiveFallback(evidenceNodes: GraphNode[], originalMaxCharts: number): Promise<AnalyticsFigure[]> {
      const fallbackStrategies = [
        { charts: Math.ceil(originalMaxCharts / 2), description: 'half the charts' },
        { charts: Math.ceil(originalMaxCharts / 3), description: 'one-third the charts' },
        { charts: 3, description: '3 simple charts' },
        { charts: 1, description: 'single chart' }
      ];

      for (const strategy of fallbackStrategies) {
        try {
          console.log(`🔄 Fallback attempt: Requesting ${strategy.charts} charts (${strategy.description})`);
          
          const fallbackPrompt = `
Based on the research topic "${researchContext.topic}", analyze the evidence and create EXACTLY ${strategy.charts} simple chart(s):

EVIDENCE:
${evidenceNodes.slice(0, 3).map((node, i) => `
${i + 1}. ${node.label}: ${node.metadata?.value?.substring(0, 200) || 'Evidence data'}
`).join('')}

Create ${strategy.charts} chart(s) with simple structure. Use ONLY valid JSON format:
[{"title": "Simple Evidence Chart", "type": "bar", "data": [{"x": ["Category 1", "Category 2"], "y": [1, 2], "type": "bar"}], "layout": {"title": "Evidence Analysis", "xaxis": {"title": "Categories"}, "yaxis": {"title": "Values"}}}]
`;

          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fallbackPrompt }] }],
              generationConfig: { 
                maxOutputTokens: 5000, // Reduced for simpler response
                temperature: 0.1
              }
            })
          });

          if (!response.ok) continue;
          
          const data = await response.json();
          const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (responseText) {
            const charts = await parseAIResponseWithFallback(responseText, strategy.charts, evidenceNodes);
            if (charts.length > 0) {
              console.log(`✅ Fallback success: Generated ${charts.length} charts with ${strategy.description}`);
              toast.success(`Generated ${charts.length} evidence-based charts (simplified due to complexity)`, {
                description: `Fallback strategy: ${strategy.description}`
              });
              return charts.map((config: any, index: number) => ({
                id: `fallback-${index}`,
                title: config.title || 'Evidence Analysis',
                code: JSON.stringify({
                  data: config.data || [{"x": ["Evidence"], "y": [1], "type": "bar"}],
                  layout: config.layout || {"title": "Evidence Analysis"}
                }),
                type: config.type || 'bar',
                data: config.data || [{"x": ["Evidence"], "y": [1], "type": "bar"}],
                layout: config.layout || {"title": "Evidence Analysis"},
                nodeId: 'fallback-analysis',
                generated: new Date().toISOString()
              }));
            }
          }
        } catch (error) {
          console.warn(`⚠️ Fallback strategy failed (${strategy.description}):`, error);
          continue;
        }
      }

      // Final fallback: Generate minimal charts from evidence content
      console.log('🔧 All fallback attempts failed, generating minimal evidence summary...');
      return generateMinimalEvidenceCharts(evidenceNodes, 2);
    }

    // **MINIMAL EVIDENCE CHARTS as Last Resort**
    function generateMinimalEvidenceCharts(evidenceNodes: GraphNode[], count: number): AnalyticsFigure[] {
      console.log('🛠️ Creating minimal evidence charts as final fallback...');
      
      const charts: AnalyticsFigure[] = [];
      
      // Chart 1: Evidence confidence levels
      if (evidenceNodes.length > 0 && count > 0) {
        charts.push({
          id: 'minimal-confidence',
          title: 'Evidence Confidence Levels',
          code: JSON.stringify({
            data: [{
              x: evidenceNodes.slice(0, 5).map((node, i) => `Evidence ${i + 1}`),
              y: evidenceNodes.slice(0, 5).map(node => node.confidence?.[0] || 0.7),
              type: 'bar',
              marker: { color: '#2563eb' }
            }],
            layout: {
              title: 'Evidence Confidence Analysis',
              xaxis: { title: 'Evidence Sources' },
              yaxis: { title: 'Confidence Level', range: [0, 1] }
            }
          }),
          type: 'bar',
          data: [{
            x: evidenceNodes.slice(0, 5).map((node, i) => `Evidence ${i + 1}`),
            y: evidenceNodes.slice(0, 5).map(node => node.confidence?.[0] || 0.7),
            type: 'bar',
            marker: { color: '#2563eb' }
          }],
          layout: {
            title: 'Evidence Confidence Analysis',
            xaxis: { title: 'Evidence Sources' },
            yaxis: { title: 'Confidence Level', range: [0, 1] }
          },
          nodeId: 'minimal-evidence',
          generated: new Date().toISOString()
        });
      }

      // Chart 2: Evidence source count
      if (count > 1) {
        const typeCount = evidenceNodes.reduce((acc: Record<string, number>, node) => {
          const type = node.type || 'evidence';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

        charts.push({
          id: 'minimal-types',
          title: 'Evidence Type Distribution',
          code: JSON.stringify({
            data: [{
              labels: Object.keys(typeCount),
              values: Object.values(typeCount),
              type: 'pie'
            }],
            layout: {
              title: 'Evidence Sources by Type'
            }
          }),
          type: 'pie',
          data: [{
            labels: Object.keys(typeCount),
            values: Object.values(typeCount),
            type: 'pie'
          }],
          layout: {
            title: 'Evidence Sources by Type'
          },
          nodeId: 'minimal-types',
          generated: new Date().toISOString()
        });
      }

      if (charts.length > 0) {
        toast.info(`Generated ${charts.length} minimal evidence charts`, {
          description: 'Showing basic evidence analysis due to parsing complexity'
        });
      }

      return charts;
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
        data: sanitizedConfig.data,
        layout: sanitizedConfig.layout,
        type: sanitizedConfig.data[0].type as AnalyticsFigure['type'],
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

      // SECURITY: Sanitize the plot configuration to remove any malicious content
      const sanitizedConfig = sanitizePlotlyConfig(plotConfig);

      // Determine chart type from the data
      const firstTrace = sanitizedConfig.data[0];
      let chartType: AnalyticsFigure['type'] = 'scatter';
      
      if (firstTrace?.type === 'bar') chartType = 'bar';
      else if (firstTrace?.type === 'histogram') chartType = 'histogram';
      else if (firstTrace?.type === 'box') chartType = 'box';
      else if (firstTrace?.type === 'heatmap') chartType = 'heatmap';
      else if (firstTrace?.type === 'pie') chartType = 'pie';

      return {
        id: `fig_${nodeId}_${Date.now()}`,
        title: typeof sanitizedConfig.layout.title === 'string' ? sanitizedConfig.layout.title : `Analysis for ${nodeId}`,
        code: code,
        data: sanitizedConfig.data,
        layout: sanitizedConfig.layout,
        type: chartType,
        nodeId: nodeId,
        generated: new Date().toISOString()
      };
      
    } catch (error) {
      throw new Error(`Safe parsing failed: ${error}`);
    }
  }, []);

  // **ENHANCED CACHE KEY with better context tracking**
  const getCacheKey = useCallback(() => {
    // Include more specific context for better cache invalidation
    const evidenceNodeIds = graphData.nodes
      .filter(node => node.type === 'evidence')
      .map(node => node.id)
      .sort()
      .join(',');
    
    const hypothesesCount = researchContext.hypotheses?.length || 0;
    const objectivesCount = researchContext.objectives?.length || 0;
    
    // Create hash-like key to prevent extremely long cache keys
    const contextString = `${researchContext.topic}-${researchContext.field}-${currentStage}-${graphData.nodes.length}-${evidenceNodeIds}-${hypothesesCount}-${objectivesCount}`;
    const contextHash = btoa(contextString).replace(/[+/=]/g, ''); // Simple base64 hash
    
    return `visual-analytics-${contextHash.substring(0, 32)}`; // Truncate for reasonable length
  }, [researchContext.topic, researchContext.field, researchContext.hypotheses, researchContext.objectives, currentStage, graphData.nodes]);

  // **ENHANCED CACHE LOADING with performance tracking**
  useEffect(() => {
    const cacheKey = getCacheKey();
    const cacheStartTime = performance.now();
    
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const cachedData = JSON.parse(cached);
        
        // Validate cached data structure
        if (cachedData.figures && Array.isArray(cachedData.figures)) {
          setFigures(cachedData.figures);
          setHasGenerated(true);
          
          // Restore performance metrics if available
          if (cachedData.performanceMetrics) {
            setPerformanceMetrics(cachedData.performanceMetrics);
          }
          
          // Mark cached figures as rendered to avoid re-rendering
          const cachedFigureIds = new Set(cachedData.figures.map((f: AnalyticsFigure) => f.id));
          setRenderedFigures(cachedFigureIds);
          
          const cacheLoadTime = performance.now() - cacheStartTime;
          console.log(`📦 Loaded ${cachedData.figures.length} cached figures in ${cacheLoadTime.toFixed(2)}ms`);
          
          toast.success(`Loaded ${cachedData.figures.length} cached visualizations`, {
            description: `Cache hit - loaded in ${cacheLoadTime.toFixed(0)}ms`
          });
        } else {
          console.warn('⚠️ Invalid cached data structure, clearing cache');
          sessionStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.warn('❌ Failed to load cached figures:', error);
      const cacheKey = getCacheKey();
      sessionStorage.removeItem(cacheKey); // Clear corrupted cache
    }
  }, [getCacheKey]);

  // **ENHANCED CACHE SAVING with performance metrics**
  useEffect(() => {
    if (figures.length > 0) {
      const cacheKey = getCacheKey();
      const cacheData = {
        figures,
        performanceMetrics,
        cachedAt: new Date().toISOString(),
        version: '2.0', // Cache version for future migrations
        context: {
          topic: researchContext.topic,
          field: researchContext.field,
          stage: currentStage,
          nodeCount: graphData.nodes.length
        }
      };
      
      try {
        const serialized = JSON.stringify(cacheData);
        
        // Check cache size and warn if too large
        const cacheSize = new Blob([serialized]).size;
        if (cacheSize > 5 * 1024 * 1024) { // 5MB warning threshold
          console.warn(`⚠️ Cache size is large: ${(cacheSize / 1024 / 1024).toFixed(2)}MB`);
          toast.warning('Large cache detected', {
            description: `${(cacheSize / 1024 / 1024).toFixed(1)}MB - may impact performance`
          });
        }
        
        sessionStorage.setItem(cacheKey, serialized);
        console.log(`💾 Cached ${figures.length} figures (${(cacheSize / 1024).toFixed(1)}KB)`);
      } catch (error) {
        console.error('❌ Failed to cache figures:', error);
        // If caching fails (e.g., quota exceeded), try to clean up old caches
        cleanupOldCaches();
      }
    }
  }, [figures, performanceMetrics, getCacheKey, researchContext.topic, researchContext.field, currentStage, graphData.nodes.length]);

  // **CACHE CLEANUP UTILITY**
  const cleanupOldCaches = useCallback(() => {
    try {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith('visual-analytics-')) {
          keysToRemove.push(key);
        }
      }
      
      // Remove old cache entries (keep only current)
      const currentKey = getCacheKey();
      keysToRemove.forEach(key => {
        if (key !== currentKey) {
          sessionStorage.removeItem(key);
        }
      });
      
      console.log(`🧹 Cleaned up ${keysToRemove.length - 1} old cache entries`);
    } catch (error) {
      console.warn('Failed to cleanup old caches:', error);
    }
  }, [getCacheKey]);

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
  }, [currentStage, plotlyLoaded, geminiApiKey, hasGenerated, graphData.nodes.length, figures.length, generateComprehensiveVisualizations]);

  // **PERFORMANCE-OPTIMIZED LAZY RENDERING**
  const renderPlotlyFigure = useCallback((figure: AnalyticsFigure, isLazyLoad: boolean = false) => {
    if (!plotlyLoaded || figure.error) return null;

    const containerId = `plot-${figure.id}`;
    const isAlreadyRendered = renderedFigures.has(figure.id);
    const isCurrentlyRendering = renderingInProgress.has(figure.id);
    
    // **LAZY LOADING**: Only render when visible or explicitly requested
    const shouldRender = !isLazyLoad || selectedFigure === figure.id || isAlreadyRendered;
    
    if (!shouldRender) {
      // Return placeholder for unrendered charts
      return (
        <div className="w-full h-[400px] border rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading chart...</p>
          </div>
        </div>
      );
    }

    // **PERFORMANCE MONITORING**: Track render times
    const renderChart = () => {
      if (isCurrentlyRendering || isAlreadyRendered) return;
      
      setRenderingInProgress(prev => new Set([...prev, figure.id]));
      const startTime = performance.now();
      
      const container = document.getElementById(containerId);
      if (container && window.Plotly && container.children.length === 0) {
        // **OPTIMIZED PLOTLY CONFIG for better performance**
        const optimizedConfig = {
          responsive: true,
          displayModeBar: true,
          modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
          // **PERFORMANCE OPTIMIZATIONS**
          plotlyServerURL: false, // Disable server-side features
          showTips: false, // Disable hover tooltips for better performance
          staticPlot: false, // Keep interactive but optimized
          doubleClick: false, // Disable double-click zoom
          scrollZoom: false, // Disable scroll zoom for better performance
        };

        // **DATA OPTIMIZATION**: Reduce points if too many
        const optimizedData = figure.data.map((trace: any) => {
          const optimizedTrace = { ...trace };
          
          // If trace has too many points, sample them for better performance
          if (trace.x && trace.x.length > 1000) {
            console.log(`📊 Optimizing chart ${figure.id}: Reducing ${trace.x.length} points to 500 for better performance`);
            const step = Math.ceil(trace.x.length / 500);
            optimizedTrace.x = trace.x.filter((_: any, index: number) => index % step === 0);
            if (trace.y) optimizedTrace.y = trace.y.filter((_: any, index: number) => index % step === 0);
            if (trace.z) optimizedTrace.z = trace.z.filter((_: any, index: number) => index % step === 0);
          }
          
          return optimizedTrace;
        });

        window.Plotly.newPlot(container, optimizedData, figure.layout, optimizedConfig)
          .then(() => {
            const endTime = performance.now();
            const renderTime = endTime - startTime;
            
            // **UPDATE PERFORMANCE METRICS**
            setPerformanceMetrics(prev => {
              const newRenderTimes = { ...prev.renderTimes, [figure.id]: renderTime };
              const totalTime = Object.values(newRenderTimes).reduce((sum, time) => sum + time, 0);
              const avgTime = totalTime / Object.keys(newRenderTimes).length;
              
              return {
                renderTimes: newRenderTimes,
                totalRenderTime: totalTime,
                averageRenderTime: avgTime
              };
            });
            
            setRenderedFigures(prev => new Set([...prev, figure.id]));
            setRenderingInProgress(prev => {
              const newSet = new Set(prev);
              newSet.delete(figure.id);
              return newSet;
            });
            
            console.log(`📊 Chart ${figure.id} rendered in ${renderTime.toFixed(2)}ms`);
            
            // **AUTO-LOAD NEXT CHARTS** if this is part of pagination
            const currentIndex = figures.findIndex(f => f.id === figure.id);
            const totalPages = Math.ceil(figures.length / CHARTS_PER_PAGE);
            const currentPageFromIndex = Math.floor(currentIndex / CHARTS_PER_PAGE);
            
            if (currentIndex >= 0 && currentPageFromIndex < totalPages - 1) {
              const nextPageStart = (currentPageFromIndex + 1) * CHARTS_PER_PAGE;
              const nextPageEnd = Math.min(nextPageStart + CHARTS_PER_PAGE, figures.length);
              
              // Trigger rendering of next page if user is close to the end
              if (currentIndex >= nextPageStart - LAZY_LOAD_THRESHOLD) {
                for (let i = nextPageStart; i < nextPageEnd; i++) {
                  if (figures[i] && !renderedFigures.has(figures[i].id)) {
                    console.log(`🚀 Auto-loading next chart: ${figures[i].id}`);
                    const timeoutId = setTimeout(() => {
                      timeoutsRef.current.delete(timeoutId);
                      renderPlotlyFigure(figures[i], true);
                    }, 100 * (i - nextPageStart));
                    timeoutsRef.current.add(timeoutId);
                  }
                }
              }
            }
          })
          .catch((error) => {
            console.error(`❌ Failed to render chart ${figure.id}:`, error);
            setRenderingInProgress(prev => {
              const newSet = new Set(prev);
              newSet.delete(figure.id);
              return newSet;
            });
          });
      }
    };

    // Render immediately if should render (removed useEffect to comply with React hooks rules)
    if (shouldRender && !isAlreadyRendered && !isCurrentlyRendering) {
      // Trigger async render
      const timeoutId = setTimeout(() => {
        timeoutsRef.current.delete(timeoutId);
        renderChart();
      }, 0);
      timeoutsRef.current.add(timeoutId);
    }

    return (
      <div
        id={containerId}
        className="w-full h-[400px] border rounded-lg bg-white dark:bg-gray-900"
        data-figure-id={figure.id}
      />
    );
  }, [plotlyLoaded, renderedFigures, renderingInProgress, selectedFigure, figures]);

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
              {renderedFigures.size > 0 && (
                <Badge variant="secondary">
                  {renderedFigures.size}/{figures.length} Rendered
                </Badge>
              )}
              {renderingInProgress.size > 0 && (
                <Badge variant="secondary" className="animate-pulse">
                  Rendering {renderingInProgress.size}...
                </Badge>
              )}
              {isGenerating && (
                <Badge variant="secondary" className="animate-pulse">
                  Generating...
                </Badge>
              )}
              {performanceMetrics.averageRenderTime > 0 && (
                <Badge variant="outline" className="text-xs">
                  Avg: {performanceMetrics.averageRenderTime.toFixed(0)}ms
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  // **ENHANCED CACHE CLEARING with performance reset**
                  const cacheKey = getCacheKey();
                  sessionStorage.removeItem(cacheKey);
                  cleanupOldCaches();
                  
                  // Reset all state
                  setFigures([]);
                  setHasGenerated(false);
                  setRenderedFigures(new Set());
                  setRenderingInProgress(new Set());
                  setPerformanceMetrics({ renderTimes: {}, totalRenderTime: 0, averageRenderTime: 0 });
                  setCurrentPage(0);
                  
                  toast.info('Clearing cache and regenerating visualizations...', {
                    description: 'Performance metrics reset'
                  });
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
