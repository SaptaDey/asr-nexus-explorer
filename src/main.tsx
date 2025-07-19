import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Emergency error handling for main.tsx
try {
  console.log('📦 main.tsx: Starting React app creation...');
  
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  console.log('🎯 main.tsx: Creating React root...');
  const root = createRoot(rootElement);
  
  console.log('🎨 main.tsx: Rendering App component...');
  root.render(<App />);
  
  // Mark as loaded after a short delay
  setTimeout(() => {
    document.body.setAttribute('data-app-loaded', 'true');
    console.log('✅ main.tsx: App loaded successfully');
  }, 100);
  
} catch (error) {
  console.error('❌ main.tsx: Critical error during app initialization:', error);
  
  // Show error on page
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: white; z-index: 999999; padding: 20px; font-family: monospace;';
  errorDiv.innerHTML = `
    <h1 style="color: red;">🚨 App Initialization Failed</h1>
    <p><strong>Error:</strong> ${error.message}</p>
    <p><strong>Stack:</strong> <pre>${error.stack}</pre></p>
    <p><strong>Time:</strong> ${new Date().toISOString()}</p>
    <hr>
    <p>This error prevents the ASR-GoT app from loading. Please check the browser console for more details.</p>
  `;
  document.body.appendChild(errorDiv);
}
