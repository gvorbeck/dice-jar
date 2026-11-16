import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { TabPanel, Tabs, type Key } from 'react-aria-components';
import { changedById } from '@/lib/gameMutations';
import { useOptimisticField } from '@/hooks/useOptimisticField';
import type { ArcanaMajorEntry, ArcanaMinorEntry, PlaybookSectionProps } from '@/types';
import { Spinner } from '@/components/ui';
import { ArcanaSubTabs, type ArcanaSubTab } from './ArcanaSubTabs';
import styles from './ArcanaTab.module.css';

// The character tab lives in the first hash segment (e.g. "#arcana", from useHashTabs); the Arcana
// sub-tab lives in a second "&"-delimited segment ("#arcana&major") so a refresh or shared link keeps
// both. Read the sub-tab from that segment, defaulting to "minor".
const readSubTabFromHash = (): ArcanaSubTab => (window.location.hash.slice(1).split('&')[1] === 'major' ? 'major' : 'minor');

// Rewrite the hash's sub-tab segment while preserving the leading character-tab segment that
// useHashTabs owns. "major" gets the "&major" segment; "minor" (the default) drops it for a clean hash.
// Fall back to "arcana" when there's no leading segment (e.g. a hand-edited "#&major") so we never write
// a hash that starts with "&".
const writeSubTabToHash = (subTab: ArcanaSubTab) => {
  const characterTab = window.location.hash.slice(1).split('&')[0] || 'arcana';
  window.location.hash = subTab === 'major' ? `${characterTab}&major` : characterTab;
};

// Each panel statically imports its (large) arcana dataset, so lazy-loading the
// panels splits MAJOR_ARCANA and MINOR_ARCANA into separate chunks that load
// only when their sub-tab is viewed.
const MinorArcanaPanel = lazy(() => import('./MinorArcanaPanel').then((m) => ({ default: m.MinorArcanaPanel })));
const MajorArcanaPanel = lazy(() => import('./MajorArcanaPanel').then((m) => ({ default: m.MajorArcanaPanel })));

interface ArcanaTabProps extends PlaybookSectionProps {
  // Transactional Armor/HP adjuster: a consequence's armor/maxHp action applies its delta against the
  // freshly-read doc, so rapid toggles or a stale snapshot can't strand the stat on the wrong value.
  adjustCharacterStats: (deltas: Partial<Record<'statArmor' | 'statHp', number>>) => Promise<void>;
}

export const ArcanaTab = ({ data, onSave, adjustCharacterStats }: ArcanaTabProps) => {
  const [subTab, setSubTab] = useState<ArcanaSubTab>(readSubTabFromHash);

  const handleSelectSubTab = useCallback((next: ArcanaSubTab) => {
    setSubTab(next);
    writeSubTabToHash(next);
  }, []);

  const handleSelectionChange = useCallback((key: Key) => handleSelectSubTab(key === 'major' ? 'major' : 'minor'), [handleSelectSubTab]);

  // Keep the sub-tab in sync when the hash changes outside our own writes — browser back/forward, or
  // useHashTabs rewriting the character-tab segment (which would otherwise drop our "&major").
  useEffect(() => {
    const onHashChange = () => setSubTab(readSubTabFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // The optional removedId arg is forwarded to onSave as the explicit removal sentinel
  // (see CharacterData.removedArcanaMinorIds) — omitting an entry from the array alone
  // is ambiguous between "removed" and "not yet seen" once updateCharacterData id-merges
  // this field against the freshly-read doc.
  const {
    value: arcanaMinor,
    ref: arcanaMinorRef,
    save: saveMinor,
  } = useOptimisticField<ArcanaMinorEntry[], [removedId?: string]>(
    data?.arcanaMinor ?? [],
    (next, removedId): Promise<void> =>
      onSave({ arcanaMinor: changedById(arcanaMinorRef.current, next), ...(removedId ? { removedArcanaMinorIds: [removedId] } : {}) }),
    'Failed to save.',
  );
  const {
    value: arcanaMajor,
    ref: arcanaMajorRef,
    save: saveMajor,
  } = useOptimisticField<ArcanaMajorEntry[], [removedId?: string]>(
    data?.arcanaMajor ?? [],
    (next, removedId): Promise<void> =>
      onSave({ arcanaMajor: changedById(arcanaMajorRef.current, next), ...(removedId ? { removedArcanaMajorIds: [removedId] } : {}) }),
    'Failed to save.',
  );
  return (
    <div className={styles.root}>
      <Tabs selectedKey={subTab} onSelectionChange={handleSelectionChange}>
        <ArcanaSubTabs minorCount={arcanaMinor.length} majorCount={arcanaMajor.length} />

        <Suspense
          fallback={
            <div className={styles.loading}>
              <Spinner />
            </div>
          }
        >
          <TabPanel id="minor">
            <MinorArcanaPanel arcanaMinor={arcanaMinor} arcanaMinorRef={arcanaMinorRef} saveMinor={saveMinor} />
          </TabPanel>
          <TabPanel id="major">
            <MajorArcanaPanel
              arcanaMajor={arcanaMajor}
              arcanaMajorRef={arcanaMajorRef}
              saveMajor={saveMajor}
              saveCharacterData={onSave}
              adjustCharacterStats={adjustCharacterStats}
            />
          </TabPanel>
        </Suspense>
      </Tabs>
    </div>
  );
};
