# Animated Growing-Tree Visualization

## Overview

The ASR-GoT framework features a sophisticated animated botanical tree visualization that represents the 9-stage research pipeline as a living, growing organism. Each stage of the reasoning process is mapped to specific botanical elements that evolve organically as the analysis progresses.

## Botanical Metaphor Mapping

| ASR-GoT Stage | Botanical Element | Visual Behavior |
|---------------|------------------|-----------------|
| **Stage 1: Initialization** | 🌰 Root Bulb | Instant placement with terracotta color; serves as the foundation |
| **Stage 2: Decomposition** | 🌱 Primary Rootlets | Radial emergence with length proportional to confidence vectors |
| **Stage 3: Hypothesis Generation** | 🌿 Main Branches | Upward growth with thickness based on hypothesis confidence |
| **Stage 4: Evidence Integration** | 🌾 Cambium Rings & Buds | Pulsing evidence nodes that expand parent branch circumference |
| **Stage 5: Pruning/Merging** | 🍂 Withered Twigs | Faded opacity for pruned nodes; smooth morphing for merged branches |
| **Stage 6: Subgraph Extraction** | 🍃 Leaf Clusters | Staggered emergence with size proportional to impact scores |
| **Stage 7: Composition** | 🌸 Blossoms | Sequential petal unfurling with slide-in text labels |
| **Stage 8: Reflection** | ✨ Pollen Particles | Golden sparkles for successes; crimson particles for violations |
| **Stage 9: Final Analysis** | 🌳 Complete Tree | Full botanical ecosystem with comprehensive metadata |

## Technology Stack

### Core Libraries
- **D3.js v7** - Hierarchical layout calculations and continuous growth morphs
- **react-spring v10** - Smooth interpolation of branch length, thickness, and color
- **Anime.js** - SVG stroke-dash animations for branch drawing and blossom morphs
- **Cytoscape.js** - Canonical graph model with WebSocket event publishing

### Animation Framework
- **Chained Animations**: 9-stage progression with carefully timed transitions
- **Spring Physics**: Natural easing with configurable tension and friction
- **Performance Monitoring**: 60 FPS target with frame-drop detection
- **Accessibility**: Full screen reader support and reduced motion compliance

## Data Binding & State Management

### Tree Data Transformation
```typescript
// GraphData → D3 Hierarchy transformation
const { hierarchyData, treeHierarchy, animatedNodes } = useTreeScene(graphData, currentStage);

// Botanical property calculation
const botanicalProps = {
  length: confidenceVector.reduce((a, b) => a + b) / confidenceVector.length * 100,
  radius: Math.max(2, confidence * 12),
  color: getDisciplinaryHue(disciplinaryTags[0]),
  opacity: metadata.pruned ? 0.2 : 1.0,
  blossom: impactScore > 0.7 ? 1 : 0
};
```

### Animation State Management
```typescript
// Stage-specific spring animations
const animations = {
  rootSpring: useSpring({ scale: stage >= 1 ? 1 : 0 }),
  branchSpring: useSpring({ pathLength: stage >= 3 ? 1 : 0 }),
  blossomSpring: useSpring({ petals: stage >= 7 ? 1 : 0 })
};
```

## Animation Timeline

### Algorithmic Progression
1. **Stage 1**: Instant root bulb placement
2. **Stage 2**: Rootlet trail animation with `easeInOutBack`
3. **Stage 3**: Branch stroke-dash drawing + react-spring thickness expansion
4. **Stage 4**: Evidence pulse with branch radius delta increase
5. **Stage 5**: Withered branch fade + smooth morph transitions
6. **Stage 6**: Staggered leaf emergence with subtle jitter
7. **Stage 7**: Blossom petal unfurling + label slide-in
8. **Stage 8**: Pollen particle system with physics-based movement
9. **Stage 9**: Complete ecosystem display with final metrics

### Performance Optimization
- **Frame Rate**: 60 FPS target with performance monitoring
- **Memory Management**: Efficient node recycling and cleanup
- **Animation Throttling**: RequestAnimationFrame-based updates
- **Lazy Loading**: Anime.js loaded only after Stage 2

## Interactive Features

