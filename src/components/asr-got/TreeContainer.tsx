/**
 * TreeContainer.tsx - Main container for botanical tree visualization
 * Orchestrates tree rendering, animations, and user interactions
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { animated } from '@react-spring/web';
import { tree } from 'd3-hierarchy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { GraphData } from '@/types/asrGotTypes';
import { useTreeScene, useStageAnimation, usePerformanceMonitor } from '@/hooks/tree-hooks';
import { useTreeAnimations, usePollenParticles } from './TreeAnimations';
import { BotanicalElement, getNodeColor } from './BotanicalElements';
import { TreeControls } from './TreeControls';
import { AlgorithmicAnimationTimeline } from './AlgorithmicAnimationTimeline';

interface TreeContainerProps {
  graphData: GraphData;
  currentStage: number;
  isProcessing: boolean;
  onStageSelect?: (stage: number) => void;
}

export const TreeContainer: React.FC<TreeContainerProps> = ({
  graphData,
  currentStage,
  isProcessing,
  onStageSelect
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [timelineStage, setTimelineStage] = useState(currentStage);
  const [isAnimating, setIsAnimating] = useState(false);
  const [colorBlindMode, setColorBlindMode] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [pollenParticles, setPollenParticles] = useState<any[]>([]);

  // Data transformation hooks
  const { hierarchyData, treeHierarchy, animatedNodes } = useTreeScene(graphData, currentStage);
  const animations = useStageAnimation(currentStage, animatedNodes);
  const { measureFrameTime } = usePerformanceMonitor();

  // Animation hooks
  const treeAnimations = useTreeAnimations({
    currentStage,
    reducedMotion,
    animatedNodes,
    svgRef
  });

  // Algorithmic animation timeline
  const algorithmicTimeline = AlgorithmicAnimationTimeline({
    currentStage,
    graphData,
    svgRef,
    reducedMotion,
    onAnimationComplete: (stage) => {
      console.log(`Stage ${stage} animation completed`);
    }
  });

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Stage 8 pollen particle system
  useEffect(() => {
    if (currentStage >= 8) {
      const blossoms = animatedNodes.filter(n => n.data.botanicalType === 'blossom');
      const particles: any[] = [];
      
      blossoms.forEach(blossom => {
        for (let i = 0; i < 5; i++) {
          particles.push({
            id: `${blossom.data.id}-particle-${i}`,
            x: blossom.x || 0,
            y: blossom.y || 0,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            color: blossom.data.metadata?.bias_flags?.length > 0 ? '#dc2626' : '#fbbf24'
          });
        }
      });
      
      setPollenParticles(particles);
      
      // Animate particles with CSS
      if (!reducedMotion) {
        particles.forEach((particle, i) => {
          setTimeout(() => {
            const element = document.getElementById(`particle-${particle.id}`);
            if (element) {
              element.style.animation = 'particle-float 2s ease-out forwards';
              element.style.setProperty('--float-x', `${particle.vx * 50}px`);
              element.style.setProperty('--float-y', `${particle.vy * 50}px`);
            }
          }, i * 100);
        });
      }
    }
  }, [currentStage, animatedNodes, reducedMotion]);

  // D3 tree layout
  const treeLayout = tree()
    .size([400, 300])
    .separation((a, b) => a.parent === b.parent ? 1 : 2);

  // Calculate tree positions
  const treeRoot = treeHierarchy ? treeLayout(treeHierarchy) : null;

  // Timeline scrubber handler with performance monitoring
  const handleTimelineChange = useCallback((value: number[]) => {
    const stage = value[0];
    const startTime = performance.now();
    
    setTimelineStage(stage);
    onStageSelect?.(stage);
    
    // Monitor frame time for animation performance
    requestAnimationFrame(() => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 16) {
        console.warn(`Stage transition took ${duration.toFixed(2)}ms (target: 16ms)`);
      }
      
      measureFrameTime();
    });
  }, [onStageSelect, measureFrameTime]);

  // Node click handler
  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNode(nodeId);
    onStageSelect?.(animatedNodes.find(n => n.data.id === nodeId)?.data.stage || 1);
  }, [animatedNodes, onStageSelect]);

  // Render tree nodes and branches
  const renderTree = () => {
    if (!treeRoot && hierarchyData.length === 0) {
      // Show placeholder tree structure when no data
      return (
        <g transform="translate(200, 50)">
          <text x="100" y="150" textAnchor="middle" className="fill-muted-foreground text-sm">
            🌱 Start your research analysis to grow the tree
          </text>
          <circle cx="100" cy="200" r="20" fill="hsl(var(--muted))" opacity="0.5" />
          <text x="100" y="205" textAnchor="middle" className="fill-muted-foreground text-xs">
            Root
          </text>
        </g>
      );
    }

    if (!treeRoot) return null;

    const nodes = treeRoot.descendants();
    const links = treeRoot.links();

    return (
      <g transform="translate(200, 50)">
        {/* Branch links */}
        {links.map((link, i) => {
          const d = `M${link.source.x},${link.source.y}L${link.target.x},${link.target.y}`;
          const node = link.target.data as any;
          const confidence = node.confidence?.reduce((a: number, b: number) => a + b, 0) / node.confidence?.length || 0;
          
          // Calculate branch circumference with evidence deltas
          const evidenceCount = node.metadata?.evidence_count || 0;
          const confidenceDelta = node.metadata?.confidence_delta || 0;
          const baseWidth = Math.max(2, confidence * 8);
          const deltaWidth = evidenceCount * 1.5 + confidenceDelta * 10;
          const totalWidth = baseWidth + deltaWidth;
          
          return (
            <animated.g key={`branch-group-${i}`}>
              {/* Main branch path */}
              <animated.path
                id={`branch-${node.id}`}
                className="branch-path"
                d={d}
                stroke={colorBlindMode ? 'url(#branch-pattern)' : getNodeColor(node, colorBlindMode)}
                strokeWidth={totalWidth}
                strokeDasharray="5,5"
                fill="none"
                opacity={node.metadata?.pruned ? 0.2 : 0.8}
                style={{
                  strokeDashoffset: treeAnimations.branchSpring.pathLength.to((v: number) => `${(1 - v) * 100}%`)
                }}
              />
              
              {/* Evidence expansion rings */}
              {evidenceCount > 0 && (
                <animated.path
                  d={d}
                  stroke={colorBlindMode ? 'url(#branch-pattern)' : getNodeColor(node, colorBlindMode)}
                  strokeWidth={baseWidth + 2}
                  fill="none"
                  opacity="0.3"
                  style={{
                    strokeDashoffset: treeAnimations.branchSpring.pathLength.to((v: number) => `${(1 - v) * 100}%`)
                  }}
                />
              )}
              
              {/* Confidence delta indicator */}
              {confidenceDelta > 0.1 && (
                <animated.text
                  x={link.target.x + 5}
                  y={link.target.y - 5}
                  fontSize="8"
                  fill={getNodeColor(node, colorBlindMode)}
                  style={{
                    opacity: treeAnimations.branchSpring.pathLength.to((v: number) => v * 0.8)
                  }}
                >
                  +{(confidenceDelta * 100).toFixed(0)}%
                </animated.text>
              )}
            </animated.g>
          );
        })}

        {/* Tree nodes */}
        {nodes.map((node, i) => {
          const nodeData = node.data as any;
          const botanicalType = nodeData.botanicalType || 'unknown';
          const confidence = nodeData.confidence || [0];
          const avgConfidence = confidence.reduce((a: number, b: number) => a + b, 0) / confidence.length;
          
          return (
            <g
              key={`node-${i}`}
              id={`node-${nodeData.id}`}
              transform={`translate(${node.x},${node.y})`}
              style={{ cursor: 'pointer' }}
              onClick={() => handleNodeClick(nodeData.id)}
              role="button"
              tabIndex={0}
              aria-label={`${botanicalType} node: ${nodeData.label}, confidence: ${(avgConfidence * 100).toFixed(1)}%`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleNodeClick(nodeData.id);
                }
              }}
            >
              <BotanicalElement
                node={node}
                animations={treeAnimations}
                evidenceAnimations={animations}
                colorBlindMode={colorBlindMode}
              />
            </g>
          );
        })}

        {/* Pollen particles */}
        {pollenParticles.map(particle => (
          <circle
            key={particle.id}
            id={`particle-${particle.id}`}
            cx={particle.x}
            cy={particle.y}
            r="2"
            fill={particle.color}
            opacity="0.8"
          />
        ))}
      </g>
    );
  };

  return (
    <Card className="h-full bg-gradient-to-br from-white/80 via-emerald-50/30 to-cyan-50/30 dark:from-emerald-950/20 dark:via-green-950/20 dark:to-cyan-950/20 card-gradient">
      <CardHeader>
        <CardTitle>
          <TreeControls
            timelineStage={timelineStage}
            currentStage={currentStage}
            isAnimating={isAnimating}
            colorBlindMode={colorBlindMode}
            setColorBlindMode={setColorBlindMode}
            onTimelineChange={handleTimelineChange}
            svgRef={svgRef}
          />
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Tree Visualization */}
        <div className="border rounded-lg bg-white/50 dark:bg-black/10 p-4 overflow-hidden relative brand-border">
          <svg
            ref={svgRef}
            viewBox="0 0 600 400"
            className="w-full h-[400px]"
            style={{ maxWidth: '100%', height: 'auto' }}
            role="img"
            aria-labelledby="tree-title"
            aria-describedby="tree-desc"
          >
            <title id="tree-title">ASR-GoT Botanical Tree Visualization</title>
            <desc id="tree-desc">
              Interactive botanical tree representing the ASR-GoT research framework. 
              Each element represents a stage in the research process: root bulb (initialization), 
              rootlets (decomposition), branches (hypotheses), buds (evidence), leaves (subgraphs), 
              and blossoms (synthesis). Use arrow keys to navigate between elements.
            </desc>
            <defs>
              {/* Brand gradient */}
              <linearGradient id="brand-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--brand-start))" />
                <stop offset="100%" stopColor="hsl(var(--brand-end))" />
              </linearGradient>
              
              {/* Gradient patterns for color-blind mode */}
              <pattern id="branch-pattern" patternUnits="userSpaceOnUse" width="4" height="4">
                <rect width="4" height="4" fill="none" />
                <path d="M 0,4 l 4,-4 M -1,1 l 2,-2 M 3,5 l 2,-2" stroke="hsl(var(--branch-fill))" strokeWidth="0.5" />
              </pattern>
              
              {/* Background gradient */}
              <linearGradient id="soil-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--background))" />
                <stop offset="100%" stopColor="hsl(var(--branch-fill) / 0.2)" />
              </linearGradient>
            </defs>
            
            {/* Soil base */}
            <rect x="0" y="350" width="600" height="50" fill="url(#soil-gradient)" />
            
            {/* Tree visualization */}
            {renderTree()}
          </svg>
          
          {/* Enhanced Node metadata popover */}
          {selectedNode && (
            <Popover open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
              <PopoverTrigger asChild>
                <div className="absolute top-4 right-4 opacity-0" />
              </PopoverTrigger>
              <PopoverContent className="w-96 max-h-80 overflow-y-auto">
                <div className="space-y-3">
                  <h4 className="font-semibold text-base">Node Metadata</h4>
                  {(() => {
                    const node = animatedNodes.find(n => n.data.id === selectedNode)?.data;
                    if (!node) return null;
                    
                    return (
                      <div className="text-xs space-y-2">
                        {/* Basic Information */}
                        <div className="border-b pb-2">
                          <div><strong>Label:</strong> {node.label}</div>
                          <div><strong>Type:</strong> {node.type}</div>
                          <div><strong>Botanical:</strong> {node.botanicalType}</div>
                          <div><strong>Stage:</strong> {node.stage}</div>
                        </div>
                        
                        {/* Confidence Vector */}
                        <div className="border-b pb-2">
                          <div><strong>Confidence Vector:</strong></div>
                          <div className="ml-2 grid grid-cols-2 gap-1">
                            <div>Empirical: {node.confidence[0]?.toFixed(2) || 'N/A'}</div>
                            <div>Theoretical: {node.confidence[1]?.toFixed(2) || 'N/A'}</div>
                            <div>Methodological: {node.confidence[2]?.toFixed(2) || 'N/A'}</div>
                            <div>Consensus: {node.confidence[3]?.toFixed(2) || 'N/A'}</div>
                          </div>
                        </div>
                        
                        {/* Impact & Quality Metrics */}
                        {node.metadata?.impact_score && (
                          <div className="border-b pb-2">
                            <div><strong>Impact Score:</strong> {node.metadata.impact_score.toFixed(2)}</div>
                            {node.metadata?.statistical_power && (
                              <div><strong>Statistical Power:</strong> {node.metadata.statistical_power.toFixed(2)}</div>
                            )}
                            {node.metadata?.evidence_count && (
                              <div><strong>Evidence Count:</strong> {node.metadata.evidence_count}</div>
                            )}
                            {node.metadata?.confidence_delta && (
                              <div><strong>Confidence Δ:</strong> +{(node.metadata.confidence_delta * 100).toFixed(1)}%</div>
                            )}
                          </div>
                        )}
                        
                        {/* Disciplinary Tags */}
                        {node.metadata?.disciplinary_tags && (
                          <div className="border-b pb-2">
                            <div><strong>Disciplinary Tags:</strong></div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {node.metadata.disciplinary_tags.map((tag: string) => (
                                <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Bias & Quality Issues */}
                        {(node.metadata?.bias_flags?.length > 0 || node.metadata?.quality_issues?.length > 0) && (
                          <div className="border-b pb-2">
                            <div><strong>Quality Issues:</strong></div>
                            {node.metadata?.bias_flags?.length > 0 && (
                              <div className="ml-2">
                                <div className="text-red-600 font-medium">Bias Flags:</div>
                                {node.metadata.bias_flags.map((flag: string) => (
                                  <div key={flag} className="ml-2 text-red-600">• {flag}</div>
                                ))}
                              </div>
                            )}
                            {node.metadata?.quality_issues?.length > 0 && (
                              <div className="ml-2">
                                <div className="text-orange-600 font-medium">Quality Issues:</div>
                                {node.metadata.quality_issues.map((issue: string) => (
                                  <div key={issue} className="ml-2 text-orange-600">• {issue}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Source Attribution */}
                        {node.metadata?.attribution && (
                          <div className="border-b pb-2">
                            <div><strong>Source:</strong> {node.metadata.attribution}</div>
                            {node.metadata?.url && (
                              <div><strong>URL:</strong> <a href={node.metadata.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Source</a></div>
                            )}
                            {node.metadata?.doi && (
                              <div><strong>DOI:</strong> {node.metadata.doi}</div>
                            )}
                          </div>
                        )}
                        
                        {/* Timestamp */}
                        {node.metadata?.timestamp && (
                          <div className="text-gray-500">
                            <strong>Updated:</strong> {new Date(node.metadata.timestamp).toLocaleString()}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Growth Statistics */}
        <div className="grid grid-cols-4 gap-4 text-center text-sm">
          <div>
            <div className="font-bold text-lg" style={{ color: 'hsl(var(--branch-fill))' }}>{hierarchyData.filter(n => n.botanicalType === 'root-bulb').length || 0}</div>
            <div className="text-muted-foreground">Roots</div>
          </div>
          <div>
            <div className="font-bold text-lg" style={{ color: 'hsl(var(--branch-fill))' }}>{hierarchyData.filter(n => n.botanicalType === 'branch').length || 0}</div>
            <div className="text-muted-foreground">Branches</div>
          </div>
          <div>
            <div className="font-bold text-lg" style={{ color: 'hsl(var(--brand-end))' }}>{hierarchyData.filter(n => n.botanicalType === 'leaf').length || 0}</div>
            <div className="text-muted-foreground">Leaves</div>
          </div>
          <div>
            <div className="font-bold text-lg" style={{ color: 'hsl(var(--brand-start))' }}>{hierarchyData.filter(n => n.botanicalType === 'blossom').length || 0}</div>
            <div className="text-muted-foreground">Blossoms</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};