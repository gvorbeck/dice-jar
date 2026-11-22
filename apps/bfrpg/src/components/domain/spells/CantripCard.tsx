import { Card, Typography, Badge } from '@/components/ui/core/display';
import { Button } from '@/components/ui/core/primitives';
import { Icon } from '@/components/ui';
import type { Cantrip } from '@/types';
import type { SpellTypeInfo } from '@/types';
import './CantripCard.css';

interface CantripCardProps {
  cantrip: Cantrip;
  spellTypeInfo: SpellTypeInfo;
  onRemove?: (cantripName: string) => void;
  showRemove?: boolean;
  className?: string;
}

export default function CantripCard({ cantrip, spellTypeInfo, onRemove, showRemove = true, className }: CantripCardProps) {
  return (
    <Card
      className={className}
      variant="standard"
      role="article"
      aria-labelledby={`cantrip-${cantrip.name.replace(/\s+/g, '-').toLowerCase()}-title`}
    >
      <div className="cantrip-card-row">
        <div className="cantrip-card-main">
          <div className="cantrip-card-title">
            <Icon name="lightning" size="md" aria-hidden={true} />
            <Typography variant="subHeading" id={`cantrip-${cantrip.name.replace(/\s+/g, '-').toLowerCase()}-title`}>
              {cantrip.name}
            </Typography>
            <Badge variant="status" aria-label={`This is a ${spellTypeInfo.singular}`}>
              {spellTypeInfo.capitalizedSingular}
            </Badge>
          </div>
          <Typography variant="caption" aria-describedby={`cantrip-${cantrip.name.replace(/\s+/g, '-').toLowerCase()}-title`}>
            {cantrip.description}
          </Typography>
        </div>
        {showRemove && onRemove && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(cantrip.name)}
            className="cantrip-remove"
            aria-label={`Remove ${cantrip.name} ${spellTypeInfo.singular}`}
            icon="trash"
          />
        )}
      </div>
    </Card>
  );
}
