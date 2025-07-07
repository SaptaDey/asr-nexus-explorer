// Background Processing Types
import type { BackgroundTask, APICredentials } from '@/types/asrGotTypes';

export type { BackgroundTask, APICredentials };

export interface TaskQueueStats {
  queuedTasks: number;
  processingTasks: number;
  completedTasks: number;
  maxConcurrent: number;
}

export interface ApiCallPayload {
  type: 'gemini';
  prompt: string;
  credentials: APICredentials;
  capability?: string;
  schema?: any;
  options?: any;
}

export interface GraphProcessingPayload {
  graphData: any;
  operation: string;
}

export interface StageExecutionPayload {
  stage: string;
  [key: string]: any;
}