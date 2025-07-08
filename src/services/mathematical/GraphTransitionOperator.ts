// P1.11: Mathematical Formalism - Graph Transition Operators
// Implements O: Gₜ → Gₜ₊₁ transition operations for ASR-GoT framework

import { GraphData, GraphNode, GraphEdge, HyperEdge } from '@/types/asrGotTypes';
import { calculateEntropy, calculateMutualInformation } from '@/utils/informationTheory';

export interface SpectralAnalysis {
  eigenvalues: number[];
  eigenvectors: number[][];
  laplacianMatrix: number[][];
  connectivity: number;
  algebraicConnectivity: number;
}

export interface CentralityMeasures {
  betweenness: Record<string, number>;
  closeness: Record<string, number>;
  pagerank: Record<string, number>;
  eigenvector: Record<string, number>;
  degree: Record<string, number>;
}

export interface Community {
  id: string;
  nodes: string[];
  modularity: number;
  internalDensity: number;
  externalConnectivity: number;
}

export interface GraphTransitionResult {
  newGraph: GraphData;
  transitionMetrics: {
    nodesAdded: number;
    nodesRemoved: number;
    edgesAdded: number;
    edgesRemoved: number;
    topologyChange: number;
    informationGain: number;
  };
  confidence: number;
}

export class GraphTransitionOperator {
  
  /**
   * Apply transition operator O: Gₜ → Gₜ₊₁
   * Transforms current graph state based on new evidence
   */
  public applyTransition(
    currentGraph: GraphData, 
    evidence: GraphNode[], 
    transitionType: 'evidence_integration' | 'pruning' | 'merging' | 'refinement'
  ): GraphTransitionResult {
    const initialNodeCount = currentGraph.nodes.length;
    const initialEdgeCount = currentGraph.edges.length;
    
    let newGraph: GraphData = JSON.parse(JSON.stringify(currentGraph)); // Deep copy
    
    switch (transitionType) {
      case 'evidence_integration':
        newGraph = this.integrateEvidenceTransition(newGraph, evidence);
        break;
      case 'pruning':
        newGraph = this.pruningTransition(newGraph);
        break;
      case 'merging':
        newGraph = this.mergingTransition(newGraph);
        break;
      case 'refinement':
        newGraph = this.refinementTransition(newGraph);
        break;
    }
    
    // Calculate transition metrics
    const transitionMetrics = {
      nodesAdded: newGraph.nodes.length - initialNodeCount,
      nodesRemoved: Math.max(0, initialNodeCount - newGraph.nodes.length),
      edgesAdded: newGraph.edges.length - initialEdgeCount,
      edgesRemoved: Math.max(0, initialEdgeCount - newGraph.edges.length),
      topologyChange: this.calculateTopologyChange(currentGraph, newGraph),
      informationGain: this.calculateInformationGain(currentGraph, newGraph)
    };
    
    // Update graph metadata
    newGraph.metadata.last_updated = new Date().toISOString();
    newGraph.metadata.total_nodes = newGraph.nodes.length;
    newGraph.metadata.total_edges = newGraph.edges.length;
    
    return {
      newGraph,
      transitionMetrics,
      confidence: this.calculateTransitionConfidence(transitionMetrics)
    };
  }
  
  /**
   * Calculate centrality measures for all nodes
   */
  public computeCentralityMeasures(graph: GraphData): CentralityMeasures {
    const adjacencyMatrix = this.buildAdjacencyMatrix(graph);
    
    return {
      betweenness: this.calculateBetweennessCentrality(graph, adjacencyMatrix),
      closeness: this.calculateClosenessCentrality(graph, adjacencyMatrix),
      pagerank: this.calculatePageRank(graph, adjacencyMatrix),
      eigenvector: this.calculateEigenvectorCentrality(graph, adjacencyMatrix),
      degree: this.calculateDegreeCentrality(graph)
    };
  }
  
  /**
   * Detect communities using Louvain algorithm
   */
  public detectCommunities(graph: GraphData, algorithm: 'louvain' | 'leiden' = 'louvain'): Community[] {
    const adjacencyMatrix = this.buildAdjacencyMatrix(graph);
    
    if (algorithm === 'louvain') {
      return this.louvainCommunityDetection(graph, adjacencyMatrix);
    } else {
      return this.leidenCommunityDetection(graph, adjacencyMatrix);
    }
  }
  
