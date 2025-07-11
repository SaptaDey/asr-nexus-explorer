/**
 * TreeAnimations.tsx - Animation logic for botanical tree visualization
 * Handles spring animations, chaining, and stage-based effects
 * Now integrates with AlgorithmicAnimationTimeline for precise control
 */

import { useEffect } from 'react';
import { useSpring, useChain, useSpringRef } from '@react-spring/web';
import { GraphNode } from '@/types/asrGotTypes';
import { AlgorithmicAnimationTimeline } from './AlgorithmicAnimationTimeline';

interface TreeAnimationsProps {
  currentStage: number;
  reducedMotion: boolean;
  animatedNodes: any[];
  svgRef: React.RefObject<SVGSVGElement>;
}

export const useTreeAnimations = ({ 
  currentStage, 
  reducedMotion, 
  animatedNodes, 
  svgRef 
}: TreeAnimationsProps) => {
  // Animation spring refs for chaining all 9 stages
  const rootSpringRef = useSpringRef();
  const rootletSpringRef = useSpringRef();
  const branchSpringRef = useSpringRef();
  const evidenceSpringRef = useSpringRef();
  const pruneSpringRef = useSpringRef();
  const leafSpringRef = useSpringRef();
  const blossomSpringRef = useSpringRef();
  const reflectionSpringRef = useSpringRef();
  const finalSpringRef = useSpringRef();

  // Stage 1: Root bulb animation - instant placement
  const rootSpring = useSpring({
    ref: rootSpringRef,
    from: { scale: 0, opacity: 0 },
    to: currentStage >= 1 ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 },
    config: { tension: 300, friction: 30 }
  });

  // Stage 2: Rootlets trail animation - radial emergence
  const rootletSpring = useSpring({
    ref: rootletSpringRef,
    from: { length: 0, opacity: 0 },
    to: currentStage >= 2 ? { length: 1, opacity: 0.8 } : { length: 0, opacity: 0 },
    config: { tension: 200, friction: 40 }
  });

  // Stage 3: Branch growth animation - upward growth with stroke-dash
  const branchSpring = useSpring({
    ref: branchSpringRef,
    from: { pathLength: 0, thickness: 0 },
    to: currentStage >= 3 ? { pathLength: 1, thickness: 1 } : { pathLength: 0, thickness: 0 },
    config: { duration: reducedMotion ? 200 : 1200 }
  });

  // Stage 4: Evidence integration - pulse and radius increase
  const evidenceSpring = useSpring({
    ref: evidenceSpringRef,
    from: { scale: 0, pulse: 0 },
    to: currentStage >= 4 ? { scale: 1, pulse: 1 } : { scale: 0, pulse: 0 },
    config: { tension: 300, friction: 25 }
  });

  // Stage 5: Pruning/merging - fade withered branches
  const pruneSpring = useSpring({
    ref: pruneSpringRef,
    from: { opacity: 1, morph: 0 },
    to: currentStage >= 5 ? { opacity: 0.2, morph: 1 } : { opacity: 1, morph: 0 },
    config: { duration: reducedMotion ? 100 : 700 }
  });

  // Stage 6: Leaf emergence - staggered with subtle jitter
  const leafSpring = useSpring({
    ref: leafSpringRef,
    from: { scale: 0, jitter: 0 },
    to: currentStage >= 6 ? { scale: 1, jitter: 1 } : { scale: 0, jitter: 0 },
    config: { tension: 180, friction: 80 }
  });

  // Stage 7: Blossom opening - sequential petal unfurling
  const blossomSpring = useSpring({
    ref: blossomSpringRef,
    from: { petals: 0, label: 0 },
    to: currentStage >= 7 ? { petals: 1, label: 1 } : { petals: 0, label: 0 },
    config: { duration: reducedMotion ? 100 : 800 }
  });

  // Stage 8: Reflection - pollen particle system
  const reflectionSpring = useSpring({
    ref: reflectionSpringRef,
    from: { particles: 0, sparkles: 0 },
    to: currentStage >= 8 ? { particles: 1, sparkles: 1 } : { particles: 0, sparkles: 0 },
    config: { tension: 150, friction: 25 }
  });

  // Stage 9: Final analysis - comprehensive display
  const finalSpring = useSpring({
    ref: finalSpringRef,
    from: { completion: 0 },
    to: currentStage >= 9 ? { completion: 1 } : { completion: 0 },
    config: { duration: reducedMotion ? 100 : 1000 }
  });

  // Chain animations for staged progression with proper timing
  useChain(
    currentStage >= 1 ? [
      rootSpringRef,
      rootletSpringRef,
      branchSpringRef,
      evidenceSpringRef,
      pruneSpringRef,
      leafSpringRef,
      blossomSpringRef,
      reflectionSpringRef,
      finalSpringRef
    ] : [],
    [0, 0.3, 0.8, 1.4, 2.0, 2.5, 3.0, 3.5, 4.0],
    reducedMotion ? 200 : 1000
  );

  // CSS-based animation for branch drawing
  useEffect(() => {
    if (!reducedMotion && currentStage >= 3 && svgRef.current) {
      const branches = svgRef.current.querySelectorAll('.branch-path');
      branches.forEach((branch, i) => {
        (branch as SVGElement).style.animation = `branch-draw 1.5s ease-in-out ${i * 0.2}s forwards`;
      });
    }
  }, [currentStage, reducedMotion, svgRef]);

  // Stage 4 evidence pulse effect
  useEffect(() => {
    if (currentStage === 4 && !reducedMotion) {
      const evidenceNodes = animatedNodes.filter(n => n.data.botanicalType === 'bud');
      
      evidenceNodes.forEach((node, i) => {
        setTimeout(() => {
          // CSS-based pulse animation
          const element = document.getElementById(`node-${(node.data as any).id}`);
          if (element) {
            element.style.animation = 'pulse-botanical 0.6s ease-in-out';
          }
          
          // Parent branch thickness increase
          const parentId = (node.parent?.data as any)?.id;
          if (parentId) {
            const branchElement = document.getElementById(`branch-${parentId}`);
            if (branchElement) {
              const currentWidth = branchElement.getAttribute('stroke-width') || '2';
              branchElement.setAttribute('stroke-width', String(parseInt(currentWidth) + 2));
            }
          }
        }, i * 300);
      });
    }
  }, [currentStage, animatedNodes, reducedMotion]);

  return {
    rootSpring,
    rootletSpring,
    branchSpring,
    evidenceSpring,
    pruneSpring,
    leafSpring,
    blossomSpring,
    reflectionSpring,
    finalSpring
  };
};

