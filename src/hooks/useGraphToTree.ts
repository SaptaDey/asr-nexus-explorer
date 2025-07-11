/**
 * useGraphToTree.ts - D3 hierarchy → spring-bound R3F graph conversion
 * Transforms ASR-GoT graph data into 3D botanical tree structure
 */

import { useMemo, useEffect, useState } from 'react';
import { hierarchy, stratify } from 'd3-hierarchy';
import { GraphData, GraphNode, GraphEdge } from '@/types/asrGotTypes';
import * as THREE from 'three';

export interface BotanicalElement {
  id: string;
  type: 'root' | 'rootlet' | 'branch' | 'bud' | 'leaf' | 'blossom';
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
  confidence: number;
  impactScore: number;
  disciplinaryTag: string;
  evidenceCount: number;
  metadata: any;
}

export interface TreeAnimations {
  rootBulb: any;
  rootlets: any[];
  branches: any[];
  buds: any[];
  leaves: any[];
  blossoms: any[];
}

export interface TreeData {
  hierarchy: any;
  botanicalElements: BotanicalElement[];
  auditResults?: any;
}

export const useGraphToTree = (graphData: GraphData | null | undefined, currentStage: number) => {
  const [treeVersion, setTreeVersion] = useState(0);

  // Transform graph data into D3 hierarchy
  const hierarchyData = useMemo(() => {
    if (!graphData?.nodes?.length) return null;

    try {
      // Prepare nodes for stratify
      const stratifyNodes = graphData.nodes.map(node => ({
        id: node.id,
        parentId: findParentId(node.id, graphData.edges || []),
        ...node
      }));

      // Ensure we have exactly one root node
      const nodesWithoutParent = stratifyNodes.filter(n => !n.parentId);
      if (nodesWithoutParent.length === 0) {
        // Create a synthetic root if none exists
        stratifyNodes.unshift({
          id: 'synthetic-root',
          parentId: null,
          type: 'root',
          label: 'Research Root',
          confidence: [1, 1, 1, 1],
          metadata: { stage: 1, botanicalType: 'root' }
        });
        // Make the first original node a child of the synthetic root
        if (stratifyNodes.length > 1) {
          stratifyNodes[1].parentId = 'synthetic-root';
        }
      } else if (nodesWithoutParent.length > 1) {
        // If multiple roots exist, create a synthetic parent and make others its children
        const syntheticRoot = {
          id: 'synthetic-root',
          parentId: null,
          type: 'root',
          label: 'Research Root',
          confidence: [1, 1, 1, 1],
          metadata: { stage: 1, botanicalType: 'root' }
        };
        
        // Make all orphaned nodes children of the synthetic root
        nodesWithoutParent.forEach(node => {
          node.parentId = 'synthetic-root';
        });
        
        stratifyNodes.unshift(syntheticRoot);
      }

      // Create hierarchy using D3
      const stratifyFunc = stratify<any>()
        .id(d => d.id)
        .parentId(d => d.parentId);

      const root = stratifyFunc(stratifyNodes);
      
      // Calculate tree layout positions
      const tree = require('d3-hierarchy').tree()
        .size([20, 15]) // Spread out for 3D space
        .separation((a: any, b: any) => a.parent === b.parent ? 2 : 3);

      tree(root);

      // Transform to 3D coordinates
      root.each((d: any) => {
        // Convert 2D layout to 3D botanical positions
        d.botanicalPosition = calculateBotanicalPosition(d, root);
        d.botanicalType = determineBotanicalType(d.data, d.depth);
        d.botanicalScale = calculateBotanicalScale(d.data, currentStage);
      });

      return root;
    } catch (error) {
      console.warn('Hierarchy creation failed:', error);
      return null;
    }
  }, [graphData, currentStage]);

  // Extract botanical elements from hierarchy
  const botanicalElements = useMemo(() => {
    if (!hierarchyData) return [];

    const elements: BotanicalElement[] = [];

    // Add elements from actual graph data
    hierarchyData.each((node: any) => {
      const data = node.data;
      const position = node.botanicalPosition || [0, 0, 0];
      
      elements.push({
        id: data.id,
        type: node.botanicalType,
        position,
        scale: node.botanicalScale || [1, 1, 1],
        color: getBotanicalColor(node.botanicalType, data.metadata?.disciplinary_tags?.[0]),
        confidence: data.confidence?.[0] || 0.5,
        impactScore: data.metadata?.impact_score || 0,
        disciplinaryTag: data.metadata?.disciplinary_tags?.[0] || 'general',
        evidenceCount: data.metadata?.evidence_count || 0,
        metadata: data.metadata || {}
      });
    });

    // Add demo elements based on current stage to show growth
    if (currentStage >= 2 && elements.filter(e => e.type === 'rootlet').length === 0) {
      // Add demo rootlets
      for (let i = 0; i < 3; i++) {
        elements.push({
          id: `demo-rootlet-${i}`,
          type: 'rootlet',
          position: [Math.sin(i * 2) * 2, -1, Math.cos(i * 2) * 2],
          scale: [1, 1, 1],
          color: getBotanicalColor('rootlet'),
          confidence: 0.7,
          impactScore: 0.3,
          disciplinaryTag: 'demo',
          evidenceCount: 1,
          metadata: { demo: true }
        });
      }
    }

    if (currentStage >= 3 && elements.filter(e => e.type === 'branch').length === 0) {
      // Add demo branches
      for (let i = 0; i < 2; i++) {
        elements.push({
          id: `demo-branch-${i}`,
          type: 'branch',
          position: [Math.sin(i * 3) * 3, 2 + i, Math.cos(i * 3) * 3],
          scale: [1, 1, 1],
          color: getBotanicalColor('branch'),
          confidence: 0.8,
          impactScore: 0.5,
          disciplinaryTag: 'demo',
          evidenceCount: 2,
          metadata: { demo: true }
        });
      }
    }

    if (currentStage >= 4 && elements.filter(e => e.type === 'bud').length === 0) {
      // Add demo buds
      for (let i = 0; i < 4; i++) {
        elements.push({
          id: `demo-bud-${i}`,
          type: 'bud',
          position: [Math.sin(i * 1.5) * 4, 3 + i * 0.5, Math.cos(i * 1.5) * 4],
          scale: [0.8, 0.8, 0.8],
          color: getBotanicalColor('bud'),
          confidence: 0.6,
          impactScore: 0.4,
          disciplinaryTag: 'demo',
          evidenceCount: 3,
          metadata: { demo: true }
        });
      }
    }

    if (currentStage >= 6 && elements.filter(e => e.type === 'leaf').length === 0) {
      // Add demo leaves
      for (let i = 0; i < 6; i++) {
        elements.push({
          id: `demo-leaf-${i}`,
          type: 'leaf',
          position: [Math.sin(i) * 5, 4 + i * 0.3, Math.cos(i) * 5],
          scale: [1.2, 1.2, 1.2],
          color: getBotanicalColor('leaf'),
          confidence: 0.9,
          impactScore: 0.7,
          disciplinaryTag: 'demo',
          evidenceCount: 4,
          metadata: { demo: true }
        });
      }
    }

    if (currentStage >= 7 && elements.filter(e => e.type === 'blossom').length === 0) {
      // Add demo blossoms
      for (let i = 0; i < 3; i++) {
        elements.push({
          id: `demo-blossom-${i}`,
          type: 'blossom',
          position: [Math.sin(i * 2.1) * 6, 6 + i * 0.5, Math.cos(i * 2.1) * 6],
          scale: [1.5, 1.5, 1.5],
          color: getBotanicalColor('blossom'),
          confidence: 0.95,
          impactScore: 0.9,
          disciplinaryTag: 'demo',
          evidenceCount: 5,
          metadata: { demo: true }
        });
      }
    }

    return elements;
  }, [hierarchyData, currentStage]);

  // Create stage-based animations
  const animations = {
    stageProgress: currentStage / 9
  };

  // Simple animation configuration (no hooks)
  const stageAnimations = useMemo(() => {
    const safeElements = botanicalElements || [];
    
    return {
      rootBulb: {
        scale: currentStage >= 1 ? [1, 1, 1] : [0, 0, 0],
        opacity: currentStage >= 1 ? 1 : 0
      },
      
      buds: safeElements
        .filter(e => e.type === 'bud')
        .map((_, index) => ({
          scale: currentStage >= 4 ? [1, 1, 1] : [0, 0, 0],
          pulse: currentStage === 4 ? 1 : 0,
          delay: index * 100
        })),
      
      leaves: safeElements
        .filter(e => e.type === 'leaf')
        .map((element, index) => ({
          scale: currentStage >= 6 ? [element.impactScore, element.impactScore, element.impactScore] : [0, 0, 0],
          opacity: currentStage >= 6 ? 1 : 0,
          delay: index * 100
        })),
      
      blossoms: safeElements
        .filter(e => e.type === 'blossom')
        .map((_, index) => ({
          scale: currentStage >= 7 ? [1, 1, 1] : [0, 0, 0],
          petalSpread: currentStage >= 7 ? 1 : 0,
          delay: index * 200
        }))
    };
  }, [botanicalElements, currentStage]);

  // Update tree version when stage changes significantly
  useEffect(() => {
    setTreeVersion(prev => prev + 1);
  }, [currentStage]);

  return {
    treeData: hierarchyData,
    botanicalElements,
    animations: stageAnimations,
    treeVersion
  };
};

