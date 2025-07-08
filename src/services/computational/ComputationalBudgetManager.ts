// P1.21: Computational Budget Management for ASR-GoT Framework
// Implements resource allocation and optimization for complex reasoning operations

import { GraphData, GraphNode, GraphEdge } from '@/types/asrGotTypes';

export interface ComputationalResource {
  id: string;
  type: 'cpu' | 'memory' | 'storage' | 'network' | 'api_calls' | 'time';
  total: number;
  used: number;
  available: number;
  unit: string;
  costPerUnit: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface ResourceAllocation {
  operationId: string;
  operationType: string;
  allocatedResources: Record<string, number>;
  estimatedCost: number;
  actualCost?: number;
  efficiency: number;
  timestamp: string;
  duration?: number;
}

export interface BudgetConstraints {
  maxTotalCost: number;
  maxOperationCost: number;
  timeLimit: number;
  memoryLimit: number;
  apiCallLimit: number;
  priorityWeights: Record<string, number>;
}

export interface OptimizationStrategy {
  name: string;
  description: string;
  costReduction: number;
  qualityImpact: number;
  applicableOperations: string[];
  implementationComplexity: 'low' | 'medium' | 'high';
}

export interface ResourceUsageMetrics {
  totalCost: number;
  averageEfficiency: number;
  resourceUtilization: Record<string, number>;
  bottlenecks: string[];
  recommendations: string[];
  costBreakdown: Record<string, number>;
}

export interface OperationProfile {
  operationType: string;
  averageDuration: number;
  averageCost: number;
  resourceRequirements: Record<string, number>;
  scalingFactor: number;
  complexityMetrics: {
    graphSize: number;
    nodeComplexity: number;
    edgeComplexity: number;
    algorithmicComplexity: string;
  };
}

export class ComputationalBudgetManager {
  private resources: Map<string, ComputationalResource> = new Map();
  private allocations: ResourceAllocation[] = [];
  private constraints: BudgetConstraints;
  private operationProfiles: Map<string, OperationProfile> = new Map();
  private optimizationStrategies: OptimizationStrategy[] = [];

  constructor(initialBudget: BudgetConstraints) {
    this.constraints = initialBudget;
    this.initializeDefaultResources();
    this.initializeOptimizationStrategies();
  }

  /**
   * Estimate computational cost for an operation
   */
  public estimateOperationCost(
    operationType: string,
    graphData?: GraphData,
    parameters?: Record<string, any>
  ): {
    estimatedCost: number;
    estimatedDuration: number;
    resourceBreakdown: Record<string, number>;
    feasible: boolean;
    recommendations: string[];
  } {
    const profile = this.operationProfiles.get(operationType);
    const recommendations: string[] = [];
    
    if (!profile) {
      // Create default profile for unknown operations
      return {
        estimatedCost: 100,
        estimatedDuration: 1000,
        resourceBreakdown: { 'cpu': 50, 'memory': 30, 'api_calls': 20 },
        feasible: true,
        recommendations: ['Consider profiling this operation type for better estimates']
      };
    }

    // Calculate complexity factors
    const complexityFactors = this.calculateComplexityFactors(graphData, parameters);
    
    // Estimate resource requirements
    const baseResourceRequirements = profile.resourceRequirements;
    const scaledRequirements: Record<string, number> = {};
    
    Object.entries(baseResourceRequirements).forEach(([resourceType, baseAmount]) => {
      scaledRequirements[resourceType] = baseAmount * complexityFactors.scalingFactor;
    });

    // Calculate costs
    const resourceBreakdown: Record<string, number> = {};
    let totalCost = 0;

    Object.entries(scaledRequirements).forEach(([resourceType, amount]) => {
      const resource = this.resources.get(resourceType);
      if (resource) {
        const cost = amount * resource.costPerUnit;
        resourceBreakdown[resourceType] = cost;
        totalCost += cost;
      }
    });

    // Check feasibility
    const feasible = this.checkOperationFeasibility(scaledRequirements, totalCost);
    
    // Generate recommendations
    if (!feasible) {
      recommendations.push('Operation exceeds budget constraints');
      recommendations.push(...this.generateCostReductionRecommendations(operationType, scaledRequirements));
    }

    if (totalCost > this.constraints.maxOperationCost * 0.8) {
      recommendations.push('Consider optimizing this operation to reduce costs');
    }

    return {
      estimatedCost: totalCost,
      estimatedDuration: profile.averageDuration * complexityFactors.scalingFactor,
      resourceBreakdown,
      feasible,
      recommendations
    };
  }

