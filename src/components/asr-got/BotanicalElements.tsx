/**
 * BotanicalElements.tsx - Renders botanical elements for tree visualization
 * Handles different node types: root-bulb, branch, bud, leaf, blossom
 */

import React from 'react';
import { animated } from '@react-spring/web';

interface BotanicalElementsProps {
  node: any;
  animations: {
    rootSpring: any;
    rootletSpring: any;
    branchSpring: any;
    evidenceSpring: any;
    pruneSpring: any;
    leafSpring: any;
    blossomSpring: any;
    reflectionSpring: any;
    finalSpring: any;
  };
  evidenceAnimations: any;
  colorBlindMode: boolean;
}

// Disciplinary color mapping with hue graduation
const getDisciplinaryColor = (disciplinary: string): string => {
  const colors = {
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
  return colors[disciplinary as keyof typeof colors] || colors.general;
};

export const getNodeColor = (node: any, colorBlindMode: boolean) => {
  if (colorBlindMode) return 'hsl(var(--foreground))';
  
  const confidence = node.confidence?.reduce((a: number, b: number) => a + b, 0) / node.confidence?.length || 0;
  if (confidence >= 0.8) return 'hsl(160, 100%, 40%)';
  if (confidence >= 0.5) return 'hsl(45, 100%, 50%)';
  return 'hsl(0, 100%, 45%)';
};

export const BotanicalElement: React.FC<BotanicalElementsProps> = ({
  node,
  animations,
  evidenceAnimations,
  colorBlindMode
}) => {
  const nodeData = node.data as any;
  const { botanicalType, confidence, metadata } = nodeData;
  const avgConfidence = confidence?.reduce((a: number, b: number) => a + b, 0) / confidence?.length || 0;
  
  switch (botanicalType) {
    case 'root-bulb':
      return (
        <animated.g>
          {/* Terracotta root bulb */}
          <animated.circle
            r={20}
            fill="#8B4513" // Terracotta brown
            stroke="#CD853F"
            strokeWidth={2}
            style={{
              transform: animations.rootSpring.scale.to((s: number) => `scale(${s})`),
              opacity: animations.rootSpring.opacity
            }}
          />
          {/* Root texture lines */}
          <animated.path
            d="M-10,-5 Q0,0 10,-5 M-8,3 Q0,5 8,3 M-6,8 Q0,10 6,8"
            stroke="#654321"
            strokeWidth="1"
            fill="none"
            opacity="0.6"
            style={{
              opacity: animations.rootSpring.opacity
            }}
          />
        </animated.g>
      );
      
    case 'rootlet':
      return (
        <animated.path
          d={`M0,0 L${avgConfidence * 30},${Math.sin(Math.PI / 4) * avgConfidence * 30}`}
          stroke="hsl(120, 60%, 40%)"
          strokeWidth="3"
          fill="none"
          style={{
            pathLength: animations.rootletSpring.length,
            opacity: animations.rootletSpring.opacity
          }}
        />
      );
      
    case 'branch':
      const branchColor = getDisciplinaryColor(metadata?.disciplinary_tags?.[0] || 'general');
      const branchRadius = Math.max(8, avgConfidence * 15);
      return (
        <animated.g>
          {/* Main branch node */}
          <animated.circle
            r={branchRadius}
            fill={branchColor}
            stroke={branchColor}
            strokeWidth={2}
            style={{
              transform: animations.branchSpring.pathLength.to((v: number) => `scale(${v})`),
              opacity: animations.pruneSpring.opacity
            }}
          />
          {/* Cambium rings for evidence */}
          {metadata?.evidence_count > 0 && (
            <animated.circle
              r={branchRadius + 3}
              fill="none"
              stroke={branchColor}
              strokeWidth={1}
              opacity="0.4"
              style={{
                opacity: animations.pruneSpring.opacity
              }}
            />
          )}
          {/* Branch texture */}
          <animated.path
            d={`M-${branchRadius/2},-2 Q0,0 ${branchRadius/2},-2 M-${branchRadius/3},2 Q0,3 ${branchRadius/3},2`}
            stroke={branchColor}
            strokeWidth="0.5"
            fill="none"
            opacity="0.5"
            style={{
              opacity: animations.pruneSpring.opacity
            }}
          />
        </animated.g>
      );
      
    case 'bud':
      const evidenceCount = metadata?.evidence_count || 1;
      const deltaC = metadata?.confidence_delta || 0.1;
      
      return (
        <animated.g
          style={{
            transform: animations.evidenceSpring.scale.to((s: number) => `scale(${s})`),
          }}
        >
          {/* Cambium rings - represent evidence accumulation */}
          {Array.from({ length: Math.min(evidenceCount, 5) }, (_, i) => (
            <animated.circle
              key={`cambium-${i}`}
              r={3 + i * 1.5}
              fill="none"
              stroke="#90EE90"
              strokeWidth="0.5"
              opacity={0.6 - i * 0.1}
              style={{
                transform: animations.evidenceSpring.pulse.to((p: number) => 
                  `scale(${1 + p * 0.2})`
                ),
                filter: animations.evidenceSpring.pulse.to((p: number) => 
                  p > 0.5 ? 'drop-shadow(0 0 3px rgba(144, 238, 144, 0.8))' : 'none'
                )
              }}
            />
          ))}
          
          {/* Main evidence bud */}
          <animated.ellipse
            rx="3"
            ry="6"
            fill="#90EE90"
            stroke="#228B22"
            strokeWidth="1"
            style={{
              filter: animations.evidenceSpring.pulse.to((p: number) => 
                p > 0.5 ? 'drop-shadow(0 0 6px rgba(144, 238, 144, 0.8))' : 'none'
              )
            }}
          />
          
          {/* Delta C indicator */}
          {deltaC > 0.2 && (
            <animated.text
              x="8"
              y="2"
              fontSize="6"
              fill="#228B22"
              style={{
                opacity: animations.evidenceSpring.pulse
              }}
            >
              +{(deltaC * 100).toFixed(0)}%
            </animated.text>
          )}
        </animated.g>
      );
      
    case 'leaf':
      const impactScore = metadata?.impact_score || 0.5;
      const leafSize = Math.max(0.5, Math.min(2.0, impactScore * 2));
      const leafPath = `M0,${-8 * leafSize} Q${-4 * leafSize},${-4 * leafSize} 0,0 Q${4 * leafSize},${-4 * leafSize} 0,${-8 * leafSize}`;
      
      return (
        <animated.g
          style={{
            transform: animations.leafSpring.scale.to((s: number) => `scale(${s})`),
          }}
        >
          {/* Main leaf with impact-proportional sizing */}
          <animated.path
            d={leafPath}
            fill="#32CD32"
            stroke="#228B22"
            strokeWidth="1"
            style={{
              filter: animations.leafSpring.jitter.to((j: number) => j > 0 ? 'blur(0.3px)' : 'none')
            }}
          />
          
          {/* Leaf veins for high-impact nodes */}
          {impactScore > 0.7 && (
            <animated.g
              style={{
                opacity: animations.leafSpring.scale.to((s: number) => s * 0.6)
              }}
            >
              <path
                d={`M0,${-2 * leafSize} L0,${-6 * leafSize}`}
                stroke="#228B22"
                strokeWidth="0.5"
                fill="none"
              />
              <path
                d={`M0,${-4 * leafSize} L${-2 * leafSize},${-6 * leafSize}`}
                stroke="#228B22"
                strokeWidth="0.3"
                fill="none"
              />
              <path
                d={`M0,${-4 * leafSize} L${2 * leafSize},${-6 * leafSize}`}
                stroke="#228B22"
                strokeWidth="0.3"
                fill="none"
              />
            </animated.g>
          )}
          
          {/* Impact score indicator */}
          {impactScore > 0.8 && (
            <animated.text
              x="6"
              y="-2"
              fontSize="5"
              fill="#228B22"
              style={{
                opacity: animations.leafSpring.scale
              }}
            >
              ⭐
            </animated.text>
          )}
        </animated.g>
      );
      
    case 'blossom':
      const blossomImpactScore = metadata?.impact_score || 0;
      return blossomImpactScore > 0.7 ? (
        <animated.g
          style={{
            transform: animations.blossomSpring.petals.to((p: number) => `scale(${p})`)
          }}
        >
          {[0, 72, 144, 216, 288].map(angle => (
            <ellipse
              key={angle}
              rx="8"
              ry="3"
              fill="#FFB6C1"
              stroke="#FF69B4"
              strokeWidth="1"
              transform={`rotate(${angle})`}
            />
          ))}
          <circle r="3" fill="#FFD700" />
          {/* Label slide-in effect */}
          <animated.text
            x="20"
            y="5"
            fontSize="8"
            fill="hsl(var(--foreground))"
            style={{
              opacity: animations.blossomSpring.label,
              transform: animations.blossomSpring.label.to((l: number) => `translateX(${(1 - l) * 20}px)`)
            }}
          >
            {nodeData.label}
          </animated.text>
        </animated.g>
      ) : (
        <circle r="4" fill={getNodeColor(node.data, colorBlindMode)} />
      );
      
    case 'pollen':
      const hasBiasFlags = metadata?.bias_flags?.length > 0;
      const hasQualityIssues = metadata?.quality_issues?.length > 0;
      const auditPassed = metadata?.audit_passed !== false;
      
      // Determine pollen color based on audit results
      const getPollenColor = () => {
        if (hasBiasFlags || hasQualityIssues || !auditPassed) {
          return '#dc2626'; // Crimson for violations
        }
        return '#fbbf24'; // Golden for passed checklist items
      };
      
      const pollenColor = getPollenColor();
      
      return (
        <animated.g
          style={{
            opacity: animations.reflectionSpring.particles,
            transform: animations.reflectionSpring.sparkles.to((s: number) => `scale(${s})`)
          }}
        >
          {/* Main pollen particle */}
          <animated.circle
            r="2"
            fill={pollenColor}
            style={{
              filter: pollenColor === '#fbbf24' ? 
                'drop-shadow(0 0 4px rgba(251, 191, 36, 0.8))' : 
                'drop-shadow(0 0 4px rgba(220, 38, 38, 0.8))'
            }}
          />
          
          {/* Sparkle effect for golden pollen */}
          {pollenColor === '#fbbf24' && (
            <animated.g
              style={{
                opacity: animations.reflectionSpring.sparkles.to((s: number) => s * 0.8)
              }}
            >
              <path
                d="M0,-4 L0,4 M-4,0 L4,0"
                stroke="#fbbf24"
                strokeWidth="0.5"
                fill="none"
              />
              <path
                d="M-3,-3 L3,3 M-3,3 L3,-3"
                stroke="#fbbf24"
                strokeWidth="0.3"
                fill="none"
              />
            </animated.g>
          )}
          
          {/* Warning indicator for crimson pollen */}
          {pollenColor === '#dc2626' && (
            <animated.text
              x="4"
              y="1"
              fontSize="6"
              fill="#dc2626"
              style={{
                opacity: animations.reflectionSpring.sparkles
              }}
            >
              ⚠
            </animated.text>
          )}
        </animated.g>
      );
      
    default:
      return <circle r="4" fill={getNodeColor(node.data, colorBlindMode)} />;
  }
};