import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Silence WebSocket connection logs/errors caused by Vite in preview iframe environment
if (typeof window !== 'undefined') {
  const isWsError = (reason: any) => {
    if (!reason) return false;
    const str = typeof reason === 'string' ? reason : (reason.message || String(reason));
    return str.includes('WebSocket') || str.includes('websocket') || str.includes('[vite]');
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (isWsError(event.reason)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener('error', (event) => {
    if (isWsError(event.message) || isWsError(event.error)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
