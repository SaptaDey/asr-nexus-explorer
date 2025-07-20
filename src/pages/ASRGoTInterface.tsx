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
import { Brain, Database, FileText, Download, Zap, Settings, Network, Play, RotateCcw, Mail, ToggleLeft, BookOpen, Bug } from 'lucide-react';
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
import { useASRGoT } from '@/hooks/useASRGoT';
import { useProcessingMode } from '@/hooks/asr-got/useProcessingMode';
import { costAwareOrchestration } from '@/services/CostAwareOrchestrationService';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { APICredentials } from '@/types/asrGotTypes';

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
    canExportHtml
  } = useASRGoT();

  const [showAPICredentialsModal, setShowAPICredentialsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('research');
  const [showBiasAudit, setShowBiasAudit] = useState(false);
  const [exportContent, setExportContent] = useState<string>('');
  
  const { mode, toggleMode, isAutomatic } = useProcessingMode('manual');

  // Auto-switch to export tab when all 9 stages are completed
  useEffect(() => {
    if (currentStage >= 8 && stageResults.length >= 9) {
      // Check if we have results for all 9 stages
      const completedStages = stageResults.filter(result => result && result.trim()).length;
      if (completedStages >= 9) {
        setActiveTab('export');
        toast.success('🎉 All 9 stages completed! Switched to Export tab to view your HTML report.');
      }
    }
  }, [currentStage, stageResults]);


  const handleAPICredentialsSave = (credentials: APICredentials) => {
    updateApiKeys(credentials);
    toast.success('✅ API credentials saved successfully.');
  };


  const handleExportHTML = async () => {
    if (!hasResults) {
      toast.error('No results to export yet - run some analysis stages first');
      return;
    }
    
    // Check if we have a comprehensive HTML report from stage 7 or 9
    const htmlReportStages = [6, 8]; // Stage 7 (index 6) and Stage 9 (index 8)
    let htmlReport = null;
    
    for (const stageIndex of htmlReportStages.reverse()) {
      if (stageResults[stageIndex] && 
          (stageResults[stageIndex].includes('<!DOCTYPE html') || 
           stageResults[stageIndex].includes('<html'))) {
        htmlReport = stageResults[stageIndex];
        break;
      }
    }
    
    if (htmlReport) {
      // Export the comprehensive HTML report directly
      const blob = new Blob([htmlReport], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `asr-got-${researchContext.topic.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('✅ Comprehensive HTML report exported successfully');
      
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
        const evidenceDescriptions = evidenceNodes.slice(0, 5).map(node => 
          `- ${node.label}: ${node.description || 'Evidence source'}`
        ).join('\n');

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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: analysisPrompt }] }],
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
                    <div class="metadata-value">${Math.round(((stageResults.filter(r => r && r.trim()).length / 9) * 100))}%</div>
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
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
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
      <UnifiedAPICredentialsModal
        open={showAPICredentialsModal}
        onOpenChange={setShowAPICredentialsModal}
        onCredentialsSave={handleAPICredentialsSave}
        existingCredentials={apiKeys}
      />

      {/* Bias Auditing Sidebar */}
      {showBiasAudit && (
        <div className="fixed right-0 top-0 bottom-0 z-20 bg-background border-l shadow-lg w-full sm:w-96">
          <BiasAuditingSidebar
            graphData={graphData}
            researchContext={researchContext}
            currentStage={currentStage}
            geminiApiKey={apiKeys.gemini}
            onRefreshAudit={() => {
              toast.info('Refreshing bias audit...');
            }}
          />
        </div>
      )}

      {/* Main Interface */}
      <div className={`container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 transition-all duration-300 ${showBiasAudit ? 'sm:mr-96' : ''}`}>
        
        {/* 🐛 Debug Button - Always Visible at Bottom */}
        <div className="fixed bottom-4 right-4 z-50">
          <DebugButton />
        </div>
        
        {/* Spectacular Hero Section with Multiple Images */}
        <div className="text-center mb-8">
          {/* Hero Section with Prominent Logo */}
          <div className="relative mb-4 sm:mb-8 overflow-hidden rounded-xl sm:rounded-3xl" style={{ minHeight: 'clamp(300px, 50vh, 500px)' }}>
            {/* Hero Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: 'url("/img/hero.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.8)'
              }}
            ></div>
            
            {/* Main Logo - Centered and Prominent */}
            <div 
              className="absolute inset-0 bg-contain bg-no-repeat bg-center opacity-50"
              style={{
                backgroundImage: 'url("/img/logo.png")',
                backgroundSize: 'contain',
                backgroundPosition: 'center'
              }}
            ></div>
            
            {/* Subtle Logo Fade Effect - Lighter Radial Gradient */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at center, transparent 25%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.7) 75%, rgba(255,255,255,0.85) 90%)'
              }}
            ></div>
            
            {/* Gentle overlays for text visibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-white/70"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-transparent to-white/60"></div>
            
            {/* Hero Content */}
            <div className="relative z-10 p-12 lg:p-20">
              <div className="max-w-6xl mx-auto">
                {/* Main Title */}
                <div className="mb-10">
                  <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6 text-slate-900" style={{ textShadow: '2px 2px 4px rgba(255,255,255,0.8)' }}>
                    Scientific Reasoning
                  </h1>
                  <p className="text-2xl lg:text-4xl mb-8 font-semibold text-slate-700" style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.8)' }}>
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
                
                {/* Description */}
                <div className="max-w-5xl mx-auto mb-10">
                  <p className="text-lg lg:text-xl mb-8 leading-relaxed font-medium text-slate-800" style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.8)' }}>
                    🚀 Next-Generation AI Reasoning Framework leveraging graph structures to transform scientific research methodologies
                  </p>
                  
                  {/* Elegant Call-to-Action Buttons */}
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link to="/guide">
                      <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg text-lg px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-xl">
                        <BookOpen className="h-5 w-5 mr-2" />
                        Learn How It Works
                      </Button>
                    </Link>
                    <Button 
                      size="lg" 
                      className="bg-purple-500 hover:bg-purple-600 text-white shadow-lg text-lg px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-xl"
                      onClick={() => {
                        setActiveTab('research');
                        document.getElementById('research-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      <Brain className="h-5 w-5 mr-2" />
                      Explore Features
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Clean Status Indicators */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg border border-gray-200">
              <div className="flex items-center gap-4">
                <Badge className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full font-medium">
                  Stage {currentStage + 1}/9
                </Badge>
                <Progress value={stageProgress} className="w-32 h-2" />
                {isProcessing && (
                  <Badge className="bg-orange-500 text-white px-3 py-1 rounded-full font-medium">
                    Processing...
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Clean Interactive Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Mode Toggle */}
            <div className="w-full sm:w-auto bg-white/90 backdrop-blur-sm rounded-lg px-4 sm:px-6 py-3 shadow-lg border border-gray-200">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                <div className={`transition-all duration-300 ${isAutomatic ? 'text-green-600' : 'text-blue-600'}`}>
                  {isAutomatic ? 
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs sm:text-sm font-semibold">AUTO MODE</span>
                    </div> :
                    <div className="flex items-center gap-2">
                      <ToggleLeft className="h-4 w-4" />
                      <span className="text-xs sm:text-sm font-semibold">MANUAL MODE</span>
                    </div>
                  }
                </div>
                <Button
                  onClick={toggleMode}
                  className={`transition-all duration-300 ${
                    isAutomatic 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-blue-500 hover:bg-blue-600'
                  } text-white font-medium rounded-md px-3 sm:px-4 py-2 text-xs sm:text-sm`}
                  size="sm"
                >
                  <span className="hidden sm:inline">Switch to {isAutomatic ? 'Manual' : 'Auto'}</span>
                  <span className="sm:hidden">{isAutomatic ? 'Manual' : 'Auto'}</span>
                </Button>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <Link to="/contact">
                <Button 
                  size="sm"
                  className="bg-slate-600 hover:bg-slate-700 text-white shadow-lg transition-all duration-200 rounded-lg px-3 sm:px-6 py-2 sm:py-3 font-semibold text-xs sm:text-sm w-full sm:w-auto"
                >
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Contact Us</span>
                  <span className="sm:hidden">Contact</span>
                </Button>
              </Link>
              
              {/* API Configuration Button */}
              <Button
                size="sm"
                variant={(apiKeys.gemini && apiKeys.perplexity) ? "default" : "outline"}
                onClick={() => setShowAPICredentialsModal(true)}
                className={`shadow-lg transition-all duration-200 rounded-lg px-3 sm:px-6 py-2 sm:py-3 font-semibold text-xs sm:text-sm w-full sm:w-auto ${
                  (apiKeys.gemini && apiKeys.perplexity)
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'border-blue-300 text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Settings className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">
                  {(apiKeys.gemini && apiKeys.perplexity) ? 'API Setup ✓' : 'Configure APIs'}
                </span>
                <span className="sm:hidden">
                  {(apiKeys.gemini && apiKeys.perplexity) ? 'APIs ✓' : 'APIs'}
                </span>
              </Button>
              
              {currentStage >= 8 && (
                <Button
                  size="sm"
                  variant={showBiasAudit ? "default" : "outline"}
                  onClick={() => setShowBiasAudit(!showBiasAudit)}
                  className="shadow-lg transition-all duration-200 rounded-lg px-3 sm:px-6 py-2 sm:py-3 font-semibold text-xs sm:text-sm w-full sm:w-auto"
                >
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{showBiasAudit ? 'Hide' : 'Show'} Bias Audit</span>
                  <span className="sm:hidden">{showBiasAudit ? 'Hide' : 'Show'} Audit</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Clean Tabs Navigation */}
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-1 gap-1">
            <TabsTrigger 
              value="research" 
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-slate-700 font-medium rounded-md transition-all duration-200 hover:bg-blue-50 data-[state=active]:shadow-md text-xs sm:text-sm p-2 sm:p-3"
            >
              <span className="hidden sm:inline">🔬 Research</span>
              <span className="sm:hidden">🔬</span>
            </TabsTrigger>
            <TabsTrigger 
              value="tree" 
              className="data-[state=active]:bg-green-500 data-[state=active]:text-white text-slate-700 font-medium rounded-md transition-all duration-200 hover:bg-green-50 data-[state=active]:shadow-md text-xs sm:text-sm p-2 sm:p-3"
            >
              <span className="hidden sm:inline">🌳 Tree View</span>
              <span className="sm:hidden">🌳</span>
            </TabsTrigger>
            <TabsTrigger 
              value="advanced" 
              className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white text-slate-700 font-medium rounded-md transition-all duration-200 hover:bg-cyan-50 data-[state=active]:shadow-md text-xs sm:text-sm p-2 sm:p-3"
            >
              <span className="hidden sm:inline">🔗 Advanced</span>
              <span className="sm:hidden">🔗</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="data-[state=active]:bg-pink-500 data-[state=active]:text-white text-slate-700 font-medium rounded-md transition-all duration-200 hover:bg-pink-50 data-[state=active]:shadow-md text-xs sm:text-sm p-2 sm:p-3"
            >
              <span className="hidden sm:inline">📈 Analytics</span>
              <span className="sm:hidden">📈</span>
            </TabsTrigger>
            <TabsTrigger 
              value="parameters" 
              className="data-[state=active]:bg-teal-500 data-[state=active]:text-white text-slate-700 font-medium rounded-md transition-all duration-200 hover:bg-teal-50 data-[state=active]:shadow-md text-xs sm:text-sm p-2 sm:p-3"
            >
              <span className="hidden sm:inline">⚙️ Parameters</span>
              <span className="sm:hidden">⚙️</span>
            </TabsTrigger>
            <TabsTrigger 
              value="developer" 
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-slate-700 font-medium rounded-md transition-all duration-200 hover:bg-orange-50 data-[state=active]:shadow-md text-xs sm:text-sm p-2 sm:p-3"
            >
              <span className="hidden sm:inline">🔧 Developer</span>
              <span className="sm:hidden">🔧</span>
            </TabsTrigger>
            <TabsTrigger 
              value="export" 
              className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white text-slate-700 font-medium rounded-md transition-all duration-200 hover:bg-indigo-50 data-[state=active]:shadow-md text-xs sm:text-sm p-2 sm:p-3"
            >
              <span className="hidden sm:inline">📤 Export</span>
              <span className="sm:hidden">📤</span>
            </TabsTrigger>
            <TabsTrigger 
              value="storage" 
              className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-slate-700 font-medium rounded-md transition-all duration-200 hover:bg-purple-50 data-[state=active]:shadow-md text-xs sm:text-sm p-2 sm:p-3"
            >
              <span className="hidden sm:inline">💾 Storage</span>
              <span className="sm:hidden">💾</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="research" id="research-section">
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
          </TabsContent>

          <TabsContent value="tree">
            <Card className="card-gradient">
              <CardHeader>
                <CardTitle className="gradient-text flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Tree of Reasoning Visualization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="tree-scene" data-testid="tree-scene">
                  <TreeOfReasoningVisualization 
                    graphData={graphData}
                    currentStage={currentStage}
                    isProcessing={isProcessing}
                    onStageSelect={(stage) => executeStage(stage)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="advanced" className="h-full">
            <div className="space-y-6">
              <Card className="card-gradient">
                <CardHeader>
                  <CardTitle className="gradient-text flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Advanced Graph Visualization & Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs defaultValue="multi-layer" className="w-full">
                    <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 mb-6 gap-1">
                      <TabsTrigger value="multi-layer" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
                        🔗 <span className="hidden sm:inline">Multi-Layer Network</span>
                        <span className="sm:hidden">Multi-Layer</span>
                      </TabsTrigger>
                      <TabsTrigger value="enhanced" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
                        🌐 <span className="hidden sm:inline">Enhanced Graph View</span>
                        <span className="sm:hidden">Enhanced</span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="multi-layer">
                      <div className="h-full" style={{ height: '600px' }}>
                        <AdvancedGraphVisualization 
                          graphData={graphData}
                          showParameters={true}
                          onNodeSelect={(node) => {
                            console.log('Selected node:', node);
                          }}
                          onEdgeSelect={(edge) => {
                            console.log('Selected edge:', edge);
                          }}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="enhanced">
                      <div className="h-full" style={{ height: '600px' }}>
                        <EnhancedGraphVisualization graphData={graphData} />
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <Tabs defaultValue="standard" className="w-full">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 mb-6 gap-1">
                <TabsTrigger value="standard" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
                  📊 <span className="hidden sm:inline">Standard Analytics</span>
                  <span className="sm:hidden">Standard</span>
                </TabsTrigger>
                <TabsTrigger value="meta" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
                  🧬 <span className="hidden sm:inline">Meta-Analysis & Advanced Visualizations</span>
                  <span className="sm:hidden">Meta-Analysis</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="standard">
                <VisualAnalytics
                  graphData={graphData}
                  currentStage={currentStage}
                  geminiApiKey={apiKeys.gemini}
                  researchContext={researchContext}
                />
              </TabsContent>

              <TabsContent value="meta">
                <MetaAnalysisVisualAnalytics
                  researchContext={researchContext}
                  geminiApiKey={apiKeys.gemini}
                  perplexityApiKey={apiKeys.perplexity}
                  currentStage={currentStage}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="parameters">
            <Card className="card-gradient">
              <CardHeader>
                <CardTitle className="gradient-text flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  ASR-GoT Parameters (P1.0-P1.29)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ParametersPane 
                  parameters={parameters}
                  onParameterChange={(parameterId, updates) => {
                    setParameters(prev => ({
                      ...prev,
                      [parameterId]: {
                        ...prev[parameterId],
                        ...updates
                      }
                    }));
                  }}
                  onParametersReset={() => {
                    // Reset to default parameters
                    resetFramework();
                  }}
                  onParametersSave={() => {
                    toast.success('Parameters saved successfully');
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="developer">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CostAwareDashboard />
              <DeveloperMode 
                parameters={parameters}
                onParametersChange={setParameters}
              />
            </div>
          </TabsContent>

          <TabsContent value="export">
            <Card className="card-gradient">
              <CardHeader>
                <CardTitle className="gradient-text flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={handleExportHTML} 
                    disabled={!hasResults} 
                    className="gradient-bg disabled:opacity-50"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export HTML Report
                  </Button>
                  <Button 
                    onClick={() => exportResults('json')} 
                    disabled={!hasResults} 
                    className="gradient-bg disabled:opacity-50"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Export JSON Data
                  </Button>
                  <Button onClick={resetFramework} variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Framework
                  </Button>
              <RealTimeErrorLogger 
                maxErrors={100}
                showInline={false}
                onErrorCapture={(error) => {
                  // Log critical errors for additional tracking
                  if (error.severity === 'critical') {
                    console.log('🚨 Critical error captured:', error);
                  }
                }}
              />
                </div>
                
                {/* In-App Preview */}
                {exportContent && (
                  <div className="mt-4">
                    <InAppPreview
                      content={exportContent}
                      title={`ASR-GoT Report - ${researchContext.topic || 'Analysis'}`}
                      type="html"
                      onDownload={handleExportHTML}
                      className="w-full"
                    />
                  </div>
                )}
                
                {isComplete && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-800 mb-2">Analysis Complete!</h3>
                    <p className="text-sm text-green-700">
                      Your comprehensive ASR-GoT analysis is ready for export.
                    </p>
                  </div>
                )}
                
                {!hasResults && (
                  <div className="text-center py-8">
                    <Play className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">
                      Start your research analysis to generate exportable results.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="storage">
            <Card className="card-gradient">
              <CardHeader>
                <CardTitle className="gradient-text flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Stored Analyses Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StoredAnalysesManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </div>
  );
};

export default ASRGoTInterface;