### Navigation & Control
- **Hover Effects**: Metadata popovers with P1.12 schema compliance
- **Click Interactions**: Stage navigation and detailed node inspection
- **Timeline Scrubber**: Bidirectional stage progression control
- **Keyboard Navigation**: Arrow keys for accessibility

### Visual Accessibility
- **Color-blind Mode**: Texture patterns replacing color-only indicators
- **Reduced Motion**: Instant state changes with opacity transitions
- **Screen Reader**: Comprehensive aria-labels and descriptions
- **High Contrast**: Automatic theme adaptation

## Export Functionality

### SVG Export
- **Embedded Styles**: Standalone SVG with complete CSS
- **Accessibility Tags**: Title and description elements
- **Vector Format**: Scalable for presentations and publications

### HTML Report Export
- **Complete Visualization**: Embedded tree with full styling
- **Framework Documentation**: Stage explanations and methodology
- **Responsive Design**: Print-optimized layout
- **Metadata Integration**: Timestamp and attribution

## Usage Examples

### Basic Integration
```tsx
import { TreeOfReasoningVisualization } from '@/components/asr-got/TreeOfReasoningVisualization';

<TreeOfReasoningVisualization
  graphData={asrGotData}
  currentStage={currentStage}
  isProcessing={isAnalyzing}
  onStageSelect={handleStageChange}
/>
```

### Performance Testing
```tsx
import { TreePerformanceTest } from '@/components/asr-got/TreePerformanceTest';

<TreePerformanceTest
  graphData={testData}
  onMetricsUpdate={handleMetricsUpdate}
/>
```

### Custom Styling
```css
:root {
  --growth-duration: 1200ms;
  --bloom-duration: 800ms;
  --branch-hue: 120;
  --blossom-petal: 330 75% 75%;
}
```

## Performance Specifications

### Benchmarks
- **Node Capacity**: 500+ nodes with smooth animations
- **Memory Usage**: <5MB for typical research trees
- **Frame Rate**: 60 FPS maintained during transitions
- **Load Time**: <200ms for initial render

### Optimization Features
- **Adaptive Quality**: Reduced complexity for large datasets
- **Animation Culling**: Off-screen elements skip updates
- **Memory Monitoring**: Automatic cleanup of unused particles
- **Bundle Splitting**: Lazy-loaded animation libraries

## Testing Framework

### Automated Tests
- **Visual Regression**: Storybook Chromatic snapshots
- **Performance**: Jest unit tests with mock timers
- **Accessibility**: axe-core integration
- **Animation**: Keyframe validation and timing tests

### Manual Testing
- **Cross-browser**: Chrome, Firefox, Safari, Edge
- **Device Testing**: Desktop, tablet, mobile responsiveness
- **Accessibility**: Screen reader compatibility
- **Performance**: Frame rate monitoring tools

## Development Guidelines

### Code Organization
```
src/components/asr-got/
├── TreeOfReasoningVisualization.tsx  # Main entry point
├── TreeContainer.tsx                 # Core container with D3 layout
├── TreeAnimations.tsx                # React-spring animation hooks
├── BotanicalElements.tsx             # SVG element rendering
├── TreeControls.tsx                  # Timeline and export controls
└── TreePerformanceTest.tsx           # Testing utilities

src/hooks/
├── useTreeData.ts                    # Data transformation
├── useTreeAnimations.ts              # Animation state management
└── useTreePerformance.ts             # Performance monitoring

src/styles/
├── botanical-base.css                # Base styling
├── botanical-animations.css          # Animation definitions
└── botanical-themes.css              # Color themes
```

### Development Commands
```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Code linting
npm run test         # Run tests
```

## Future Enhancements

### Planned Features
- **3D Visualization**: WebGL-based three-dimensional tree rendering
- **VR Support**: Immersive research environment
- **AI Narration**: Automated explanation generation
- **Collaboration**: Multi-user real-time editing
- **Export Formats**: PDF, PNG, interactive web components

### Research Applications
- **Academic Papers**: Embedded visualizations in publications
- **Presentations**: Dynamic storytelling for conferences
- **Educational**: Interactive learning modules
- **Analysis Tools**: Research methodology visualization

---

*This visualization system represents a breakthrough in scientific reasoning representation, combining botanical metaphors with advanced web technologies to create an intuitive, beautiful, and functional interface for complex research workflows.*