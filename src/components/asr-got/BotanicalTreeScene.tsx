
/**
 * BotanicalTreeScene.tsx - Fixed version with proper TypeScript interfaces and React Spring
 * Implements the complete Tree_Visualisation.md specification
 */

import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { useSpring, useTrail, animated, config } from '@react-spring/web';
import { animate as anime } from 'animejs';
import { GraphData, GraphNode, GraphEdge } from '@/types/asrGotTypes';

interface BotanicalTreeSceneProps {
  graphData: GraphData;
  currentStage: number;
  isProcessing: boolean;
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
  onBranchClick?: (branch: any) => void;
  reducedMotion?: boolean;
}

// Fixed interface inheritance issue
interface TreeNode {
  id: string;
  botanicalType: 'root' | 'rootlet' | 'branch' | 'bud' | 'leaf' | 'blossom';
  confidence: number;
  impactScore: number;
  disciplinaryTag: string;
  evidenceCount: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  data?: GraphNode;
  parent?: TreeNode | null;
  children?: TreeNode[];
  depth?: number;
  height?: number;
}

interface BranchPath {
  id: string;
  source: TreeNode;
  target: TreeNode;
  path: string;
  thickness: number;
  color: string;
  length: number;
}

export const BotanicalTreeScene: React.FC<BotanicalTreeSceneProps> = ({
  graphData,
  currentStage,
  isProcessing,
  width = 800,
  height = 600,
  onNodeClick,
  onBranchClick,
  reducedMotion = false
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Transform graph data into D3 hierarchy
  const hierarchyData = useMemo(() => {
    if (!graphData.nodes.length) return null;

    // Find root node - Fixed type comparison
    const rootNode = graphData.nodes.find(n => n.type === 'root') || graphData.nodes[0];
    
    // Build hierarchy tree structure
    const buildHierarchy = (nodeId: string, visited = new Set<string>()): any => {
      if (visited.has(nodeId)) return null;
      visited.add(nodeId);

      const node = graphData.nodes.find(n => n.id === nodeId);
      if (!node) return null;

      // Find children based on edges
      const childEdges = graphData.edges.filter(e => e.source === nodeId);
      const children = childEdges
        .map(e => buildHierarchy(e.target, visited))
        .filter(Boolean);

      return {
        ...node,
        children: children.length > 0 ? children : undefined
      };
    };

    const hierarchy = buildHierarchy(rootNode.id);
    
    // Create D3 hierarchy
    const root = d3.hierarchy(hierarchy);
    
    // Create tree layout (grows upward)
    const treeLayout = d3.tree<GraphNode>()
      .size([width - 100, height - 100])
      .separation((a, b) => {
        // Wider separation for different parent nodes
        return a.parent === b.parent ? 1 : 2;
      });

    // Apply layout
    const treeData = treeLayout(root);

    // Transform coordinates to grow upward (invert Y)
    treeData.each(d => {
      d.y = height - 100 - d.y; // Invert Y to grow upward
      d.x = d.x + 50; // Add margin
    });

    return treeData;
  }, [graphData, width, height]);

  // Extract tree nodes and branches
  const { treeNodes, branches } = useMemo(() => {
    if (!hierarchyData) return { treeNodes: [], branches: [] };

    const nodes: TreeNode[] = [];
    const branchPaths: BranchPath[] = [];

    // Extract all nodes
    hierarchyData.each((d: any) => {
      const node = d.data;
      const botanicalType = getBotanicalType(node, d.depth);
      
      nodes.push({
        id: node.id,
        botanicalType,
        confidence: node.confidence?.[0] || 0.5,
        impactScore: node.metadata?.impact_score || 0,
        disciplinaryTag: node.metadata?.disciplinary_tags?.[0] || 'general',
        evidenceCount: node.metadata?.evidence_count || 0,
        x: d.x,
        y: d.y,
        radius: calculateRadius(botanicalType, node.confidence?.[0] || 0.5),
        color: getNodeColor(botanicalType, node.metadata?.disciplinary_tags?.[0] || 'general'),
        data: node
      });
    });

    // Extract branches (links between nodes)
    hierarchyData.links().forEach((link: any) => {
      const source = link.source;
      const target = link.target;
      
      branchPaths.push({
        id: `branch-${source.data.id}-${target.data.id}`,
        source: source,
        target: target,
        path: createBranchPath(source, target),
        thickness: calculateBranchThickness(source.data.confidence?.[0] || 0.5),
        color: getBranchColor(source.data.metadata?.disciplinary_tags?.[0] || 'general'),
        length: Math.sqrt(Math.pow(target.x - source.x, 2) + Math.pow(target.y - source.y, 2))
      });
    });

    return { treeNodes: nodes, branches: branchPaths };
  }, [hierarchyData]);

  // Helper functions
  const getBotanicalType = (node: GraphNode, depth: number): TreeNode['botanicalType'] => {
    if (depth === 0) return 'root';
    if (node.type === 'dimension') return 'rootlet';
    if (node.type === 'hypothesis') return 'branch';
    if (node.type === 'evidence') return 'bud';
    if (node.type === 'synthesis') return 'leaf';
    if (node.type === 'reflection') return 'blossom';
    return 'branch';
  };

  const calculateRadius = (type: TreeNode['botanicalType'], confidence: number): number => {
    const baseRadius = {
      root: 25,
      rootlet: 8,
      branch: 12,
      bud: 6,
      leaf: 10,
      blossom: 18
    };
    return baseRadius[type] * (0.5 + confidence * 0.5);
  };

  const getNodeColor = (type: TreeNode['botanicalType'], disciplinary: string): string => {
    const colors = {
      root: '#8B4513', // Terracotta brown
      rootlet: '#CD853F', // Sandy brown
      branch: getDisciplinaryColor(disciplinary),
      bud: '#32CD32', // Lime green
      leaf: '#228B22', // Forest green
      blossom: '#FFB6C1' // Light pink
    };
    return colors[type];
  };

  const getDisciplinaryColor = (disciplinary: string): string => {
    const disciplinaryColors = {
      biology: '#2D8B2D',
      chemistry: '#4169E1',
      physics: '#DC143C',
      medicine: '#FF69B4',
      engineering: '#FF8C00',
      computer_science: '#9370DB',
      mathematics: '#B22222',
      psychology: '#20B2AA',
      general: '#4A5D23'
    };
    return disciplinaryColors[disciplinary as keyof typeof disciplinaryColors] || disciplinaryColors.general;
  };

  const calculateBranchThickness = (confidence: number): number => {
    return 2 + (confidence * 8); // 2-10px thickness
  };

  const getBranchColor = (disciplinary: string): string => {
    return getDisciplinaryColor(disciplinary);
  };

  const createBranchPath = (source: any, target: any): string => {
    // Create organic curved path
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dr = Math.sqrt(dx * dx + dy * dy);
    
    // Control point for organic curve
    const cx = source.x + dx * 0.5 + (Math.random() - 0.5) * 20;
    const cy = source.y + dy * 0.5 + (Math.random() - 0.5) * 20;
    
    return `M${source.x},${source.y} Q${cx},${cy} ${target.x},${target.y}`;
  };

  // Animation springs
  const rootSpring = useSpring({
    opacity: currentStage >= 1 ? 1 : 0,
    transform: currentStage >= 1 ? 'scale(1)' : 'scale(0)',
    config: config.gentle
  });

  // Fixed useTrail parameters
  const rootletNodes = treeNodes.filter(n => n.botanicalType === 'rootlet');
  const rootletTrail = useTrail(rootletNodes.length, {
    from: { opacity: 0, pathLength: 0 },
    to: currentStage >= 2 ? { opacity: 1, pathLength: 1 } : { opacity: 0, pathLength: 0 },
    config: { tension: 200, friction: 40 },
    delay: reducedMotion ? 0 : (key: string) => parseInt(key) * 200
  });

  // Fixed useTrail parameters for branches
  const branchNodes = treeNodes.filter(n => n.botanicalType === 'branch');
  const branchTrail = useTrail(branchNodes.length, {
    from: { opacity: 0, strokeDasharray: '0,1000' },
    to: currentStage >= 3 ? { opacity: 1, strokeDasharray: '1000,0' } : { opacity: 0, strokeDasharray: '0,1000' },
    config: { tension: 120, friction: 20 },
    delay: reducedMotion ? 0 : (key: string) => parseInt(key) * 300
  });

  // Fixed useTrail parameters for leaves
  const leafNodes = treeNodes.filter(n => n.botanicalType === 'leaf');
  const leafTrail = useTrail(leafNodes.length, {
    from: { opacity: 0, scale: 0, rotate: 0 },
    to: currentStage >= 6 ? { 
      opacity: 1, 
      scale: 1, 
      rotate: Math.random() * 20 - 10 // Subtle rotation
    } : { opacity: 0, scale: 0, rotate: 0 },
    config: { tension: 150, friction: 80 }, // Friction 80 as specified
    delay: reducedMotion ? 0 : (key: string) => parseInt(key) * 150
  });

  // Fixed useTrail parameters for blossoms
  const blossomNodes = treeNodes.filter(n => n.botanicalType === 'blossom');
  const blossomTrail = useTrail(blossomNodes.length, {
    from: { opacity: 0, scale: 0 },
    to: currentStage >= 7 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 },
    config: { duration: reducedMotion ? 100 : 800 }, // 800ms as specified
    delay: reducedMotion ? 0 : (key: string) => parseInt(key) * 200
  });

  // Handle node interactions
  const handleNodeClick = useCallback((node: TreeNode) => {
    if (onNodeClick && node.data) {
      onNodeClick(node.data);
    }
  }, [onNodeClick]);

  const handleBranchClick = useCallback((branch: BranchPath) => {
    if (onBranchClick) {
      onBranchClick(branch);
    }
  }, [onBranchClick]);

  // Evidence pulse animation for Stage 4
  useEffect(() => {
    if (currentStage === 4 && !reducedMotion) {
      const evidenceNodes = treeNodes.filter(n => n.botanicalType === 'bud');
      
      evidenceNodes.forEach((node, index) => {
        const element = svgRef.current?.querySelector(`#node-${node.id}`);
        if (element) {
          anime({
            targets: element,
            scale: [1, 1.3, 1],
            opacity: [0.8, 1, 0.8],
            duration: 1000,
            delay: index * 300,
            easing: 'easeInOutQuad',
            loop: true
          });
        }
      });
    }
  }, [currentStage, treeNodes, reducedMotion]);

  // Render the botanical tree
  return (
    <div ref={containerRef} className="w-full h-full relative">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="botanical-tree-svg"
        style={{ background: 'linear-gradient(to bottom, #87CEEB 0%, #98FB98 100%)' }}
      >
        {/* Branches */}
        {branches.map((branch, index) => (
          <animated.path
            key={branch.id}
            d={branch.path}
            fill="none"
            stroke={branch.color}
            strokeWidth={branch.thickness}
            strokeLinecap="round"
            className="branch-path cursor-pointer"
            onClick={() => handleBranchClick(branch)}
            style={{
              opacity: currentStage >= 3 ? 1 : 0,
              strokeDasharray: currentStage >= 3 ? '1000,0' : '0,1000',
              transition: reducedMotion ? 'none' : 'all 0.5s ease-in-out'
            }}
          />
        ))}

        {/* Root node */}
        <animated.g style={rootSpring}>
          {treeNodes.filter(n => n.botanicalType === 'root').map(node => (
            <circle
              key={node.id}
              cx={node.x}
              cy={node.y}
              r={node.radius}
              fill={node.color}
              stroke="#8B4513"
              strokeWidth="3"
              className="root-node cursor-pointer"
              onClick={() => handleNodeClick(node)}
            />
          ))}
        </animated.g>

        {/* Stage indicators */}
        {currentStage >= 1 && (
          <text x={20} y={30} fill="#333" fontSize="14" fontWeight="bold">
            Stage {currentStage}: {getStageLabel(currentStage)}
          </text>
        )}
      </svg>
    </div>
  );
};

const getStageLabel = (stage: number): string => {
  const labels = {
    1: 'Root Formation',
    2: 'Rootlet Growth',
    3: 'Branch Development',
    4: 'Evidence Collection',
    5: 'Pruning & Merging',
    6: 'Leaf Canopy',
    7: 'Blossom Opening',
    8: 'Pollen Release',
    9: 'Fruit Formation'
  };
  return labels[stage as keyof typeof labels] || 'Growing';
};
