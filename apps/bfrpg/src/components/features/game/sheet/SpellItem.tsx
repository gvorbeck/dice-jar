import { memo } from 'react';
import { Card, Typography, Badge } from '@/components/ui/core/display';
import { StatCard, TextHeader } from '@/components/ui/composite';
import type { Spell } from '@/types';
import './SpellItem.css';

interface SpellItemProps {
  spell: Spell;
}

export const SpellItem = memo(({ spell }: SpellItemProps) => {
  const uniqueKey = `spell-${spell.name.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="spell-ref" role="article" aria-labelledby={`${uniqueKey}-name`}>
      {/* Spell name */}
      <TextHeader variant="h4" size="md" id={`${uniqueKey}-name`} underlined={true}>
        {spell.name}
      </TextHeader>

      {/* Spell Properties */}
      <Card variant="nested">
        <TextHeader variant="h5" size="sm" underlined={false}>
          Spell Properties
        </TextHeader>
        <div className="spell-ref-facts">
          <StatCard label="Range" value={spell.range} size="sm" />

          <StatCard label="Duration" value={spell.duration} size="sm" />

          <div className="spell-ref-classes">
            <Typography variant="caption" id={`${uniqueKey}-classes-label`}>
              Classes & Levels
            </Typography>
            <div>
              {Object.entries(spell.level).map(([classId, level]) =>
                level !== null ? (
                  <Badge key={classId} variant="status" size="sm">
                    {classId.replace('-', ' ')}: {level}
                  </Badge>
                ) : null,
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Spell Description */}
      <Card variant="nested" className="spell-ref-about">
        <TextHeader variant="h5" size="sm" underlined={false} id={`${uniqueKey}-description-label`}>
          Description
        </TextHeader>
        <Typography variant="description" aria-labelledby={`${uniqueKey}-description-label`}>
          {spell.description}
        </Typography>
      </Card>
    </div>
  );
});

SpellItem.displayName = 'SpellItem';
