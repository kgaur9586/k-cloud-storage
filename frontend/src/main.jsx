import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { LogtoProvider } from '@logto/react';
import App from './App';
import './index.css';

/**
 * Logto configuration for React
 */
const logtoConfig = {
  endpoint: import.meta.env.VITE_LOGTO_ENDPOINT,
  appId: import.meta.env.VITE_LOGTO_APP_ID,
  resources: [],
  scopes: ['openid', 'profile', 'email', 'offline_access'],
};

/**
 * Application entry point
 * Wraps app with necessary providers
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <LogtoProvider config={logtoConfig}>
      <App />
    </LogtoProvider>
  </BrowserRouter>
);
