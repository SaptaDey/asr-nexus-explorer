# ASR-GoT Testing Suite

This directory contains a comprehensive testing suite for the ASR-GoT (Automatic Scientific Research - Graph of Thoughts) framework. The test suite ensures code quality, prevents regressions, and validates that all critical functionality works as expected.

## 🧪 Test Structure

```
src/test/
├── unit/                    # Unit tests for individual components
│   ├── services/           # Service layer tests
│   ├── hooks/              # React hooks tests
│   ├── components/         # React component tests
│   └── performance/        # Performance benchmarks
├── integration/            # Integration tests
│   ├── researchWorkflow.test.ts
│   └── security.test.ts
├── e2e/                    # End-to-end tests
│   └── complete-research-pipeline.spec.ts
├── mocks/                  # Mock implementations
│   ├── server.ts           # MSW server setup
│   └── mockServices.ts     # Service mocks
├── fixtures/               # Test data
│   └── testData.ts         # Structured test data
└── utils/                  # Testing utilities
    └── testUtils.tsx       # Common test helpers
```

## 🚀 Quick Start

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # End-to-end tests only
npm run test:security     # Security tests only
npm run test:performance  # Performance tests only

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui

# Watch mode for development
npm run test:watch
```

### Prerequisites

1. **API Keys**: For integration and E2E tests, you may need valid API keys:
   ```bash
   export VITE_TEST_GEMINI_KEY="your-test-gemini-key"
   export VITE_TEST_PERPLEXITY_KEY="your-test-perplexity-key"
   ```

2. **Browser Dependencies**: E2E tests require Playwright browsers:
   ```bash
   npx playwright install
   ```

## 📊 Test Coverage

Our testing suite maintains high coverage standards:

- **Lines**: > 75%
- **Functions**: > 70%
- **Branches**: > 70%
- **Statements**: > 75%

Critical services have higher thresholds:
- **AsrGotStageEngine**: > 90% all metrics
- **apiService**: > 85% all metrics
- **Core hooks**: > 85% all metrics

## 🔧 Test Categories

### Unit Tests

Test individual components, services, and utilities in isolation.

**Key Features:**
- Comprehensive service testing (AsrGotStageEngine, apiService)
- React hooks testing with proper mocking
- Utility function validation
- Performance benchmarking

**Example:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { AsrGotStageEngine } from '@/services/AsrGotStageEngine';

describe('AsrGotStageEngine', () => {
  it('should execute stage 1 successfully', async () => {
    const engine = new AsrGotStageEngine(mockCredentials);
    const result = await engine.executeStage(1, 'test query');
    
    expect(result.stage).toBe(1);
    expect(result.status).toBe('completed');
  });
});
```

### Integration Tests

Test complete user workflows and API interactions.

**Key Features:**
- Complete research pipeline testing
- API integration validation
- State management testing
- Error handling and recovery

**Example:**
```typescript
import { render, screen, userEvent } from '@testing-library/react';
import { ResearchInterface } from '@/components/asr-got/ResearchInterface';

test('complete research workflow', async () => {
  render(<ResearchInterface />);
  
  await userEvent.type(screen.getByLabelText(/gemini api key/i), 'test-key');
  await userEvent.type(screen.getByLabelText(/research query/i), 'test query');
  await userEvent.click(screen.getByRole('button', { name: /start research/i }));
  
  await waitFor(() => {
    expect(screen.getByText(/research completed/i)).toBeInTheDocument();
  });
});
```

### End-to-End Tests

Test complete application workflows in a real browser environment.

**Key Features:**
- Full research pipeline execution
- Multi-browser testing (Chrome, Firefox, Safari)
- Mobile responsiveness testing
- Performance validation

**Example:**
```typescript
import { test, expect } from '@playwright/test';

test('complete 9-stage research pipeline', async ({ page }) => {
  await page.goto('/asr-got-interface');
  
  // Enter credentials and query
  await page.fill('[data-testid="gemini-api-key"]', 'test-key');
  await page.fill('[data-testid="research-query"]', 'test query');
  
  // Start research
  await page.click('[data-testid="start-research"]');
  
  // Wait for completion
  await page.waitForSelector('[data-testid="research-completed"]');
  
  // Verify results
  expect(await page.textContent('[data-testid="final-stage"]')).toContain('Stage 9');
});
```

### Security Tests

Prevent security regressions and validate input sanitization.

**Key Features:**
- XSS prevention testing
- SQL injection protection
- API key security validation
- Rate limiting verification
- CSRF protection testing

**Example:**
```typescript
test('should sanitize malicious input', async () => {
  const maliciousInput = '<script>alert("xss")</script>';
  
  render(<ResearchInterface />);
  await userEvent.type(screen.getByLabelText(/research query/i), maliciousInput);
  
  // Verify input is sanitized
  expect(screen.getByDisplayValue(/research query/i)).not.toContain('<script>');
});
```

### Performance Tests

Ensure the application performs well under various conditions.

**Key Features:**
- Large graph handling (1000+ nodes)
- Memory leak detection
- API response time validation
- Rendering performance benchmarks

**Example:**
```typescript
test('should handle large graphs efficiently', async () => {
  const largeGraph = createLargeTestGraph(1000, 2000);
  
  const startTime = performance.now();
  await processGraph(largeGraph);
  const duration = performance.now() - startTime;
  
  expect(duration).toBeLessThan(1000); // Should complete within 1 second
});
```

