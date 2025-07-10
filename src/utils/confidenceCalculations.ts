/**
 * confidenceCalculations.ts - Advanced confidence vector calculations
 * Implements P1.5 multi-dimensional confidence system for ASR-GoT
 */

import { GraphNode, GraphEdge, ASRGoTMetadata } from '@/types/asrGotTypes';

// Confidence vector dimensions [empirical, theoretical, methodological, consensus]
export type ConfidenceVector = [number, number, number, number];

export interface ConfidenceCalculationResult {
  vector: ConfidenceVector;
  aggregated: number;
  dimensions: {
    empirical_support: number;
    theoretical_basis: number;
    methodological_rigor: number;
    consensus_alignment: number;
  };
  metadata: {
    evidence_count: number;
    confidence_delta: number;
    quality_score: number;
    uncertainty_bounds: [number, number];
  };
}

export class ConfidenceCalculator {
  
  // Calculate confidence vector for a node based on evidence
  static calculateNodeConfidence(
    node: GraphNode,
    evidenceNodes: GraphNode[],
    supportingEdges: GraphEdge[]
  ): ConfidenceCalculationResult {
    
    // Base confidence from node metadata
    const baseConfidence = node.confidence || [0.5, 0.5, 0.5, 0.5];
    
    // Calculate empirical support
    const empiricalSupport = this.calculateEmpiricalSupport(evidenceNodes);
    
    // Calculate theoretical basis
    const theoreticalBasis = this.calculateTheoreticalBasis(node, evidenceNodes);
    
    // Calculate methodological rigor
    const methodologicalRigor = this.calculateMethodologicalRigor(evidenceNodes);
    
    // Calculate consensus alignment
    const consensusAlignment = this.calculateConsensusAlignment(evidenceNodes);
    
    // Combine with edge weights
    const edgeWeights = this.calculateEdgeWeights(supportingEdges);
    
    // Calculate final confidence vector
    const vector: ConfidenceVector = [
      Math.min(1, baseConfidence[0] + empiricalSupport * edgeWeights.empirical),
      Math.min(1, baseConfidence[1] + theoreticalBasis * edgeWeights.theoretical),
      Math.min(1, baseConfidence[2] + methodologicalRigor * edgeWeights.methodological),
      Math.min(1, baseConfidence[3] + consensusAlignment * edgeWeights.consensus)
    ];
    
    // Calculate aggregated confidence
    const aggregated = vector.reduce((sum, val) => sum + val, 0) / 4;
    
    // Calculate confidence delta
    const baseAggregated = baseConfidence.reduce((sum, val) => sum + val, 0) / 4;
    const confidenceDelta = aggregated - baseAggregated;
    
    // Calculate uncertainty bounds
    const uncertaintyBounds = this.calculateUncertaintyBounds(vector, evidenceNodes);
    
    return {
      vector,
      aggregated,
      dimensions: {
        empirical_support: vector[0],
        theoretical_basis: vector[1],
        methodological_rigor: vector[2],
        consensus_alignment: vector[3]
      },
      metadata: {
        evidence_count: evidenceNodes.length,
        confidence_delta: confidenceDelta,
        quality_score: this.calculateQualityScore(evidenceNodes),
        uncertainty_bounds: uncertaintyBounds
      }
    };
  }
  
  // Calculate empirical support dimension
  private static calculateEmpiricalSupport(evidenceNodes: GraphNode[]): number {
    if (evidenceNodes.length === 0) return 0;
    
    let score = 0;
    let weightSum = 0;
    
    evidenceNodes.forEach(node => {
      const metadata = node.metadata;
      let nodeScore = 0;
      let nodeWeight = 1;
      
      // Data quality assessment
      if (metadata?.evidence_quality === 'high') {
        nodeScore += 0.3;
      } else if (metadata?.evidence_quality === 'medium') {
        nodeScore += 0.2;
      } else if (metadata?.evidence_quality === 'low') {
        nodeScore += 0.1;
      }
      
      // Statistical power
      if (metadata?.statistical_power) {
        nodeScore += metadata.statistical_power * 0.25;
      }
      
      // Sample size and effect size
      if (metadata?.power_metrics?.sample_size) {
        const sampleSizeScore = Math.min(0.2, metadata.power_metrics.sample_size / 1000);
        nodeScore += sampleSizeScore;
      }
      
      // Replication studies
      if (metadata?.replication_count && metadata.replication_count > 1) {
        nodeScore += Math.min(0.15, metadata.replication_count * 0.05);
      }
      
      // Weight by publication quality
      if (metadata?.publication_rank) {
        nodeWeight = metadata.publication_rank;
      }
      
      score += nodeScore * nodeWeight;
      weightSum += nodeWeight;
    });
    
    return weightSum > 0 ? Math.min(1, score / weightSum) : 0;
  }
  
