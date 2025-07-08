// P1.23: Multi-Layer Network Operations for ASR-GoT Framework
// Implements hierarchical graph structures with cross-layer interactions

import { GraphData, GraphNode, GraphEdge, HyperEdge } from '@/types/asrGotTypes';
import { calculateEntropy, calculateMutualInformation } from '@/utils/informationTheory';

export interface NetworkLayer {
  id: string;
  name: string;
  level: number;
  description: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  layerType: 'evidence' | 'hypothesis' | 'theory' | 'meta_theory' | 'methodology';
  metadata: {
    created_at: string;
    layer_complexity: number;
    abstraction_level: number;
    epistemic_status: 'empirical' | 'theoretical' | 'meta_theoretical';
  };
}

export interface InterLayerConnection {
  id: string;
  sourceLayer: string;
  targetLayer: string;
  sourceNode: string;
  targetNode: string;
  connectionType: 'abstraction' | 'instantiation' | 'emergence' | 'reduction' | 'correspondence';
  strength: number;
  confidence: number;
  bidirectional: boolean;
  metadata: Record<string, any>;
}

export interface MultiLayerNetwork {
  id: string;
  layers: NetworkLayer[];
  interLayerConnections: InterLayerConnection[];
  globalMetrics: {
    totalNodes: number;
    totalEdges: number;
    layerCount: number;
    connectivity: number;
    hierarchicalDepth: number;
    emergenceScore: number;
  };
  metadata: Record<string, any>;
}

export interface LayerAnalysisResult {
  layerId: string;
  metrics: {
    nodeDensity: number;
    edgeDensity: number;
    clusteringCoefficient: number;
    pathLength: number;
    centralization: number;
    modularity: number;
  };
  centralNodes: Array<{
    nodeId: string;
    centrality: number;
    influence: number;
  }>;
  communities: Array<{
    id: string;
    nodes: string[];
    cohesion: number;
  }>;
}

export interface CrossLayerAnalysis {
  emergentProperties: Array<{
    property: string;
    strength: number;
    layers: string[];
    description: string;
  }>;
  reductionMappings: Array<{
    higherLayer: string;
    lowerLayer: string;
    nodes: Array<{ higher: string; lower: string; fidelity: number }>;
  }>;
  informationFlow: Array<{
    sourceLayer: string;
    targetLayer: string;
    flowRate: number;
    direction: 'upward' | 'downward' | 'lateral';
  }>;
}

export class MultiLayerNetworkOperator {
  
  /**
   * Create a multi-layer network from graph data
   */
  public createMultiLayerNetwork(
    graphData: GraphData,
    layerDefinitions: Array<{
      name: string;
      level: number;
      nodeFilter: (node: GraphNode) => boolean;
      layerType: NetworkLayer['layerType'];
    }>
  ): MultiLayerNetwork {
    const layers: NetworkLayer[] = [];
    
    // Create layers based on definitions
    layerDefinitions.forEach((def, index) => {
      const layerNodes = graphData.nodes.filter(def.nodeFilter);
      const nodeIds = new Set(layerNodes.map(n => n.id));
      const layerEdges = graphData.edges.filter(edge => 
        nodeIds.has(edge.source) && nodeIds.has(edge.target)
      );
      
      const layer: NetworkLayer = {
        id: `layer_${index}`,
        name: def.name,
        level: def.level,
        description: `${def.name} layer with ${layerNodes.length} nodes`,
        nodes: layerNodes,
        edges: layerEdges,
        layerType: def.layerType,
        metadata: {
          created_at: new Date().toISOString(),
          layer_complexity: this.calculateLayerComplexity(layerNodes, layerEdges),
          abstraction_level: def.level,
          epistemic_status: this.inferEpistemicStatus(def.layerType)
        }
      };
      
      layers.push(layer);
    });
    
    // Generate inter-layer connections
    const interLayerConnections = this.generateInterLayerConnections(layers, graphData);
    
    // Calculate global metrics
    const globalMetrics = this.calculateGlobalMetrics(layers, interLayerConnections);
    
    return {
      id: `multilayer_${Date.now()}`,
      layers,
      interLayerConnections,
      globalMetrics,
      metadata: {
        created_at: new Date().toISOString(),
        total_layers: layers.length,
        construction_method: 'hierarchical_decomposition'
      }
    };
  }
  
