import { Button } from '@/components/ui/core/primitives';
import { Typography, Card, Badge, Image } from '@/components/ui/core/display';
import type { CombatantWithInitiative } from '@/types';
import './Combat.css';

interface CombatantCardProps {
  combatant: CombatantWithInitiative;
  index: number;
  variant: 'combat' | 'available';
  onAction?: (action: string, index: number) => void;
  isActive?: boolean;
}

export default function CombatantCard({ combatant, index, variant, onAction, isActive = false }: CombatantCardProps) {
  return (
    <Card
      size="compact"
      hover
      className="combatant"
      data-active={isActive || undefined}
      role="listitem"
      aria-label={`${combatant.name}, ${combatant.isPlayer ? 'Player' : 'Monster'}, AC ${combatant.ac}`}
    >
      <div className="combatant-row">
        <div className="combatant-who">
          {combatant.avatar && typeof combatant.avatar === 'string' && (
            <Image variant="avatar" size="xs" src={combatant.avatar} alt={`${combatant.name} avatar`} />
          )}
          <div>
            <div className="combatant-name">
              <Typography variant="body" color="zinc">
                {combatant.name}
              </Typography>
              {combatant.isPlayer && (
                <Badge variant="secondary" size="sm">
                  PLAYER
                </Badge>
              )}
            </div>
            <Typography variant="bodySmall" color="secondary">
              AC {combatant.ac}
            </Typography>
          </div>
        </div>
        {variant === 'combat' ? (
          <Button
            onClick={() => onAction?.('remove', index)}
            variant="destructive"
            size="sm"
            icon="trash"
            iconSize="sm"
            aria-label={`Remove ${combatant.name} from combat`}
          />
        ) : (
          <Button onClick={() => onAction?.('add', index)} variant="primary" size="sm" aria-label={`Add ${combatant.name} to combat`}>
            Add to Combat
          </Button>
        )}
      </div>
    </Card>
  );
}
