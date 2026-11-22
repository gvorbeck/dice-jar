import { useCallback, useMemo, memo } from 'react';
import { useLoad } from '@dice-jar/browser';
import { Accordion, Card, InfoCardHeader, Typography } from '@/components/ui';
import { Button } from '@/components/ui';
import { Icon, type IconName } from '@/components/ui/core/display/Icon';
import { LoadingState } from '@/components/ui/core/feedback';
import type { Character, Equipment } from '@/types';
import { loadAllEquipment } from '@/services/dataLoader';
import { CACHE_KEYS } from '@/constants';
import { findById } from '@/utils';
import { convertToGoldFromAbbreviation } from '@/utils/currency';
import { allRaces, allClasses } from '@/data';
import { isEquipmentRestricted } from '@/utils/equipment';
import './EquipmentSelector.css';

type EquipmentWithIndex = Equipment & {
  [key: string]: unknown;
};

interface EquipmentSelectorProps {
  character: Character;
  onEquipmentAdd: (equipment: Equipment) => void;
}

/**
 * Helper component for displaying an icon with text in a consistent format
 */
function IconText({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  return (
    <span className="shop-icon-text">
      <Icon name={icon} size="xs" aria-hidden={true} />
      {children}
    </span>
  );
}

/**
 * Creates button text with appropriate restriction messages
 */
function createButtonText(canAfford: boolean, restrictionReason?: string): string {
  let text = 'Add';

  if (!canAfford) {
    text += " (Can't Afford)";
  }

  if (restrictionReason) {
    text += ` (${restrictionReason})`;
  }

  return text;
}

const loadEquipment = async () => (await loadAllEquipment()) as EquipmentWithIndex[];

function EquipmentSelector({ character, onEquipmentAdd }: EquipmentSelectorProps) {
  const { data, error } = useLoad(CACHE_KEYS.EQUIPMENT_ALL, loadEquipment);
  const isLoading = !data && !error;
  const allEquipment = data ?? [];

  // Memoize character restriction data to avoid recalculating on every render
  const characterRestrictionData = useMemo(() => {
    const characterRace = findById(character.race, allRaces);
    const characterClass = findById(character.class, allClasses);

    return {
      race: characterRace,
      classes: characterClass ? [characterClass] : [],
      currency: character.currency.gold,
    };
  }, [character.race, character.class, character.currency.gold]);

  const renderEquipmentItem = useCallback(
    (equipment: EquipmentWithIndex) => {
      const costDisplay = `${equipment.costValue} ${equipment.costCurrency}`;
      const weightDisplay = typeof equipment.weight === 'number' && equipment.weight > 0 ? `${equipment.weight} lbs` : '—';

      // Calculate cost in gold pieces for affordability check
      const costInGold = convertToGoldFromAbbreviation(equipment.costValue, equipment.costCurrency as 'gp' | 'sp' | 'cp' | 'ep' | 'pp');

      const canAfford = characterRestrictionData.currency >= costInGold;
      const restriction = isEquipmentRestricted(equipment, characterRestrictionData);
      const canUse = !restriction.restricted;
      const canAdd = canAfford && canUse;

      return (
        <Card variant="standard" hover>
          <div className="shop-item">
            <div>
              <div className="shop-item-name">{equipment.name}</div>
              <div className="shop-item-facts">
                <IconText icon="coin">{costDisplay}</IconText>
                <IconText icon="weight">{weightDisplay}</IconText>
                {equipment.damage && <IconText icon="damage">{equipment.damage}</IconText>}
                {equipment.AC && <IconText icon="shield">AC {equipment.AC}</IconText>}
              </div>
            </div>
            <Button onClick={() => onEquipmentAdd(equipment)} disabled={!canAdd} variant={canAdd ? 'primary' : 'secondary'} size="sm">
              {createButtonText(canAfford, !canUse ? restriction.reason : undefined)}
            </Button>
          </div>
        </Card>
      );
    },
    [characterRestrictionData, onEquipmentAdd],
  );

  return (
    <section className="step-block shop">
      <Typography variant="sectionHeading">Available Equipment</Typography>

      <Card variant="info" className="step-card">
        <InfoCardHeader icon="info" title="Shopping Guide" />
        <Typography variant="description" color="primary">
          Browse and select equipment for your character. Items are organized by category.
          <span className="shop-aside"> You can only purchase items you can afford with your current gold.</span>
        </Typography>
      </Card>

      {isLoading ? (
        <LoadingState message="Loading equipment..." />
      ) : (
        <Card variant="standard" className="shop-card">
          <Accordion items={allEquipment} sortBy="category" searchPlaceholder="Search equipment..." renderItem={renderEquipmentItem} />
        </Card>
      )}
    </section>
  );
}

export default memo(EquipmentSelector);
