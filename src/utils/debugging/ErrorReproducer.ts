/**
 * Error Reproduction and Debugging Utilities
 * Provides comprehensive error tracking, reproduction, and debugging capabilities
 */

export interface ErrorReport {
  id: string;
  timestamp: string;
  error: {
    name: string;
    message: string;
    stack?: string;
    cause?: any;
  };
  context: {
    url: string;
    userAgent: string;
    userId?: string;
    sessionId?: string;
    stage?: number;
    query?: string;
  };
  state: {
    graphData?: any;
    stageResults?: any[];
    apiCredentials?: boolean; // Just boolean for security
    processingMode?: string;
    memory?: MemoryInfo;
  };
  reproduction: {
    steps: string[];
    environment: EnvironmentInfo;
    preconditions: string[];
    expectedBehavior: string;
    actualBehavior: string;
  };
  metadata: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'ui' | 'api' | 'performance' | 'security' | 'data';
    reproducible: boolean;
    resolution?: string;
    tags: string[];
  };
}

export interface EnvironmentInfo {
  browser: string;
  browserVersion: string;
  os: string;
  screenResolution: string;
  viewport: { width: number; height: number };
  networkSpeed?: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  features: {
    webGL: boolean;
    indexedDB: boolean;
    serviceWorker: boolean;
    webSocket: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
  };
}

export interface MemoryInfo {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
  memory?: number;
  performance?: {
    loadTime: number;
    domContentLoaded: number;
    firstPaint?: number;
    firstContentfulPaint?: number;
  };
}

export interface ReproductionScript {
  id: string;
  title: string;
  description: string;
  steps: ReproductionStep[];
  assertions: ReproductionAssertion[];
  environment: Partial<EnvironmentInfo>;
  prerequisites: string[];
}

export interface ReproductionStep {
  type: 'navigate' | 'click' | 'input' | 'wait' | 'verify' | 'execute';
  selector?: string;
  value?: string;
  timeout?: number;
  description: string;
  screenshot?: boolean;
}

export interface ReproductionAssertion {
  type: 'exists' | 'visible' | 'text' | 'attribute' | 'count' | 'custom';
  selector?: string;
  expected: any;
  description: string;
}

class ErrorReproducer {
  private errorQueue: ErrorReport[] = [];
  private isCapturing = false;
  private maxQueueSize = 100;
  private environmentInfo: EnvironmentInfo;
  private sessionRecording: any[] = [];

  constructor() {
    this.environmentInfo = this.gatherEnvironmentInfo();
    this.setupGlobalErrorHandlers();
    this.startSessionRecording();
  }