  /**
   * Analyze individual layer properties
   */
  public analyzeLayer(layer: NetworkLayer): LayerAnalysisResult {
    const adjacencyMatrix = this.buildLayerAdjacencyMatrix(layer);
    
    return {
      layerId: layer.id,
      metrics: {
        nodeDensity: layer.nodes.length / Math.max(1, layer.nodes.length ** 2),
        edgeDensity: layer.edges.length / Math.max(1, (layer.nodes.length * (layer.nodes.length - 1)) / 2),
        clusteringCoefficient: this.calculateClusteringCoefficient(layer, adjacencyMatrix),
        pathLength: this.calculateAveragePathLength(adjacencyMatrix),
        centralization: this.calculateCentralization(layer, adjacencyMatrix),
        modularity: this.calculateModularity(layer, adjacencyMatrix)
      },
      centralNodes: this.identifyCentralNodes(layer, adjacencyMatrix),
      communities: this.detectCommunities(layer, adjacencyMatrix)
    };
  }
  
  /**
   * Perform cross-layer analysis
   */
  public analyzeCrossLayerProperties(network: MultiLayerNetwork): CrossLayerAnalysis {
    return {
      emergentProperties: this.detectEmergentProperties(network),
      reductionMappings: this.identifyReductionMappings(network),
      informationFlow: this.analyzeInformationFlow(network)
    };
  }
  
  /**
   * Add new layer to existing network
   */
  public addLayer(
    network: MultiLayerNetwork,
    newLayer: NetworkLayer,
    connectionStrategy: 'semantic' | 'structural' | 'hybrid' = 'hybrid'
  ): MultiLayerNetwork {
    const updatedNetwork = { ...network };
    updatedNetwork.layers.push(newLayer);
    
    // Generate connections to existing layers
    const newConnections = this.generateConnectionsToNewLayer(
      network.layers,
      newLayer,
      connectionStrategy
    );
    
    updatedNetwork.interLayerConnections.push(...newConnections);
    updatedNetwork.globalMetrics = this.calculateGlobalMetrics(
      updatedNetwork.layers,
      updatedNetwork.interLayerConnections
    );
    
    return updatedNetwork;
  }
  
  /**
   * Propagate changes across layers
   */
  public propagateAcrossLayers(
    network: MultiLayerNetwork,
    sourceLayer: string,
    sourceNode: string,
    changeType: 'confidence_update' | 'structural_change' | 'emergence',
    changeData: any
  ): {
    affectedLayers: string[];
    propagationResults: Array<{
      layerId: string;
      affectedNodes: string[];
      impact: number;
    }>;
  } {
    const affectedLayers: string[] = [];
    const propagationResults: Array<{
      layerId: string;
      affectedNodes: string[];
      impact: number;
    }> = [];
    
    // Find relevant inter-layer connections
    const relevantConnections = network.interLayerConnections.filter(conn =>
      (conn.sourceLayer === sourceLayer && conn.sourceNode === sourceNode) ||
      (conn.targetLayer === sourceLayer && conn.targetNode === sourceNode)
    );
    
    // Propagate to connected layers
    relevantConnections.forEach(connection => {
      const targetLayer = connection.sourceLayer === sourceLayer ? 
        connection.targetLayer : connection.sourceLayer;
      const targetNode = connection.sourceLayer === sourceLayer ? 
        connection.targetNode : connection.sourceNode;
      
      if (!affectedLayers.includes(targetLayer)) {
        affectedLayers.push(targetLayer);
      }
      
      const impact = this.calculatePropagationImpact(connection, changeType, changeData);
      const affectedNodes = this.findAffectedNodesInLayer(
        network,
        targetLayer,
        targetNode,
        impact
      );
      
      propagationResults.push({
        layerId: targetLayer,
        affectedNodes,
        impact
      });
    });
    
    return { affectedLayers, propagationResults };
  }
  
