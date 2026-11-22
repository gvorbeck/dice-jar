import { Route, Routes as RouterRoutes, useLocation } from 'react-router-dom';
import { ErrorBoundary, useTitle } from '@dice-jar/browser';
import { Suspense, lazy, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { TextHeader } from '@/components/ui/composite';
import { Typography } from '@/components/ui/core/display';
import { ErrorPage, LoadingState } from '@/components/ui/core/feedback';
import { DOM_IDS } from '@/constants';
import './Routes.css';

const Home = lazy(() => import('../pages/Home'));
const CharGen = lazy(() => import('../pages/CharGen'));
const GameGen = lazy(() => import('../pages/GameGen'));
const CharacterSheet = lazy(() => import('../pages/CharacterSheet'));
const GameSheet = lazy(() => import('../pages/GameSheet'));

interface GuardProps {
  title: string;
  message: string;
  showHomeLink?: boolean;
  children: ReactNode;
}

function NotFound() {
  useTitle('Page not found | Codex.Quest');
  return (
    <section className="not-found">
      <TextHeader variant="h2" size="lg">
        Page Not Found
      </TextHeader>
      <Typography variant="body" color="secondary">
        Sorry, the page you're looking for doesn't exist.
      </Typography>
      <Link to="/">Return to homepage</Link>
    </section>
  );
}

/** A crash in one page shows this page's error and clears when the visitor navigates elsewhere. */
function Guard({ title, message, showHomeLink, children }: GuardProps) {
  const { pathname } = useLocation();
  return (
    <ErrorBoundary
      resetKey={pathname}
      fallback={<ErrorPage title={title} message={message} {...(showHomeLink === false && { showHomeLink })} />}
    >
      {children}
    </ErrorBoundary>
  );
}

const sheetProblem = (kind: string) =>
  `There was a problem displaying this ${kind} sheet. The ${kind} data may be corrupted or there's an issue loading the ${kind} information.`;

export function Routes() {
  return (
    <main role="main" id={DOM_IDS.MAIN_CONTENT} className="site-main">
      <Suspense fallback={<LoadingState variant="page" message="Loading page..." />}>
        <RouterRoutes>
          <Route
            path="/"
            element={
              <Guard
                title="Page Loading Error"
                message="We're experiencing technical difficulties loading the homepage. Please try refreshing the page."
                showHomeLink={false}
              >
                <Home />
              </Guard>
            }
          />
          <Route
            path="/new-character"
            element={
              <Guard
                title="Character Creation Unavailable"
                message="We're experiencing technical difficulties with the character creation system. Please try refreshing the page or start over."
              >
                <CharGen />
              </Guard>
            }
          />
          <Route
            path="/new-game"
            element={
              <Guard
                title="Game Creation Unavailable"
                message="We're experiencing technical difficulties with the game creation system. Please try refreshing the page or start over."
              >
                <GameGen />
              </Guard>
            }
          />
          <Route
            path="/u/:userId/c/:characterId"
            element={
              <Guard title="Character Sheet Error" message={sheetProblem('character')}>
                <CharacterSheet />
              </Guard>
            }
          />
          <Route
            path="/u/:userId/g/:gameId"
            element={
              <Guard title="Game Sheet Error" message={sheetProblem('game')}>
                <GameSheet />
              </Guard>
            }
          />

          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </Suspense>
    </main>
  );
}
