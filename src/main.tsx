import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { safeLog, safeError, initializeSecurity } from './services/security'

// Emergency error handling for main.tsx with async security initialization
(async () => {
  try {
    // Initialize security services before anything else
    await initializeSecurity({
      enableConsoleLogging: true,
      enableErrorHandling: true,
      enableDataSanitization: true,
      enableSecureExports: true,
      productionMode: process.env.NODE_ENV === 'production'
    });
    
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
  errorText.innerHTML = '<strong>Error:</strong> ';
  const errorMsg = document.createElement('span');
  errorMsg.textContent = 'Application failed to initialize (details logged securely)';
  errorText.appendChild(errorMsg);
  
  const stackText = document.createElement('p');
  stackText.innerHTML = '<strong>Stack:</strong> ';
  const stackPre = document.createElement('pre');
  stackPre.textContent = '[Stack trace redacted for security]';
  stackText.appendChild(stackPre);
  
  const timeText = document.createElement('p');
  timeText.innerHTML = '<strong>Time:</strong> ';
  const timeSpan = document.createElement('span');
  timeSpan.textContent = new Date().toISOString();
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