  /**
   * Calculate spectral properties of the graph
   */
  public calculateSpectralProperties(graph: GraphData): SpectralAnalysis {
    const laplacianMatrix = this.buildLaplacianMatrix(graph);
    const eigenSystem = this.calculateEigenSystem(laplacianMatrix);
    
    return {
      eigenvalues: eigenSystem.eigenvalues,
      eigenvectors: eigenSystem.eigenvectors,
      laplacianMatrix,
      connectivity: this.calculateConnectivity(graph),
      algebraicConnectivity: eigenSystem.eigenvalues[1] || 0 // Second smallest eigenvalue
    };
  }
  
  /**
   * Private transition methods
   */
  private integrateEvidenceTransition(graph: GraphData, evidence: GraphNode[]): GraphData {
    // Add evidence nodes with proper connections
    evidence.forEach(evidenceNode => {
      // Add evidence node
      graph.nodes.push(evidenceNode);
      
      // Connect to relevant existing nodes based on semantic similarity
      const relevantNodes = this.findRelevantNodes(graph, evidenceNode);
      relevantNodes.forEach(node => {
        const edge: GraphEdge = {
          id: `trans_${evidenceNode.id}_${node.id}`,
          source: evidenceNode.id,
          target: node.id,
          type: 'supportive',
          confidence: this.calculateSemanticSimilarity(evidenceNode, node),
          metadata: {
            type: 'transition_generated',
            source_description: 'Evidence integration transition',
            timestamp: new Date().toISOString()
          }
        };
        graph.edges.push(edge);
      });
    });
    
    return graph;
  }
  
  private pruningTransition(graph: GraphData): GraphData {
    // Remove low-confidence nodes and edges
    const confidentNodes = graph.nodes.filter(node => {
      const avgConfidence = node.confidence.reduce((sum, c) => sum + c, 0) / node.confidence.length;
      return avgConfidence >= 0.3; // Threshold for pruning
    });
    
    const nodeIds = new Set(confidentNodes.map(n => n.id));
    const validEdges = graph.edges.filter(edge => 
      nodeIds.has(edge.source) && nodeIds.has(edge.target) && edge.confidence >= 0.3
    );
    
    return {
      ...graph,
      nodes: confidentNodes,
      edges: validEdges
    };
  }
  
  private mergingTransition(graph: GraphData): GraphData {
    // Merge semantically similar nodes
    const mergeGroups = this.identifySimilarNodeGroups(graph);
    
    mergeGroups.forEach(group => {
      if (group.length > 1) {
        const mergedNode = this.mergeNodeGroup(group);
        
        // Remove original nodes
        graph.nodes = graph.nodes.filter(node => !group.map(n => n.id).includes(node.id));
        
        // Add merged node
        graph.nodes.push(mergedNode);
        
        // Update edges
        graph.edges = this.updateEdgesAfterMerge(graph.edges, group, mergedNode);
      }
    });
    
    return graph;
  }
  
  private refinementTransition(graph: GraphData): GraphData {
    // Refine node positions and edge weights based on network analysis
    const centrality = this.computeCentralityMeasures(graph);
    
    // Update node positions based on centrality
    graph.nodes.forEach(node => {
      const importance = centrality.pagerank[node.id] || 0;
      if (node.position) {
        // Adjust position based on importance (central nodes towards center)
        const centerX = 400, centerY = 400;
        const currentX = node.position.x;
        const currentY = node.position.y;
        
        node.position.x = currentX + (centerX - currentX) * importance * 0.1;
        node.position.y = currentY + (centerY - currentY) * importance * 0.1;
      }
    });
    
    // Refine edge weights based on betweenness centrality
    graph.edges.forEach(edge => {
      const sourceCentrality = centrality.betweenness[edge.source] || 0;
      const targetCentrality = centrality.betweenness[edge.target] || 0;
      const avgCentrality = (sourceCentrality + targetCentrality) / 2;
      
      // Boost confidence for edges between central nodes
      edge.confidence = Math.min(1, edge.confidence + avgCentrality * 0.1);
    });
    
    return graph;
  }
  
