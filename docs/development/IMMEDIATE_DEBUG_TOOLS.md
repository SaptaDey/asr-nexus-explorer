# 🛠️ IMMEDIATE DEBUG TOOLS - USE RIGHT NOW

## Browser Console Debug Commands

**Copy and paste these commands into your browser console (F12) on https://scientific-research.online/ to debug immediately:**

### 1. Check Current State
```javascript
// Check if React app is loaded
console.log('App loaded:', !!window.React || !!document.querySelector('[data-reactroot]'));

// Check current state
window.debugASRGoT = {
  getState: () => {
    const root = document.getElementById('root');
    const reactInstance = root?._reactInternalInstance || root?._reactInternalFiber;
    return {
      hasRoot: !!root,
      hasReactContent: root?.children?.length > 0,
      innerHTML: root?.innerHTML?.substring(0, 200) + '...',
      reactInstance: !!reactInstance
    };
  },
  
  exportErrorInfo: () => {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      localStorage: {
        hasApiKeys: !!localStorage.getItem('asr-got-api-credentials'),
        hasSettings: !!localStorage.getItem('asr-got-settings')
      },
      errors: window.jsErrors || [],
      consoleErrors: []
    };
    
    // Try to get React state if available
    try {
      const reactRoot = document.getElementById('root');
      if (reactRoot && reactRoot._reactInternalInstance) {
        errorInfo.reactState = 'React instance found';
      }
    } catch (e) {
      errorInfo.reactError = e.message;
    }
    
    console.log('🔍 Debug Info:', errorInfo);
    
    // Download as file
    const blob = new Blob([JSON.stringify(errorInfo, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asr-got-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    return errorInfo;
  }
};

// Log current state
console.log('🔍 Current State:', window.debugASRGoT.getState());
```

### 2. Track JavaScript Errors
```javascript
// Capture all errors
window.jsErrors = [];
window.onerror = function(msg, url, line, col, error) {
  const errorInfo = {
    message: msg,
    source: url,
    line: line,
    column: col,
    error: error?.toString(),
    stack: error?.stack,
    timestamp: new Date().toISOString()
  };
  window.jsErrors.push(errorInfo);
  
  // Show error visually
  const errorDiv = document.getElementById('debug-errors') || (() => {
    const div = document.createElement('div');
    div.id = 'debug-errors';
    div.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; background: red; color: white; padding: 10px; z-index: 999999; font-family: monospace;';
    document.body.prepend(div);
    return div;
  })();
  
  errorDiv.innerHTML = `<strong>JS Error:</strong> ${msg} at ${url}:${line}:${col}`;
  
  console.error('🚨 JavaScript Error:', errorInfo);
  return false;
};

console.log('✅ Error tracking enabled');
```

### 3. Check for Debug Button
```javascript
// Check if debug button exists
const debugButton = Array.from(document.querySelectorAll('button')).find(btn => 
  btn.textContent.includes('Debug') || btn.textContent.includes('Export')
);

console.log('🔍 Debug button found:', !!debugButton);
if (debugButton) {
  console.log('Debug button text:', debugButton.textContent);
  console.log('Debug button location:', debugButton.closest('[class*="tab"]')?.textContent || 'Unknown tab');
}

// List all buttons
const allButtons = Array.from(document.querySelectorAll('button')).map(btn => ({
  text: btn.textContent?.trim(),
  visible: btn.offsetWidth > 0 && btn.offsetHeight > 0,
  className: btn.className
}));

console.log('🔍 All buttons:', allButtons);
```

### 4. Force Refresh and Check
```javascript
// Force hard refresh and check
console.log('🔄 Current bundle:', document.querySelector('script[src*="index-"]')?.src);
window.location.reload(true);
```

### 5. Manual Debug Export
```javascript
// Manual debug export (works without debug button)
function manualDebugExport() {
  const debugData = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    bundleUrl: document.querySelector('script[src*="index-"]')?.src,
    hasReactRoot: !!document.getElementById('root'),
    rootContent: document.getElementById('root')?.innerHTML?.substring(0, 500),
    localStorage: Object.keys(localStorage).reduce((acc, key) => {
      acc[key] = localStorage.getItem(key)?.substring(0, 100) + '...';
      return acc;
    }, {}),
    errors: window.jsErrors || [],
    stage2Error: 'Stage 2 failed: Invalid input: must be a non-empty string'
  };
  
  console.log('📋 Manual Debug Export:', debugData);
  
  const blob = new Blob([JSON.stringify(debugData, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `manual-debug-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  return debugData;
}

// Run manual export
manualDebugExport();
```

## How to Use

1. **Open https://scientific-research.online/**
2. **Press F12** to open browser console
3. **Copy and paste the commands above** one by one
4. **Send me the downloaded JSON files** - they'll contain the exact error information I need

This gives you immediate debugging without waiting for deployment!