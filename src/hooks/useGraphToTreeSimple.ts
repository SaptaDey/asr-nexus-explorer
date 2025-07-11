/**
 * useGraphToTreeSimple.ts - Simplified D3 hierarchy conversion
 * Basic version without complex animations to avoid errors
 */

import { useMemo, useState } from 'react';
import { stratify } from 'd3-hierarchy';
import { GraphData, GraphNode, GraphEdge } from '@/types/asrGotTypes';

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

export const useGraphToTreeSimple = (graphData: GraphData | null, currentStage: number) => {
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
      const nodesWithoutParent = stratifyNodes.filter(node => !node.parentId);
      if (nodesWithoutParent.length === 0) {
        // If no root found, make the first node the root
        if (stratifyNodes.length > 0) {
          stratifyNodes[0].parentId = null;
        }
      } else if (nodesWithoutParent.length > 1) {
        // If multiple roots, keep only the first one and make others children of it
        const mainRoot = nodesWithoutParent[0];
        for (let i = 1; i < nodesWithoutParent.length; i++) {
          nodesWithoutParent[i].parentId = mainRoot.id;
        }
      }

      // Create hierarchy using D3
      const stratifyFunc = stratify<any>()
        .id(d => d.id)
        .parentId(d => d.parentId);

      const root = stratifyFunc(stratifyNodes);
      
      // Simple layout - no d3-hierarchy tree layout to avoid complex dependencies
      root.each((d: any) => {
        const depth = d.depth;
        const angle = Math.random() * Math.PI * 2; // Simple random positioning
        const radius = depth * 2;
        
        d.botanicalPosition = [
          Math.sin(angle) * radius,
          depth * 3,
          Math.cos(angle) * radius
        ];
        d.botanicalType = determineBotanicalType(d.data, depth);
        d.botanicalScale = [1, 1, 1]; // Simple fixed scale
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

    return elements;
  }, [hierarchyData]);

  return {
    treeData: hierarchyData,
    botanicalElements,
    animations: null, // No animations to avoid complexity
    treeVersion
  };
};

// Helper functions
function findParentId(nodeId: string, edges: GraphEdge[]): string | null {
  const parentEdge = edges.find(edge => edge.target === nodeId);
  return parentEdge?.source || null;
}

function determineBotanicalType(nodeData: GraphNode, depth: number): BotanicalElement['type'] {
  if (depth === 0) return 'root';
  
  switch (nodeData.type) {
    case 'dimension': return 'rootlet';
    case 'hypothesis': return 'branch';
    case 'evidence': return 'bud';
    case 'synthesis': return 'leaf';
    case 'reflection': return 'blossom';
    default: return depth === 1 ? 'rootlet' : 'branch';
  }
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
