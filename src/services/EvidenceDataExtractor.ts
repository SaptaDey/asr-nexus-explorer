/**
 * Evidence Data Extraction Service
 * Extracts quantitative data from Stage 4 evidence for chart generation
 */

import { GraphNode, ResearchContext } from '@/types/asrGotTypes';

export interface ExtractedDataPoint {
  label: string;
  value: number;
  category?: string;
  confidence?: number;
  source?: string;
  metadata?: Record<string, any>;
}

export interface ExtractedDataset {
  title: string;
  description: string;
  data: ExtractedDataPoint[];
  type: 'numerical' | 'categorical' | 'temporal' | 'correlation';
  source: string;
  confidence: number;
}

export interface EvidenceBasedChart {
  title: string;
  type: 'bar' | 'scatter' | 'line' | 'histogram' | 'box' | 'heatmap' | 'pie';
  data: any[];
  layout: any;
  source: string;
  confidence: number;
  evidenceNodes: string[];
}

export class EvidenceDataExtractor {
  /**
   * Extract quantitative data from evidence nodes
   */
  public static extractQuantitativeData(
    evidenceNodes: GraphNode[],
    researchContext: ResearchContext
  ): ExtractedDataset[] {
    const datasets: ExtractedDataset[] = [];

    for (const node of evidenceNodes) {
      if (node.type !== 'evidence' || !node.metadata?.value) {
        continue;
      }

      const evidenceText = node.metadata.value;
      const extractedData = this.parseEvidenceText(evidenceText, node.id);
      
      if (extractedData.length > 0) {
        datasets.push({
          title: `Evidence from ${node.label || 'Research Source'}`,
          description: node.metadata.source_description || 'Quantitative findings from research evidence',
          data: extractedData,
          type: this.determineDataType(extractedData),
          source: node.metadata.source_description || node.id,
          confidence: node.confidence?.[0] || 0.7
        });
      }
    }

    return datasets;
  }

  /**
   * Parse evidence text to extract numerical data
   */
  private static parseEvidenceText(text: string, nodeId: string): ExtractedDataPoint[] {
    const dataPoints: ExtractedDataPoint[] = [];

    // Extract various patterns of quantitative data
    const patterns = [
      // Percentages: "65% of patients", "efficacy rate of 78%"
      /(\w+(?:\s+\w+)*)\s*:?\s*(\d+(?:\.\d+)?)\s*%/gi,
      
      // P-values: "p < 0.05", "p = 0.001"
      /p\s*[<>=]\s*(\d+(?:\.\d+)?)/gi,
      
      // Effect sizes: "effect size: 0.8", "Cohen's d = 1.2"
      /(?:effect size|cohen'?s\s+d|odds ratio|hazard ratio)[:\s=]\s*(\d+(?:\.\d+)?)/gi,
      
      // Confidence intervals: "95% CI: 1.2-2.8", "CI [0.8, 1.5]"
      /(\d+)%\s*CI[:\s]*[\[\(]?(\d+(?:\.\d+)?)[,\s-]+(\d+(?:\.\d+)?)[\]\)]?/gi,
      
      // Sample sizes: "n = 150", "sample size: 300"
      /(?:n|sample size)[:\s=]\s*(\d+)/gi,
      
      // Means with SD: "mean = 12.5 ± 2.3", "average: 45.2 (SD: 8.1)"
      /(?:mean|average)[:\s=]\s*(\d+(?:\.\d+)?)\s*[±(]\s*(?:SD[:\s]?)?(\d+(?:\.\d+)?)/gi,
      
      // Correlations: "r = 0.75", "correlation coefficient: -0.42"
      /(?:r|correlation coefficient)[:\s=]\s*(-?\d+(?:\.\d+)?)/gi,
      
      // Statistical power: "power = 0.80", "statistical power: 85%"
      /(?:power|statistical power)[:\s=]\s*(\d+(?:\.\d+)?)/gi,
      
      // Numbers with units: "25 mg/dL", "120 mmHg", "3.5 years"
      /(\d+(?:\.\d+)?)\s*(\w+(?:\/\w+)?)\s*(?:of\s+)?(\w+(?:\s+\w+)*)?/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const value = parseFloat(match[1] || match[2]);
        if (!isNaN(value)) {
          dataPoints.push({
            label: this.extractLabel(match, text, match.index),
            value: value,
            source: nodeId,
            confidence: 0.8,
            metadata: {
              pattern: pattern.source,
              fullMatch: match[0],
              context: this.extractContext(text, match.index, 50)
            }
          });
        }
      }
    });

    // Extract table-like data
    const tableData = this.extractTableData(text, nodeId);
    dataPoints.push(...tableData);

    // Remove duplicates and invalid data
    return this.deduplicateAndValidate(dataPoints);
  }