## 🛠 Testing Utilities

### Test Data Factory

Create consistent test data:

```typescript
import { createTestNode, createTestGraph, createTestStageResult } from '@/test/utils/testUtils';

const node = createTestNode({ 
  label: 'Custom Test Node',
  confidence: [0.9, 0.8, 0.7, 0.6]
});

const graph = createTestGraph(10, 15); // 10 nodes, 15 edges
const stageResult = createTestStageResult(3); // Stage 3 result
```

### Mock Services

Pre-configured mocks for external dependencies:

```typescript
import { mockServices } from '@/test/mocks/mockServices';

// Use in tests
mockServices.stageEngine.executeStage.mockResolvedValue(testResult);
mockServices.api.callGemini.mockResolvedValue('mock response');
```

### Performance Measuring

Benchmark critical operations:

```typescript
import { measurePerformance } from '@/test/utils/testUtils';

const { result, duration } = await measurePerformance(
  () => processLargeDataset(data),
  'Large Dataset Processing'
);

expect(duration).toBeLessThan(5000);
```

## 🔒 Security Testing

### Input Sanitization

All user inputs are tested against common attack vectors:
- XSS payloads
- SQL injection attempts
- Command injection
- Path traversal

### API Security

- API key validation and encryption
- Rate limiting enforcement
- Request origin validation
- Response sanitization

### Authentication

- Session management
- Token validation
- Permission checking
- RLS (Row Level Security) enforcement

## 📈 Performance Benchmarks

### Target Performance Metrics

- **Graph Rendering**: < 33ms (30fps)
- **API Response**: < 2 seconds average
- **Memory Usage**: < 200MB for large graphs
- **Stage Execution**: < 30 seconds per stage

### Performance Test Categories

1. **Rendering Performance**
   - Large graph visualization
   - Real-time updates
   - Animation smoothness

2. **Memory Management**
   - Memory leak detection
   - Garbage collection efficiency
   - Cache optimization

3. **API Performance**
   - Concurrent request handling
   - Request batching
   - Response caching

## 🚨 CI/CD Integration

### GitHub Actions Workflow

The test suite runs automatically on:
- Pull requests to main branch
- Pushes to main/develop branches
- Daily scheduled runs
- Manual triggers

### Test Stages

1. **Lint & Type Check** (10 min timeout)
2. **Unit Tests** (20 min timeout)
3. **Integration Tests** (30 min timeout)  
4. **Security Tests** (15 min timeout)
5. **Performance Tests** (25 min timeout)
6. **E2E Tests** (45 min timeout)
7. **Coverage Report** (15 min timeout)
8. **Build Test** (15 min timeout)

### Failure Handling

- Coverage below threshold fails the build
- Security test failures are blocking
- Performance degradation warnings
- Automatic retry for flaky tests

## 🐛 Debugging Tests

### Common Issues

1. **Async Test Failures**
   ```typescript
   // ❌ Wrong
   test('async operation', () => {
     someAsyncOperation();
     expect(result).toBe(expected);
   });
   
   // ✅ Correct  
   test('async operation', async () => {
     await someAsyncOperation();
     expect(result).toBe(expected);
   });
   ```

2. **Mock Not Working**
   ```typescript
   // ❌ Wrong - mock after import
   import { service } from './service';
   vi.mock('./service');
   
   // ✅ Correct - mock before import
   vi.mock('./service');
   import { service } from './service';
   ```

3. **State Not Updating**
   ```typescript
   // ❌ Wrong - no act wrapper
   userEvent.click(button);
   expect(screen.getByText('updated')).toBeInTheDocument();
   
   // ✅ Correct - wrap in act
   await act(async () => {
     await userEvent.click(button);
   });
   expect(screen.getByText('updated')).toBeInTheDocument();
   ```

### Debug Tools

- **Vitest UI**: `npm run test:ui`
- **Playwright Inspector**: `npx playwright test --debug`
- **Coverage Reports**: `npm run test:coverage`
- **Test Results**: Check `test-results/` directory

## 📝 Writing New Tests

### Test File Naming

- Unit tests: `*.test.ts` or `*.test.tsx`
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.spec.ts`

### Test Structure

```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  describe('specific functionality', () => {
    it('should do something specific', () => {
      // Arrange
      const input = createTestData();
      
      // Act
      const result = performAction(input);
      
      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Best Practices

1. **Test Behavior, Not Implementation**
2. **Use Descriptive Test Names**
3. **Follow AAA Pattern** (Arrange, Act, Assert)
4. **Mock External Dependencies**
5. **Test Edge Cases and Error Conditions**
6. **Keep Tests Independent**
7. **Use TypeScript for Type Safety**

## 🆘 Getting Help

### Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)

### Common Commands

```bash
# Debug specific test
npm test -- --reporter=verbose ComponentName

# Run tests matching pattern
npm test -- --grep "should handle errors"

# Update snapshots
npm test -- --update-snapshots

# Profile performance
npm test -- --reporter=verbose --coverage
```

### Troubleshooting

If tests are failing:

1. Check test output for specific error messages
2. Verify mocks are properly configured
3. Ensure test data is valid
4. Check for async/await issues
5. Validate test environment setup

---

**Need help?** Check the test output, review the examples above, or create an issue with test logs and error details.