// Helper functions
function findParentId(nodeId: string, edges: GraphEdge[]): string | null {
  if (!edges || edges.length === 0) return null;
  const parentEdge = edges.find(edge => edge.target === nodeId);
  return parentEdge?.source || null;
}

function determineBotanicalType(nodeData: GraphNode, depth: number): BotanicalElement['type'] {
  if (depth === 0) return 'root';
  
  // Map ASR-GoT types to botanical elements
  switch (nodeData.type) {
    case 'dimension': return 'rootlet';
    case 'hypothesis': return 'branch';
    case 'evidence': return 'bud';
    case 'synthesis': return 'leaf';
    case 'reflection': return 'blossom';
    case 'knowledge': return 'rootlet';
    case 'bridge': return 'branch';
    case 'gap': return 'bud';
    case 'temporal': return 'leaf';
    case 'causal': return 'branch';
    default: {
      // Use depth and stage to determine type
      if (depth === 1) return 'rootlet';
      if (depth === 2) return 'branch';
      if (depth === 3) return 'bud';
      if (depth === 4) return 'leaf';
      return 'blossom';
    }
  }
}

function calculateBotanicalPosition(node: any, root: any): [number, number, number] {
  const baseX = node.x || 0;
  const baseY = node.y || 0;
  const depth = node.depth;
  
  // Create organic tree spread
  const angle = (baseX / 10) * Math.PI * 2;
  const radius = depth * 2;
  const height = depth * 3;
  
  return [
    Math.sin(angle) * radius,
    height,
    Math.cos(angle) * radius
  ];
}

