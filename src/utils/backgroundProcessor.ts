// Background Processing System for ASR-GoT
// Handles async API calls, graph processing, and stage execution

import { BackgroundTask, APICredentials } from '@/types/asrGotTypes';

class BackgroundProcessor {
  private taskQueue: BackgroundTask[] = [];
  private processingTasks: Map<string, BackgroundTask> = new Map();
  private maxConcurrent = 3;
  private currentlyProcessing = 0;

  constructor() {
    // Start the processing loop
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

  // Process individual task
  private async processTask(task: BackgroundTask) {
    this.currentlyProcessing++;
    task.status = 'processing';
    this.processingTasks.set(task.id, task);

    try {
      let result: any;

      switch (task.type) {
        case 'api_call':
          result = await this.processApiCall(task.payload);
          break;
        case 'graph_processing':
          result = await this.processGraphOperation(task.payload);
          break;
        case 'stage_execution':
          result = await this.processStageExecution(task.payload);
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

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

  // Process API calls
  private async processApiCall(payload: {
    type: 'gemini';
    prompt: string;
    credentials: APICredentials;
    capability?: string;
    schema?: any;
    options?: any;
  }): Promise<any> {
    const { type, prompt, credentials, capability = 'thinking', schema, options = {} } = payload;

    if (type === 'gemini') {
      return await this.callGeminiAPI(prompt, credentials.gemini, capability as any, schema, options);
    } else {
      throw new Error(`Unsupported API type: ${type}`);
    }
  }

  // Gemini API call
  private async callGeminiAPI(prompt: string, apiKey: string, capability: string = 'thinking', schema?: any, options: any = {}): Promise<any> {
    const requestBody: any = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: options.temperature || 0.4,
        maxOutputTokens: options.maxTokens || 120000,
        topP: 0.8,
        topK: 40,
      },
      systemInstruction: {
        parts: [
          { text: "You are an expert AI research assistant. Always think step-by-step and provide detailed, accurate responses." }
        ]
      }
    };

    // Configure based on capability - only one at a time
    switch (capability) {
      case 'search':
        requestBody.tools = [
          {
            googleSearchRetrieval: {
              dynamicRetrievalConfig: {
                mode: "MODE_DYNAMIC",
                dynamicThreshold: 0.7
              }
            }
          }
        ];
        break;
      case 'structured':
        if (schema) {
          requestBody.generationConfig.responseSchema = schema;
          requestBody.generationConfig.responseMimeType = "application/json";
        }
        break;
      case 'code':
        requestBody.tools = [
          {
            codeExecution: {}
          }
        ];
        break;
      case 'function':
        // Function calling tools would be added here when needed
        break;
      case 'thinking':
        // Enable thinking mode
        requestBody.systemInstruction.parts[0].text += " Use <thinking> tags to show your reasoning process.";
        break;
      case 'cache':
        // Caching would be configured here when needed
        break;
    }

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent', {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || '';
  }

  // Process graph operations
  private async processGraphOperation(payload: any): Promise<any> {
    // Implement graph processing logic here
    // This could include graph analysis, metrics calculation, etc.
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing
    return { processed: true, timestamp: new Date().toISOString() };
  }

  // Process stage execution
  private async processStageExecution(payload: any): Promise<any> {
    // Implement stage-specific processing logic here
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate processing
    return { executed: true, stage: payload.stage, timestamp: new Date().toISOString() };
  }

  // Get queue statistics
  getStats() {
    return {
      queuedTasks: this.taskQueue.length,
      processingTasks: this.currentlyProcessing,
      completedTasks: this.processingTasks.size,
      maxConcurrent: this.maxConcurrent
    };
  }
}

// Singleton instance
export const backgroundProcessor = new BackgroundProcessor();

// Utility functions for common operations

export const queueGeminiCall = (prompt: string, credentials: APICredentials, priority: 'high' | 'medium' | 'low' = 'medium'): string => {
  return backgroundProcessor.addTask({
    type: 'api_call',
    priority,
    payload: {
      type: 'gemini',
      prompt,
      credentials
    }
  });
};

export const queueGraphProcessing = (graphData: any, operation: string, priority: 'high' | 'medium' | 'low' = 'low'): string => {
  return backgroundProcessor.addTask({
    type: 'graph_processing',
    priority,
    payload: {
      graphData,
      operation
    }
  });
};

export const getTaskResult = async (taskId: string, timeoutMs: number = 30000): Promise<any> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const task = backgroundProcessor.getTaskStatus(taskId);
    
    if (!task) {
      throw new Error('Task not found');
    }
    
    if (task.status === 'completed') {
      return task.result;
    }
    
    if (task.status === 'failed') {
      throw new Error(task.error || 'Task failed');
    }
    
    // Wait 500ms before checking again
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  throw new Error('Task timeout');
};
