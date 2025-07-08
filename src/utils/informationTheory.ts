// P1.27: Information Theory Metrics Implementation
// Implements entropy, KL divergence, mutual information, and MDL principles

export interface InformationMetrics {
  entropy: number;
  klDivergence?: number;
  mutualInformation?: number;
  mdlScore?: number;
  informationGain?: number;
  complexity?: number;
}

/**
 * Calculate Shannon entropy for a probability distribution
 * H(X) = -Σ p(x) * log2(p(x))
 */
export function calculateEntropy(probabilities: number[]): number {
  // Normalize probabilities
  const sum = probabilities.reduce((acc, p) => acc + p, 0);
  const normalizedProbs = probabilities.map(p => p / sum);
  
  // Calculate entropy
  let entropy = 0;
  for (const p of normalizedProbs) {
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }
  
  return entropy;
}

/**
 * Calculate KL divergence between two probability distributions
 * KL(P||Q) = Σ p(x) * log2(p(x)/q(x))
 */
export function calculateKLDivergence(p: number[], q: number[]): number {
  if (p.length !== q.length) {
    throw new Error('Probability distributions must have same length');
  }
  
  // Normalize distributions
  const pSum = p.reduce((acc, val) => acc + val, 0);
  const qSum = q.reduce((acc, val) => acc + val, 0);
  const pNorm = p.map(val => val / pSum);
  const qNorm = q.map(val => val / qSum);
  
  let klDiv = 0;
  for (let i = 0; i < pNorm.length; i++) {
    if (pNorm[i] > 0 && qNorm[i] > 0) {
      klDiv += pNorm[i] * Math.log2(pNorm[i] / qNorm[i]);
    }
  }
  
  return klDiv;
}

/**
 * Calculate mutual information between two variables
 * I(X;Y) = H(X) + H(Y) - H(X,Y)
 */
export function calculateMutualInformation(
  xProbs: number[], 
  yProbs: number[], 
  jointProbs: number[][]
): number {
  const hX = calculateEntropy(xProbs);
  const hY = calculateEntropy(yProbs);
  
  // Calculate joint entropy
  const jointFlat = jointProbs.flat();
  const hXY = calculateEntropy(jointFlat);
  
  return hX + hY - hXY;
}

/**
 * Calculate Minimum Description Length (MDL) score
 * MDL = -log(P(data|model)) + complexity_penalty
 */
export function calculateMDLScore(
  dataLogLikelihood: number, 
  modelComplexity: number,
  dataSize: number
): number {
  // MDL = -log(P(data|model)) + (k/2) * log(n)
  // where k is model complexity and n is data size
  const dataTerm = -dataLogLikelihood;
  const complexityTerm = (modelComplexity / 2) * Math.log(dataSize);
  
  return dataTerm + complexityTerm;
}

/**
 * Calculate information gain for a decision
 * IG(S,A) = H(S) - Σ (|Sv|/|S|) * H(Sv)
 */
export function calculateInformationGain(
  parentEntropy: number,
  childSizes: number[],
  childEntropies: number[]
): number {
  const totalSize = childSizes.reduce((sum, size) => sum + size, 0);
  
  let weightedChildEntropy = 0;
  for (let i = 0; i < childSizes.length; i++) {
    const weight = childSizes[i] / totalSize;
    weightedChildEntropy += weight * childEntropies[i];
  }
  
  return parentEntropy - weightedChildEntropy;
}

/**
 * Calculate complexity measure based on graph structure
 */
export function calculateGraphComplexity(
  nodeCount: number,
  edgeCount: number,
  hyperedgeCount: number = 0
): number {
  // Complexity based on structural properties
  const basicComplexity = Math.log2(nodeCount + 1) + Math.log2(edgeCount + 1);
  const hyperedgeComplexity = hyperedgeCount > 0 ? Math.log2(hyperedgeCount + 1) : 0;
  
  return basicComplexity + hyperedgeComplexity;
}

/**
 * Calculate confidence-based information metrics for ASR-GoT nodes
 */
export function calculateNodeInformationMetrics(
  confidenceVector: number[],
  nodeConnections: number,
  graphSize: number
): InformationMetrics {
  // Calculate entropy of confidence vector
  const entropy = calculateEntropy(confidenceVector);
  
  // Calculate information gain based on node position in graph
  const informationGain = Math.log2(graphSize / (nodeConnections + 1));
  
  // Calculate complexity based on node properties
  const complexity = Math.log2(confidenceVector.length) + Math.log2(nodeConnections + 1);
  
  return {
    entropy,
    informationGain,
    complexity
  };
}

/**
 * Calculate evidence information metrics
 */
export function calculateEvidenceInformationMetrics(
  evidenceQuality: 'high' | 'medium' | 'low',
  statisticalPower: number,
  peerReviewStatus: string
): InformationMetrics {
  // Convert qualitative measures to probabilities
  const qualityProbs = evidenceQuality === 'high' ? [0.8, 0.15, 0.05] :
                      evidenceQuality === 'medium' ? [0.3, 0.6, 0.1] :
                      [0.1, 0.3, 0.6];
  
  const entropy = calculateEntropy(qualityProbs);
  
  // Information gain based on statistical power
  const informationGain = -Math.log2(1 - statisticalPower + 0.01); // Avoid log(0)
  
  // Complexity based on peer review status
  const complexity = peerReviewStatus === 'peer-reviewed' ? 0.5 : 
                     peerReviewStatus === 'preprint' ? 0.7 : 1.0;
  
  return {
    entropy,
    informationGain,
    complexity
  };
}

/**
 * Calculate hypothesis information metrics
 */
export function calculateHypothesisInformationMetrics(
  hypothesisList: string[],
  evidenceSupport: number[]
): InformationMetrics {
  // Calculate entropy of evidence support distribution
  const entropy = calculateEntropy(evidenceSupport);
  
  // Calculate complexity based on hypothesis count
  const complexity = Math.log2(hypothesisList.length);
  
  // Calculate information gain based on evidence variance
  const meanSupport = evidenceSupport.reduce((sum, val) => sum + val, 0) / evidenceSupport.length;
  const variance = evidenceSupport.reduce((sum, val) => sum + Math.pow(val - meanSupport, 2), 0) / evidenceSupport.length;
  const informationGain = 1 - variance; // Higher variance = lower information gain
  
  return {
    entropy,
    informationGain,
    complexity
  };
}