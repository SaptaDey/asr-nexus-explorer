/**
 * BotanicalElements.tsx - Individual botanical element rendering with animations
 * Handles detailed rendering of leaves, buds, blossoms with interactions
 */

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSpring, animated, config } from '@react-spring/three';
import * as THREE from 'three';
import { BotanicalElement } from '@/hooks/useGraphToTree';

interface BotanicalElementsProps {
  elements?: BotanicalElement[];
  animations?: {
    buds?: unknown[];
    leaves?: unknown[];
    blossoms?: unknown[];
  };
  currentStage: number;
  performanceLevel: 'high' | 'medium' | 'low';
  reducedMotion: boolean;
  onElementClick?: (stage: number) => void;
}

export const BotanicalElements: React.FC<BotanicalElementsProps> = ({
  elements,
  animations,
  currentStage,
  performanceLevel,
  reducedMotion,
  onElementClick
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  // Filter elements by type for organized rendering
  const elementsByType = useMemo(() => {
    const safeElements = elements || [];
    return {
      buds: safeElements.filter(e => e?.type === 'bud'),
      leaves: safeElements.filter(e => e?.type === 'leaf'),
      blossoms: safeElements.filter(e => e?.type === 'blossom'),
      rootlets: safeElements.filter(e => e?.type === 'rootlet'),
      branches: safeElements.filter(e => e?.type === 'branch')
    };
  }, [elements]);

  // Performance-based LOD calculations with device capability detection
  const lodSettings = useMemo(() => {
    const deviceMemory = (navigator as { deviceMemory?: number }).deviceMemory || 4;
    const isLowEndDevice = deviceMemory < 4;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    const settings = {
      high: { 
        maxElements: isLowEndDevice ? 200 : 500, 
        detailLevel: 16, 
        enableShadows: true,
        instancedBuds: true,
        instancedBlossoms: true
      },
      medium: { 
        maxElements: isLowEndDevice ? 100 : 300, 
        detailLevel: 12, 
        enableShadows: !isMobile,
        instancedBuds: true,
        instancedBlossoms: false
      },
      low: { 
        maxElements: isLowEndDevice ? 50 : 150, 
        detailLevel: 8, 
        enableShadows: false,
        instancedBuds: false,
        instancedBlossoms: false
      }
    };
    return settings[performanceLevel];
  }, [performanceLevel]);

  return (
    <group ref={groupRef}>
      {/* Evidence Buds - Stage 4+ */}
      {currentStage >= 4 && (
        <group name="evidence-buds">
          {lodSettings.instancedBuds ? (
            <InstancedBuds
              elements={elementsByType.buds}
              animations={animations?.buds}
              performanceLevel={performanceLevel}
              reducedMotion={reducedMotion}
              maxInstances={lodSettings.maxElements}
              onElementClick={onElementClick}
            />
          ) : (
            elementsByType.buds.slice(0, lodSettings.maxElements).map((element, index) => (
              <EvidenceBud
                key={element.id}
                element={element}
                index={index}
                animation={animations?.buds?.[index]}
                performanceLevel={performanceLevel}
                reducedMotion={reducedMotion}
                isHovered={hoveredElement === element.id}
                onHover={setHoveredElement}
                onClick={onElementClick}
              />
            ))
          )}
        </group>
      )}

      {/* Knowledge Leaves - Stage 6+ */}
      {currentStage >= 6 && (
        <group name="knowledge-leaves">
          <InstancedLeaves
            elements={elementsByType.leaves}
            animations={animations?.leaves}
            performanceLevel={performanceLevel}
            reducedMotion={reducedMotion}
            maxInstances={lodSettings.maxElements}
            onElementClick={onElementClick}
          />
        </group>
      )}

      {/* Synthesis Blossoms - Stage 7+ */}
      {currentStage >= 7 && (
        <group name="synthesis-blossoms">
          {elementsByType.blossoms.slice(0, lodSettings.maxElements).map((element, index) => (
            <SynthesisBlossom
              key={element.id}
              element={element}
              index={index}
              animation={animations?.blossoms?.[index]}
              performanceLevel={performanceLevel}
              reducedMotion={reducedMotion}
              isHovered={hoveredElement === element.id}
              onHover={setHoveredElement}
              onClick={onElementClick}
            />
          ))}
        </group>
      )}

      {/* Interactive Hotspots */}
      <InteractiveHotspots
        elements={elements}
        currentStage={currentStage}
        hoveredElement={hoveredElement}
        onElementClick={onElementClick}
      />
    </group>
  );
};

// Evidence Bud Component
const EvidenceBud: React.FC<{
  element: BotanicalElement;
  index: number;
  animation: { scale?: [number, number, number]; pulse?: number } | undefined;
  performanceLevel: 'high' | 'medium' | 'low';
  reducedMotion: boolean;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onClick?: (stage: number) => void;
}> = ({ element, index, animation, performanceLevel, reducedMotion, isHovered, onHover, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [pulsePhase, setPulsePhase] = useState(Math.random() * Math.PI * 2);

  // Base bud animation with safe defaults
  const { scale, emissiveIntensity } = useSpring({
    scale: animation?.scale || [0.8, 0.8, 0.8],
    emissiveIntensity: isHovered ? 0.4 : 0.2,
    config: config.wobbly
  });

  // Pulse animation for evidence arrival
  useFrame(({ clock }) => {
    if (meshRef.current && !reducedMotion) {
      const time = clock.getElapsedTime();
      const pulse = Math.sin(time * 2 + pulsePhase) * 0.1 + 1;
      meshRef.current.scale.setScalar(pulse);
      
      // Evidence quality glow
      const evidenceQuality = element.confidence;
      const glowIntensity = evidenceQuality * 0.3 + 0.1;
      (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = glowIntensity;
    }
  });

  // Geometry based on performance level
  const geometry = useMemo(() => {
    const segments = performanceLevel === 'high' ? 12 : performanceLevel === 'medium' ? 8 : 6;
    return new THREE.SphereGeometry(0.2, segments, segments);
  }, [performanceLevel]);

  return (
    <animated.mesh
      ref={meshRef}
      position={element.position}
      scale={scale}
      geometry={geometry}
      onPointerOver={() => onHover(element.id)}
      onPointerOut={() => onHover(null)}
      onClick={() => onClick?.(4)}
    >
      <meshStandardMaterial
        color={element.color}
        emissive={element.color}
        emissiveIntensity={emissiveIntensity}
        roughness={0.6}
        metalness={0.1}
      />
    </animated.mesh>
  );
};

// Instanced Leaves Component for Performance
const InstancedLeaves: React.FC<{
  elements: BotanicalElement[];
  animations: unknown[] | undefined;
  performanceLevel: 'high' | 'medium' | 'low';
  reducedMotion: boolean;
  maxInstances: number;
  onElementClick?: (stage: number) => void;
}> = ({ elements, animations, performanceLevel, reducedMotion, maxInstances, onElementClick }) => {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const [leafData, setLeafData] = useState<Float32Array[]>([]);

  // Create leaf geometry based on performance
  const leafGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(0.6, 0.9, 1, 1);
  }, []);

  // Setup instanced matrices
  useEffect(() => {
    if (!instancedMeshRef.current || elements.length === 0) return;

    const instanceCount = Math.min(elements.length, maxInstances);
    const dummy = new THREE.Object3D();
    const colorArray = new Float32Array(instanceCount * 3);

    for (let i = 0; i < instanceCount; i++) {
      const element = elements[i];
      
      // Position with wind sway
      dummy.position.set(
        element.position[0] + Math.sin(i * 0.1) * 0.2,
        element.position[1] + Math.cos(i * 0.15) * 0.1,
        element.position[2] + Math.sin(i * 0.08) * 0.3
      );

      // Natural leaf orientation
      dummy.rotation.set(
        Math.random() * 0.3 - 0.15,
        Math.random() * Math.PI,
        Math.random() * 0.2 - 0.1
      );

      // Scale based on impact score
      const scale = 0.5 + element.impactScore * 0.8;
      dummy.scale.set(scale, scale, scale);

      dummy.updateMatrix();
      instancedMeshRef.current.setMatrixAt(i, dummy.matrix);

      // Color based on element color
      const color = new THREE.Color(element.color);
      colorArray[i * 3] = color.r;
      colorArray[i * 3 + 1] = color.g;
      colorArray[i * 3 + 2] = color.b;
    }

    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    
    // Set color attribute
    const colorAttribute = new THREE.InstancedBufferAttribute(colorArray, 3);
    instancedMeshRef.current.geometry.setAttribute('instanceColor', colorAttribute);
    
    setLeafData([colorArray]);
  }, [elements, maxInstances]);

  // Wind animation
  useFrame(({ clock }) => {
    if (!instancedMeshRef.current || reducedMotion) return;

    const time = clock.getElapsedTime();
    const dummy = new THREE.Object3D();
    
    for (let i = 0; i < Math.min(elements.length, maxInstances); i++) {
      const element = elements[i];
      
      // Wind sway
      const windStrength = 0.02;
      const windX = Math.sin(time * 0.5 + i * 0.1) * windStrength;
      const windZ = Math.cos(time * 0.3 + i * 0.08) * windStrength;
      
      dummy.position.set(
        element.position[0] + windX,
        element.position[1],
        element.position[2] + windZ
      );
      
      dummy.rotation.set(
        windX * 2,
        Math.random() * Math.PI,
        windZ * 3
      );
      
      const scale = 0.5 + element.impactScore * 0.8;
      dummy.scale.set(scale, scale, scale);
      
      dummy.updateMatrix();
      instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  });

  const leafMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#228B22',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      roughness: 0.8,
      metalness: 0.1,
      vertexColors: true
    });
  }, []);

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[leafGeometry, leafMaterial, Math.min(elements.length, maxInstances)]}
      onClick={() => onElementClick?.(6)}
    />
  );
};

