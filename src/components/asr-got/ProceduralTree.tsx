/**
 * ProceduralTree.tsx - Procedural 3D tree generation with realistic botanical elements
 * Implements organic branch growth, bark textures, and cambium rings
 */

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { BotanicalElement } from '@/hooks/useGraphToTreeSimple';

// Register GSAP plugin
gsap.registerPlugin(MotionPathPlugin);

interface ProceduralTreeProps {
  treeData: { each: (callback: (node: TreeNode) => void) => void } | null;
  botanicalElements: BotanicalElement[];
  currentStage: number;
  performanceLevel: 'high' | 'medium' | 'low';
  reducedMotion: boolean;
  onStageSelect?: (stage: number) => void;
}

interface TreeNode {
  parent?: TreeNode;
  botanicalPosition: [number, number, number];
  data: {
    id: string;
    type: string;
    confidence?: number[];
    metadata?: {
      evidence_count?: number;
      disciplinary_tags?: string[];
    };
  };
}

interface BranchSegment {
  id: string;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  radius: number;
  confidence: number;
  evidenceRings: number;
  disciplinaryColor: string;
}

export const ProceduralTree: React.FC<ProceduralTreeProps> = ({
  treeData,
  botanicalElements,
  currentStage,
  performanceLevel,
  reducedMotion,
  onStageSelect
}) => {
  const treeGroupRef = useRef<THREE.Group>(null);
  const [branchSegments, setBranchSegments] = useState<BranchSegment[]>([]);

  // Generate branch segments from tree data
  const generateBranchSegments = useMemo(() => {
    if (!treeData) return [];

    const segments: BranchSegment[] = [];
    
    treeData.each((node: any) => {
      if (node.parent && node.data.type !== 'root') {
        const startPos = new THREE.Vector3(
          node.parent.botanicalPosition[0],
          node.parent.botanicalPosition[1],
          node.parent.botanicalPosition[2]
        );
        
        const endPos = new THREE.Vector3(
          node.botanicalPosition[0],
          node.botanicalPosition[1],
          node.botanicalPosition[2]
        );

        const confidence = node.data.confidence?.[0] || 0.5;
        const evidenceCount = node.data.metadata?.evidence_count || 0;
        const disciplinary = node.data.metadata?.disciplinary_tags?.[0] || 'general';

        segments.push({
          id: node.data.id,
          startPos,
          endPos,
          radius: 0.1 + confidence * 0.3,
          confidence,
          evidenceRings: evidenceCount,
          disciplinaryColor: getDisciplinaryColor(disciplinary)
        });
      }
    });

    return segments;
  }, [treeData]);

  useEffect(() => {
    setBranchSegments(generateBranchSegments);
  }, [generateBranchSegments]);

  return (
    <group ref={treeGroupRef}>
      {/* Rootlets (Stage 2) */}
      {currentStage >= 2 && <RootletSystem 
        elements={botanicalElements.filter(e => e.type === 'rootlet')}
        currentStage={currentStage}
        reducedMotion={reducedMotion}
      />}

      {/* Main Trunk and Branches (Stage 3+) */}
      {currentStage >= 3 && <BranchSystem 
        segments={branchSegments}
        currentStage={currentStage}
        performanceLevel={performanceLevel}
        reducedMotion={reducedMotion}
        onBranchClick={onStageSelect}
      />}

      {/* Evidence Buds (Stage 4) */}
      {currentStage >= 4 && <BudSystem 
        elements={botanicalElements.filter(e => e.type === 'bud')}
        currentStage={currentStage}
        reducedMotion={reducedMotion}
      />}

      {/* Leaf Canopy (Stage 6) */}
      {currentStage >= 6 && <LeafCanopy 
        elements={botanicalElements.filter(e => e.type === 'leaf')}
        performanceLevel={performanceLevel}
        reducedMotion={reducedMotion}
      />}

      {/* Blossoms (Stage 7) */}
      {currentStage >= 7 && <BlossomSystem 
        elements={botanicalElements.filter(e => e.type === 'blossom')}
        currentStage={currentStage}
        reducedMotion={reducedMotion}
      />}
    </group>
  );
};

