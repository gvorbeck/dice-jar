import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/app/PageMeta/PageMeta';
import { Heading, Text, Button, Spinner } from '@/components/ui';
import type { GameSession } from '@/types';
import './GameGuard.css';

interface Props {
  loading: boolean;
  error: string | null;
  game: GameSession | null;
  loadingText?: string;
  notFoundMessage?: string;
  errorBackTo?: string;
  errorBackLabel?: string;
  children: (game: GameSession) => React.ReactNode;
}

export const GameGuard = ({
  loading,
  error,
  game,
  loadingText = 'Loading…',
  notFoundMessage,
  errorBackTo = '/',
  errorBackLabel = 'Back to Home',
  children,
}: Props) => {
  if (loading) {
    return (
      <main className="game-guard-centered" aria-live="polite" aria-busy={true}>
        <Spinner label={loadingText} />
      </main>
    );
  }

  if (error) {
    return (
      <main className="game-guard-centered">
        <PageMeta noindex title="Something went wrong — Hearthfire" description="This game could not be loaded." />
        <Heading as="h1" size="md">
          Something went wrong
        </Heading>
        <Text color="muted">{error}</Text>
        <Button as={Link} to={errorBackTo} variant="secondary">
          {errorBackLabel}
        </Button>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="game-guard-centered">
        <PageMeta noindex title="Game not found — Hearthfire" description="No game exists with this ID." />
        <Heading as="h1" size="md">
          Game not found
        </Heading>
        {notFoundMessage && <Text color="muted">{notFoundMessage}</Text>}
        <Button as={Link} to="/" variant="secondary">
          Back to Home
        </Button>
      </main>
    );
  }

  return <>{children(game)}</>;
};
