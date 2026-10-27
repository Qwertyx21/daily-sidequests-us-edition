import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Register Service Worker for PWA installability & background lock-screen notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // ignore registration error in dev
    });
  });
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