// Rootlet System Component
const RootletSystem: React.FC<{
  elements: BotanicalElement[];
  currentStage: number;
  reducedMotion: boolean;
}> = ({ elements, currentStage, reducedMotion }) => {
  return (
    <group>
      {elements.map((element, index) => (
        <RootletSpline 
          key={element.id}
          element={element}
          index={index}
          reducedMotion={reducedMotion}
        />
      ))}
    </group>
  );
};

// Individual Rootlet Spline
const RootletSpline: React.FC<{
  element: BotanicalElement;
  index: number;
  reducedMotion: boolean;
}> = ({ element, index, reducedMotion }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const { length, opacity } = useSpring({
    length: element.confidence,
    opacity: 0.8,
    delay: reducedMotion ? 0 : index * 150,
    config: { tension: 170, friction: 26 }
  });

  // Create Bézier curve for organic rootlet shape
  const curve = useMemo(() => {
    const start = new THREE.Vector3(0, 0, 0);
    const end = new THREE.Vector3(
      element.position[0] * 2,
      element.position[1] - 2,
      element.position[2] * 2
    );
    const control1 = new THREE.Vector3(end.x * 0.3, -0.5, end.z * 0.3);
    const control2 = new THREE.Vector3(end.x * 0.7, end.y * 0.5, end.z * 0.7);
    
    return new THREE.CubicBezierCurve3(start, control1, control2, end);
  }, [element.position]);

  const geometry = useMemo(() => {
    const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.05, 8, false);
    return tubeGeometry;
  }, [curve]);

  return (
    <animated.mesh
      ref={meshRef}
      geometry={geometry}
      scale={length.to(l => [l, l, l])}
    >
      <meshStandardMaterial 
        color={element.color}
        roughness={0.8}
        transparent
        opacity={opacity}
      />
    </animated.mesh>
  );
};

// Branch System Component
const BranchSystem: React.FC<{
  segments: BranchSegment[];
  currentStage: number;
  performanceLevel: 'high' | 'medium' | 'low';
  reducedMotion: boolean;
  onBranchClick?: (stage: number) => void;
}> = ({ segments, currentStage, performanceLevel, reducedMotion, onBranchClick }) => {
  return (
    <group>
      {segments.map((segment, index) => (
        <BranchSegment 
          key={segment.id}
          segment={segment}
          index={index}
          performanceLevel={performanceLevel}
          reducedMotion={reducedMotion}
          onBranchClick={onBranchClick}
        />
      ))}
    </group>
  );
};

