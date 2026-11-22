import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { reloadForNewBuild } from '@dice-jar/stale-build';
import App from './App.tsx';
import { migrateOldStores } from './lib/localState';

migrateOldStores();

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
