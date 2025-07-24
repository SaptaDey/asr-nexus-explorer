import { test, expect, Page } from '@playwright/test';

// Test data
const TEST_CREDENTIALS = {
  gemini: 'test-gemini-key-12345678901234567890',
  perplexity: 'test-perplexity-key-12345678901234567890'
};

const TEST_QUERIES = {
  simple: 'What are the effects of climate change on marine ecosystems?',
  complex: 'How do socioeconomic factors interact with genetic predisposition to influence Type 2 diabetes?',
  medical: 'What is the relationship between gut microbiome diversity and inflammatory bowel disease?'
};

class ResearchPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/asr-got-interface');
    await this.page.waitForLoadState('networkidle');
  }

  async enterCredentials(geminiKey: string, perplexityKey: string) {
    // Open API credentials modal
    await this.page.click('[data-testid="api-credentials-button"]');
    
    // Enter credentials
    await this.page.fill('[data-testid="gemini-api-key"]', geminiKey);
    await this.page.fill('[data-testid="perplexity-api-key"]', perplexityKey);
    
    // Save credentials
    await this.page.click('[data-testid="save-credentials"]');
    
    // Wait for validation
    await this.page.waitForSelector('[data-testid="credentials-valid"]', { timeout: 10000 });
  }

  async enterQuery(query: string) {
    await this.page.fill('[data-testid="research-query"]', query);
  }

  async startResearch() {
    await this.page.click('[data-testid="start-research"]');
  }

  async waitForStageCompletion(stage: number, timeout = 60000) {
    await this.page.waitForSelector(`[data-testid="stage-${stage}-completed"]`, { timeout });
  }

  async waitForResearchCompletion(timeout = 300000) {
    await this.page.waitForSelector('[data-testid="research-completed"]', { timeout });
  }

  async getStageResult(stage: number): Promise<string> {
    const element = await this.page.waitForSelector(`[data-testid="stage-${stage}-content"]`);
    return await element.textContent() || '';
  }

  async getGraphNodeCount(): Promise<number> {
    const nodes = await this.page.locator('[data-testid^="graph-node-"]').count();
    return nodes;
  }

  async getGraphEdgeCount(): Promise<number> {
    const edges = await this.page.locator('[data-testid^="graph-edge-"]').count();
    return edges;
  }

  async exportReport(format: 'html' | 'pdf' | 'json') {
    await this.page.click('[data-testid="export-report"]');
    await this.page.click(`[data-testid="export-${format}"]`);
  }

  async cancelResearch() {
    await this.page.click('[data-testid="cancel-research"]');
  }

  async switchToManualMode() {
    await this.page.click('[data-testid="manual-mode-toggle"]');
  }

  async executeStage(stage: number) {
    await this.page.click(`[data-testid="execute-stage-${stage}"]`);
  }

  async getProgressPercentage(): Promise<number> {
    const progressText = await this.page.textContent('[data-testid="progress-percentage"]');
    return parseInt(progressText?.replace('%', '') || '0');
  }
}

