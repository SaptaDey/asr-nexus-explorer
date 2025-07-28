/**
 * treeExport.ts - Export utilities for 3D botanical tree visualization
 * Supports PNG, SVG, GLB, and statistical report formats
 */

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

export interface ExportOptions {
  format: 'png' | 'svg' | 'glb' | 'json' | 'html';
  width?: number;
  height?: number;
  quality?: number;
  includeStatistics?: boolean;
  includeLegend?: boolean;
}

export interface TreeStatistics {
  totalNodes: number;
  nodesByType: Record<string, number>;
  confidenceDistribution: number[];
  evidenceCount: number;
  averageImpactScore: number;
  disciplinaryBreakdown: Record<string, number>;
  stageProgression: number[];
}

// Export 3D tree as PNG image
export const exportTreeAsPNG = async (
  canvas: HTMLCanvasElement,
  options: ExportOptions = {}
): Promise<Blob> => {
  const { width = 1920, height = 1080, quality = 0.95 } = options;
  
  // Create off-screen canvas for high-resolution export
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = width;
  exportCanvas.height = height;
  
  const ctx = exportCanvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  
  // Draw the current frame to export canvas
  ctx.drawImage(canvas, 0, 0, width, height);
  
  // Add watermark and metadata if requested
  if (options.includeLegend) {
    addLegendToCanvas(ctx, width, height);
  }
  
  return new Promise((resolve) => {
    exportCanvas.toBlob((blob) => {
      if (blob) resolve(blob);
    }, 'image/png', quality);
  });
};

// Export 3D tree as GLB model
export const exportTreeAsGLB = async (
  scene: THREE.Scene,
  options: ExportOptions = {}
): Promise<ArrayBuffer> => {
  const exporter = new GLTFExporter();
  
  const exportOptions = {
    binary: true,
    includeCustomExtensions: false,
    animations: [],
    onlyVisible: true
  };
  
  return new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(result);
        } else {
          reject(new Error('Export failed'));
        }
      },
      reject,
      exportOptions
    );
  });
};

// Generate tree statistics
export const generateTreeStatistics = (treeData: any): TreeStatistics => {
  if (!treeData) {
    return {
      totalNodes: 0,
      nodesByType: {},
      confidenceDistribution: [],
      evidenceCount: 0,
      averageImpactScore: 0,
      disciplinaryBreakdown: {},
      stageProgression: []
    };
  }

  const stats: TreeStatistics = {
    totalNodes: 0,
    nodesByType: {},
    confidenceDistribution: [],
    evidenceCount: 0,
    averageImpactScore: 0,
    disciplinaryBreakdown: {},
    stageProgression: new Array(9).fill(0)
  };

  const nodeData: any[] = [];
  
  // Collect all node data
  treeData.each((node: any) => {
    nodeData.push(node.data);
  });

  stats.totalNodes = nodeData.length;

  // Analyze node data
  nodeData.forEach(node => {
    // Count by botanical type
    const type = node.metadata?.botanicalType || 'unknown';
    stats.nodesByType[type] = (stats.nodesByType[type] || 0) + 1;

    // Confidence distribution
    if (node.confidence && Array.isArray(node.confidence)) {
      const avgConfidence = node.confidence.reduce((a: number, b: number) => a + b, 0) / node.confidence.length;
      stats.confidenceDistribution.push(avgConfidence);
    }

    // Evidence count
    stats.evidenceCount += node.metadata?.evidence_count || 0;

    // Impact scores
    if (node.metadata?.impact_score) {
      stats.averageImpactScore += node.metadata.impact_score;
    }

    // Disciplinary breakdown
    if (node.metadata?.disciplinary_tags) {
      node.metadata.disciplinary_tags.forEach((tag: string) => {
        stats.disciplinaryBreakdown[tag] = (stats.disciplinaryBreakdown[tag] || 0) + 1;
      });
    }

    // Stage progression
    const stage = node.metadata?.stage || 1;
    if (stage >= 1 && stage <= 9) {
      stats.stageProgression[stage - 1]++;
    }
  });

  // Calculate averages
  if (stats.totalNodes > 0) {
    stats.averageImpactScore /= stats.totalNodes;
  }

  return stats;
};