  /**
   * Allocate resources for an operation
   */
  public allocateResources(
    operationId: string,
    operationType: string,
    requiredResources: Record<string, number>
  ): {
    success: boolean;
    allocation?: ResourceAllocation;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check resource availability
    for (const [resourceType, amount] of Object.entries(requiredResources)) {
      const resource = this.resources.get(resourceType);
      if (!resource) {
        errors.push(`Unknown resource type: ${resourceType}`);
        continue;
      }

      if (resource.available < amount) {
        errors.push(`Insufficient ${resourceType}: requested ${amount}, available ${resource.available}`);
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Calculate cost
    let estimatedCost = 0;
    for (const [resourceType, amount] of Object.entries(requiredResources)) {
      const resource = this.resources.get(resourceType)!;
      estimatedCost += amount * resource.costPerUnit;
    }

    // Check budget constraints
    if (estimatedCost > this.constraints.maxOperationCost) {
      errors.push(`Operation cost ${estimatedCost} exceeds maximum allowed ${this.constraints.maxOperationCost}`);
      return { success: false, errors };
    }

    // Allocate resources
    for (const [resourceType, amount] of Object.entries(requiredResources)) {
      const resource = this.resources.get(resourceType)!;
      resource.used += amount;
      resource.available -= amount;
    }

    // Create allocation record
    const allocation: ResourceAllocation = {
      operationId,
      operationType,
      allocatedResources: { ...requiredResources },
      estimatedCost,
      efficiency: 1.0, // Will be updated when operation completes
      timestamp: new Date().toISOString()
    };

    this.allocations.push(allocation);

    return { success: true, allocation, errors: [] };
  }

  /**
   * Release resources after operation completion
   */
  public releaseResources(
    operationId: string,
    actualCost?: number,
    actualDuration?: number
  ): boolean {
    const allocation = this.allocations.find(a => a.operationId === operationId);
    if (!allocation) return false;

    // Release allocated resources
    for (const [resourceType, amount] of Object.entries(allocation.allocatedResources)) {
      const resource = this.resources.get(resourceType);
      if (resource) {
        resource.used -= amount;
        resource.available += amount;
      }
    }

    // Update allocation with actual metrics
    if (actualCost !== undefined) {
      allocation.actualCost = actualCost;
      allocation.efficiency = allocation.estimatedCost / actualCost;
    }

    if (actualDuration !== undefined) {
      allocation.duration = actualDuration;
    }

    // Update operation profile
    this.updateOperationProfile(allocation);

    return true;
  }

  /**
   * Optimize resource allocation across multiple operations
   */
  public optimizeResourceAllocation(
    pendingOperations: Array<{
      id: string;
      type: string;
      priority: number;
      requiredResources: Record<string, number>;
      deadline?: number;
    }>
  ): {
    optimizedSchedule: Array<{
      operationId: string;
      scheduledTime: number;
      expectedCompletion: number;
      resourceAllocation: Record<string, number>;
    }>;
    totalCost: number;
    efficiency: number;
    unscheduledOperations: string[];
  } {
    // Sort operations by priority and deadline
    const sortedOperations = [...pendingOperations].sort((a, b) => {
      if (a.deadline && b.deadline) {
        return a.deadline - b.deadline;
      }
      return b.priority - a.priority;
    });

    const schedule: Array<{
      operationId: string;
      scheduledTime: number;
      expectedCompletion: number;
      resourceAllocation: Record<string, number>;
    }> = [];

    const unscheduledOperations: string[] = [];
    let currentTime = Date.now();
    let totalCost = 0;

    // Create resource timeline
    const resourceTimeline = this.createResourceTimeline();

    for (const operation of sortedOperations) {
      const allocation = this.findOptimalTimeSlot(
        operation,
        resourceTimeline,
        currentTime
      );

      if (allocation) {
        schedule.push(allocation);
        totalCost += this.calculateOperationCost(operation.requiredResources);
        
        // Update resource timeline
        this.updateResourceTimeline(resourceTimeline, allocation);
      } else {
        unscheduledOperations.push(operation.id);
      }
    }

    const efficiency = this.calculateScheduleEfficiency(schedule);

    return {
      optimizedSchedule: schedule,
      totalCost,
      efficiency,
      unscheduledOperations
    };
  }

  /**
   * Apply optimization strategies
   */
  public applyOptimizations(
    operationType: string,
    graphData: GraphData
  ): {
    applicableStrategies: OptimizationStrategy[];
    potentialSavings: number;
    qualityImpact: number;
    recommendations: Array<{
      strategy: string;
      implementation: string;
      costReduction: number;
      effort: string;
    }>;
  } {
    const applicableStrategies = this.optimizationStrategies.filter(
      strategy => strategy.applicableOperations.includes(operationType)
    );

    let potentialSavings = 0;
    let qualityImpact = 0;
    const recommendations: Array<{
      strategy: string;
      implementation: string;
      costReduction: number;
      effort: string;
    }> = [];

    applicableStrategies.forEach(strategy => {
      const currentCost = this.estimateOperationCost(operationType, graphData).estimatedCost;
      const savings = currentCost * strategy.costReduction;
      
      potentialSavings += savings;
      qualityImpact = Math.max(qualityImpact, strategy.qualityImpact);

      recommendations.push({
        strategy: strategy.name,
        implementation: this.generateImplementationGuidance(strategy, graphData),
        costReduction: savings,
        effort: strategy.implementationComplexity
      });
    });

    return {
      applicableStrategies,
      potentialSavings,
      qualityImpact,
      recommendations
    };
  }

  /**
   * Get resource usage analytics
   */
  public getResourceUsageMetrics(timeWindow?: number): ResourceUsageMetrics {
    const relevantAllocations = timeWindow 
      ? this.allocations.filter(a => 
          Date.now() - new Date(a.timestamp).getTime() <= timeWindow
        )
      : this.allocations;

    const totalCost = relevantAllocations.reduce((sum, a) => sum + (a.actualCost || a.estimatedCost), 0);
    const averageEfficiency = relevantAllocations.reduce((sum, a) => sum + a.efficiency, 0) / Math.max(1, relevantAllocations.length);

    const resourceUtilization: Record<string, number> = {};
    this.resources.forEach((resource, type) => {
      resourceUtilization[type] = resource.used / resource.total;
    });

    const bottlenecks = this.identifyBottlenecks();
    const recommendations = this.generateResourceRecommendations();

    const costBreakdown: Record<string, number> = {};
    relevantAllocations.forEach(allocation => {
      Object.entries(allocation.allocatedResources).forEach(([resourceType, amount]) => {
        const resource = this.resources.get(resourceType);
        if (resource) {
          costBreakdown[resourceType] = (costBreakdown[resourceType] || 0) + (amount * resource.costPerUnit);
        }
      });
    });

    return {
      totalCost,
      averageEfficiency,
      resourceUtilization,
      bottlenecks,
      recommendations,
      costBreakdown
    };
  }

  /**
   * Private helper methods
   */
  private initializeDefaultResources(): void {
    const defaultResources: ComputationalResource[] = [
      {
        id: 'cpu',
        type: 'cpu',
        total: 100,
        used: 0,
        available: 100,
        unit: 'core-hours',
        costPerUnit: 0.1,
        priority: 'critical'
      },
      {
        id: 'memory',
        type: 'memory',
        total: 1000,
        used: 0,
        available: 1000,
        unit: 'GB-hours',
        costPerUnit: 0.05,
        priority: 'critical'
      },
      {
        id: 'api_calls',
        type: 'api_calls',
        total: 10000,
        used: 0,
        available: 10000,
        unit: 'calls',
        costPerUnit: 0.01,
        priority: 'high'
      },
      {
        id: 'storage',
        type: 'storage',
        total: 10000,
        used: 0,
        available: 10000,
        unit: 'GB',
        costPerUnit: 0.02,
        priority: 'medium'
      }
    ];

    defaultResources.forEach(resource => {
      this.resources.set(resource.id, resource);
    });
  }

  private initializeOptimizationStrategies(): void {
    this.optimizationStrategies = [
      {
        name: 'Graph Pruning',
        description: 'Remove low-confidence nodes and edges before processing',
        costReduction: 0.3,
        qualityImpact: 0.1,
        applicableOperations: ['centrality_calculation', 'community_detection', 'path_finding'],
        implementationComplexity: 'low'
      },
      {
        name: 'Hierarchical Processing',
        description: 'Process graph in hierarchical layers to reduce complexity',
        costReduction: 0.4,
        qualityImpact: 0.15,
        applicableOperations: ['large_graph_analysis', 'multi_layer_operations'],
        implementationComplexity: 'medium'
      },
      {
        name: 'Approximation Algorithms',
        description: 'Use approximation algorithms for near-optimal results',
        costReduction: 0.6,
        qualityImpact: 0.2,
        applicableOperations: ['centrality_calculation', 'shortest_paths', 'clustering'],
        implementationComplexity: 'medium'
      },
      {
        name: 'Caching Strategy',
        description: 'Cache intermediate results to avoid recomputation',
        costReduction: 0.5,
        qualityImpact: 0.0,
        applicableOperations: ['repeated_operations', 'similarity_calculations'],
        implementationComplexity: 'low'
      }
    ];
  }

  private calculateComplexityFactors(
    graphData?: GraphData,
    parameters?: Record<string, any>
  ): { scalingFactor: number; complexity: string } {
    if (!graphData) {
      return { scalingFactor: 1.0, complexity: 'unknown' };
    }

    const nodeCount = graphData.nodes.length;
    const edgeCount = graphData.edges.length;
    const density = edgeCount / Math.max(1, (nodeCount * (nodeCount - 1)) / 2);

    // Calculate scaling factor based on graph properties
    let scalingFactor = 1.0;
    
    // Node count scaling (typically O(n) to O(n²))
    if (nodeCount > 1000) scalingFactor *= Math.log(nodeCount / 1000) + 1;
    
    // Edge density scaling
    scalingFactor *= (1 + density);
    
    // Parameter complexity
    if (parameters) {
      const paramComplexity = Object.keys(parameters).length * 0.1;
      scalingFactor *= (1 + paramComplexity);
    }

    const complexity = nodeCount < 100 ? 'low' : 
                      nodeCount < 1000 ? 'medium' : 'high';

    return { scalingFactor, complexity };
  }

  private checkOperationFeasibility(
    requiredResources: Record<string, number>,
    totalCost: number
  ): boolean {
    // Check cost constraint
    if (totalCost > this.constraints.maxOperationCost) return false;

    // Check resource availability
    for (const [resourceType, amount] of Object.entries(requiredResources)) {
      const resource = this.resources.get(resourceType);
      if (!resource || resource.available < amount) return false;
    }

    return true;
  }

  private generateCostReductionRecommendations(
    operationType: string,
    requiredResources: Record<string, number>
  ): string[] {
    const recommendations: string[] = [];

    // Find applicable optimization strategies
    const applicableStrategies = this.optimizationStrategies.filter(
      strategy => strategy.applicableOperations.includes(operationType)
    );

    applicableStrategies.forEach(strategy => {
      recommendations.push(`Apply ${strategy.name}: ${strategy.description}`);
    });

    // Resource-specific recommendations
    Object.entries(requiredResources).forEach(([resourceType, amount]) => {
      const resource = this.resources.get(resourceType);
      if (resource && amount > resource.available * 0.8) {
        recommendations.push(`Consider reducing ${resourceType} usage through data preprocessing`);
      }
    });

    return recommendations;
  }

  private updateOperationProfile(allocation: ResourceAllocation): void {
    const existing = this.operationProfiles.get(allocation.operationType);
    
    if (existing && allocation.actualCost && allocation.duration) {
      // Update with exponential moving average
      const alpha = 0.3;
      existing.averageCost = alpha * allocation.actualCost + (1 - alpha) * existing.averageCost;
      existing.averageDuration = alpha * allocation.duration + (1 - alpha) * existing.averageDuration;
    }
  }

  private createResourceTimeline(): Map<string, Array<{ start: number; end: number; usage: number }>> {
    const timeline = new Map();
    this.resources.forEach((_, resourceType) => {
      timeline.set(resourceType, []);
    });
    return timeline;
  }

  private findOptimalTimeSlot(
    operation: any,
    resourceTimeline: Map<string, any[]>,
    currentTime: number
  ): any {
    // Simplified optimal time slot finding
    return {
      operationId: operation.id,
      scheduledTime: currentTime,
      expectedCompletion: currentTime + 60000, // 1 minute default
      resourceAllocation: operation.requiredResources
    };
  }

  private updateResourceTimeline(timeline: Map<string, any[]>, allocation: any): void {
    // Update timeline with new allocation
    Object.keys(allocation.resourceAllocation).forEach(resourceType => {
      const resourceTimeline = timeline.get(resourceType) || [];
      resourceTimeline.push({
        start: allocation.scheduledTime,
        end: allocation.expectedCompletion,
        usage: allocation.resourceAllocation[resourceType]
      });
    });
  }

  private calculateOperationCost(requiredResources: Record<string, number>): number {
    let cost = 0;
    Object.entries(requiredResources).forEach(([resourceType, amount]) => {
      const resource = this.resources.get(resourceType);
      if (resource) {
        cost += amount * resource.costPerUnit;
      }
    });
    return cost;
  }

  private calculateScheduleEfficiency(schedule: any[]): number {
    // Simplified efficiency calculation
    return schedule.length > 0 ? 0.85 : 0;
  }

  private identifyBottlenecks(): string[] {
    const bottlenecks: string[] = [];
    
    this.resources.forEach((resource, type) => {
      const utilization = resource.used / resource.total;
      if (utilization > 0.8) {
        bottlenecks.push(type);
      }
    });

    return bottlenecks;
  }

  private generateResourceRecommendations(): string[] {
    const recommendations: string[] = [];
    
    this.resources.forEach((resource, type) => {
      const utilization = resource.used / resource.total;
      
      if (utilization > 0.9) {
        recommendations.push(`Consider increasing ${type} capacity`);
      } else if (utilization < 0.2) {
        recommendations.push(`${type} is underutilized, consider reducing allocation`);
      }
    });

    return recommendations;
  }

  private generateImplementationGuidance(strategy: OptimizationStrategy, graphData: GraphData): string {
    switch (strategy.name) {
      case 'Graph Pruning':
        return `Remove nodes with confidence < 0.3 (affects ${graphData.nodes.filter(n => n.confidence.reduce((a,b) => a+b, 0)/n.confidence.length < 0.3).length} nodes)`;
      case 'Hierarchical Processing':
        return 'Implement layer-by-layer processing starting with highest-confidence nodes';
      case 'Approximation Algorithms':
        return 'Replace exact algorithms with approximation variants (e.g., approximate PageRank)';
      case 'Caching Strategy':
        return 'Implement LRU cache for frequently accessed graph computations';
      default:
        return 'Follow standard optimization practices';
    }
  }
}