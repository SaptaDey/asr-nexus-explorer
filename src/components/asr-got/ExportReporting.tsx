/**
 * Export & Reporting System
 * HTML/Markdown export with embedded figures and comprehensive reporting
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import { GraphData, GraphNode } from '@/types/asrGotTypes';
import { Download, FileText, Globe, Archive, Eye, Share } from 'lucide-react';
import { toast } from 'sonner';

interface ExportReportingProps {
  graphData: GraphData;
  currentStage: number;
  stageResults: string[];
  htmlSynthesis: string;
  researchQuestion: string;
}

interface ExportFormat {
  type: 'html' | 'markdown' | 'json' | 'pdf';
  name: string;
  description: string;
  icon: React.ReactNode;
}

export const ExportReporting: React.FC<ExportReportingProps> = ({
  graphData,
  currentStage,
  stageResults,
  htmlSynthesis,
  researchQuestion
}) => {
  const [selectedFormat, setSelectedFormat] = useState<string>('html');
  const [previewContent, setPreviewContent] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const exportFormats: ExportFormat[] = [
    {
      type: 'html',
      name: 'HTML Report',
      description: 'Complete interactive report with embedded figures',
      icon: <Globe className="h-4 w-4" />
    },
    {
      type: 'markdown',
      name: 'Markdown Document',
      description: 'Structured markdown with citations and references',
      icon: <FileText className="h-4 w-4" />
    },
    {
      type: 'json',
      name: 'Graph Data (JSON)',
      description: 'Complete graph structure and metadata',
      icon: <Archive className="h-4 w-4" />
    }
  ];

  // Generate comprehensive HTML report
  const generateHTMLReport = useCallback((): string => {
    const timestamp = new Date().toISOString();
    const completionStages = stageResults.filter(Boolean).length;
    
    // Extract high-confidence hypotheses
    const hypotheses = graphData.nodes
      .filter(node => node.type === 'hypothesis')
      .map(node => {
        const avgConfidence = node.confidence.reduce((a, b) => a + b, 0) / node.confidence.length;
        return {
          label: node.label,
          confidence: avgConfidence,
          metadata: node.metadata
        };
      })
      .sort((a, b) => b.confidence - a.confidence);

    // Extract evidence nodes with citations
    const evidenceNodes = graphData.nodes
      .filter(node => node.type === 'evidence')
      .map((node, index) => ({
        id: index + 1,
        label: node.label,
        confidence: node.confidence.reduce((a, b) => a + b, 0) / node.confidence.length,
        metadata: node.metadata
      }));

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASR-GoT Analysis Report: ${researchQuestion}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; 
            margin: 0; 
            padding: 40px;
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
        }
        .header { 
            background: linear-gradient(135deg, #662D91 0%, #00857C 100%);
            color: white; 
            padding: 60px 40px;
            text-align: center;
        }
        .content { padding: 40px; }
        h1 { margin: 0; font-size: 2.5em; font-weight: 700; }
        h2 { color: #662D91; border-bottom: 3px solid #00857C; padding-bottom: 10px; }
        h3 { color: #00857C; }
        .meta { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 10px;
            margin: 20px 0;
            border-left: 5px solid #662D91;
        }
        .hypothesis { 
            background: #fff; 
            border: 1px solid #e1e5e9;
            border-radius: 10px;
            padding: 20px; 
            margin: 15px 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .confidence { 
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: bold;
            color: white;
        }
        .confidence.high { background: #00857C; }
        .confidence.medium { background: #FFB200; }
        .confidence.low { background: #B60000; }
        .evidence { font-size: 0.9em; color: #666; margin-top: 10px; }
        .citations { background: #f8f9fa; padding: 20px; border-radius: 10px; }
        .citation { margin: 10px 0; padding: 10px; background: white; border-radius: 5px; }
        .stage-progress {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 30px 0;
            padding: 20px;
            background: linear-gradient(90deg, #00857C, #662D91);
            border-radius: 10px;
            color: white;
        }
        .stage { text-align: center; flex: 1; }
        .stage.completed { opacity: 1; }
        .stage.incomplete { opacity: 0.5; }
        .summary-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .stat-card {
            background: linear-gradient(135deg, #f6f8ff, #e8f2ff);
            padding: 25px;
            border-radius: 15px;
            text-align: center;
            border: 1px solid #e1e8ff;
        }
        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            color: #662D91;
            margin-bottom: 5px;
        }
        .stat-label {
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        sup { color: #662D91; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>ASR-GoT Scientific Analysis</h1>
            <p style="font-size: 1.2em; opacity: 0.9; margin: 20px 0;">${researchQuestion}</p>
            <div style="font-size: 0.9em; opacity: 0.8;">
                Generated on ${new Date(timestamp).toLocaleDateString()} • 
                Stage ${currentStage}/8 • 
                ${completionStages} stages completed
            </div>
        </header>

        <div class="content">
            <div class="stage-progress">
                ${Array.from({length: 8}, (_, i) => `
                    <div class="stage ${i < completionStages ? 'completed' : 'incomplete'}">
                        <div style="font-size: 1.2em; margin-bottom: 5px;">${i + 1}</div>
                        <div style="font-size: 0.8em;">
                            ${['Init', 'Decomp', 'Hypoth', 'Evidence', 'Prune', 'Extract', 'Compose', 'Reflect'][i]}
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="summary-stats">
                <div class="stat-card">
                    <div class="stat-number">${graphData.nodes.length}</div>
                    <div class="stat-label">Total Nodes</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${graphData.edges.length}</div>
                    <div class="stat-label">Connections</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${hypotheses.length}</div>
                    <div class="stat-label">Hypotheses</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${evidenceNodes.length}</div>
                    <div class="stat-label">Evidence Sources</div>
                </div>
            </div>

            <h2>Executive Summary</h2>
            <div class="meta">
                ${htmlSynthesis || '<em>Analysis synthesis will be available after Stage 7 completion.</em>'}
            </div>

            <h2>Key Hypotheses</h2>
            ${hypotheses.map(hyp => `
                <div class="hypothesis">
                    <h3>${hyp.label}</h3>
                    <span class="confidence ${hyp.confidence >= 0.8 ? 'high' : hyp.confidence >= 0.5 ? 'medium' : 'low'}">
                        ${(hyp.confidence * 100).toFixed(1)}% Confidence
                    </span>
                    <div class="evidence">
                        Impact Score: ${hyp.metadata.impact_score || 0.5} • 
                        Generated: ${hyp.metadata.timestamp || 'N/A'}
                    </div>
                </div>
            `).join('')}

            <h2>Evidence Analysis</h2>
            <p>This analysis incorporated ${evidenceNodes.length} evidence sources through the ASR-GoT methodology:</p>
            
            ${evidenceNodes.length > 0 ? `
                <div class="citations">
                    <h3>References</h3>
                    ${evidenceNodes.map(evidence => `
                        <div class="citation">
                            <strong>[${evidence.id}]</strong> ${evidence.label}<br>
                            <em>Confidence: ${(evidence.confidence * 100).toFixed(1)}% • 
                            ${evidence.metadata.publication_rank ? `Rank: ${evidence.metadata.publication_rank}` : 'Unranked'}</em>
                        </div>
                    `).join('')}
                </div>
            ` : '<em>No evidence sources have been processed yet.</em>'}

            <h2>Methodology</h2>
            <p>This report was generated using the Advanced Scientific Reasoning - Graph of Thoughts (ASR-GoT) framework, 
            implementing a systematic 8-stage pipeline for scientific inquiry and evidence synthesis.</p>

            <div class="meta">
                <strong>ASR-GoT Framework Components:</strong><br>
                • Automated hypothesis generation and testing<br>
                • Multi-dimensional confidence tracking<br>
                • Evidence integration from multiple sources<br>
                • Bias detection and statistical validation<br>
                • Graph-based reasoning and synthesis
            </div>
        </div>
    </div>
</body>
</html>`;
  }, [graphData, currentStage, stageResults, htmlSynthesis, researchQuestion]);

  // Generate Markdown report
  const generateMarkdownReport = useCallback((): string => {
    const timestamp = new Date().toISOString();
    const hypotheses = graphData.nodes.filter(node => node.type === 'hypothesis');
    const evidenceNodes = graphData.nodes.filter(node => node.type === 'evidence');

    return `# ASR-GoT Scientific Analysis Report

**Research Question:** ${researchQuestion}

**Generated:** ${new Date(timestamp).toLocaleDateString()}  
**Stage:** ${currentStage}/8  
**Completion:** ${stageResults.filter(Boolean).length}/8 stages

---

## Executive Summary

${htmlSynthesis || '*Analysis synthesis will be available after Stage 7 completion.*'}

## Graph Statistics

- **Total Nodes:** ${graphData.nodes.length}
- **Total Edges:** ${graphData.edges.length}
- **Hypotheses:** ${hypotheses.length}
- **Evidence Sources:** ${evidenceNodes.length}

## Key Hypotheses

${hypotheses.map((hyp, index) => {
  const confidence = hyp.confidence.reduce((a, b) => a + b, 0) / hyp.confidence.length;
  return `### ${index + 1}. ${hyp.label}

**Confidence:** ${(confidence * 100).toFixed(1)}%  
**Impact Score:** ${hyp.metadata.impact_score || 0.5}  
**Generated:** ${hyp.metadata.timestamp || 'N/A'}

`;
}).join('')}

## Evidence Analysis

${evidenceNodes.length > 0 ? 
  evidenceNodes.map((evidence, index) => {
    const confidence = evidence.confidence.reduce((a, b) => a + b, 0) / evidence.confidence.length;
    return `${index + 1}. **${evidence.label}** - Confidence: ${(confidence * 100).toFixed(1)}%`;
  }).join('\n') 
  : '*No evidence sources processed yet.*'}

## Methodology

This report was generated using the Advanced Scientific Reasoning - Graph of Thoughts (ASR-GoT) framework, implementing a systematic 8-stage pipeline for scientific inquiry and evidence synthesis.

### ASR-GoT Framework Components:

- Automated hypothesis generation and testing
- Multi-dimensional confidence tracking  
- Evidence integration from multiple sources
- Bias detection and statistical validation
- Graph-based reasoning and synthesis

---

*Report generated by ASR-GoT Framework v2025-07-07*`;
  }, [graphData, currentStage, stageResults, htmlSynthesis, researchQuestion]);

  // Generate JSON export
  const generateJSONExport = useCallback((): string => {
    return JSON.stringify({
      metadata: {
        researchQuestion,
        generated: new Date().toISOString(),
        stage: currentStage,
        completedStages: stageResults.filter(Boolean).length,
        framework: 'ASR-GoT v2025-07-07'
      },
      graphData,
      stageResults,
      synthesis: htmlSynthesis,
      statistics: {
        totalNodes: graphData.nodes.length,
        totalEdges: graphData.edges.length,
        hypotheses: graphData.nodes.filter(n => n.type === 'hypothesis').length,
        evidence: graphData.nodes.filter(n => n.type === 'evidence').length
      }
    }, null, 2);
  }, [graphData, currentStage, stageResults, htmlSynthesis, researchQuestion]);

  // Generate preview content
  const generatePreview = useCallback((format: string) => {
    setIsGenerating(true);
    
    setTimeout(() => {
      let content = '';
      
      switch (format) {
        case 'html':
          content = generateHTMLReport();
          break;
        case 'markdown':
          content = generateMarkdownReport();
          break;
        case 'json':
          content = generateJSONExport();
          break;
      }
      
      setPreviewContent(content);
      setIsGenerating(false);
    }, 500);
  }, [generateHTMLReport, generateMarkdownReport, generateJSONExport]);

  // Export file
  const exportFile = useCallback((format: string) => {
    let content = '';
    let filename = '';
    let mimeType = '';

    switch (format) {
      case 'html':
        content = generateHTMLReport();
        filename = `asr-got-report-${Date.now()}.html`;
        mimeType = 'text/html';
        break;
      case 'markdown':
        content = generateMarkdownReport();
        filename = `asr-got-report-${Date.now()}.md`;
        mimeType = 'text/markdown';
        break;
      case 'json':
        content = generateJSONExport();
        filename = `asr-got-data-${Date.now()}.json`;
        mimeType = 'application/json';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${format.toUpperCase()} report successfully`);
  }, [generateHTMLReport, generateMarkdownReport, generateJSONExport]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📄 Export & Reporting
            <Badge variant="outline">
              Stage {currentStage}/8
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Format Selection */}
          <div className="grid gap-4">
            <h3 className="font-semibold">Select Export Format</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {exportFormats.map((format) => (
                <Card
                  key={format.type}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedFormat === format.type ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedFormat(format.type)}
                >
                  <CardContent className="flex items-center space-x-3 p-4">
                    <div className="flex-shrink-0">
                      {format.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{format.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => {
                generatePreview(selectedFormat);
                setShowPreview(true);
              }}
              disabled={isGenerating}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Preview'}
            </Button>
            <Button
              onClick={() => exportFile(selectedFormat)}
              variant="outline"
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Export {selectedFormat.toUpperCase()}
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{graphData.nodes.length}</div>
              <div className="text-sm text-muted-foreground">Nodes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{graphData.edges.length}</div>
              <div className="text-sm text-muted-foreground">Edges</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {graphData.nodes.filter(n => n.type === 'hypothesis').length}
              </div>
              <div className="text-sm text-muted-foreground">Hypotheses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stageResults.filter(Boolean).length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Preview - {selectedFormat.toUpperCase()} Export</DialogTitle>
            <DialogDescription>
              Review your export before downloading
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] w-full">
            {selectedFormat === 'html' ? (
              <iframe
                srcDoc={previewContent}
                className="w-full h-full border rounded"
                style={{ minHeight: '500px' }}
              />
            ) : (
              <pre className="text-sm bg-muted p-4 rounded whitespace-pre-wrap">
                {previewContent}
              </pre>
            )}
          </ScrollArea>
          <div className="flex gap-2 pt-4">
            <Button onClick={() => exportFile(selectedFormat)} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download {selectedFormat.toUpperCase()}
            </Button>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};