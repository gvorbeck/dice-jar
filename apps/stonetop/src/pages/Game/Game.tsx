import { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react';
import { Button as AriaButton, GridList, GridListItem, useDragAndDrop } from 'react-aria-components';
import clsx from 'clsx';
import { useParams, Link, useLocation } from 'react-router-dom';
import { PageMeta } from '@/components/app/PageMeta/PageMeta';
import { useGame } from '@/hooks/useGame';
import { DEFAULT_GAME_NAME, getPlaybook, PLAYBOOKS } from '@/lib/constants';
import { Button, Heading, Icon, Text } from '@/components/ui';
import { GameIdModal } from './modals/GameIdModal';
import { AddCharacterModal } from './modals/AddCharacterModal';
import { RemoveCharacterModal } from './modals/RemoveCharacterModal';
import { GameGuard } from '@/components/app/GameGuard/GameGuard';
import { PageLayout } from '@/components/app/PageLayout/PageLayout';
import { RollLog } from '@/components/character/RollLog/RollLog';
import { GameDataActions } from './GameDataActions';
import type { Character, GameSession } from '@/types';
import styles from './Game.module.css';

interface LocationState {
  isNew?: boolean;
}

interface CharacterRowProps {
  character: Character;
  gameId: string;
  showGrip: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onRemove: (character: Character) => void;
  onMove: (id: string, direction: -1 | 1) => void;
}

const CharacterRow = memo(({ character, gameId, showGrip, canMoveUp, canMoveDown, onRemove, onMove }: CharacterRowProps) => {
  const playbookOption = getPlaybook(character.playbook);
  const playbookLabel = `${playbookOption?.label ?? character.playbook} Playbook`;
  const characterName = character.name?.trim();
  const buttonLabel = characterName ? `${characterName} — ${playbookLabel}` : playbookLabel;
  const handleRemove = useCallback(() => onRemove(character), [onRemove, character]);
  const handleMoveUp = useCallback(() => onMove(character.id, -1), [onMove, character.id]);
  const handleMoveDown = useCallback(() => onMove(character.id, 1), [onMove, character.id]);
  const linkCx = clsx(styles.characterLink, styles.characterLinkBtn);

  return (
    <GridListItem id={character.id} textValue={buttonLabel} className={styles.characterRow}>
      {showGrip && (
        <span className={styles.reorderControls}>
          <AriaButton slot="drag" className={styles.gripHandle}>
            <Icon name="grip" size="small" />
          </AriaButton>
          {/* Collapsed by default; expands when an arrow gains keyboard focus so the
              row stays uncluttered for mouse users while keyboard users can still reorder. */}
          <span className={styles.moveButtons}>
            <Button
              variant="ghost"
              icon="chevron-up"
              size="sm"
              className={styles.moveBtn}
              aria-label={`Move ${buttonLabel} up`}
              disabled={!canMoveUp}
              onClick={handleMoveUp}
            />
            <Button
              variant="ghost"
              icon="chevron-down"
              size="sm"
              className={styles.moveBtn}
              aria-label={`Move ${buttonLabel} down`}
              disabled={!canMoveDown}
              onClick={handleMoveDown}
            />
          </span>
        </span>
      )}
      <Button as={Link} to={`/game/${gameId}/${character.playbook}`} variant="secondary" size="xl" fullWidth className={linkCx}>
        <span className={styles.characterBtnText}>{buttonLabel}</span>
      </Button>
      <Button
        variant="ghost"
        icon="trash"
        className={styles.removeCharacterBtn}
        aria-label={`Remove ${buttonLabel}`}
        onClick={handleRemove}
      />
    </GridListItem>
  );
});

interface GameContentProps {
  g: GameSession;
  id: string;
  showIdModal: boolean;
  showAddCharacter: boolean;
  onCloseIdModal: () => void;
  onCloseAddCharacter: () => void;
  onOpenAddCharacter: () => void;
  onSaveTitle: (name: string) => Promise<void>;
  onAddCharacter: ReturnType<typeof useGame>['addCharacter'];
  onRemoveCharacter: ReturnType<typeof useGame>['removeCharacter'];
  onReorderCharacters: ReturnType<typeof useGame>['reorderCharacters'];
  onReplaceGameData: ReturnType<typeof useGame>['replaceGameData'];
}

const GameContent = ({
  g,
  id,
  showIdModal,
  showAddCharacter,
  onCloseIdModal,
  onCloseAddCharacter,
  onOpenAddCharacter,
  onSaveTitle,
  onAddCharacter,
  onRemoveCharacter,
  onReorderCharacters,
  onReplaceGameData,
}: GameContentProps) => {
  const gameName = g.name || DEFAULT_GAME_NAME;
  const [removingCharacter, setRemovingCharacter] = useState<Character | null>(null);
  const [orderedCharacters, setOrderedCharacters] = useState<Character[]>(g.characters);
  const [moveAnnouncement, setMoveAnnouncement] = useState('');
  const orderedCharactersRef = useRef<Character[]>(g.characters);

  // While a reorder is being saved the local order is the truth: a snapshot that still has the old order must not
  // snap the list back. Once the save settles (done or failed), the latest server order wins again.
  const latestCharactersRef = useRef<Character[]>(g.characters);
  const savesInFlight = useRef(0);

  useEffect(() => {
    latestCharactersRef.current = g.characters;
    if (savesInFlight.current > 0) return;
    setOrderedCharacters(g.characters);
    orderedCharactersRef.current = g.characters;
  }, [g.characters]);

  const saveOrder = useCallback(
    (next: Character[]) => {
      savesInFlight.current += 1;
      onReorderCharacters(next)
        .catch(() => {})
        .finally(() => {
          savesInFlight.current -= 1;
          if (savesInFlight.current > 0) return;
          setOrderedCharacters(latestCharactersRef.current);
          orderedCharactersRef.current = latestCharactersRef.current;
        });
    },
    [onReorderCharacters],
  );

  const handleRemoveCharacter = useCallback((character: Character) => setRemovingCharacter(character), []);
  const handleCloseRemoveModal = useCallback(() => setRemovingCharacter(null), []);
  const handleConfirmRemove = useCallback(() => {
    if (!removingCharacter) return Promise.resolve();
    return onRemoveCharacter(removingCharacter.id);
  }, [onRemoveCharacter, removingCharacter]);

  const existingPlaybooks = useMemo(() => g.characters.map((c) => c.playbook), [g.characters]);

  // Keyboard-accessible reordering: move a character one slot up (-1) or down (1).
  const handleMoveCharacter = useCallback(
    (id: string, direction: -1 | 1) => {
      const prev = orderedCharactersRef.current;
      const from = prev.findIndex((c) => c.id === id);
      const to = from + direction;
      if (from === -1 || to < 0 || to >= prev.length) return;
      const next = [...prev];
      next.splice(to, 0, next.splice(from, 1)[0]!);
      orderedCharactersRef.current = next;
      setOrderedCharacters(next);
      const moved = next[to]!;
      const label = moved.name?.trim() || getPlaybook(moved.playbook)?.label || moved.playbook;
      setMoveAnnouncement(`${label} moved to position ${to + 1} of ${next.length}.`);
      saveOrder(next);
    },
    [saveOrder],
  );

  const showGrip = orderedCharacters.length > 1;

  // Pointer, touch and keyboard drag-and-drop come from React Aria; the move buttons stay as a second route.
  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ 'text/plain': String(key) })),
    onReorder: (e) => {
      const moving = new Set(e.keys);
      const rest = orderedCharactersRef.current.filter((c) => !moving.has(c.id));
      const picked = orderedCharactersRef.current.filter((c) => moving.has(c.id));
      const at = rest.findIndex((c) => c.id === e.target.key) + (e.target.dropPosition === 'after' ? 1 : 0);
      const next = [...rest.slice(0, at), ...picked, ...rest.slice(at)];
      orderedCharactersRef.current = next;
      setOrderedCharacters(next);
      saveOrder(next);
    },
  });

  return (
    <>
      <PageMeta
        noindex
        title={`${gameName} — Hearthfire`}
        description={`Party tracker for ${gameName}. Manage characters and GM playbook.`}
      />
      {/* Mounted only while open so per-open UI state (spinners, copy feedback)
          resets on each open without a reset effect. */}
      {showIdModal && <GameIdModal gameId={id} open={showIdModal} onClose={onCloseIdModal} />}
      {showAddCharacter && (
        <AddCharacterModal
          open={showAddCharacter}
          onClose={onCloseAddCharacter}
          existingPlaybooks={existingPlaybooks}
          onAdd={onAddCharacter}
        />
      )}
      {!!removingCharacter && (
        <RemoveCharacterModal
          open={!!removingCharacter}
          character={removingCharacter}
          onClose={handleCloseRemoveModal}
          onConfirm={handleConfirmRemove}
        />
      )}
      <PageLayout
        title={gameName}
        titleLabel="Edit game name"
        gameId={id}
        onSaveTitle={onSaveTitle}
        actions={<GameDataActions gameId={id} gameName={gameName} onReplaceGameData={onReplaceGameData} />}
      >
        <div className={styles.sections}>
          <div className={styles.sectionCharacters}>
            <Heading as="h2" size="label">
              Characters
            </Heading>
            <div className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">
              {moveAnnouncement}
            </div>
            {orderedCharacters.length === 0 ? (
              <div className={styles.placeholder}>
                <Text color="muted">Your party roster is empty. Add a character to get started.</Text>
              </div>
            ) : (
              <GridList
                aria-label="Characters"
                items={orderedCharacters}
                dragAndDropHooks={dragAndDropHooks}
                className={styles.characterList}
              >
                {(character) => (
                  <CharacterRow
                    character={character}
                    gameId={id}
                    showGrip={showGrip}
                    canMoveUp={orderedCharacters[0]?.id !== character.id}
                    canMoveDown={orderedCharacters[orderedCharacters.length - 1]?.id !== character.id}
                    onRemove={handleRemoveCharacter}
                    onMove={handleMoveCharacter}
                  />
                )}
              </GridList>
            )}
            <Button
              variant="secondary"
              size="xl"
              fullWidth
              onClick={onOpenAddCharacter}
              disabled={existingPlaybooks.length >= PLAYBOOKS.length}
            >
              Add Character Playbook
            </Button>
          </div>

          <div className={styles.sectionRight}>
            <div className={styles.section}>
              <Heading as="h2" size="label">
                Stonetop
              </Heading>
              <Button as={Link} to={`/game/${id}/steading`} variant="secondary" size="xl" fullWidth>
                Open Steading Playbook
              </Button>
            </div>

            <div className={styles.section}>
              <Heading as="h2" size="label">
                GM Playbook
              </Heading>
              <Button as={Link} to={`/game/${id}/gm`} variant="secondary" size="xl" fullWidth>
                Open GM Playbook
              </Button>
            </div>

            <div className={styles.section}>
              <Heading as="h2" size="label">
                Recent Rolls
              </Heading>
              <RollLog rolls={g.diceRolls ?? []} />
            </div>
          </div>
        </div>
      </PageLayout>
    </>
  );
};

