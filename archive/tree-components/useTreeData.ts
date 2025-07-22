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
const getBotanicalType = (nodeType: string, stage: number): TreeNode['botanicalType'] => {
  switch (nodeType) {
    case 'root': return 'root-bulb';
    case 'dimension': return 'rootlet';
    case 'hypothesis': return 'branch';
    case 'evidence': return 'bud';
    case 'synthesis': return 'leaf';
    case 'reflection': return 'blossom';
    default: return stage <= 2 ? 'rootlet' : stage <= 4 ? 'branch' : 'leaf';
  }
};

// Calculate botanical properties from ASR-GoT metadata
const calculateBotanicalProps = (node: TreeNode, stage: number): BotanicalProperties => {
  const avgConfidence = node.confidence && Array.isArray(node.confidence) && node.confidence.length > 0 
    ? node.confidence.reduce((a, b) => a + b, 0) / node.confidence.length 
    : 0.5;
  const impactScore = node.metadata?.impact_score || 0.5;
  
  // Length proportional to confidence for rootlets (Stage 2)
  const baseLength = node.botanicalType === 'rootlet' ? avgConfidence * 100 : 50;
  
  // Thickness proportional to confidence for branches (Stage 3)
  const baseRadius = node.botanicalType === 'branch' ? 
    Math.max(2, avgConfidence * 12) : 
    node.botanicalType === 'root-bulb' ? 15 : 4;
  
  // Color based on disciplinary tags or confidence
  const disciplinaryHue = node.metadata?.disciplinary_tags?.[0] ? 
    getDisciplinaryHue(node.metadata.disciplinary_tags[0], avgConfidence) : 
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

// Disciplinary tag to hue mapping with graduated palette
const getDisciplinaryHue = (tag: string, confidence: number = 0.5): string => {
  // Base hue values for different disciplines
  const disciplinaryHues: Record<string, number> = {
    'computer-science': 240,     // Blue
    'artificial-intelligence': 260, // Purple-blue
    'machine-learning': 280,     // Purple
    'biology': 120,              // Green
    'medicine': 140,             // Green-cyan
    'biochemistry': 160,         // Cyan
    'physics': 30,               // Orange
    'chemistry': 50,             // Yellow-orange
    'mathematics': 280,          // Purple
    'statistics': 300,           // Magenta
    'psychology': 340,           // Pink-red
    'neuroscience': 20,          // Red-orange
    'economics': 60,             // Yellow
    'finance': 80,               // Yellow-green
    'sociology': 180,            // Cyan-blue
    'anthropology': 200,         // Blue-cyan
    'philosophy': 220,           // Blue
    'linguistics': 100,          // Green-yellow
    'default': 190               // Light blue
  };
  
  const baseHue = disciplinaryHues[tag] || disciplinaryHues.default;
  
  // Adjust saturation and lightness based on confidence
  const saturation = Math.max(40, Math.min(100, confidence * 120 + 20));
  const lightness = Math.max(30, Math.min(80, confidence * 40 + 40));
  
  return `hsl(${baseHue}, ${saturation}%, ${lightness}%)`;
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
        botanicalType: getBotanicalType(node.type, stage)
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