  // Calculate theoretical basis dimension
  private static calculateTheoreticalBasis(node: GraphNode, evidenceNodes: GraphNode[]): number {
    let score = 0;
    
    // Theoretical grounding in node metadata
    if (node.metadata?.theoretical_framework) {
      score += 0.3;
    }
    
    // Peer review status
    const peerReviewedCount = evidenceNodes.filter(n => 
      n.metadata?.peer_review_status === 'peer-reviewed'
    ).length;
    score += Math.min(0.25, peerReviewedCount * 0.05);
    
    // Citation network strength
    const citationCount = evidenceNodes.reduce((sum, n) => 
      sum + (n.metadata?.citation_count || 0), 0
    );
    score += Math.min(0.2, citationCount / 1000);
    
    // Theoretical consistency
    if (node.metadata?.theoretical_consistency) {
      score += node.metadata.theoretical_consistency * 0.25;
    }
    
    return Math.min(1, score);
  }
  
  // Calculate methodological rigor dimension
  private static calculateMethodologicalRigor(evidenceNodes: GraphNode[]): number {
    if (evidenceNodes.length === 0) return 0;
    
    let score = 0;
    let count = 0;
    
    evidenceNodes.forEach(node => {
      const metadata = node.metadata;
      let nodeScore = 0;
      
      // Study design quality
      if (metadata?.study_design === 'randomized-controlled-trial') {
        nodeScore += 0.4;
      } else if (metadata?.study_design === 'cohort-study') {
        nodeScore += 0.3;
      } else if (metadata?.study_design === 'cross-sectional') {
        nodeScore += 0.2;
      }
      
      // Methodological controls
      if (metadata?.controls?.includes('blinding')) {
        nodeScore += 0.15;
      }
      if (metadata?.controls?.includes('randomization')) {
        nodeScore += 0.15;
      }
      if (metadata?.controls?.includes('control-group')) {
        nodeScore += 0.15;
      }
      
      // Bias controls
      if (metadata?.bias_controls?.length > 0) {
        nodeScore += Math.min(0.15, metadata.bias_controls.length * 0.05);
      }
      
      score += nodeScore;
      count++;
    });
    
    return count > 0 ? Math.min(1, score / count) : 0;
  }
  
