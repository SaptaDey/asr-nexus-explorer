# Claude Memory for ASR-GoT Repository

## Testing Requirements (MANDATORY BEFORE PUSHING)

Always run these 9 tests locally before pushing any changes:

1. **Lint & Type Check** - `npm run lint` + `npm run type-check`
2. **Unit Tests** - `npm run test:unit`
3. **Integration Tests** - `npm run test:integration`
4. **Security Tests** - `npm run test:security` + `npm audit`
5. **Performance Tests** - `npm run test:performance`
6. **E2E Tests (Smoke)** - `npm run test:e2e:smoke`
7. **Build Tests** - `npm run build` + `npm run build:dev`
8. **Coverage Report** - `npm run test:coverage`
9. **Complete Test Suite Report** - Summary of all results

## Quick Commands

- **Full Test Suite**: `npm run test:pre-push` (runs all 9 tests)
- **Quick Tests**: `npm run test:quick` (lint + type + build only)
- **Manual Script**: `./scripts/full-test-suite.sh`

## Key Files

- `TESTING_CHECKLIST.md` - Detailed testing requirements
- `scripts/full-test-suite.sh` - Complete test runner
- `scripts/quick-test.sh` - Essential tests only
- `.github/workflows/test.yml` - CI/CD workflow (mirrors local tests)

## Workstation Specifications

**ALWAYS USE FULL PARALLEL PROCESSING POWER:**
- **CPU**: AMD Ryzen 9 7945HX (16 cores, 32 logical processors, 2501 MHz)
- **RAM**: 64 GB
- **GPU**: NVIDIA GeForce RTX 4060 (10 GB VRAM)
- **Parallel Processing**: Use --threads=16 minimum, up to 32 for massive tasks
- **Memory Allocation**: NODE_OPTIONS="--max-old-space-size=16384" (16GB max)

## Repository Context

- **Production Site**: https://scientific-research.online/
- **Main Branch**: `main` (auto-deploys to production)
- **Project**: ASR-GoT (Automatic Scientific Research - Graph of Thoughts)
- **Tech Stack**: React 18, TypeScript, Vite, Supabase, Tailwind CSS

## Recent Changes Made

1. Fixed authentication hanging issue with timeout protection
2. Enhanced auth UI with proper Google/GitHub logos and modern design
3. Improved accessibility and contrast throughout
4. Added comprehensive test framework
5. Created debugging infrastructure for auth flow

## Important Notes

- All code changes must pass full test suite before pushing
- Authentication uses Supabase with custom AuthService
- UI follows shadcn/ui design system
- Build must succeed in both production and development modes
- No exceptions for pushing untested code to production