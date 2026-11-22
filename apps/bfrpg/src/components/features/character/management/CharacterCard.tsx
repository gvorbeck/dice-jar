import { Typography, Badge } from '@/components/ui';
import { BaseCard, StatusDot, StatCard } from '@/components/ui/composite';
import type { CharacterListItem } from '@/services';
import { memo } from 'react';
import { useCharacterCard } from '@/hooks';
import { formatLargeNumber } from '@/utils';
import './CharacterCard.css';

interface CharacterCardProps {
  character: CharacterListItem;
  user: { uid: string } | null;
  onDelete: (characterId: string, characterName: string) => void;
  isDeleting?: boolean;
}

const CharacterCard = memo(function CharacterCard({ character, user, onDelete, isDeleting }: CharacterCardProps) {
  const { raceName, classNames, handleCopyUrl } = useCharacterCard(character);
  const href = `/u/${user?.uid}/c/${character.id}`;

  return (
    <BaseCard
      id={character.id}
      name={character.name}
      user={user}
      href={href}
      onDelete={onDelete}
      onCopy={handleCopyUrl}
      isDeleting={isDeleting || false}
    >
      {/* Character Header */}
      <div className="char-head">
        <div>
          <Typography variant="h4" as="h3" className="char-name">
            {character.name}
          </Typography>
          {character.level && (
            <Typography variant="helper" className="char-level">
              Level {character.level}
            </Typography>
          )}
        </div>
      </div>

      {/* Character Race/Class Info */}
      {raceName && classNames.length > 0 && (
        <div className="char-kind">
          <div className="char-kind-head">
            <StatusDot status="active" ariaLabel="Character race and class information" />
            <Typography variant="helper" className="char-kind-label">
              Race & Class
            </Typography>
          </div>
          <div className="char-tags">
            <Badge variant="primary" size="sm" className="char-race">
              {raceName}
            </Badge>
            <div className="char-classes">
              {classNames.map((classItem) => (
                <Badge key={classItem.id} variant="secondary" size="sm" className="char-class">
                  {classItem.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Character Stats/Info (if available) */}
      {(character.hp || character.xp !== undefined) && (
        <div className="char-stats">
          {character.hp && (
            <StatCard
              label="Health"
              value={
                typeof character.hp === 'object' && character.hp.max
                  ? `${character.hp.current || 0}/${character.hp.max}`
                  : String(character.hp)
              }
              size="sm"
            />
          )}
          {character.xp !== undefined && (
            <StatCard
              label="XP"
              value={formatLargeNumber(character.xp)}
              size="sm"
              fullName={`Experience Points: ${character.xp.toLocaleString()}`}
            />
          )}
        </div>
      )}
    </BaseCard>
  );
});

export { CharacterCard };
