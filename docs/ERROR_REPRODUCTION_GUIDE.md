# ASR-GoT Error Reproduction & Debugging Guide

## Overview

This comprehensive guide provides debugging tools, error reporting systems, and reproduction capabilities for the ASR-GoT (Automatic Scientific Research - Graph of Thoughts) framework deployed at https://scientific-research.online/.

## Table of Contents

1. [Quick Error Reproduction](#quick-error-reproduction)
2. [Debug Tools & Utilities](#debug-tools--utilities)
3. [Error Classification System](#error-classification-system)
4. [Step-by-Step Reproduction](#step-by-step-reproduction)
5. [Advanced Debugging Techniques](#advanced-debugging-techniques)
6. [Performance Debugging](#performance-debugging)
7. [API Error Debugging](#api-error-debugging)
8. [Graph Visualization Debugging](#graph-visualization-debugging)
9. [Database & Storage Debugging](#database--storage-debugging)
10. [Production Error Monitoring](#production-error-monitoring)

---

## Quick Error Reproduction

### Essential Debug Environment Setup

```bash
# 1. Enable development mode
export NODE_ENV=development
export VITE_DEBUG_MODE=true
export VITE_VERBOSE_LOGGING=true

# 2. Start with debug flags
npm run dev -- --debug --verbose

# 3. Enable browser debugging
# Open Chrome DevTools -> Console -> Settings -> Show timestamps
# Enable "Preserve log" to maintain logs across navigation
```

### Immediate Debug Information Collection

```javascript
// Add to browser console for instant debug info
window.ASR_DEBUG = {
  collectSystemInfo: () => ({
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    memory: performance.memory || 'N/A',
    connection: navigator.connection || 'N/A',
    location: window.location.href,
    localStorage: Object.keys(localStorage).length,
    sessionStorage: Object.keys(sessionStorage).length
  }),
  
  collectASRGoTState: () => {
    const state = JSON.parse(localStorage.getItem('asr-got-state') || '{}');
    return {
      currentStage: state.currentStage || 'unknown',
      graphNodes: state.graphData?.nodes?.length || 0,
      graphEdges: state.graphData?.edges?.length || 0,
      apiCredentials: !!state.credentials,
      processingMode: state.processingMode || 'unknown',
      lastError: state.lastError || null
    };
  },
  
  exportDebugBundle: () => {
    const bundle = {
      system: window.ASR_DEBUG.collectSystemInfo(),
      asrGot: window.ASR_DEBUG.collectASRGoTState(),
      console: console.history || [],
      errors: window.errorHistory || [],
      timestamp: Date.now()
    };
    
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asr-got-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    return bundle;
  }
};

// Execute immediately
console.log('🔍 ASR-GoT Debug Info:', window.ASR_DEBUG.collectSystemInfo());
console.log('🧠 ASR-GoT State:', window.ASR_DEBUG.collectASRGoTState());
```

---

## Debug Tools & Utilities

### 1. Built-in Debug Components

The framework includes several debug components accessible through the UI:

#### Debug Panel (`src/components/asr-got/DebugPanel.tsx`)
- **Location**: Available in Developer Mode (top-right gear icon)
- **Features**:
  - Real-time state monitoring
  - API call logging
  - Performance metrics
  - Memory usage tracking
  - Stage execution timeline

#### Debug Button (`src/components/asr-got/DebugButton.tsx`)
- **Location**: Available in any ASR-GoT interface
- **Features**:
  - Quick state export
  - Error log download
  - Performance snapshot
  - Memory cleanup

#### Debug Error Export (`src/components/asr-got/DebugErrorExport.tsx`)
- **Location**: Triggered automatically on errors
- **Features**:
  - Automatic error capture
  - Stack trace preservation
  - State snapshot at error time
  - Reproduction instructions

### 2. Console Debug Commands

Access these through the browser console on any ASR-GoT page:

```javascript
// Enable verbose logging
window.debugASRGoT = true;

// Show all registered hooks
console.table(Object.keys(window.ASRHooks || {}));

// Display current graph state
window.showGraph();

// Export current session
window.exportSession();

// Clear all storage
window.clearASRGoTStorage();

// Force garbage collection (Chrome only)
if (window.gc) window.gc();

// Show performance metrics
console.table(performance.getEntriesByType('navigation'));
```

### 3. URL Debug Parameters

Add these parameters to any ASR-GoT URL for debugging:

```
https://scientific-research.online/?debug=true&verbose=true&stage=3&mock=true
```

Parameters:
- `debug=true` - Enable debug mode
- `verbose=true` - Enable verbose logging
- `stage=N` - Start at specific stage
- `mock=true` - Use mock data
- `skipAuth=true` - Skip authentication (dev only)
- `slowMotion=true` - Slow down animations
- `showBounds=true` - Show component boundaries

---

## Error Classification System

### Level 1: Critical System Errors

**Characteristics**: Complete system failure, user cannot proceed
**Examples**: 
- Database connection failures
- API authentication failures
- Memory exhaustion
- Infinite loops

**Debug Strategy**:
```javascript
// Check system health
const healthCheck = {
  database: await fetch('/api/health/database').then(r => r.ok),
  apis: await fetch('/api/health/apis').then(r => r.ok),
  memory: performance.memory?.usedJSHeapSize < 100000000,
  storage: localStorage.getItem('test') !== null
};

console.log('🏥 System Health:', healthCheck);
```

### Level 2: Functional Errors

**Characteristics**: Specific features broken, workarounds possible
**Examples**:
- Stage execution failures
- Graph rendering issues
- Export functionality problems
- API rate limiting

**Debug Strategy**:
```javascript
// Test specific functionality
const functionalTests = {
  stageExecution: () => {
    try {
      // Test stage execution
      return window.ASRGoT?.executeStage1 ? 'available' : 'missing';
    } catch (e) {
      return e.message;
    }
  },
  
  graphRendering: () => {
    const cyto = document.querySelector('[data-cy="cytoscape-container"]');
    return cyto ? 'rendered' : 'missing';
  },
  
  apiConnectivity: async () => {
    try {
      const response = await fetch('/api/test', { method: 'HEAD' });
      return response.ok ? 'connected' : 'failed';
    } catch (e) {
      return 'error: ' + e.message;
    }
  }
};

// Run all tests
Object.entries(functionalTests).forEach(async ([name, test]) => {
  const result = await test();
  console.log(`🧪 ${name}:`, result);
});
```

### Level 3: UI/UX Issues

**Characteristics**: Interface problems, poor user experience
**Examples**:
- Layout rendering issues
- Responsive design problems
- Animation glitches
- Accessibility issues

**Debug Strategy**:
```javascript
// UI Debug Utilities
const uiDebug = {
  checkResponsive: () => {
    const breakpoints = [320, 768, 1024, 1440, 1920];
    breakpoints.forEach(width => {
      console.log(`📱 ${width}px:`, window.matchMedia(`(min-width: ${width}px)`).matches);
    });
  },
  
  highlightComponents: () => {
    document.querySelectorAll('[class*="component"]').forEach(el => {
      el.style.outline = '2px solid red';
    });
  },
  
  checkAccessibility: () => {
    const issues = [];
    if (!document.querySelector('[alt]')) issues.push('Missing alt tags');
    if (!document.querySelector('[aria-label]')) issues.push('Missing aria-labels');
    if (document.querySelectorAll('button:not([type])').length > 0) issues.push('Buttons without type');
    return issues;
  }
};
```

### Level 4: Performance Issues

**Characteristics**: Slow performance, memory leaks, inefficient operations
**Examples**:
- Slow API responses
- Memory leaks
- Large bundle sizes
- Inefficient re-renders

**Debug Strategy**:
```javascript
// Performance Monitoring
const performanceDebug = {
  memoryUsage: () => {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB',
        total: Math.round(performance.memory.totalJSHeapSize / 1048576) + ' MB',
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + ' MB'
      };
    }
    return 'Memory API not available';
  },
  
  startPerformanceProfile: () => {
    console.profile('ASR-GoT Performance');
    window.performanceStart = performance.now();
  },
  
  endPerformanceProfile: () => {
    console.profileEnd('ASR-GoT Performance');
    const duration = performance.now() - window.performanceStart;
    console.log(`⏱️ Profile duration: ${duration.toFixed(2)}ms`);
  }
};
```

---

## Step-by-Step Reproduction

### Standard Error Reproduction Process

#### Step 1: Environment Preparation

```bash
# Clean environment setup
rm -rf node_modules package-lock.json
npm install
npm run build:dev

# Verify installation
npm run lint
npm run test:unit
```

#### Step 2: State Replication

```javascript
// Replicate user state
const reproductionState = {
  // Paste user's state here from error report
  userAgent: "...",
  viewport: { width: 1920, height: 1080 },
  localStorage: {
    'asr-got-state': '...',
    'api-credentials': '...'
  },
  sessionStorage: {},
  route: '/asr-got-interface',
  timestamp: '2024-07-24T12:00:00Z'
};

// Apply state
Object.entries(reproductionState.localStorage).forEach(([key, value]) => {
  localStorage.setItem(key, value);
});

Object.entries(reproductionState.sessionStorage).forEach(([key, value]) => {
  sessionStorage.setItem(key, value);
});

// Navigate to route
window.location.href = reproductionState.route;
```

#### Step 3: Action Sequence Replication

```javascript
// Define exact user action sequence
const actionSequence = [
  { type: 'click', selector: '[data-testid="start-research"]', delay: 1000 },
  { type: 'input', selector: 'input[placeholder="Enter research question"]', value: "Test query", delay: 500 },
  { type: 'click', selector: '[data-testid="execute-stage-1"]', delay: 2000 },
  { type: 'wait', duration: 5000 },
  { type: 'click', selector: '[data-testid="execute-stage-2"]', delay: 2000 }
];

// Execute sequence
async function replayActions(sequence) {
  for (const action of sequence) {
    console.log(`🎬 Executing: ${action.type}`, action);
    
    switch (action.type) {
      case 'click':
        const clickEl = document.querySelector(action.selector);
        if (clickEl) {
          clickEl.click();
        } else {
          console.error(`Element not found: ${action.selector}`);
        }
        break;
        
      case 'input':
        const inputEl = document.querySelector(action.selector);
        if (inputEl) {
          inputEl.value = action.value;
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        }
        break;
        
      case 'wait':
        await new Promise(resolve => setTimeout(resolve, action.duration));
        break;
    }
    
    if (action.delay) {
      await new Promise(resolve => setTimeout(resolve, action.delay));
    }
  }
}

// Start reproduction
replayActions(actionSequence);
```

#### Step 4: Error Capture & Analysis

```javascript
// Enhanced error capture
window.addEventListener('error', (event) => {
  const errorReport = {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: {
      name: event.error?.name,
      message: event.error?.message,
      stack: event.error?.stack
    },
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    state: window.ASR_DEBUG?.collectASRGoTState()
  };
  
  console.error('🚨 Error Captured:', errorReport);
  
  // Auto-export error report
  const blob = new Blob([JSON.stringify(errorReport, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `error-report-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Capture unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled Promise Rejection:', {
    reason: event.reason,
    promise: event.promise,
    timestamp: new Date().toISOString()
  });
});
```

---

## Advanced Debugging Techniques

### 1. React Component Debugging

```javascript
// React DevTools helpers
const reactDebug = {
  findComponent: (name) => {
    const elements = document.querySelectorAll('*');
    for (let el of elements) {
      const fiber = el._reactInternalFiber || el._reactInternalInstance;
      if (fiber && fiber.type && fiber.type.name === name) {
        return el;
      }
    }
    return null;
  },
  
  getComponentProps: (element) => {
    const fiber = element._reactInternalFiber || element._reactInternalInstance;
    return fiber?.memoizedProps || fiber?.pendingProps || {};
  },
  
  getComponentState: (element) => {
    const fiber = element._reactInternalFiber || element._reactInternalInstance;
    return fiber?.memoizedState || {};
  }
};

// Usage
const researchInterface = reactDebug.findComponent('ResearchInterface');
if (researchInterface) {
  console.log('Props:', reactDebug.getComponentProps(researchInterface));
  console.log('State:', reactDebug.getComponentState(researchInterface));
}
```

### 2. Hook Debugging

```javascript
// Debug React hooks
const hookDebug = {
  useState: (initialValue, name = 'unknown') => {
    const [value, setValue] = React.useState(initialValue);
    
    const debugSetValue = (newValue) => {
      console.log(`🪝 ${name} useState:`, { from: value, to: newValue });
      setValue(newValue);
    };
    
    return [value, debugSetValue];
  },
  
  useEffect: (effect, deps, name = 'unknown') => {
    return React.useEffect(() => {
      console.log(`🪝 ${name} useEffect triggered:`, deps);
      return effect();
    }, deps);
  }
};
```

### 3. Graph State Debugging

```javascript
// Comprehensive graph debugging
const graphDebug = {
  validateGraph: (graphData) => {
    const issues = [];
    
    if (!graphData.nodes || !Array.isArray(graphData.nodes)) {
      issues.push('Invalid nodes array');
    }
    
    if (!graphData.edges || !Array.isArray(graphData.edges)) {
      issues.push('Invalid edges array');
    }
    
    // Check for orphaned edges
    const nodeIds = new Set(graphData.nodes?.map(n => n.id) || []);
    const orphanedEdges = (graphData.edges || []).filter(e => 
      !nodeIds.has(e.source) || !nodeIds.has(e.target)
    );
    
    if (orphanedEdges.length > 0) {
      issues.push(`${orphanedEdges.length} orphaned edges found`);
    }
    
    // Check for duplicate node IDs
    const duplicates = graphData.nodes?.reduce((acc, node, index) => {
      if (graphData.nodes.findIndex(n => n.id === node.id) !== index) {
        acc.push(node.id);
      }
      return acc;
    }, []) || [];
    
    if (duplicates.length > 0) {
      issues.push(`Duplicate node IDs: ${duplicates.join(', ')}`);
    }
    
    return { valid: issues.length === 0, issues };
  },
  
  exportGraphSVG: (graphData) => {
    // Export graph as SVG for visual debugging
    const svg = document.querySelector('#cytoscape-container svg');
    if (svg) {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `graph-debug-${Date.now()}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }
};
```

---

## Performance Debugging

### Memory Leak Detection

```javascript
// Memory leak detector
const memoryDebug = {
  startTracking: () => {
    window.memoryTracker = {
      startTime: Date.now(),
      startMemory: performance.memory?.usedJSHeapSize || 0,
      snapshots: []
    };
    
    window.memoryTracker.interval = setInterval(() => {
      if (performance.memory) {
        window.memoryTracker.snapshots.push({
          timestamp: Date.now(),
          memory: performance.memory.usedJSHeapSize,
          nodes: document.querySelectorAll('*').length,
          listeners: window.eventListenerCount || 0
        });
      }
    }, 1000);
  },
  
  stopTracking: () => {
    if (window.memoryTracker?.interval) {
      clearInterval(window.memoryTracker.interval);
      
      const report = {
        duration: Date.now() - window.memoryTracker.startTime,
        memoryGrowth: (performance.memory?.usedJSHeapSize || 0) - window.memoryTracker.startMemory,
        snapshots: window.memoryTracker.snapshots
      };
      
      console.log('📊 Memory Tracking Report:', report);
      return report;
    }
  },
  
  forceGC: () => {
    if (window.gc) {
      const before = performance.memory?.usedJSHeapSize || 0;
      window.gc();
      const after = performance.memory?.usedJSHeapSize || 0;
      console.log(`🗑️ Garbage Collection: ${Math.round((before - after) / 1048576)}MB freed`);
    } else {
      console.log('⚠️ Garbage collection not available. Run Chrome with --enable-precise-memory-info');
    }
  }
};

// Usage
memoryDebug.startTracking();
// ... perform actions
setTimeout(() => {
  const report = memoryDebug.stopTracking();
  // Analyze report for memory leaks
}, 30000);
```

### Performance Profiling

```javascript
// Performance profiler
const performanceProfiler = {
  startProfile: (name = 'ASR-GoT') => {
    console.time(name);
    console.profile(name);
    
    window.performanceMarkers = {
      start: performance.now(),
      marks: []
    };
  },
  
  mark: (label) => {
    const now = performance.now();
    console.timeStamp(label);
    
    if (window.performanceMarkers) {
      window.performanceMarkers.marks.push({
        label,
        timestamp: now,
        duration: now - window.performanceMarkers.start
      });
    }
  },
  
  endProfile: (name = 'ASR-GoT') => {
    console.timeEnd(name);
    console.profileEnd(name);
    
    if (window.performanceMarkers) {
      console.table(window.performanceMarkers.marks);
    }
  }
};

// Usage
performanceProfiler.startProfile('Stage Execution');
performanceProfiler.mark('Stage 1 Start');
// ... execute stage 1
performanceProfiler.mark('Stage 1 Complete');
performanceProfiler.endProfile('Stage Execution');
```

---

## API Error Debugging

### API Call Monitoring

```javascript
// Intercept and monitor all API calls
const apiDebug = {
  interceptFetch: () => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const [url, options] = args;
      const startTime = performance.now();
      
      console.log(`🌐 API Call Started: ${url}`, {
        method: options?.method || 'GET',
        headers: options?.headers ? Object.keys(options.headers) : [],
        body: options?.body ? `${options.body.length} chars` : 'none'
      });
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        
        console.log(`✅ API Call Success: ${url}`, {
          status: response.status,
          statusText: response.statusText,
          duration: `${Math.round(endTime - startTime)}ms`,
          size: response.headers.get('content-length') || 'unknown'
        });
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        
        console.error(`❌ API Call Failed: ${url}`, {
          error: error.message,
          duration: `${Math.round(endTime - startTime)}ms`
        });
        
        throw error;
      }
    };
  },
  
  restoreFetch: () => {
    if (window.originalFetch) {
      window.fetch = window.originalFetch;
    }
  }
};

// Enable API monitoring
apiDebug.interceptFetch();
```

### Gemini API Debugging

```javascript
// Gemini-specific debugging
const geminiDebug = {
  validateApiKey: (key) => {
    const isValid = /^AIza[A-Za-z0-9_-]{35}$/.test(key);
    console.log(`🔑 Gemini API Key Valid: ${isValid}`);
    return isValid;
  },
  
  testConnection: async (apiKey) => {
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
        headers: { 'x-goog-api-key': apiKey }
      });
      
      console.log(`🔗 Gemini Connection Test: ${response.ok ? 'SUCCESS' : 'FAILED'}`, {
        status: response.status,
        statusText: response.statusText
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Available models:', data.models?.map(m => m.name) || []);
      }
      
      return response.ok;
    } catch (error) {
      console.error('🔗 Gemini Connection Error:', error);
      return false;
    }
  },
  
  analyzeTokenUsage: (prompt, maxTokens = 8000) => {
    const estimatedInputTokens = Math.ceil(prompt.length / 4);
    const estimatedCost = (estimatedInputTokens * 0.00000125) + (maxTokens * 0.00000375);
    
    console.log('💰 Token Analysis:', {
      inputLength: prompt.length,
      estimatedInputTokens,
      maxOutputTokens: maxTokens,
      estimatedCostUSD: `$${estimatedCost.toFixed(6)}`,
      recommendation: estimatedInputTokens > 30000 ? 'Consider chunking' : 'Size OK'
    });
    
    return { estimatedInputTokens, estimatedCost };
  }
};
```

---

## Graph Visualization Debugging

### Cytoscape Debugging

```javascript
// Cytoscape-specific debugging tools
const cytoscapeDebug = {
  inspect: () => {
    const container = document.querySelector('[data-cy="cytoscape-container"]');
    if (!container) {
      console.error('❌ Cytoscape container not found');
      return null;
    }
    
    const cy = container._cy || window.cy;
    if (!cy) {
      console.error('❌ Cytoscape instance not found');
      return null;
    }
    
    const info = {
      nodes: cy.nodes().length,
      edges: cy.edges().length,
      layout: cy.layout()?.name || 'unknown',
      viewport: cy.viewport(),
      container: {
        width: container.offsetWidth,
        height: container.offsetHeight
      }
    };
    
    console.log('🕸️ Cytoscape Info:', info);
    return info;
  },
  
  validateElements: (elements) => {
    const issues = [];
    
    elements.forEach((el, index) => {
      if (!el.data || !el.data.id) {
        issues.push(`Element ${index}: Missing ID`);
      }
      
      if (el.group === 'edges') {
        if (!el.data.source || !el.data.target) {
          issues.push(`Edge ${el.data.id}: Missing source or target`);
        }
      }
      
      if (!el.position && el.group === 'nodes') {
        issues.push(`Node ${el.data.id}: Missing position`);
      }
    });
    
    console.log(issues.length > 0 ? '❌ Element Issues:' : '✅ Elements Valid:', issues);
    return issues;
  },
  
  exportState: () => {
    const container = document.querySelector('[data-cy="cytoscape-container"]');
    const cy = container?._cy || window.cy;
    
    if (cy) {
      const state = {
        elements: cy.elements().jsons(),
        viewport: cy.viewport(),
        style: cy.style().json(),
        layout: cy.layout()
      };
      
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cytoscape-state-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      return state;
    }
  }
};
```

---

## Database & Storage Debugging

### Supabase Debugging

```javascript
// Supabase connection and data debugging
const supabaseDebug = {
  testConnection: async () => {
    try {
      const { data, error } = await window.supabase?.from('asr_got_sessions').select('count');
      
      if (error) {
        console.error('❌ Supabase Connection Error:', error);
        return false;
      }
      
      console.log('✅ Supabase Connected Successfully');
      return true;
    } catch (error) {
      console.error('❌ Supabase Test Failed:', error);
      return false;
    }
  },
  
  checkTables: async () => {
    const tables = [
      'asr_got_sessions',
      'research_queries', 
      'graph_snapshots',
      'export_history',
      'query_history'
    ];
    
    const results = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await window.supabase?.from(table).select('count');
        results[table] = error ? `Error: ${error.message}` : 'OK';
      } catch (error) {
        results[table] = `Exception: ${error.message}`;
      }
    }
    
    console.table(results);
    return results;
  },
  
  checkRLS: async () => {
    try {
      // Test RLS policies
      const { data, error } = await window.supabase?.from('asr_got_sessions').select('*').limit(1);
      
      console.log('🔒 RLS Check:', {
        error: error?.message || 'None',
        rowsReturned: data?.length || 0,
        status: error ? 'RLS Active' : 'Data Accessible'
      });
      
      return !error;
    } catch (error) {
      console.error('🔒 RLS Check Failed:', error);
      return false;
    }
  }
};
```

### Local Storage Debugging

```javascript
// Local storage debugging tools
const storageDebug = {
  inspect: () => {
    const data = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      
      try {
        data[key] = {
          type: 'JSON',
          size: value.length,
          parsed: JSON.parse(value)
        };
      } catch {
        data[key] = {
          type: 'String',
          size: value.length,
          value: value.substring(0, 100)
        };
      }
    }
    
    console.table(data);
    return data;
  },
  
  cleanup: () => {
    const keys = Object.keys(localStorage);
    const asrKeys = keys.filter(key => key.startsWith('asr-got-'));
    
    console.log(`🧹 Found ${asrKeys.length} ASR-GoT storage keys:`, asrKeys);
    
    if (confirm(`Delete ${asrKeys.length} ASR-GoT storage items?`)) {
      asrKeys.forEach(key => localStorage.removeItem(key));
      console.log('✅ Storage cleaned');
      window.location.reload();
    }
  },
  
  export: () => {
    const data = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      data[key] = localStorage.getItem(key);
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `localStorage-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
};
```

---

## Production Error Monitoring

### Error Reporting Pipeline

```javascript
// Production error monitoring setup
const productionErrorMonitor = {
  init: () => {
    // Global error handler
    window.addEventListener('error', (event) => {
      productionErrorMonitor.reportError({
        type: 'javascript_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
    });
    
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      productionErrorMonitor.reportError({
        type: 'unhandled_promise_rejection',
        reason: event.reason,
        promise: event.promise.toString(),
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    });
    
    // API errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (!response.ok) {
          productionErrorMonitor.reportError({
            type: 'api_error',
            url: args[0],
            status: response.status,
            statusText: response.statusText,
            timestamp: new Date().toISOString()
          });
        }
        
        return response;
      } catch (error) {
        productionErrorMonitor.reportError({
          type: 'network_error',
          url: args[0],
          error: error.message,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    };
  },
  
  reportError: async (errorData) => {
    try {
      // In production, this would send to a monitoring service
      console.error('🚨 Production Error:', errorData);
      
      // Store locally for debugging
      const errors = JSON.parse(localStorage.getItem('production_errors') || '[]');
      errors.push(errorData);
      
      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }
      
      localStorage.setItem('production_errors', JSON.stringify(errors));
      
      // Optional: Send to monitoring service
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData)
      // });
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  },
  
  getErrorHistory: () => {
    const errors = JSON.parse(localStorage.getItem('production_errors') || '[]');
    console.table(errors);
    return errors;
  },
  
  clearErrorHistory: () => {
    localStorage.removeItem('production_errors');
    console.log('✅ Error history cleared');
  }
};

// Initialize in production
if (window.location.hostname === 'scientific-research.online') {
  productionErrorMonitor.init();
}
```

---

## Common Issues & Solutions

### Issue 1: "Maximum call stack size exceeded"

**Symptoms**: Infinite recursion error, browser becomes unresponsive

**Debug Steps**:
1. Check for circular dependencies in graph data
2. Look for infinite useEffect loops
3. Verify proper cleanup in useEffect hooks

**Solution**:
```javascript
// Check for circular references
const hasCircularReference = (obj, seen = new WeakSet()) => {
  if (obj !== null && typeof obj === 'object') {
    if (seen.has(obj)) return true;
    seen.add(obj);
    
    for (let key in obj) {
      if (hasCircularReference(obj[key], seen)) return true;
    }
  }
  return false;
};

// Usage
if (hasCircularReference(graphData)) {
  console.error('❌ Circular reference detected in graph data');
}
```

### Issue 2: "ChunkLoadError: Loading chunk failed"

**Symptoms**: Module loading failures, blank pages

**Debug Steps**:
1. Check network connectivity
2. Verify Vite build configuration
3. Check for asset path issues

**Solution**:
```javascript
// Dynamic import with retry
const importWithRetry = async (importFn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await importFn();
    } catch (error) {
      if (i === retries - 1) throw error;
      console.warn(`Import failed, retrying... (${i + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, 1000 + i * 1000));
    }
  }
};

// Usage
const Component = await importWithRetry(() => import('./Component'));
```

### Issue 3: "QuotaExceededError: LocalStorage quota exceeded"

**Symptoms**: Cannot save state, localStorage errors

**Debug Steps**:
1. Check localStorage usage with `storageDebug.inspect()`
2. Clear old data
3. Implement storage compression

**Solution**:
```javascript
// Storage quota management
const storageManager = {
  getQuotaUsage: () => {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length;
      }
    }
    return { used: total, quota: 5 * 1024 * 1024 }; // 5MB typical quota
  },
  
  cleanup: () => {
    const usage = storageManager.getQuotaUsage();
    if (usage.used > usage.quota * 0.8) {
      // Remove old entries
      const keys = Object.keys(localStorage);
      keys.sort((a, b) => {
        const aTime = localStorage.getItem(a + '_timestamp') || '0';
        const bTime = localStorage.getItem(b + '_timestamp') || '0';
        return parseInt(aTime) - parseInt(bTime);
      });
      
      // Remove oldest 20%
      const toRemove = Math.floor(keys.length * 0.2);
      keys.slice(0, toRemove).forEach(key => localStorage.removeItem(key));
    }
  }
};
```

---

## Automated Error Reproduction Scripts

### Complete Reproduction Script

Create a file `debug/reproduce-error.js`:

```javascript
// Automated error reproduction script
class ErrorReproducer {
  constructor(errorReport) {
    this.errorReport = errorReport;
    this.steps = [];
    this.currentStep = 0;
  }
  
  async reproduce() {
    console.log('🎬 Starting error reproduction...');
    
    // 1. Setup environment
    await this.setupEnvironment();
    
    // 2. Restore state
    await this.restoreState();
    
    // 3. Execute steps
    await this.executeSteps();
    
    // 4. Monitor for error
    await this.monitorForError();
  }
  
  async setupEnvironment() {
    console.log('🔧 Setting up environment...');
    
    // Clear existing state
    localStorage.clear();
    sessionStorage.clear();
    
    // Set debug flags
    localStorage.setItem('debug_mode', 'true');
    localStorage.setItem('verbose_logging', 'true');
  }
  
  async restoreState() {
    console.log('💾 Restoring user state...');
    
    if (this.errorReport.state) {
      Object.entries(this.errorReport.state.localStorage || {}).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
      
      Object.entries(this.errorReport.state.sessionStorage || {}).forEach(([key, value]) => {
        sessionStorage.setItem(key, value);
      });
    }
  }
  
  async executeSteps() {
    console.log('👆 Executing user actions...');
    
    for (const step of this.errorReport.steps || []) {
      console.log(`Step ${this.currentStep + 1}: ${step.type}`);
      
      switch (step.type) {
        case 'navigate':
          window.location.href = step.url;
          await this.wait(step.delay || 1000);
          break;
          
        case 'click':
          await this.clickElement(step.selector);
          await this.wait(step.delay || 500);
          break;
          
        case 'input':
          await this.inputText(step.selector, step.value);
          await this.wait(step.delay || 300);
          break;
          
        case 'wait':
          await this.wait(step.duration);
          break;
      }
      
      this.currentStep++;
    }
  }
  
  async monitorForError() {
    console.log('👀 Monitoring for error...');
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.log('⏰ No error reproduced within timeout');
        resolve(false);
      }, 30000); // 30 second timeout
      
      const errorHandler = (event) => {
        if (event.message.includes(this.errorReport.message) || 
            event.error?.message?.includes(this.errorReport.message)) {
          console.log('✅ Error successfully reproduced!');
          clearTimeout(timeout);
          window.removeEventListener('error', errorHandler);
          resolve(true);
        }
      };
      
      window.addEventListener('error', errorHandler);
    });
  }
  
  async clickElement(selector) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        element.click();
        resolve();
      } else {
        console.warn(`Element not found: ${selector}`);
        reject(new Error(`Element not found: ${selector}`));
      }
    });
  }
  
  async inputText(selector, text) {
    const element = document.querySelector(selector);
    if (element) {
      element.value = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      console.warn(`Input element not found: ${selector}`);
    }
  }
  
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage
const errorReport = {
  message: "Cannot read property 'nodes' of undefined",
  state: { /* user state */ },
  steps: [
    { type: 'navigate', url: '/asr-got-interface' },
    { type: 'click', selector: '[data-testid="start-research"]', delay: 1000 },
    { type: 'input', selector: 'input[placeholder="Enter research question"]', value: 'Test query' },
    { type: 'click', selector: '[data-testid="execute-stage-1"]', delay: 2000 }
  ]
};

const reproducer = new ErrorReproducer(errorReport);
reproducer.reproduce().then(success => {
  console.log(success ? '✅ Reproduction successful' : '❌ Reproduction failed');
});
```

---

## Integration with Development Workflow

### VS Code Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug ASR-GoT",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/vite",
      "args": ["dev", "--debug", "--verbose"],
      "env": {
        "NODE_ENV": "development",
        "VITE_DEBUG_MODE": "true",
        "VITE_VERBOSE_LOGGING": "true"
      },
      "console": "integratedTerminal",
      "sourceMaps": true,
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache", "--verbose"],
      "env": {
        "NODE_ENV": "test"
      },
      "console": "integratedTerminal",
      "sourceMaps": true
    }
  ]
}
```

### Package.json Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "debug": "vite dev --mode development --debug",
    "debug:verbose": "VITE_DEBUG_MODE=true VITE_VERBOSE_LOGGING=true npm run debug",
    "debug:memory": "node --expose-gc --inspect node_modules/.bin/vite dev",
    "debug:build": "vite build --mode development",
    "debug:test": "jest --runInBand --verbose --detectOpenHandles",
    "debug:e2e": "playwright test --debug",
    "debug:bundle": "vite-bundle-analyzer dist",
    "debug:lighthouse": "lighthouse http://localhost:5173 --view"
  }
}
```

---

This comprehensive guide provides developers with all the tools and techniques needed to effectively debug, reproduce, and resolve errors in the ASR-GoT framework. The combination of automated tools, manual debugging techniques, and systematic approaches ensures that any issue can be thoroughly investigated and resolved.