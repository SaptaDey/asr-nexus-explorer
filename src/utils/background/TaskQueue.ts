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
  retryAttempts?: number;
}

interface TaskQueueOptions {
  maxConcurrent?: number;
  retryAttempts?: number;
}

export class TaskQueue {
  private taskQueue: BackgroundTask[] = [];
  private processingTasks: Map<string, BackgroundTask> = new Map();
  private maxConcurrent: number;
  private retryAttempts: number;
  private currentlyProcessing = 0;
  private isRunningQueue = false;
  private processInterval: NodeJS.Timeout | null = null;
  private executor?: (task: BackgroundTask) => Promise<any>;
  private maxCompletedTasks = 10; // Limit for completed tasks

  constructor(executor?: (task: BackgroundTask) => Promise<any>, options: TaskQueueOptions = {}) {
    this.executor = executor;
    this.maxConcurrent = options.maxConcurrent || 3;
    this.retryAttempts = options.retryAttempts || 3;
    // Don't auto-start - let tests control when to start
  }

  // Add a task to the queue with single-tool rule validation
  async addTask(task: Omit<BackgroundTask, 'id' | 'created_at' | 'status'>, toolConfig?: SingleToolRequest): Promise<string> {
    // Validate single-tool rule
    if (toolConfig?.tools) {
      this.validateSingleToolRule(toolConfig.tools);
    }
    
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullTask: EnhancedBackgroundTask = {
      ...task,
      id,
      created_at: new Date().toISOString(),
      status: 'pending',
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

  // Get queue statistics (alias for tests)
  getQueueStats(): any {
    const allTasks = Array.from(this.processingTasks.values());
    const completedTasks = allTasks.filter(task => task.status === 'completed').length;
    const runningTasks = allTasks.filter(task => task.status === 'processing').length;
    const failedTasks = allTasks.filter(task => task.status === 'failed').length;
    const cancelledTasks = allTasks.filter(task => task.status === 'cancelled').length;
    
    return {
      pending: this.taskQueue.length,
      running: runningTasks,
      completed: completedTasks,
      failed: failedTasks,
      cancelled: cancelledTasks,
      total: this.taskQueue.length + this.processingTasks.size
    };
  }

  // Start the task queue processing
  start(): void {
    if (this.isRunningQueue) return;
    
    this.isRunningQueue = true;
    this.processQueue();
    console.log('📋 TaskQueue started');
  }

  // Stop the task queue processing
  stop(): void {
    this.isRunningQueue = false;
    if (this.processInterval) {
      clearTimeout(this.processInterval);
      this.processInterval = null;
    }
    console.log('📋 TaskQueue stopped');
  }

  // Check if the queue is running
  isRunning(): boolean {
    return this.isRunningQueue;
  }

  // Pause task processing
  pause(): void {
    this.isRunningQueue = false;
    if (this.processInterval) {
      clearTimeout(this.processInterval);
      this.processInterval = null;
    }
    console.log('⏸️ TaskQueue paused');
  }

  // Resume task processing
  resume(): void {
    if (!this.isRunningQueue) {
      this.isRunningQueue = true;
      this.processQueue();
      console.log('▶️ TaskQueue resumed');
    }
  }

  // Get task result - enhanced version of getTaskStatus
  getTaskResult(id: string): any {
    const task = this.getTaskStatus(id);
    if (!task) {
      return null; // Tests expect null, not throwing error
    }
    
    if (task.status === 'completed') {
      return task.result;
    } else if (task.status === 'failed') {
      throw new Error(task.error || 'Task failed');
    } else {
      return undefined; // Task still processing
    }
  }

  // Clear all tasks from queue and processing
  clear(): void {
    this.taskQueue = [];
    this.processingTasks.clear();
    this.currentlyProcessing = 0;
    console.log('📋 TaskQueue cleared');
  }

  // Clear all tasks from queue and processing (alias for tests)
  clearQueue(): void {
    this.clear();
  }

  // Cancel a specific task
  cancelTask(id: string): boolean {
    // Check if task is in queue
    const queueIndex = this.taskQueue.findIndex(task => task.id === id);
    if (queueIndex !== -1) {
      const task = this.taskQueue[queueIndex];
      task.status = 'cancelled';
      // Move to processing tasks so it can still be found by getTaskStatus
      this.processingTasks.set(task.id, task);
      this.taskQueue.splice(queueIndex, 1);
      console.log(`❌ Cancelled queued task ${id}`);
      return true;
    }

    // Check if task is processing (can't cancel running tasks)
    const processingTask = this.processingTasks.get(id);
    if (processingTask && processingTask.status === 'processing') {
      console.log(`⚠️ Cannot cancel running task ${id}`);
      return false;
    }

    console.log(`❓ Task ${id} not found for cancellation`);
    return false;
  }

  // Process the task queue
  private async processQueue() {
    const processLoop = async () => {
      if (!this.isRunningQueue) return;
      
      if (this.currentlyProcessing < this.maxConcurrent && this.taskQueue.length > 0) {
        const task = this.taskQueue.shift()!;
        // Don't await processTask to allow concurrent execution
        this.processTask(task).catch(error => {
          console.error(`Error processing task ${task.id}: ${error}`);
        });
      }
      
      // Schedule next check (faster for tests)
      if (this.isRunningQueue) {
        this.processInterval = setTimeout(processLoop, 10);
      }
    };
    
    processLoop();
  }

  // Process individual task with retry logic
  protected async processTask(task: BackgroundTask) {
    this.currentlyProcessing++;
    task.status = 'processing';
    this.processingTasks.set(task.id, task);

    let attempt = 0;
    const maxAttempts = (task as EnhancedBackgroundTask).retryAttempts || this.retryAttempts;
    
    // Add attempts tracking for tests
    (task as any).attempts = 0;

    while (attempt < maxAttempts) {
      try {
        attempt++;
        (task as any).attempts = attempt;
        
        const result = await this.executeTask(task);
        
        task.status = 'completed';
        task.result = result;
        task.completed_at = new Date().toISOString();
        break; // Success, exit retry loop

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (attempt >= maxAttempts) {
          // Final failure after all retries
          task.status = 'failed';
          task.error = errorMessage;
          task.completed_at = new Date().toISOString();
          console.log(`❌ Task ${task.id} failed after ${attempt} attempts: ${errorMessage}`);
          break; // CRITICAL: Exit the retry loop on final failure
        } else {
          // Retry after delay (reduced for testing)
          console.log(`🔄 Retrying task ${task.id} (attempt ${attempt + 1}/${maxAttempts}): ${errorMessage}`);
          await new Promise(resolve => setTimeout(resolve, 10 * attempt)); // Much faster backoff for tests
        }
      }
    }

    this.currentlyProcessing--;
    
    // Immediate cleanup of old completed tasks to prevent memory leaks
    this.cleanupCompletedTasks();
    
    // Keep completed tasks for shorter time during tests
    const cleanupTime = process.env.NODE_ENV === 'test' ? 100 : 30000;
    setTimeout(() => {
      this.processingTasks.delete(task.id);
    }, cleanupTime);
  }

  // Clean up old completed tasks to prevent memory leaks
  private cleanupCompletedTasks(): void {
    const allFinishedTasks = Array.from(this.processingTasks.values())
      .filter(task => task.status === 'completed' || task.status === 'failed')
      .sort((a, b) => new Date(a.completed_at || '').getTime() - new Date(b.completed_at || '').getTime());
    
    // Only cleanup if we have significantly more than the limit to avoid race conditions
    if (allFinishedTasks.length > this.maxCompletedTasks * 2) {
      // Remove oldest finished tasks to get back to the limit
      while (allFinishedTasks.length > this.maxCompletedTasks) {
        const oldestTask = allFinishedTasks.shift()!;
        this.processingTasks.delete(oldestTask.id);
      }
    }
  }

  // Execute task using provided executor or default implementation
  protected async executeTask(task: BackgroundTask): Promise<any> {
    if (this.executor) {
      try {
        const result = await this.executor(task);
        return result;
      } catch (error) {
        // Re-throw to be handled by processTask retry logic
        throw error;
      }
    }
    
    // Default implementation for backward compatibility
    throw new Error('executeTask must be implemented by subclass or executor must be provided');
  }
}
