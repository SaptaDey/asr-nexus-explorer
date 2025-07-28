/**
 * treeVisualizationDemo.ts - Demo data and test utilities for 3D botanical tree
 * Provides sample data for testing all botanical elements and stages
 */

import { GraphData, GraphNode, GraphEdge } from '@/types/asrGotTypes';

// Generate demo data for testing the 3D botanical tree visualization
export const generateDemoTreeData = (stage: number): GraphData => {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Stage 1: Root node
  nodes.push({
    id: 'root-1',
    type: 'root',
    label: 'Research Question: Impact of Climate Change on Marine Ecosystems',
    confidence: [0.9, 0.8, 0.85, 0.9],
    metadata: {
      stage: 1,
      botanicalType: 'root',
      created_at: new Date().toISOString(),
      evidence_count: 0,
      impact_score: 0.9,
      disciplinary_tags: ['marine_biology', 'climate_science']
    }
  });

  if (stage >= 2) {
    // Stage 2: Rootlets (Decomposition)
    const rootlets = [
      { id: 'rootlet-1', label: 'Scope: Global Ocean Temperature Changes', disciplinary: 'oceanography' },
      { id: 'rootlet-2', label: 'Objectives: Coral Reef Adaptation Mechanisms', disciplinary: 'marine_biology' },
      { id: 'rootlet-3', label: 'Constraints: Data Availability 1980-2023', disciplinary: 'data_science' },
      { id: 'rootlet-4', label: 'Biases: Publication Bias in Marine Studies', disciplinary: 'methodology' },
      { id: 'rootlet-5', label: 'Gaps: Limited Deep-Sea Research', disciplinary: 'marine_biology' }
    ];

    rootlets.forEach((rootlet, index) => {
      nodes.push({
        id: rootlet.id,
        type: 'dimension',
        label: rootlet.label,
        confidence: [0.7 + Math.random() * 0.2, 0.6 + Math.random() * 0.3, 0.8, 0.75],
        metadata: {
          stage: 2,
          botanicalType: 'rootlet',
          evidence_count: Math.floor(Math.random() * 3),
          impact_score: 0.6 + Math.random() * 0.3,
          disciplinary_tags: [rootlet.disciplinary]
        }
      });

      edges.push({
        id: `edge-root-${rootlet.id}`,
        source: 'root-1',
        target: rootlet.id,
        type: 'supportive',
        confidence: 0.8
      });
    });
  }

  if (stage >= 3) {
    // Stage 3: Branches (Hypotheses)
    const branches = [
      { id: 'branch-1', parent: 'rootlet-1', label: 'H1: Ocean acidification increases by 15% by 2030', confidence: 0.75 },
      { id: 'branch-2', parent: 'rootlet-1', label: 'H2: Surface temperature rise correlates with coral bleaching', confidence: 0.85 },
      { id: 'branch-3', parent: 'rootlet-2', label: 'H3: Coral species show genetic adaptation markers', confidence: 0.65 },
      { id: 'branch-4', parent: 'rootlet-2', label: 'H4: Symbiotic algae diversity increases resilience', confidence: 0.8 },
      { id: 'branch-5', parent: 'rootlet-3', label: 'H5: Historical data shows accelerating trends', confidence: 0.7 }
    ];

    branches.forEach(branch => {
      nodes.push({
        id: branch.id,
        type: 'hypothesis',
        label: branch.label,
        confidence: [branch.confidence, 0.7, 0.8, 0.75],
        metadata: {
          stage: 3,
          botanicalType: 'branch',
          evidence_count: Math.floor(Math.random() * 5) + 1,
          impact_score: branch.confidence,
          disciplinary_tags: ['marine_biology', 'climate_science']
        }
      });

      edges.push({
        id: `edge-${branch.parent}-${branch.id}`,
        source: branch.parent,
        target: branch.id,
        type: 'prerequisite',
        confidence: 0.8
      });
    });
  }

  if (stage >= 4) {
    // Stage 4: Buds (Evidence Collection)
    const evidenceNodes = [
      { id: 'evidence-1', parent: 'branch-1', label: 'NOAA Ocean Acidification Data 2000-2023', confidence: 0.9, evidence: 12 },
      { id: 'evidence-2', parent: 'branch-2', label: 'Great Barrier Reef Bleaching Events Analysis', confidence: 0.85, evidence: 8 },
      { id: 'evidence-3', parent: 'branch-3', label: 'Genetic Sequencing of Acropora Species', confidence: 0.7, evidence: 15 },
      { id: 'evidence-4', parent: 'branch-4', label: 'Symbiodinium Diversity Meta-Analysis', confidence: 0.8, evidence: 22 },
      { id: 'evidence-5', parent: 'branch-5', label: 'Historical Temperature Reconstruction', confidence: 0.75, evidence: 6 }
    ];

    evidenceNodes.forEach(evidence => {
      nodes.push({
        id: evidence.id,
        type: 'evidence',
        label: evidence.label,
        confidence: [evidence.confidence, 0.8, 0.85, 0.8],
        metadata: {
          stage: 4,
          botanicalType: 'bud',
          evidence_count: evidence.evidence,
          impact_score: evidence.confidence,
          confidence_delta: Math.random() * 0.3,
          disciplinary_tags: ['marine_biology', 'data_science']
        }
      });

      edges.push({
        id: `edge-${evidence.parent}-${evidence.id}`,
        source: evidence.parent,
        target: evidence.id,
        type: 'supportive',
        confidence: 0.85
      });
    });
  }

  if (stage >= 6) {
    // Stage 6: Leaves (Knowledge Synthesis)
    const synthesisNodes = [
      { id: 'synthesis-1', label: 'Ocean Chemistry Changes Synthesis', impact: 0.9 },
      { id: 'synthesis-2', label: 'Coral Adaptation Mechanisms Summary', impact: 0.85 },
      { id: 'synthesis-3', label: 'Ecosystem Resilience Factors', impact: 0.8 }
    ];

    synthesisNodes.forEach((synthesis, index) => {
      nodes.push({
        id: synthesis.id,
        type: 'synthesis',
        label: synthesis.label,
        confidence: [0.8, 0.85, 0.9, 0.85],
        metadata: {
          stage: 6,
          botanicalType: 'leaf',
          evidence_count: 10 + index * 5,
          impact_score: synthesis.impact,
          disciplinary_tags: ['marine_biology', 'synthesis']
        }
      });

      // Connect to multiple evidence nodes
      if (index < evidenceNodes.length) {
        edges.push({
          id: `edge-evidence-${index + 1}-${synthesis.id}`,
          source: `evidence-${index + 1}`,
          target: synthesis.id,
          type: 'supportive',
          confidence: 0.8
        });
      }
    });
  }

  if (stage >= 7) {
    // Stage 7: Blossoms (Final Insights)
    nodes.push({
      id: 'blossom-1',
      type: 'reflection',
      label: 'Integrated Climate-Marine Ecosystem Model',
      confidence: [0.9, 0.85, 0.9, 0.88],
      metadata: {
        stage: 7,
        botanicalType: 'blossom',
        evidence_count: 25,
        impact_score: 0.95,
        disciplinary_tags: ['climate_science', 'marine_biology', 'modeling']
      }
    });

    edges.push({
      id: 'edge-synthesis-blossom',
      source: 'synthesis-1',
      target: 'blossom-1',
      type: 'supportive',
      confidence: 0.9
    });
  }

  if (stage >= 8) {
    // Stage 8: Pollen (Audit Results)
    nodes.push({
      id: 'pollen-1',
      type: 'audit',
      label: 'Quality Assurance Audit - Passed',
      confidence: [1.0, 0.95, 0.9, 0.95],
      metadata: {
        stage: 8,
        botanicalType: 'pollen',
        audit_passed: true,
        bias_flags: [],
        quality_issues: [],
        impact_score: 0.9
      }
    });
  }

  return { nodes, edges };
};

