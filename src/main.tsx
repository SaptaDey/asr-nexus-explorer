// CRITICAL: Import React polyfill FIRST to ensure global availability
import './react-polyfill'

import React from 'react'
import ReactDOM from 'react-dom'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import './index.css'
import { safeLog, safeError, initializeSecurity } from './services/security'
import { setupCSRFInterceptor } from './utils/csrfProtection'

// Emergency error handling for main.tsx with async security initialization
(async () => {
  try {
    // Initialize security services before anything else
    await initializeSecurity({
      enableConsoleLogging: true,
      enableErrorHandling: true,
      enableDataSanitization: true,
      enableSecureExports: true,
      productionMode: import.meta.env.MODE === 'production'
    });
    
    // SECURITY: Setup CSRF protection for all fetch requests
    setupCSRFInterceptor();
    safeLog('🔒 CSRF protection initialized');
    
    safeLog('📦 main.tsx: Starting React app creation...');
  
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  safeLog('🎯 main.tsx: Creating React root...');
  const root = createRoot(rootElement);
  
  safeLog('🎨 main.tsx: Rendering App component...');
  root.render(<App />);
  
  // Mark as loaded after a short delay
  setTimeout(() => {
    document.body.setAttribute('data-app-loaded', 'true');
    safeLog('✅ main.tsx: App loaded successfully');
  }, 100);
  
  } catch (error) {
    safeError('❌ main.tsx: Critical error during app initialization:', error);
  
  // Show error on page safely
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: white; z-index: 999999; padding: 20px; font-family: monospace;';
  
  // Safely create elements to prevent XSS
  const title = document.createElement('h1');
  title.style.color = 'red';
  title.textContent = '🚨 App Initialization Failed';
  
  const errorText = document.createElement('p');
  const errorLabel = document.createElement('strong');
  errorLabel.textContent = 'Error: ';
  const errorMsg = document.createElement('span');
  errorMsg.textContent = 'Application failed to initialize (details logged securely)';
  errorText.appendChild(errorLabel);
  errorText.appendChild(errorMsg);
  
  const stackText = document.createElement('p');
  const stackLabel = document.createElement('strong');
  stackLabel.textContent = 'Stack: ';
  const stackPre = document.createElement('pre');
  stackPre.textContent = '[Stack trace redacted for security]';
  stackText.appendChild(stackLabel);
  stackText.appendChild(stackPre);
  
  const timeText = document.createElement('p');
  const timeLabel = document.createElement('strong');
  timeLabel.textContent = 'Time: ';
  const timeSpan = document.createElement('span');
  timeSpan.textContent = new Date().toISOString();
  timeText.appendChild(timeLabel);
  timeText.appendChild(timeSpan);
  
  const hr = document.createElement('hr');
  
  const helpText = document.createElement('p');
  helpText.textContent = 'This error prevents the ASR-GoT app from loading. Please check the browser console for more details.';
  
  errorDiv.appendChild(title);
  errorDiv.appendChild(errorText);
  errorDiv.appendChild(stackText);
  errorDiv.appendChild(timeText);
    errorDiv.appendChild(hr);
    errorDiv.appendChild(helpText);
    document.body.appendChild(errorDiv);
  }
})();
