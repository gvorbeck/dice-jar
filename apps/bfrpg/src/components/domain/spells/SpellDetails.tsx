import { Badge, Card, Typography } from '@/components/ui/core/display';
import { TextHeader } from '@/components/ui/composite/TextHeader';
import { cn } from '@dice-jar/cn';
import type { Spell, Cantrip } from '@/types';
import './SpellDetails.css';

interface SpellDetailsProps {
  spell: (Spell | Cantrip) & {
    spellLevel?: number;
    uniqueKey?: string;
  };
  showFullDescription?: boolean;
  showAccessibilityLabels?: boolean;
  className?: string;
}

export default function SpellDetails({ spell, showFullDescription = true, showAccessibilityLabels = true, className }: SpellDetailsProps) {
  const spellLevel = spell.spellLevel ?? ('level' in spell ? 1 : 0);
  const uniqueKey = spell.uniqueKey ?? spell.name.toLowerCase().replace(/\s+/g, '-');
  const hasRangeAndDuration = 'range' in spell && 'duration' in spell;

  return (
    <div
      className={cn('spell-details', className)}
      role="article"
      aria-labelledby={showAccessibilityLabels ? `spell-${uniqueKey}-name` : undefined}
    >
      {/* Hidden spell name for screen readers */}
      {showAccessibilityLabels && (
        <Typography variant="h4" as="h4" id={`spell-${uniqueKey}-name`} className="sr-only">
          {spell.name} - {spellLevel === 0 ? 'Cantrip' : `Level ${spellLevel} Spell`}
        </Typography>
      )}

      {/* Spell Details */}
      <div
        className="spell-details-facts"
        data-wide={hasRangeAndDuration || undefined}
        role="group"
        aria-labelledby={showAccessibilityLabels ? `spell-${uniqueKey}-name` : undefined}
      >
        <Card variant="nested" className="spell-detail">
          <TextHeader
            variant="h6"
            size="sm"
            underlined={false}
            {...(showAccessibilityLabels && {
              id: `spell-${uniqueKey}-level-label`,
            })}
          >
            Level
          </TextHeader>
          <div>
            <Badge variant="status" aria-labelledby={showAccessibilityLabels ? `spell-${uniqueKey}-level-label` : undefined}>
              {spellLevel === 0 ? 'Cantrip' : `Level ${spellLevel}`}
            </Badge>
          </div>
        </Card>

        {hasRangeAndDuration && (
          <>
            <Card variant="nested" className="spell-detail">
              <TextHeader
                variant="h6"
                size="sm"
                underlined={false}
                {...(showAccessibilityLabels && {
                  id: `spell-${uniqueKey}-range-label`,
                })}
              >
                Range
              </TextHeader>
              <Typography variant="caption" aria-labelledby={showAccessibilityLabels ? `spell-${uniqueKey}-range-label` : undefined}>
                {'range' in spell ? String(spell.range) : ''}
              </Typography>
            </Card>

            <Card variant="nested" className="spell-detail">
              <TextHeader
                variant="h6"
                size="sm"
                underlined={false}
                {...(showAccessibilityLabels && {
                  id: `spell-${uniqueKey}-duration-label`,
                })}
              >
                Duration
              </TextHeader>
              <Typography variant="caption" aria-labelledby={showAccessibilityLabels ? `spell-${uniqueKey}-duration-label` : undefined}>
                {'duration' in spell ? String(spell.duration) : ''}
              </Typography>
            </Card>
          </>
        )}
      </div>

      {/* Spell Description */}
      {showFullDescription && (
        <Card variant="nested" className="spell-detail" data-about>
          <Typography variant="subHeading" id={showAccessibilityLabels ? `spell-${uniqueKey}-description-label` : undefined}>
            Description
          </Typography>
          <Typography variant="description" aria-labelledby={showAccessibilityLabels ? `spell-${uniqueKey}-description-label` : undefined}>
            {spell.description}
          </Typography>
        </Card>
      )}
    </div>
  );
}
