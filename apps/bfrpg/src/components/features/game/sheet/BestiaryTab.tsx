import { memo, useCallback } from 'react';
import { useLoad } from '@dice-jar/browser';
import { Accordion } from '@/components/ui/core/layout';
import { Card, Typography } from '@/components/ui/core/display';
import { LoadingState } from '@/components/ui/core/feedback';
import { CACHE_KEYS } from '@/constants';
import { GM_BINDER_MESSAGES } from '@/constants';
import { categorizeMonster, createSearchableText } from '@/utils';
import { MonsterItem } from './MonsterItem';
import type { Monster, MonsterWithCategory } from '@/types';
import type { GameCombatant } from '@/types';

/** The bestiary, each monster with its category and search text. The import is cached, so later loads are quick. */
const loadMonsters = async (): Promise<MonsterWithCategory[]> => {
  const { default: allMonsters } = await import('@/data/monsters.json');
  return (allMonsters as Monster[]).map((monster) => ({
    ...monster,
    category: categorizeMonster(monster),
    searchableText: createSearchableText(monster),
  }));
};

interface BestiaryTabProps {
  onAddToCombat?: ((combatant: GameCombatant) => void) | undefined;
}

export const BestiaryTab = memo(({ onAddToCombat }: BestiaryTabProps) => {
  const { data, error } = useLoad(CACHE_KEYS.GM_BINDER_MONSTERS, loadMonsters);
  const isLoading = !data && !error;
  const monsters = data ?? [];

  const renderMonsterItem = useCallback(
    (monster: MonsterWithCategory) => <MonsterItem monster={monster} onAddToCombat={onAddToCombat} />,
    [onAddToCombat],
  );

  if (isLoading) {
    return <LoadingState message={GM_BINDER_MESSAGES.LOADING_MONSTERS} />;
  }

  if (monsters.length === 0) {
    return (
      <Card variant="standard" className="empty-card">
        <Typography variant="body">{GM_BINDER_MESSAGES.NO_MONSTERS}</Typography>
      </Card>
    );
  }

  return (
    <Accordion
      items={monsters}
      sortBy="category"
      searchPlaceholder="Search monsters by name..."
      renderItem={renderMonsterItem}
      showCounts={true}
      showSearch={true}
    />
  );
});

BestiaryTab.displayName = 'BestiaryTab';
