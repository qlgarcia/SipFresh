import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// Import seedData to make it available globally (for browser console usage)
import './utils/seedData';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);