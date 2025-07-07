/**
 * Tree-of-Reasoning Animated Visualization for ASR-GoT
 * Hierarchical growth metaphor with stage-synchronized animations
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Download, Play, Pause, RotateCcw } from 'lucide-react';
import { GraphData, GraphNode } from '@/types/asrGotTypes';
import { toast } from 'sonner';
import { hierarchy, tree, stratify } from 'd3-hierarchy';
import { select } from 'd3-selection';
import 'd3-transition';

interface TreeOfReasoningProps {
  graphData: GraphData;
  currentStage: number;
  isProcessing: boolean;
}

interface TreeNode {
  id: string;
  parentId?: string;
  label: string;
  type: string;
  confidence: number[];
  stage: number;
  metadata: any;
}

export const TreeOfReasoningVisualization: React.FC<TreeOfReasoningProps> = ({
  graphData,
  currentStage,
  isProcessing
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [timelineStage, setTimelineStage] = useState(currentStage);
  const [isAnimating, setIsAnimating] = useState(false);
  const [treeSnapshot, setTreeSnapshot] = useState<string>('');

  // Convert graph data to hierarchical structure
  const convertToHierarchy = useCallback((): TreeNode[] => {
    const nodes: TreeNode[] = [];
    
    // Root (trunk)
    const rootNodes = graphData.nodes.filter(n => n.type === 'root');
    rootNodes.forEach(node => {
      nodes.push({
        id: node.id,
        label: node.label,
        type: 'trunk',
        confidence: node.confidence,
        stage: 1,
        metadata: node.metadata
      });
    });

    // Primary branches (dimensions)
    const dimensionNodes = graphData.nodes.filter(n => n.type === 'dimension');
    dimensionNodes.forEach(node => {
      const parentEdge = graphData.edges.find(e => e.target === node.id);
      nodes.push({
        id: node.id,
        parentId: parentEdge?.source || rootNodes[0]?.id,
        label: node.label,
        type: 'primary-branch',
        confidence: node.confidence,
        stage: 2,
        metadata: node.metadata
      });
    });

    // Secondary branches (hypotheses)
    const hypothesisNodes = graphData.nodes.filter(n => n.type === 'hypothesis');
    hypothesisNodes.forEach(node => {
      const parentEdge = graphData.edges.find(e => e.target === node.id);
      nodes.push({
        id: node.id,
        parentId: parentEdge?.source,
        label: node.label,
        type: 'secondary-branch',
        confidence: node.confidence,
        stage: 3,
        metadata: node.metadata
      });
    });

    // Evidence twigs
    const evidenceNodes = graphData.nodes.filter(n => n.type === 'evidence');
    evidenceNodes.forEach(node => {
      const parentEdge = graphData.edges.find(e => e.target === node.id);
      nodes.push({
        id: node.id,
        parentId: parentEdge?.source,
        label: node.label,
        type: 'twig',
        confidence: node.confidence,
        stage: 4,
        metadata: node.metadata
      });
    });

    return nodes;
  }, [graphData]);

  // Color mapping based on confidence
  const getConfidenceColor = (confidence: number[]): string => {
    const avg = confidence.reduce((a, b) => a + b, 0) / confidence.length;
    if (avg >= 0.8) return '#00857C'; // high - teal
    if (avg >= 0.5) return '#FFB200'; // mid - amber  
    return '#B60000'; // low - red
  };

  // Branch thickness based on confidence and impact
  const getBranchThickness = (node: TreeNode): number => {
    const avgConfidence = node.confidence.reduce((a, b) => a + b, 0) / node.confidence.length;
    const impactScore = node.metadata?.impact_score || 0.5;
    return Math.max(2, Math.min(avgConfidence, impactScore) * 12);
  };

  // Render tree using D3
  const renderTree = useCallback(() => {
    if (!svgRef.current) return;

    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    const hierarchyData = convertToHierarchy();
    if (hierarchyData.length === 0) return;

    // Create hierarchy
    const stratifyFn = stratify<TreeNode>()
      .id(d => d.id)
      .parentId(d => d.parentId);

    let root;
    try {
      root = stratifyFn(hierarchyData);
    } catch (error) {
      console.warn('Tree hierarchy error:', error);
      return;
    }

    // Tree layout
    const treeLayout = tree<TreeNode>()
      .size([300, 400])
      .separation((a, b) => a.parent === b.parent ? 1 : 2);

    treeLayout(root);

    const g = svg.append('g')
      .attr('transform', 'translate(200, 50)');

    // Links (branches)
    const links = g.selectAll('.link')
      .data(root.links())
      .enter()
      .append('line')
      .attr('class', 'link branch-link')
      .attr('x1', d => d.source.x!)
      .attr('y1', d => d.source.y!)
      .attr('x2', d => d.target.x!)
      .attr('y2', d => d.target.y!)
      .attr('stroke', d => getConfidenceColor(d.target.data.confidence))
      .attr('stroke-width', d => getBranchThickness(d.target.data))
      .attr('opacity', 0)
      .transition()
      .duration(1000)
      .delay((d, i) => d.target.data.stage * 200)
      .attr('opacity', 0.8);

    // Nodes
    const nodes = g.selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`);

    // Node circles
    nodes.append('circle')
      .attr('r', d => d.data.type === 'trunk' ? 8 : 5)
      .attr('fill', d => getConfidenceColor(d.data.confidence))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('opacity', 0)
      .transition()
      .duration(800)
      .delay((d, i) => d.data.stage * 200)
      .style('opacity', 1);

    // Flowers for high-confidence hypotheses
    nodes.filter(d => {
      const avgConf = d.data.confidence.reduce((a, b) => a + b, 0) / d.data.confidence.length;
      const impact = d.data.metadata?.impact_score || 0;
      return avgConf >= 0.8 && impact >= 0.7 && d.data.type === 'secondary-branch';
    })
    .append('circle')
    .attr('r', 0)
    .attr('fill', '#FFB200')
    .attr('opacity', 0.7)
    .transition()
    .duration(600)
    .delay(7 * 200) // Stage 7 bloom
    .attr('r', 12)
    .transition()
    .attr('r', 8);

    // Labels
    nodes.append('text')
      .attr('dy', -10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#333')
      .text(d => d.data.label.substring(0, 15))
      .style('opacity', 0)
      .transition()
      .duration(500)
      .delay((d, i) => d.data.stage * 200 + 300)
      .style('opacity', 1);

  }, [convertToHierarchy, currentStage]);

  // Stage animations
  useEffect(() => {
    if (currentStage >= 8) {
      // Final pulse and export
      const svg = select(svgRef.current);
      svg.transition()
        .duration(1000)
        .style('transform', 'scale(1.05)')
        .transition()
        .style('transform', 'scale(1)');
      
      setTimeout(() => {
        exportTree();
      }, 1000);
    }
    
    renderTree();
  }, [currentStage, graphData, renderTree]);

  const exportTree = async () => {
    if (!svgRef.current) return;
    
    try {
      const svgElement = svgRef.current;
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      
      // Download SVG
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'asr_tree.svg';
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Tree visualization exported as SVG');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const seekToStage = (stage: number) => {
    setTimelineStage(stage);
    // Re-render tree up to that stage
    renderTree();
  };

  return (
    <Card className="h-full bg-gradient-to-b from-emerald-50 to-indigo-50 dark:from-emerald-950/20 dark:to-indigo-950/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            🌳 Tree of Reasoning
            <Badge variant="outline">Stage {currentStage + 1}</Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => seekToStage(0)}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button size="sm" onClick={exportTree}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Timeline Slider */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Timeline Scrubber</label>
          <Slider
            value={[timelineStage]}
            onValueChange={([value]) => seekToStage(value)}
            max={8}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Init</span>
            <span>Decomp</span>
            <span>Hypoth</span>
            <span>Evidence</span>
            <span>Prune</span>
            <span>Extract</span>
            <span>Compose</span>
            <span>Reflect</span>
            <span>Final</span>
          </div>
        </div>

        {/* Tree Visualization */}
        <div className="border rounded-lg bg-white/50 dark:bg-black/20 p-4 overflow-hidden">
          <svg
            ref={svgRef}
            id="asr-tree"
            viewBox="-50 -50 500 500"
            className="w-full h-[400px]"
            style={{ maxWidth: '100%', height: 'auto' }}
          >
            {/* Background pattern */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="0.5" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Growth Statistics */}
        <div className="grid grid-cols-4 gap-4 text-center text-sm">
          <div>
            <div className="font-bold text-lg text-emerald-600">{graphData.nodes.filter(n => n.type === 'root').length}</div>
            <div className="text-muted-foreground">Trunk</div>
          </div>
          <div>
            <div className="font-bold text-lg text-blue-600">{graphData.nodes.filter(n => n.type === 'dimension').length}</div>
            <div className="text-muted-foreground">Branches</div>
          </div>
          <div>
            <div className="font-bold text-lg text-purple-600">{graphData.nodes.filter(n => n.type === 'hypothesis').length}</div>
            <div className="text-muted-foreground">Hypotheses</div>
          </div>
          <div>
            <div className="font-bold text-lg text-amber-600">{graphData.nodes.filter(n => n.type === 'evidence').length}</div>
            <div className="text-muted-foreground">Evidence</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};