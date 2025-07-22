/**
 * BotanicalTreeController.tsx - Master controller for algorithmic animation timeline
 * Coordinates all stage-specific animations with backend integration
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TreeContainer } from './TreeContainer';
import { EvidenceEventSystem } from './EvidenceEventSystem';
import { AlgorithmicAnimationTimeline } from './AlgorithmicAnimationTimeline';
import { useTreeDataService } from '@/hooks/useTreeDataService';
import { GraphData } from '@/types/asrGotTypes';

interface BotanicalTreeControllerProps {
  graphData: GraphData;
  currentStage: number;
  isProcessing: boolean;
  onStageSelect?: (stage: number) => void;
  userId?: string;
  researchTopic?: string;
}

interface AnimationState {
  stage: number;
  isAnimating: boolean;
  completedStages: Set<number>;
  evidenceEvents: number;
  checklistItems: any[];
}

export const BotanicalTreeController: React.FC<BotanicalTreeControllerProps> = ({
  graphData,
  currentStage,
  isProcessing,
  onStageSelect,
  userId,
  researchTopic
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [animationState, setAnimationState] = useState<AnimationState>({
    stage: currentStage,
    isAnimating: false,
    completedStages: new Set(),
    evidenceEvents: 0,
    checklistItems: []
  });

  // Tree data service for backend integration
  const {
    treeState,
    saveTree,
    loadTree,
    updateNodeMetadata,
    subscribeToUpdates,
    unsubscribeFromUpdates,
    isLoading,
    error
  } = useTreeDataService();

  // Stage-specific animation handlers
  const stageAnimationHandlers = {
    1: useCallback(() => {
      // Stage 1: Instant root placement
      console.log('Stage 1: Root placement - instant');
      setAnimationState(prev => ({
        ...prev,
        completedStages: new Set([...prev.completedStages, 1])
      }));
    }, []),

    2: useCallback(() => {
      // Stage 2: Rootlet trail with easeInOutBack
      console.log('Stage 2: Rootlet trail sequence starting');
      setAnimationState(prev => ({ ...prev, isAnimating: true }));
      
      // Completion handled by AlgorithmicAnimationTimeline
      setTimeout(() => {
        setAnimationState(prev => ({
          ...prev,
          isAnimating: false,
          completedStages: new Set([...prev.completedStages, 2])
        }));
      }, 1500); // Duration based on trail animation
    }, []),

    3: useCallback(() => {
      // Stage 3: Anime.js stroke-dashoffset → react-spring thickness
      console.log('Stage 3: Branch growth sequence starting');
      setAnimationState(prev => ({ ...prev, isAnimating: true }));
      
      // Animation completion handled by AlgorithmicAnimationTimeline
    }, []),

    4: useCallback(() => {
      // Stage 4: Evidence event loop
      console.log('Stage 4: Evidence event loop activated');
      setAnimationState(prev => ({ ...prev, isAnimating: true }));
      
      // Evidence events handled by EvidenceEventSystem
    }, []),

    5: useCallback(() => {
      // Stage 5: Pruning and merging
      console.log('Stage 5: Pruning and merging sequence');
      setAnimationState(prev => ({ ...prev, isAnimating: true }));
      
      setTimeout(() => {
        setAnimationState(prev => ({
          ...prev,
          isAnimating: false,
          completedStages: new Set([...prev.completedStages, 5])
        }));
      }, 1000);
    }, []),

    6: useCallback(() => {
      // Stage 6: Leaf canopy with friction 80 jitter
      console.log('Stage 6: Leaf canopy emergence');
      setAnimationState(prev => ({ ...prev, isAnimating: true }));
      
      setTimeout(() => {
        setAnimationState(prev => ({
          ...prev,
          isAnimating: false,
          completedStages: new Set([...prev.completedStages, 6])
        }));
      }, 2000);
    }, []),

    7: useCallback(() => {
      // Stage 7: Blossom opening with 800ms SVG morph
      console.log('Stage 7: Blossom opening sequence');
      setAnimationState(prev => ({ ...prev, isAnimating: true }));
      
      setTimeout(() => {
        setAnimationState(prev => ({
          ...prev,
          isAnimating: false,
          completedStages: new Set([...prev.completedStages, 7])
        }));
      }, 800);
    }, []),

    8: useCallback(() => {
      // Stage 8: Pollen particles and branch shaking
      console.log('Stage 8: Reflection and audit sequence');
      setAnimationState(prev => ({ ...prev, isAnimating: true }));
      
      // Generate checklist items for testing
      const checklistItems = [
        { id: 'bias_check_1', passed: true, type: 'bias_check', message: 'No selection bias detected' },
        { id: 'bias_check_2', passed: false, type: 'bias_check', message: 'Potential confirmation bias' },
        { id: 'quality_check_1', passed: true, type: 'quality_check', message: 'High statistical power' },
        { id: 'methodology_check_1', passed: true, type: 'methodology_check', message: 'Robust methodology' }
      ];
      
      setAnimationState(prev => ({
        ...prev,
        checklistItems,
        completedStages: new Set([...prev.completedStages, 8])
      }));
      
      setTimeout(() => {
        setAnimationState(prev => ({ ...prev, isAnimating: false }));
      }, 3000);
    }, [])
  };

  // Handle stage transitions
  useEffect(() => {
    if (currentStage !== animationState.stage) {
      setAnimationState(prev => ({ ...prev, stage: currentStage }));
      
      // Trigger stage-specific animation
      const handler = stageAnimationHandlers[currentStage as keyof typeof stageAnimationHandlers];
      if (handler) {
        handler();
      }
    }
  }, [currentStage, animationState.stage, stageAnimationHandlers]);

  // Handle animation completion
  const handleAnimationComplete = useCallback((stage: number) => {
    console.log(`Animation completed for stage ${stage}`);
    setAnimationState(prev => ({
      ...prev,
      completedStages: new Set([...prev.completedStages, stage]),
      isAnimating: false
    }));
  }, []);

  // Handle evidence processing
  const handleEvidenceProcessed = useCallback((event: any, result: any) => {
    console.log('Evidence processed:', event, result);
    setAnimationState(prev => ({
      ...prev,
      evidenceEvents: prev.evidenceEvents + 1
    }));
    
    // Update backend with evidence data
    if (userId && researchTopic) {
      updateNodeMetadata(event.targetBranchId, {
        evidence_count: (result.metadata?.evidence_count || 0) + 1,
        confidence_delta: result.metadata?.confidence_delta || 0,
        impact_score: result.aggregated
      });
    }
  }, [userId, researchTopic, updateNodeMetadata]);

  // Auto-save tree state on significant changes
  useEffect(() => {
    if (userId && researchTopic && graphData.nodes.length > 0) {
      const autoSave = setTimeout(() => {
        saveTree(userId, researchTopic, currentStage, graphData);
      }, 2000); // Debounce auto-save

      return () => clearTimeout(autoSave);
    }
  }, [userId, researchTopic, graphData, currentStage, saveTree]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (treeState?.id) {
      subscribeToUpdates(treeState.id);
    }
    
    return () => {
      unsubscribeFromUpdates();
    };
  }, [treeState?.id, subscribeToUpdates, unsubscribeFromUpdates]);

  return (
    <div className="relative w-full h-full">
      {/* Main tree container */}
      <TreeContainer
        graphData={graphData}
        currentStage={currentStage}
        isProcessing={isProcessing || animationState.isAnimating}
        onStageSelect={onStageSelect}
      />

      {/* Algorithmic animation timeline */}
      <AlgorithmicAnimationTimeline
        currentStage={currentStage}
        graphData={graphData}
        svgRef={svgRef}
        onAnimationComplete={handleAnimationComplete}
      />

      {/* Evidence event system (Stage 4) */}
      {currentStage === 4 && (
        <EvidenceEventSystem
          currentStage={currentStage}
          graphData={graphData}
          svgRef={svgRef}
          onEvidenceProcessed={handleEvidenceProcessed}
        />
      )}

      {/* Animation state overlay */}
      {animationState.isAnimating && (
        <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-2 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm">Stage {currentStage} Animation</span>
          </div>
        </div>
      )}

      {/* Evidence counter (Stage 4) */}
      {currentStage === 4 && animationState.evidenceEvents > 0 && (
        <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg">
          <div className="text-sm font-semibold">
            Evidence Events: {animationState.evidenceEvents}
          </div>
        </div>
      )}

      {/* Checklist display (Stage 8) */}
      {currentStage === 8 && animationState.checklistItems.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-800/90 p-4 rounded-lg shadow-lg max-w-sm">
          <h3 className="font-semibold mb-2">Audit Checklist</h3>
          <div className="space-y-1">
            {animationState.checklistItems.map((item: any) => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <span className={`text-lg ${item.passed ? 'text-green-500' : 'text-red-500'}`}>
                  {item.passed ? '✓' : '✗'}
                </span>
                <span className={item.passed ? 'text-green-700' : 'text-red-700'}>
                  {item.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backend sync indicator */}
      {isLoading && (
        <div className="absolute top-4 right-4 bg-yellow-600 text-white px-3 py-2 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-200 rounded-full animate-bounce"></div>
            <span className="text-sm">Syncing...</span>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="absolute bottom-4 right-4 bg-red-600 text-white px-3 py-2 rounded-lg max-w-sm">
          <div className="text-sm">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}
    </div>
  );
};