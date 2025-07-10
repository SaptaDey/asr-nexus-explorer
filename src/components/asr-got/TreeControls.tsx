/**
 * TreeControls.tsx - Timeline controls and export functionality
 * Handles timeline scrubber, buttons, and SVG export
 */

import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Download, RotateCcw, Palette } from 'lucide-react';
import { toast } from 'sonner';

interface TreeControlsProps {
  timelineStage: number;
  currentStage: number;
  isAnimating: boolean;
  colorBlindMode: boolean;
  setColorBlindMode: (value: boolean) => void;
  onTimelineChange: (value: number[]) => void;
  svgRef: React.RefObject<SVGSVGElement>;
}

export const TreeControls: React.FC<TreeControlsProps> = ({
  timelineStage,
  currentStage,
  isAnimating,
  colorBlindMode,
  setColorBlindMode,
  onTimelineChange,
  svgRef
}) => {
  // Export SVG functionality with embedded CSS
  const exportSVG = useCallback(() => {
    if (!svgRef.current) {
      toast.error('No tree visualization to export');
      return;
    }
    
    try {
      const svgElement = svgRef.current;
      
      // Check if SVG has content
      const hasContent = svgElement.children.length > 0;
      if (!hasContent) {
        toast.warning('Tree visualization is empty - start analysis first');
        return;
      }
      
      // Clone the SVG to avoid modifying the original
      const clonedSVG = svgElement.cloneNode(true) as SVGElement;
      
      // Add embedded CSS styles for standalone SVG
      const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      styleElement.textContent = `
        .branch-path { stroke-linecap: round; stroke-linejoin: round; }
        .botanical-element { transition: transform 0.3s ease; }
        .root-bulb { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); }
        .leaf-cluster { filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1)); }
        .blossom { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15)); }
        .withered { opacity: 0.2; }
        text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      `;
      
      // Insert style as first child
      clonedSVG.insertBefore(styleElement, clonedSVG.firstChild);
      
      // Add title and description for accessibility
      const titleElement = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      titleElement.textContent = 'ASR-GoT Botanical Tree Visualization';
      
      const descElement = document.createElementNS('http://www.w3.org/2000/svg', 'desc');
      descElement.textContent = `Interactive botanical tree representing the ASR-GoT research framework. 
        Each element represents a stage in the research process: root bulb (initialization), 
        rootlets (decomposition), branches (hypotheses), buds (evidence), leaves (subgraphs), 
        and blossoms (synthesis). Generated on ${new Date().toISOString()}.`;
      
      clonedSVG.insertBefore(titleElement, clonedSVG.firstChild);
      clonedSVG.insertBefore(descElement, clonedSVG.firstChild);
      
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(clonedSVG);
      
      // Add XML declaration and ensure proper namespace
      svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;
      
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `asr-got-botanical-tree-${new Date().toISOString().split('T')[0]}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Botanical tree exported as SVG with embedded styles');
    } catch (error) {
      console.error('SVG export error:', error);
      toast.error('Export failed - check console for details');
    }
  }, [svgRef]);

  // Export HTML with embedded visualization
  const exportHTML = useCallback(() => {
    if (!svgRef.current) {
      toast.error('No tree visualization to export');
      return;
    }
    
    try {
      const svgElement = svgRef.current;
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASR-GoT Botanical Tree Visualization</title>
    <style>
        body { 
            margin: 0; 
            padding: 20px; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 12px; 
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        h1 { 
            text-align: center; 
            color: #2d3748; 
            margin-bottom: 10px;
            font-size: 2.5em;
        }
        .subtitle { 
            text-align: center; 
            color: #718096; 
            margin-bottom: 30px;
            font-size: 1.1em;
        }
        .tree-container { 
            border: 2px solid #e2e8f0; 
            border-radius: 8px; 
            padding: 20px;
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
        }
        .description {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .description h3 {
            margin-top: 0;
            color: #2d3748;
        }
        .stage-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .stage {
            background: white;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }
        .stage h4 {
            margin: 0 0 8px 0;
            color: #4a5568;
        }
        .stage p {
            margin: 0;
            font-size: 0.9em;
            color: #718096;
        }
        @media print {
            body { background: white; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌱 ASR-GoT Botanical Tree</h1>
        <p class="subtitle">Advanced Scientific Reasoning - Graph of Thoughts Framework</p>
        
        <div class="tree-container">
            ${svgString}
        </div>
        
        <div class="description">
            <h3>Framework Overview</h3>
            <p>This botanical visualization represents the ASR-GoT (Automatic Scientific Research - Graph of Thoughts) framework, 
               where each element symbolizes a stage in the research process. The tree grows organically as reasoning progresses, 
               with confidence levels and evidence quality determining the visual properties of each element.</p>
            
            <div class="stage-info">
                <div class="stage">
                    <h4>🌰 Root Bulb</h4>
                    <p>Task understanding and initialization</p>
                </div>
                <div class="stage">
                    <h4>🌱 Rootlets</h4>
                    <p>Multi-dimensional decomposition</p>
                </div>
                <div class="stage">
                    <h4>🌿 Branches</h4>
                    <p>Hypothesis generation and planning</p>
                </div>
                <div class="stage">
                    <h4>🌾 Buds</h4>
                    <p>Evidence integration and analysis</p>
                </div>
                <div class="stage">
                    <h4>🍃 Leaves</h4>
                    <p>Subgraph extraction and refinement</p>
                </div>
                <div class="stage">
                    <h4>🌸 Blossoms</h4>
                    <p>Synthesis and composition</p>
                </div>
                <div class="stage">
                    <h4>✨ Pollen</h4>
                    <p>Reflection and quality audit</p>
                </div>
            </div>
            
            <p style="margin-top: 20px; font-size: 0.9em; color: #718096;">
                Generated on ${new Date().toLocaleString()} | 
                <a href="https://scientific-research.online" target="_blank">scientific-research.online</a>
            </p>
        </div>
    </div>
</body>
</html>`;
      
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `asr-got-botanical-tree-${new Date().toISOString().split('T')[0]}.html`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Complete HTML report exported successfully');
    } catch (error) {
      console.error('HTML export error:', error);
      toast.error('HTML export failed - check console for details');
    }
  }, [svgRef]);

  return (
    <>
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>🌱 Tree of Reasoning - Live Growth</span>
          <Badge variant="outline">Stage {currentStage + 1}</Badge>
          {isAnimating && <Badge variant="secondary" className="animate-pulse">Growing...</Badge>}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={colorBlindMode}
              onCheckedChange={setColorBlindMode}
              aria-label="Color-blind mode"
            />
            <Palette className="h-4 w-4" />
          </div>
          
          <Button size="sm" variant="outline" onClick={() => onTimelineChange([0])}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          
          <Button size="sm" onClick={exportSVG} variant="outline">
            <Download className="h-4 w-4" />
            SVG
          </Button>
          
          <Button size="sm" onClick={exportHTML}>
            <Download className="h-4 w-4" />
            HTML Report
          </Button>
        </div>
      </div>

      {/* Timeline Scrubber */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Growth Timeline</label>
        <Slider
          value={[timelineStage]}
          onValueChange={onTimelineChange}
          max={9}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          {['Init', 'Decomp', 'Hypotheses', 'Evidence', 'Pruning', 'Subgraphs', 'Synthesis', 'Reflection', 'Final'].map((label, i) => (
            <span key={i} className={i === currentStage ? 'font-bold text-primary' : ''}>{label}</span>
          ))}
        </div>
      </div>
    </>
  );
};