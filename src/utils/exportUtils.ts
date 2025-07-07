/**
 * Secure Export Utilities for ASR-GoT Framework
 * Handles safe file downloads and data serialization
 */

import { GraphData, ResearchContext, ASRGoTParameters } from '@/types/asrGotTypes';
import { sanitizeHTML } from './securityUtils';

/**
 * Sanitize filename to prevent directory traversal attacks
 */
const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.\./g, '_')
    .substring(0, 100) // Limit length
    .replace(/^\./, '_'); // No hidden files
};

/**
 * Create and trigger file download safely
 */
const downloadFile = (content: string, filename: string, mimeType: string): void => {
  try {
    const sanitizedFilename = sanitizeFilename(filename);
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = sanitizedFilename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    throw new Error(`File download failed: ${error}`);
  }
};

/**
 * Export results as sanitized HTML
 */
export const exportAsHTML = (
  stageResults: string[],
  graphData: GraphData,
  researchContext: ResearchContext,
  finalReport: string,
  parameters: ASRGoTParameters
): void => {
  const sanitizedResults = stageResults.map(result => sanitizeHTML(result));
  const sanitizedFinalReport = sanitizeHTML(finalReport);
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASR-GoT Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .stage { margin-bottom: 30px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .stage-title { color: #333; border-bottom: 2px solid #007acc; padding-bottom: 5px; }
        .final-report { background: #f9f9f9; padding: 20px; border-radius: 8px; margin-top: 30px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
        code { background: #f5f5f5; padding: 2px 4px; border-radius: 2px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ASR-GoT Analysis Report</h1>
        <p><strong>Topic:</strong> ${researchContext.topic || 'N/A'}</p>
        <p><strong>Field:</strong> ${researchContext.field || 'N/A'}</p>
        <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
    </div>
    
    ${sanitizedResults.map((result, index) => `
        <div class="stage">
            <h2 class="stage-title">Stage ${index + 1}</h2>
            <div>${result}</div>
        </div>
    `).join('')}
    
    ${sanitizedFinalReport ? `
        <div class="final-report">
            <h2>Final Analysis</h2>
            <div>${sanitizedFinalReport}</div>
        </div>
    ` : ''}
</body>
</html>`;

  downloadFile(html, `asr-got-analysis-${Date.now()}.html`, 'text/html');
};

/**
 * Export results as JSON with validation
 */
export const exportAsJSON = (
  stageResults: string[],
  graphData: GraphData,
  researchContext: ResearchContext,
  finalReport: string,
  parameters: ASRGoTParameters
): void => {
  const exportData = {
    metadata: {
      exported: new Date().toISOString(),
      version: '1.0.0',
      framework: 'ASR-GoT'
    },
    researchContext: {
      topic: researchContext.topic || '',
      field: researchContext.field || '',
      objectives: researchContext.objectives || []
    },
    parameters: {
      maxTokens: parameters.maxTokens,
      temperature: parameters.temperature,
      maxDepth: parameters.maxDepth
    },
    stages: stageResults.map((result, index) => ({
      stage: index + 1,
      result: result || ''
    })),
    graph: {
      nodes: graphData.nodes.length,
      edges: graphData.edges.length
    },
    finalReport: finalReport || ''
  };

  try {
    const jsonString = JSON.stringify(exportData, null, 2);
    downloadFile(jsonString, `asr-got-analysis-${Date.now()}.json`, 'application/json');
  } catch (error) {
    throw new Error('Failed to serialize export data');
  }
};

/**
 * Export graph as SVG
 */
export const exportGraphAsSVG = (graphData: GraphData): void => {
  if (!graphData.nodes.length) {
    throw new Error('No graph data to export');
  }

  // Create a simple SVG representation
  const width = 800;
  const height = 600;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Position nodes in a circle
  const nodeElements = graphData.nodes.map((node, index) => {
    const angle = (index * 2 * Math.PI) / graphData.nodes.length;
    const radius = Math.min(width, height) * 0.3;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    
    return `
      <g>
        <circle cx="${x}" cy="${y}" r="20" fill="#007acc" stroke="#333" stroke-width="2"/>
        <text x="${x}" y="${y + 5}" text-anchor="middle" font-size="10" fill="white">${node.id}</text>
        <text x="${x}" y="${y + 35}" text-anchor="middle" font-size="8" fill="#333">${node.label}</text>
      </g>
    `;
  }).join('');

  // Create edge lines
  const edgeElements = graphData.edges.map(edge => {
    const sourceIndex = graphData.nodes.findIndex(n => n.id === edge.source);
    const targetIndex = graphData.nodes.findIndex(n => n.id === edge.target);
    
    if (sourceIndex === -1 || targetIndex === -1) return '';
    
    const sourceAngle = (sourceIndex * 2 * Math.PI) / graphData.nodes.length;
    const targetAngle = (targetIndex * 2 * Math.PI) / graphData.nodes.length;
    const radius = Math.min(width, height) * 0.3;
    
    const x1 = centerX + radius * Math.cos(sourceAngle);
    const y1 = centerY + radius * Math.sin(sourceAngle);
    const x2 = centerX + radius * Math.cos(targetAngle);
    const y2 = centerY + radius * Math.sin(targetAngle);
    
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#666" stroke-width="1"/>`;
  }).join('');

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <style>
    text { font-family: Arial, sans-serif; }
  </style>
  <rect width="100%" height="100%" fill="white"/>
  ${edgeElements}
  ${nodeElements}
  <text x="10" y="20" font-size="12" fill="#333">ASR-GoT Graph - ${new Date().toISOString()}</text>
</svg>`;

  downloadFile(svg, `asr-got-graph-${Date.now()}.svg`, 'image/svg+xml');
};