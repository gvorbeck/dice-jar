import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { GlobalAlerts } from '@dice-jar/browser';
import { ErrorBoundary } from './ErrorBoundary';
import { Loading } from './ui/bits';

// Each page is its own chunk, so the landing page doesn't download the sheet and react-aria it never shows.
const Home = lazy(() => import('./pages/Home'));
const Game = lazy(() => import('./pages/Game'));
const Character = lazy(() => import('./pages/Character'));

export const App = () => {
  const { pathname } = useLocation();
  return (
    <>
      <GlobalAlerts app="knave" />
      <ErrorBoundary key={pathname}>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/g/:gameId" element={<Game />} />
            <Route path="/g/:gameId/c/:characterId" element={<Character />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  );
};
