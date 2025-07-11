// Core Task Queue Management with Single-Tool Rule Enforcement
import { BackgroundTask, TaskQueueStats } from './types';
import { APICredentials } from '@/types/asrGotTypes';

// Single-tool rule enforcement types
type GeminiTool = 'THINKING' | 'STRUCTURED_OUTPUTS' | 'SEARCH_GROUNDING' | 'FUNCTION_CALLING' | 'CODE_EXECUTION' | 'CACHING';

interface SingleToolRequest {
  tools: GeminiTool[];
  cacheKey?: string;
  structuredOutput?: boolean;
  searchGrounding?: boolean;
  functionCalling?: boolean;
  codeExecution?: boolean;
  thinkingOnly?: boolean;
  availableFunctions?: string[];
}

// Enhanced task interface with single-tool enforcement
interface EnhancedBackgroundTask extends BackgroundTask {
  toolConfig?: SingleToolRequest;
  promptTokens?: number;
  cacheHit?: boolean;
}

export class TaskQueue {
  private taskQueue: BackgroundTask[] = [];
  private processingTasks: Map<string, BackgroundTask> = new Map();
  private maxConcurrent = 3;
  private currentlyProcessing = 0;

  constructor() {
    this.processQueue();
  }

  // Add a task to the queue with single-tool rule validation
  addTask(task: Omit<BackgroundTask, 'id' | 'created_at' | 'status'>, toolConfig?: SingleToolRequest): string {
    // Validate single-tool rule
    if (toolConfig?.tools) {
      this.validateSingleToolRule(toolConfig.tools);
    }
    
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullTask: EnhancedBackgroundTask = {
      ...task,
      id,
      created_at: new Date().toISOString(),
      status: 'queued',
      toolConfig,
      promptTokens: task.data?.prompt ? this.estimateTokens(task.data.prompt) : 0
    };
    
    this.taskQueue.push(fullTask);
    this.taskQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    console.log(`📋 Queued task ${id} with tools: ${toolConfig?.tools?.join(', ') || 'default'}`);
    return id;
  }

  // Validate single-tool rule: THINKING + exactly one other capability
  private validateSingleToolRule(tools: GeminiTool[]): void {
    if (!tools.includes('THINKING')) {
      throw new Error('Single-tool rule violation: THINKING must always be included');
    }
    
    const nonThinkingTools = tools.filter(tool => tool !== 'THINKING');
    if (nonThinkingTools.length > 1) {
      throw new Error(`Single-tool rule violation: Found ${nonThinkingTools.length} non-THINKING tools, maximum is 1. Tools: ${nonThinkingTools.join(', ')}`);
    }
    
    console.log(`✅ Single-tool rule validated: THINKING + ${nonThinkingTools[0] || 'NONE'}`);
  }

  // Estimate token count for caching decisions
  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  // Get task status with enhanced information
  getTaskStatus(id: string): EnhancedBackgroundTask | null {
    return this.processingTasks.get(id) as EnhancedBackgroundTask || 
           this.taskQueue.find(task => task.id === id) as EnhancedBackgroundTask || 
           null;
  }

  // Get task with tool configuration
  getTaskWithTools(id: string): { task: EnhancedBackgroundTask | null; toolConfig: SingleToolRequest | null } {
    const task = this.getTaskStatus(id);
    return {
      task,
      toolConfig: task?.toolConfig || null
    };
  }

  // Get queue statistics
  getStats(): TaskQueueStats {
    return {
      queuedTasks: this.taskQueue.length,
      processingTasks: this.currentlyProcessing,
      completedTasks: this.processingTasks.size,
      maxConcurrent: this.maxConcurrent
    };
  }

  // Process the task queue
  private async processQueue() {
    while (true) {
      if (this.currentlyProcessing < this.maxConcurrent && this.taskQueue.length > 0) {
        const task = this.taskQueue.shift()!;
        this.processTask(task);
      }
      
      // Wait 100ms before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Process individual task - to be implemented by subclasses
  protected async processTask(task: BackgroundTask) {
    this.currentlyProcessing++;
    task.status = 'processing';
    this.processingTasks.set(task.id, task);

    try {
      const result = await this.executeTask(task);
      
      task.status = 'completed';
      task.result = result;
      task.completed_at = new Date().toISOString();

    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.completed_at = new Date().toISOString();
    } finally {
      this.currentlyProcessing--;
      
      // Keep completed tasks for 30 seconds for result retrieval
      setTimeout(() => {
        this.processingTasks.delete(task.id);
      }, 30000);
    }
  }

  // To be implemented by concrete processors
  protected async executeTask(task: BackgroundTask): Promise<any> {
    throw new Error('executeTask must be implemented by subclass');
  }
}
