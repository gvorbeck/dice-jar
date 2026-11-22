import { memo, useMemo } from 'react';
import type { GamePlayer } from '@/types';
import { Typography, Card, Badge, Image } from '@/components/ui/core/display';
import { Button } from '@/components/ui/core/primitives';
import { getClassById, getRaceById, getImportantAbilities } from '@/utils';
import { ABILITY_BADGE_VARIANTS } from '@/constants';
import { truncateText } from '@/utils';
import type { SpecialAbility } from '@/types';
import './PlayerCard.css';

interface PlayerCardProps {
  player: GamePlayer;
  getResolvedData: (
    userId: string,
    characterId: string,
  ) =>
    | {
        characterName?: string | undefined;
        avatar?: string | undefined;
        race?: string | undefined;
        class?: string | undefined;
        level?: number | undefined;
      }
    | undefined;
  onDelete?: (player: GamePlayer) => void;
}

export const PlayerCard = memo(({ player, getResolvedData, onDelete }: PlayerCardProps) => {
  // Generate initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get resolved data from the resolver hook
  const resolved = getResolvedData(player.user, player.character);

  // Use resolved names if available, fallback to IDs
  const characterName = resolved?.characterName || player.character;
  const avatar = resolved?.avatar;
  const characterRace = resolved?.race;
  const characterLevel = resolved?.level;

  // Character sheet URL
  const characterSheetUrl = `/u/${player.user}/c/${player.character}`;

  // Get special abilities from race and classes
  const specialAbilities = useMemo(() => {
    const abilities: Array<{
      name: string;
      source: 'race' | 'class';
      effects?: SpecialAbility['effects'];
    }> = [];

    const currentClass = resolved?.class || '';

    // Add race abilities
    if (characterRace) {
      const race = getRaceById(characterRace);
      if (race) {
        race.specialAbilities.forEach((ability) => {
          abilities.push({
            name: ability.name,
            source: 'race',
            effects: ability.effects,
          });
        });
      }
    }

    // Add class abilities
    if (currentClass) {
      const characterClass = getClassById(currentClass);
      if (characterClass) {
        characterClass.specialAbilities.forEach((ability) => {
          abilities.push({
            name: ability.name,
            source: 'class',
            effects: ability.effects,
          });
        });
      }
    }

    return abilities;
  }, [characterRace, resolved?.class]);

  // Filter for key abilities to display as badges
  const importantAbilities = useMemo(() => {
    return getImportantAbilities(specialAbilities);
  }, [specialAbilities]);

  return (
    <Card variant="standard" size="compact" className="player">
      <div className="player-body">
        <div className="player-head">
          <Image variant="avatar" size="sm" src={avatar || ''} alt="" fallback={getInitials(characterName)} />

          <div className="player-who">
            <Typography variant="bodySmall" weight="medium" as="h3" className="player-name">
              {characterName}
            </Typography>

            {/* Character Level and Race/Class info */}
            {(characterLevel || characterRace || resolved?.class) && (
              <div className="player-meta">
                {characterLevel && `Level ${characterLevel} `}
                {characterRace && <span>{characterRace}</span>}
                {resolved?.class && (
                  <span>
                    {characterRace ? ' ' : ''}
                    {resolved.class}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Special Abilities Badges */}
        {importantAbilities.length > 0 && (
          <div className="player-abilities">
            {importantAbilities.map((ability, index) => {
              let variant: 'status' | 'supplemental' | 'primary' | 'secondary' | 'warning' | 'danger' | 'success' = 'secondary';
              let displayText = ability.name;

              // Special formatting for darkvision with range
              if (ability.effects?.darkvision) {
                displayText = `DV ${ability.effects.darkvision.range}'`;
                variant = 'primary';
              } else {
                const abilityName = ability.name.toLowerCase();

                // Use mapping for common abilities, fall back to source-based variants
                const mappedVariant = Object.entries(ABILITY_BADGE_VARIANTS).find(([key]) => abilityName.includes(key))?.[1];

                if (mappedVariant) {
                  variant = mappedVariant;
                } else if (ability.source === 'race') {
                  variant = 'supplemental';
                } else if (ability.source === 'class') {
                  variant = 'status';
                }

                // Truncate long ability names
                displayText = truncateText(displayText, 12);
              }

              return (
                <Badge
                  key={`ability-${ability.name}-${ability.source}-${index}`}
                  variant={variant}
                  size="sm"
                  title={`${ability.name} (${ability.source})`}
                >
                  {displayText}
                </Badge>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Buttons - Always at bottom */}
      <div className="player-actions">
        <Button
          variant="ghost"
          size="sm"
          className="player-act"
          title={`View ${characterName}'s character sheet`}
          aria-label={`View ${characterName}'s character sheet`}
          onClick={() => window.open(characterSheetUrl, '_blank')}
          icon="eye"
          iconSize="sm"
        ></Button>
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="player-act"
            data-danger
            title={`Remove ${characterName} from game`}
            aria-label={`Remove ${characterName} from game`}
            onClick={() => {
              onDelete(player);
            }}
            icon="trash"
            iconSize="sm"
          ></Button>
        )}
      </div>
    </Card>
  );
});

PlayerCard.displayName = 'PlayerCard';