function calculateBotanicalScale(nodeData: GraphNode, currentStage: number): [number, number, number] {
  const confidence = nodeData.confidence?.[0] || 0.5;
  const impactScore = nodeData.metadata?.impact_score || 0.5;
  
  const baseScale = 0.5 + confidence * 0.5;
  const impactMultiplier = 0.7 + impactScore * 0.6;
  
  return [baseScale * impactMultiplier, baseScale * impactMultiplier, baseScale * impactMultiplier];
}

function getBotanicalColor(type: BotanicalElement['type'], disciplinary?: string): string {
  const baseColors = {
    root: '#8B4513',      // Terracotta
    rootlet: '#CD853F',   // Sandy brown
    branch: '#4A5D23',    // Bark brown
    bud: '#32CD32',       // Lime green
    leaf: '#228B22',      // Forest green
    blossom: '#FFB6C1'    // Light pink
  };

  if (type === 'branch' && disciplinary) {
    // Disciplinary color mapping for branches
    const disciplinaryColors: Record<string, string> = {
      biology: '#2D8B2D',
      chemistry: '#4169E1',
      physics: '#DC143C',
      medicine: '#FF69B4',
      engineering: '#FF8C00',
      computer_science: '#9370DB',
      mathematics: '#B22222',
      psychology: '#20B2AA',
    };
    return disciplinaryColors[disciplinary] || baseColors.branch;
  }

  return baseColors[type];
}

// easeInOutBack easing function for rootlets
function easeInOutBack(t: number): number {
  const c1 = 1.70158;
  const c2 = c1 * 1.525;
  return t < 0.5
    ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
    : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
}