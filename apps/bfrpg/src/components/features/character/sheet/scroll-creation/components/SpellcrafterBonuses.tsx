import { Card } from '@/components/ui/core/display';
import { SectionHeader } from '@/components/ui/composite';
import { Icon } from '@/components/ui/core/display';
import './../ScrollCreation.css';

interface SpellcrafterBonusesProps {
  bonuses: {
    researchRollBonus: number;
    timeReduction: number;
    costReduction: number;
  };
}

export const SpellcrafterBonuses = ({ bonuses }: SpellcrafterBonusesProps) => {
  return (
    <div className="scrolls-block">
      <SectionHeader title="Spellcrafter Bonuses" size="md" />
      <Card size="compact">
        <div className="scroll-bonuses">
          <div>
            <Icon name="star" size="sm" />+{bonuses.researchRollBonus}% research roll bonus
          </div>
          {bonuses.timeReduction > 0 && (
            <div>
              <Icon name="lightning" size="sm" />
              {bonuses.timeReduction}% time reduction (6th level)
            </div>
          )}
          {bonuses.costReduction > 0 && (
            <div>
              <Icon name="coin" size="sm" />
              {bonuses.costReduction}% cost reduction (9th level)
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
