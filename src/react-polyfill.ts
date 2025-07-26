// CRITICAL: React polyfill to ensure React is available globally
// This file MUST be imported before any other imports in main.tsx

import React from 'react';
import ReactDOM from 'react-dom';

// Ensure React is available globally
if (typeof window !== 'undefined') {
  window.React = window.React || React;
  window.ReactDOM = window.ReactDOM || ReactDOM;
  
  // Also set on globalThis for maximum compatibility
  if (typeof globalThis !== 'undefined') {
    globalThis.React = globalThis.React || React;
    globalThis.ReactDOM = globalThis.ReactDOM || ReactDOM;
  }
  
  console.log('%c✅ React polyfill loaded successfully', 'color: green; font-weight: bold;');
}

export { React, ReactDOM };