  /**
   * Centrality calculation methods
   */
  private calculateBetweennessCentrality(graph: GraphData, adjacencyMatrix: number[][]): Record<string, number> {
    const betweenness: Record<string, number> = {};
    const nodeIds = graph.nodes.map(n => n.id);
    
    // Initialize all betweenness centralities to 0
    nodeIds.forEach(id => betweenness[id] = 0);
    
    // For each pair of nodes, calculate shortest paths and accumulate betweenness
    for (let s = 0; s < nodeIds.length; s++) {
      for (let t = s + 1; t < nodeIds.length; t++) {
        const paths = this.findAllShortestPaths(adjacencyMatrix, s, t);
        paths.forEach(path => {
          // Add to betweenness for intermediate nodes
          for (let i = 1; i < path.length - 1; i++) {
            betweenness[nodeIds[path[i]]] += 1 / paths.length;
          }
        });
      }
    }
    
    // Normalize by the number of pairs
    const normalizationFactor = (nodeIds.length - 1) * (nodeIds.length - 2) / 2;
    Object.keys(betweenness).forEach(id => {
      betweenness[id] /= normalizationFactor;
    });
    
    return betweenness;
  }
  
  private calculateClosenessCentrality(graph: GraphData, adjacencyMatrix: number[][]): Record<string, number> {
    const closeness: Record<string, number> = {};
    const nodeIds = graph.nodes.map(n => n.id);
    
    for (let i = 0; i < nodeIds.length; i++) {
      const distances = this.dijkstraShortestPaths(adjacencyMatrix, i);
      const totalDistance = distances.reduce((sum, dist) => sum + (dist === Infinity ? 0 : dist), 0);
      const reachableNodes = distances.filter(dist => dist !== Infinity).length - 1; // Exclude self
      
      closeness[nodeIds[i]] = reachableNodes > 0 ? reachableNodes / totalDistance : 0;
    }
    
    return closeness;
  }
  
  private calculatePageRank(graph: GraphData, adjacencyMatrix: number[][], damping: number = 0.85): Record<string, number> {
    const nodeIds = graph.nodes.map(n => n.id);
    const n = nodeIds.length;
    
    if (n === 0) return {};
    
    // Initialize PageRank values
    let pagerank = new Array(n).fill(1 / n);
    let newPagerank = new Array(n).fill(0);
    
    // Calculate out-degree for each node
    const outDegree = adjacencyMatrix.map(row => row.reduce((sum, val) => sum + val, 0));
    
    // Iterate until convergence
    for (let iteration = 0; iteration < 100; iteration++) {
      for (let i = 0; i < n; i++) {
        newPagerank[i] = (1 - damping) / n;
        
        for (let j = 0; j < n; j++) {
          if (adjacencyMatrix[j][i] > 0 && outDegree[j] > 0) {
            newPagerank[i] += damping * pagerank[j] / outDegree[j];
          }
        }
      }
      
      // Check for convergence
      let diff = 0;
      for (let i = 0; i < n; i++) {
        diff += Math.abs(newPagerank[i] - pagerank[i]);
      }
      
      pagerank = [...newPagerank];
      
      if (diff < 1e-6) break;
    }
    
    const result: Record<string, number> = {};
    nodeIds.forEach((id, index) => {
      result[id] = pagerank[index];
    });
    
    return result;
  }
  
  private calculateEigenvectorCentrality(graph: GraphData, adjacencyMatrix: number[][]): Record<string, number> {
    const nodeIds = graph.nodes.map(n => n.id);
    const n = nodeIds.length;
    
    if (n === 0) return {};
    
    // Power iteration method to find dominant eigenvector
    let vector = new Array(n).fill(1 / Math.sqrt(n));
    
    for (let iteration = 0; iteration < 100; iteration++) {
      const newVector = new Array(n).fill(0);
      
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          newVector[i] += adjacencyMatrix[i][j] * vector[j];
        }
      }
      
      // Normalize
      const norm = Math.sqrt(newVector.reduce((sum, val) => sum + val * val, 0));
      if (norm > 0) {
        for (let i = 0; i < n; i++) {
          newVector[i] /= norm;
        }
      }
      
      // Check convergence
      let diff = 0;
      for (let i = 0; i < n; i++) {
        diff += Math.abs(newVector[i] - vector[i]);
      }
      
      vector = newVector;
      
