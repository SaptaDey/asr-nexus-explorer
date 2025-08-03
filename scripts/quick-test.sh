#!/bin/bash

# Quick test script for essential checks before pushing
# This runs only the critical tests that should pass

set -e  # Exit on any error

echo "🚀 Running quick pre-push checks..."
echo "==================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Lint Check
echo -e "\n${YELLOW}1. Running ESLint...${NC}"
npm run lint
echo -e "${GREEN}✅ Lint check passed${NC}"

# 2. Type Check
echo -e "\n${YELLOW}2. Running TypeScript type check...${NC}"
npm run type-check
echo -e "${GREEN}✅ Type check passed${NC}"

# 3. Build Test
echo -e "\n${YELLOW}3. Testing production build...${NC}"
npm run build
echo -e "${GREEN}✅ Production build successful${NC}"

# Summary
echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}✅ All critical checks passed!${NC}"
echo -e "${GREEN}🚀 Ready to push to repository${NC}"
echo -e "${GREEN}================================${NC}"

echo -e "\n${YELLOW}Note: Unit and E2E tests are currently being fixed.${NC}"
echo -e "${YELLOW}Make sure to test the app manually before pushing.${NC}"

echo -e "\n${YELLOW}To push your changes, run:${NC}"
echo "  git push origin <branch-name>"