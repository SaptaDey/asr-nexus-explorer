/**
 * Enhanced Export Functionality with Error Handling and Progress Tracking
 * Supports HTML, Markdown, and JSON exports with validation and graceful degradation
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Code, Globe, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { GraphData, ResearchContext, ASRGoTParameters } from '@/types/asrGotTypes';
import { ErrorBoundary, handleValidationError, handleComputationError } from '@/utils/errorHandling';

interface EnhancedExportFunctionalityProps {
  stageResults: string[];
  graphData: GraphData;
  researchContext: ResearchContext;
  finalReport: string;
  parameters: ASRGoTParameters;
  visualAnalytics?: {
    figures: any[];
    exportFigure: (figure: any) => Promise<string>;
  };
  onExportProgress?: (progress: number, status: string) => void;
  onExportComplete?: (format: string, success: boolean) => void;
}

const EnhancedExportFunctionalityInner: React.FC<EnhancedExportFunctionalityProps> = ({
  stageResults,
  graphData,
  researchContext,
  finalReport,
  parameters,
  visualAnalytics,
  onExportProgress,
  onExportComplete
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  const [lastExportError, setLastExportError] = useState<string | null>(null);
  
  // Validate export readiness
  const exportValidation = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!stageResults || stageResults.length === 0) {
      errors.push('No stage results available');
    }
    
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
      warnings.push('Graph data is empty');
    }
    
    if (!researchContext || !researchContext.field) {
      warnings.push('Research context is incomplete');
    }
    
    if (!finalReport || finalReport.trim().length === 0) {
      warnings.push('Final report is empty');
    }
    
    const completedStages = stageResults.filter(r => r && r.trim()).length;
    if (completedStages < 3) {
      warnings.push('Less than 3 stages completed');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      completedStages
    };
  }, [stageResults, graphData, researchContext, finalReport]);
  
  const updateProgress = useCallback((progress: number, status: string) => {
    setExportProgress(progress);
    setExportStatus(status);
    onExportProgress?.(progress, status);
  }, [onExportProgress]);

  const generateHTMLReport = useCallback(async (): Promise<string> => {
    updateProgress(10, 'Generating HTML structure...');
    
    const safeResearchField = researchContext?.field || 'Scientific Research';
    const safeTopic = researchContext?.topic || 'Analysis Report';
    const completedStages = exportValidation.completedStages;
    
    updateProgress(30, 'Building HTML structure...');
    
    const stageNames = [
      'Initialization', 'Decomposition', 'Hypothesis Generation', 'Evidence Integration',
      'Pruning & Merging', 'Subgraph Extraction', 'Composition', 'Reflection', 'Final Analysis'
    ];

    const parseMarkdownToHTML = (markdown: string): string => {
      if (!markdown) return '';
      try {
        return markdown
          .replace(/^### (.*$)/gim, '<h3 style="color: #2563eb; font-size: 1.125rem; font-weight: 600; margin: 1rem 0 0.5rem 0;">$1</h3>')
          .replace(/^## (.*$)/gim, '<h2 style="color: #1d4ed8; font-size: 1.25rem; font-weight: 700; margin: 1.5rem 0 0.75rem 0;">$1</h2>')
          .replace(/^# (.*$)/gim, '<h1 style="color: #1e40af; font-size: 1.5rem; font-weight: 800; margin: 2rem 0 1rem 0;">$1</h1>')
          .replace(/\*\*(.*?)\*\*/gim, '<strong style="font-weight: 600;">$1</strong>')
          .replace(/\*(.*?)\*/gim, '<em style="font-style: italic;">$1</em>')
          .replace(/```([\s\S]*?)```/gim, '<pre style="background: #f3f4f6; padding: 1rem; border-radius: 0.375rem; font-size: 0.875rem; overflow-x: auto; margin: 0.75rem 0;"><code>$1</code></pre>')
          .replace(/`([^`]*)`/gim, '<code style="background: #e5e7eb; padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-size: 0.875rem;">$1</code>')
          .replace(/^\* (.*$)/gim, '<li style="margin-left: 1rem; list-style-type: disc;">$1</li>')
          .replace(/^- (.*$)/gim, '<li style="margin-left: 1rem; list-style-type: disc;">$1</li>')
          .replace(/^\d+\. (.*$)/gim, '<li style="margin-left: 1rem; list-style-type: decimal;">$1</li>')
          .replace(/\n\n/gim, '</p><p style="margin-bottom: 0.75rem;">')
          .replace(/\n/gim, '<br>')
          .replace(/^(?!<[hlu])/gim, '<p style="margin-bottom: 0.75rem;">')
          .replace(/(?<![>])$/gim, '</p>');
      } catch (error) {
        console.warn('Markdown parsing error:', error);
        return markdown.replace(/\n/g, '<br>');
      }
    };

    updateProgress(50, 'Processing content...');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASR-GoT Analysis Report - ${safeResearchField}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            background: #ffffff;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 2rem;
            margin-bottom: 3rem;
        }
        .research-field {
            background: linear-gradient(135deg, #eff6ff, #dbeafe);
            border: 1px solid #bfdbfe;
            border-radius: 0.5rem;
            padding: 1.5rem;
            margin: 2rem 0;
        }
        .stage-section {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            padding: 1.5rem;
            margin: 2rem 0;
        }
        .metadata {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            background: #f3f4f6;
            padding: 1rem;
            border-radius: 0.375rem;
            margin: 1rem 0;
        }
        @media print {
            body { padding: 1rem; }
            .stage-section { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 ASR-GoT Scientific Analysis Report</h1>
        <p style="font-size: 1.125rem; color: #6b7280;">Advanced Scientific Research - Graph of Thoughts Framework</p>
        <p style="color: #9ca3af;">Generated on ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="research-field">
        <h2>🎯 Research Overview</h2>
        <div class="metadata">
            <div><strong>Field:</strong> ${safeResearchField}</div>
            <div><strong>Topic:</strong> ${safeTopic}</div>
            <div><strong>Stages Completed:</strong> ${completedStages}/9</div>
            <div><strong>Total Nodes:</strong> ${graphData?.nodes?.length || 0}</div>
            <div><strong>Total Edges:</strong> ${graphData?.edges?.length || 0}</div>
            <div><strong>Framework Version:</strong> ASR-GoT v2025.07.24</div>
            <div><strong>Export Date:</strong> ${new Date().toLocaleDateString()}</div>
            <div><strong>Export Time:</strong> ${new Date().toLocaleTimeString()}</div>
        </div>
        
        ${researchContext?.objectives?.length > 0 ? `
        <h3>📋 Research Objectives</h3>
        <ul>
            ${researchContext.objectives.map(obj => `<li>${parseMarkdownToHTML(obj || '')}</li>`).join('')}
        </ul>
        ` : ''}
        
        ${researchContext?.hypotheses?.length > 0 ? `
        <h3>🔬 Generated Hypotheses</h3>
        <ul>
            ${researchContext.hypotheses.map(hyp => `<li>${parseMarkdownToHTML(hyp || '')}</li>`).join('')}
        </ul>
        ` : ''}
    </div>

    ${stageResults.map((result, index) => {
      if (!result || !result.trim()) return '';
      updateProgress(60 + (index * 2), `Processing stage ${index + 1}...`);
      return `
    <div class="stage-section">
        <div style="display: flex; align-items: center; gap: 0.5rem; color: #1e40af; font-weight: 600; margin-bottom: 1rem;">
            <span style="font-size: 1.5rem;">${['🎯', '🔧', '🔬', '📚', '✂️', '🔍', '📝', '🤔', '📊'][index] || '📋'}</span>
            <h2>Stage ${index + 1}: ${stageNames[index] || 'Analysis Stage'}</h2>
        </div>
        <div>${parseMarkdownToHTML(result || '')}</div>
    </div>
      `;
    }).join('')}

    ${finalReport ? `
    <div style="background: linear-gradient(135deg, #fef3c7, #fef9e7); border: 1px solid #fbbf24; border-radius: 0.5rem; padding: 2rem; margin: 3rem 0;">
        <h2 style="color: #b45309; margin-bottom: 1rem;">📊 Final Comprehensive Analysis</h2>
        <div>${parseMarkdownToHTML(finalReport)}</div>
    </div>
    ` : ''}

    <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280;">
        <p>Generated by ASR-GoT Framework - Advanced Scientific Research System</p>
        <p style="font-size: 0.875rem;">Export Date: ${new Date().toISOString()}</p>
    </div>
</body>
</html>`;
  }, [researchContext, graphData, stageResults, finalReport, exportValidation, updateProgress]);

  const generateMarkdownReport = useCallback((): string => {
    updateProgress(10, 'Generating Markdown content...');
    
    const completedStages = exportValidation.completedStages;
    const stageNames = [
      'Initialization', 'Decomposition', 'Hypothesis Generation', 'Evidence Integration',
      'Pruning & Merging', 'Subgraph Extraction', 'Composition', 'Reflection', 'Final Analysis'
    ];

    return `# 🧪 ASR-GoT Scientific Analysis Report

**Advanced Scientific Research - Graph of Thoughts Framework**  
*Generated on ${new Date().toLocaleDateString()}*

## 🎯 Research Overview

| Field | Value |
|-------|-------|
| **Research Field** | ${researchContext?.field || 'Not specified'} |
| **Research Topic** | ${researchContext?.topic || 'Not specified'} |
| **Stages Completed** | ${completedStages}/9 |
| **Total Knowledge Nodes** | ${graphData?.nodes?.length || 0} |
| **Total Connections** | ${graphData?.edges?.length || 0} |
| **Framework Version** | ASR-GoT v2025.07.24 |

${researchContext?.objectives?.length > 0 ? `
### 📋 Research Objectives
${researchContext.objectives.map(obj => `- ${obj || ''}`).join('\n')}
` : ''}

${researchContext?.hypotheses?.length > 0 ? `
### 🔬 Generated Hypotheses
${researchContext.hypotheses.map(hyp => `- ${hyp || ''}`).join('\n')}
` : ''}

---

## 📊 Stage Execution Results

${stageResults.map((result, index) => {
  if (!result || !result.trim()) return '';
  return `
### Stage ${index + 1}: ${stageNames[index]}

${result}

---`;
}).join('')}

${finalReport ? `
## 📋 Final Comprehensive Analysis

${finalReport}

---
` : ''}

## 📈 Analysis Statistics

- **Total Processing Time**: ${Date.now()}ms (approximate)
- **Research Depth**: ${Math.max(...stageResults.map(r => r?.length || 0))} characters (longest stage)
- **Knowledge Graph Complexity**: ${(graphData?.nodes?.length || 0) + (graphData?.edges?.length || 0)} total elements
- **Export Date**: ${new Date().toISOString()}

---

*Generated by ASR-GoT Framework - Advanced Scientific Research System*`;
  }, [researchContext, graphData, stageResults, finalReport, exportValidation]);

  const generateJSONExport = useCallback(() => {
    updateProgress(10, 'Preparing JSON data...');
    
    const completedStages = exportValidation.completedStages;
    
    return {
      metadata: {
        exported_at: new Date().toISOString(),
        framework_version: 'ASR-GoT v2025.07.24',
        export_type: 'complete_analysis',
        stages_completed: completedStages,
        total_nodes: graphData?.nodes?.length || 0,
        total_edges: graphData?.edges?.length || 0
      },
      research_context: researchContext || {},
      graph_data: graphData || { nodes: [], edges: [], metadata: {} },
      stage_results: stageResults.map((result, index) => ({
        stage_number: index + 1,
        stage_name: ['Initialization', 'Decomposition', 'Hypothesis Generation', 'Evidence Integration',
                    'Pruning & Merging', 'Subgraph Extraction', 'Composition', 'Reflection', 'Final Analysis'][index],
        result: result || '',
        completed: !!(result && result.trim()),
        timestamp: new Date().toISOString()
      })),
      final_report: finalReport || '',
      parameters_used: parameters || {},
      export_summary: {
        research_field: researchContext?.field || 'Not specified',
        research_topic: researchContext?.topic || 'Not specified',
        key_findings: stageResults.filter(r => r && r.includes('Complete')).length,
        completion_percentage: Math.round((completedStages / 9) * 100),
        export_timestamp: new Date().toISOString(),
        validation_status: exportValidation
      }
    };
  }, [researchContext, graphData, stageResults, finalReport, parameters, exportValidation]);

  const downloadFile = useCallback((content: string, filename: string, mimeType: string) => {
    try {
      updateProgress(90, 'Preparing download...');
      
      const blob = new Blob([content], { type: mimeType });
      
      // Check blob size
      const sizeInMB = blob.size / (1024 * 1024);
      if (sizeInMB > 50) {
        throw new Error(`File size (${sizeInMB.toFixed(1)}MB) exceeds 50MB limit`);
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      updateProgress(100, 'Download started');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      handleComputationError(error instanceof Error ? error : new Error(errorMessage), {
        filename,
        fileSize: content.length,
        mimeType
      });
      throw error;
    }
  }, [updateProgress]);

  const handleExport = useCallback(async (format: 'html' | 'markdown' | 'json') => {
    // Validate before export
    if (!exportValidation.isValid) {
      const errorMsg = `Cannot export: ${exportValidation.errors.join(', ')}`;
      handleValidationError(new Error(errorMsg), { format, errors: exportValidation.errors });
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    setExportStatus('Starting export...');
    setLastExportError(null);
    
    try {
      updateProgress(5, 'Validating data...');
      
      const timestamp = new Date().toISOString().split('T')[0];
      const baseFilename = `ASR-GoT-Analysis-${timestamp}`;
      
      let content: string;
      let mimeType: string;
      let fileExtension: string;
      
      updateProgress(20, `Generating ${format.toUpperCase()} content...`);
      
      switch (format) {
        case 'html':
          content = await generateHTMLReport();
          mimeType = 'text/html';
          fileExtension = 'html';
          break;
          
        case 'markdown':
          content = generateMarkdownReport();
          mimeType = 'text/markdown';
          fileExtension = 'md';
          break;
          
        case 'json':
          const jsonData = generateJSONExport();
          content = JSON.stringify(jsonData, null, 2);
          mimeType = 'application/json';
          fileExtension = 'json';
          break;
          
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
      
      updateProgress(70, 'Processing content...');
      
      // Validate content
      if (!content || content.trim().length === 0) {
        throw new Error('Generated content is empty');
      }
      
      const filename = `${baseFilename}.${fileExtension}`;
      downloadFile(content, filename, mimeType);
      
      toast.success(`${format.toUpperCase()} report exported successfully`);
      onExportComplete?.(format, true);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLastExportError(errorMessage);
      
      handleComputationError(
        error instanceof Error ? error : new Error(errorMessage),
        { format, validation: exportValidation }
      );
      
      onExportComplete?.(format, false);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      setExportStatus('');
    }
  }, [exportValidation, generateHTMLReport, generateMarkdownReport, generateJSONExport, downloadFile, updateProgress, onExportComplete]);

  const completedStages = exportValidation.completedStages;
  const canExport = exportValidation.isValid;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Enhanced Export Analysis Results
          {exportValidation.isValid ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Export Progress */}
        {isExporting && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Exporting...</span>
            </div>
            <Progress value={exportProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">{exportStatus}</p>
          </div>
        )}
        
        {/* Validation Messages */}
        {exportValidation.warnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Export Warnings</p>
                <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                  {exportValidation.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {exportValidation.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Cannot Export</p>
                <ul className="text-xs text-red-700 mt-1 space-y-1">
                  {exportValidation.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {lastExportError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Last Export Failed</p>
                <p className="text-xs text-red-700 mt-1">{lastExportError}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Export your ASR-GoT analysis in multiple formats with enhanced error handling
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={canExport ? "default" : "secondary"}>
                {completedStages} stages completed
              </Badge>
              {finalReport && (
                <Badge variant="outline">Final report ready</Badge>
              )}
              {visualAnalytics?.figures && visualAnalytics.figures.length > 0 && (
                <Badge variant="outline">
                  {visualAnalytics.figures.length} visualizations
                </Badge>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={!canExport || isExporting}>
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    Export
                    <Download className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => handleExport('html')}
                disabled={isExporting}
              >
                <Globe className="mr-2 h-4 w-4" />
                HTML Report
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleExport('markdown')}
                disabled={isExporting}
              >
                <FileText className="mr-2 h-4 w-4" />
                Markdown Document
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleExport('json')}
                disabled={isExporting}
              >
                <Code className="mr-2 h-4 w-4" />
                JSON Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator />
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium text-primary">{graphData?.nodes?.length || 0}</div>
            <div className="text-muted-foreground">Knowledge Nodes</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-primary">{graphData?.edges?.length || 0}</div>
            <div className="text-muted-foreground">Connections</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-primary">{Math.round((completedStages / 9) * 100)}%</div>
            <div className="text-muted-foreground">Complete</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main component with error boundary
export const EnhancedExportFunctionality: React.FC<EnhancedExportFunctionalityProps> = (props) => {
  return (
    <ErrorBoundary>
      <EnhancedExportFunctionalityInner {...props} />
    </ErrorBoundary>
  );
};