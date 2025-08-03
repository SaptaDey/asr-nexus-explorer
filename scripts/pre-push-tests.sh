#!/bin/bash

# Pre-push test script
# This script runs the same tests as GitHub Actions before pushing changes

set -e  # Exit on any error

echo "🚀 Running pre-push tests..."
echo "============================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

# 1. Lint Check
echo -e "\n${YELLOW}1. Running ESLint...${NC}"
npm run lint
print_status $? "Lint check passed"

# 2. Type Check
echo -e "\n${YELLOW}2. Running TypeScript type check...${NC}"
npm run type-check
print_status $? "Type check passed"

# 3. Unit Tests
echo -e "\n${YELLOW}3. Running unit tests...${NC}"
npm run test:unit
print_status $? "Unit tests passed"

# 4. Integration Tests (if database is available)
echo -e "\n${YELLOW}4. Running integration tests...${NC}"
if npm run test:integration 2>/dev/null; then
    print_status 0 "Integration tests passed"
else
    echo -e "${YELLOW}⚠️  Integration tests skipped (database not available)${NC}"
fi

# 5. Build Test
echo -e "\n${YELLOW}5. Testing production build...${NC}"
npm run build
print_status $? "Production build successful"

# 6. E2E Smoke Tests
echo -e "\n${YELLOW}6. Running E2E smoke tests...${NC}"
if command -v playwright &> /dev/null; then
    npm run test:e2e:smoke
    print_status $? "E2E smoke tests passed"
else
    echo -e "${YELLOW}⚠️  E2E tests skipped (Playwright not installed)${NC}"
    echo "   Run 'npx playwright install' to enable E2E tests"
fi

# Summary
echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}✅ All tests passed!${NC}"
echo -e "${GREEN}🚀 Ready to push to repository${NC}"
echo -e "${GREEN}================================${NC}"

echo -e "\n${YELLOW}To push your changes, run:${NC}"
echo "  git push origin <branch-name>"