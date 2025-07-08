// P1.14: Bayesian Uncertainty Propagation System
// Implements sophisticated belief updating and uncertainty quantification

import { GraphData, GraphNode, GraphEdge } from '@/types/asrGotTypes';
import { calculateEntropy, calculateKLDivergence } from '@/utils/informationTheory';

export interface UncertaintyDistribution {
  mean: number;
  variance: number;
  distribution: 'normal' | 'beta' | 'dirichlet' | 'uniform';
  parameters: Record<string, number>;
  confidenceInterval: [number, number];
  entropy: number;
}

export interface BayesianUpdate {
  nodeId: string;
  priorDistribution: UncertaintyDistribution;
  likelihood: UncertaintyDistribution;
  posteriorDistribution: UncertaintyDistribution;
  updateStrength: number;
  informationGain: number;
}

export interface PropagationResult {
  updatedGraph: GraphData;
  updates: BayesianUpdate[];
  propagationMetrics: {
    totalInformationGain: number;
    uncertaintyReduction: number;
    convergenceScore: number;
    propagationSteps: number;
  };
}

export interface Evidence {
  nodeId: string;
  value: number;
  reliability: number;
  sourceType: 'empirical' | 'theoretical' | 'expert' | 'computational';
  statisticalPower: number;
  sampleSize?: number;
  effectSize?: number;
}

export class BayesianUncertaintyPropagator {
  
  /**
   * Main uncertainty propagation method
   */
  public propagateUncertainty(
    graph: GraphData, 
    evidenceUpdates: Evidence[], 
    propagationOptions: {
      maxIterations?: number;
      convergenceThreshold?: number;
      dampingFactor?: number;
    } = {}
  ): PropagationResult {
    const {
      maxIterations = 50,
      convergenceThreshold = 0.001,
      dampingFactor = 0.1
    } = propagationOptions;
    
    let currentGraph = JSON.parse(JSON.stringify(graph)); // Deep copy
    const allUpdates: BayesianUpdate[] = [];
    let totalInformationGain = 0;
    let propagationSteps = 0;
    
    // Initialize uncertainty distributions for all nodes
    const uncertaintyMap = this.initializeUncertaintyDistributions(currentGraph);
    
    // Apply direct evidence updates
    evidenceUpdates.forEach(evidence => {
      const update = this.applyEvidenceUpdate(uncertaintyMap, evidence);
      if (update) {
        allUpdates.push(update);
        totalInformationGain += update.informationGain;
      }
    });
    
    // Iterative propagation through network
    let converged = false;
    for (let iteration = 0; iteration < maxIterations && !converged; iteration++) {
      const iterationUpdates: BayesianUpdate[] = [];
      let maxChange = 0;
      
      // Propagate uncertainty through edges
      currentGraph.edges.forEach(edge => {
        const sourceUncertainty = uncertaintyMap.get(edge.source);
        const targetUncertainty = uncertaintyMap.get(edge.target);
        
        if (sourceUncertainty && targetUncertainty) {
          const propagatedUpdate = this.propagateThroughEdge(
            edge, 
            sourceUncertainty, 
            targetUncertainty,
            dampingFactor
          );
          
          if (propagatedUpdate && propagatedUpdate.updateStrength > convergenceThreshold) {
            iterationUpdates.push(propagatedUpdate);
            uncertaintyMap.set(edge.target, propagatedUpdate.posteriorDistribution);
            maxChange = Math.max(maxChange, propagatedUpdate.updateStrength);
            totalInformationGain += propagatedUpdate.informationGain;
          }
        }
      });
      
      allUpdates.push(...iterationUpdates);
      propagationSteps++;
      
      converged = maxChange < convergenceThreshold;
    }
    
    // Update graph with final uncertainty distributions
    const updatedGraph = this.updateGraphWithUncertainty(currentGraph, uncertaintyMap);
    
    // Calculate final metrics
    const initialUncertainty = this.calculateTotalUncertainty(graph);
    const finalUncertainty = this.calculateTotalUncertainty(updatedGraph);
    const uncertaintyReduction = initialUncertainty - finalUncertainty;
    const convergenceScore = converged ? 1.0 : propagationSteps / maxIterations;
    
    return {
      updatedGraph,
      updates: allUpdates,
      propagationMetrics: {
        totalInformationGain,
        uncertaintyReduction,
        convergenceScore,
        propagationSteps
      }
    };
  }
  
