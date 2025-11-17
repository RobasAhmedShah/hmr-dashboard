import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Ensure dark mode is applied on initial load
const rootElement = document.documentElement;
const savedTheme = localStorage.getItem('theme') || 'dark';
if (!rootElement.classList.contains('dark') && savedTheme === 'dark') {
  rootElement.classList.add('dark');
  rootElement.classList.remove('light');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
