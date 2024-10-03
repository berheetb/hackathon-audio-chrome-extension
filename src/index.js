import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Popup from '../src/components/Popup/Popup';

// Get the root DOM element where your app will be mounted
const container = document.getElementById('root');

// Create a root using the createRoot method
const root = ReactDOM.createRoot(container);

// Render your app using the root object
root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
