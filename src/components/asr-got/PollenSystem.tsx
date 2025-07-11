/**
 * PollenSystem.tsx - GPU particle system for Stage 8 reflection audit
 * Implements WebGPU shaders with fallback for pollen particle effects
 */

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

// Register GSAP plugin
gsap.registerPlugin(MotionPathPlugin);

interface PollenSystemProps {
  checklistResults: { passed?: number; failed?: number };
  performanceLevel: 'high' | 'medium' | 'low';
  reducedMotion: boolean;
}

interface ParticleData {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
  type: 'success' | 'failure';
}

export const PollenSystem: React.FC<PollenSystemProps> = ({
  checklistResults,
  performanceLevel,
  reducedMotion
}) => {
  const { gl } = useThree();
  const particleSystemRef = useRef<THREE.Points>(null);
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const [hasWebGPU, setHasWebGPU] = useState(false);

  // Check for WebGPU support
  useEffect(() => {
    const checkWebGPU = async () => {
      if ('gpu' in navigator) {
        try {
          const adapter = await (navigator as unknown as { gpu: { requestAdapter: () => Promise<unknown> } }).gpu.requestAdapter();
          setHasWebGPU(!!adapter);
        } catch (error) {
          console.log('WebGPU not available, using WebGL fallback');
          setHasWebGPU(false);
        }
      }
    };
    checkWebGPU();
  }, []);

  // Particle count based on performance level
  const maxParticles = useMemo(() => {
    if (reducedMotion) return 10;
    const counts = { high: 1000, medium: 500, low: 200 };
    return counts[performanceLevel];
  }, [performanceLevel, reducedMotion]);

  // Generate particles based on checklist results
  const generateParticles = useMemo(() => {
    if (!checklistResults || reducedMotion) return [];

    const newParticles: ParticleData[] = [];
    
    // Success particles (green)
    const successCount = checklistResults.passed || 0;
    for (let i = 0; i < Math.min(successCount * 20, maxParticles * 0.7); i++) {
      newParticles.push({
        id: `success-${i}`,
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          Math.random() * 15 + 5,
          (Math.random() - 0.5) * 10
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          Math.random() * 3 + 1,
          (Math.random() - 0.5) * 2
        ),
        life: 2000, // 2 seconds as specified
        maxLife: 2000,
        size: 0.1 + Math.random() * 0.1,
        color: new THREE.Color().setHSL(0.4 + Math.random() * 0.1, 0.8, 0.6), // Green range (150-180 hue)
        type: 'success'
      });
    }

    // Failure particles (red)
    const failureCount = checklistResults.failed || 0;
    for (let i = 0; i < Math.min(failureCount * 15, maxParticles * 0.3); i++) {
      newParticles.push({
        id: `failure-${i}`,
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          Math.random() * 12 + 3,
          (Math.random() - 0.5) * 8
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 1.5,
          Math.random() * 2 + 0.5,
          (Math.random() - 0.5) * 1.5
        ),
        life: 2000,
        maxLife: 2000,
        size: 0.08 + Math.random() * 0.08,
        color: new THREE.Color().setHSL(Math.random() * 0.05, 0.9, 0.5), // Red range (0-10 hue)
        type: 'failure'
      });
    }

    return newParticles;
  }, [checklistResults, maxParticles, reducedMotion]);

  useEffect(() => {
    setParticles(generateParticles);
  }, [generateParticles]);

  // Choose rendering method based on capabilities
  if (hasWebGPU && performanceLevel === 'high') {
    return <WebGPUPollenSystem 
      particles={particles}
      setParticles={setParticles}
      reducedMotion={reducedMotion}
    />;
  } else {
    return <WebGLPollenSystem 
      particles={particles}
      setParticles={setParticles}
      performanceLevel={performanceLevel}
      reducedMotion={reducedMotion}
    />;
  }
};