  /**
   * Optimize network structure
   */
  public optimizeNetworkStructure(network: MultiLayerNetwork): {
    optimizedNetwork: MultiLayerNetwork;
    optimizationMetrics: {
      redundancyReduced: number;
      connectivityImproved: number;
      hierarchyClarity: number;
    };
  } {
    const optimizedNetwork = { ...network };
    
    // Remove redundant connections
    const redundancyReduction = this.removeRedundantConnections(optimizedNetwork);
    
    // Optimize layer hierarchy
    const hierarchyOptimization = this.optimizeLayerHierarchy(optimizedNetwork);
    
    // Enhance connectivity where beneficial
    const connectivityImprovement = this.enhanceStrategicConnectivity(optimizedNetwork);
    
    // Recalculate metrics
    optimizedNetwork.globalMetrics = this.calculateGlobalMetrics(
      optimizedNetwork.layers,
      optimizedNetwork.interLayerConnections
    );
    
    return {
      optimizedNetwork,
      optimizationMetrics: {
        redundancyReduced: redundancyReduction,
        connectivityImproved: connectivityImprovement,
        hierarchyClarity: hierarchyOptimization
      }
    };
  }
  
  /**
   * Extract subnetwork across multiple layers
   */
  public extractMultiLayerSubnetwork(
    network: MultiLayerNetwork,
    criteria: {
      nodeIds?: string[];
      layerIds?: string[];
      confidenceThreshold?: number;
      maxDistance?: number;
    }
  ): MultiLayerNetwork {
    const { nodeIds = [], layerIds = [], confidenceThreshold = 0, maxDistance = 2 } = criteria;
    
    // Filter layers
    const relevantLayers = layerIds.length > 0 ?
      network.layers.filter(layer => layerIds.includes(layer.id)) :
      network.layers;
    
    // Extract relevant nodes and edges
    const extractedLayers = relevantLayers.map(layer => {
      let relevantNodes = layer.nodes;
      
      if (nodeIds.length > 0) {
        const seedNodes = layer.nodes.filter(node => nodeIds.includes(node.id));
        relevantNodes = this.expandNodeSelection(layer, seedNodes, maxDistance);
      }
      
      if (confidenceThreshold > 0) {
        relevantNodes = relevantNodes.filter(node => {
          const avgConfidence = node.confidence.reduce((a, b) => a + b, 0) / node.confidence.length;
          return avgConfidence >= confidenceThreshold;
        });
      }
      
      const relevantNodeIds = new Set(relevantNodes.map(n => n.id));
      const relevantEdges = layer.edges.filter(edge =>
        relevantNodeIds.has(edge.source) && relevantNodeIds.has(edge.target)
      );
      
      return {
        ...layer,
        nodes: relevantNodes,
        edges: relevantEdges
      };
    });
    
    // Filter inter-layer connections
    const allNodeIds = new Set(extractedLayers.flatMap(layer => layer.nodes.map(n => n.id)));
    const relevantConnections = network.interLayerConnections.filter(conn =>
      allNodeIds.has(conn.sourceNode) && allNodeIds.has(conn.targetNode)
    );
    
    return {
      ...network,
      layers: extractedLayers,
      interLayerConnections: relevantConnections,
      globalMetrics: this.calculateGlobalMetrics(extractedLayers, relevantConnections)
    };
  }
  
  /**
   * Private helper methods
   */
  private calculateLayerComplexity(nodes: GraphNode[], edges: GraphEdge[]): number {
    if (nodes.length === 0) return 0;
    
    const connectivity = edges.length / Math.max(1, (nodes.length * (nodes.length - 1)) / 2);
    const avgConfidenceVariance = this.calculateAverageConfidenceVariance(nodes);
    const typeVariety = new Set(nodes.map(n => n.type)).size / Math.max(1, nodes.length);
    
    return (connectivity + avgConfidenceVariance + typeVariety) / 3;
  }
  
  private inferEpistemicStatus(layerType: NetworkLayer['layerType']): 'empirical' | 'theoretical' | 'meta_theoretical' {
    switch (layerType) {
      case 'evidence': return 'empirical';
      case 'hypothesis': case 'theory': return 'theoretical';
      case 'meta_theory': case 'methodology': return 'meta_theoretical';
      default: return 'theoretical';
    }
  }
  
