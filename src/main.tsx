import React from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import './index.css'

// Proper application initialization with full security
(async () => {
  try {
    console.log('🚀 ASR-GoT: Starting secure application initialization');
    
    // Initialize security systems first
    try {
      // Import and initialize security services
      const { SecurityInitializer } = await import('@/services/security/SecurityInitializer');
      const { ErrorLoggingService } = await import('@/services/ErrorLoggingService');
      
      // Initialize security framework
      console.log('🔒 Initializing security framework...');
      await SecurityInitializer.initialize();
      
      // Initialize error logging with security compliance
      console.log('📊 Initializing secure error logging...');
      await ErrorLoggingService.initialize();
      
      console.log('✅ Security initialization completed');
    } catch (securityError) {
      console.error('🚨 Security initialization failed:', securityError);
      // Don't proceed without security - this is critical
      throw new Error('Critical security initialization failure');
    }
    
    // Advanced error handling for browser extension conflicts (non-compromising)
    window.addEventListener('error', (event) => {
      // Log but don't suppress errors - maintain visibility
      if (event.message?.includes('message port closed') || 
          event.filename?.includes('chrome-extension://') ||
          event.filename?.includes('moz-extension://')) {
        console.warn('🔌 Browser extension error detected (non-blocking):', event.message);
        // Don't prevent default - let security logging handle it
      }
    });

    // Handle unhandled promise rejections with proper logging
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('message port closed')) {
        console.warn('🔌 Browser extension promise rejection (non-blocking):', event.reason);
        // Don't prevent default - maintain proper error reporting
      }
    });
    
    console.log('📦 ASR-GoT: Starting React application...');
  
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  console.log('🎯 ASR-GoT: Creating React root...');
  const root = createRoot(rootElement);
  
  console.log('🎨 ASR-GoT: Rendering App component...');
  root.render(<App />);
  
  // Mark as loaded after a short delay
  setTimeout(() => {
    document.body.setAttribute('data-app-loaded', 'true');
    console.log('✅ ASR-GoT: Application loaded successfully');
  }, 100);
  
  } catch (error) {
    console.error('❌ ASR-GoT: Critical error during app initialization:', error);
  
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