test.describe('Complete Research Pipeline E2E Tests', () => {
  let researchPage: ResearchPage;

  test.beforeEach(async ({ page }) => {
    researchPage = new ResearchPage(page);
    await researchPage.goto();
  });

  test.describe('Full Automated Pipeline', () => {
    test('should complete 9-stage research pipeline successfully', async ({ page }) => {
      // Setup test with longer timeout for complete pipeline
      test.setTimeout(600000); // 10 minutes

      // Enter API credentials
      await researchPage.enterCredentials(TEST_CREDENTIALS.gemini, TEST_CREDENTIALS.perplexity);

      // Enter research query
      await researchPage.enterQuery(TEST_QUERIES.simple);

      // Start research
      await researchPage.startResearch();

      // Verify execution begins
      await expect(page.locator('[data-testid="execution-status"]')).toContainText('Executing');

      // Wait for each stage to complete and verify progress
      for (let stage = 1; stage <= 9; stage++) {
        await researchPage.waitForStageCompletion(stage);
        
        // Verify stage content exists
        const stageContent = await researchPage.getStageResult(stage);
        expect(stageContent.length).toBeGreaterThan(0);
        
        // Verify progress updates
        const progress = await researchPage.getProgressPercentage();
        expect(progress).toBeGreaterThanOrEqual(Math.floor((stage / 9) * 100));
      }

      // Wait for complete research finish
      await researchPage.waitForResearchCompletion();

      // Verify final state
      await expect(page.locator('[data-testid="research-status"]')).toContainText('Completed');
      
      // Verify graph data was generated
      const nodeCount = await researchPage.getGraphNodeCount();
      const edgeCount = await researchPage.getGraphEdgeCount();
      
      expect(nodeCount).toBeGreaterThan(0);
      expect(edgeCount).toBeGreaterThan(0);

      // Verify export functionality is available
      await expect(page.locator('[data-testid="export-report"]')).toBeVisible();
    });

    test('should handle complex medical research query', async ({ page }) => {
      test.setTimeout(900000); // 15 minutes for complex query

      await researchPage.enterCredentials(TEST_CREDENTIALS.gemini, TEST_CREDENTIALS.perplexity);
      await researchPage.enterQuery(TEST_QUERIES.medical);
      await researchPage.startResearch();

      // Wait for completion
      await researchPage.waitForResearchCompletion();

      // Verify medical-specific content appears
      const stage7Content = await researchPage.getStageResult(7);
      expect(stage7Content.toLowerCase()).toMatch(/microbiome|inflammatory|bowel|disease/);

      // Verify citations are present
      expect(stage7Content).toMatch(/\[\d+\]/); // Vancouver citation pattern

      // Verify statistical analysis in final stage
      const stage9Content = await researchPage.getStageResult(9);
      expect(stage9Content.toLowerCase()).toMatch(/statistical|analysis|confidence|p-value/);
    });

    test('should generate comprehensive graph visualization', async ({ page }) => {
      await researchPage.enterCredentials(TEST_CREDENTIALS.gemini, TEST_CREDENTIALS.perplexity);
      await researchPage.enterQuery(TEST_QUERIES.complex);
      await researchPage.startResearch();

      // Wait for stage 4 (Evidence Integration) to see substantial graph growth
      await researchPage.waitForStageCompletion(4);

      // Verify graph visualization is present
      await expect(page.locator('[data-testid="graph-visualization"]')).toBeVisible();

      // Check node types
      await expect(page.locator('[data-testid="graph-node"][data-type="root"]')).toBeVisible();
      await expect(page.locator('[data-testid="graph-node"][data-type="hypothesis"]')).toBeVisible();
      await expect(page.locator('[data-testid="graph-node"][data-type="evidence"]')).toBeVisible();

      // Test graph interactions
      await page.click('[data-testid="graph-node"][data-type="root"]');
      await expect(page.locator('[data-testid="node-details-panel"]')).toBeVisible();

      // Test different visualization modes
      await page.click('[data-testid="3d-view-toggle"]');
      await expect(page.locator('[data-testid="3d-tree-visualization"]')).toBeVisible();

      await page.click('[data-testid="2d-view-toggle"]');
      await expect(page.locator('[data-testid="2d-graph-visualization"]')).toBeVisible();
    });
  });

  test.describe('Manual Stage Execution', () => {
    test('should allow manual stage-by-stage execution', async ({ page }) => {
      await researchPage.enterCredentials(TEST_CREDENTIALS.gemini, TEST_CREDENTIALS.perplexity);
      await researchPage.enterQuery(TEST_QUERIES.simple);
      
      // Switch to manual mode
      await researchPage.switchToManualMode();

      // Verify manual controls are visible
      for (let stage = 1; stage <= 9; stage++) {
        await expect(page.locator(`[data-testid="execute-stage-${stage}"]`)).toBeVisible();
      }

      // Execute stages individually
      for (let stage = 1; stage <= 3; stage++) {
        await researchPage.executeStage(stage);
        await researchPage.waitForStageCompletion(stage);
        
        // Verify stage result
        const content = await researchPage.getStageResult(stage);
        expect(content.length).toBeGreaterThan(0);
        
        // Verify next stage becomes available
        if (stage < 9) {
          await expect(page.locator(`[data-testid="execute-stage-${stage + 1}"]`)).toBeEnabled();
        }
      }

      // Verify graph updates after each stage
      const nodeCountAfterStage1 = await researchPage.getGraphNodeCount();
      
      await researchPage.executeStage(2);
      await researchPage.waitForStageCompletion(2);
      
      const nodeCountAfterStage2 = await researchPage.getGraphNodeCount();
      expect(nodeCountAfterStage2).toBeGreaterThanOrEqual(nodeCountAfterStage1);
    });

    test('should show detailed stage progress and timing', async ({ page }) => {
      await researchPage.enterCredentials(TEST_CREDENTIALS.gemini, TEST_CREDENTIALS.perplexity);
      await researchPage.enterQuery(TEST_QUERIES.simple);
      await researchPage.switchToManualMode();

      // Execute first stage and monitor timing
      const startTime = Date.now();
      await researchPage.executeStage(1);
      
      // Verify execution timer appears
      await expect(page.locator('[data-testid="stage-execution-timer"]')).toBeVisible();
      
      await researchPage.waitForStageCompletion(1);
      const endTime = Date.now();
      
      // Verify execution time is recorded
      const executionTime = await page.textContent('[data-testid="stage-1-duration"]');
      expect(executionTime).toMatch(/\d+(\.\d+)?s/);
      
      // Verify token usage is displayed
      await expect(page.locator('[data-testid="stage-1-tokens"]')).toBeVisible();
    });
  });

  test.describe('Error Handling and Recovery', () => {
    test('should handle API key validation errors', async ({ page }) => {
      // Try with invalid API keys
      await researchPage.enterCredentials('invalid-key', 'invalid-key');

      // Should show validation error
      await expect(page.locator('[data-testid="credentials-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="start-research"]')).toBeDisabled();
    });

    test('should handle network errors with retry', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/**', route => route.abort());

      await researchPage.enterCredentials(TEST_CREDENTIALS.gemini, TEST_CREDENTIALS.perplexity);
      await researchPage.enterQuery(TEST_QUERIES.simple);
      await researchPage.startResearch();

      // Should show network error
      await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
      
      // Should show retry button
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();

      // Remove network mock and retry
      await page.unroute('**/api/**');
      await page.click('[data-testid="retry-button"]');

      // Should resume execution
      await expect(page.locator('[data-testid="execution-status"]')).toContainText('Executing');
    });

    test('should handle research cancellation', async ({ page }) => {
      await researchPage.enterCredentials(TEST_CREDENTIALS.gemini, TEST_CREDENTIALS.perplexity);
      await researchPage.enterQuery(TEST_QUERIES.complex);
      await researchPage.startResearch();

      // Wait for execution to start
      await expect(page.locator('[data-testid="execution-status"]')).toContainText('Executing');

      // Cancel research
      await researchPage.cancelResearch();

      // Verify cancellation
      await expect(page.locator('[data-testid="research-status"]')).toContainText('Cancelled');
      
      // Verify partial results are preserved
      const nodeCount = await researchPage.getGraphNodeCount();
      expect(nodeCount).toBeGreaterThan(0);
    });

    test('should handle rate limiting gracefully', async ({ page }) => {
      // Mock rate limit response
      await page.route('**/api/gemini/**', route => {
        route.fulfill({
          status: 429,
          body: JSON.stringify({ error: 'Rate limit exceeded' })
        });
      });

      await researchPage.enterCredentials(TEST_CREDENTIALS.gemini, TEST_CREDENTIALS.perplexity);
      await researchPage.enterQuery(TEST_QUERIES.simple);
      await researchPage.startResearch();

      // Should show rate limit message
      await expect(page.locator('[data-testid="rate-limit-message"]')).toBeVisible();
      
      // Should show countdown timer
      await expect(page.locator('[data-testid="rate-limit-countdown"]')).toBeVisible();
    });
  });

  test.describe('Data Export and Persistence', () => {
    test('should export research results in multiple formats', async ({ page }) => {
      await researchPage.enterCredentials(TEST_CREDENTIALS.gemini, TEST_CREDENTIALS.perplexity);
      await researchPage.enterQuery(TEST_QUERIES.simple);
      await researchPage.switchToManualMode();

      // Execute a few stages
      for (let stage = 1; stage <= 3; stage++) {
        await researchPage.executeStage(stage);
        await researchPage.waitForStageCompletion(stage);
      }

      // Test HTML export
      const downloadPromise = page.waitForEvent('download');
      await researchPage.exportReport('html');
      const htmlDownload = await downloadPromise;
      expect(htmlDownload.suggestedFilename()).toMatch(/\.html$/);

      // Test JSON export
      const jsonDownloadPromise = page.waitForEvent('download');
      await researchPage.exportReport('json');
      const jsonDownload = await jsonDownloadPromise;
      expect(jsonDownload.suggestedFilename()).toMatch(/\.json$/);
    });

    test('should persist session state across page reloads', async ({ page }) => {
      await researchPage.enterCredentials(TEST_CREDENTIALS.gemini, TEST_CREDENTIALS.perplexity);
      await researchPage.enterQuery(TEST_QUERIES.simple);
      await researchPage.switchToManualMode();

      // Execute first stage
      await researchPage.executeStage(1);
      await researchPage.waitForStageCompletion(1);

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify state was restored
      await expect(page.locator('[data-testid="research-query"]')).toHaveValue(TEST_QUERIES.simple);
      await expect(page.locator('[data-testid="stage-1-completed"]')).toBeVisible();
      
      // Verify graph data was restored
      const nodeCount = await researchPage.getGraphNodeCount();
      expect(nodeCount).toBeGreaterThan(0);
    });

    test('should clear session data on reset', async ({ page }) => {
      await researchPage.enterCredentials(TEST_CREDENTIALS.gemini, TEST_CREDENTIALS.perplexity);
      await researchPage.enterQuery(TEST_QUERIES.simple);
      await researchPage.switchToManualMode();

      // Execute first stage
      await researchPage.executeStage(1);
      await researchPage.waitForStageCompletion(1);

      // Reset session
      await page.click('[data-testid="reset-session"]');
      await page.click('[data-testid="confirm-reset"]');

      // Verify reset
      await expect(page.locator('[data-testid="research-query"]')).toHaveValue('');
      await expect(page.locator('[data-testid="stage-1-completed"]')).not.toBeVisible();
      
      const nodeCount = await researchPage.getGraphNodeCount();
      expect(nodeCount).toBe(0);
    });
  });

  test.describe('Performance and Scalability', () => {
    test('should handle large research queries efficiently', async ({ page }) => {
      const largeQuery = TEST_QUERIES.complex.repeat(10); // 10x longer query

      await researchPage.enterCredentials(TEST_CREDENTIALS.gemini, TEST_CREDENTIALS.perplexity);
      await researchPage.enterQuery(largeQuery);

      const startTime = Date.now();
      await researchPage.startResearch();

      // Should start execution without significant delay
      await expect(page.locator('[data-testid="execution-status"]')).toContainText('Executing', { timeout: 10000 });
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(10000); // Should respond within 10 seconds
    });

    test('should handle concurrent user interactions', async ({ page }) => {
      await researchPage.enterCredentials(TEST_CREDENTIALS.gemini, TEST_CREDENTIALS.perplexity);
      await researchPage.enterQuery(TEST_QUERIES.simple);
      await researchPage.switchToManualMode();

      // Execute first stage
      await researchPage.executeStage(1);

      // Try concurrent interactions while stage is executing
      const interactions = [
        page.click('[data-testid="graph-visualization"]'),
        page.click('[data-testid="parameters-panel"]'),
        page.click('[data-testid="export-report"]')
      ];

      // Should handle all interactions without crashing
      await Promise.allSettled(interactions);
      
      // Verify application is still responsive
      await expect(page.locator('[data-testid="research-interface"]')).toBeVisible();
    });

    test('should maintain performance with large graph data', async ({ page }) => {
      await researchPage.enterCredentials(TEST_CREDENTIALS.gemini, TEST_CREDENTIALS.perplexity);
      await researchPage.enterQuery(TEST_QUERIES.complex);
      await researchPage.startResearch();

      // Wait for stage 4 when graph should be substantial
      await researchPage.waitForStageCompletion(4);

      // Test graph rendering performance
      const startTime = Date.now();
      await page.click('[data-testid="3d-view-toggle"]');
      await expect(page.locator('[data-testid="3d-tree-visualization"]')).toBeVisible();
      const renderTime = Date.now() - startTime;

      expect(renderTime).toBeLessThan(5000); // Should render within 5 seconds

      // Test graph interaction performance
      const interactionStartTime = Date.now();
      await page.click('[data-testid="graph-node"][data-type="root"]');
      await expect(page.locator('[data-testid="node-details-panel"]')).toBeVisible();
      const interactionTime = Date.now() - interactionStartTime;

      expect(interactionTime).toBeLessThan(1000); // Should respond within 1 second
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await researchPage.goto();

      // Verify mobile-optimized layout
      await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
      
      // Test mobile navigation
      await page.click('[data-testid="mobile-menu-toggle"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

      // Test research interface on mobile
      await researchPage.enterCredentials(TEST_CREDENTIALS.gemini, TEST_CREDENTIALS.perplexity);
      await researchPage.enterQuery(TEST_QUERIES.simple);

      // Verify mobile-optimized graph
      await researchPage.switchToManualMode();
      await researchPage.executeStage(1);
      await researchPage.waitForStageCompletion(1);

      await expect(page.locator('[data-testid="mobile-graph-view"]')).toBeVisible();
    });

    test('should handle touch interactions', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await researchPage.goto();

      await researchPage.enterCredentials(TEST_CREDENTIALS.gemini, TEST_CREDENTIALS.perplexity);
      await researchPage.enterQuery(TEST_QUERIES.simple);
      await researchPage.switchToManualMode();
      await researchPage.executeStage(1);
      await researchPage.waitForStageCompletion(1);

      // Test touch gestures on graph
      const graphNode = page.locator('[data-testid="graph-node"][data-type="root"]');
      
      // Test tap
      await graphNode.tap();
      await expect(page.locator('[data-testid="node-details-panel"]')).toBeVisible();

      // Test pan and zoom (if supported)
      const graphContainer = page.locator('[data-testid="graph-visualization"]');
      await graphContainer.hover();
      
      // Verify touch-friendly controls
      await expect(page.locator('[data-testid="zoom-controls"]')).toBeVisible();
    });
  });
});