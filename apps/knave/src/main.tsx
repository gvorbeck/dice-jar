import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource/unifrakturcook/latin-700.css';
import '@fontsource/crimson-text/latin-400.css';
import '@fontsource/crimson-text/latin-700.css';
import '@fontsource/alegreya-sc/latin-700.css';
import './styles/tokens.css';
import './styles/app.css';
import { App } from './App';
import { reloadForNewBuild } from '@dice-jar/stale-build';

// Vite fires this when a lazily loaded file is missing, which after a deploy means this tab is running an old build.
addEventListener('vite:preloadError', (e) => {
  if (reloadForNewBuild()) e.preventDefault();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
