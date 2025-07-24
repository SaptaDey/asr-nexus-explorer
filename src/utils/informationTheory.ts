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
): number;

export function calculateMutualInformation(X: number[], Y: number[]): number;

export function calculateMutualInformation(
  xProbsOrX: number[], 
  yProbsOrY: number[], 
  jointProbs?: number[][]
): number {
  if (jointProbs) {
    // Original signature: (xProbs, yProbs, jointProbs)
    const xProbs = xProbsOrX;
    const yProbs = yProbsOrY;
    
    const hX = calculateEntropy(xProbs);
    const hY = calculateEntropy(yProbs);
    
    // Calculate joint entropy
    const jointFlat = jointProbs.flat();
    const hXY = calculateEntropy(jointFlat);
    
    return hX + hY - hXY;
  } else {
    // New signature: (X, Y) - calculate mutual information from data arrays
    const X = xProbsOrX;
    const Y = yProbsOrY;
    
    if (X.length !== Y.length) {
      return 0; // No mutual information if different lengths
    }
    
    // Create frequency distributions
    const xUnique = [...new Set(X)];
    const yUnique = [...new Set(Y)];
    
    // Calculate marginal probabilities
    const xProbs = xUnique.map(x => X.filter(val => val === x).length / X.length);
    const yProbs = yUnique.map(y => Y.filter(val => val === y).length / Y.length);
    
    // Calculate joint probabilities
    const jointProbs: number[][] = [];
    for (let i = 0; i < xUnique.length; i++) {
      jointProbs[i] = [];
      for (let j = 0; j < yUnique.length; j++) {
        const count = X.reduce((sum, x, idx) => 
          (X[idx] === xUnique[i] && Y[idx] === yUnique[j]) ? sum + 1 : sum, 0);
        jointProbs[i][j] = count / X.length;
      }
    }
    
    // Calculate entropies
    const hX = calculateEntropy(xProbs);
    const hY = calculateEntropy(yProbs);
    const hXY = calculateEntropy(jointProbs.flat());
    
    return hX + hY - hXY;
  }
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
): number;

export function calculateInformationGain(
  beforeSplit: number[],
  afterSplit: number[][]
): number;

export function calculateInformationGain(
  parentEntropyOrBeforeSplit: number | number[],
  childSizesOrAfterSplit: number[] | number[][],
  childEntropies?: number[]
): number {
  if (typeof parentEntropyOrBeforeSplit === 'number' && childEntropies) {
    // Original signature: (parentEntropy, childSizes, childEntropies)
    const parentEntropy = parentEntropyOrBeforeSplit;
    const childSizes = childSizesOrAfterSplit as number[];
    
    const totalSize = childSizes.reduce((sum, size) => sum + size, 0);
    
    let weightedChildEntropy = 0;
    for (let i = 0; i < childSizes.length; i++) {
      const weight = childSizes[i] / totalSize;
      weightedChildEntropy += weight * childEntropies[i];
    }
    
    return parentEntropy - weightedChildEntropy;
  } else {
    // New signature: (beforeSplit, afterSplit)
    const beforeSplit = parentEntropyOrBeforeSplit as number[];
    const afterSplit = childSizesOrAfterSplit as number[][];
    
    // Calculate entropy before split
    const uniqueValues = [...new Set(beforeSplit)];
    const beforeProbs = uniqueValues.map(val => 
      beforeSplit.filter(x => x === val).length / beforeSplit.length
    );
    const parentEntropy = calculateEntropy(beforeProbs);
    
    // Calculate weighted entropy after split
    const totalSize = beforeSplit.length;
    let weightedChildEntropy = 0;
    
    for (const split of afterSplit) {
      if (split.length === 0) continue;
      
      const weight = split.length / totalSize;
      const splitUniqueValues = [...new Set(split)];
      const splitProbs = splitUniqueValues.map(val => 
        split.filter(x => x === val).length / split.length
      );
      const splitEntropy = calculateEntropy(splitProbs);
      weightedChildEntropy += weight * splitEntropy;
    }
    
    const informationGain = parentEntropy - weightedChildEntropy;
    return Math.max(0, informationGain); // Ensure non-negative result
  }
}

/**
 * Calculate minimum description length (MDL) for model selection
 */
export function calculateDescriptionLength(data: string, model: string): number {
  if (!data && !model) return 0;
  if (!data) return model.length * Math.log2(256); // Character encoding cost
  if (!model) return data.length * Math.log2(256); // Raw data cost
  
  // Simple MDL calculation based on string lengths and compression potential
  const dataLength = data.length;
  const modelLength = model.length;
  
  // Estimate compression based on repetition patterns
  const uniqueChars = new Set(data).size;
  const compressionRatio = uniqueChars / Math.max(dataLength, 1);
  
  // MDL = model description length + data description length given model
  const modelCost = modelLength * Math.log2(256);
  const dataCost = dataLength * compressionRatio * Math.log2(uniqueChars || 1);
  
  return modelCost + dataCost;
}

/**
 * Calculate complexity measure based on graph structure
 */
export function calculateGraphComplexity(
  nodeCount: number,
  edgeCount: number,
  hyperedgeCount?: number
): number;

export function calculateGraphComplexity(
  graph: { nodes?: any[]; edges?: any[]; hyperedges?: any[] }
): number;

