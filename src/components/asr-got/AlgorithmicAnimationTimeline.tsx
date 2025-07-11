/**
 * AlgorithmicAnimationTimeline.tsx - Simplified animation timeline
 * Returns proper JSX instead of animation objects
 */

import React, { useEffect, useRef } from 'react';
import { useSpring, animated } from '@react-spring/web';

interface AlgorithmicAnimationTimelineProps {
  currentStage: number;
  graphData: any;
  svgRef: React.RefObject<SVGSVGElement>;
  onAnimationComplete?: (stage: number) => void;
  reducedMotion?: boolean;
}

export const AlgorithmicAnimationTimeline: React.FC<AlgorithmicAnimationTimelineProps> = ({
  currentStage,
  graphData,
  svgRef,
  onAnimationComplete,
  reducedMotion = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Simple animation spring
  const { opacity, scale } = useSpring({
    opacity: currentStage > 0 ? 1 : 0,
    scale: currentStage > 0 ? 1 : 0.8,
    config: { tension: 200, friction: 20 }
  });

  useEffect(() => {
    if (onAnimationComplete && currentStage > 0) {
      const timer = setTimeout(() => {
        onAnimationComplete(currentStage);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentStage, onAnimationComplete]);

  return (
    <animated.div
      ref={containerRef}
      style={{
        opacity,
        transform: scale.to(s => `scale(${s})`),
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10
      }}
    >
      <div className="animation-timeline">
        <div className={`stage-indicator stage-${currentStage}`}>
          Stage {currentStage}
        </div>
        {currentStage > 0 && (
          <div className="animation-progress">
            <div 
              className="progress-bar"
              style={{ width: `${(currentStage / 9) * 100}%` }}
            />
          </div>
        )}
      </div>
    </animated.div>
  );
};