// Instanced Buds Component for Performance
const InstancedBuds: React.FC<{
  elements: BotanicalElement[];
  animations: unknown[] | undefined;
  performanceLevel: 'high' | 'medium' | 'low';
  reducedMotion: boolean;
  maxInstances: number;
  onElementClick?: (stage: number) => void;
}> = ({ elements, animations, performanceLevel, reducedMotion, maxInstances, onElementClick }) => {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const [budData, setBudData] = useState<Float32Array[]>([]);

  // Create bud geometry based on performance
  const budGeometry = useMemo(() => {
    const segments = performanceLevel === 'high' ? 12 : performanceLevel === 'medium' ? 8 : 6;
    return new THREE.SphereGeometry(0.2, segments, segments);
  }, [performanceLevel]);

  // Setup instanced matrices
  useEffect(() => {
    if (!instancedMeshRef.current || elements.length === 0) return;

    const instanceCount = Math.min(elements.length, maxInstances);
    const dummy = new THREE.Object3D();
    const colorArray = new Float32Array(instanceCount * 3);
    const scaleArray = new Float32Array(instanceCount);

    for (let i = 0; i < instanceCount; i++) {
      const element = elements[i];
      
      // Position with slight randomization
      dummy.position.set(
        element.position[0] + (Math.random() - 0.5) * 0.1,
        element.position[1] + (Math.random() - 0.5) * 0.1,
        element.position[2] + (Math.random() - 0.5) * 0.1
      );

      // Random orientation
      dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      // Scale based on confidence
      const scale = 0.8 + element.confidence * 0.4;
      dummy.scale.set(scale, scale, scale);
      scaleArray[i] = scale;

      dummy.updateMatrix();
      instancedMeshRef.current.setMatrixAt(i, dummy.matrix);

      // Color based on element color with evidence quality
      const color = new THREE.Color(element.color);
      const evidenceMultiplier = 0.7 + element.evidenceCount * 0.1;
      color.multiplyScalar(evidenceMultiplier);
      
      colorArray[i * 3] = color.r;
      colorArray[i * 3 + 1] = color.g;
      colorArray[i * 3 + 2] = color.b;
    }

    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    
    // Set attributes
    const colorAttribute = new THREE.InstancedBufferAttribute(colorArray, 3);
    const scaleAttribute = new THREE.InstancedBufferAttribute(scaleArray, 1);
    instancedMeshRef.current.geometry.setAttribute('instanceColor', colorAttribute);
    instancedMeshRef.current.geometry.setAttribute('instanceScale', scaleAttribute);
    
    setBudData([colorArray, scaleArray]);
  }, [elements, maxInstances]);

  // Pulse animation for evidence arrival
  useFrame(({ clock }) => {
    if (!instancedMeshRef.current || reducedMotion) return;

    const time = clock.getElapsedTime();
    const dummy = new THREE.Object3D();
    
    for (let i = 0; i < Math.min(elements.length, maxInstances); i++) {
      const element = elements[i];
      
      // Evidence pulse effect
      const pulsePhase = time * 2 + i * 0.3;
      const pulse = Math.sin(pulsePhase) * 0.1 + 1;
      const evidencePulse = element.evidenceCount > 0 ? pulse : 1;
      
      dummy.position.set(
        element.position[0],
        element.position[1],
        element.position[2]
      );
      
      dummy.rotation.set(
        Math.sin(time * 0.3 + i * 0.1) * 0.1,
        time * 0.2 + i * 0.05,
        Math.cos(time * 0.25 + i * 0.08) * 0.1
      );
      
      const baseScale = 0.8 + element.confidence * 0.4;
      const finalScale = baseScale * evidencePulse;
      dummy.scale.set(finalScale, finalScale, finalScale);
      
      dummy.updateMatrix();
      instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  });

  const budMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#32CD32',
      roughness: 0.6,
      metalness: 0.1,
      transparent: true,
      opacity: 0.9,
      vertexColors: true,
      emissive: '#228B22',
      emissiveIntensity: 0.2
    });
  }, []);

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[budGeometry, budMaterial, Math.min(elements.length, maxInstances)]}
      onClick={() => onElementClick?.(4)}
    />
  );
};

