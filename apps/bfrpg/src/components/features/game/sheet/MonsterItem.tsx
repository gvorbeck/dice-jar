import { memo, useCallback } from 'react';
import { Card, Typography } from '@/components/ui/core/display';
import { Button } from '@/components/ui/core/primitives';
import { MarkdownText, TextHeader } from '@/components/ui/composite';
import { MonsterStatsDisplay } from './MonsterStatsDisplay';
import type { Monster } from '@/types';
import type { GameCombatant } from '@/types';
import './MonsterItem.css';

interface MonsterItemProps {
  monster: Monster;
  onAddToCombat?: ((combatant: GameCombatant) => void) | undefined;
}

export const MonsterItem = memo(({ monster, onAddToCombat }: MonsterItemProps) => {
  const hasVariants = monster.variants && monster.variants.length > 0;
  const uniqueKey = `monster-${monster.name.toLowerCase().replace(/\s+/g, '-')}`;

  // Helper function to add a specific variant to combat
  const handleAddToCombat = useCallback(
    (variantIndex: number = 0) => {
      if (!onAddToCombat) return;

      // Import the conversion utility
      import('@/utils').then(({ monsterToCombatant }) => {
        const combatant = monsterToCombatant(monster, variantIndex);
        onAddToCombat(combatant);
      });
    },
    [monster, onAddToCombat],
  );

  return (
    <div className="monster" role="article" aria-labelledby={`${uniqueKey}-name`}>
      {/* Hidden monster name for screen readers */}
      <Typography variant="h4" as="h4" id={`${uniqueKey}-name`} className="sr-only">
        {monster.name} - Monster Reference
      </Typography>

      {hasVariants ? (
        <div className="monster-variants">
          {/* Show main monster name */}
          <TextHeader variant="h4" size="md" underlined={true}>
            {monster.name}
          </TextHeader>

          {monster.variants?.map(([variantName, stats], index) => (
            <Card key={variantName || `variant-${index}`} variant="nested" size="compact">
              {variantName && (
                <TextHeader variant="h5" size="sm" underlined={false} className="monster-variant-name">
                  {variantName}
                </TextHeader>
              )}
              <MonsterStatsDisplay stats={stats} />

              {/* Add to Combat button */}
              {onAddToCombat && (
                <div className="monster-add">
                  <Button
                    onClick={() => handleAddToCombat(index)}
                    variant="secondary"
                    size="sm"
                    icon="plus"
                    iconSize="sm"
                    aria-label={`Add ${variantName ? `${monster.name} (${variantName})` : monster.name} to Combat Tracker`}
                  >
                    Add to Combat
                  </Button>
                </div>
              )}

              {/* Additional info */}
              <div className="monster-more">
                <div className="monster-facts">
                  <div>
                    <span>Appears:</span> <span>{stats.numAppear || '—'}</span>
                  </div>
                  <div>
                    <span>Save As:</span> <span>{stats.saveAs || '—'}</span>
                  </div>
                  <div>
                    <span>Treasure:</span> <span>{stats.treasure || '—'}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {/* Monster description for variants */}
          {monster.description && (
            <Card variant="nested" size="compact">
              <TextHeader variant="h5" size="sm" underlined={false}>
                Description
              </TextHeader>
              <MarkdownText content={monster.description} />
            </Card>
          )}
        </div>
      ) : (
        <div className="monster-single">
          {/* Show main monster name */}
          <TextHeader variant="h4" size="md" underlined={true}>
            {monster.name}
          </TextHeader>

          <MonsterStatsDisplay stats={monster} />

          {/* Add to Combat button */}
          {onAddToCombat && (
            <div className="monster-add">
              <Button
                onClick={() => handleAddToCombat(0)}
                variant="secondary"
                size="sm"
                icon="plus"
                iconSize="sm"
                aria-label={`Add ${monster.name} to Combat Tracker`}
              >
                Add to Combat
              </Button>
            </div>
          )}

          {/* Additional info for non-variant monsters */}
          {(monster.numAppear || monster.saveAs || monster.treasure) && (
            <Card variant="nested" className="monster-extra">
              <TextHeader variant="h5" size="sm" underlined={false}>
                Additional Details
              </TextHeader>
              <div className="monster-facts">
                {monster.numAppear && (
                  <div>
                    <span>Appears:</span> <span>{monster.numAppear}</span>
                  </div>
                )}
                {monster.saveAs && (
                  <div>
                    <span>Save As:</span> <span>{monster.saveAs}</span>
                  </div>
                )}
                {monster.treasure && (
                  <div>
                    <span>Treasure:</span> <span>{monster.treasure}</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Monster description for non-variants */}
          {monster.description && (
            <Card variant="nested" size="compact">
              <TextHeader variant="h5" size="sm" underlined={false}>
                Description
              </TextHeader>
              <MarkdownText content={monster.description} />
            </Card>
          )}
        </div>
      )}
    </div>
  );
});

MonsterItem.displayName = 'MonsterItem';

// Types are now exported from @/types/monsters