export const usePollenParticles = (
  currentStage: number,
  animatedNodes: any[],
  reducedMotion: boolean,
  setPollenParticles: (particles: any[]) => void
) => {
  // Stage 8 pollen particle system
  useEffect(() => {
    if (currentStage >= 8) {
      const blossoms = animatedNodes.filter(n => n.data.botanicalType === 'blossom');
      const particles: any[] = [];
      
      blossoms.forEach(blossom => {
        for (let i = 0; i < 5; i++) {
          particles.push({
            id: `${blossom.data.id}-particle-${i}`,
            x: blossom.x || 0,
            y: blossom.y || 0,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            color: blossom.data.metadata?.bias_flags?.length > 0 ? '#dc2626' : '#fbbf24'
          });
        }
      });
      
      setPollenParticles(particles);
      
      // Animate particles with CSS
      if (!reducedMotion) {
        particles.forEach((particle, i) => {
          setTimeout(() => {
            const element = document.getElementById(`particle-${particle.id}`);
            if (element) {
              element.style.animation = 'particle-float 2s ease-out forwards';
              element.style.setProperty('--float-x', `${particle.vx * 50}px`);
              element.style.setProperty('--float-y', `${particle.vy * 50}px`);
            }
          }, i * 100);
        });
      }
    }
  }, [currentStage, animatedNodes, reducedMotion, setPollenParticles]);
};