import React from 'react'
import ReactDOM from 'react-dom/client'
import posthog from 'posthog-js'
import App from './App.jsx'
import './index.css'

// ── PostHog Analytics Init ────────────────────────────────────────────────
// Tracks anonymous sessions from page load.
// When lead submits email, posthog.identify() merges anonymous → identified.
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
    capture_pageview: false,       // we fire page views manually per stage
    persistence: 'localStorage',  // keeps anonymousId across sessions
    autocapture: false,            // manual event control only
    loaded: (ph) => {
      // In development, we keep tracking active for testing.
      if (import.meta.env.DEV) {
        console.log('[PostHog] Dev mode — tracking enabled for testing');
      }
    },
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
