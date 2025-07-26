// CRITICAL: React polyfill to ensure React is available globally
// This file MUST be imported before any other imports in main.tsx

import React from 'react';
import ReactDOM from 'react-dom';

// Ensure React is available globally with ALL necessary methods
if (typeof window !== 'undefined') {
  window.React = window.React || React;
  window.ReactDOM = window.ReactDOM || ReactDOM;
  
  // CRITICAL: Explicitly expose createContext and other React methods
  window.createContext = window.createContext || React.createContext;
  window.createElement = window.createElement || React.createElement;
  window.useState = window.useState || React.useState;
  window.useEffect = window.useEffect || React.useEffect;
  window.useContext = window.useContext || React.useContext;
  
  // Also set on globalThis for maximum compatibility
  if (typeof globalThis !== 'undefined') {
    globalThis.React = globalThis.React || React;
    globalThis.ReactDOM = globalThis.ReactDOM || ReactDOM;
    globalThis.createContext = globalThis.createContext || React.createContext;
    globalThis.createElement = globalThis.createElement || React.createElement;
  }
  
  console.log('%c🛡️ React polyfill loaded with createContext protection', 'color: orange; font-weight: bold;');
  console.log('Available React methods:', {
    React: !!window.React,
    createContext: !!window.createContext,
    createElement: !!window.createElement
  });
}

export { React, ReactDOM };