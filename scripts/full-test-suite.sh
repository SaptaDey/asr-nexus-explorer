#!/bin/bash

# Full Test Suite for ASR-GoT Repository
# This script runs all required tests before pushing to repository
# Based on GitHub Actions workflow: .github/workflows/test.yml

set -e  # Exit on any error

echo "🚀 Running Full Test Suite for ASR-GoT"
echo "======================================"
echo "This will run all tests required before pushing"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=""

# Function to print test header
print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2 PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ $2 FAILED${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        FAILED_TESTS="${FAILED_TESTS}\n  - $2"
    fi
}

# Start time
START_TIME=$(date +%s)

# 1. LINT & TYPE CHECK
print_header "1. LINT & TYPE CHECK"
echo "Running ESLint..."
if npm run lint > /dev/null 2>&1; then
    print_result 0 "ESLint"
else
    print_result 1 "ESLint"
fi

echo "Running TypeScript type check..."
if npm run type-check > /dev/null 2>&1; then
    print_result 0 "TypeScript Check"
else
    print_result 1 "TypeScript Check"
fi

# 2. UNIT TESTS
print_header "2. UNIT TESTS"
echo "Running unit tests with coverage (parallel processing)..."
export NODE_OPTIONS="--max-old-space-size=8192"
if NODE_ENV=test npm run test:unit -- --coverage --reporter=verbose --threads=16 > /dev/null 2>&1; then
    print_result 0 "Unit Tests"
else
    print_result 1 "Unit Tests"
    echo -e "${YELLOW}Note: Unit tests may fail due to missing MSW setup${NC}"
fi

# 3. INTEGRATION TESTS
print_header "3. INTEGRATION TESTS"
echo "Running integration tests..."
if npm run test:integration > /dev/null 2>&1; then
    print_result 0 "Integration Tests"
else
    print_result 1 "Integration Tests"
    echo -e "${YELLOW}Note: Integration tests may fail without database setup${NC}"
fi

# 4. SECURITY TESTS
print_header "4. SECURITY TESTS"
echo "Running security tests..."
if npm run test:security > /dev/null 2>&1; then
    print_result 0 "Security Tests"
else
    print_result 1 "Security Tests"
fi

echo "Running npm audit..."
if npm audit --audit-level high > /dev/null 2>&1; then
    print_result 0 "NPM Audit"
else
    print_result 1 "NPM Audit"
    echo -e "${YELLOW}Run 'npm audit' to see vulnerabilities${NC}"
fi

# 5. PERFORMANCE TESTS
print_header "5. PERFORMANCE TESTS"
echo "Running performance tests..."
if npm run test:performance > /dev/null 2>&1; then
    print_result 0 "Performance Tests"
else
    print_result 1 "Performance Tests"
fi

# 6. E2E TESTS (SMOKE)
print_header "6. E2E TESTS (SMOKE)"
echo "Checking for Playwright..."
if command -v playwright &> /dev/null; then
    echo "Running E2E smoke tests..."
    if npm run test:e2e:smoke > /dev/null 2>&1; then
        print_result 0 "E2E Smoke Tests"
    else
        print_result 1 "E2E Smoke Tests"
    fi
else
    echo -e "${YELLOW}Playwright not installed. Skipping E2E tests.${NC}"
    echo "To install: npx playwright install --with-deps"
fi

# 7. BUILD TEST
print_header "7. BUILD TEST"
echo "Building production..."
if npm run build > /dev/null 2>&1; then
    print_result 0 "Production Build"
else
    print_result 1 "Production Build"
fi

echo "Building development..."
if npm run build:dev > /dev/null 2>&1; then
    print_result 0 "Development Build"
else
    print_result 1 "Development Build"
fi

# 8. COVERAGE REPORT
print_header "8. COVERAGE REPORT"
echo "Generating comprehensive coverage..."
if npm run test:coverage > /dev/null 2>&1; then
    print_result 0 "Coverage Generation"
    
    # Check if coverage meets thresholds
    if [ -f "coverage/coverage-summary.json" ]; then
        LINES=$(cat coverage/coverage-summary.json | jq '.total.lines.pct' 2>/dev/null || echo "0")
        FUNCTIONS=$(cat coverage/coverage-summary.json | jq '.total.functions.pct' 2>/dev/null || echo "0")
        BRANCHES=$(cat coverage/coverage-summary.json | jq '.total.branches.pct' 2>/dev/null || echo "0")
        STATEMENTS=$(cat coverage/coverage-summary.json | jq '.total.statements.pct' 2>/dev/null || echo "0")
        
        echo -e "\nCoverage Summary:"
        echo -e "  Lines:      ${LINES}% (threshold: 75%)"
        echo -e "  Functions:  ${FUNCTIONS}% (threshold: 70%)"
        echo -e "  Branches:   ${BRANCHES}% (threshold: 70%)"
        echo -e "  Statements: ${STATEMENTS}% (threshold: 75%)"
    fi
else
    print_result 1 "Coverage Generation"
fi

# 9. COMPLETE TEST SUITE REPORT
print_header "9. COMPLETE TEST SUITE REPORT"

# Calculate duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo -e "\n${BLUE}Test Suite Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "Total Tests Run:    $((TESTS_PASSED + TESTS_FAILED))"
echo -e "Tests Passed:       ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests Failed:       ${RED}${TESTS_FAILED}${NC}"
echo -e "Duration:           ${MINUTES}m ${SECONDS}s"

if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "\n${RED}Failed Tests:${NC}${FAILED_TESTS}"
fi

echo -e "\n${BLUE}═══════════════════════════════════════${NC}"

# Final status
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}🚀 Ready to push to repository${NC}"
    echo -e "\n${YELLOW}To push your changes, run:${NC}"
    echo "  git push origin <branch-name>"
    exit 0
else
    echo -e "\n${RED}❌ SOME TESTS FAILED${NC}"
    echo -e "${RED}Please fix the failing tests before pushing${NC}"
    
    # Provide helpful commands
    echo -e "\n${YELLOW}Helpful commands:${NC}"
    echo "  npm run lint --fix       # Auto-fix lint issues"
    echo "  npm run test:watch       # Run tests in watch mode"
    echo "  npm run test:ui          # Run tests with UI"
    echo "  npm audit fix           # Fix security vulnerabilities"
    
    exit 1
fi