  /**
   * Update belief using Bayesian inference
   */
  public updateBelief(
    prior: UncertaintyDistribution, 
    evidence: Evidence,
    edgeType?: string
  ): UncertaintyDistribution {
    // Create likelihood distribution from evidence
    const likelihood = this.createLikelihoodDistribution(evidence);
    
    // Perform Bayesian update based on distribution types
    if (prior.distribution === 'beta' && likelihood.distribution === 'beta') {
      return this.updateBetaDistribution(prior, likelihood);
    } else if (prior.distribution === 'normal' && likelihood.distribution === 'normal') {
      return this.updateNormalDistribution(prior, likelihood);
    } else {
      // Fallback to approximate update
      return this.approximateBayesianUpdate(prior, likelihood, edgeType);
    }
  }
  
  /**
   * Calculate confidence intervals for uncertainty distributions
   */
  public calculateConfidenceIntervals(
    distribution: UncertaintyDistribution, 
    levels: number[] = [0.68, 0.95, 0.99]
  ): Record<number, [number, number]> {
    const intervals: Record<number, [number, number]> = {};
    
    levels.forEach(level => {
      intervals[level] = this.getConfidenceInterval(distribution, level);
    });
    
    return intervals;
  }
  
  /**
   * Quantify uncertainty using various metrics
   */
  public quantifyUncertainty(graph: GraphData): {
    totalEntropy: number;
    averageUncertainty: number;
    uncertaintyDistribution: number[];
    highUncertaintyNodes: string[];
    uncertaintyHotspots: Array<{
      nodeId: string;
      uncertainty: number;
      neighbors: string[];
    }>;
  } {
    const uncertainties: number[] = [];
    const nodeUncertainties: Array<{ nodeId: string; uncertainty: number }> = [];
    
    graph.nodes.forEach(node => {
      const uncertainty = this.calculateNodeUncertainty(node);
      uncertainties.push(uncertainty);
      nodeUncertainties.push({ nodeId: node.id, uncertainty });
    });
    
    const totalEntropy = calculateEntropy(uncertainties);
    const averageUncertainty = uncertainties.reduce((sum, u) => sum + u, 0) / uncertainties.length;
    
    // Find high uncertainty nodes (top 20%)
    const sortedByUncertainty = nodeUncertainties.sort((a, b) => b.uncertainty - a.uncertainty);
    const highUncertaintyThreshold = Math.ceil(nodeUncertainties.length * 0.2);
    const highUncertaintyNodes = sortedByUncertainty
      .slice(0, highUncertaintyThreshold)
      .map(item => item.nodeId);
    
    // Find uncertainty hotspots (high uncertainty nodes with many connections)
    const uncertaintyHotspots = this.findUncertaintyHotspots(graph, nodeUncertainties);
    
    return {
      totalEntropy,
      averageUncertainty,
      uncertaintyDistribution: uncertainties,
      highUncertaintyNodes,
      uncertaintyHotspots
    };
  }
  
  /**
   * Private helper methods
   */
  private initializeUncertaintyDistributions(graph: GraphData): Map<string, UncertaintyDistribution> {
    const uncertaintyMap = new Map<string, UncertaintyDistribution>();
    
    graph.nodes.forEach(node => {
      const distribution = this.createUncertaintyDistribution(node);
      uncertaintyMap.set(node.id, distribution);
    });
    
    return uncertaintyMap;
  }
  
