
/**
 * EvidenceEventSystem.tsx - Stage 4 evidence event loop implementation
 * Handles real-time evidence processing with branch pulsing and Bayesian ΔC
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useSpring, config } from '@react-spring/web';
import { animate as anime } from 'animejs';
import { calculateConfidenceVector, ConfidenceCalculationResult } from '@/utils/confidenceCalculations';
import { GraphNode, GraphEdge } from '@/types/asrGotTypes';
// TreeDataService temporarily archived - removing dependency

interface EvidenceEvent {
  id: string;
  targetBranchId: string;
  evidenceType: 'supportive' | 'contradictory' | 'correlative';
  evidenceNode: GraphNode;
  supportingEdges: GraphEdge[];
  timestamp: number;
  confidence: number;
  quality: 'high' | 'medium' | 'low';
}

interface EvidenceEventSystemProps {
  currentStage: number;
  graphData: any;
  svgRef: React.RefObject<SVGSVGElement>;
  onEvidenceProcessed?: (event: EvidenceEvent, result: ConfidenceCalculationResult) => void;
  reducedMotion?: boolean;
}

export const EvidenceEventSystem: React.FC<EvidenceEventSystemProps> = ({
  currentStage,
  graphData,
  svgRef,
  onEvidenceProcessed,
  reducedMotion = false
}) => {
  const eventQueueRef = useRef<EvidenceEvent[]>([]);
  const processingRef = useRef(false);
  const frameRequestRef = useRef<number | null>(null);

  // Spring for branch radius changes
  const [branchSpring, setBranchSpring] = useSpring(() => ({
    radius: 1,
    config: config.wobbly
  }));

  // Process evidence events in real-time
  const processEvidenceEvent = useCallback(async (event: EvidenceEvent) => {
    if (!svgRef.current || processingRef.current) return;

    processingRef.current = true;

    try {
      // Calculate Bayesian confidence update
      const branchNode = graphData.nodes.find((n: GraphNode) => n.id === event.targetBranchId);
      if (!branchNode) return;

      const evidenceNodes = [event.evidenceNode];
      const confidenceResult = calculateConfidenceVector(
        branchNode,
        evidenceNodes,
        event.supportingEdges
      );

      const deltaC = confidenceResult.metadata.confidence_delta;
      const targetBranch = svgRef.current.querySelector(`#branch-${event.targetBranchId}`) as SVGElement;

      if (targetBranch) {
        // 1. Target branch pulses (rgba flash)
        const originalStroke = targetBranch.getAttribute('stroke') || '#4A5D23';
        const flashColor = event.evidenceType === 'supportive' ? 
          'rgba(34, 197, 94, 0.9)' : 
          event.evidenceType === 'contradictory' ? 
          'rgba(239, 68, 68, 0.9)' : 
          'rgba(59, 130, 246, 0.9)';

        if (!reducedMotion) {
          anime({
            targets: targetBranch,
            stroke: [
              { value: flashColor, duration: 150 },
              { value: originalStroke, duration: 150 },
              { value: flashColor, duration: 150 },
              { value: originalStroke, duration: 150 }
            ],
            duration: 600,
            easing: 'easeInOutQuad'
          });
        }

        // 2. Radius spring increases by Δr (Bayesian ΔC)
        const currentWidth = parseFloat(targetBranch.getAttribute('stroke-width') || '2');
        const deltaR = Math.max(0.5, deltaC * 15); // Scale factor for visual impact
        const newWidth = currentWidth + deltaR;

        // Apply spring animation for radius change
        setBranchSpring({
          radius: newWidth / currentWidth,
          onRest: () => {
            targetBranch.setAttribute('stroke-width', String(newWidth));
          }
        });

        if (!reducedMotion) {
          anime({
            targets: targetBranch,
            strokeWidth: newWidth,
            duration: 800,
            easing: 'easeOutElastic(1, .8)',
            delay: 300
          });
        }

        // 3. Bud sprite scales from 0 → 1 and turns into icon
        const budId = `bud-${event.targetBranchId}-${event.id}`;
        const budContainer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        budContainer.id = budId;
        budContainer.setAttribute('class', 'evidence-bud');
        
        // Position bud near the branch
        const branchRect = targetBranch.getBoundingClientRect();
        const svgRect = svgRef.current.getBoundingClientRect();
        const x = branchRect.x - svgRect.x + branchRect.width * 0.7;
        const y = branchRect.y - svgRect.y + branchRect.height * 0.5;
        
        budContainer.setAttribute('transform', `translate(${x}, ${y})`);

        // Create bud sprite
        const budSprite = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        budSprite.setAttribute('rx', '4');
        budSprite.setAttribute('ry', '6');
        budSprite.setAttribute('fill', '#90EE90');
        budSprite.setAttribute('stroke', '#228B22');
        budSprite.setAttribute('stroke-width', '1');
        budSprite.setAttribute('transform', 'scale(0)');

        budContainer.appendChild(budSprite);
        svgRef.current.appendChild(budContainer);

        // Animate bud scaling
        if (!reducedMotion) {
          anime({
            targets: budSprite,
            scale: [0, 1.3, 1],
            duration: 1000,
            delay: 600,
            easing: 'easeOutBounce',
            complete: () => {
              // Transform into icon based on evidence type
              const iconPath = event.evidenceType === 'supportive' ? 
                'M0,-8 Q-4,-4 0,0 Q4,-4 0,-8' : // Leaf shape
                'M0,-6 Q-3,-3 0,0 Q3,-3 0,-6';   // Smaller fruit shape

              const icon = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              icon.setAttribute('d', iconPath);
              icon.setAttribute('fill', event.evidenceType === 'supportive' ? '#32CD32' : '#FF6B6B');
              icon.setAttribute('stroke', '#228B22');
              icon.setAttribute('stroke-width', '1');

              budContainer.replaceChild(icon, budSprite);
              
              // Add quality indicator
              if (event.quality === 'high') {
                const qualityIndicator = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                qualityIndicator.setAttribute('r', '2');
                qualityIndicator.setAttribute('fill', '#FFD700');
                qualityIndicator.setAttribute('cx', '6');
                qualityIndicator.setAttribute('cy', '-6');
                budContainer.appendChild(qualityIndicator);
              }
            }
          });
        }

        // Update backend with new confidence data - TreeDataService temporarily disabled
        // const currentTreeId = treeDataService.getCurrentTreeId();
        // if (currentTreeId) {
        //   await treeDataService.updateNodeBotanicalMetadata(currentTreeId, event.targetBranchId, {
        //     evidence_count: (branchNode.metadata?.evidence_count || 0) + 1,
        //     confidence_delta: deltaC,
        //     impact_score: confidenceResult.metadata.evidence_count > 0 ? 
        //       confidenceResult.aggregated : branchNode.metadata?.impact_score
        //   });

        //   Log the evidence event
        //   await treeDataService.logTreeEvolution(
        //     currentTreeId,
        //     4,
        //     'evidence_added',
        //     {
        //       evidenceId: event.id,
        //       branchId: event.targetBranchId,
        //       evidenceType: event.evidenceType,
        //       confidence: event.confidence,
        //       quality: event.quality
        //     },
        //     {
        //       confidence_delta: deltaC,
        //       evidence_count: (branchNode.metadata?.evidence_count || 0) + 1,
        //       impact_change: confidenceResult.aggregated
        //     }
        //   );
        // }

        // Notify parent component
        onEvidenceProcessed?.(event, confidenceResult);
      }
    } catch (error) {
      console.error('Error processing evidence event:', error);
    } finally {
      processingRef.current = false;
    }
  }, [graphData, svgRef, onEvidenceProcessed, reducedMotion, setBranchSpring]);

  // Evidence event loop - processes events at 60 FPS
  const evidenceEventLoop = useCallback(() => {
    if (currentStage !== 4 || eventQueueRef.current.length === 0) {
      frameRequestRef.current = requestAnimationFrame(evidenceEventLoop);
      return;
    }

    // Process one event per frame to maintain 60 FPS
    const event = eventQueueRef.current.shift();
    if (event) {
      processEvidenceEvent(event);
    }

    frameRequestRef.current = requestAnimationFrame(evidenceEventLoop);
  }, [currentStage, processEvidenceEvent]);

  // Start/stop evidence event loop
  useEffect(() => {
    if (currentStage === 4) {
      frameRequestRef.current = requestAnimationFrame(evidenceEventLoop);
    }

    return () => {
      if (frameRequestRef.current) {
        cancelAnimationFrame(frameRequestRef.current);
      }
    };
  }, [currentStage, evidenceEventLoop]);

  // Public API to add evidence events
  const addEvidenceEvent = useCallback((event: Omit<EvidenceEvent, 'id' | 'timestamp'>) => {
    const fullEvent: EvidenceEvent = {
      ...event,
      id: `evidence-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    eventQueueRef.current.push(fullEvent);
  }, []);

  // Simulate evidence events for testing
  const simulateEvidenceEvents = useCallback(() => {
    if (currentStage !== 4) return;

    const branchNodes = graphData.nodes.filter((n: GraphNode) => n.type === 'hypothesis');
    
    branchNodes.forEach((branch: GraphNode, index: number) => {
      setTimeout(() => {
        addEvidenceEvent({
          targetBranchId: branch.id,
          evidenceType: Math.random() > 0.3 ? 'supportive' : 'contradictory',
          evidenceNode: {
            id: `evidence-${branch.id}-${index}`,
            label: `Evidence for ${branch.label}`,
            type: 'evidence',
            confidence: [0.8, 0.7, 0.9, 0.6],
            metadata: {
              evidence_quality: Math.random() > 0.5 ? 'high' : 'medium',
              statistical_power: Math.random() * 0.5 + 0.5,
              peer_review_status: 'peer-reviewed'
            }
          },
          supportingEdges: [],
          confidence: Math.random() * 0.4 + 0.6,
          quality: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'
        });
      }, index * 2000); // Stagger events every 2 seconds
    });
  }, [currentStage, graphData, addEvidenceEvent]);

  // Auto-start simulation when entering Stage 4
  useEffect(() => {
    if (currentStage === 4) {
      const timeout = setTimeout(simulateEvidenceEvents, 1000);
      return () => clearTimeout(timeout);
    }
  }, [currentStage, simulateEvidenceEvents]);

  // Return JSX component instead of object
  return (
    <div className="evidence-event-system">
      <div className="sr-only">
        Evidence Event System - Stage {currentStage}
        {eventQueueRef.current.length > 0 && (
          <span>Processing {eventQueueRef.current.length} evidence events</span>
        )}
      </div>
    </div>
  );
};