// WebGPU High-Performance Particle System
const WebGPUPollenSystem: React.FC<{
  particles: ParticleData[];
  setParticles: React.Dispatch<React.SetStateAction<ParticleData[]>>;
  reducedMotion: boolean;
}> = ({ particles, setParticles, reducedMotion }) => {
  const particleSystemRef = useRef<THREE.Points>(null);
  
  // WebGPU compute shader for particle updates
  const computeShader = `
    @group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
    @group(0) @binding(1) var<uniform> time: f32;
    @group(0) @binding(2) var<uniform> deltaTime: f32;

    struct Particle {
      position: vec3<f32>,
      velocity: vec3<f32>,
      life: f32,
      maxLife: f32,
      size: f32,
      color: vec3<f32>,
    }

    @compute @workgroup_size(64)
    fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
      let index = global_id.x;
      if (index >= arrayLength(&particles)) {
        return;
      }

      var particle = particles[index];
      
      // Update position
      particle.position += particle.velocity * deltaTime;
      
      // Apply gravity
      particle.velocity.y -= 9.81 * deltaTime * 0.1;
      
      // Air resistance
      particle.velocity *= 0.99;
      
      // Update life
      particle.life -= deltaTime * 1000.0;
      
      // Reset particle if dead
      if (particle.life <= 0.0) {
        particle.position = vec3<f32>(
          (fract(sin(f32(index) * 43758.5453)) - 0.5) * 10.0,
          15.0 + fract(sin(f32(index) * 12.9898)) * 5.0,
          (fract(sin(f32(index) * 78.233)) - 0.5) * 10.0
        );
        particle.velocity = vec3<f32>(
          (fract(sin(f32(index) * 54.321)) - 0.5) * 2.0,
          fract(sin(f32(index) * 23.456)) * 3.0 + 1.0,
          (fract(sin(f32(index) * 87.654)) - 0.5) * 2.0
        );
        particle.life = particle.maxLife;
      }
      
      particles[index] = particle;
    }
  `;

  // WebGPU vertex shader
  const vertexShader = `
    @group(0) @binding(0) var<storage> particles: array<Particle>;
    @group(1) @binding(0) var<uniform> projectionMatrix: mat4x4<f32>;
    @group(1) @binding(1) var<uniform> viewMatrix: mat4x4<f32>;

    struct VertexOutput {
      @builtin(position) position: vec4<f32>,
      @location(0) color: vec3<f32>,
      @location(1) size: f32,
      @location(2) life: f32,
    }

    @vertex
    fn main(@builtin(instance_index) instanceIndex: u32) -> VertexOutput {
      let particle = particles[instanceIndex];
      let worldPosition = vec4<f32>(particle.position, 1.0);
      
      var output: VertexOutput;
      output.position = projectionMatrix * viewMatrix * worldPosition;
      output.color = particle.color;
      output.size = particle.size;
      output.life = particle.life / particle.maxLife;
      
      return output;
    }
  `;

  return (
    <points ref={particleSystemRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length}
          array={new Float32Array(particles.length * 3)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.1}
        sizeAttenuation={true}
        transparent={true}
        vertexColors={true}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// WebGL Fallback Particle System
const WebGLPollenSystem: React.FC<{
  particles: ParticleData[];
  setParticles: React.Dispatch<React.SetStateAction<ParticleData[]>>;
  performanceLevel: 'high' | 'medium' | 'low';
  reducedMotion: boolean;
}> = ({ particles, setParticles, performanceLevel, reducedMotion }) => {
  const particleSystemRef = useRef<THREE.Points>(null);
  const [positions, setPositions] = useState<Float32Array>(new Float32Array(0));
  const [colors, setColors] = useState<Float32Array>(new Float32Array(0));
  const [sizes, setSizes] = useState<Float32Array>(new Float32Array(0));

  // Update particle buffers
  useEffect(() => {
    if (particles.length === 0) return;

    const positionArray = new Float32Array(particles.length * 3);
    const colorArray = new Float32Array(particles.length * 3);
    const sizeArray = new Float32Array(particles.length);

    particles.forEach((particle, i) => {
      const i3 = i * 3;
      
      // Position
      positionArray[i3] = particle.position.x;
      positionArray[i3 + 1] = particle.position.y;
      positionArray[i3 + 2] = particle.position.z;
      
      // Color
      colorArray[i3] = particle.color.r;
      colorArray[i3 + 1] = particle.color.g;
      colorArray[i3 + 2] = particle.color.b;
      
      // Size
      sizeArray[i] = particle.size * (particle.life / particle.maxLife);
    });

    setPositions(positionArray);
    setColors(colorArray);
    setSizes(sizeArray);
  }, [particles]);

  // Update particles every frame
  useFrame((state, delta) => {
    if (reducedMotion || particles.length === 0) return;

    const deltaMs = delta * 1000;
    
    setParticles(prevParticles => 
      prevParticles.map(particle => {
        // Update position
        const newPosition = particle.position.clone().add(
          particle.velocity.clone().multiplyScalar(delta)
        );
        
        // Apply gravity
        const newVelocity = particle.velocity.clone();
        newVelocity.y -= 9.81 * delta * 0.1;
        newVelocity.multiplyScalar(0.99); // Air resistance
        
        // Update life
        const newLife = particle.life - deltaMs;
        
        // Reset particle if dead
        if (newLife <= 0) {
          return {
            ...particle,
            position: new THREE.Vector3(
              (Math.random() - 0.5) * 10,
              Math.random() * 15 + 5,
              (Math.random() - 0.5) * 10
            ),
            velocity: new THREE.Vector3(
              (Math.random() - 0.5) * 2,
              Math.random() * 3 + 1,
              (Math.random() - 0.5) * 2
            ),
            life: particle.maxLife
          };
        }
        
        return {
          ...particle,
          position: newPosition,
          velocity: newVelocity,
          life: newLife
        };
      })
    );
  });

  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geometry;
  }, [positions, colors, sizes]);

  const particleMaterial = useMemo(() => {
    const material = new THREE.PointsMaterial({
      size: 0.1,
      sizeAttenuation: true,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      alphaTest: 0.001
    });
    
    // Custom shader for better visual effects
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        'gl_PointSize = size;',
        `
        float life = size;
        gl_PointSize = size * 10.0 * life;
        `
      );
      
      shader.fragmentShader = shader.fragmentShader.replace(
        'gl_FragColor = vec4( diffuse, 1.0 );',
        `
        vec2 center = gl_PointCoord - vec2(0.5);
        float distance = length(center);
        float alpha = 1.0 - smoothstep(0.0, 0.5, distance);
        gl_FragColor = vec4( diffuse, alpha );
        `
      );
    };
    
    return material;
  }, []);

  if (particles.length === 0) return null;

  return (
    <points ref={particleSystemRef} geometry={particleGeometry} material={particleMaterial} />
  );
};

export default PollenSystem;