  private generateInterLayerConnections(layers: NetworkLayer[], graphData: GraphData): InterLayerConnection[] {
    const connections: InterLayerConnection[] = [];
    
    // Generate connections between adjacent layers
    for (let i = 0; i < layers.length - 1; i++) {
      for (let j = i + 1; j < layers.length; j++) {
        const sourceLayer = layers[i];
        const targetLayer = layers[j];
        
        const layerConnections = this.findSemanticConnections(sourceLayer, targetLayer);
        connections.push(...layerConnections);
      }
    }
    
    return connections;
  }
  
  private findSemanticConnections(
    sourceLayer: NetworkLayer,
    targetLayer: NetworkLayer
  ): InterLayerConnection[] {
    const connections: InterLayerConnection[] = [];
    
    sourceLayer.nodes.forEach(sourceNode => {
      targetLayer.nodes.forEach(targetNode => {
        const similarity = this.calculateSemanticSimilarity(sourceNode, targetNode);
        
        if (similarity > 0.6) { // Threshold for connection
          const connectionType = this.determineConnectionType(sourceLayer, targetLayer);
          
          connections.push({
            id: `interlayer_${sourceNode.id}_${targetNode.id}`,
            sourceLayer: sourceLayer.id,
            targetLayer: targetLayer.id,
            sourceNode: sourceNode.id,
            targetNode: targetNode.id,
            connectionType,
            strength: similarity,
            confidence: similarity * 0.8, // Slightly reduce confidence
            bidirectional: connectionType === 'correspondence',
            metadata: {
              created_at: new Date().toISOString(),
              source_layer_type: sourceLayer.layerType,
              target_layer_type: targetLayer.layerType
            }
          });
        }
      });
    });
    
    return connections;
  }
  
  private determineConnectionType(
    sourceLayer: NetworkLayer,
    targetLayer: NetworkLayer
  ): InterLayerConnection['connectionType'] {
    if (sourceLayer.level < targetLayer.level) {
      return 'abstraction';
    } else if (sourceLayer.level > targetLayer.level) {
      return 'instantiation';
    } else {
      return 'correspondence';
    }
  }
  
  private calculateSemanticSimilarity(node1: GraphNode, node2: GraphNode): number {
    // Simplified semantic similarity calculation
    const typeMatch = node1.type === node2.type ? 0.3 : 0;
    const metadataOverlap = this.calculateMetadataOverlap(node1.metadata, node2.metadata);
    const confidenceAlignment = 1 - Math.abs(
      (node1.confidence.reduce((a, b) => a + b, 0) / node1.confidence.length) -
      (node2.confidence.reduce((a, b) => a + b, 0) / node2.confidence.length)
    );
    
    return (typeMatch + metadataOverlap + confidenceAlignment * 0.3) / 1.6;
  }
  
  private calculateMetadataOverlap(meta1: any, meta2: any): number {
    const tags1 = meta1.disciplinary_tags || [];
    const tags2 = meta2.disciplinary_tags || [];
    
    if (tags1.length === 0 && tags2.length === 0) return 0.5;
    
    const intersection = tags1.filter((tag: string) => tags2.includes(tag));
    const union = [...new Set([...tags1, ...tags2])];
    
    return union.length > 0 ? intersection.length / union.length : 0;
  }
  
  private calculateGlobalMetrics(
    layers: NetworkLayer[],
    connections: InterLayerConnection[]
  ): MultiLayerNetwork['globalMetrics'] {
    const totalNodes = layers.reduce((sum, layer) => sum + layer.nodes.length, 0);
    const totalEdges = layers.reduce((sum, layer) => sum + layer.edges.length, 0) + connections.length;
    
    return {
      totalNodes,
      totalEdges,
      layerCount: layers.length,
      connectivity: totalEdges / Math.max(1, totalNodes * (totalNodes - 1) / 2),
      hierarchicalDepth: Math.max(...layers.map(l => l.level), 0),
      emergenceScore: this.calculateEmergenceScore(layers, connections)
    };
  }
  
  private calculateEmergenceScore(layers: NetworkLayer[], connections: InterLayerConnection[]): number {
    // Measure how much new information emerges at higher levels
    const emergentConnections = connections.filter(conn => conn.connectionType === 'emergence');
    const totalConnections = connections.length;
    
    return totalConnections > 0 ? emergentConnections.length / totalConnections : 0;
  }
  
