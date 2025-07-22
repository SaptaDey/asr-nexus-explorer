/**
 * Tree-of-Reasoning Animated Visualization for ASR-GoT
 * Botanical growth metaphor with D3 + react-spring + Anime.js
 */

import React from 'react';
import { TreeScene } from './TreeScene';
import { GraphData } from '@/types/asrGotTypes';

interface TreeOfReasoningProps {
  graphData: GraphData;
  currentStage: number;
  isProcessing: boolean;
  onStageSelect?: (stage: number) => void;
}

export const TreeOfReasoningVisualization: React.FC<TreeOfReasoningProps> = (props) => {
  return <TreeScene {...props} />;
};