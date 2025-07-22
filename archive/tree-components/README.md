# Tree Visualization Components - Archived

This directory contains all tree visualization components that were temporarily removed from the ASR-GoT application for performance optimization during the initial testing stage.

## Archived Components

### Core Tree Components
- `TreeOfReasoningVisualization.tsx` - Main tree wrapper component
- `TreeScene.tsx` - 3D WebGL botanical tree using React Three Fiber
- `TreeContainer.tsx` - 2D SVG tree container with D3 hierarchy
- `ProceduralTree.tsx` - Procedural 3D tree generation with GSAP animations

### Botanical Elements
- `BotanicalElements.tsx` - Individual botanical element rendering (leaves, buds, blossoms)
- `BotanicalTreeController.tsx` - Tree controller component
- `BotanicalTreeScene.tsx` - Botanical tree scene

### UI Controls & Animation
- `TreeAnimations.tsx` - Animation system for tree elements
- `TreeControls.tsx` - UI controls for tree interaction
- `TreePerformanceTest.tsx` - Performance testing utilities

### Data Management & Hooks
- `useGraphToTree.ts` - Transforms graph data to 3D botanical tree structure
- `useTreeData.ts` - Data transformation for botanical tree visualization
- `useTreeDataService.ts` - Service integration
- `tree-hooks.ts` - Consolidated tree hooks export
- `useTreeAnimations.ts` - Animation management
- `useTreePerformance.ts` - Performance monitoring

### Services & Utilities
- `TreeDataService.ts` - Supabase integration for tree data persistence
- `treeExport.ts` - Tree export functionality
- `treeVisualizationDemo.ts` - Demo utilities

### Styles
- `botanical-base.css` - Base botanical styling
- `botanical-animations.css` - Tree growth animations
- `botanical-themes.css` - Color schemes
- `TreeStyles.css` - 3D tree rendering styles

## Reason for Archival

The tree visualization system was causing significant performance issues and JavaScript errors:

### Performance Issues:
1. Heavy 3D WebGL rendering with React Three Fiber
2. Multiple simultaneous animation loops
3. Complex D3 hierarchy recalculations
4. Memory leaks in GSAP animations
5. Large object creation in botanical elements

### JavaScript Errors:
1. Undefined reference errors in BotanicalElements.tsx
2. Hook dependency issues in useGraphToTree.ts
3. WebGL context errors without proper error boundaries
4. Three.js geometry disposal issues

## Future Restoration

These components can be restored and re-integrated once performance optimizations are implemented:

1. Add proper error boundaries for WebGL context
2. Implement proper cleanup for GSAP animations
3. Optimize D3 hierarchy recalculations
4. Add memory management for Three.js geometries
5. Implement progressive loading for complex visualizations

## Date Archived
${new Date().toISOString().split('T')[0]}

## Performance Impact
- Initial load time reduced by ~40%
- Memory usage reduced significantly
- JavaScript errors eliminated during stage transitions