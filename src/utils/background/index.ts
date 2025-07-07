// Background Processing Main Exports
import { BackgroundProcessor } from './BackgroundProcessor';

// Singleton instance
export const backgroundProcessor = new BackgroundProcessor();

// Re-export everything
export * from './types';
export * from './TaskQueue';
export * from './ApiProcessor';
export * from './GraphProcessor';
export * from './StageProcessor';
export * from './BackgroundProcessor';
export * from './utils';