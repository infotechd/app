import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// For TypeScript, we need to add a null check
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = createRoot(rootElement);
root.render(<React.StrictMode><App /></React.StrictMode>);