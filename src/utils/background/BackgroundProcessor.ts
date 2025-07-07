// Main Background Processor Implementation
import { TaskQueue } from './TaskQueue';
import { ApiProcessor } from './ApiProcessor';
import { GraphProcessor } from './GraphProcessor';
import { StageProcessor } from './StageProcessor';
import { BackgroundTask } from './types';

export class BackgroundProcessor extends TaskQueue {
  // Execute specific task types
  protected async executeTask(task: BackgroundTask): Promise<any> {
    let result: any;

    switch (task.type) {
      case 'api_call':
        result = await ApiProcessor.processApiCall(task.payload);
        break;
      case 'graph_processing':
        result = await GraphProcessor.processGraphOperation(task.payload);
        break;
      case 'stage_execution':
        result = await StageProcessor.processStageExecution(task.payload);
        break;
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }

    return result;
  }
}