// Synthesis Blossom Component
const SynthesisBlossom: React.FC<{
  element: BotanicalElement;
  index: number;
  animation: { scale?: [number, number, number]; petalSpread?: number } | undefined;
  performanceLevel: 'high' | 'medium' | 'low';
  reducedMotion: boolean;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onClick?: (stage: number) => void;
}> = ({ element, index, animation, performanceLevel, reducedMotion, isHovered, onHover, onClick }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [bloomPhase, setBloomPhase] = useState(0);

  // Blossom opening animation
  const { scale, petalSpread, centerGlow } = useSpring({
    scale: animation?.scale || [1, 1, 1],
    petalSpread: animation?.petalSpread || 1,
    centerGlow: isHovered ? 0.6 : 0.3,
    config: { duration: 800 }
  });

  // Bloom progression
  useFrame(({ clock }) => {
    if (!reducedMotion && groupRef.current) {
      const time = clock.getElapsedTime();
      setBloomPhase(Math.sin(time * 0.5 + index * 0.3) * 0.5 + 0.5);
    }
  });

  // Petal geometry
  const petalGeometry = useMemo(() => {
    const segments = performanceLevel === 'high' ? 12 : 8;
    return new THREE.PlaneGeometry(0.4, 0.7, 1, segments);
  }, [performanceLevel]);

  const petals = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      angle: (i / 6) * Math.PI * 2,
      offset: i * 0.05,
      scale: 0.8 + (i % 2) * 0.2
    }));
  }, []);

  return (
    <animated.group
      ref={groupRef}
      position={element.position}
      scale={scale}
      onPointerOver={() => onHover(element.id)}
      onPointerOut={() => onHover(null)}
      onClick={() => onClick?.(7)}
    >
      {/* Flower center */}
      <mesh>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFA500"
          emissiveIntensity={centerGlow}
          roughness={0.4}
        />
      </mesh>

      {/* Petals */}
      {petals.map((petal, i) => (
        <animated.mesh
          key={i}
          geometry={petalGeometry}
          position={[
            Math.cos(petal.angle) * 0.3 * petalSpread,
            0.1,
            Math.sin(petal.angle) * 0.3 * petalSpread
          ]}
          rotation={[
            -Math.PI / 6,
            petal.angle,
            Math.sin(bloomPhase * Math.PI + petal.offset) * 0.1
          ]}
          scale={petalSpread.to(s => [s * petal.scale, s * petal.scale, s])}
        >
          <meshStandardMaterial
            color={element.color}
            side={THREE.DoubleSide}
            transparent={true}
            opacity={0.8}
            roughness={0.6}
          />
        </animated.mesh>
      ))}

      {/* Synthesis insight particles */}
      {performanceLevel === 'high' && (
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.05, 6, 6]} />
          <meshBasicMaterial
            color="#FFFFFF"
            transparent
            opacity={bloomPhase * 0.8}
          />
        </mesh>
      )}
    </animated.group>
  );
};

// Interactive Hotspots for Accessibility
const InteractiveHotspots: React.FC<{
  elements: BotanicalElement[];
  currentStage: number;
  hoveredElement: string | null;
  onElementClick?: (stage: number) => void;
}> = ({ elements, currentStage, hoveredElement, onElementClick }) => {
  const hotspotElements = useMemo(() => {
    return elements.filter(e => e.evidenceCount > 0 || e.impactScore > 0.7);
  }, [elements]);

  return (
    <group name="interactive-hotspots">
      {hotspotElements.map((element) => (
        <mesh
          key={`hotspot-${element.id}`}
          position={element.position}
          visible={hoveredElement === element.id}
          onClick={() => onElementClick?.(currentStage)}
        >
          <ringGeometry args={[0.3, 0.4, 8]} />
          <meshBasicMaterial
            color="#FFFFFF"
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};

export default BotanicalElements;