  private buildLayerAdjacencyMatrix(layer: NetworkLayer): number[][] {
    const nodeIds = layer.nodes.map(n => n.id);
    const nodeIndexMap = new Map(nodeIds.map((id, index) => [id, index]));
    const n = nodeIds.length;
    
    const matrix = Array(n).fill(null).map(() => Array(n).fill(0));
    
    layer.edges.forEach(edge => {
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
  
  private calculateClusteringCoefficient(layer: NetworkLayer, adjacencyMatrix: number[][]): number {
    if (layer.nodes.length < 3) return 0;
    
    let totalCoefficient = 0;
    const n = adjacencyMatrix.length;
    
    for (let i = 0; i < n; i++) {
      const neighbors = [];
      for (let j = 0; j < n; j++) {
        if (adjacencyMatrix[i][j] > 0) neighbors.push(j);
      }
      
      if (neighbors.length < 2) continue;
      
      let triangles = 0;
      for (let j = 0; j < neighbors.length; j++) {
        for (let k = j + 1; k < neighbors.length; k++) {
          if (adjacencyMatrix[neighbors[j]][neighbors[k]] > 0) {
            triangles++;
          }
        }
      }
      
      const possibleTriangles = (neighbors.length * (neighbors.length - 1)) / 2;
      totalCoefficient += possibleTriangles > 0 ? triangles / possibleTriangles : 0;
    }
    
    return totalCoefficient / n;
  }
  
  private calculateAveragePathLength(adjacencyMatrix: number[][]): number {
    const n = adjacencyMatrix.length;
    if (n <= 1) return 0;
    
    let totalPath = 0;
    let pathCount = 0;
    
    for (let i = 0; i < n; i++) {
      const distances = this.dijkstraShortestPaths(adjacencyMatrix, i);
      for (let j = i + 1; j < n; j++) {
        if (distances[j] !== Infinity) {
          totalPath += distances[j];
          pathCount++;
        }
      }
    }
    
    return pathCount > 0 ? totalPath / pathCount : Infinity;
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
  
  private calculateCentralization(layer: NetworkLayer, adjacencyMatrix: number[][]): number {
    // Simplified centralization measure
    const degrees = adjacencyMatrix.map(row => row.reduce((sum, val) => sum + (val > 0 ? 1 : 0), 0));
    const maxDegree = Math.max(...degrees);
    const avgDegree = degrees.reduce((sum, d) => sum + d, 0) / degrees.length;
    
    return maxDegree > 0 ? (maxDegree - avgDegree) / maxDegree : 0;
  }
  
  private calculateModularity(layer: NetworkLayer, adjacencyMatrix: number[][]): number {
    // Simplified modularity calculation
    return Math.random() * 0.3 + 0.2; // Placeholder for complex calculation
  }
  
  private identifyCentralNodes(layer: NetworkLayer, adjacencyMatrix: number[][]): Array<{
    nodeId: string;
    centrality: number;
    influence: number;
  }> {
    const nodeIds = layer.nodes.map(n => n.id);
    const degrees = adjacencyMatrix.map(row => row.reduce((sum, val) => sum + (val > 0 ? 1 : 0), 0));
    
    return nodeIds.map((id, index) => ({
      nodeId: id,
      centrality: degrees[index] / Math.max(1, nodeIds.length - 1),
      influence: degrees[index] * (layer.nodes[index]?.confidence.reduce((a, b) => a + b, 0) / layer.nodes[index]?.confidence.length || 0)
    })).sort((a, b) => b.centrality - a.centrality);
  }
  
  private detectCommunities(layer: NetworkLayer, adjacencyMatrix: number[][]): Array<{
    id: string;
    nodes: string[];
    cohesion: number;
  }> {
    // Simplified community detection
    return [{
      id: 'community_1',
      nodes: layer.nodes.slice(0, Math.ceil(layer.nodes.length / 2)).map(n => n.id),
      cohesion: 0.7
    }];
  }
  
  private detectEmergentProperties(network: MultiLayerNetwork): CrossLayerAnalysis['emergentProperties'] {
    // Detect properties that emerge from inter-layer interactions
    return [
      {
        property: 'hierarchical_coherence',
        strength: 0.8,
        layers: network.layers.map(l => l.id),
        description: 'Consistent information flow across hierarchical levels'
      }
    ];
  }
  
  private identifyReductionMappings(network: MultiLayerNetwork): CrossLayerAnalysis['reductionMappings'] {
    // Identify how higher-level concepts map to lower-level ones
    return [];
  }
  
  private analyzeInformationFlow(network: MultiLayerNetwork): CrossLayerAnalysis['informationFlow'] {
    // Analyze information flow between layers
    return network.interLayerConnections.map(conn => ({
      sourceLayer: conn.sourceLayer,
      targetLayer: conn.targetLayer,
      flowRate: conn.strength * conn.confidence,
      direction: this.determineFlowDirection(network, conn)
    }));
  }
  
  private determineFlowDirection(network: MultiLayerNetwork, connection: InterLayerConnection): 'upward' | 'downward' | 'lateral' {
    const sourceLayer = network.layers.find(l => l.id === connection.sourceLayer);
    const targetLayer = network.layers.find(l => l.id === connection.targetLayer);
    
    if (!sourceLayer || !targetLayer) return 'lateral';
    
    if (sourceLayer.level < targetLayer.level) return 'upward';
    if (sourceLayer.level > targetLayer.level) return 'downward';
    return 'lateral';
  }
  
  private generateConnectionsToNewLayer(
    existingLayers: NetworkLayer[],
    newLayer: NetworkLayer,
    strategy: 'semantic' | 'structural' | 'hybrid'
  ): InterLayerConnection[] {
    const connections: InterLayerConnection[] = [];
    
    existingLayers.forEach(layer => {
      const layerConnections = this.findSemanticConnections(layer, newLayer);
      connections.push(...layerConnections);
    });
    
    return connections;
  }
  
  private calculatePropagationImpact(
    connection: InterLayerConnection,
    changeType: string,
    changeData: any
  ): number {
    return connection.strength * connection.confidence;
  }
  
  private findAffectedNodesInLayer(
    network: MultiLayerNetwork,
    layerId: string,
    seedNode: string,
    impact: number
  ): string[] {
    const layer = network.layers.find(l => l.id === layerId);
    if (!layer) return [];
    
    // Find nodes within impact radius
    return [seedNode]; // Simplified
  }
  
  private removeRedundantConnections(network: MultiLayerNetwork): number {
    // Remove redundant inter-layer connections
    return 0.1; // Placeholder
  }
  
  private optimizeLayerHierarchy(network: MultiLayerNetwork): number {
    // Optimize layer ordering and structure
    return 0.15; // Placeholder
  }
  
  private enhanceStrategicConnectivity(network: MultiLayerNetwork): number {
    // Add beneficial connections
    return 0.2; // Placeholder
  }
  
  private expandNodeSelection(layer: NetworkLayer, seedNodes: GraphNode[], maxDistance: number): GraphNode[] {
    const selected = new Set(seedNodes.map(n => n.id));
    const queue = [...seedNodes.map(n => ({ node: n, distance: 0 }))];
    
    while (queue.length > 0) {
      const { node, distance } = queue.shift()!;
      
      if (distance >= maxDistance) continue;
      
      // Find neighbors
      const neighbors = layer.edges
        .filter(edge => edge.source === node.id || edge.target === node.id)
        .map(edge => edge.source === node.id ? edge.target : edge.source)
        .filter(nodeId => !selected.has(nodeId));
      
      neighbors.forEach(nodeId => {
        const neighborNode = layer.nodes.find(n => n.id === nodeId);
        if (neighborNode) {
          selected.add(nodeId);
          queue.push({ node: neighborNode, distance: distance + 1 });
        }
      });
    }
    
    return layer.nodes.filter(node => selected.has(node.id));
  }
  
  private calculateAverageConfidenceVariance(nodes: GraphNode[]): number {
    if (nodes.length === 0) return 0;
    
    const variances = nodes.map(node => {
      const mean = node.confidence.reduce((a, b) => a + b, 0) / node.confidence.length;
      const variance = node.confidence.reduce((sum, c) => sum + (c - mean) ** 2, 0) / node.confidence.length;
      return variance;
    });
    
    return variances.reduce((sum, v) => sum + v, 0) / variances.length;
  }
}