      if (diff < 1e-6) break;
    }
    
    const result: Record<string, number> = {};
    nodeIds.forEach((id, index) => {
      result[id] = Math.abs(vector[index]);
    });
    
    return result;
  }
  
  private calculateDegreeCentrality(graph: GraphData): Record<string, number> {
    const degree: Record<string, number> = {};
    
    // Initialize
    graph.nodes.forEach(node => {
      degree[node.id] = 0;
    });
    
    // Count connections
    graph.edges.forEach(edge => {
      degree[edge.source]++;
      degree[edge.target]++;
    });
    
    // Normalize by maximum possible degree
    const maxDegree = graph.nodes.length - 1;
    Object.keys(degree).forEach(id => {
      degree[id] /= maxDegree;
    });
    
    return degree;
  }
  
  /**
   * Community detection algorithms
   */
  private louvainCommunityDetection(graph: GraphData, adjacencyMatrix: number[][]): Community[] {
    // Simplified Louvain algorithm implementation
    const nodeIds = graph.nodes.map(n => n.id);
    const communities: Community[] = [];
    
    // Initialize each node as its own community
    let nodeToComm = nodeIds.map((_, index) => index);
    let improved = true;
    
    while (improved) {
      improved = false;
      
      for (let node = 0; node < nodeIds.length; node++) {
        const currentComm = nodeToComm[node];
        let bestComm = currentComm;
        let bestGain = 0;
        
        // Check neighboring communities
        const neighbors = this.getNeighbors(adjacencyMatrix, node);
        const neighborComms = new Set(neighbors.map(n => nodeToComm[n]));
        
        for (const comm of neighborComms) {
          if (comm !== currentComm) {
            const gain = this.calculateModularityGain(adjacencyMatrix, nodeToComm, node, comm);
            if (gain > bestGain) {
              bestGain = gain;
              bestComm = comm;
            }
          }
        }
        
        if (bestComm !== currentComm) {
          nodeToComm[node] = bestComm;
          improved = true;
        }
      }
    }
    
    // Build communities
    const commMap = new Map<number, string[]>();
    nodeToComm.forEach((comm, index) => {
      if (!commMap.has(comm)) {
        commMap.set(comm, []);
      }
      commMap.get(comm)!.push(nodeIds[index]);
    });
    
    commMap.forEach((nodes, commId) => {
      communities.push({
        id: `comm_${commId}`,
        nodes,
        modularity: this.calculateCommunityModularity(adjacencyMatrix, nodes, nodeIds),
        internalDensity: this.calculateInternalDensity(graph, nodes),
        externalConnectivity: this.calculateExternalConnectivity(graph, nodes)
      });
    });
    
    return communities;
  }
  
  private leidenCommunityDetection(graph: GraphData, adjacencyMatrix: number[][]): Community[] {
    // Simplified Leiden algorithm (similar to Louvain with refinement)
    // For this implementation, we'll use the Louvain result as a starting point
    return this.louvainCommunityDetection(graph, adjacencyMatrix);
  }
  
  /**
   * Utility methods
   */
  private buildAdjacencyMatrix(graph: GraphData): number[][] {
    const nodeIds = graph.nodes.map(n => n.id);
    const nodeIndexMap = new Map(nodeIds.map((id, index) => [id, index]));
    const n = nodeIds.length;
    
    const matrix = Array(n).fill(null).map(() => Array(n).fill(0));
    
    graph.edges.forEach(edge => {
      const sourceIndex = nodeIndexMap.get(edge.source);
      const targetIndex = nodeIndexMap.get(edge.target);
      
      if (sourceIndex !== undefined && targetIndex !== undefined) {
        matrix[sourceIndex][targetIndex] = edge.confidence;
        if (!edge.bidirectional) {
          matrix[targetIndex][sourceIndex] = edge.confidence;
        }
      }
    });
    
    return matrix;
  }
  
  private buildLaplacianMatrix(graph: GraphData): number[][] {
    const adjacencyMatrix = this.buildAdjacencyMatrix(graph);
    const n = adjacencyMatrix.length;
    const laplacian = Array(n).fill(null).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      let degree = 0;
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          laplacian[i][j] = -adjacencyMatrix[i][j];
          degree += adjacencyMatrix[i][j];
        }
      }
      laplacian[i][i] = degree;
    }
    
    return laplacian;
  }
  
  private calculateEigenSystem(matrix: number[][]): { eigenvalues: number[]; eigenvectors: number[][] } {
    // Simplified eigenvalue calculation using power iteration for dominant eigenvalue
    // For production, consider using a proper numerical library
    const n = matrix.length;
    
    if (n === 0) {
      return { eigenvalues: [], eigenvectors: [] };
    }
    
    // This is a simplified implementation - in production, use a proper numerical library
    return {
      eigenvalues: [1, 0.8, 0.6], // Placeholder
      eigenvectors: Array(3).fill(null).map(() => Array(n).fill(0.1))
    };
  }
  
  private findAllShortestPaths(adjacencyMatrix: number[][], source: number, target: number): number[][] {
    // Simplified BFS for shortest paths
    const paths: number[][] = [];
    const queue: { node: number; path: number[] }[] = [{ node: source, path: [source] }];
    const visited = new Set<number>();
    let shortestLength = Infinity;
    
    while (queue.length > 0) {
      const { node, path } = queue.shift()!;
      
      if (path.length > shortestLength) continue;
      
      if (node === target) {
        if (path.length < shortestLength) {
          shortestLength = path.length;
          paths.length = 0; // Clear longer paths
        }
        if (path.length === shortestLength) {
          paths.push([...path]);
        }
        continue;
      }
      
      for (let neighbor = 0; neighbor < adjacencyMatrix[node].length; neighbor++) {
        if (adjacencyMatrix[node][neighbor] > 0 && !path.includes(neighbor)) {
          queue.push({ node: neighbor, path: [...path, neighbor] });
        }
      }
    }
    
    return paths;
  }
  
  private dijkstraShortestPaths(adjacencyMatrix: number[][], source: number): number[] {
    const n = adjacencyMatrix.length;
    const distances = new Array(n).fill(Infinity);
    const visited = new Array(n).fill(false);
    distances[source] = 0;
    
    for (let i = 0; i < n; i++) {
      let minDistance = Infinity;
      let minIndex = -1;
      
      for (let j = 0; j < n; j++) {
        if (!visited[j] && distances[j] < minDistance) {
          minDistance = distances[j];
          minIndex = j;
        }
      }
      
      if (minIndex === -1) break;
      
      visited[minIndex] = true;
      
      for (let j = 0; j < n; j++) {
        if (!visited[j] && adjacencyMatrix[minIndex][j] > 0) {
          const newDistance = distances[minIndex] + adjacencyMatrix[minIndex][j];
          if (newDistance < distances[j]) {
            distances[j] = newDistance;
          }
        }
      }
    }
    
    return distances;
  }
  
  private calculateTopologyChange(oldGraph: GraphData, newGraph: GraphData): number {
    // Calculate structural change using graph edit distance approximation
    const nodeSetOld = new Set(oldGraph.nodes.map(n => n.id));
    const nodeSetNew = new Set(newGraph.nodes.map(n => n.id));
    
    const nodeChanges = (nodeSetOld.size + nodeSetNew.size - 2 * this.setIntersectionSize(nodeSetOld, nodeSetNew));
    const edgeChanges = Math.abs(oldGraph.edges.length - newGraph.edges.length);
    
    return (nodeChanges + edgeChanges) / (Math.max(oldGraph.nodes.length + oldGraph.edges.length, 1));
  }
  
  private calculateInformationGain(oldGraph: GraphData, newGraph: GraphData): number {
    // Calculate information gain using entropy difference
    const oldEntropy = this.calculateGraphEntropy(oldGraph);
    const newEntropy = this.calculateGraphEntropy(newGraph);
    
    return newEntropy - oldEntropy;
  }
  
  private calculateGraphEntropy(graph: GraphData): number {
    // Calculate entropy based on node confidence distributions
    const allConfidences = graph.nodes.flatMap(n => n.confidence);
    return calculateEntropy(allConfidences);
  }
  
  private calculateTransitionConfidence(metrics: any): number {
    // Calculate confidence based on transition metrics
    const baseConfidence = 0.5;
    const stabilityBonus = Math.max(0, 0.2 - metrics.topologyChange);
    const informationBonus = Math.max(0, Math.min(0.3, metrics.informationGain));
    
    return Math.min(1, baseConfidence + stabilityBonus + informationBonus);
  }
  
  private findRelevantNodes(graph: GraphData, evidenceNode: GraphNode): GraphNode[] {
    // Find nodes semantically related to evidence
    return graph.nodes.filter(node => 
      this.calculateSemanticSimilarity(evidenceNode, node) > 0.6
    ).slice(0, 3); // Limit to top 3 most relevant
  }
  
  private calculateSemanticSimilarity(node1: GraphNode, node2: GraphNode): number {
    // Simplified semantic similarity based on metadata
    const overlap = this.getMetadataOverlap(node1.metadata, node2.metadata);
    const typeCompatibility = node1.type === node2.type ? 0.2 : 0;
    
    return Math.min(1, overlap + typeCompatibility);
  }
  
  private getMetadataOverlap(meta1: any, meta2: any): number {
    const tags1 = meta1.disciplinary_tags || [];
    const tags2 = meta2.disciplinary_tags || [];
    
    const intersection = tags1.filter((tag: string) => tags2.includes(tag));
    const union = [...new Set([...tags1, ...tags2])];
    
    return union.length > 0 ? intersection.length / union.length : 0;
  }
  
  private identifySimilarNodeGroups(graph: GraphData): GraphNode[][] {
    const groups: GraphNode[][] = [];
    const processed = new Set<string>();
    
    graph.nodes.forEach(node => {
      if (processed.has(node.id)) return;
      
      const similar = graph.nodes.filter(other => 
        !processed.has(other.id) && 
        this.calculateSemanticSimilarity(node, other) > 0.8
      );
      
      if (similar.length > 1) {
        groups.push(similar);
        similar.forEach(n => processed.add(n.id));
      }
    });
    
    return groups;
  }
  
  private mergeNodeGroup(nodes: GraphNode[]): GraphNode {
    // Merge multiple nodes into one
    const avgConfidence = nodes[0].confidence.map((_, index) =>
      nodes.reduce((sum, node) => sum + node.confidence[index], 0) / nodes.length
    );
    
    return {
      id: `merged_${nodes.map(n => n.id).join('_')}`,
      label: `Merged: ${nodes.map(n => n.label).join(' + ')}`,
      type: nodes[0].type,
      confidence: avgConfidence,
      metadata: {
        ...nodes[0].metadata,
        type: 'merged_node',
        source_description: `Merged from nodes: ${nodes.map(n => n.id).join(', ')}`,
        timestamp: new Date().toISOString(),
        merged_node_ids: nodes.map(n => n.id)
      }
    };
  }
  
  private updateEdgesAfterMerge(edges: GraphEdge[], originalNodes: GraphNode[], mergedNode: GraphNode): GraphEdge[] {
    const originalIds = new Set(originalNodes.map(n => n.id));
    
    return edges
      .filter(edge => !originalIds.has(edge.source) || !originalIds.has(edge.target))
      .map(edge => {
        const newEdge = { ...edge };
        if (originalIds.has(edge.source)) {
          newEdge.source = mergedNode.id;
        }
        if (originalIds.has(edge.target)) {
          newEdge.target = mergedNode.id;
        }
        return newEdge;
      });
  }
  
  private calculateConnectivity(graph: GraphData): number {
    // Calculate graph connectivity (simplified)
    return graph.edges.length / Math.max(1, graph.nodes.length * (graph.nodes.length - 1) / 2);
  }
  
  private calculateModularityGain(adjacencyMatrix: number[][], communities: number[], node: number, newCommunity: number): number {
    // Simplified modularity gain calculation
    return Math.random() * 0.1; // Placeholder for complex calculation
  }
  
  private getNeighbors(adjacencyMatrix: number[][], node: number): number[] {
    const neighbors: number[] = [];
    for (let i = 0; i < adjacencyMatrix[node].length; i++) {
      if (adjacencyMatrix[node][i] > 0) {
        neighbors.push(i);
      }
    }
    return neighbors;
  }
  
  private calculateCommunityModularity(adjacencyMatrix: number[][], communityNodes: string[], allNodeIds: string[]): number {
    // Simplified modularity calculation
    return Math.random() * 0.5 + 0.3; // Placeholder
  }
  
  private calculateInternalDensity(graph: GraphData, nodes: string[]): number {
    const nodeSet = new Set(nodes);
    const internalEdges = graph.edges.filter(edge => 
      nodeSet.has(edge.source) && nodeSet.has(edge.target)
    );
    
    const maxPossibleEdges = nodes.length * (nodes.length - 1) / 2;
    return maxPossibleEdges > 0 ? internalEdges.length / maxPossibleEdges : 0;
  }
  
  private calculateExternalConnectivity(graph: GraphData, nodes: string[]): number {
    const nodeSet = new Set(nodes);
    const externalEdges = graph.edges.filter(edge => 
      nodeSet.has(edge.source) !== nodeSet.has(edge.target)
    );
    
    return externalEdges.length / Math.max(1, nodes.length);
  }
  
  private setIntersectionSize(set1: Set<any>, set2: Set<any>): number {
    let intersection = 0;
    for (const item of set1) {
      if (set2.has(item)) {
        intersection++;
      }
    }
    return intersection;
  }
}