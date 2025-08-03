# ASR-GoT Repository Testing Checklist

This document defines the mandatory testing checklist that must be run locally before pushing any changes to the ASR-GoT repository.

## Required Tests (In Order)

### 1. **Lint & Type Check**
- **ESLint**: `npm run lint`
- **TypeScript**: `npm run type-check`
- **Purpose**: Ensure code quality and type safety

### 2. **Unit Tests**
- **Command**: `npm run test:unit`
- **With Coverage**: `npm run test:unit -- --coverage --reporter=verbose`
- **Purpose**: Test individual components and functions

### 3. **Integration Tests**
- **Command**: `npm run test:integration`
- **Purpose**: Test component interactions and API integrations
- **Note**: Requires database setup for full functionality

### 4. **Security Tests**
- **Security Tests**: `npm run test:security`
- **NPM Audit**: `npm audit --audit-level high`
- **Purpose**: Identify security vulnerabilities and unsafe patterns

### 5. **Performance Tests**
- **Command**: `npm run test:performance`
- **Purpose**: Ensure application performance meets standards

### 6. **E2E Tests (Smoke)**
- **Command**: `npm run test:e2e:smoke`
- **Requirements**: Playwright installed (`npx playwright install --with-deps`)
- **Purpose**: Test critical user flows end-to-end

### 7. **Build Tests**
- **Production Build**: `npm run build`
- **Development Build**: `npm run build:dev`
- **Purpose**: Ensure application builds successfully in both environments

### 8. **Coverage Report**
- **Command**: `npm run test:coverage`
- **Thresholds**:
  - Lines: 75%
  - Functions: 70%
  - Branches: 70%
  - Statements: 75%

### 9. **Complete Test Suite Report**
- **Summary**: All test results and coverage metrics
- **Status**: Pass/fail determination for push readiness

## Test Scripts Available

### Quick Tests (Essential Only)
```bash
./scripts/quick-test.sh
```
Runs: Lint + Type Check + Build Test

### Full Test Suite (All Required Tests)
```bash
./scripts/full-test-suite.sh
```
Runs all 9 required test categories in order

### Individual Test Commands
```bash
npm run lint                    # ESLint
npm run type-check             # TypeScript
npm run test:unit              # Unit tests
npm run test:integration       # Integration tests
npm run test:security          # Security tests
npm run test:performance       # Performance tests
npm run test:e2e:smoke         # E2E smoke tests
npm run test:coverage          # Coverage report
npm run build                  # Production build
npm run build:dev             # Development build
```

## Pre-Push Requirements

**MANDATORY**: All tests must pass before pushing to repository

**Exceptions**: 
- Integration tests may be skipped if database is not available locally
- E2E tests may be skipped if Playwright is not installed
- Performance tests are advisory but should not block pushes

## GitHub Actions Alignment

This checklist mirrors the GitHub Actions workflow (`.github/workflows/test.yml`) to ensure consistency between local and CI testing.

## Test Environment Setup

### Prerequisites
```bash
npm install                     # Install dependencies
npx playwright install         # Install browsers for E2E tests
```

### Environment Variables
```bash
# For integration/E2E tests
VITE_SUPABASE_URL=your-test-url
VITE_SUPABASE_ANON_KEY=your-test-key
```

## Troubleshooting

### Common Issues
1. **MSW Import Errors**: Unit tests may fail due to MSW setup
2. **Database Connection**: Integration tests need database access
3. **Playwright Missing**: E2E tests require browser installation
4. **Memory Issues**: Use `NODE_OPTIONS="--max-old-space-size=4096"`

### Quick Fixes
```bash
npm run lint --fix             # Auto-fix lint issues
npm audit fix                  # Fix security vulnerabilities
npm run test:watch            # Debug tests interactively
```

---

**Remember**: This testing checklist is mandatory for all contributors. No exceptions for pushing untested code to production.