  private createUncertaintyDistribution(node: GraphNode): UncertaintyDistribution {
    // Create appropriate distribution based on node confidence
    const avgConfidence = node.confidence.reduce((sum, c) => sum + c, 0) / node.confidence.length;
    const variance = this.calculateConfidenceVariance(node.confidence);
    
    // Choose distribution type based on node characteristics
    let distribution: UncertaintyDistribution['distribution'] = 'beta';
    let parameters: Record<string, number> = {};
    
    if (node.type === 'evidence' && node.metadata.statistical_power) {
      // Use beta distribution for evidence nodes
      const alpha = avgConfidence * 10;
      const beta = (1 - avgConfidence) * 10;
      parameters = { alpha, beta };
      distribution = 'beta';
    } else {
      // Use normal distribution for other nodes
      parameters = { mean: avgConfidence, std: Math.sqrt(variance) };
      distribution = 'normal';
    }
    
    const entropy = this.calculateDistributionEntropy(distribution, parameters);
    
    return {
      mean: avgConfidence,
      variance,
      distribution,
      parameters,
      confidenceInterval: this.calculateConfidenceInterval(distribution, parameters, 0.95),
      entropy
    };
  }
  
  private createLikelihoodDistribution(evidence: Evidence): UncertaintyDistribution {
    // Create likelihood based on evidence reliability and statistical power
    const mean = evidence.value;
    const variance = (1 - evidence.reliability) * (1 - evidence.statisticalPower);
    
    const parameters = evidence.statisticalPower > 0.8 ? 
      { alpha: evidence.value * 20, beta: (1 - evidence.value) * 20 } :
      { mean, std: Math.sqrt(variance) };
      
    const distribution = evidence.statisticalPower > 0.8 ? 'beta' : 'normal';
    const entropy = this.calculateDistributionEntropy(distribution, parameters);
    
    return {
      mean,
      variance,
      distribution,
      parameters,
      confidenceInterval: this.calculateConfidenceInterval(distribution, parameters, 0.95),
      entropy
    };
  }
  
  private applyEvidenceUpdate(
    uncertaintyMap: Map<string, UncertaintyDistribution>, 
    evidence: Evidence
  ): BayesianUpdate | null {
    const priorDistribution = uncertaintyMap.get(evidence.nodeId);
    if (!priorDistribution) return null;
    
    const likelihood = this.createLikelihoodDistribution(evidence);
    const posteriorDistribution = this.updateBelief(priorDistribution, evidence);
    
    const updateStrength = this.calculateUpdateStrength(priorDistribution, posteriorDistribution);
    const informationGain = this.calculateInformationGain(priorDistribution, posteriorDistribution);
    
    uncertaintyMap.set(evidence.nodeId, posteriorDistribution);
    
    return {
      nodeId: evidence.nodeId,
      priorDistribution,
      likelihood,
      posteriorDistribution,
      updateStrength,
      informationGain
    };
  }
  
  private propagateThroughEdge(
    edge: GraphEdge,
    sourceUncertainty: UncertaintyDistribution,
    targetUncertainty: UncertaintyDistribution,
    dampingFactor: number
  ): BayesianUpdate | null {
    // Create pseudo-evidence from source node
    const pseudoEvidence: Evidence = {
      nodeId: edge.target,
      value: sourceUncertainty.mean,
      reliability: edge.confidence * dampingFactor,
      sourceType: 'computational',
      statisticalPower: 1 - sourceUncertainty.variance
    };
    
    // Apply edge-type specific transformations
    const adjustedEvidence = this.adjustEvidenceByEdgeType(pseudoEvidence, edge.type);
    
    const posteriorDistribution = this.updateBelief(targetUncertainty, adjustedEvidence, edge.type);
    const updateStrength = this.calculateUpdateStrength(targetUncertainty, posteriorDistribution);
    
    if (updateStrength < 0.001) return null; // Skip trivial updates
    
    const informationGain = this.calculateInformationGain(targetUncertainty, posteriorDistribution);
    
    return {
      nodeId: edge.target,
      priorDistribution: targetUncertainty,
      likelihood: this.createLikelihoodDistribution(adjustedEvidence),
      posteriorDistribution,
      updateStrength,
      informationGain
    };
  }
  