// Performance test data for stress testing
export const generateStressTestData = (elementCount: number): GraphData => {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Generate root
  nodes.push({
    id: 'stress-root',
    type: 'root',
    label: 'Stress Test Root',
    confidence: [0.9, 0.8, 0.85, 0.9],
    metadata: { stage: 1, botanicalType: 'root', evidence_count: 0, impact_score: 0.9 }
  });

  // Generate many elements for performance testing
  for (let i = 0; i < elementCount; i++) {
    const elementType = i % 4 === 0 ? 'bud' : i % 4 === 1 ? 'leaf' : i % 4 === 2 ? 'branch' : 'blossom';
    const stage = elementType === 'bud' ? 4 : elementType === 'leaf' ? 6 : elementType === 'branch' ? 3 : 7;
    
    nodes.push({
      id: `stress-${i}`,
      type: elementType,
      label: `Stress Element ${i}`,
      confidence: [Math.random(), Math.random(), Math.random(), Math.random()],
      metadata: {
        stage,
        botanicalType: elementType,
        evidence_count: Math.floor(Math.random() * 10),
        impact_score: Math.random(),
        disciplinary_tags: ['test']
      }
    });

    if (i > 0) {
      edges.push({
        id: `stress-edge-${i}`,
        source: i === 1 ? 'stress-root' : `stress-${Math.floor(Math.random() * i)}`,
        target: `stress-${i}`,
        type: 'supportive',
        confidence: Math.random()
      });
    }
  }

  return { nodes, edges };
};

// Visual regression test scenarios
export const visualRegressionScenarios = [
  {
    name: 'Empty Tree',
    data: { nodes: [], edges: [] },
    stage: 1,
    description: 'Tests empty state handling'
  },
  {
    name: 'Single Root',
    data: generateDemoTreeData(1),
    stage: 1,
    description: 'Tests root bulb visualization'
  },
  {
    name: 'Rootlets Stage',
    data: generateDemoTreeData(2),
    stage: 2,
    description: 'Tests rootlet growth animation'
  },
  {
    name: 'Full Tree',
    data: generateDemoTreeData(9),
    stage: 9,
    description: 'Tests complete botanical tree with all elements'
  },
  {
    name: 'Performance Stress Test',
    data: generateStressTestData(500),
    stage: 6,
    description: 'Tests performance with many elements'
  }
];

// Accessibility test helpers
export const accessibilityTests = {
  // Test reduced motion compliance
  testReducedMotion: (component: HTMLElement) => {
    const hasReducedMotionSupport = window.getComputedStyle(component).getPropertyValue('--reduced-motion');
    return hasReducedMotionSupport === 'reduce';
  },

  // Test ARIA attributes
  testAriaCompliance: (component: HTMLElement) => {
    const progressBar = component.querySelector('[role="progressbar"]');
    const liveRegion = component.querySelector('[aria-live]');
    const statusRegion = component.querySelector('[role="status"]');
    
    return {
      hasProgressBar: !!progressBar,
      hasLiveRegion: !!liveRegion,
      hasStatusRegion: !!statusRegion,
      progressBarLabeled: progressBar?.hasAttribute('aria-labelledby'),
      progressBarValues: progressBar?.hasAttribute('aria-valuenow')
    };
  },

  // Test keyboard navigation
  testKeyboardNavigation: () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return false;
    
    return canvas.tabIndex >= 0; // Canvas should be focusable
  }
};

export default {
  generateDemoTreeData,
  generateStressTestData,
  visualRegressionScenarios,
  accessibilityTests
};