import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TaskQueue } from '@/utils/background/TaskQueue';
import type { QueueTask, TaskPriority, TaskStatus } from '@/types/asrGotTypes';

// Mock console to prevent test output noise
const mockConsole = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn()
};

describe('TaskQueue', () => {
  let taskQueue: TaskQueue;
  let mockExecutor: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Replace console methods
    vi.stubGlobal('console', mockConsole);
    
    mockExecutor = vi.fn().mockResolvedValue({ success: true, data: 'test result' });
    taskQueue = new TaskQueue(mockExecutor, { maxConcurrent: 2, retryAttempts: 3 });
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    taskQueue.stop();
    vi.restoreAllMocks();
  });

  describe('Task Addition', () => {
    it('should add high priority tasks', async () => {
      const taskId = await taskQueue.addTask({
        type: 'gemini_call',
        priority: 'high',
        data: { query: 'test query' }
      });

      expect(taskId).toBeDefined();
      expect(typeof taskId).toBe('string');
    });

    it('should add medium priority tasks', async () => {
      const taskId = await taskQueue.addTask({
        type: 'perplexity_call',
        priority: 'medium',
        data: { query: 'test query' }
      });

      expect(taskId).toBeDefined();
    });

    it('should add low priority tasks', async () => {
      const taskId = await taskQueue.addTask({
        type: 'background_processing',
        priority: 'low',
        data: { operation: 'cleanup' }
      });

      expect(taskId).toBeDefined();
    });

    it('should generate unique task IDs', async () => {
      const taskId1 = await taskQueue.addTask({
        type: 'gemini_call',
        priority: 'high',
        data: { query: 'query 1' }
      });

      const taskId2 = await taskQueue.addTask({
        type: 'gemini_call',
        priority: 'high',
        data: { query: 'query 2' }
      });

      expect(taskId1).not.toBe(taskId2);
    });
  });

  describe('Task Execution', () => {
    it('should execute tasks in priority order', async () => {
      // Add tasks in reverse priority order
      const lowPriorityId = await taskQueue.addTask({
        type: 'background_processing',
        priority: 'low',
        data: { operation: 'low' }
      });

      const mediumPriorityId = await taskQueue.addTask({
        type: 'perplexity_call',
        priority: 'medium',
        data: { operation: 'medium' }
      });

      const highPriorityId = await taskQueue.addTask({
        type: 'gemini_call',
        priority: 'high',
        data: { operation: 'high' }
      });

      taskQueue.start();

      // Wait for tasks to be processed
      await new Promise(resolve => setTimeout(resolve, 100));

      // High priority should be executed first
      expect(mockExecutor).toHaveBeenCalledWith(
        expect.objectContaining({
          id: highPriorityId,
          priority: 'high'
        })
      );
    });

    it('should respect maximum concurrent limit', async () => {
      // Create a slow mock executor that allows us to test concurrency
      let resolveCount = 0;
      const resolvers: (() => void)[] = [];
      const slowMockExecutor = vi.fn().mockImplementation(() => {
        return new Promise(resolve => {
          resolvers.push(() => {
            resolveCount++;
            resolve({ success: true, data: `result ${resolveCount}` });
          });
        });
      });

      const slowTaskQueue = new TaskQueue(slowMockExecutor, { maxConcurrent: 2, retryAttempts: 3 });

      // Add more tasks than concurrent limit
      const taskIds = [];
      for (let i = 0; i < 5; i++) {
        const taskId = await slowTaskQueue.addTask({
          type: 'gemini_call',
          priority: 'medium',
          data: { query: `query ${i}` }
        });
        taskIds.push(taskId);
      }

      slowTaskQueue.start();

      // Wait for initial tasks to start
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should only start 2 tasks due to concurrent limit
      expect(slowMockExecutor).toHaveBeenCalledTimes(2);

      // Complete first task
      resolvers[0]();
      await new Promise(resolve => setTimeout(resolve, 20));

      // Should start one more task
      expect(slowMockExecutor).toHaveBeenCalledTimes(3);

      // Complete second task
      resolvers[1]();
      await new Promise(resolve => setTimeout(resolve, 20));

      // Should start another task
      expect(slowMockExecutor).toHaveBeenCalledTimes(4);

      // Clean up
      slowTaskQueue.stop();
    });

    it('should handle task execution errors', async () => {
      // Mock executor to fail all retry attempts (3 attempts)
      mockExecutor
        .mockRejectedValueOnce(new Error('Execution failed'))
        .mockRejectedValueOnce(new Error('Execution failed'))
        .mockRejectedValueOnce(new Error('Execution failed'));

      const taskId = await taskQueue.addTask({
        type: 'gemini_call',
        priority: 'high',
        data: { query: 'failing query' }
      });

      taskQueue.start();

      // Wait for task processing and all retries but check before cleanup
      await new Promise(resolve => setTimeout(resolve, 80));

      const taskStatus = taskQueue.getTaskStatus(taskId);
      expect(taskStatus?.status).toBe('failed');
    });

    it('should retry failed tasks', async () => {
      mockExecutor
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce({ success: true, data: 'success after retries' });

      const taskId = await taskQueue.addTask({
        type: 'gemini_call',
        priority: 'high',
        data: { query: 'retry query' }
      });

      taskQueue.start();

      // Wait for retries but check before cleanup
      await new Promise(resolve => setTimeout(resolve, 80));

      // Should have been called 3 times (initial + 2 retries)
      expect(mockExecutor).toHaveBeenCalledTimes(3);
      
      const taskStatus = taskQueue.getTaskStatus(taskId);
      expect(taskStatus?.status).toBe('completed');
    });

    it('should mark tasks as failed after max retries', async () => {
      mockExecutor.mockRejectedValue(new Error('Persistent failure'));

      const taskId = await taskQueue.addTask({
        type: 'gemini_call',
        priority: 'high',
        data: { query: 'persistent fail query' }
      });

      taskQueue.start();

      // Wait for all retry attempts but check before cleanup
      await new Promise(resolve => setTimeout(resolve, 80));

      const taskStatus = taskQueue.getTaskStatus(taskId);
      expect(taskStatus?.status).toBe('failed');
      expect(taskStatus?.attempts).toBe(3); // Initial + 2 retries
    });
  });

  describe('Task Status Management', () => {
    it('should track task status correctly', async () => {
      const taskId = await taskQueue.addTask({
        type: 'gemini_call',
        priority: 'high',
        data: { query: 'status test' }
      });

      let status = taskQueue.getTaskStatus(taskId);
      expect(status?.status).toBe('pending');

      taskQueue.start();

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));

      status = taskQueue.getTaskStatus(taskId);
      expect(status?.status).toBe('completed');
    });

    it('should provide task results', async () => {
      const expectedResult = { success: true, data: 'test result' };
      mockExecutor.mockResolvedValueOnce(expectedResult);

      const taskId = await taskQueue.addTask({
        type: 'gemini_call',
        priority: 'high',
        data: { query: 'result test' }
      });

      taskQueue.start();

      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = taskQueue.getTaskResult(taskId);
      expect(result).toEqual(expectedResult);
    });

    it('should handle non-existent task status requests', () => {
      const status = taskQueue.getTaskStatus('non-existent-id');
      expect(status).toBeNull();

      const result = taskQueue.getTaskResult('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('Queue Management', () => {
    it('should start and stop processing', () => {
      expect(taskQueue.isRunning()).toBe(false);

      taskQueue.start();
      expect(taskQueue.isRunning()).toBe(true);

      taskQueue.stop();
      expect(taskQueue.isRunning()).toBe(false);
    });

    it('should pause and resume processing', async () => {
      // Use a controlled slow executor
      let resolveTask: () => void;
      const slowExecutor = vi.fn().mockImplementation(() => {
        return new Promise(resolve => {
          resolveTask = () => resolve({ success: true, data: 'paused result' });
        });
      });

      const pauseTestQueue = new TaskQueue(slowExecutor, { maxConcurrent: 1, retryAttempts: 1 });

      const taskId = await pauseTestQueue.addTask({
        type: 'gemini_call',
        priority: 'high',
        data: { query: 'pause test' }
      });

      pauseTestQueue.start();
      
      // Wait for task to start processing
      await new Promise(resolve => setTimeout(resolve, 30));
      
      pauseTestQueue.pause();

      // Task should be processing, not pending (since it already started)
      let status = pauseTestQueue.getTaskStatus(taskId);
      expect(status?.status).toBe('processing');

      pauseTestQueue.resume();

      // Complete the task
      resolveTask();
      await new Promise(resolve => setTimeout(resolve, 50));

      status = pauseTestQueue.getTaskStatus(taskId);
      expect(status?.status).toBe('completed');
      
      // Clean up
      pauseTestQueue.stop();
    });

    it('should clear all tasks', async () => {
      await taskQueue.addTask({
        type: 'gemini_call',
        priority: 'high',
        data: { query: 'clear test 1' }
      });

      await taskQueue.addTask({
        type: 'perplexity_call',
        priority: 'medium',
        data: { query: 'clear test 2' }
      });

      const stats = taskQueue.getQueueStats();
      expect(stats.pending).toBe(2);

      taskQueue.clearQueue();

      const statsAfterClear = taskQueue.getQueueStats();
      expect(statsAfterClear.pending).toBe(0);
      expect(statsAfterClear.completed).toBe(0);
      expect(statsAfterClear.failed).toBe(0);
    });

    it('should provide queue statistics', async () => {
      // Add various priority tasks
      await taskQueue.addTask({
        type: 'gemini_call',
        priority: 'high',
        data: { query: 'stats test 1' }
      });

      await taskQueue.addTask({
        type: 'perplexity_call',
        priority: 'medium',
        data: { query: 'stats test 2' }
      });

      await taskQueue.addTask({
        type: 'background_processing',
        priority: 'low',
        data: { query: 'stats test 3' }
      });

      const stats = taskQueue.getQueueStats();

      expect(stats).toHaveProperty('pending');
      expect(stats).toHaveProperty('running');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('failed');
      expect(stats).toHaveProperty('total');

      expect(stats.pending).toBe(3);
      expect(stats.total).toBe(3);
    });
  });

  describe('Task Cancellation', () => {
    it('should cancel pending tasks', async () => {
      const taskId = await taskQueue.addTask({
        type: 'gemini_call',
        priority: 'low',
        data: { query: 'cancel test' }
      });

      const cancelled = taskQueue.cancelTask(taskId);
      expect(cancelled).toBe(true);

      const status = taskQueue.getTaskStatus(taskId);
      expect(status?.status).toBe('cancelled');
    });

    it('should not cancel running or completed tasks', async () => {
      const taskId = await taskQueue.addTask({
        type: 'gemini_call',
        priority: 'high',
        data: { query: 'no cancel test' }
      });

      taskQueue.start();

      // Wait for task to start running
      await new Promise(resolve => setTimeout(resolve, 50));

      const cancelled = taskQueue.cancelTask(taskId);
      expect(cancelled).toBe(false);
    });

    it('should handle cancellation of non-existent tasks', () => {
      const cancelled = taskQueue.cancelTask('non-existent-id');
      expect(cancelled).toBe(false);
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle large numbers of tasks efficiently', async () => {
      const startTime = Date.now();
      const taskIds = [];

      // Add 100 tasks
      for (let i = 0; i < 100; i++) {
        const taskId = await taskQueue.addTask({
          type: 'background_processing',
          priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
          data: { query: `performance test ${i}` }
        });
        taskIds.push(taskId);
      }

      const additionTime = Date.now() - startTime;
      expect(additionTime).toBeLessThan(1000); // Should add 100 tasks in under 1 second

      const stats = taskQueue.getQueueStats();
      expect(stats.pending).toBe(100);
    });

    it('should clean up completed tasks to prevent memory leaks', async () => {
      // Enable task cleanup (this might be a configuration option)
      const cleanupQueue = new TaskQueue(mockExecutor, { 
        maxConcurrent: 2, 
        retryAttempts: 1,
        cleanupCompleted: true,
        maxCompletedTasks: 10
      });

      // Add and process many tasks
      for (let i = 0; i < 20; i++) {
        await cleanupQueue.addTask({
          type: 'background_processing',
          priority: 'low',
          data: { query: `cleanup test ${i}` }
        });
      }

      cleanupQueue.start();

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 300));

      const stats = cleanupQueue.getQueueStats();
      
      // Should not have more than maxCompletedTasks completed tasks in memory
      expect(stats.completed).toBeLessThanOrEqual(10);
      
      cleanupQueue.stop();
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle executor throwing non-Error objects', async () => {
      // Mock executor to fail all retry attempts with non-Error object
      mockExecutor
        .mockRejectedValueOnce('String error')
        .mockRejectedValueOnce('String error')
        .mockRejectedValueOnce('String error');

      const taskId = await taskQueue.addTask({
        type: 'gemini_call',
        priority: 'high',
        data: { query: 'non-error test' }
      });

      taskQueue.start();

      await new Promise(resolve => setTimeout(resolve, 80));

      const status = taskQueue.getTaskStatus(taskId);
      expect(status?.status).toBe('failed');
    });

    it('should handle executor returning undefined', async () => {
      mockExecutor.mockResolvedValueOnce(undefined);

      const taskId = await taskQueue.addTask({
        type: 'gemini_call',
        priority: 'high',
        data: { query: 'undefined result test' }
      });

      taskQueue.start();

      await new Promise(resolve => setTimeout(resolve, 100));

      const result = taskQueue.getTaskResult(taskId);
      expect(result).toBeUndefined();

      const status = taskQueue.getTaskStatus(taskId);
      expect(status?.status).toBe('completed');
    });

    it('should handle task data corruption gracefully', async () => {
      const taskId = await taskQueue.addTask({
        type: 'gemini_call',
        priority: 'high',
        data: null as any // Simulating corrupted data
      });

      taskQueue.start();

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not crash the queue
      expect(taskQueue.isRunning()).toBe(true);
    });
  });
});