import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import './DarkStyles.css'; // if you have additional global styles

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
