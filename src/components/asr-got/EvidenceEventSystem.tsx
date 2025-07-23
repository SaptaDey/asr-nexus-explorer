import React from 'react';

interface EvidenceEvent {
  nodeId: string;
  evidenceType: 'supportive' | 'contradictory' | 'neutral';
  quality: 'high' | 'medium' | 'low';
  timestamp: number;
}

interface EvidenceEventSystemProps {
  treeContainerRef: React.RefObject<HTMLElement>;
  events: EvidenceEvent[];
  isEnabled: boolean;
}

// Simplified component without animations to avoid build errors
export const EvidenceEventSystem: React.FC<EvidenceEventSystemProps> = ({
  treeContainerRef,
  events,
  isEnabled = true
}) => {
  // Temporarily disabled to avoid anime.js import issues
  return null;
};

export default EvidenceEventSystem;