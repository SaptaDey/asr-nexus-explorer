/**
 * Enhanced Export Functionality for ASR-GoT
 * Supports HTML, Markdown, and JSON exports with scientific formatting
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Code, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { GraphData, ResearchContext, ASRGoTParameters } from '@/types/asrGotTypes';

interface ExportFunctionalityProps {
  stageResults: string[];
  graphData: GraphData;
  researchContext: ResearchContext;
  finalReport: string;
  parameters: ASRGoTParameters;
}

export const ExportFunctionality: React.FC<ExportFunctionalityProps> = ({
  stageResults,
  graphData,
  researchContext,
  finalReport,
  parameters
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const generateHTMLReport = (): string => {
    const currentDate = new Date().toLocaleDateString();
    const stageNames = [
      'Initialization', 'Decomposition', 'Hypothesis Generation', 'Evidence Integration',
      'Pruning & Merging', 'Subgraph Extraction', 'Composition', 'Reflection', 'Final Analysis'
    ];

    const parseMarkdownToHTML = (markdown: string): string => {
      return markdown
        .replace(/^### (.*$)/gim, '<h3 style="color: #2563eb; font-size: 1.125rem; font-weight: 600; margin: 1rem 0 0.5rem 0;">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 style="color: #1d4ed8; font-size: 1.25rem; font-weight: 700; margin: 1.5rem 0 0.75rem 0;">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 style="color: #1e40af; font-size: 1.5rem; font-weight: 800; margin: 2rem 0 1rem 0;">$1</h1>')
        .replace(/\*\*(.*)\*\*/gim, '<strong style="font-weight: 600;">$1</strong>')
        .replace(/\*(.*)\*/gim, '<em style="font-style: italic;">$1</em>')
        .replace(/```([\s\S]*?)```/gim, '<pre style="background: #f3f4f6; padding: 1rem; border-radius: 0.375rem; font-size: 0.875rem; overflow-x: auto; margin: 0.75rem 0;"><code>$1</code></pre>')
        .replace(/`([^`]*)`/gim, '<code style="background: #e5e7eb; padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-size: 0.875rem;">$1</code>')
        .replace(/^\* (.*$)/gim, '<li style="margin-left: 1rem; list-style-type: disc;">$1</li>')
        .replace(/^- (.*$)/gim, '<li style="margin-left: 1rem; list-style-type: disc;">$1</li>')
        .replace(/^\d+\. (.*$)/gim, '<li style="margin-left: 1rem; list-style-type: decimal;">$1</li>')
        .replace(/\n\n/gim, '</p><p style="margin-bottom: 0.75rem;">')
        .replace(/\n/gim, '<br>')
        .replace(/^(?!<[hlu])/gim, '<p style="margin-bottom: 0.75rem;">')
        .replace(/(?<![>])$/gim, '</p>');
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASR-GoT Analysis Report - ${researchContext.field}</title>
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
        .stage-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #1e40af;
            font-weight: 600;
            margin-bottom: 1rem;
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
        .final-report {
            background: linear-gradient(135deg, #fef3c7, #fef9e7);
            border: 1px solid #fbbf24;
            border-radius: 0.5rem;
            padding: 2rem;
            margin: 3rem 0;
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
        <p style="color: #9ca3af;">Generated on ${currentDate}</p>
    </div>

    <div class="research-field">
        <h2>🎯 Research Overview</h2>
        <div class="metadata">
            <div><strong>Field:</strong> ${researchContext.field || 'Not specified'}</div>
            <div><strong>Topic:</strong> ${researchContext.topic || 'Not specified'}</div>
            <div><strong>Stages Completed:</strong> ${stageResults.filter(r => r && r.trim()).length}/9</div>
            <div><strong>Total Nodes:</strong> ${graphData.nodes.length}</div>
            <div><strong>Total Edges:</strong> ${graphData.edges.length}</div>
            <div><strong>Framework Version:</strong> ASR-GoT v2025.07.07</div>
        </div>
        
        ${researchContext.objectives && researchContext.objectives.length > 0 ? `
        <h3>📋 Research Objectives</h3>
        <ul>
            ${researchContext.objectives.map(obj => `<li>${obj}</li>`).join('')}
        </ul>
        ` : ''}
        
        ${researchContext.hypotheses && researchContext.hypotheses.length > 0 ? `
        <h3>🔬 Generated Hypotheses</h3>
        <ul>
            ${researchContext.hypotheses.map(hyp => `<li>${hyp}</li>`).join('')}
        </ul>
        ` : ''}
    </div>

    ${stageResults.map((result, index) => {
      if (!result || !result.trim()) return '';
      return `
    <div class="stage-section">
        <div class="stage-header">
            <span style="font-size: 1.5rem;">${['🎯', '🔧', '🔬', '📚', '✂️', '🔍', '📝', '🤔', '📊'][index]}</span>
            <h2>Stage ${index + 1}: ${stageNames[index]}</h2>
        </div>
        <div>${parseMarkdownToHTML(result)}</div>
    </div>
      `;
    }).join('')}

    ${finalReport ? `
    <div class="final-report">
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
  };

  const generateMarkdownReport = (): string => {
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
| **Research Field** | ${researchContext.field || 'Not specified'} |
| **Research Topic** | ${researchContext.topic || 'Not specified'} |
| **Stages Completed** | ${stageResults.filter(r => r && r.trim()).length}/9 |
| **Total Knowledge Nodes** | ${graphData.nodes.length} |
| **Total Connections** | ${graphData.edges.length} |
| **Framework Version** | ASR-GoT v2025.07.07 |

${researchContext.objectives && researchContext.objectives.length > 0 ? `
### 📋 Research Objectives
${researchContext.objectives.map(obj => `- ${obj}`).join('\n')}
` : ''}

${researchContext.hypotheses && researchContext.hypotheses.length > 0 ? `
### 🔬 Generated Hypotheses
${researchContext.hypotheses.map(hyp => `- ${hyp}`).join('\n')}
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
- **Knowledge Graph Complexity**: ${graphData.nodes.length + graphData.edges.length} total elements
- **Export Date**: ${new Date().toISOString()}

---

*Generated by ASR-GoT Framework - Advanced Scientific Research System*`;
  };

  const generateJSONExport = () => {
    return {
      metadata: {
        exported_at: new Date().toISOString(),
        framework_version: 'ASR-GoT v2025.07.07',
        export_type: 'complete_analysis',
        stages_completed: stageResults.filter(r => r && r.trim()).length,
        total_nodes: graphData.nodes.length,
        total_edges: graphData.edges.length
      },
      research_context: researchContext,
      graph_data: graphData,
      stage_results: stageResults.map((result, index) => ({
        stage_number: index + 1,
        stage_name: ['Initialization', 'Decomposition', 'Hypothesis Generation', 'Evidence Integration',
                    'Pruning & Merging', 'Subgraph Extraction', 'Composition', 'Reflection', 'Final Analysis'][index],
        result: result || '',
        completed: !!(result && result.trim()),
        timestamp: new Date().toISOString()
      })),
      final_report: finalReport,
      parameters_used: parameters,
      export_summary: {
        research_field: researchContext.field,
        research_topic: researchContext.topic,
        key_findings: stageResults.filter(r => r && r.includes('Complete')).length,
        completion_percentage: Math.round((stageResults.filter(r => r && r.trim()).length / 9) * 100)
      }
    };
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format: 'html' | 'markdown' | 'json') => {
    if (stageResults.filter(r => r && r.trim()).length === 0) {
      toast.error('No results to export yet. Complete at least one stage first.');
      return;
    }

    setIsExporting(true);
    
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const baseFilename = `ASR-GoT-Analysis-${timestamp}`;
      
      switch (format) {
        case 'html':
          const htmlContent = generateHTMLReport();
          downloadFile(htmlContent, `${baseFilename}.html`, 'text/html');
          toast.success('HTML report exported successfully');
          break;
          
        case 'markdown':
          const markdownContent = generateMarkdownReport();
          downloadFile(markdownContent, `${baseFilename}.md`, 'text/markdown');
          toast.success('Markdown report exported successfully');
          break;
          
        case 'json':
          const jsonData = generateJSONExport();
          downloadFile(JSON.stringify(jsonData, null, 2), `${baseFilename}.json`, 'application/json');
          toast.success('JSON data exported successfully');
          break;
      }
    } catch (error) {
      toast.error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const completedStages = stageResults.filter(r => r && r.trim()).length;
  const canExport = completedStages > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Analysis Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Export your ASR-GoT analysis in multiple formats
            </p>
            <div className="flex items-center gap-2">
              <Badge variant={canExport ? "default" : "secondary"}>
                {completedStages} stages completed
              </Badge>
              {finalReport && (
                <Badge variant="outline">Final report ready</Badge>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={!canExport || isExporting}>
                {isExporting ? 'Exporting...' : 'Export'}
                <Download className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('html')}>
                <Globe className="mr-2 h-4 w-4" />
                HTML Report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('markdown')}>
                <FileText className="mr-2 h-4 w-4" />
                Markdown Document
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport('json')}>
                <Code className="mr-2 h-4 w-4" />
                JSON Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator />
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium text-primary">{graphData.nodes.length}</div>
            <div className="text-muted-foreground">Knowledge Nodes</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-primary">{graphData.edges.length}</div>
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