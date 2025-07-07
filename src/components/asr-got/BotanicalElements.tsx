/**
 * BotanicalElements.tsx - Renders botanical elements for tree visualization
 * Handles different node types: root-bulb, branch, bud, leaf, blossom
 */

import React from 'react';
import { animated } from '@react-spring/web';

interface BotanicalElementsProps {
  node: any;
  animations: {
    rootSpring: any;
    branchSpring: any;
    leafSpring: any;
    blossomSpring: any;
  };
  evidenceAnimations: any;
  colorBlindMode: boolean;
}

export const getNodeColor = (node: any, colorBlindMode: boolean) => {
  if (colorBlindMode) return 'hsl(var(--foreground))';
  
  const confidence = node.confidence?.reduce((a: number, b: number) => a + b, 0) / node.confidence?.length || 0;
  if (confidence >= 0.8) return 'hsl(160, 100%, 40%)';
  if (confidence >= 0.5) return 'hsl(45, 100%, 50%)';
  return 'hsl(0, 100%, 45%)';
};

export const BotanicalElement: React.FC<BotanicalElementsProps> = ({
  node,
  animations,
  evidenceAnimations,
  colorBlindMode
}) => {
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
            transform: animations.rootSpring.scale.to((s: number) => `scale(${s})`),
            opacity: animations.rootSpring.opacity
          }}
        />
      );
      
    case 'branch':
      return (
        <animated.circle
          r={Math.max(4, avgConfidence * 8)}
          fill={getNodeColor(node.data, colorBlindMode)}
          stroke="#4A5D23"
          strokeWidth="1"
          style={{
            transform: animations.branchSpring.pathLength.to((v: number) => `scale(${v})`)
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
            transform: evidenceAnimations.evidencePulse.scale.to((s: any) => `scale(${s})`)
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
            transform: animations.leafSpring.scale.to((s: number) => `scale(${s})`),
            filter: animations.leafSpring.jitter.to((j: number) => j > 0 ? 'blur(0.3px)' : 'none')
          }}
        />
      );
      
    case 'blossom':
      const impactScore = metadata?.impact_score || 0;
      return impactScore > 0.7 ? (
        <animated.g
          style={{
            transform: animations.blossomSpring.petals.to((p: number) => `scale(${p})`)
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
        <circle r="4" fill={getNodeColor(node.data, colorBlindMode)} />
      );
      
    default:
      return <circle r="4" fill={getNodeColor(node.data, colorBlindMode)} />;
  }
};