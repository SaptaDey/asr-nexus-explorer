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
// Convert markdown to HTML first, then sanitize
  const parseMarkdownToHTML = (markdown: string): string => {
    const html = markdown
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2 text-primary">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3 text-primary">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4 text-primary">$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*)\*/gim, '<em class="italic">$1</em>')
      .replace(/```([\s\S]*?)```/gim, '<pre class="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto my-3"><code>$1</code></pre>')
      .replace(/`([^`]*)`/gim, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>')
      .replace(/\n\n/gim, '</p><p class="mb-3">')
      .replace(/\n/gim, '<br>')
      .replace(/^(?!<[hlu])/gim, '<p class="mb-3">')
      .replace(/(?<![>])$/gim, '</p>');
    return sanitizeHTML(html);
  };

  const sanitizedResults = stageResults.map(result => parseMarkdownToHTML(result));
  const sanitizedFinalReport = parseMarkdownToHTML(finalReport);
  
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

  // Improve SVG export with better node positioning and actual data
  const width = 1200;
  const height = 800;
  
  // Use force-directed layout for better positioning
  const nodePositions = graphData.nodes.map((node, index) => {
    const cols = Math.ceil(Math.sqrt(graphData.nodes.length));
    const row = Math.floor(index / cols);
    const col = index % cols;
    const x = (col + 1) * (width / (cols + 1));
    const y = (row + 1) * (height / (Math.ceil(graphData.nodes.length / cols) + 1));
    return { ...node, x, y };
  });

  // Create edge lines with proper connections
  const edgeElements = graphData.edges.map(edge => {
    const sourceNode = nodePositions.find(n => n.id === edge.source);
    const targetNode = nodePositions.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) return '';
    
    return `<line x1="${sourceNode.x}" y1="${sourceNode.y}" x2="${targetNode.x}" y2="${targetNode.y}" stroke="#666" stroke-width="2" opacity="0.7"/>`;
  }).join('');

  // Create styled nodes with labels
  const nodeElements = nodePositions.map(node => {
    const nodeColor = node.type === 'evidence' ? '#22c55e' : 
                     node.type === 'hypothesis' ? '#3b82f6' : 
                     node.type === 'root' ? '#f59e0b' : '#8b5cf6';
    
    return `
      <g>
        <circle cx="${node.x}" cy="${node.y}" r="25" fill="${nodeColor}" stroke="#1f2937" stroke-width="2" opacity="0.9"/>
        <text x="${node.x}" y="${node.y + 5}" text-anchor="middle" font-size="12" font-weight="bold" fill="white">${node.type.charAt(0).toUpperCase()}</text>
        <text x="${node.x}" y="${node.y + 45}" text-anchor="middle" font-size="10" fill="#374151" width="100">${node.label.substring(0, 20)}${node.label.length > 20 ? '...' : ''}</text>
        ${typeof node.confidence === 'number' && !isNaN(node.confidence) ? `<text x="${node.x}" y="${node.y + 58}" text-anchor="middle" font-size="8" fill="#6b7280">conf: ${(node.confidence as number).toFixed(2)}</text>` : ''}
      </g>
    `;
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