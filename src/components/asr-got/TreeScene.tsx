
/**
 * TreeScene.tsx - React Three Fiber WebGL botanical tree visualization
 * Implements the complete tree_view_implementation.md specification
 */

import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Stats, PerformanceMonitor } from '@react-three/drei';
import { useSpring, animated, config } from '@react-spring/three';
import * as THREE from 'three';
import { useGraphToTree } from '@/hooks/useGraphToTree';
import { ProceduralTree } from './ProceduralTree';
import { PollenSystem } from './PollenSystem';
import { BotanicalElements } from './BotanicalElements';
import { GraphData } from '@/types/asrGotTypes';

interface TreeSceneProps {
  graphData: GraphData;
  currentStage: number;
  isProcessing: boolean;
  onStageSelect?: (stage: number) => void;
  reducedMotion?: boolean;
}

interface TreeSceneState {
  performanceLevel: 'high' | 'medium' | 'low';
  drawCalls: number;
  frameTime: number;
  memoryUsage: number;
}

// Main Tree Scene Component
export const TreeScene: React.FC<TreeSceneProps> = ({
  graphData,
  currentStage,
  isProcessing,
  onStageSelect,
  reducedMotion = false
}) => {
  const [sceneState, setSceneState] = useState<TreeSceneState>({
    performanceLevel: 'high',
    drawCalls: 0,
    frameTime: 0,
    memoryUsage: 0
  });

  // Transform graph data to tree hierarchy with safe defaults
  const { treeData, botanicalElements, animations } = useGraphToTree(graphData, currentStage);
  
  // Ensure we have valid data structures
  const safeBotanicalElements = botanicalElements || [];
  const safeAnimations = animations || {};

  // Handle performance monitoring
  const handlePerformanceChange = (api: any) => {
    const { gl } = api;
    const info = gl.info;
    
    setSceneState(prev => ({
      ...prev,
      drawCalls: info.render.calls,
      frameTime: api.clock.getDelta() * 1000,
      memoryUsage: (navigator as any).deviceMemory || 4
    }));

    // Auto-adjust performance level
    if (api.clock.getDelta() > 0.016) { // >16ms = <60 FPS
      setSceneState(prev => ({
        ...prev,
        performanceLevel: prev.performanceLevel === 'high' ? 'medium' : 'low'
      }));
    }
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-sky-200 to-green-100">
      {/* WebGL Canvas */}
      <Canvas
        camera={{
          position: [0, 10, 20],
          fov: 45,
          near: 0.1,
          far: 1000
        }}
        shadows
        dpr={sceneState.performanceLevel === 'high' ? [1, 2] : [0.5, 1]}
        performance={{ min: 0.5 }}
        gl={{
          antialias: sceneState.performanceLevel !== 'low',
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false
        }}
      >
        {/* Performance Monitoring */}
        <PerformanceMonitor 
          onIncline={handlePerformanceChange}
          onDecline={handlePerformanceChange}
          flipflops={3}
          factor={0.5}
        />

        {/* Lighting Setup */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <pointLight position={[0, 15, 0]} intensity={0.5} color="#FFE4B5" />

        {/* Environment */}
        <Environment preset="park" background={false} />

        {/* Ground Plane */}
        <mesh receiveShadow position={[0, -0.5, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#8B4513" opacity={0.3} transparent />
        </mesh>

        {/* Main Tree with Suspense */}
        <Suspense fallback={<TreeLoadingFallback />}>
          <BotanicalTreeGroup
            treeData={treeData}
            botanicalElements={safeBotanicalElements}
            animations={safeAnimations}
            currentStage={currentStage}
            performanceLevel={sceneState.performanceLevel}
            reducedMotion={reducedMotion}
            onStageSelect={onStageSelect}
          />
        </Suspense>

        {/* Pollen Particle System */}
        {currentStage >= 8 && (
          <Suspense fallback={null}>
            <PollenSystem
              checklistResults={[]}
              performanceLevel={sceneState.performanceLevel}
              reducedMotion={reducedMotion}
            />
          </Suspense>
        )}

        {/* Camera Controls - Fixed props */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          keyPanSpeed={7.0}
          minDistance={5}
          maxDistance={50}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2}
          autoRotate={!isProcessing && !reducedMotion}
          autoRotateSpeed={0.5}
          makeDefault
        />

        {/* Debug Stats (dev mode only) */}
        {process.env.NODE_ENV === 'development' && <Stats />}
      </Canvas>

      {/* Performance Overlay */}
      <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg text-xs">
        <div>FPS: {Math.round(1000 / (sceneState.frameTime || 16.67))}</div>
        <div>Draw Calls: {sceneState.drawCalls}</div>
        <div>Performance: {sceneState.performanceLevel}</div>
        <div>Stage: {currentStage}/9</div>
      </div>

      {/* Stage Progress Indicator with Accessibility */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-black/60 text-white px-4 py-2 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-semibold" id="stage-label">
              {getStageLabel(currentStage)}
            </span>
            <span className="text-sm opacity-75" aria-live="polite">
              {isProcessing ? 'Growing...' : 'Complete'}
            </span>
          </div>
          <div 
            className="w-full bg-gray-700 rounded-full h-2 mt-2"
            role="progressbar"
            aria-labelledby="stage-label"
            aria-valuenow={currentStage}
            aria-valuemin={1}
            aria-valuemax={9}
            aria-valuetext={`Stage ${currentStage} of 9: ${getStageLabel(currentStage)}`}
          >
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentStage / 9) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Screen Reader Announcements */}
      <div 
        className="sr-only" 
        aria-live="assertive" 
        aria-atomic="true"
        role="status"
      >
        {isProcessing && `Research tree is growing. Currently at ${getStageLabel(currentStage)}.`}
        {!isProcessing && `Research tree visualization complete at ${getStageLabel(currentStage)}.`}
      </div>

      {/* Keyboard Navigation Instructions */}
      <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-2 rounded-lg text-xs max-w-xs">
        <div className="font-semibold mb-1">Navigation:</div>
        <div>Mouse: Drag to orbit, scroll to zoom</div>
        <div>Keyboard: Arrow keys to rotate, +/- to zoom</div>
        <div>Click elements for stage details</div>
        {reducedMotion && <div className="text-yellow-300 mt-1">⚡ Reduced motion active</div>}
      </div>
    </div>
  );
};

// Botanical Tree Group Component
const BotanicalTreeGroup: React.FC<{
  treeData: any;
  botanicalElements: any;
  animations: any;
  currentStage: number;
  performanceLevel: 'high' | 'medium' | 'low';
  reducedMotion: boolean;
  onStageSelect?: (stage: number) => void;
}> = ({ 
  treeData, 
  botanicalElements, 
  animations, 
  currentStage, 
  performanceLevel,
  reducedMotion,
  onStageSelect 
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // Root bulb animation (Stage 1)
  const rootAnimation = useSpring({
    scale: currentStage >= 1 ? [1, 1, 1] : [0, 0, 0],
    config: {
      ...config.wobbly,
      duration: reducedMotion ? 100 : 200
    }
  });

  // Tree sway animation - Fixed rotation type
  const { rotation } = useSpring({
    rotation: [0, 0, reducedMotion ? 0 : Math.sin(Date.now() * 0.001) * 0.02] as [number, number, number],
    config: config.gentle,
    loop: !reducedMotion
  });

  // Handle window focus/blur for performance
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (groupRef.current) {
        groupRef.current.visible = !document.hidden;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <animated.group ref={groupRef} rotation={rotation}>
      {/* Root Bulb (Stage 1) */}
      <animated.group scale={rootAnimation.scale} position={[0, 0, 0]}>
        <mesh castShadow onClick={() => onStageSelect?.(1)}>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshStandardMaterial 
            color="#8B4513" 
            roughness={0.8}
          />
        </mesh>
      </animated.group>

      {/* Procedural Tree Structure */}
      <ProceduralTree
        treeData={treeData}
        botanicalElements={botanicalElements}
        currentStage={currentStage}
        performanceLevel={performanceLevel}
        reducedMotion={reducedMotion}
        onStageSelect={onStageSelect}
      />

      {/* Botanical Elements (Leaves, Blossoms, etc.) */}
      <BotanicalElements
        elements={botanicalElements}
        animations={animations}
        currentStage={currentStage}
        performanceLevel={performanceLevel}
        reducedMotion={reducedMotion}
        onElementClick={onStageSelect}
      />
    </animated.group>
  );
};

// Loading Fallback Component
const TreeLoadingFallback: React.FC = () => (
  <mesh position={[0, 0, 0]}>
    <sphereGeometry args={[0.5, 8, 8]} />
    <meshBasicMaterial color="#8B4513" wireframe />
  </mesh>
);

// Helper function for stage labels
const getStageLabel = (stage: number): string => {
  const labels = {
    1: '🌰 Root Formation',
    2: '🌱 Rootlet Growth', 
    3: '🌿 Branch Development',
    4: '🌾 Evidence Collection',
    5: '🍂 Pruning & Merging',
    6: '🍃 Leaf Canopy',
    7: '🌸 Blossom Opening',
    8: '✨ Pollen Release',
    9: '🌳 Complete Tree'
  };
  return labels[stage as keyof typeof labels] || 'Growing...';
};

export default TreeScene;