  // Calculate consensus alignment dimension
  private static calculateConsensusAlignment(evidenceNodes: GraphNode[]): number {
    if (evidenceNodes.length === 0) return 0;
    
    let score = 0;
    
    // Field consensus indicators
    const journalRankSum = evidenceNodes.reduce((sum, n) => 
      sum + (n.metadata?.journal_rank || 0), 0
    );
    score += Math.min(0.3, journalRankSum / evidenceNodes.length);
    
    // Expert endorsement
    const expertCount = evidenceNodes.filter(n => 
      n.metadata?.expert_endorsed
    ).length;
    score += Math.min(0.25, expertCount / evidenceNodes.length);
    
    // Meta-analysis inclusion
    const metaAnalysisCount = evidenceNodes.filter(n => 
      n.metadata?.included_in_meta_analysis
    ).length;
    score += Math.min(0.2, metaAnalysisCount / evidenceNodes.length);
    
    // Controversial findings penalty
    const controversialCount = evidenceNodes.filter(n => 
      n.metadata?.controversial_findings
    ).length;
    score -= Math.min(0.15, controversialCount / evidenceNodes.length);
    
    // Interdisciplinary agreement
    const disciplines = new Set(evidenceNodes.map(n => 
      n.metadata?.disciplinary_tags?.[0]
    ).filter(Boolean));
    
    if (disciplines.size > 1) {
      score += Math.min(0.2, disciplines.size * 0.05);
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
  // Calculate edge weights for different confidence dimensions
  private static calculateEdgeWeights(edges: GraphEdge[]): {
    empirical: number;
    theoretical: number;
    methodological: number;
    consensus: number;
  } {
    if (edges.length === 0) {
      return { empirical: 0, theoretical: 0, methodological: 0, consensus: 0 };
    }
    
    const weights = {
      empirical: 0,
      theoretical: 0,
      methodological: 0,
      consensus: 0
    };
    
    edges.forEach(edge => {
      const baseWeight = edge.confidence || 0.5;
      
      // Weight by edge type
      switch (edge.type) {
        case 'supportive':
          weights.empirical += baseWeight * 0.3;
          weights.theoretical += baseWeight * 0.2;
          break;
        case 'causal_direct':
          weights.empirical += baseWeight * 0.4;
          weights.methodological += baseWeight * 0.3;
          break;
        case 'correlative':
          weights.empirical += baseWeight * 0.2;
          weights.methodological += baseWeight * 0.2;
          break;
        case 'contradictory':
          weights.empirical -= baseWeight * 0.2;
          weights.consensus -= baseWeight * 0.1;
          break;
      }
    });
    
    // Normalize weights
    const totalEdges = edges.length;
    return {
      empirical: Math.max(0, Math.min(1, weights.empirical / totalEdges)),
      theoretical: Math.max(0, Math.min(1, weights.theoretical / totalEdges)),
      methodological: Math.max(0, Math.min(1, weights.methodological / totalEdges)),
      consensus: Math.max(0, Math.min(1, weights.consensus / totalEdges))
    };
  }
  
  // Calculate quality score for evidence
  private static calculateQualityScore(evidenceNodes: GraphNode[]): number {
    if (evidenceNodes.length === 0) return 0;
    
    let totalScore = 0;
    
    evidenceNodes.forEach(node => {
      const metadata = node.metadata;
      let nodeScore = 0;
      
      // Publication quality
      if (metadata?.peer_review_status === 'peer-reviewed') {
        nodeScore += 0.3;
      }
      
      // Journal ranking
      if (metadata?.journal_rank) {
        nodeScore += metadata.journal_rank * 0.2;
      }
      
      // Citation impact
      if (metadata?.citation_count) {
        nodeScore += Math.min(0.2, metadata.citation_count / 100);
      }
      
      // Replication success
      if (metadata?.replication_success) {
        nodeScore += 0.15;
      }
      
      // Bias flags penalty
      if (metadata?.bias_flags?.length > 0) {
        nodeScore -= metadata.bias_flags.length * 0.1;
      }
      
      totalScore += Math.max(0, nodeScore);
    });
    
    return Math.min(1, totalScore / evidenceNodes.length);
  }
  
  // Calculate uncertainty bounds
  private static calculateUncertaintyBounds(
    vector: ConfidenceVector,
    evidenceNodes: GraphNode[]
  ): [number, number] {
    const aggregated = vector.reduce((sum, val) => sum + val, 0) / 4;
    
    // Base uncertainty from sample size
    const evidenceCount = evidenceNodes.length;
    const baseUncertainty = evidenceCount > 0 ? 1 / Math.sqrt(evidenceCount) : 0.5;
    
    // Adjust for quality factors
    const qualityFactor = this.calculateQualityScore(evidenceNodes);
    const adjustedUncertainty = baseUncertainty * (1 - qualityFactor);
    
    const lowerBound = Math.max(0, aggregated - adjustedUncertainty);
    const upperBound = Math.min(1, aggregated + adjustedUncertainty);
    
    return [lowerBound, upperBound];
  }
  
  // Calculate confidence change over time
  static calculateConfidenceEvolution(
    initialConfidence: ConfidenceVector,
    evidenceHistory: Array<{
      timestamp: string;
      evidence: GraphNode[];
      edges: GraphEdge[];
    }>
  ): Array<{
    timestamp: string;
    confidence: ConfidenceVector;
    delta: number;
  }> {
    const evolution = [];
    let currentConfidence = initialConfidence;
    
    evidenceHistory.forEach(entry => {
      const dummyNode: GraphNode = {
        id: 'temp',
        label: 'temp',
        type: 'evidence',
        confidence: currentConfidence,
        metadata: {}
      };
      
      const result = this.calculateNodeConfidence(dummyNode, entry.evidence, entry.edges);
      const delta = result.aggregated - (currentConfidence.reduce((a, b) => a + b, 0) / 4);
      
      evolution.push({
        timestamp: entry.timestamp,
        confidence: result.vector,
        delta
      });
      
      currentConfidence = result.vector;
    });
    
    return evolution;
  }
}

// Export utility functions
export const calculateConfidenceVector = ConfidenceCalculator.calculateNodeConfidence;
export const calculateConfidenceEvolution = ConfidenceCalculator.calculateConfidenceEvolution;