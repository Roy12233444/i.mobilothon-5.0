import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';
import App from './App';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Set initial theme class on HTML element
const rootElement = document.documentElement;
const savedTheme = localStorage.getItem('theme') || 'light';
rootElement.classList.add(savedTheme);
rootElement.style.colorScheme = savedTheme;

// Add a class to indicate the app is loaded
document.body.classList.add('app-loaded');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);