  private adjustEvidenceByEdgeType(evidence: Evidence, edgeType: string): Evidence {
    const adjustedEvidence = { ...evidence };
    
    switch (edgeType) {
      case 'supportive':
        // Strengthen evidence
        adjustedEvidence.reliability *= 1.2;
        break;
      case 'contradictory':
        // Invert and weaken evidence
        adjustedEvidence.value = 1 - adjustedEvidence.value;
        adjustedEvidence.reliability *= 0.8;
        break;
      case 'causal_direct':
        // Strong causal evidence
        adjustedEvidence.reliability *= 1.5;
        adjustedEvidence.statisticalPower *= 1.2;
        break;
      case 'causal_confounded':
        // Weakened by confounding
        adjustedEvidence.reliability *= 0.6;
        break;
      case 'temporal_precedence':
        // Temporal evidence
        adjustedEvidence.reliability *= 1.1;
        break;
      case 'correlative':
        // Weaker evidence
        adjustedEvidence.reliability *= 0.7;
        break;
      default:
        // No adjustment
        break;
    }
    
    // Ensure values stay in valid range
    adjustedEvidence.reliability = Math.min(1, Math.max(0, adjustedEvidence.reliability));
    adjustedEvidence.statisticalPower = Math.min(1, Math.max(0, adjustedEvidence.statisticalPower));
    
    return adjustedEvidence;
  }
  
  private updateBetaDistribution(
    prior: UncertaintyDistribution, 
    likelihood: UncertaintyDistribution
  ): UncertaintyDistribution {
    // Beta-Beta conjugate update
    const priorAlpha = prior.parameters.alpha;
    const priorBeta = prior.parameters.beta;
    const likelihoodAlpha = likelihood.parameters.alpha;
    const likelihoodBeta = likelihood.parameters.beta;
    
    // Conjugate update for Beta distribution
    const posteriorAlpha = priorAlpha + likelihoodAlpha - 1;
    const posteriorBeta = priorBeta + likelihoodBeta - 1;
    
    const mean = posteriorAlpha / (posteriorAlpha + posteriorBeta);
    const variance = (posteriorAlpha * posteriorBeta) / 
      ((posteriorAlpha + posteriorBeta) ** 2 * (posteriorAlpha + posteriorBeta + 1));
    
    return {
      mean,
      variance,
      distribution: 'beta',
      parameters: { alpha: posteriorAlpha, beta: posteriorBeta },
      confidenceInterval: this.calculateConfidenceInterval('beta', { alpha: posteriorAlpha, beta: posteriorBeta }, 0.95),
      entropy: this.calculateDistributionEntropy('beta', { alpha: posteriorAlpha, beta: posteriorBeta })
    };
  }
  
  private updateNormalDistribution(
    prior: UncertaintyDistribution, 
    likelihood: UncertaintyDistribution
  ): UncertaintyDistribution {
    // Normal-Normal conjugate update
    const priorMean = prior.parameters.mean;
    const priorVar = prior.parameters.std ** 2;
    const likelihoodMean = likelihood.parameters.mean;
    const likelihoodVar = likelihood.parameters.std ** 2;
    
    // Conjugate update for Normal distribution
    const posteriorVar = 1 / (1 / priorVar + 1 / likelihoodVar);
    const posteriorMean = posteriorVar * (priorMean / priorVar + likelihoodMean / likelihoodVar);
    
    return {
      mean: posteriorMean,
      variance: posteriorVar,
      distribution: 'normal',
      parameters: { mean: posteriorMean, std: Math.sqrt(posteriorVar) },
      confidenceInterval: this.calculateConfidenceInterval('normal', { mean: posteriorMean, std: Math.sqrt(posteriorVar) }, 0.95),
      entropy: this.calculateDistributionEntropy('normal', { mean: posteriorMean, std: Math.sqrt(posteriorVar) })
    };
  }
  