export function calculateGraphComplexity(
  nodeCountOrGraph: number | { nodes?: any[]; edges?: any[]; hyperedges?: any[] },
  edgeCount?: number,
  hyperedgeCount: number = 0
): number {
  let nodeCount: number;
  let edges: number;
  let hyperedges: number;

  if (typeof nodeCountOrGraph === 'object') {
    // Handle graph object input
    const graph = nodeCountOrGraph;
    nodeCount = graph.nodes?.length || 0;
    edges = graph.edges?.length || 0;
    hyperedges = graph.hyperedges?.length || 0;
  } else {
    // Handle separate parameters
    nodeCount = nodeCountOrGraph;
    edges = edgeCount || 0;
    hyperedges = hyperedgeCount;
  }

  // Complexity based on structural properties
  const basicComplexity = Math.log2(nodeCount + 1) + Math.log2(edges + 1);
  const hyperedgeComplexity = hyperedges > 0 ? Math.log2(hyperedges + 1) : 0;
  
  return basicComplexity + hyperedgeComplexity;
}

/**
 * Calculate confidence-based information metrics for ASR-GoT nodes
 */
export function calculateNodeInformationMetrics(
  confidenceVector: number[],
  nodeConnections: number,
  graphSize: number
): InformationMetrics;

export function calculateNodeInformationMetrics(
  node: { confidence: number[]; metadata?: any }
): InformationMetrics;

export function calculateNodeInformationMetrics(
  nodeOrConfidence: number[] | { confidence: number[]; metadata?: any },
  nodeConnections?: number,
  graphSize?: number
): InformationMetrics {
  let confidenceVector: number[];
  let connections: number;
  let size: number;

  if (Array.isArray(nodeOrConfidence)) {
    // Original function signature: (confidenceVector, nodeConnections, graphSize)
    confidenceVector = nodeOrConfidence;
    connections = nodeConnections!;
    size = graphSize!;
  } else {
    // New signature: (node)
    const node = nodeOrConfidence;
    confidenceVector = node.confidence;
    connections = node.metadata?.evidence_count || 1;
    size = 10; // Default graph size for single node analysis
  }

  // Calculate entropy of confidence vector
  const entropy = calculateEntropy(confidenceVector);
  
  // Calculate information gain based on node position in graph
  const information_gain = Math.log2(size / (connections + 1));
  
  // Calculate complexity based on node properties
  const complexity = Math.log2(confidenceVector.length) + Math.log2(connections + 1);
  
  return {
    entropy,
    information_gain,
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
): InformationMetrics;

export function calculateEvidenceInformationMetrics(
  evidenceData: string[]
): InformationMetrics;

export function calculateEvidenceInformationMetrics(
  evidenceQualityOrData: 'high' | 'medium' | 'low' | string[],
  statisticalPower?: number,
  peerReviewStatus?: string
): InformationMetrics {
  if (Array.isArray(evidenceQualityOrData)) {
    // Handle string array input
    const evidenceData = evidenceQualityOrData;
    const entropy = calculateEntropy(evidenceData.map((_, i) => 1 / evidenceData.length)); // Uniform distribution
    const information_gain = Math.log2(evidenceData.length + 1); // Information gain from multiple evidence pieces
    const complexity = Math.log2(evidenceData.length + 1); // Complexity increases with more evidence
    
    return {
      entropy,
      information_gain,
      complexity
    };
  }
  
  // Original function logic for quality-based input
  const evidenceQuality = evidenceQualityOrData;
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
    information_gain: informationGain,
    complexity
  };
}

/**
 * Calculate hypothesis information metrics
 */
export function calculateHypothesisInformationMetrics(
  hypothesisList: string[],
  evidenceSupport: number[]
): InformationMetrics;

export function calculateHypothesisInformationMetrics(
  hypothesesData: { text: string; confidence: number }[]
): InformationMetrics;

export function calculateHypothesisInformationMetrics(
  hypothesesListOrData: string[] | { text: string; confidence: number }[],
  evidenceSupport?: number[]
): InformationMetrics {
  let hypothesisList: string[];
  let supportValues: number[];

  if (Array.isArray(hypothesesListOrData) && hypothesesListOrData.length > 0 && typeof hypothesesListOrData[0] === 'object') {
    // Handle object array input
    const hypothesesData = hypothesesListOrData as { text: string; confidence: number }[];
    hypothesisList = hypothesesData.map(h => h.text);
    supportValues = hypothesesData.map(h => h.confidence);
  } else {
    // Handle original string array input
    hypothesisList = hypothesesListOrData as string[];
    supportValues = evidenceSupport || [];
  }

  // Calculate entropy of evidence support distribution
  const entropy = calculateEntropy(supportValues);
  
  // Calculate complexity based on hypothesis count
  const complexity = Math.log2(hypothesisList.length);
  
  // Calculate information gain based on evidence variance
  const meanSupport = supportValues.reduce((sum, val) => sum + val, 0) / supportValues.length;
  const variance = supportValues.reduce((sum, val) => sum + Math.pow(val - meanSupport, 2), 0) / supportValues.length;
  const information_gain = 1 - variance; // Higher variance = lower information gain
  
  return {
    entropy,
    information_gain,
    complexity
  };
}