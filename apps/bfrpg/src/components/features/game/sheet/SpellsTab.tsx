import { memo, useCallback } from 'react';
import { useLoad } from '@dice-jar/browser';
import { Accordion } from '@/components/ui/core/layout';
import { Card, Typography } from '@/components/ui/core/display';
import { LoadingState } from '@/components/ui/core/feedback';
import { CACHE_KEYS } from '@/constants';
import { GM_BINDER_MESSAGES } from '@/constants';
import { categorizeSpell } from '@/utils';
import { SpellItem } from './SpellItem';
import type { Spell } from '@/types';
import type { SpellWithCategory } from '@/types';

/** Every spell with its category. The import is cached, so later loads are quick. */
const loadSpells = async (): Promise<SpellWithCategory[]> => {
  const { default: allSpells } = await import('@/data/magic/spells.json');
  return (allSpells as Spell[]).map((spell) => ({ ...spell, category: categorizeSpell(spell) }));
};

export const SpellsTab = memo(() => {
  const { data, error } = useLoad(CACHE_KEYS.GM_BINDER_SPELLS, loadSpells);
  const isLoading = !data && !error;
  const spells = data ?? [];

  const renderSpellItem = useCallback((spell: SpellWithCategory) => <SpellItem spell={spell} />, []);

  if (isLoading) {
    return <LoadingState message={GM_BINDER_MESSAGES.LOADING_SPELLS} />;
  }

  if (spells.length === 0) {
    return (
      <Card variant="standard" className="empty-card">
        <Typography variant="body">{GM_BINDER_MESSAGES.NO_SPELLS}</Typography>
      </Card>
    );
  }

  return (
    <Accordion
      items={spells}
      sortBy="category"
      searchPlaceholder="Search spells by name..."
      renderItem={renderSpellItem}
      showCounts={true}
      showSearch={true}
    />
  );
});

SpellsTab.displayName = 'SpellsTab';