export const Game = () => {
  const { id = '' } = useParams<{ id: string }>();
  const { state } = useLocation();
  const { game, loading, error, updateGameName, addCharacter, removeCharacter, reorderCharacters, replaceGameData } = useGame(id);
  const [showIdModal, setShowIdModal] = useState((state as LocationState | null)?.isNew === true);
  const [showAddCharacter, setShowAddCharacter] = useState(false);

  const handleCloseIdModal = useCallback(() => setShowIdModal(false), []);
  const handleCloseAddCharacter = useCallback(() => setShowAddCharacter(false), []);
  const handleOpenAddCharacter = useCallback(() => setShowAddCharacter(true), []);

  return (
    <GameGuard loading={loading} error={error} game={game} loadingText="Loading game…" notFoundMessage={`No game with ID "${id}" exists.`}>
      {(g) => (
        <GameContent
          g={g}
          id={id}
          showIdModal={showIdModal}
          showAddCharacter={showAddCharacter}
          onCloseIdModal={handleCloseIdModal}
          onCloseAddCharacter={handleCloseAddCharacter}
          onOpenAddCharacter={handleOpenAddCharacter}
          onSaveTitle={updateGameName}
          onAddCharacter={addCharacter}
          onRemoveCharacter={removeCharacter}
          onReorderCharacters={reorderCharacters}
          onReplaceGameData={replaceGameData}
        />
      )}
    </GameGuard>
  );
};
