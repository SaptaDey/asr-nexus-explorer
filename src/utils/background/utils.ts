// Background Processing Utility Functions
import { backgroundProcessor } from './index';
import { APICredentials } from './types';

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