// Export as HTML report with embedded visualization
export const exportTreeAsHTML = async (
  canvas: HTMLCanvasElement,
  treeData: any,
  statistics: TreeStatistics,
  options: ExportOptions = {}
): Promise<string> => {
  const imageDataUrl = canvas.toDataURL('image/png', options.quality || 0.95);
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASR-GoT Research Tree Visualization Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
        }
        .visualization {
            text-align: center;
            margin: 30px 0;
        }
        .visualization img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .statistics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .stat-card h3 {
            margin-top: 0;
            color: #667eea;
        }
        .progress-bar {
            background: #e9ecef;
            border-radius: 4px;
            height: 8px;
            margin: 10px 0;
        }
        .progress-fill {
            background: #28a745;
            height: 100%;
            border-radius: 4px;
            transition: width 0.3s ease;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            border-top: 1px solid #dee2e6;
            font-size: 0.9em;
            color: #6c757d;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        th, td {
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
        }
        th {
            background: #f8f9fa;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌳 ASR-GoT Research Tree Visualization</h1>
        <p>Advanced Scientific Reasoning - Graph of Thoughts Framework</p>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="visualization">
        <h2>3D Botanical Tree Visualization</h2>
        <img src="${imageDataUrl}" alt="ASR-GoT Research Tree Visualization" />
    </div>

    <div class="statistics">
        <div class="stat-card">
            <h3>📊 Overview Statistics</h3>
            <p><strong>Total Nodes:</strong> ${statistics.totalNodes}</p>
            <p><strong>Evidence Count:</strong> ${statistics.evidenceCount}</p>
            <p><strong>Average Impact Score:</strong> ${statistics.averageImpactScore.toFixed(3)}</p>
            <p><strong>Average Confidence:</strong> ${
              statistics.confidenceDistribution.length > 0 
                ? (statistics.confidenceDistribution.reduce((a, b) => a + b, 0) / statistics.confidenceDistribution.length).toFixed(3)
                : 'N/A'
            }</p>
        </div>

        <div class="stat-card">
            <h3>🌿 Botanical Elements</h3>
            <table>
                <thead>
                    <tr><th>Element Type</th><th>Count</th><th>Percentage</th></tr>
                </thead>
                <tbody>
                    ${Object.entries(statistics.nodesByType).map(([type, count]) => `
                        <tr>
                            <td>${type.charAt(0).toUpperCase() + type.slice(1)}</td>
                            <td>${count}</td>
                            <td>${((count / statistics.totalNodes) * 100).toFixed(1)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="stat-card">
            <h3>🔬 Disciplinary Breakdown</h3>
            ${Object.entries(statistics.disciplinaryBreakdown).map(([discipline, count]) => `
                <div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>${discipline.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        <span>${count}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(count / statistics.totalNodes) * 100}%"></div>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="stat-card">
            <h3>📈 Stage Progression</h3>
            ${statistics.stageProgression.map((count, index) => `
                <div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Stage ${index + 1}</span>
                        <span>${count} nodes</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${statistics.totalNodes > 0 ? (count / statistics.totalNodes) * 100 : 0}%"></div>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>

    <div class="footer">
        <p>🤖 Generated with Claude Code - ASR-GoT Framework</p>
        <p>Visit <a href="https://scientific-research.online/">scientific-research.online</a> for interactive visualization</p>
    </div>
</body>
</html>`;

  return html;
};

// Add legend to canvas
const addLegendToCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const legendHeight = 120;
  const legendY = height - legendHeight - 20;
  
  // Legend background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(20, legendY, 300, legendHeight);
  
  // Legend title
  ctx.fillStyle = 'white';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('Botanical Elements Legend', 30, legendY + 25);
  
  // Legend items
  const legendItems = [
    { color: '#8B4513', text: '🌰 Root Bulb - Research Question' },
    { color: '#CD853F', text: '🌱 Rootlets - Decomposition' },
    { color: '#4A5D23', text: '🌿 Branches - Hypotheses' },
    { color: '#32CD32', text: '🌾 Buds - Evidence Collection' },
    { color: '#228B22', text: '🍃 Leaves - Synthesis' },
    { color: '#FFB6C1', text: '🌸 Blossoms - Insights' }
  ];
  
  ctx.font = '12px sans-serif';
  legendItems.forEach((item, index) => {
    const y = legendY + 45 + index * 12;
    ctx.fillStyle = item.color;
    ctx.fillRect(30, y - 8, 12, 10);
    ctx.fillStyle = 'white';
    ctx.fillText(item.text, 50, y);
  });
};

// Main export function
export const exportTree = async (
  canvas: HTMLCanvasElement,
  scene: THREE.Scene,
  treeData: any,
  options: ExportOptions
): Promise<Blob | ArrayBuffer | string> => {
  const statistics = generateTreeStatistics(treeData);
  
  switch (options.format) {
    case 'png':
      return exportTreeAsPNG(canvas, options);
    
    case 'glb':
      return exportTreeAsGLB(scene, options);
    
    case 'html':
      return exportTreeAsHTML(canvas, treeData, statistics, options);
    
    case 'json':
      return JSON.stringify({
        treeData,
        statistics,
        exportedAt: new Date().toISOString(),
        metadata: {
          format: 'ASR-GoT Tree Export',
          version: '1.0.0'
        }
      }, null, 2);
    
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
};

export default {
  exportTree,
  exportTreeAsPNG,
  exportTreeAsGLB,
  exportTreeAsHTML,
  generateTreeStatistics
};