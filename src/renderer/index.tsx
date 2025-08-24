/**
 * PAAT - AI Personal Assistant Agent Tool
 * React Application Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeTheme } from './stores/themeStore';

// Import Inter font from Google Fonts
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

// Import JetBrains Mono for code
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';

// Enable React's concurrent features
console.log('PAAT: Starting application...');

// Initialize theme system
const themeCleanup = initializeTheme();

// Performance monitoring
const isProduction = process.env.NODE_ENV === 'production';
if (!isProduction) {
  console.log('PAAT: Running in development mode');
}

// Create React root
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Render the application
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Hot module replacement for development
if (!isProduction && (module as any).hot) {
  (module as any).hot.accept('./App', () => {
    const NextApp = require('./App').default;
    root.render(
      <React.StrictMode>
        <NextApp />
      </React.StrictMode>
    );
  });
}

// Cleanup on app unmount
window.addEventListener('beforeunload', () => {
  if (themeCleanup) {
    themeCleanup();
  }
  console.log('PAAT: Application cleanup completed');
});

// Error handling
window.addEventListener('error', (event) => {
  console.error('PAAT: Unhandled error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('PAAT: Unhandled promise rejection:', event.reason);
});

// Performance measurement
if (!isProduction && 'performance' in window) {
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    console.log('PAAT: App loaded in', perfData.loadEventEnd - perfData.fetchStart, 'ms');
  });
}

console.log('PAAT: Application initialized successfully');
