import { useCallback, useMemo, useRef } from 'react';
import { useHashTabs } from '@/lib/useHashTabs';
import { useParams } from 'react-router-dom';
import { useTitle } from '@/lib/useTitle';
import { useGame } from '@/lib/useGame';
import { useNotesActions } from '@/lib/useNotesActions';
import { SharedNotes, type NotesActions } from '@/playbook/SharedNotes/SharedNotes';
import { ScrollToTop, Tabs, PlaybookColumns } from '@/ui';
import { PageLayout } from '@/ui/PageLayout/PageLayout';
import { buildGameNav } from '@/ui/PageHeader/gameNav';
import { PlaybookSection } from '@/playbook/PlaybookSection';
import {
  CoreLoop,
  GmMoves,
  Principles,
  DamageAndDebilities,
  ContentSection,
  Threats,
  IWonder,
  Expeditions,
  Sites,
  Discoveries,
  Hazards,
  Monsters,
  NPCs,
  Followers,
  Homefront,
  FlowOfPlay,
  MoveSearch,
} from '@/gm-playbook/sections';
import { GameGuard } from '@/ui/GameGuard/GameGuard';
import { DEFAULT_GAME_NAME } from '@/lib/constants';
import type { ContentLists, GameSession, LoggedRoll } from '@/model';

const ReferenceTabContent = () => (
  <PlaybookColumns
    left={
      <>
        <PlaybookSection title="The Core Loop" collapsible>
          <CoreLoop />
        </PlaybookSection>
        <PlaybookSection title="GM Moves" collapsible>
          <GmMoves />
        </PlaybookSection>
      </>
    }
    right={
      <>
        <PlaybookSection title="Principles" collapsible>
          <Principles />
        </PlaybookSection>
        <PlaybookSection title="Damage & Debilities" collapsible>
          <DamageAndDebilities />
        </PlaybookSection>
      </>
    }
  />
);

const WorldTabContent = () => (
  <PlaybookColumns
    left={
      <>
        <PlaybookSection title="Expeditions" collapsible>
          <Expeditions />
        </PlaybookSection>
        <PlaybookSection title="Sites" collapsible>
          <Sites />
        </PlaybookSection>
        <PlaybookSection title="Discoveries" collapsible>
          <Discoveries />
        </PlaybookSection>
        <PlaybookSection title="Hazards" collapsible>
          <Hazards />
        </PlaybookSection>
        <PlaybookSection title="Homefront" collapsible>
          <Homefront />
        </PlaybookSection>
      </>
    }
    right={
      <>
        <PlaybookSection title="Monsters" collapsible>
          <Monsters />
        </PlaybookSection>
        <PlaybookSection title="NPCs" collapsible>
          <NPCs />
        </PlaybookSection>
        <PlaybookSection title="Followers" collapsible>
          <Followers />
        </PlaybookSection>
      </>
    }
  />
);

interface GmPlaybookContentProps {
  g: GameSession;
  id: string;
  updateContent: (field: keyof ContentLists, value: string) => Promise<void>;
  updateField: (field: keyof Pick<GameSession, 'threats' | 'iWonder'>, value: string) => Promise<void>;
  logRoll: (roll: LoggedRoll) => Promise<void>;
  notesActions: NotesActions;
}

const GmPlaybookContent = ({ g, id, updateContent, updateField, logRoll, notesActions }: GmPlaybookContentProps) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const gameName = g.name || DEFAULT_GAME_NAME;
  useTitle(`GM Playbook — ${gameName} — Hearthfire`);
  const saveIWonder = useCallback((value: string) => updateField('iWonder', value), [updateField]);

  const tabs = useMemo(
    () => [
      {
        id: 'reference',
        label: 'Reference',
        content: <ReferenceTabContent />,
      },
      {
        id: 'session',
        label: 'Session',
        content: (
          <PlaybookColumns
            left={
              <>
                <PlaybookSection title="Flow of Play" collapsible>
                  <FlowOfPlay />
                </PlaybookSection>
                <PlaybookSection title="Content" collapsible>
                  <ContentSection content={g.content} onSave={updateContent} />
                </PlaybookSection>
              </>
            }
            right={
              <>
                <PlaybookSection title="I Wonder…" collapsible>
                  <IWonder value={g.iWonder ?? ''} onSave={saveIWonder} />
                </PlaybookSection>
                <PlaybookSection title="Threats" collapsible>
                  <Threats />
                </PlaybookSection>
              </>
            }
          />
        ),
      },
      {
        id: 'world',
        label: 'World',
        content: <WorldTabContent />,
      },
      {
        id: 'col gap-3',
        label: 'Move Search',
        content: <MoveSearch />,
      },
    ],
    [g.content, g.iWonder, updateContent, saveIWonder],
  );

  const { activeIndex, handleActiveChange } = useHashTabs(tabs);
  const nav = buildGameNav(g, id, `/game/${id}/gm`);

  return (
    <PageLayout title="GM Playbook" gameId={id} nav={nav} diceRoller={{ rollerId: 'gm', rollerName: 'GM', onRoll: logRoll }}>
      <ScrollToTop sentinelRef={headerRef} />
      <div ref={headerRef} />
      <Tabs
        aria-label="GM Playbook sections"
        className="gm-playbook-tabs"
        tabs={tabs}
        activeIndex={activeIndex}
        onActiveChange={handleActiveChange}
      />
      <SharedNotes
        notesKey="gm"
        html={g.notes?.gm}
        lock={g.notesLocks?.gm}
        actions={notesActions}
        warning="Everyone in this game can see these notes. Keep secrets somewhere else."
      />
    </PageLayout>
  );
};

export const GmPlaybook = () => {
  const { id = '' } = useParams<{ id: string }>();
  const { game, loading, error, updateContent, updateField, logRoll, updateNotes, claimNotesLock, refreshNotesLock, releaseNotesLock } =
    useGame(id);
  const notesActions = useNotesActions({ updateNotes, claimNotesLock, refreshNotesLock, releaseNotesLock });

  return (
    <GameGuard loading={loading} error={error} game={game} errorBackTo={`/game/${id}`} errorBackLabel="Back to Game">
      {(g) => (
        <GmPlaybookContent
          g={g}
          id={id}
          updateContent={updateContent}
          updateField={updateField}
          logRoll={logRoll}
          notesActions={notesActions}
        />
      )}
    </GameGuard>
  );
};