  private approximateBayesianUpdate(
    prior: UncertaintyDistribution, 
    likelihood: UncertaintyDistribution,
    edgeType?: string
  ): UncertaintyDistribution {
    // Approximate update using weighted average
    const weight = likelihood.variance > 0 ? 1 / likelihood.variance : 1;
    const totalWeight = 1 + weight;
    
    const posteriorMean = (prior.mean + weight * likelihood.mean) / totalWeight;
    const posteriorVar = (prior.variance + weight * likelihood.variance) / totalWeight;
    
    return {
      mean: posteriorMean,
      variance: posteriorVar,
      distribution: prior.distribution,
      parameters: { mean: posteriorMean, std: Math.sqrt(posteriorVar) },
      confidenceInterval: [posteriorMean - 1.96 * Math.sqrt(posteriorVar), posteriorMean + 1.96 * Math.sqrt(posteriorVar)],
      entropy: this.calculateDistributionEntropy(prior.distribution, { mean: posteriorMean, std: Math.sqrt(posteriorVar) })
    };
  }
  
  private calculateDistributionEntropy(distribution: string, parameters: Record<string, number>): number {
    switch (distribution) {
      case 'normal':
        return 0.5 * Math.log(2 * Math.PI * Math.E * parameters.std ** 2);
      case 'beta':
        // Approximation for beta distribution entropy
        const alpha = parameters.alpha;
        const beta = parameters.beta;
        return Math.log(this.betaFunction(alpha, beta)) - (alpha - 1) * this.digamma(alpha) - 
               (beta - 1) * this.digamma(beta) + (alpha + beta - 2) * this.digamma(alpha + beta);
      case 'uniform':
        return Math.log(parameters.max - parameters.min);
      default:
        return 1; // Default entropy
    }
  }
  
  private calculateConfidenceInterval(
    distribution: string, 
    parameters: Record<string, number>, 
    level: number
  ): [number, number] {
    const alpha = 1 - level;
    
    switch (distribution) {
      case 'normal':
        const z = this.normalInverseCDF(1 - alpha / 2);
        const margin = z * parameters.std;
        return [parameters.mean - margin, parameters.mean + margin];
      case 'beta':
        // Approximation using normal approximation to beta
        const mean = parameters.alpha / (parameters.alpha + parameters.beta);
        const variance = (parameters.alpha * parameters.beta) / 
          ((parameters.alpha + parameters.beta) ** 2 * (parameters.alpha + parameters.beta + 1));
        const std = Math.sqrt(variance);
        const zBeta = this.normalInverseCDF(1 - alpha / 2);
        return [Math.max(0, mean - zBeta * std), Math.min(1, mean + zBeta * std)];
      default:
        return [0, 1];
    }
  }
  
  private getConfidenceInterval(distribution: UncertaintyDistribution, level: number): [number, number] {
    return this.calculateConfidenceInterval(distribution.distribution, distribution.parameters, level);
  }
  
  private calculateUpdateStrength(
    prior: UncertaintyDistribution, 
    posterior: UncertaintyDistribution
  ): number {
    // KL divergence as update strength measure
    if (prior.distribution === posterior.distribution && prior.distribution === 'normal') {
      const priorParams = [prior.parameters.mean, prior.parameters.std];
      const posteriorParams = [posterior.parameters.mean, posterior.parameters.std];
      return calculateKLDivergence(priorParams, posteriorParams);
    } else {
      // Fallback to mean absolute difference
      return Math.abs(posterior.mean - prior.mean);
    }
  }
  
  private calculateInformationGain(
    prior: UncertaintyDistribution, 
    posterior: UncertaintyDistribution
  ): number {
    return prior.entropy - posterior.entropy;
  }
  
