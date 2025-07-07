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
  // Export SVG functionality
  const exportSVG = useCallback(() => {
    if (!svgRef.current) return;
    
    try {
      const svgElement = svgRef.current;
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'asr-tree-botanical.svg';
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Botanical tree exported as SVG');
    } catch (error) {
      toast.error('Export failed');
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
          
          <Button size="sm" onClick={exportSVG}>
            <Download className="h-4 w-4" />
            Export SVG
          </Button>
        </div>
      </div>

      {/* Timeline Scrubber */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Growth Timeline</label>
        <Slider
          value={[timelineStage]}
          onValueChange={onTimelineChange}
          max={8}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          {['Seed', 'Roots', 'Branches', 'Buds', 'Prune', 'Leaves', 'Bloom', 'Reflect', 'Fruit'].map((label, i) => (
            <span key={i} className={i === currentStage ? 'font-bold text-primary' : ''}>{label}</span>
          ))}
        </div>
      </div>
    </>
  );
};