import React from 'react';
import { createRoot } from 'react-dom/client';
import EnhancedDesignApp from './components/showcase/EnhancedDesignApp';
import './styles/index.css';

// Create a root for the enhanced design showcase
const container = document.getElementById('root');
const root = createRoot(container!);

// Render the enhanced design app
root.render(
  <React.StrictMode>
    <EnhancedDesignApp />
  </React.StrictMode>
);