  private calculateNodeUncertainty(node: GraphNode): number {
    const variance = this.calculateConfidenceVariance(node.confidence);
    const entropy = calculateEntropy(node.confidence);
    return (variance + entropy) / 2; // Combined uncertainty measure
  }
  
  private calculateConfidenceVariance(confidence: number[]): number {
    const mean = confidence.reduce((sum, c) => sum + c, 0) / confidence.length;
    const variance = confidence.reduce((sum, c) => sum + (c - mean) ** 2, 0) / confidence.length;
    return variance;
  }
  
  private calculateTotalUncertainty(graph: GraphData): number {
    return graph.nodes.reduce((sum, node) => sum + this.calculateNodeUncertainty(node), 0);
  }
  
  private updateGraphWithUncertainty(
    graph: GraphData, 
    uncertaintyMap: Map<string, UncertaintyDistribution>
  ): GraphData {
    const updatedGraph = JSON.parse(JSON.stringify(graph));
    
    updatedGraph.nodes.forEach(node => {
      const uncertainty = uncertaintyMap.get(node.id);
      if (uncertainty) {
        // Update confidence with posterior mean
        node.confidence = node.confidence.map((_, index) => 
          index === 0 ? uncertainty.mean : node.confidence[index]
        );
        
        // Add uncertainty metadata
        node.metadata.uncertainty_distribution = uncertainty;
        node.metadata.confidence_interval = uncertainty.confidenceInterval;
        node.metadata.uncertainty_entropy = uncertainty.entropy;
      }
    });
    
    return updatedGraph;
  }
  
  private findUncertaintyHotspots(
    graph: GraphData, 
    nodeUncertainties: Array<{ nodeId: string; uncertainty: number }>
  ): Array<{ nodeId: string; uncertainty: number; neighbors: string[] }> {
    const hotspots: Array<{ nodeId: string; uncertainty: number; neighbors: string[] }> = [];
    
    // Find nodes with high uncertainty and many connections
    nodeUncertainties
      .filter(item => item.uncertainty > 0.7) // High uncertainty threshold
      .forEach(item => {
        const neighbors = graph.edges
          .filter(edge => edge.source === item.nodeId || edge.target === item.nodeId)
          .map(edge => edge.source === item.nodeId ? edge.target : edge.source);
        
        if (neighbors.length >= 3) { // Well-connected threshold
          hotspots.push({
            nodeId: item.nodeId,
            uncertainty: item.uncertainty,
            neighbors
          });
        }
      });
    
    return hotspots.sort((a, b) => b.uncertainty - a.uncertainty);
  }
  
  // Utility mathematical functions
  private betaFunction(alpha: number, beta: number): number {
    return (this.gamma(alpha) * this.gamma(beta)) / this.gamma(alpha + beta);
  }
  
  private gamma(x: number): number {
    // Stirling's approximation for gamma function
    if (x < 0.5) return Math.PI / (Math.sin(Math.PI * x) * this.gamma(1 - x));
    x -= 1;
    return Math.sqrt(2 * Math.PI * x) * Math.pow(x / Math.E, x);
  }
  
  private digamma(x: number): number {
    // Approximation for digamma function
    let result = 0;
    while (x < 8.5) {
      result -= 1 / x;
      x += 1;
    }
    const invX = 1 / x;
    result += Math.log(x) - 0.5 * invX - invX * invX / 12 + invX ** 4 / 120;
    return result;
  }
  
  private normalInverseCDF(p: number): number {
    // Approximation for normal inverse CDF (z-score)
    if (p === 0.5) return 0;
    if (p > 0.5) return -this.normalInverseCDF(1 - p);
    
    const a0 = 2.515517, a1 = 0.802853, a2 = 0.010328;
    const b1 = 1.432788, b2 = 0.189269, b3 = 0.001308;
    
    const t = Math.sqrt(-2 * Math.log(p));
    return -(t - (a0 + a1 * t + a2 * t * t) / (1 + b1 * t + b2 * t * t + b3 * t * t * t));
  }
}