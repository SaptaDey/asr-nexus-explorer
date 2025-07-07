/**
 * TreeScene.tsx - Botanical ASR-GoT Visualization
 * Living plant metaphor with D3 + react-spring + Anime.js
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { animated, useSpring, useChain, useSpringRef } from '@react-spring/web';
import { tree } from 'd3-hierarchy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Download, Play, Pause, RotateCcw, Palette } from 'lucide-react';
import { GraphData } from '@/types/asrGotTypes';
import { useTreeScene, useStageAnimation, usePerformanceMonitor } from '@/hooks/tree-hooks';
import { toast } from 'sonner';

interface TreeSceneProps {
  graphData: GraphData;
  currentStage: number;
  isProcessing: boolean;
  onStageSelect?: (stage: number) => void;
}

export const TreeScene: React.FC<TreeSceneProps> = ({
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

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Animation spring refs for chaining
  const rootSpringRef = useSpringRef();
  const branchSpringRef = useSpringRef();
  const leafSpringRef = useSpringRef();
  const blossomSpringRef = useSpringRef();

  // Root bulb animation (Stage 1)
  const rootSpring = useSpring({
    ref: rootSpringRef,
    from: { scale: 0, opacity: 0 },
    to: currentStage >= 1 ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 },
    config: { tension: 200, friction: 20 }
  });

  // Branch growth animation (Stage 3)
  const branchSpring = useSpring({
    ref: branchSpringRef,
    from: { pathLength: 0 },
    to: currentStage >= 3 ? { pathLength: 1 } : { pathLength: 0 },
    config: { duration: reducedMotion ? 100 : 1200 }
  });

  // Leaf cluster animation (Stage 6)
  const leafSpring = useSpring({
    ref: leafSpringRef,
    from: { scale: 0, jitter: 0 },
    to: currentStage >= 6 ? { scale: 1, jitter: 1 } : { scale: 0, jitter: 0 },
    config: { tension: 180, friction: 80 }
  });

  // Blossom opening animation (Stage 7)
  const blossomSpring = useSpring({
    ref: blossomSpringRef,
    from: { petals: 0 },
    to: currentStage >= 7 ? { petals: 1 } : { petals: 0 },
    config: { duration: reducedMotion ? 100 : 800 }
  });

  // Chain animations for staged progression
  useChain(
    currentStage >= 1 ? [rootSpringRef, branchSpringRef, leafSpringRef, blossomSpringRef] : [],
    [0, 0.5, 1.5, 2.0],
    reducedMotion ? 100 : 1000
  );

  // D3 tree layout
  const treeLayout = tree()
    .size([400, 300])
    .separation((a, b) => a.parent === b.parent ? 1 : 2);

  // Calculate tree positions
  const treeRoot = treeHierarchy ? treeLayout(treeHierarchy) : null;

  // CSS-based animation for branch drawing
  useEffect(() => {
    if (!reducedMotion && currentStage >= 3 && svgRef.current) {
      const branches = svgRef.current.querySelectorAll('.branch-path');
      branches.forEach((branch, i) => {
        (branch as SVGElement).style.animation = `branch-draw 1.5s ease-in-out ${i * 0.2}s forwards`;
      });
    }
  }, [currentStage, reducedMotion]);

  // Stage 4 evidence pulse effect
  useEffect(() => {
    if (currentStage === 4 && !reducedMotion) {
      const evidenceNodes = animatedNodes.filter(n => n.data.botanicalType === 'bud');
      
      evidenceNodes.forEach((node, i) => {
        setTimeout(() => {
          // CSS-based pulse animation
          const element = document.getElementById(`node-${(node.data as any).id}`);
          if (element) {
            element.style.animation = 'pulse-botanical 0.6s ease-in-out';
          }
          
          // Parent branch thickness increase
          const parentId = (node.parent?.data as any)?.id;
          if (parentId) {
            const branchElement = document.getElementById(`branch-${parentId}`);
            if (branchElement) {
              const currentWidth = branchElement.getAttribute('stroke-width') || '2';
              branchElement.setAttribute('stroke-width', String(parseInt(currentWidth) + 2));
            }
          }
        }, i * 300);
      });
    }
  }, [currentStage, animatedNodes, reducedMotion]);

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

  // Timeline scrubber handler
  const handleTimelineChange = useCallback((value: number[]) => {
    const stage = value[0];
    setTimelineStage(stage);
    onStageSelect?.(stage);
    measureFrameTime();
  }, [onStageSelect, measureFrameTime]);

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
  }, []);

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
          
          return (
            <animated.path
              key={`link-${i}`}
              id={`branch-${node.id}`}
              className="branch-path"
              d={d}
              stroke={colorBlindMode ? 'url(#branch-pattern)' : getNodeColor(node)}
              strokeWidth={Math.max(2, confidence * 8)}
              strokeDasharray="5,5"
              fill="none"
              opacity={node.metadata?.pruned ? 0.2 : 0.8}
              style={{
                strokeDashoffset: branchSpring.pathLength.to(v => `${(1 - v) * 100}%`)
              }}
            />
          );
        })}

        {/* Tree nodes */}
        {nodes.map((node, i) => (
          <g
            key={`node-${i}`}
            id={`node-${(node.data as any).id}`}
            transform={`translate(${node.x},${node.y})`}
            style={{ cursor: 'pointer' }}
            onClick={() => handleNodeClick((node.data as any).id)}
          >
            {renderBotanicalElement(node)}
          </g>
        ))}

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

  // Render botanical element based on type
  const renderBotanicalElement = (node: any) => {
    const nodeData = node.data as any;
    const { botanicalType, confidence, metadata } = nodeData;
    const avgConfidence = confidence?.reduce((a: number, b: number) => a + b, 0) / confidence?.length || 0;
    
    switch (botanicalType) {
      case 'root-bulb':
        return (
          <animated.circle
            r={15}
            fill="hsl(25, 70%, 55%)" // terracotta
            stroke="#8B4513"
            strokeWidth="2"
            style={{
              transform: rootSpring.scale.to(s => `scale(${s})`),
              opacity: rootSpring.opacity
            }}
          />
        );
        
      case 'branch':
        return (
          <animated.circle
            r={Math.max(4, avgConfidence * 8)}
            fill={getNodeColor(node.data)}
            stroke="#4A5D23"
            strokeWidth="1"
            style={{
              transform: branchSpring.pathLength.to(v => `scale(${v})`)
            }}
          />
        );
        
      case 'bud':
        return (
          <animated.ellipse
            rx="3"
            ry="6"
            fill="#90EE90"
            stroke="#228B22"
            strokeWidth="1"
            style={{
              transform: animations.evidencePulse.scale.to((s: any) => `scale(${s})`)
            }}
          />
        );
        
      case 'leaf':
        return (
          <animated.path
            d="M0,-8 Q-4,-4 0,0 Q4,-4 0,-8"
            fill="#32CD32"
            stroke="#228B22"
            strokeWidth="1"
            style={{
              transform: leafSpring.scale.to(s => `scale(${s})`),
              filter: leafSpring.jitter.to(j => j > 0 ? 'blur(0.3px)' : 'none')
            }}
          />
        );
        
      case 'blossom':
        const impactScore = metadata?.impact_score || 0;
        return impactScore > 0.7 ? (
          <animated.g
            style={{
              transform: blossomSpring.petals.to(p => `scale(${p})`)
            }}
          >
            {[0, 72, 144, 216, 288].map(angle => (
              <ellipse
                key={angle}
                rx="8"
                ry="3"
                fill="#FFB6C1"
                stroke="#FF69B4"
                strokeWidth="1"
                transform={`rotate(${angle})`}
              />
            ))}
            <circle r="3" fill="#FFD700" />
          </animated.g>
        ) : (
          <circle r="4" fill={getNodeColor(node.data)} />
        );
        
      default:
        return <circle r="4" fill={getNodeColor(node.data)} />;
    }
  };

  // Get node color based on confidence and tags
  const getNodeColor = (node: any) => {
    if (colorBlindMode) return 'hsl(var(--foreground))';
    
    const confidence = node.confidence?.reduce((a: number, b: number) => a + b, 0) / node.confidence?.length || 0;
    if (confidence >= 0.8) return 'hsl(160, 100%, 40%)';
    if (confidence >= 0.5) return 'hsl(45, 100%, 50%)';
    return 'hsl(0, 100%, 45%)';
  };

  return (
    <Card className="h-full bg-gradient-to-br from-emerald-50 via-green-50 to-blue-50 dark:from-emerald-950/20 dark:via-green-950/20 dark:to-blue-950/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            🌱 Tree of Reasoning - Live Growth
            <Badge variant="outline">Stage {currentStage + 1}</Badge>
            {isAnimating && <Badge variant="secondary" className="animate-pulse">Growing...</Badge>}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={colorBlindMode}
                onCheckedChange={setColorBlindMode}
                aria-label="Color-blind mode"
              />
              <Palette className="h-4 w-4" />
            </div>
            
            <Button size="sm" variant="outline" onClick={() => handleTimelineChange([0])}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            
            <Button size="sm" onClick={exportSVG}>
              <Download className="h-4 w-4" />
              Export SVG
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Timeline Scrubber */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Growth Timeline</label>
          <Slider
            value={[timelineStage]}
            onValueChange={handleTimelineChange}
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

        {/* Tree Visualization */}
        <div className="border rounded-lg bg-white/50 dark:bg-black/10 p-4 overflow-hidden relative">
          <svg
            ref={svgRef}
            viewBox="0 0 600 400"
            className="w-full h-[400px]"
            style={{ maxWidth: '100%', height: 'auto' }}
          >
            <defs>
              {/* Gradient patterns for color-blind mode */}
              <pattern id="branch-pattern" patternUnits="userSpaceOnUse" width="4" height="4">
                <rect width="4" height="4" fill="none" />
                <path d="M 0,4 l 4,-4 M -1,1 l 2,-2 M 3,5 l 2,-2" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
              
              {/* Background gradient */}
              <linearGradient id="soil-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--background))" />
                <stop offset="100%" stopColor="hsl(25, 30%, 80%)" />
              </linearGradient>
            </defs>
            
            {/* Soil base */}
            <rect x="0" y="350" width="600" height="50" fill="url(#soil-gradient)" />
            
            {/* Tree visualization */}
            {renderTree()}
          </svg>
          
          {/* Node metadata popover */}
          {selectedNode && (
            <Popover open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
              <PopoverTrigger asChild>
                <div className="absolute top-4 right-4 opacity-0" />
              </PopoverTrigger>
              <PopoverContent className="w-80 max-h-60 overflow-y-auto">
                <div className="space-y-2">
                  <h4 className="font-semibold">Node Metadata</h4>
                  {(() => {
                    const node = animatedNodes.find(n => n.data.id === selectedNode)?.data;
                    if (!node) return null;
                    
                    return (
                      <div className="text-xs space-y-1">
                        <div><strong>Label:</strong> {node.label}</div>
                        <div><strong>Type:</strong> {node.type}</div>
                        <div><strong>Confidence:</strong> {node.confidence.map(c => c.toFixed(2)).join(', ')}</div>
                        <div><strong>Stage:</strong> {node.stage}</div>
                        {node.metadata?.impact_score && (
                          <div><strong>Impact:</strong> {node.metadata.impact_score.toFixed(2)}</div>
                        )}
                        {node.metadata?.disciplinary_tags && (
                          <div><strong>Tags:</strong> {node.metadata.disciplinary_tags.join(', ')}</div>
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
            <div className="font-bold text-lg text-amber-600">{hierarchyData.filter(n => n.botanicalType === 'root-bulb').length || 0}</div>
            <div className="text-muted-foreground">Roots</div>
          </div>
          <div>
            <div className="font-bold text-lg text-green-600">{hierarchyData.filter(n => n.botanicalType === 'branch').length || 0}</div>
            <div className="text-muted-foreground">Branches</div>
          </div>
          <div>
            <div className="font-bold text-lg text-blue-600">{hierarchyData.filter(n => n.botanicalType === 'leaf').length || 0}</div>
            <div className="text-muted-foreground">Leaves</div>
          </div>
          <div>
            <div className="font-bold text-lg text-pink-600">{hierarchyData.filter(n => n.botanicalType === 'blossom').length || 0}</div>
            <div className="text-muted-foreground">Blossoms</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};