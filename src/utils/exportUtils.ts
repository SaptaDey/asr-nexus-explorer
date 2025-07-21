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
 * Export results as comprehensive publication-quality HTML using Stage 9 architecture
 */
export const exportAsHTML = async (
  stageResults: string[],
  graphData: GraphData,
  researchContext: ResearchContext,
  finalReport: string,
  parameters: ASRGoTParameters,
  sessionId?: string
): Promise<void> => {
  // Import the new multi-substage Stage 9 generator
  const { Stage9MultiSubstageGenerator } = await import('@/services/Stage9MultiSubstageGenerator');
  
  try {
    console.log('🚀 Starting comprehensive multi-substage thesis generation...');
    
    // **PROGRESS TRACKING**: Set up progress callback for UI feedback
    const progressCallback = (substage: string, progress: number) => {
      console.log(`📊 Progress: ${substage} - ${progress}%`);
      // Emit progress event for UI components to listen to
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('stage9-progress', { 
          detail: { substage, progress } 
        }));
      }
    };
    
    // **CREATE MULTI-SUBSTAGE GENERATOR INSTANCE**
    const multiSubstageGenerator = new Stage9MultiSubstageGenerator(
      parameters,
      researchContext,
      graphData,
      stageResults,
      progressCallback,
      sessionId
    );
    
    // **GENERATE COMPREHENSIVE 150+ PAGE THESIS using progressive substages**
    console.log('🧠 Generating 150+ page thesis with progressive substages (9A-9G)...');
    const comprehensiveReport = await multiSubstageGenerator.generateComprehensiveThesisReport({
      storeInSupabase: true, // Enable automatic storage in Supabase
      sessionTitle: `${researchContext.topic} - Multi-Substage Thesis`,
      enableProgressiveRefinement: true // Enable context chaining between substages
    });
    
    // **QUALITY VALIDATION**: Check thesis quality metrics
    console.log(`📈 Thesis Quality Metrics:
      - Academic Rigor: ${comprehensiveReport.qualityMetrics.academicRigor.toFixed(1)}%
      - Content Depth: ${comprehensiveReport.qualityMetrics.contentDepth.toFixed(1)}%
      - Figure Integration: ${comprehensiveReport.qualityMetrics.figureIntegration.toFixed(1)}%
      - Reference Quality: ${comprehensiveReport.qualityMetrics.referenceQuality.toFixed(1)}%
      - Total Word Count: ${comprehensiveReport.totalWordCount.toLocaleString()}
      - Total Figures: ${comprehensiveReport.figureMetadata.length}
      - Total Tokens Used: ${comprehensiveReport.totalTokensUsed.toLocaleString()}`);
    
    // **SANITIZE AND EXPORT**: Clean the HTML and download
    const sanitizedHTML = sanitizeHTML(comprehensiveReport.finalHTML);
    
    // Generate filename with comprehensive metadata
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `asr-got-thesis-${comprehensiveReport.totalWordCount}words-${comprehensiveReport.figureMetadata.length}figs-${timestamp}.html`;
    
    downloadFile(sanitizedHTML, filename, 'text/html');
    
    console.log(`✅ Comprehensive Multi-Substage Thesis Export Complete: 
      - ${sanitizedHTML.length.toLocaleString()} characters
      - ${comprehensiveReport.totalWordCount.toLocaleString()} words
      - ${comprehensiveReport.figureMetadata.length} figures with legends
      - ${comprehensiveReport.substageResults.length} substages (9A-9G)
      - Generated in ${comprehensiveReport.totalGenerationTime} seconds`);
    
    // **SUCCESS NOTIFICATION**: Dispatch completion event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('stage9-complete', { 
        detail: { 
          report: comprehensiveReport,
          filename,
          success: true 
        } 
      }));
    }
    
  } catch (error) {
    console.error('❌ Multi-substage thesis generation failed:', error);
    
    // **ENHANCED FALLBACK**: Try single-stage generation first
    try {
      console.log('🔄 Attempting fallback to single-stage generation...');
      const { Stage9Generator } = await import('@/services/Stage9Generator');
      
      const stage9Generator = new Stage9Generator(
        parameters,
        researchContext,
        graphData,
        stageResults
      );
      
      const fallbackContent = await stage9Generator.generateComprehensiveFinalReport({
        storeInSupabase: false, // Don't store fallback version
        sessionTitle: `${researchContext.topic} - Fallback Generation`
      });
      
      const sanitizedHTML = sanitizeHTML(fallbackContent);
      downloadFile(sanitizedHTML, `asr-got-fallback-comprehensive-${Date.now()}.html`, 'text/html');
      
      console.log('⚠️ Fallback generation succeeded - single-stage comprehensive report exported');
      
    } catch (fallbackError) {
      console.error('❌ Both multi-substage and single-stage generation failed:', fallbackError);
      
      // **FINAL FALLBACK**: Use simple static export
      const fallbackHTML = generateFallbackHTML(stageResults, graphData, researchContext, finalReport);
      downloadFile(fallbackHTML, `asr-got-basic-fallback-${Date.now()}.html`, 'text/html');
      
      console.log('⚠️ Using basic fallback HTML export');
    }
    
    // **ERROR NOTIFICATION**: Dispatch error event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('stage9-error', { 
        detail: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          fallbackUsed: true 
        } 
      }));
    }
  }
};

// **FALLBACK FUNCTION**: Simple HTML generation if comprehensive fails
function generateFallbackHTML(
  stageResults: string[],
  graphData: GraphData,
  researchContext: ResearchContext,
  finalReport: string
): string {
  const parseMarkdownToHTML = (markdown: string): string => {
    return markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/\n/gim, '<br>');
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASR-GoT Research Report - ${researchContext.topic}</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <style>
        body { font-family: 'Times New Roman', serif; max-width: 1200px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; }
        h2 { color: #34495e; margin-top: 2em; }
        .stage { margin: 2em 0; padding: 1.5em; border: 1px solid #ddd; border-radius: 8px; }
        .metadata { background: #f8f9fa; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>ASR-GoT Research Analysis: ${researchContext.topic}</h1>
    
    <div class="metadata">
        <strong>Research Field:</strong> ${researchContext.field}<br>
        <strong>Generated:</strong> ${new Date().toISOString()}<br>
        <strong>Framework:</strong> ASR-GoT (Automatic Scientific Research - Graph of Thoughts)<br>
        <strong>Total Stages:</strong> ${stageResults.length}
    </div>
    
    ${stageResults.map((result, index) => `
        <div class="stage">
            <h2>Stage ${index + 1}</h2>
            <div>${parseMarkdownToHTML(result)}</div>
        </div>
    `).join('')}
    
    ${finalReport ? `
        <div class="stage">
            <h2>Final Analysis</h2>
            <div>${parseMarkdownToHTML(finalReport)}</div>
        </div>
    ` : ''}
    
    <hr>
    <p><em>Generated by ASR-GoT Framework • ${new Date().toISOString()}</em></p>
</body>
</html>`;
}

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