  /**
   * Extract structured table data from text
   */
  private static extractTableData(text: string, nodeId: string): ExtractedDataPoint[] {
    const dataPoints: ExtractedDataPoint[] = [];
    
    // Look for table-like structures with numbers
    const tablePatterns = [
      // Simple table format: "Group A: 25, Group B: 30, Group C: 18"
      /(\w+(?:\s+\w+)*)\s*:\s*(\d+(?:\.\d+)?)/gi,
      
      // Bullet point lists with numbers: "• Treatment: 85%", "- Control: 45%"
      /[•\-*]\s*(\w+(?:\s+\w+)*)\s*:\s*(\d+(?:\.\d+)?)(?:\s*%)?/gi,
      
      // Tabular data in citations or results sections
      /(\w+(?:\s+\w+)*)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/gi
    ];

    tablePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const value = parseFloat(match[2]);
        if (!isNaN(value)) {
          dataPoints.push({
            label: match[1].trim(),
            value: value,
            source: nodeId,
            confidence: 0.7,
            metadata: {
              pattern: 'table_extraction',
              fullMatch: match[0]
            }
          });
        }
      }
    });

    return dataPoints;
  }

  /**
   * Generate evidence-based charts from extracted datasets
   */
  public static generateEvidenceBasedCharts(
    datasets: ExtractedDataset[],
    researchContext: ResearchContext
  ): EvidenceBasedChart[] {
    const charts: EvidenceBasedChart[] = [];

    for (const dataset of datasets) {
      const chart = this.createChartFromDataset(dataset, researchContext);
      if (chart) {
        charts.push(chart);
      }
    }

    // Add summary charts combining multiple datasets
    if (datasets.length > 1) {
      const summaryChart = this.createSummaryChart(datasets, researchContext);
      if (summaryChart) {
        charts.push(summaryChart);
      }
    }

    return charts;
  }

  /**
   * Create a chart from a single dataset
   */
  private static createChartFromDataset(
    dataset: ExtractedDataset,
    researchContext: ResearchContext
  ): EvidenceBasedChart | null {
    if (dataset.data.length === 0) {
      return null;
    }

    const chartType = this.selectOptimalChartType(dataset);
    const chartData = this.formatDataForPlotly(dataset.data, chartType);
    
    return {
      title: `${dataset.title} - ${researchContext.topic}`,
      type: chartType,
      data: chartData,
      layout: {
        title: {
          text: dataset.title,
          font: { size: 16 }
        },
        xaxis: {
          title: this.generateAxisLabel(dataset.data, 'x'),
          tickangle: -45
        },
        yaxis: {
          title: this.generateAxisLabel(dataset.data, 'y')
        },
        showlegend: true,
        plot_bgcolor: 'rgba(0,0,0,0)',
        paper_bgcolor: 'rgba(0,0,0,0)'
      },
      source: dataset.source,
      confidence: dataset.confidence,
      evidenceNodes: [dataset.source]
    };
  }

  /**
   * Create a summary chart combining multiple datasets
   */
  private static createSummaryChart(
    datasets: ExtractedDataset[],
    researchContext: ResearchContext
  ): EvidenceBasedChart {
    // Combine confidence scores across all evidence
    const confidenceData = datasets.map(d => ({
      label: d.title.replace('Evidence from ', ''),
      value: d.confidence,
      category: 'Evidence Confidence'
    }));

    return {
      title: `Evidence Confidence Summary - ${researchContext.topic}`,
      type: 'bar',
      data: [{
        x: confidenceData.map(d => d.label),
        y: confidenceData.map(d => d.value),
        type: 'bar',
        marker: {
          color: confidenceData.map(d => 
            d.value > 0.8 ? '#10b981' : 
            d.value > 0.6 ? '#f59e0b' : '#ef4444'
          )
        },
        name: 'Evidence Confidence'
      }],
      layout: {
        title: {
          text: 'Evidence Confidence Across Sources',
          font: { size: 16 }
        },
        xaxis: { title: 'Evidence Sources' },
        yaxis: { title: 'Confidence Level', range: [0, 1] },
        showlegend: false
      },
      source: 'Evidence Summary',
      confidence: datasets.reduce((acc, d) => acc + d.confidence, 0) / datasets.length,
      evidenceNodes: datasets.map(d => d.source)
    };
  }

  // Helper methods
  private static extractLabel(match: RegExpExecArray, text: string, index: number): string {
    const contextBefore = text.substring(Math.max(0, index - 30), index);
    const contextAfter = text.substring(index, Math.min(text.length, index + 30));
    
    // Try to extract meaningful labels from context
    const labelPatterns = [
      /(\w+(?:\s+\w+)*)\s*:?\s*$/,
      /(?:in|for|of)\s+(\w+(?:\s+\w+)*)/,
    ];

    for (const pattern of labelPatterns) {
      const labelMatch = pattern.exec(contextBefore);
      if (labelMatch) {
        return labelMatch[1];
      }
    }

    return match[1] || match[0] || 'Data Point';
  }

  private static extractContext(text: string, index: number, length: number): string {
    const start = Math.max(0, index - length);
    const end = Math.min(text.length, index + length);
    return text.substring(start, end).replace(/\s+/g, ' ').trim();
  }

  private static determineDataType(data: ExtractedDataPoint[]): 'numerical' | 'categorical' | 'temporal' | 'correlation' {
    // Simple heuristics to determine data type
    const hasCategories = data.some(d => d.category);
    const hasTimeKeywords = data.some(d => 
      /time|date|year|month|day|period|duration/.test(d.label.toLowerCase())
    );
    const hasCorrelationKeywords = data.some(d => 
      /correlation|coefficient|r\s*=/.test(d.label.toLowerCase())
    );

    if (hasCorrelationKeywords) return 'correlation';
    if (hasTimeKeywords) return 'temporal';
    if (hasCategories) return 'categorical';
    return 'numerical';
  }

  private static selectOptimalChartType(dataset: ExtractedDataset): EvidenceBasedChart['type'] {
    switch (dataset.type) {
      case 'correlation': return 'scatter';
      case 'temporal': return 'line';
      case 'categorical': return 'bar';
      case 'numerical':
        return dataset.data.length > 20 ? 'histogram' : 'bar';
      default: return 'bar';
    }
  }

  private static formatDataForPlotly(data: ExtractedDataPoint[], chartType: string): any[] {
    const x = data.map(d => d.label);
    const y = data.map(d => d.value);

    switch (chartType) {
      case 'scatter':
        return [{
          x: x,
          y: y,
          mode: 'markers',
          type: 'scatter',
          marker: { size: 8, opacity: 0.7 }
        }];
      
      case 'bar':
        return [{
          x: x,
          y: y,
          type: 'bar',
          marker: { 
            color: y.map(val => val > 0.8 ? '#10b981' : val > 0.5 ? '#f59e0b' : '#ef4444'),
            opacity: 0.8
          }
        }];
      
      case 'line':
        return [{
          x: x,
          y: y,
          type: 'scatter',
          mode: 'lines+markers',
          line: { width: 2 }
        }];
      
      default:
        return [{
          x: x,
          y: y,
          type: chartType,
          marker: { opacity: 0.7 }
        }];
    }
  }

  private static generateAxisLabel(data: ExtractedDataPoint[], axis: 'x' | 'y'): string {
    if (axis === 'x') {
      return 'Categories';
    } else {
      // Try to infer unit from data
      const commonUnits = data
        .map(d => d.metadata?.unit)
        .filter(u => u)
        .reduce((acc: Record<string, number>, unit: string) => {
          acc[unit] = (acc[unit] || 0) + 1;
          return acc;
        }, {});
      
      const mostCommonUnit = Object.keys(commonUnits)
        .sort((a, b) => commonUnits[b] - commonUnits[a])[0];
      
      return mostCommonUnit ? `Values (${mostCommonUnit})` : 'Values';
    }
  }

  private static deduplicateAndValidate(dataPoints: ExtractedDataPoint[]): ExtractedDataPoint[] {
    // Remove duplicates based on label and value
    const unique = dataPoints.filter((point, index, array) => 
      array.findIndex(p => p.label === point.label && p.value === point.value) === index
    );

    // Filter out invalid or nonsensical values
    return unique.filter(point => 
      point.value !== null && 
      point.value !== undefined && 
      !isNaN(point.value) &&
      isFinite(point.value) &&
      point.label.length > 0
    );
  }
}