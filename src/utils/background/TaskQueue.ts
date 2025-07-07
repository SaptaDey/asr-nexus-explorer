// Core Task Queue Management
import { BackgroundTask, TaskQueueStats } from './types';

export class TaskQueue {
  private taskQueue: BackgroundTask[] = [];
  private processingTasks: Map<string, BackgroundTask> = new Map();
  private maxConcurrent = 3;
  private currentlyProcessing = 0;

  constructor() {
    this.processQueue();
  }

  // Add a task to the queue
  addTask(task: Omit<BackgroundTask, 'id' | 'created_at' | 'status'>): string {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullTask: BackgroundTask = {
      ...task,
      id,
      created_at: new Date().toISOString(),
      status: 'queued'
    };
    
    this.taskQueue.push(fullTask);
    this.taskQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    return id;
  }

  // Get task status
  getTaskStatus(id: string): BackgroundTask | null {
    return this.processingTasks.get(id) || 
           this.taskQueue.find(task => task.id === id) || 
           null;
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
