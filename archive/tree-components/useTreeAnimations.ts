/**
 * useTreeAnimations.ts - Animation logic for botanical tree visualization
 * Stage-based react-spring animations for tree growth and interactions
 */

import { useSpring, useTrail } from '@react-spring/web';

// Spring animation hook for stage-based animations
export const useStageAnimation = (currentStage: number, nodes: any[]) => {
  
  // Stage 2: Rootlets trail animation
  const rootletTrail = useTrail(nodes.filter(n => n.data?.botanicalType === 'rootlet').length, {
    from: { length: 0, opacity: 0 },
    to: currentStage >= 2 ? { length: 100, opacity: 1 } : { length: 0, opacity: 0 },
    config: { tension: 280, friction: 60 }
  });

  // Stage 3: Branch growth animation
  const branchSprings = useSpring({
    thickness: currentStage >= 3 ? 1 : 0,
    config: { tension: 200, friction: 40 }
  });

  // Stage 4: Evidence pulse animation
  const evidencePulse = useSpring({
    scale: currentStage === 4 ? 1.2 : 1,
    config: { tension: 300, friction: 30 }
  });

  // Stage 5: Pruning fade animation
  const pruningFade = useSpring({
    opacity: currentStage >= 5 ? 0.2 : 1,
    config: { duration: 800 }
  });

  // Stage 6: Leaf emergence animation
  const leafSpring = useSpring({
    scale: currentStage >= 6 ? 1 : 0,
    config: { tension: 180, friction: 20 }
  });

  // Stage 7: Blossom opening animation
  const blossomSpring = useSpring({
    petals: currentStage >= 7 ? 1 : 0,
    config: { duration: 800 }
  });

  // Stage 8: Pollen particle system
  const pollenSpring = useSpring({
    particles: currentStage >= 8 ? 1 : 0,
    config: { tension: 150, friction: 25 }
  });

  return {
    rootletTrail,
    branchSprings,
    evidencePulse,
    pruningFade,
    leafSpring,
    blossomSpring,
    pollenSpring
  };
};