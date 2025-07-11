/**
 * BotanicalTreeScene.tsx - Simplified tree scene without complex animations
 */

import React, { useMemo } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { GraphData, GraphNode } from '@/types/asrGotTypes';

interface BotanicalTreeSceneProps {
  graphData: GraphData;
  currentStage: number;
  onStageChange?: (stage: number) => void;
}

export const BotanicalTreeScene: React.FC<BotanicalTreeSceneProps> = ({
  graphData,
  currentStage,
  onStageChange
}) => {
  // Simple animation
  const { opacity } = useSpring({
    opacity: currentStage > 0 ? 1 : 0,
    config: { tension: 200, friction: 20 }
  });

  // Process nodes into simple tree structure
  const treeElements = useMemo(() => {
    if (!graphData?.nodes?.length) return [];

    return graphData.nodes.map((node: GraphNode, index) => ({
      id: node.id,
      type: node.type,
      level: index % 3, // Simple level assignment
      position: {
        x: (index % 5) * 100 + 50,
        y: Math.floor(index / 5) * 80 + 50
      }
    }));
  }, [graphData]);

  return (
    <animated.div
      style={{
        opacity,
        width: '100%',
        height: '400px',
        position: 'relative',
        border: '1px solid #ddd',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    >
      <div className="tree-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
        {treeElements.map((element, index) => (
          <div
            key={element.id}
            className={`tree-node tree-node-${element.type}`}
            style={{
              position: 'absolute',
              left: element.position.x,
              top: element.position.y,
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: getNodeColor(element.type),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              transform: currentStage > element.level ? 'scale(1)' : 'scale(0)',
              transition: 'transform 0.5s ease-in-out'
            }}
          >
            {index + 1}
          </div>
        ))}
      </div>
    </animated.div>
  );
};

function getNodeColor(type: string): string {
  const colors: Record<string, string> = {
    root: '#8B4513',
    dimension: '#CD853F',
    hypothesis: '#4A5D23',
    evidence: '#32CD32',
    synthesis: '#228B22',
    reflection: '#FFB6C1',
    gap: '#FF6B6B',
    bridge: '#4ECDC4',
    knowledge: '#45B7D1'
  };
  return colors[type] || '#666';
}