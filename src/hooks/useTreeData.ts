/**
 * useTreeData.ts - Data transformation hooks for botanical tree visualization
 * Transforms Cytoscape JSON into D3 hierarchy for botanical animation
 */

import { useMemo } from 'react';
import { hierarchy, stratify, HierarchyNode } from 'd3-hierarchy';
import { GraphData, GraphNode } from '@/types/asrGotTypes';

interface TreeNode {
  id: string;
  parentId?: string;
  label: string;
  type: 'root' | 'dimension' | 'hypothesis' | 'evidence' | 'bridge' | 'gap' | 'synthesis' | 'reflection';
  confidence: number[];
  metadata: any;
  stage: number;
  botanicalType: 'root-bulb' | 'rootlet' | 'branch' | 'bud' | 'leaf' | 'blossom' | 'pollen';
}

interface BotanicalProperties {
  length: number;
  radius: number;
  color: string;
  opacity: number;
  blossom: number;
  particles: boolean;
}

// Botanical mapping according to specifications
const getBotanicalType = (node: GraphNode): TreeNode['botanicalType'] => {
  switch (node.type) {
    case 'root': return 'root-bulb';
    case 'dimension': return 'rootlet';
    case 'hypothesis': return 'branch';
    case 'evidence': return 'bud';
    case 'synthesis': return 'leaf';
    case 'reflection': return 'blossom';
    default: return 'branch';
  }
};

// Calculate botanical properties from ASR-GoT metadata
const calculateBotanicalProps = (node: TreeNode, stage: number): BotanicalProperties => {
  const avgConfidence = node.confidence.reduce((a, b) => a + b, 0) / node.confidence.length;
  const impactScore = node.metadata?.impact_score || 0.5;
  
  // Length proportional to confidence for rootlets (Stage 2)
  const baseLength = node.botanicalType === 'rootlet' ? avgConfidence * 100 : 50;
  
  // Thickness proportional to confidence for branches (Stage 3)
  const baseRadius = node.botanicalType === 'branch' ? 
    Math.max(2, avgConfidence * 12) : 
    node.botanicalType === 'root-bulb' ? 15 : 4;
  
  // Color based on disciplinary tags or confidence
  const disciplinaryHue = node.metadata?.disciplinary_tags?.[0] ? 
    getDisciplinaryHue(node.metadata.disciplinary_tags[0]) : 
    getConfidenceColor(avgConfidence);
  
  return {
    length: baseLength,
    radius: baseRadius,
    color: disciplinaryHue,
    opacity: node.metadata?.pruned ? 0.2 : 1.0,
    blossom: impactScore > 0.7 ? 1 : 0,
    particles: stage === 8 && node.botanicalType === 'blossom'
  };
};

// Disciplinary tag to hue mapping
const getDisciplinaryHue = (tag: string): string => {
  const hueMap: Record<string, string> = {
    'computer-science': 'hsl(240, 100%, 70%)',
    'biology': 'hsl(120, 80%, 60%)',
    'physics': 'hsl(30, 90%, 65%)',
    'mathematics': 'hsl(280, 85%, 70%)',
    'psychology': 'hsl(340, 75%, 65%)',
    'economics': 'hsl(60, 80%, 55%)',
    'default': 'hsl(var(--primary))'
  };
  return hueMap[tag] || hueMap.default;
};

// Confidence to color mapping
const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return 'hsl(160, 100%, 40%)'; // high - green
  if (confidence >= 0.5) return 'hsl(45, 100%, 50%)'; // mid - amber
  return 'hsl(0, 100%, 45%)'; // low - red
};

// Get stage number from node type
const getNodeStage = (nodeType: string): number => {
  const stageMap: Record<string, number> = {
    'root': 1,
    'dimension': 2,
    'hypothesis': 3,
    'evidence': 4,
    'bridge': 5,
    'synthesis': 6,
    'reflection': 7
  };
  return stageMap[nodeType] || 1;
};

// Main hook for tree scene data transformation
export const useTreeScene = (graphData: GraphData, currentStage: number) => {
  
  // Transform graph data to hierarchical structure
  const hierarchyData = useMemo((): TreeNode[] => {
    const nodes: TreeNode[] = [];
    const seenIds = new Set<string>();
    
    // Always show at least a root node for visualization
    if (graphData.nodes.length === 0) {
      nodes.push({
        id: 'placeholder-root',
        label: 'Start Research Analysis',
        type: 'root',
        confidence: [0.5, 0.5, 0.5, 0.5],
        metadata: { placeholder: true },
        stage: 0,
        botanicalType: 'root-bulb'
      });
      return nodes;
    }
    
    // Process all graph nodes, ensuring unique IDs
    graphData.nodes.forEach((node, index) => {
      const parentEdge = graphData.edges.find(e => e.target === node.id);
      const stage = getNodeStage(node.type);
      
      // Ensure unique ID
      let uniqueId = node.id;
      if (seenIds.has(uniqueId)) {
        uniqueId = `${node.id}-${index}`;
      }
      seenIds.add(uniqueId);
      
      nodes.push({
        id: uniqueId,
        parentId: parentEdge?.source,
        label: node.label,
        type: node.type,
        confidence: node.confidence,
        metadata: node.metadata,
        stage,
        botanicalType: getBotanicalType(node)
      });
    });
    
    return nodes;
  }, [graphData]);

  // Create D3 hierarchy with better error handling
  const treeHierarchy = useMemo(() => {
    if (hierarchyData.length === 0) return null;
    
    try {
      // Find root nodes (nodes without parents)
      const rootNodes = hierarchyData.filter(node => !node.parentId);
      
      if (rootNodes.length === 0) {
        // If no root found, use first node as root
        const firstNode = hierarchyData[0];
        firstNode.parentId = undefined;
        rootNodes.push(firstNode);
      }
      
      const stratifyFn = stratify<TreeNode>()
        .id(d => d.id)
        .parentId(d => d.parentId);
      
      return stratifyFn(hierarchyData);
    } catch (error) {
      console.warn('Tree hierarchy error:', error);
      
      // Return a simple root-only hierarchy as fallback
      if (hierarchyData.length > 0) {
        const root = hierarchyData.find(n => n.type === 'root') || hierarchyData[0];
        return hierarchy(root);
      }
      
      return null;
    }
  }, [hierarchyData]);

  // Animated properties for each node
  const animatedNodes = useMemo(() => {
    if (!treeHierarchy) return [];
    
    return treeHierarchy.descendants().map(node => ({
      ...node,
      botanicalProps: calculateBotanicalProps(node.data, currentStage)
    }));
  }, [treeHierarchy, currentStage]);

  return {
    hierarchyData,
    treeHierarchy,
    animatedNodes
  };
};

// Export types for use in other hooks
export type { TreeNode, BotanicalProperties };