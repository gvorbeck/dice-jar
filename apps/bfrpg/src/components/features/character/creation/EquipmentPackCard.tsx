import { memo } from 'react';
import { Card, Typography, Badge } from '@/components/ui/core/display';
import { Icon, Button } from '@/components/ui';
import Details from '@/components/ui/composite/Details';
import type { EquipmentPack } from '@/types';
import { findEquipmentById } from '@/utils/equipment';
import './EquipmentPackCard.css';

interface EquipmentPackCardProps {
  pack: EquipmentPack;
  isSelected: boolean;
  isRecommended: boolean;
  isAffordable: boolean;
  characterClasses: string;
  onSelect: (pack: EquipmentPack) => void;
  onConfirm?: (pack: EquipmentPack) => void;
  isLoading?: boolean;
}

function EquipmentPackCard({
  pack,
  isSelected,
  isRecommended,
  isAffordable,
  characterClasses,
  onSelect,
  onConfirm,
  isLoading = false,
}: EquipmentPackCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't select the pack if clicking on the confirm button or if not affordable
    if ((e.target as HTMLElement).closest('button')) return;
    if (!isAffordable) return;
    onSelect(pack);
  };

  return (
    <Card
      variant={isSelected ? 'success' : 'standard'}
      className="pack"
      data-selected={isSelected || undefined}
      data-affordable={isAffordable || undefined}
      onClick={handleCardClick}
    >
      <div className="pack-head">
        <div>
          <Typography variant="h6">{pack.name}</Typography>
          <div className="pack-badges">
            {isRecommended && (
              <Badge variant="success" size="sm">
                Recommended for {characterClasses}
              </Badge>
            )}
            {!isAffordable && (
              <Badge variant="danger" size="sm">
                Not enough gold
              </Badge>
            )}
          </div>
          <Typography variant="bodySmall" color="secondary">
            {pack.description}
          </Typography>
        </div>
      </div>

      <div className="pack-costs">
        <div>
          <div className="pack-coin">
            <Icon name="coin" size="sm" />
            <span className="pack-cost">{pack.cost} gp</span>
          </div>
          <div>
            <Icon name="weight" size="sm" />
            <span className="pack-weight">{pack.weight} lb</span>
          </div>
        </div>
      </div>

      <Details
        items={[
          {
            label: `View contents (${pack.items.length} items)`,
            children: (
              <div className="pack-items">
                {pack.items.map((item, index) => {
                  const equipment = findEquipmentById(item.equipmentId);
                  const equipmentName = equipment?.name || `Unknown (${item.equipmentId})`;

                  return (
                    <div key={index}>
                      <span>
                        {item.quantity}× {equipmentName}
                      </span>
                    </div>
                  );
                })}
              </div>
            ),
          },
        ]}
        layout="cards"
        size="sm"
      />

      {isSelected && onConfirm && (
        <div className="pack-confirm">
          <Button
            onClick={() => {
              onConfirm(pack);
            }}
            loading={isLoading}
            disabled={isLoading || !isAffordable}
            icon="check"
            iconSize="sm"
          >
            {isAffordable ? `Equip This Pack (${pack.cost} gp)` : `Cannot Afford (${pack.cost} gp)`}
          </Button>
        </div>
      )}
    </Card>
  );
}

export default memo(EquipmentPackCard);
