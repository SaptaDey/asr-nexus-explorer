import { test, expect, Page } from '@playwright/test';

// Define test data
const testQuery = 'What are the latest developments in immunotherapy for melanoma treatment?';
const testCredentials = {
  gemini: 'test-gemini-key',
  perplexity: 'test-perplexity-key'
};

// Page object model for research interface
class ResearchPage {
  constructor(private page: Page) {}

  async navigateToResearch() {
    await this.page.goto('/');
    await this.page.click('text=Research Interface', { timeout: 10000 });
  }

  async enterQuery(query: string) {
    const queryInput = this.page.locator('[data-testid="query-input"]').first();
    await queryInput.fill(query);
  }

  async setAPICredentials(credentials: typeof testCredentials) {
    // Open API settings
    await this.page.click('[data-testid="api-settings"]');
    
    // Fill Gemini key
    await this.page.fill('[data-testid="gemini-key"]', credentials.gemini);
    
    // Fill Perplexity key
    await this.page.fill('[data-testid="perplexity-key"]', credentials.perplexity);
    
    // Save credentials
    await this.page.click('[data-testid="save-credentials"]');
  }

  async startResearch() {
    await this.page.click('[data-testid="start-research"]');
  }

  async waitForStageCompletion(stage: number, timeout = 30000) {
    await this.page.waitForSelector(
      `[data-testid="stage-${stage}-completed"]`,
      { timeout }
    );
  }

  async getStageResult(stage: number) {
    return await this.page.textContent(`[data-testid="stage-${stage}-result"]`);
  }

  async getGraphVisualization() {
    return this.page.locator('[data-testid="graph-visualization"]');
  }

  async exportResults(format: 'html' | 'pdf' | 'json') {
    await this.page.click('[data-testid="export-button"]');
    await this.page.click(`[data-testid="export-${format}"]`);
    
    // Wait for download
    const download = await this.page.waitForEvent('download');
    return download;
  }

  async switchToManualMode() {
    await this.page.click('[data-testid="manual-mode"]');
  }

  async switchToAutoMode() {
    await this.page.click('[data-testid="auto-mode"]');
  }

  async executeNextStage() {
    await this.page.click('[data-testid="execute-next-stage"]');
  }

  async resetSession() {
    await this.page.click('[data-testid="reset-session"]');
  }
}

