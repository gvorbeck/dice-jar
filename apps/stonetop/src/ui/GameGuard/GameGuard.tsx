import { Link } from 'react-router-dom';
import { useTitle } from '@dice-jar/browser';
import { Heading, Text, Button, Spinner } from '@/ui';
import type { GameSession } from '@/model';

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

// Mounted only while there is no game, so it never overwrites the title the content sets once a game exists.
const PageTitle = ({ title }: { title: string }) => {
  useTitle(title);
  return null;
};

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
        <PageTitle title="Something went wrong — Hearthfire" />
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
        <PageTitle title="Game not found — Hearthfire" />
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
