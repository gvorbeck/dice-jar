import { Route, Switch } from 'wouter';
import { Suspense, lazy } from 'react';
import { Link } from 'wouter';
import { TextHeader } from '@/components/ui/composite';
import { Typography } from '@/components/ui/core/display';
import {
  CharGenErrorBoundary,
  SheetErrorBoundary,
  GameGenErrorBoundary,
  HomeErrorBoundary,
  LoadingState,
} from '@/components/ui/core/feedback';
import { DOM_IDS } from '@/constants';
import './Routes.css';

const Home = lazy(() => import('../pages/Home'));
const CharGen = lazy(() => import('../pages/CharGen'));
const GameGen = lazy(() => import('../pages/GameGen'));
const CharacterSheet = lazy(() => import('../pages/CharacterSheet'));
const GameSheet = lazy(() => import('../pages/GameSheet'));

export function Routes() {
  return (
    <main role="main" id={DOM_IDS.MAIN_CONTENT} className="site-main">
      <Suspense fallback={<LoadingState variant="page" message="Loading page..." />}>
        <Switch>
          <Route path="/">
            <HomeErrorBoundary>
              <Home />
            </HomeErrorBoundary>
          </Route>
          <Route path="/new-character">
            <CharGenErrorBoundary>
              <CharGen />
            </CharGenErrorBoundary>
          </Route>
          <Route path="/new-game">
            <GameGenErrorBoundary>
              <GameGen />
            </GameGenErrorBoundary>
          </Route>
          <Route path="/u/:userId/c/:characterId">
            <SheetErrorBoundary entityType="Character Sheet" entityContext="character">
              <CharacterSheet />
            </SheetErrorBoundary>
          </Route>
          <Route path="/u/:userId/g/:gameId">
            <SheetErrorBoundary entityType="Game Sheet" entityContext="game">
              <GameSheet />
            </SheetErrorBoundary>
          </Route>

          <Route>
            <section className="not-found">
              <TextHeader variant="h2" size="lg">
                Page Not Found
              </TextHeader>
              <Typography variant="body" color="secondary">
                Sorry, the page you're looking for doesn't exist.
              </Typography>
              <Link href="/">Return to homepage</Link>
            </section>
          </Route>
        </Switch>
      </Suspense>
    </main>
  );
}
