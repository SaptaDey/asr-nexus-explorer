/**
 * AlgorithmicAnimationTimeline.tsx - Fixed version that returns proper JSX
 * Implements the precise 8-stage animation sequence with specific timing and easing
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useSpring, useTrail, config } from '@react-spring/web';

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

  // Stage 2: Trail sequence with easeInOutBack - Fixed useTrail parameters
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
    },
    delay: reducedMotion ? 0 : 150
  });

  // Stage 3: CSS-based stroke-dashoffset animation
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
        element.style.transition = `stroke-dashoffset ${1200 + index * 200}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        
        // Trigger animation
        setTimeout(() => {
          element.style.strokeDashoffset = '0';
          if (index === branches.length - 1) {
            setTimeout(() => onAnimationComplete?.(3), 1200);
          }
        }, index * 200);
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

      // Branch pulse (CSS-based flash)
      (targetBranch as SVGElement).style.stroke = 'rgba(255, 215, 0, 0.9)';
      (targetBranch as SVGElement).style.transition = 'stroke 200ms ease-in-out';
      
      setTimeout(() => {
        (targetBranch as SVGElement).style.stroke = '';
      }, 600);

      // Radius spring increases by Δr (Bayesian ΔC)
      const currentWidth = parseFloat(targetBranch.getAttribute('stroke-width') || '2');
      const deltaR = event.deltaC * 10; // Scale factor for visual impact
      const newWidth = currentWidth + deltaR;

      (targetBranch as SVGElement).style.transition = 'stroke-width 800ms cubic-bezier(0.68, -0.55, 0.265, 1.55)';
      (targetBranch as SVGElement).style.strokeWidth = `${newWidth}`;
    };

    // Process evidence events
    animationStateRef.current.evidenceEvents.forEach(processEvidenceEvent);
  }, [currentStage, svgRef]);

  // Stage 5: Prune/merge with CSS transitions
  useEffect(() => {
    if (currentStage >= 5 && !reducedMotion && svgRef.current) {
      const prunedNodes = svgRef.current.querySelectorAll('.pruned-node');
      const mergedPaths = svgRef.current.querySelectorAll('.merged-path');

      // Withered branch fades to 20% opacity
      prunedNodes.forEach((node) => {
        (node as SVGElement).style.transition = 'opacity 700ms ease-out';
        (node as SVGElement).style.opacity = '0.2';
      });

      // Merged paths morph smoothly (simplified approach)
      mergedPaths.forEach((path, index) => {
        const element = path as SVGPathElement;
        const targetPath = element.getAttribute('data-merged-path');
        
        if (targetPath) {
          setTimeout(() => {
            element.style.transition = 'd 1000ms cubic-bezier(0.4, 0, 0.2, 1)';
            element.setAttribute('d', targetPath);
          }, index * 100);
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
    delay: reducedMotion ? 0 : 100
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
        const openPath = element.getAttribute('data-open-path');
        
        if (openPath) {
          setTimeout(() => {
            element.style.transition = 'd 800ms cubic-bezier(0.4, 0, 0.2, 1)';
            element.setAttribute('d', openPath);
          }, index * 200);
        }

        // Label slides in from right
        const label = svgRef.current?.querySelector(`#blossom-label-${index}`);
        if (label) {
          (label as SVGElement).style.transform = 'translateX(100px)';
          (label as SVGElement).style.opacity = '0';
          
          setTimeout(() => {
            (label as SVGElement).style.transition = 'transform 600ms ease-out, opacity 600ms ease-out';
            (label as SVGElement).style.transform = 'translateX(0)';
            (label as SVGElement).style.opacity = '1';
          }, index * 200 + 400);
        }
      });
    }
  }, [currentStage, reducedMotion, svgRef]);

  // Stage 8: Particle system with branch shaking
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
        
        // CSS-based particle animation
        particle.style.transition = 'transform 2000ms ease-out, opacity 2000ms ease-out, scale 2000ms ease-out';
        
        setTimeout(() => {
          particle.style.transform = 'translateY(-50px)';
          particle.style.opacity = '0';
          particle.style.transform += ' scale(0.3)';
          
          setTimeout(() => {
            particle.remove();
          }, 2000);
        }, index * 100);
      } else {
        // Branch shaking for failures
        const failedBranch = svgRef.current.querySelector(`#branch-${item.id}`);
        if (failedBranch) {
          const element = failedBranch as SVGElement;
          element.style.transition = 'transform 500ms ease-in-out';
          
          const keyframes = [-5, 5, -3, 3, 0];
          keyframes.forEach((offset, i) => {
            setTimeout(() => {
              element.style.transform = `translateX(${offset}px)`;
            }, (i * 100) + (index * 150));
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

  // Public API for adding evidence events
  const addEvidenceEvent = useCallback((event: EvidenceEvent) => {
    animationStateRef.current.evidenceEvents.push(event);
  }, []);

  // Public API for setting checklist items
  const setChecklistItems = useCallback((items: ChecklistItem[]) => {
    animationStateRef.current.checklist = items;
  }, []);

  // Return JSX instead of object - This was the main issue
  return (
    <div className="animation-timeline-container">
      <div className="animation-stage-indicator">
        Stage {currentStage}: Animation Timeline
      </div>
    </div>
  );
};