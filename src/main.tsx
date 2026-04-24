import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

/**
 * Mount the React application into the single root element created by Vite.
 *
 * `StrictMode` is enabled during development so React can surface lifecycle
 * issues early while the app is still small and easy to reason about.
 */
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
