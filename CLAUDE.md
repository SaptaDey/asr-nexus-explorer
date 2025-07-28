# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **ASR-GoT (Automatic Scientific Research - Graph of Thoughts)** framework - a sophisticated AI-powered research platform deployed at **https://scientific-research.online/**. It implements a revolutionary 9-stage mandatory pipeline for conducting structured scientific research using graph-based reasoning visualization and multi-AI orchestration.

## Critical Production Information

- **Live Domain**: https://scientific-research.online/
- **Repository**: https://github.com/SaptaDey/asr-nexus-explorer.git
- **Branch**: main (production)
- **Deployment**: Direct GitHub integration with automatic deployment
- **Project ID**: aogeenqytwrpjvrfwvjw (Supabase)

## Development Commands

- `npm run dev` - Start development server on port 8080
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm i` - Install dependencies

## Critical Directory Structure

### 1. `/src/` - Core Application Logic
**Main Entry Points**:
- `main.tsx` - React 18 application bootstrap
- `App.tsx` - Root component with React Router v6 routing
- `index.css` - Global styles and CSS variables

**Pages Structure** (`/src/pages/`):
- `ASRGoTInterface.tsx` - **Main research interface** (primary user entry point)
- `Index.tsx` - Landing page with feature overview
- `StageDetail.tsx` - Individual stage execution details
- `GraphOfThoughtsGuide.tsx` - Methodology documentation
- `AIPowered.tsx`, `ResearchFramework.tsx`, `GraphNeuralNetworks.tsx` - Feature pages
- `Contact.tsx` - Contact information
- `NotFound.tsx` - 404 error handling

**Components Architecture** (`/src/components/`):
- `ui/` - **40+ shadcn/ui components** (accordion, button, card, dialog, etc.)
- `asr-got/` - **Specialized research components**:
  - `ResearchInterface.tsx` - Main research workflow UI
  - `TreeOfReasoningVisualization.tsx` - 3D botanical tree visualization
  - `EnhancedGraphVisualization.tsx` - Cytoscape.js graph rendering
  - `StageManager.tsx` - Stage execution controls
  - `APIIntegration.tsx` - Secure API credential management
  - `DeveloperMode.tsx` - Advanced parameter tuning
  - `ExportFunctionality.tsx` - Multi-format export system

**State Management** (`/src/hooks/`):
- `useASRGoT.ts` - **Master orchestration hook**
- `asr-got/` subdirectory:
  - `useASRGoTState.ts` - Core state management
  - `useStageExecution.ts` - Stage execution logic
  - `useAPICredentials.ts` - Secure API management
  - `useProcessingMode.ts` - Manual/automatic modes
  - `useExportFunctionality.ts` - Export system

**Business Logic** (`/src/services/`):
- `AsrGotStageEngine.ts` - **Core 9-stage pipeline engine**
- `apiService.ts` - API abstraction layer
- `stageExecutors.ts` - Individual stage implementations
- `BiasDetectionService.ts` - Bias analysis
- `CitationManager.ts` - Vancouver citation system
- `CodeExecutionService.ts` - Code execution capabilities

**Background Processing** (`/src/utils/background/`):
- `TaskQueue.ts` - Priority-based task management
- `ApiProcessor.ts` - API call optimization
- `StageProcessor.ts` - Stage execution processing
- `GraphProcessor.ts` - Graph computation
- `BackgroundProcessor.ts` - Main coordination

**Type System** (`/src/types/`):
- `asrGotTypes.ts` - **Complete ASR-GoT type definitions**

**Configuration** (`/src/config/`):
- `asrGotParameters.ts` - **29 parameters (P1.0-P1.29) controlling framework behavior**

**Styling** (`/src/styles/`):
- `botanical-base.css` - Tree visualization styles
- `botanical-animations.css` - Growth animations
- `botanical-themes.css` - Color schemes
- `TreeStyles.css` - 3D tree rendering

**Integrations** (`/src/integrations/`):
- `supabase/` - Database integration (client.ts, types.ts)

### 2. `/public/` - Static Assets
- `img/` - Brand assets (logo.png, hero.png, splash.png)
- `favicon.ico` - Site icon
- `placeholder.svg` - Placeholder graphics
- `robots.txt` - SEO crawler configuration

### 3. `/supabase/` - Backend Configuration
- `config.toml` - Supabase project configuration (aogeenqytwrpjvrfwvjw)

### 4. Root Configuration Files
- `index.html` - **Main HTML template with SEO metadata**
- `package.json` - Dependencies and scripts
- `package-lock.json` - Dependency lockfile
- `tailwind.config.ts` - Tailwind CSS configuration with custom botanical themes

## ASR-GoT Framework Architecture

### 9-Stage Mandatory Pipeline
1. **Initialization** - Task understanding and root node creation with Knowledge Nodes (K1-K3)
2. **Decomposition** - Multi-dimensional analysis (scope, objectives, constraints, biases, gaps)
3. **Hypothesis/Planning** - Generate 3-5 testable hypotheses per dimension with impact scoring
4. **Evidence Integration** - Iterative Perplexity Sonar + Gemini analysis loops with causal inference
5. **Pruning/Merging** - Graph optimization with information theory metrics
6. **Subgraph Extraction** - High-impact pathway identification with complexity analysis
7. **Composition** - HTML synthesis with Vancouver citations and statistical reporting
8. **Reflection** - Self-audit for bias detection, temporal consistency, and statistical rigor
9. **Final Analysis** - Comprehensive PhD-level report with quantitative insights

### Multi-AI Orchestration
- **Perplexity Sonar**: Real-time web search and evidence collection (with Gemini fallback)
- **Gemini 2.5 Pro**: Advanced reasoning, synthesis, and analysis
- **Background Processing**: Asynchronous task queuing for optimal performance
- **Token Management**: P1.21 compliance (3000 tokens/Sonar, 6000/Gemini)

### Advanced Graph Data Structure
- **Nodes**: Multi-dimensional confidence vectors `[empirical_support, theoretical_basis, methodological_rigor, consensus_alignment]`
- **Edges**: Extended relationship types including:
  - Basic: supportive, contradictory, correlative, prerequisite
  - Causal: causal_direct, causal_counterfactual, causal_confounded
  - Temporal: temporal_precedence, temporal_cyclic, temporal_delayed, temporal_sequential
- **HyperEdges**: Complex multi-node relationships (interdisciplinary, multi_causal, complex_relationship)
- **Knowledge Nodes**: K1-K3 framework constraints and user profile integration
- **Metadata**: Rich P1.12 schema compliance with:
  - Causal metadata (confounders, mechanisms, counterfactuals)
  - Temporal metadata (patterns, precedence, confidence)
  - Information theory metrics (entropy, complexity, information gain)
  - Statistical power analysis (sample size, effect size, p-values)

### Advanced Features Implementation
- **Causal Inference (P1.24)**: Pearl's causal reasoning with confounder detection
- **Temporal Reasoning (P1.25)**: Pattern detection and time-series analysis
- **Information Theory (P1.27)**: Entropy calculations, mutual information, MDL scoring
- **Statistical Power (P1.26)**: Comprehensive power analysis with methodological quality assessment
- **Hyperedges (P1.9)**: Multi-node relationship modeling for complex interactions
- **Dynamic Confidence (P1.5)**: Evidence-based confidence vector calculation

### Visualization System
- **3D Botanical Trees**: Organic growth metaphor for knowledge development
- **2D Graph Networks**: Cytoscape.js-powered relationship mapping with hyperedge support
- **Interactive Analytics**: Real-time confidence and quality metrics
- **Export Capabilities**: SVG, PNG, HTML with embedded visualizations and statistical reports

### Parameter System (P1.0-P1.29) - FULLY IMPLEMENTED
Complete control system covering:
- Framework execution rules (P1.0-P1.7)
- Advanced graph operations (P1.8-P1.11)
- Metadata and citation management (P1.12-P1.18)
- Intervention and analysis tools (P1.19-P1.21)
- Dynamic topology and multi-layer networks (P1.22-P1.23)
- Causal and temporal reasoning (P1.24-P1.25)
- Statistical and information theory (P1.26-P1.27)
- Impact estimation and collaboration (P1.28-P1.29)

### Knowledge Integration (K1-K3)
- **K1**: Communication preferences (formal, academic, Vancouver citations)
- **K2**: Content requirements (high accuracy, progressive insights, multimodal)
- **K3**: User profile (dermatology researcher, immunology expertise, holistic approach)

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: shadcn/ui (40+ components), Radix UI primitives
- **Styling**: Tailwind CSS with custom botanical themes
- **Visualization**: Cytoscape.js, D3.js, ReactFlow, Plotly.js
- **Animation**: Framer Motion, Anime.js, React Spring
- **State Management**: Custom hooks with React Context patterns
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **APIs**: Gemini 2.5 Pro, Perplexity Sonar
- **Build**: Vite with React SWC, TypeScript
- **Deployment**: GitHub → Production (https://scientific-research.online/)

## Error Logging System (NEW - UNTESTED)

### External Error Logging for Claude Code Access
**Status**: Recently implemented but not verified due to build environment issues

**Key Files**:
- `src/services/ErrorLoggingService.ts` - Multi-transport error logging service
- `src/utils/debugHelper.ts` - Claude Code access interface with browser console commands
- `src/pages/api/debug/errors.ts` - API endpoints for programmatic access
- `supabase/migrations/20250127_create_error_logs.sql` - Database schema
- `CLAUDE_ERROR_ACCESS.md` - Complete usage documentation

**Claude Code Access Methods** (Once Tested):
```javascript
// Browser console commands
await healthCheck()              // Quick system status
await getErrors(24)             // Recent errors
await getCritical()             // Critical issues only
await debugComponent('ErrorBoundary') // Component analysis