  /**
   * Capture and process an error for reproduction
   */
  captureError(error: Error, context?: Partial<ErrorReport['context']>): string {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      },
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.getSessionId(),
        ...context
      },
      state: this.captureApplicationState(),
      reproduction: this.generateReproductionSteps(),
      metadata: this.classifyError(error)
    };

    this.addToQueue(errorReport);
    this.triggerAnalysis(errorReport);

    return errorReport.id;
  }

  /**
   * Generate reproduction script for an error
   */
  generateReproductionScript(errorId: string): ReproductionScript | null {
    const errorReport = this.errorQueue.find(e => e.id === errorId);
    if (!errorReport) return null;

    return {
      id: `script-${errorId}`,
      title: `Reproduce: ${errorReport.error.name}`,
      description: errorReport.error.message,
      steps: this.convertToReproductionSteps(errorReport),
      assertions: this.generateAssertions(errorReport),
      environment: errorReport.reproduction.environment,
      prerequisites: errorReport.reproduction.preconditions
    };
  }

  /**
   * Execute a reproduction script
   */
  async executeReproductionScript(script: ReproductionScript): Promise<{
    success: boolean;
    results: any[];
    errors: string[];
  }> {
    const results: any[] = [];
    const errors: string[] = [];

    try {
      // Validate environment
      if (!this.validateEnvironment(script.environment)) {
        errors.push('Environment requirements not met');
        return { success: false, results, errors };
      }

      // Execute each step
      for (const step of script.steps) {
        try {
          const result = await this.executeStep(step);
          results.push({ step: step.description, result, success: true });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          errors.push(`Step failed: ${step.description} - ${errorMsg}`);
          results.push({ step: step.description, error: errorMsg, success: false });
        }
      }

      // Execute assertions
      for (const assertion of script.assertions) {
        try {
          const result = await this.executeAssertion(assertion);
          results.push({ assertion: assertion.description, result, success: result });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          errors.push(`Assertion failed: ${assertion.description} - ${errorMsg}`);
        }
      }

      return { success: errors.length === 0, results, errors };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`Script execution failed: ${errorMsg}`);
      return { success: false, results, errors };
    }
  }

  /**
   * Get error reproduction statistics
   */
  getReproductionStats(): {
    totalErrors: number;
    reproducible: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    recent: ErrorReport[];
  } {
    return {
      totalErrors: this.errorQueue.length,
      reproducible: this.errorQueue.filter(e => e.metadata.reproducible).length,
      byCategory: this.groupBy(this.errorQueue, 'metadata.category'),
      bySeverity: this.groupBy(this.errorQueue, 'metadata.severity'),
      recent: this.errorQueue.slice(-10)
    };
  }

  /**
   * Export error data for external analysis
   */
  exportErrorData(format: 'json' | 'csv' | 'yaml' = 'json'): string {
    const data = {
      exported: new Date().toISOString(),
      environment: this.environmentInfo,
      errors: this.errorQueue.map(this.sanitizeErrorReport),
      statistics: this.getReproductionStats()
    };

    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        return this.convertToCSV(data.errors);
      case 'yaml':
        return this.convertToYAML(data);
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * Create debugging session with state capture
   */
  createDebugSession(): {
    sessionId: string;
    timestamp: string;
    state: any;
    actions: string[];
  } {
    const sessionId = this.generateSessionId();
    const session = {
      sessionId,
      timestamp: new Date().toISOString(),
      state: this.captureApplicationState(),
      actions: this.getRecentActions()
    };

    // Store session for later analysis
    this.storeDebugSession(sessionId, session);

    return session;
  }

  /**
   * Generate automated test from error
   */
  generateAutomatedTest(errorId: string, framework: 'playwright' | 'cypress' | 'jest'): string {
    const script = this.generateReproductionScript(errorId);
    if (!script) return '';

    switch (framework) {
      case 'playwright':
        return this.generatePlaywrightTest(script);
      case 'cypress':
        return this.generateCypressTest(script);
      case 'jest':
        return this.generateJestTest(script);
      default:
        return '';
    }
  }

  // Private methods

  private setupGlobalErrorHandlers(): void {
    window.addEventListener('error', (event) => {
      this.captureError(event.error, {
        url: event.filename,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      const error = new Error(event.reason?.message || 'Unhandled Promise Rejection');
      this.captureError(error, {
        url: window.location.href,
      });
    });

    // React error boundary integration
    window.addEventListener('react-error', ((event: CustomEvent) => {
      this.captureError(event.detail.error, {
        query: event.detail.context?.query,
        stage: event.detail.context?.stage
      });
    }) as EventListener);
  }

  private gatherEnvironmentInfo(): EnvironmentInfo {
    const getBrowserInfo = () => {
      const ua = navigator.userAgent;
      if (ua.includes('Chrome')) return { browser: 'Chrome', version: ua.match(/Chrome\/(\d+)/)?.[1] || 'unknown' };
      if (ua.includes('Firefox')) return { browser: 'Firefox', version: ua.match(/Firefox\/(\d+)/)?.[1] || 'unknown' };
      if (ua.includes('Safari')) return { browser: 'Safari', version: ua.match(/Safari\/(\d+)/)?.[1] || 'unknown' };
      return { browser: 'Unknown', version: 'unknown' };
    };

    const { browser, version } = getBrowserInfo();

    return {
      browser,
      browserVersion: version,
      os: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      deviceType: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
      features: {
        webGL: !!window.WebGLRenderingContext,
        indexedDB: !!window.indexedDB,
        serviceWorker: 'serviceWorker' in navigator,
        webSocket: !!window.WebSocket,
        localStorage: !!window.localStorage,
        sessionStorage: !!window.sessionStorage
      }
    };
  }

  private captureApplicationState(): ErrorReport['state'] {
    try {
      return {
        graphData: this.getGraphDataSummary(),
        stageResults: this.getStageResultsSummary(),
        apiCredentials: !!localStorage.getItem('api_credentials'),
        processingMode: localStorage.getItem('processing_mode') || 'auto',
        memory: this.getMemoryInfo()
      };
    } catch (error) {
      console.warn('Failed to capture application state:', error);
      return {};
    }
  }

  private generateReproductionSteps(): ErrorReport['reproduction'] {
    return {
      steps: this.sessionRecording.slice(-10).map(action => 
        `${action.type}: ${action.description}`
      ),
      environment: this.environmentInfo,
      preconditions: this.generatePreconditions(),
      expectedBehavior: 'Application should work without errors',
      actualBehavior: 'Error occurred during operation'
    };
  }

  private classifyError(error: Error): ErrorReport['metadata'] {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    let category: ErrorReport['metadata']['category'] = 'ui';
    let severity: ErrorReport['metadata']['severity'] = 'medium';

    // Classify by category
    if (message.includes('network') || message.includes('fetch') || message.includes('api')) {
      category = 'api';
    } else if (message.includes('memory') || message.includes('performance') || stack.includes('timeout')) {
      category = 'performance';
    } else if (message.includes('unauthorized') || message.includes('forbidden') || message.includes('csrf')) {
      category = 'security';
    } else if (message.includes('data') || message.includes('validation') || message.includes('schema')) {
      category = 'data';
    }

    // Classify by severity
    if (message.includes('critical') || message.includes('fatal') || message.includes('crash')) {
      severity = 'critical';
    } else if (message.includes('security') || message.includes('unauthorized') || category === 'security') {
      severity = 'high';
    } else if (message.includes('warning') || message.includes('deprecated')) {
      severity = 'low';
    }

    return {
      severity,
      category,
      reproducible: this.isReproducible(error),
      tags: this.generateTags(error),
    };
  }

  private convertToReproductionSteps(errorReport: ErrorReport): ReproductionStep[] {
    const steps: ReproductionStep[] = [
      {
        type: 'navigate',
        value: errorReport.context.url,
        description: `Navigate to ${errorReport.context.url}`,
        screenshot: true
      }
    ];

    // Add context-specific steps
    if (errorReport.context.query) {
      steps.push({
        type: 'input',
        selector: '[data-testid="query-input"]',
        value: errorReport.context.query,
        description: `Enter query: ${errorReport.context.query}`
      });
    }

    if (errorReport.context.stage) {
      steps.push({
        type: 'execute',
        description: `Execute up to stage ${errorReport.context.stage}`
      });
    }

    return steps;
  }

  private generateAssertions(errorReport: ErrorReport): ReproductionAssertion[] {
    return [
      {
        type: 'exists',
        selector: '[data-testid="error-message"]',
        expected: true,
        description: 'Error message should be displayed'
      },
      {
        type: 'text',
        selector: '[data-testid="error-message"]',
        expected: errorReport.error.message,
        description: `Error message should contain: ${errorReport.error.message}`
      }
    ];
  }

  private async executeStep(step: ReproductionStep): Promise<any> {
    switch (step.type) {
      case 'navigate':
        if (step.value && step.value !== window.location.href) {
          window.location.href = step.value;
          await this.waitForLoad();
        }
        break;
      
      case 'click':
        if (step.selector) {
          const element = document.querySelector(step.selector);
          if (element) {
            (element as HTMLElement).click();
          } else {
            throw new Error(`Element not found: ${step.selector}`);
          }
        }
        break;
      
      case 'input':
        if (step.selector && step.value) {
          const element = document.querySelector(step.selector) as HTMLInputElement;
          if (element) {
            element.value = step.value;
            element.dispatchEvent(new Event('input', { bubbles: true }));
          } else {
            throw new Error(`Input element not found: ${step.selector}`);
          }
        }
        break;
      
      case 'wait':
        await new Promise(resolve => setTimeout(resolve, step.timeout || 1000));
        break;
      
      case 'verify':
        return this.verifyCondition(step);
      
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
    
    return true;
  }

  private async executeAssertion(assertion: ReproductionAssertion): Promise<boolean> {
    switch (assertion.type) {
      case 'exists':
        const element = document.querySelector(assertion.selector || '');
        return !!element === assertion.expected;
      
      case 'visible':
        const visibleElement = document.querySelector(assertion.selector || '');
        const isVisible = visibleElement && 
          window.getComputedStyle(visibleElement).display !== 'none' &&
          window.getComputedStyle(visibleElement).visibility !== 'hidden';
        return !!isVisible === assertion.expected;
      
      case 'text':
        const textElement = document.querySelector(assertion.selector || '');
        const text = textElement?.textContent || '';
        return text.includes(assertion.expected);
      
      case 'count':
        const elements = document.querySelectorAll(assertion.selector || '');
        return elements.length === assertion.expected;
      
      default:
        return false;
    }
  }

  private generateErrorId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSessionId(): string {
    return sessionStorage.getItem('asr_session_id') || 'unknown-session';
  }

  private addToQueue(errorReport: ErrorReport): void {
    this.errorQueue.push(errorReport);
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  private triggerAnalysis(errorReport: ErrorReport): void {
    // Send to analytics service
    this.sendToAnalytics(errorReport);
    
    // Check for patterns
    this.analyzePatterns();
    
    // Auto-classify if possible
    this.autoClassify(errorReport);
  }

  private sendToAnalytics(errorReport: ErrorReport): void {
    // In a real implementation, this would send to an analytics service
    console.debug('Error reported:', errorReport);
  }

  private analyzePatterns(): void {
    // Analyze error patterns for insights
    const recentErrors = this.errorQueue.slice(-20);
    const patterns = this.findPatterns(recentErrors);
    
    if (patterns.length > 0) {
      console.info('Error patterns detected:', patterns);
    }
  }

  private autoClassify(errorReport: ErrorReport): void {
    // Use ML or heuristics to auto-classify errors
    // This is a simplified version
    if (errorReport.error.stack?.includes('React')) {
      errorReport.metadata.tags.push('react');
    }
    
    if (errorReport.context.url.includes('api')) {
      errorReport.metadata.tags.push('api-related');
    }
  }

  private sanitizeErrorReport(errorReport: ErrorReport): Partial<ErrorReport> {
    // Remove sensitive information
    const sanitized = { ...errorReport };
    delete sanitized.state.apiCredentials;
    delete sanitized.context.userId;
    
    return sanitized;
  }

  private convertToCSV(errors: Partial<ErrorReport>[]): string {
    const headers = ['id', 'timestamp', 'error.name', 'error.message', 'metadata.severity', 'metadata.category'];
    const rows = errors.map(error => [
      error.id,
      error.timestamp,
      error.error?.name,
      error.error?.message,
      error.metadata?.severity,
      error.metadata?.category
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private convertToYAML(data: any): string {
    // Simple YAML conversion (in production, use a proper YAML library)
    return JSON.stringify(data, null, 2).replace(/"/g, '').replace(/,/g, '');
  }

  private generatePreconditions(): string[] {
    return [
      'Browser supports modern JavaScript features',
      'Network connection available',
      'Local storage accessible',
      'Application loaded successfully'
    ];
  }

  private getGraphDataSummary(): any {
    try {
      const graphData = JSON.parse(sessionStorage.getItem('graph_data') || '{}');
      return {
        nodeCount: graphData.nodes?.length || 0,
        edgeCount: graphData.edges?.length || 0,
        stage: graphData.metadata?.stage || 0
      };
    } catch {
      return null;
    }
  }

  private getStageResultsSummary(): any[] {
    try {
      const results = JSON.parse(sessionStorage.getItem('stage_results') || '[]');
      return results.map((result: any) => ({
        stage: result.stage,
        status: result.status,
        timestamp: result.timestamp
      }));
    } catch {
      return [];
    }
  }

  private getMemoryInfo(): MemoryInfo {
    const memory: MemoryInfo = {};
    
    if ('memory' in performance) {
      const perfMemory = (performance as any).memory;
      memory.usedJSHeapSize = perfMemory.usedJSHeapSize;
      memory.totalJSHeapSize = perfMemory.totalJSHeapSize;
      memory.jsHeapSizeLimit = perfMemory.jsHeapSizeLimit;
    }
    
    memory.performance = {
      loadTime: performance.now(),
      domContentLoaded: performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd || 0
    };
    
    return memory;
  }

  private startSessionRecording(): void {
    // Record user actions for reproduction
    ['click', 'input', 'change', 'submit'].forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        if (this.sessionRecording.length > 50) {
          this.sessionRecording.shift();
        }
        
        this.sessionRecording.push({
          type: eventType,
          timestamp: Date.now(),
          target: this.getElementSelector(event.target as Element),
          description: this.describeAction(eventType, event.target as Element)
        });
      });
    });
  }

  private getElementSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    if (element.getAttribute('data-testid')) return `[data-testid="${element.getAttribute('data-testid')}"]`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  private describeAction(type: string, element: Element): string {
    const selector = this.getElementSelector(element);
    switch (type) {
      case 'click': return `Click ${selector}`;
      case 'input': return `Input to ${selector}`;
      case 'change': return `Change ${selector}`;
      case 'submit': return `Submit ${selector}`;
      default: return `${type} on ${selector}`;
    }
  }

  private isReproducible(error: Error): boolean {
    // Heuristics to determine if error is reproducible
    const message = error.message.toLowerCase();
    
    // Network errors are often not reproducible
    if (message.includes('network') || message.includes('timeout')) return false;
    
    // Random errors are not reproducible
    if (message.includes('random') || message.includes('intermittent')) return false;
    
    // Most other errors are potentially reproducible
    return true;
  }

  private generateTags(error: Error): string[] {
    const tags: string[] = [];
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';
    
    if (message.includes('react') || stack.includes('react')) tags.push('react');
    if (message.includes('api') || stack.includes('fetch')) tags.push('api');
    if (message.includes('memory')) tags.push('memory');
    if (message.includes('performance')) tags.push('performance');
    if (message.includes('timeout')) tags.push('timeout');
    
    return tags;
  }

  private groupBy(array: any[], path: string): Record<string, number> {
    return array.reduce((acc, obj) => {
      const value = this.getNestedValue(obj, path);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private findPatterns(errors: ErrorReport[]): string[] {
    const patterns: string[] = [];
    
    // Check for repeated errors
    const errorCounts = this.groupBy(errors, 'error.message');
    Object.entries(errorCounts).forEach(([message, count]) => {
      if (count > 3) {
        patterns.push(`Repeated error: ${message} (${count} times)`);
      }
    });
    
    return patterns;
  }

  private getRecentActions(): string[] {
    return this.sessionRecording.slice(-10).map(action => action.description);
  }

  private storeDebugSession(sessionId: string, session: any): void {
    try {
      localStorage.setItem(`debug_session_${sessionId}`, JSON.stringify(session));
    } catch (error) {
      console.warn('Failed to store debug session:', error);
    }
  }

  private async waitForLoad(): Promise<void> {
    return new Promise(resolve => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', () => resolve(), { once: true });
      }
    });
  }

  private verifyCondition(step: ReproductionStep): boolean {
    // Implement condition verification based on step description
    return true;
  }

  private validateEnvironment(environment: Partial<EnvironmentInfo>): boolean {
    // Validate that current environment matches requirements
    if (environment.browser && environment.browser !== this.environmentInfo.browser) {
      return false;
    }
    
    if (environment.deviceType && environment.deviceType !== this.environmentInfo.deviceType) {
      return false;
    }
    
    return true;
  }

  // Test framework generators

  private generatePlaywrightTest(script: ReproductionScript): string {
    const steps = script.steps.map(step => {
      switch (step.type) {
        case 'navigate':
          return `  await page.goto('${step.value}');`;
        case 'click':
          return `  await page.click('${step.selector}');`;
        case 'input':
          return `  await page.fill('${step.selector}', '${step.value}');`;
        case 'wait':
          return `  await page.waitForTimeout(${step.timeout || 1000});`;
        default:
          return `  // ${step.description}`;
      }
    }).join('\n');

    const assertions = script.assertions.map(assertion => {
      switch (assertion.type) {
        case 'exists':
          return `  await expect(page.locator('${assertion.selector}')).toBeVisible();`;
        case 'text':
          return `  await expect(page.locator('${assertion.selector}')).toContainText('${assertion.expected}');`;
        default:
          return `  // ${assertion.description}`;
      }
    }).join('\n');

    return `
import { test, expect } from '@playwright/test';

test('${script.title}', async ({ page }) => {
  // Prerequisites: ${script.prerequisites.join(', ')}
  
${steps}

  // Assertions
${assertions}
});
`;
  }

  private generateCypressTest(script: ReproductionScript): string {
    const steps = script.steps.map(step => {
      switch (step.type) {
        case 'navigate':
          return `  cy.visit('${step.value}');`;
        case 'click':
          return `  cy.get('${step.selector}').click();`;
        case 'input':
          return `  cy.get('${step.selector}').type('${step.value}');`;
        case 'wait':
          return `  cy.wait(${step.timeout || 1000});`;
        default:
          return `  // ${step.description}`;
      }
    }).join('\n');

    const assertions = script.assertions.map(assertion => {
      switch (assertion.type) {
        case 'exists':
          return `  cy.get('${assertion.selector}').should('exist');`;
        case 'text':
          return `  cy.get('${assertion.selector}').should('contain.text', '${assertion.expected}');`;
        default:
          return `  // ${assertion.description}`;
      }
    }).join('\n');

    return `
describe('${script.title}', () => {
  it('should reproduce error', () => {
    // Prerequisites: ${script.prerequisites.join(', ')}
    
${steps}

    // Assertions
${assertions}
  });
});
`;
  }

  private generateJestTest(script: ReproductionScript): string {
    return `
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from '../App';

describe('${script.title}', () => {
  test('should reproduce error', async () => {
    // Prerequisites: ${script.prerequisites.join(', ')}
    
    render(<App />);
    
    // Test steps would be implemented here based on the script
    // This is a template - actual implementation would depend on the specific error
    
    expect(screen.getByText('${script.description}')).toBeInTheDocument();
  });
});
`;
  }
}

// Export singleton instance
export const errorReproducer = new ErrorReproducer();

// Global error reproduction utilities
declare global {
  interface Window {
    ASR_DEBUG: {
      captureError: (error: Error, context?: any) => string;
      generateScript: (errorId: string) => ReproductionScript | null;
      executeScript: (script: ReproductionScript) => Promise<any>;
      exportErrors: (format?: 'json' | 'csv' | 'yaml') => string;
      getStats: () => any;
      createDebugSession: () => any;
    };
  }
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.ASR_DEBUG = {
    captureError: (error: Error, context?: any) => errorReproducer.captureError(error, context),
    generateScript: (errorId: string) => errorReproducer.generateReproductionScript(errorId),
    executeScript: (script: ReproductionScript) => errorReproducer.executeReproductionScript(script),
    exportErrors: (format?: 'json' | 'csv' | 'yaml') => errorReproducer.exportErrorData(format),
    getStats: () => errorReproducer.getReproductionStats(),
    createDebugSession: () => errorReproducer.createDebugSession()
  };
}

// Export types for use in other modules
export type {
  ErrorReport,
  EnvironmentInfo,
  MemoryInfo,
  ReproductionScript,
  ReproductionStep,
  ReproductionAssertion
};