// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import LLMFrontend from './LLMFrontend'; // Ensure this path is correct
import './index.css'
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LLMFrontend />
  </React.StrictMode>,
);
