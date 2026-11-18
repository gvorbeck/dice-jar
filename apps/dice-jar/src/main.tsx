import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/syne/latin-700.css';
import '@fontsource/syne/latin-800.css';
import '@fontsource/space-grotesk/latin-400.css';
import '@fontsource/space-grotesk/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import './styles/tokens.css';
import './styles/app.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