// Full debug interface
claudeDebug.getFullErrorReport(48)
claudeDebug.quickHealthCheck()
claudeDebug.debugErrorSpike(6)
claudeDebug.getProductionStatus()
```

**Integration Points**:
- Enhanced ErrorBoundary with automatic logging
- API service error logging with sanitized messages
- Global error handlers for unhandled errors/promises
- Main app initialization of error logging

**Security Features**:
- API keys automatically redacted from logs
- Error messages sanitized to prevent data exposure
- Row-level security on database tables
- User data excluded unless explicitly authorized

## Development Guidelines

### Code Quality
- Maintain TypeScript strict mode compliance
- Follow existing component patterns and prop interfaces
- Use established naming conventions and file organization
- Implement proper error handling and user feedback

### ASR-GoT System Integrity
- Never modify P1.0-P1.29 parameters without understanding cascade effects
- Maintain 9-stage pipeline execution order
- Preserve graph data structure integrity
- Ensure background processing queue stability

### Performance Considerations
- Test graph visualization with large datasets
- Monitor API token usage and rate limits
- Optimize background processing tasks
- Maintain responsive UI during heavy computations

### Production Deployment
- All changes pushed to main branch deploy automatically
- **CRITICAL**: Test thoroughly before pushing (lint, build, manual testing)
- Monitor https://scientific-research.online/ after deployment
- Ensure Supabase integration remains stable

### Security Requirements
- API keys stored locally, never transmitted to servers
- Validate all user inputs before processing
- Maintain secure API credential management
- Follow data privacy best practices

## Repository Workflow

- **Remote**: https://github.com/SaptaDey/asr-nexus-explorer.git
- **Branch**: main (production)
- **Deployment**: Automatic on push to main
- **CLI Access**: Already configured for direct GitHub operations
- **Commit Style**: Descriptive messages with feature/fix prefixes

## Critical Session Memory

### Recent Critical Issue (July 28, 2025)
**Problem**: Build environment failures were ignored during error logging implementation
- WSL1/Windows fork failures preventing npm/vite operations
- Missing dependencies (tinyglobby, broken node_modules/.bin)
- Untested code (1,676+ lines) was committed to production

**Lesson Learned**: Never ignore build failures or commit untested code
**Resolution**: Switching to WSL2/Ubuntu environment for proper testing

### Repository State
- **Current Commit**: 7609e5b (error logging system - UNTESTED)
- **Previous Stable**: 4d0498b (React fixes working correctly)
- **Production Status**: Site functional, error logging needs verification

### Environment Requirements
- **Development**: WSL2/Ubuntu (not WSL1/Windows)
- **Build Verification**: Must run `npm run build` successfully before any commits
- **Testing**: All new code must compile and function before deployment

This is a production system serving researchers globally through https://scientific-research.online/. All modifications must maintain system stability, user experience, and research integrity.

**For Future Sessions**: Always verify build environment health and test code compilation before making any commits. The error logging system implementation is sound but requires proper testing in a functional WSL2/Ubuntu environment.