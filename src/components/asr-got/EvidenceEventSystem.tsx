/**
 * EvidenceEventSystem.tsx - Simplified evidence event system
 */

import React from 'react';

interface EvidenceEventSystemProps {
  currentStage: number;
  graphData: any;
  svgRef: React.RefObject<SVGSVGElement>;
  onEvidenceProcessed?: (event: any) => void;
  reducedMotion?: boolean;
}

export const EvidenceEventSystem: React.FC<EvidenceEventSystemProps> = ({
  currentStage,
  graphData,
  svgRef,
  onEvidenceProcessed,
  reducedMotion = false
}) => {
  return (
    <div className="evidence-event-system">
      <div className="stage-indicator">
        Current Stage: {currentStage}
      </div>
    </div>
  );
};