// Individual Branch Segment
const BranchSegment: React.FC<{
  segment: BranchSegment;
  index: number;
  performanceLevel: 'high' | 'medium' | 'low';
  reducedMotion: boolean;
  onBranchClick?: (stage: number) => void;
}> = ({ segment, index, performanceLevel, reducedMotion, onBranchClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const { thickness, opacity } = useSpring({
    thickness: segment.radius,
    opacity: 1,
    delay: reducedMotion ? 0 : index * 200,
    config: { tension: 200, friction: 25 }
  });

  // Create branch geometry
  const geometry = useMemo(() => {
    const direction = segment.endPos.clone().sub(segment.startPos);
    const length = direction.length();
    const cylinderGeometry = new THREE.CylinderGeometry(
      segment.radius * 0.7, // Top radius (tapered)
      segment.radius,       // Bottom radius
      length,
      performanceLevel === 'high' ? 16 : 8, // Segment detail based on performance
      1
    );

    // Position and orient the cylinder
    const position = segment.startPos.clone().lerp(segment.endPos, 0.5);
    const matrix = new THREE.Matrix4();
    matrix.lookAt(segment.startPos, segment.endPos, new THREE.Vector3(0, 1, 0));
    cylinderGeometry.applyMatrix4(matrix);
    cylinderGeometry.translate(position.x, position.y, position.z);

    return cylinderGeometry;
  }, [segment, performanceLevel]);

  return (
    <group>
      {/* Main branch */}
      <animated.mesh
        ref={meshRef}
        geometry={geometry}
        scale={thickness.to(t => [t, 1, t])}
        onClick={() => onBranchClick?.(3)}
      >
        <meshStandardMaterial 
          color={segment.disciplinaryColor}
          roughness={0.9}
          transparent
          opacity={opacity}
        />
      </animated.mesh>

      {/* Cambium rings for evidence (Stage 4) */}
      {segment.evidenceRings > 0 && Array.from({ length: Math.min(segment.evidenceRings, 3) }).map((_, ringIndex) => (
        <animated.mesh
          key={`ring-${ringIndex}`}
          geometry={geometry}
          scale={thickness.to(t => [t * (1 + (ringIndex + 1) * 0.1), 1, t * (1 + (ringIndex + 1) * 0.1)])}
        >
          <meshStandardMaterial 
            color={segment.disciplinaryColor}
            roughness={0.7}
            transparent
            opacity={0.3 - ringIndex * 0.1}
            wireframe={performanceLevel === 'low'}
          />
        </animated.mesh>
      ))}
    </group>
  );
};

// Bud System Component
const BudSystem: React.FC<{
  elements: BotanicalElement[];
  currentStage: number;
  reducedMotion: boolean;
}> = ({ elements, currentStage, reducedMotion }) => {
  return (
    <group>
      {elements.map((element, index) => (
        <EvidenceBud 
          key={element.id}
          element={element}
          index={index}
          reducedMotion={reducedMotion}
        />
      ))}
    </group>
  );
};

// Individual Evidence Bud
const EvidenceBud: React.FC<{
  element: BotanicalElement;
  index: number;
  reducedMotion: boolean;
}> = ({ element, index, reducedMotion }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const { scale, pulse } = useSpring({
    scale: [1, 1, 1],
    pulse: 1,
    delay: reducedMotion ? 0 : index * 100,
    config: { tension: 300, friction: 30 }
  });

  // GSAP MotionPath pulse animation for evidence arrival
  useEffect(() => {
    if (meshRef.current && !reducedMotion) {
      const budElement = meshRef.current;
      
      // Create SVG path for pulsing motion
      const pulsePath = `M0,0 Q${Math.random() * 0.5 - 0.25},${Math.random() * 0.5 - 0.25} 0,0`;
      
      // GSAP MotionPath animation for bud pulse
      gsap.to(budElement.scale, {
        x: 1.3,
        y: 1.3,
        z: 1.3,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
        delay: index * 0.1
      });
      
      // Create flowing particle effect along path
      gsap.to(budElement.position, {
        duration: 2,
        repeat: -1,
        ease: "none",
        motionPath: {
          path: pulsePath,
          alignOrigin: [0.5, 0.5],
          autoRotate: false
        }
      });
    }
  }, [reducedMotion, index]);

  // Pulse animation for evidence arrival
  useFrame(({ clock }) => {
    if (meshRef.current && !reducedMotion) {
      const time = clock.getElapsedTime();
      meshRef.current.scale.setScalar(1 + Math.sin(time * 4) * 0.1);
    }
  });

  return (
    <animated.mesh
      ref={meshRef}
      position={element.position}
      scale={scale}
    >
      <sphereGeometry args={[0.2, 8, 8]} />
      <meshStandardMaterial 
        color={element.color}
        roughness={0.6}
        emissive={element.color}
        emissiveIntensity={0.2}
      />
    </animated.mesh>
  );
};

// Leaf Canopy with Instanced Rendering
const LeafCanopy: React.FC<{
  elements: BotanicalElement[];
  performanceLevel: 'high' | 'medium' | 'low';
  reducedMotion: boolean;
}> = ({ elements, performanceLevel, reducedMotion }) => {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  
  // LOD-based leaf count
  const leafCount = useMemo(() => {
    const baseCounts = { high: 200, medium: 100, low: 50 };
    return Math.min(elements.length * 5, baseCounts[performanceLevel]);
  }, [elements.length, performanceLevel]);

  // Setup instanced matrices
  useEffect(() => {
    if (!instancedMeshRef.current) return;

    const dummy = new THREE.Object3D();
    
    for (let i = 0; i < leafCount; i++) {
      const element = elements[i % elements.length];
      if (!element) continue;

      // Position with Perlin noise jitter
      dummy.position.set(
        element.position[0] + (Math.random() - 0.5) * 2,
        element.position[1] + Math.random() * 2,
        element.position[2] + (Math.random() - 0.5) * 2
      );

      // Random rotation
      dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      // Scale based on impact score
      const scale = 0.5 + element.impactScore * 0.5;
      dummy.scale.set(scale, scale, scale);

      dummy.updateMatrix();
      instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
    }

    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [leafCount, elements]);

  return (
    <instancedMesh ref={instancedMeshRef} args={[undefined, undefined, leafCount]}>
      <planeGeometry args={[0.5, 0.8]} />
      <meshStandardMaterial 
        color="#228B22"
        side={THREE.DoubleSide}
        transparent
        opacity={0.8}
      />
    </instancedMesh>
  );
};

// Blossom System Component
const BlossomSystem: React.FC<{
  elements: BotanicalElement[];
  currentStage: number;
  reducedMotion: boolean;
}> = ({ elements, currentStage, reducedMotion }) => {
  return (
    <group>
      {elements.map((element, index) => (
        <BlossomFlower 
          key={element.id}
          element={element}
          index={index}
          reducedMotion={reducedMotion}
        />
      ))}
    </group>
  );
};

// Individual Blossom Flower
const BlossomFlower: React.FC<{
  element: BotanicalElement;
  index: number;
  reducedMotion: boolean;
}> = ({ element, index, reducedMotion }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const { scale, petalSpread } = useSpring({
    scale: [1, 1, 1],
    petalSpread: 1,
    delay: reducedMotion ? 0 : index * 200,
    config: { duration: 800 } // 800ms as specified
  });

  // Create flower petals
  const petals = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      angle: (i / 5) * Math.PI * 2,
      offset: i * 0.1
    }));
  }, []);

  return (
    <animated.group
      ref={groupRef}
      position={element.position}
      scale={scale}
    >
      {/* Flower center */}
      <mesh>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#FFD700" />
      </mesh>

      {/* Petals */}
      {petals.map((petal, i) => (
        <animated.mesh
          key={i}
          position={[
            Math.cos(petal.angle) * 0.3,
            0,
            Math.sin(petal.angle) * 0.3
          ]}
          rotation={[0, petal.angle, Math.PI / 6]}
          scale={petalSpread.to(s => [s, s, s])}
        >
          <planeGeometry args={[0.4, 0.6]} />
          <meshStandardMaterial 
            color={element.color}
            side={THREE.DoubleSide}
            transparent
            opacity={0.8}
          />
        </animated.mesh>
      ))}
    </animated.group>
  );
};

// Helper function for disciplinary colors
function getDisciplinaryColor(disciplinary: string): string {
  const colors: Record<string, string> = {
    biology: '#2D8B2D',
    chemistry: '#4169E1',
    physics: '#DC143C',
    medicine: '#FF69B4',
    engineering: '#FF8C00',
    computer_science: '#9370DB',
    mathematics: '#B22222',
    psychology: '#20B2AA',
    general: '#4A5D23'
  };
  return colors[disciplinary] || colors.general;
}

export default ProceduralTree;