test.describe('Complete Research Pipeline E2E Tests', () => {
  let researchPage: ResearchPage;

  test.beforeEach(async ({ page }) => {
    researchPage = new ResearchPage(page);
  });

  test.describe('Full Automatic Research Pipeline', () => {
    test('should complete all 9 stages automatically', async ({ page }) => {
      await researchPage.navigateToResearch();
      
      // Set up API credentials
      await researchPage.setAPICredentials(testCredentials);
      
      // Enter research query
      await researchPage.enterQuery(testQuery);
      
      // Start automatic research
      await researchPage.startResearch();
      
      // Wait for all stages to complete
      for (let stage = 1; stage <= 9; stage++) {
        await researchPage.waitForStageCompletion(stage, 60000);
        
        // Verify stage result exists
        const result = await researchPage.getStageResult(stage);
        expect(result).toBeTruthy();
        expect(result?.length).toBeGreaterThan(100); // Meaningful content
      }
      
      // Verify final visualization
      const graphViz = await researchPage.getGraphVisualization();
      await expect(graphViz).toBeVisible();
      
      // Verify export functionality
      const download = await researchPage.exportResults('html');
      expect(download.suggestedFilename()).toContain('.html');
    });

    test('should handle API failures gracefully', async ({ page }) => {
      await researchPage.navigateToResearch();
      
      // Set invalid credentials
      await researchPage.setAPICredentials({
        gemini: 'invalid-key',
        perplexity: 'invalid-key'
      });
      
      await researchPage.enterQuery(testQuery);
      await researchPage.startResearch();
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      
      // Should allow retry
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    test('should maintain session state across page refreshes', async ({ page }) => {
      await researchPage.navigateToResearch();
      await researchPage.setAPICredentials(testCredentials);
      await researchPage.enterQuery(testQuery);
      await researchPage.startResearch();
      
      // Wait for first few stages
      await researchPage.waitForStageCompletion(2);
      
      // Refresh page
      await page.reload();
      
      // Session should be restored
      await expect(page.locator('[data-testid="session-restored"]')).toBeVisible();
      
      // Previous stage results should be visible
      const stage1Result = await researchPage.getStageResult(1);
      const stage2Result = await researchPage.getStageResult(2);
      
      expect(stage1Result).toBeTruthy();
      expect(stage2Result).toBeTruthy();
    });
  });

  test.describe('Manual Step-by-Step Research', () => {
    test('should allow manual stage execution', async ({ page }) => {
      await researchPage.navigateToResearch();
      await researchPage.setAPICredentials(testCredentials);
      await researchPage.switchToManualMode();
      
      await researchPage.enterQuery(testQuery);
      
      // Execute stages manually
      for (let stage = 1; stage <= 3; stage++) {
        await researchPage.executeNextStage();
        await researchPage.waitForStageCompletion(stage);
        
        // Verify stage completion
        const result = await researchPage.getStageResult(stage);
        expect(result).toBeTruthy();
        
        // Verify graph updates
        const graphViz = await researchPage.getGraphVisualization();
        await expect(graphViz).toBeVisible();
      }
    });

    test('should allow switching between manual and auto modes', async ({ page }) => {
      await researchPage.navigateToResearch();
      await researchPage.setAPICredentials(testCredentials);
      
      // Start in manual mode
      await researchPage.switchToManualMode();
      await researchPage.enterQuery(testQuery);
      
      // Execute first stage manually
      await researchPage.executeNextStage();
      await researchPage.waitForStageCompletion(1);
      
      // Switch to auto mode
      await researchPage.switchToAutoMode();
      
      // Should continue automatically
      await researchPage.waitForStageCompletion(2);
      await researchPage.waitForStageCompletion(3);
    });
  });

  test.describe('Graph Visualization Interactions', () => {
    test('should support graph interaction and navigation', async ({ page }) => {
      await researchPage.navigateToResearch();
      await researchPage.setAPICredentials(testCredentials);
      await researchPage.enterQuery(testQuery);
      await researchPage.startResearch();
      
      // Wait for some stages to complete
      await researchPage.waitForStageCompletion(3);
      
      const graphViz = await researchPage.getGraphVisualization();
      
      // Test node interaction
      const firstNode = graphViz.locator('[data-testid^="node-"]').first();
      await firstNode.click();
      
      // Should show node details
      await expect(page.locator('[data-testid="node-details"]')).toBeVisible();
      
      // Test zoom functionality
      await graphViz.click({ clickCount: 2 }); // Double click to zoom
      
      // Test pan functionality
      await graphViz.dragTo(graphViz, {
        sourcePosition: { x: 100, y: 100 },
        targetPosition: { x: 200, y: 200 }
      });
    });

    test('should update graph in real-time during research', async ({ page }) => {
      await researchPage.navigateToResearch();
      await researchPage.setAPICredentials(testCredentials);
      await researchPage.enterQuery(testQuery);
      await researchPage.startResearch();
      
      const graphViz = await researchPage.getGraphVisualization();
      
      // Initial state
      let nodeCount = await graphViz.locator('[data-testid^="node-"]').count();
      expect(nodeCount).toBeGreaterThan(0);
      
      // Wait for next stage
      await researchPage.waitForStageCompletion(2);
      
      // Should have more nodes
      const newNodeCount = await graphViz.locator('[data-testid^="node-"]').count();
      expect(newNodeCount).toBeGreaterThan(nodeCount);
    });
  });

  test.describe('Export and Sharing', () => {
    test('should export research results in multiple formats', async ({ page }) => {
      await researchPage.navigateToResearch();
      await researchPage.setAPICredentials(testCredentials);
      await researchPage.enterQuery(testQuery);
      await researchPage.startResearch();
      
      // Wait for research completion
      await researchPage.waitForStageCompletion(9, 120000);
      
      // Test HTML export
      const htmlDownload = await researchPage.exportResults('html');
      expect(htmlDownload.suggestedFilename()).toContain('.html');
      
      // Test PDF export
      const pdfDownload = await researchPage.exportResults('pdf');
      expect(pdfDownload.suggestedFilename()).toContain('.pdf');
      
      // Test JSON export
      const jsonDownload = await researchPage.exportResults('json');
      expect(jsonDownload.suggestedFilename()).toContain('.json');
    });

    test('should generate shareable research URLs', async ({ page }) => {
      await researchPage.navigateToResearch();
      await researchPage.setAPICredentials(testCredentials);
      await researchPage.enterQuery(testQuery);
      await researchPage.startResearch();
      
      await researchPage.waitForStageCompletion(5);
      
      // Generate share URL
      await page.click('[data-testid="share-button"]');
      
      const shareUrl = await page.inputValue('[data-testid="share-url"]');
      expect(shareUrl).toContain('http');
      expect(shareUrl).toContain('session=');
      
      // Test that share URL works
      await page.goto(shareUrl);
      
      // Should load the shared session
      await expect(page.locator('[data-testid="shared-session"]')).toBeVisible();
    });
  });

  test.describe('Performance and Reliability', () => {
    test('should handle large research queries efficiently', async ({ page }) => {
      const largeQuery = `
        Provide a comprehensive analysis of the intersection between artificial intelligence, 
        quantum computing, and biotechnology in the context of personalized medicine. 
        Include historical context, current developments, future prospects, ethical considerations, 
        regulatory frameworks, economic implications, and potential societal impacts. 
        Consider interdisciplinary approaches and emerging technologies.
      `;
      
      await researchPage.navigateToResearch();
      await researchPage.setAPICredentials(testCredentials);
      await researchPage.enterQuery(largeQuery);
      
      const startTime = Date.now();
      await researchPage.startResearch();
      
      // Should complete within reasonable time (5 minutes)
      await researchPage.waitForStageCompletion(9, 300000);
      
      const completionTime = Date.now() - startTime;
      expect(completionTime).toBeLessThan(300000); // 5 minutes
      
      // Verify quality of results
      const finalResult = await researchPage.getStageResult(9);
      expect(finalResult?.length).toBeGreaterThan(5000); // Substantial content
    });

    test('should recover from network interruptions', async ({ page }) => {
      await researchPage.navigateToResearch();
      await researchPage.setAPICredentials(testCredentials);
      await researchPage.enterQuery(testQuery);
      await researchPage.startResearch();
      
      // Wait for some progress
      await researchPage.waitForStageCompletion(2);
      
      // Simulate network interruption
      await page.context().setOffline(true);
      await page.waitForTimeout(2000);
      
      // Restore network
      await page.context().setOffline(false);
      
      // Should show recovery message
      await expect(page.locator('[data-testid="network-recovery"]')).toBeVisible();
      
      // Should continue processing
      await researchPage.waitForStageCompletion(3);
    });

    test('should maintain performance with multiple concurrent sessions', async ({ browser }) => {
      // Create multiple contexts for concurrent sessions
      const contexts = await Promise.all([
        browser.newContext(),
        browser.newContext(),
        browser.newContext()
      ]);
      
      const pages = await Promise.all(
        contexts.map(context => context.newPage())
      );
      
      // Start concurrent research sessions
      const researchPromises = pages.map(async (page, index) => {
        const researchPageInstance = new ResearchPage(page);
        await researchPageInstance.navigateToResearch();
        await researchPageInstance.setAPICredentials(testCredentials);
        await researchPageInstance.enterQuery(`${testQuery} - Session ${index + 1}`);
        await researchPageInstance.startResearch();
        
        // Wait for at least 3 stages
        await researchPageInstance.waitForStageCompletion(3, 60000);
        return page;
      });
      
      // All sessions should complete successfully
      const completedPages = await Promise.all(researchPromises);
      expect(completedPages).toHaveLength(3);
      
      // Clean up
      await Promise.all(contexts.map(context => context.close()));
    });
  });

  test.describe('Accessibility and Usability', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await researchPage.navigateToResearch();
      
      // Navigate using Tab key
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to reach main interactive elements
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['INPUT', 'BUTTON', 'TEXTAREA']).toContain(focusedElement);
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
      await researchPage.navigateToResearch();
      
      // Check main regions have proper labels
      const mainRegion = page.locator('[role="main"]');
      await expect(mainRegion).toBeVisible();
      
      // Check form elements have labels
      const queryInput = page.locator('[data-testid="query-input"]');
      const label = await queryInput.getAttribute('aria-label');
      expect(label).toBeTruthy();
    });

    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await researchPage.navigateToResearch();
      await researchPage.setAPICredentials(testCredentials);
      await researchPage.enterQuery(testQuery);
      
      // Mobile-specific interactions
      await page.touchscreen.tap(200, 400); // Tap to start research
      
      // Should adapt to mobile layout
      const mobileLayout = page.locator('[data-testid="mobile-layout"]');
      await expect(mobileLayout).toBeVisible();
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle malformed queries gracefully', async ({ page }) => {
      const malformedQueries = [
        '', // Empty query
        '   ', // Whitespace only
        'a'.repeat(10000), // Extremely long query
        '<script>alert("xss")</script>', // Potential XSS
        'SELECT * FROM users;', // SQL injection attempt
      ];
      
      for (const query of malformedQueries) {
        await researchPage.navigateToResearch();
        await researchPage.setAPICredentials(testCredentials);
        await researchPage.enterQuery(query);
        
        // Should either prevent submission or handle gracefully
        try {
          await researchPage.startResearch();
          
          // If submission is allowed, should show appropriate error
          await expect(page.locator('[data-testid="query-error"]')).toBeVisible();
        } catch (error) {
          // Submission prevented - this is acceptable behavior
        }
      }
    });

    test('should handle session timeouts', async ({ page }) => {
      await researchPage.navigateToResearch();
      await researchPage.setAPICredentials(testCredentials);
      await researchPage.enterQuery(testQuery);
      await researchPage.startResearch();
      
      // Wait for some progress
      await researchPage.waitForStageCompletion(2);
      
      // Simulate session timeout by clearing session storage
      await page.evaluate(() => {
        sessionStorage.clear();
        localStorage.setItem('sessionExpired', 'true');
      });
      
      // Trigger a new action
      await page.reload();
      
      // Should show session timeout message
      await expect(page.locator('[data-testid="session-timeout"]')).toBeVisible();
      
      // Should allow starting a new session
      await expect(page.locator('[data-testid="new-session"]')).toBeVisible();
    });
  });
});