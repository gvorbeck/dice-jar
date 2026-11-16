import { useState, useCallback, useId } from 'react';
import { cn } from '@dice-jar/cn';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageMeta } from '@/components/app/PageMeta/PageMeta';
import { PageLayout } from '@/components/app/PageLayout/PageLayout';
import { createGame, createGameWithId } from '@/lib/game';
import { useGameIdCheck } from '@/hooks/useGameIdCheck';
import { useJoinIdCheck } from '@/hooks/useJoinIdCheck';
import { Button, Heading, Icon, Input, RuleDivider, Stack, Text } from '@/components/ui';

const STATUS_MESSAGES = {
  idle: '',
  checking: 'Checking availability…',
  available: 'Available',
  taken: 'Already taken — choose a different name.',
  invalid: 'Must be at least 3 characters.',
} as const;

const JOIN_STATUS_MESSAGES = {
  idle: '',
  checking: 'Checking…',
  found: 'Game found ✓',
  notfound: 'No game found with that ID.',
  error: 'Could not check that ID. Please try again.',
} as const;

export const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const customIdHintId = useId();
  const joinHintId = useId();

  const [joinId, setJoinId] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [customIdRaw, setCustomIdRaw] = useState('');

  const { slug, status } = useGameIdCheck(customIdRaw);
  const { status: joinStatus } = useJoinIdCheck(joinId);

  const handleCreate = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      setCreating(true);
      setCreateError('');
      try {
        if (slug) {
          await createGameWithId(slug);
          navigate(`/game/${slug}`, { state: { isNew: true } });
        } else {
          const id = await createGame();
          navigate(`/game/${id}`, { state: { isNew: true } });
        }
      } catch (err) {
        const msg =
          err instanceof Error && err.message === 'Game ID already taken.'
            ? 'That name was just taken — choose another.'
            : 'Failed to create game. Please try again.';
        setCreateError(msg);
      } finally {
        setCreating(false);
      }
    },
    [navigate, slug],
  );

  const handleCustomIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomIdRaw(e.target.value);
    setCreateError('');
  }, []);

  // The Join button is enabled only once the live check confirms the game
  // exists, so submit can trust joinStatus and navigate without re-checking.
  const handleJoin = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (joinStatus === 'found') navigate(`/game/${joinId.trim()}`);
    },
    [joinId, joinStatus, navigate],
  );

  const handleJoinIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setJoinId(e.target.value);
  }, []);

  const isCreateDisabled = creating || status === 'taken' || status === 'invalid' || status === 'checking';
  const showSlugPreview = status === 'available' || status === 'checking';

  const hintCx = cn(
    'home-id-hint',
    status === 'available' && 'home-id-hint-available',
    (status === 'taken' || status === 'invalid') && 'home-id-hint-taken',
    status === 'checking' && 'home-id-hint-checking',
  );

  const isJoinDisabled = joinStatus !== 'found';

  const joinHintCx = cn(
    'home-id-hint',
    joinStatus === 'found' && 'home-id-hint-available',
    (joinStatus === 'notfound' || joinStatus === 'error') && 'home-id-hint-taken',
    joinStatus === 'checking' && 'home-id-hint-checking',
  );

  return (
    <PageLayout simple>
      <PageMeta
        title="Hearthfire — Stonetop Party Tracker"
        description="Track your Stonetop TTRPG campaign — manage characters, GM playbook, and game sessions."
        url={`${window.location.origin}${location.pathname}`}
      />
      <div className="home-page">
        <div className="home-hero">
          <div className="home-logo-wrap">
            <Icon logoIcon="stonetop" className="home-logo" />
            <div className="home-hero-text">
              <Text className="home-eyebrow">Party Tracker</Text>
              <Heading as="h1" size="xl" className="home-wordmark">
                Hearthfire
              </Heading>
            </div>
          </div>
          <RuleDivider className="home-rule" />
          <Text className="home-subtitle">For the Stonetop TTRPG by Jeremy Strandberg</Text>
        </div>

        <div className="home-cards">
          <div className="home-card">
            <Heading as="h2" size="label">
              New Game
            </Heading>
            <form onSubmit={handleCreate} className="home-card-body">
              <Text color="muted" size="xs">
                Start a new session. Leave the name blank for a generated ID, or choose one your group will remember.
              </Text>
              <Stack gap={2}>
                <Input
                  id="custom-game-id"
                  label="Custom game name (optional)"
                  placeholder="e.g. tuesdays-at-the-hearth"
                  value={customIdRaw}
                  onChange={handleCustomIdChange}
                  aria-describedby={status !== 'idle' ? customIdHintId : undefined}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                />
                <div id={customIdHintId} aria-live="polite" aria-atomic="true">
                  {status !== 'idle' && (
                    <>
                      {showSlugPreview && <Text as="span" className="home-id-slug-preview">{`hearthfire.camp/game/**${slug}**`}</Text>}
                      <Text as="span" size="xs" className={hintCx}>
                        {STATUS_MESSAGES[status]}
                      </Text>
                    </>
                  )}
                </div>
              </Stack>
              <Button type="submit" disabled={isCreateDisabled} size="lg" fullWidth>
                {creating ? 'Creating…' : 'Create Game'}
              </Button>
              {createError && (
                <Text color="muted" size="xs" role="alert">
                  {createError}
                </Text>
              )}
            </form>
          </div>

          <div className="home-card">
            <Heading as="h2" size="label">
              Join Game
            </Heading>
            <form onSubmit={handleJoin} className="home-card-body">
              <Stack gap={2}>
                <Input
                  id="join-id"
                  label="Game ID"
                  placeholder="Paste your ID"
                  value={joinId}
                  onChange={handleJoinIdChange}
                  aria-describedby={joinStatus !== 'idle' ? joinHintId : undefined}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                />
                <div id={joinHintId} aria-live="polite" aria-atomic="true">
                  {joinStatus !== 'idle' && (
                    <Text as="span" size="xs" className={joinHintCx}>
                      {JOIN_STATUS_MESSAGES[joinStatus]}
                    </Text>
                  )}
                </div>
              </Stack>
              <Button type="submit" variant="secondary" size="lg" fullWidth disabled={isJoinDisabled}>
                Join
              </Button>
            </form>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};
