import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// SpeedInsights import removed to avoid bundling errors during Vercel build.
// If you want to re-enable Vercel Speed Insights, load it client-side only via a dynamic import in a
// useEffect or render it behind an environment flag to prevent build-time bundling.
import './index.css';

// Register the Firebase Messaging service worker for background push.
// (Do not unregister service workers here; it breaks push notifications.)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js').catch((err) => {
    console.warn('Service worker registration failed:', err);
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
    {/* SpeedInsights intentionally not rendered here to avoid build-time bundling issues. */}
  </React.StrictMode>
);