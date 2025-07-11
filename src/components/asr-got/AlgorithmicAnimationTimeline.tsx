/**
 * AlgorithmicAnimationTimeline.tsx - Exact algorithmic animation timeline implementation
 * Implements the precise 8-stage animation sequence with specific timing and easing
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useSpring, useTrail, config } from '@react-spring/web';
import { animate as anime } from 'animejs';

interface AlgorithmicAnimationTimelineProps {
  currentStage: number;
  graphData: any;
  svgRef: React.RefObject<SVGSVGElement>;
  onAnimationComplete?: (stage: number) => void;
  reducedMotion?: boolean;
}

interface EvidenceEvent {
  targetBranchId: string;
  evidenceType: 'supportive' | 'contradictory';
  deltaC: number;
  timestamp: number;
}

interface ChecklistItem {
  id: string;
  passed: boolean;
  type: 'bias_check' | 'quality_check' | 'methodology_check';
  message: string;
}

export const AlgorithmicAnimationTimeline: React.FC<AlgorithmicAnimationTimelineProps> = ({
  currentStage,
  graphData,
  svgRef,
  onAnimationComplete,
  reducedMotion = false
}) => {
  const animationStateRef = useRef<{
    evidenceEvents: EvidenceEvent[];
    checklist: ChecklistItem[];
    frameId: number | null;
    lastFrameTime: number;
  }>({
    evidenceEvents: [],
    checklist: [],
    frameId: null,
    lastFrameTime: 0
  });

  // Memoized node data for performance
  const memoizedNodes = useMemo(() => {
    return graphData?.nodes || [];
  }, [graphData?.nodes]);

  const rootletNodes = useMemo(() => {
    return memoizedNodes.filter((n: any) => n.type === 'dimension');
  }, [memoizedNodes]);

  const branchNodes = useMemo(() => {
    return memoizedNodes.filter((n: any) => n.type === 'hypothesis');
  }, [memoizedNodes]);

  const leafNodes = useMemo(() => {
    return memoizedNodes.filter((n: any) => n.type === 'synthesis');
  }, [memoizedNodes]);

  const blossomNodes = useMemo(() => {
    return memoizedNodes.filter((n: any) => n.type === 'reflection');
  }, [memoizedNodes]);

  // Stage 1: Instant root placement
  const rootSpring = useSpring({
    opacity: currentStage >= 1 ? 1 : 0,
    transform: currentStage >= 1 ? 'scale(1)' : 'scale(0)',
    config: { duration: reducedMotion ? 100 : 0 } // Instant
  });

  // Stage 2: Trail sequence with easeInOutBack
  const rootletTrail = useTrail(rootletNodes.length, {
    from: { 
      length: 0, 
      opacity: 0,
      transform: 'scale(0) translateX(0)'
    },
    to: currentStage >= 2 ? {
      length: 1,
      opacity: 0.8,
      transform: 'scale(1) translateX(0)'
    } : {
      length: 0,
      opacity: 0,
      transform: 'scale(0) translateX(0)'
    },
    config: {
      tension: 170,
      friction: 26,
      // easeInOutBack equivalent
      easing: (t: number) => {
        const c1 = 1.70158;
        const c2 = c1 * 1.525;
        return t < 0.5
          ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
          : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
      }
    },
    delay: (index: number) => reducedMotion ? 0 : index * 150
  });

  // Stage 3: Anime.js stroke-dashoffset → react-spring thickness sequence
  const branchSpring = useSpring({
    thickness: currentStage >= 3 ? 1 : 0,
    config: { tension: 200, friction: 25 }
  });

  useEffect(() => {
    if (currentStage >= 3 && !reducedMotion && svgRef.current) {
      const branches = svgRef.current.querySelectorAll('.branch-path');
      
      branches.forEach((branch, index) => {
        const element = branch as SVGPathElement;
        const pathLength = element.getTotalLength();
        
        // Set initial stroke-dasharray and dashoffset
        element.style.strokeDasharray = `${pathLength}`;
        element.style.strokeDashoffset = `${pathLength}`;
        
        // Anime.js stroke-dashoffset animation
        anime({
          targets: element,
          strokeDashoffset: [pathLength, 0],
          duration: 1200,
          delay: index * 200,
          easing: 'easeInOutCubic',
          complete: () => {
            // Then react-spring expands thickness (handled by branchSpring)
            onAnimationComplete?.(3);
          }
        });
      });
    }
  }, [currentStage, reducedMotion, svgRef, onAnimationComplete]);

  // Stage 4: Evidence event loop with branch pulsing and Bayesian ΔC
  const evidenceEventLoop = useCallback(() => {
    if (currentStage !== 4) return;

    const processEvidenceEvent = (event: EvidenceEvent) => {
      if (!svgRef.current) return;

      const targetBranch = svgRef.current.querySelector(`#branch-${event.targetBranchId}`);
      if (!targetBranch) return;

      // Branch pulse (rgba flash)
      anime({
        targets: targetBranch,
        stroke: [
          { value: 'rgba(255, 215, 0, 0.9)', duration: 200 },
          { value: 'rgba(255, 215, 0, 0.3)', duration: 200 },
          { value: 'rgba(255, 215, 0, 0.9)', duration: 200 }
        ],
        duration: 600,
        easing: 'easeInOutQuad'
      });

      // Radius spring increases by Δr (Bayesian ΔC)
      const currentWidth = parseFloat(targetBranch.getAttribute('stroke-width') || '2');
      const deltaR = event.deltaC * 10; // Scale factor for visual impact
      const newWidth = currentWidth + deltaR;

      anime({
        targets: targetBranch,
        strokeWidth: newWidth,
        duration: 800,
        easing: 'easeOutElastic(1, .6)'
      });

      // Bud sprite scales from 0 → 1 and turns into icon
      const budContainer = svgRef.current.querySelector(`#bud-${event.targetBranchId}`);
      if (budContainer) {
        const iconType = event.evidenceType === 'supportive' ? 'leaf' : 'fruit';
        
        anime({
          targets: budContainer,
          scale: [0, 1.2, 1],
          duration: 1000,
          easing: 'easeOutBounce',
          complete: () => {
            // Add icon class for styling
            budContainer.classList.add(`icon-${iconType}`);
          }
        });
      }
    };

    // Process evidence events
    animationStateRef.current.evidenceEvents.forEach(processEvidenceEvent);
  }, [currentStage, svgRef]);

  // Stage 5: Prune/merge with Anime.js morphTo
  useEffect(() => {
    if (currentStage >= 5 && !reducedMotion && svgRef.current) {
      const prunedNodes = svgRef.current.querySelectorAll('.pruned-node');
      const mergedPaths = svgRef.current.querySelectorAll('.merged-path');

      // Withered branch fades to 20% opacity
      anime({
        targets: prunedNodes,
        opacity: 0.2,
        duration: 700,
        easing: 'easeOutQuad'
      });

      // Merged paths morph smoothly
      mergedPaths.forEach((path, index) => {
        const element = path as SVGPathElement;
        const originalPath = element.getAttribute('d');
        const targetPath = element.getAttribute('data-merged-path');
        
        if (originalPath && targetPath) {
          anime({
            targets: element,
            d: [originalPath, targetPath],
            duration: 1000,
            delay: index * 100,
            easing: 'easeInOutCubic'
          });
        }
      });
    }
  }, [currentStage, reducedMotion, svgRef]);

  // Stage 6: Staggered leaf fade-in with friction 80 jitter
  const leafTrail = useTrail(leafNodes.length, {
    from: { 
      opacity: 0, 
      scale: 0,
      x: 0,
      y: 0
    },
    to: currentStage >= 6 ? {
      opacity: 1,
      scale: 1,
      x: Math.random() * 4 - 2, // Subtle jitter
      y: Math.random() * 4 - 2
    } : {
      opacity: 0,
      scale: 0,
      x: 0,
      y: 0
    },
    config: {
      tension: 120,
      friction: 80 // Exact friction 80 as specified
    },
    delay: (index: number) => reducedMotion ? 0 : index * 100
  });

  // Stage 7: SVG path morph over 800ms with right-slide labels
  const blossomSpring = useSpring({
    pathMorph: currentStage >= 7 ? 1 : 0,
    labelSlide: currentStage >= 7 ? 0 : 100, // 100px right offset
    config: { duration: reducedMotion ? 100 : 800 }
  });

  useEffect(() => {
    if (currentStage >= 7 && !reducedMotion && svgRef.current) {
      const blossoms = svgRef.current.querySelectorAll('.blossom-path');
      
      blossoms.forEach((blossom, index) => {
        const element = blossom as SVGPathElement;
        const closedPath = element.getAttribute('data-closed-path');
        const openPath = element.getAttribute('data-open-path');
        
        if (closedPath && openPath) {
          // SVG path morph over 800ms
          anime({
            targets: element,
            d: [closedPath, openPath],
            duration: 800,
            delay: index * 200,
            easing: 'easeOutCubic'
          });
        }

        // Label slides in from right
        const label = svgRef.current?.querySelector(`#blossom-label-${index}`);
        if (label) {
          anime({
            targets: label,
            translateX: [100, 0],
            opacity: [0, 1],
            duration: 600,
            delay: index * 200 + 400,
            easing: 'easeOutQuart'
          });
        }
      });
    }
  }, [currentStage, reducedMotion, svgRef]);

  // Stage 8: Pollen particle system with branch shaking
  const processChecklistItems = useCallback((checklist: ChecklistItem[]) => {
    if (!svgRef.current) return;

    checklist.forEach((item, index) => {
      if (item.passed) {
        // Golden particles for success
        const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        particle.setAttribute('r', '3');
        particle.setAttribute('fill', '#fbbf24');
        particle.setAttribute('opacity', '0.8');
        particle.setAttribute('cx', `${Math.random() * 600}`);
        particle.setAttribute('cy', `${Math.random() * 400}`);
        
        svgRef.current.appendChild(particle);
        
        anime({
          targets: particle,
          translateY: -50,
          opacity: [0.8, 0],
          scale: [1, 0.3],
          duration: 2000,
          delay: index * 100,
          easing: 'easeOutQuad',
          complete: () => {
            particle.remove();
          }
        });
      } else {
        // Crimson particles and branch shaking for failures
        const failedBranch = svgRef.current.querySelector(`#branch-${item.id}`);
        if (failedBranch) {
          // Branch shaking
          anime({
            targets: failedBranch,
            translateX: [
              { value: -5, duration: 100 },
              { value: 5, duration: 100 },
              { value: -3, duration: 100 },
              { value: 3, duration: 100 },
              { value: 0, duration: 100 }
            ],
            duration: 500,
            delay: index * 150,
            easing: 'easeInOutQuad'
          });

          // Crimson particles
          const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          particle.setAttribute('r', '2');
          particle.setAttribute('fill', '#dc2626');
          particle.setAttribute('opacity', '0.9');
          
          const branchRect = failedBranch.getBoundingClientRect();
          particle.setAttribute('cx', `${branchRect.x + branchRect.width / 2}`);
          particle.setAttribute('cy', `${branchRect.y + branchRect.height / 2}`);
          
          svgRef.current.appendChild(particle);
          
          anime({
            targets: particle,
            translateY: -30,
            opacity: [0.9, 0],
            duration: 1500,
            delay: index * 100,
            easing: 'easeOutQuad',
            complete: () => {
              particle.remove();
            }
          });
        }
      }
    });
  }, [svgRef]);

  useEffect(() => {
    if (currentStage >= 8) {
      processChecklistItems(animationStateRef.current.checklist);
    }
  }, [currentStage, processChecklistItems]);

  // 60 FPS throttling with requestAnimationFrame
  const throttledUpdate = useCallback(() => {
    const now = performance.now();
    const delta = now - animationStateRef.current.lastFrameTime;
    
    if (delta >= 16.67) { // 60 FPS = 16.67ms per frame
      animationStateRef.current.lastFrameTime = now;
      
      // Trigger evidence event loop
      evidenceEventLoop();
      
      // Schedule next frame
      animationStateRef.current.frameId = requestAnimationFrame(throttledUpdate);
    } else {
      animationStateRef.current.frameId = requestAnimationFrame(throttledUpdate);
    }
  }, [evidenceEventLoop]);

  useEffect(() => {
    if (currentStage >= 4 && currentStage <= 8) {
      animationStateRef.current.frameId = requestAnimationFrame(throttledUpdate);
    }
    
    return () => {
      if (animationStateRef.current.frameId) {
        cancelAnimationFrame(animationStateRef.current.frameId);
      }
    };
  }, [currentStage, throttledUpdate]);

  // Public API for adding evidence events
  const addEvidenceEvent = useCallback((event: EvidenceEvent) => {
    animationStateRef.current.evidenceEvents.push(event);
  }, []);

  // Public API for setting checklist items
  const setChecklistItems = useCallback((items: ChecklistItem[]) => {
    animationStateRef.current.checklist = items;
  }, []);

  return {
    rootSpring,
    rootletTrail,
    branchSpring,
    leafTrail,
    blossomSpring,
    addEvidenceEvent,
    setChecklistItems
  };
};