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
    rootletSpring: any;
    branchSpring: any;
    evidenceSpring: any;
    pruneSpring: any;
    leafSpring: any;
    blossomSpring: any;
    reflectionSpring: any;
    finalSpring: any;
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
      
    case 'rootlet':
      return (
        <animated.path
          d={`M0,0 L${avgConfidence * 30},${Math.sin(Math.PI / 4) * avgConfidence * 30}`}
          stroke="hsl(120, 60%, 40%)"
          strokeWidth="3"
          fill="none"
          style={{
            pathLength: animations.rootletSpring.length,
            opacity: animations.rootletSpring.opacity
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
            transform: animations.branchSpring.pathLength.to((v: number) => `scale(${v})`),
            opacity: animations.pruneSpring.opacity
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
            transform: animations.evidenceSpring.scale.to((s: number) => `scale(${s})`),
            filter: animations.evidenceSpring.pulse.to((p: number) => 
              p > 0.5 ? 'drop-shadow(0 0 6px rgba(144, 238, 144, 0.8))' : 'none'
            )
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
          {/* Label slide-in effect */}
          <animated.text
            x="20"
            y="5"
            fontSize="8"
            fill="hsl(var(--foreground))"
            style={{
              opacity: animations.blossomSpring.label,
              transform: animations.blossomSpring.label.to((l: number) => `translateX(${(1 - l) * 20}px)`)
            }}
          >
            {nodeData.label}
          </animated.text>
        </animated.g>
      ) : (
        <circle r="4" fill={getNodeColor(node.data, colorBlindMode)} />
      );
      
    case 'pollen':
      return (
        <animated.circle
          r="2"
          fill={metadata?.bias_flags?.length > 0 ? '#dc2626' : '#fbbf24'}
          style={{
            opacity: animations.reflectionSpring.particles,
            transform: animations.reflectionSpring.sparkles.to((s: number) => `scale(${s})`)
          }}
        />
      );
      
    default:
      return <circle r="4" fill={getNodeColor(node.data, colorBlindMode)} />;
  }
};