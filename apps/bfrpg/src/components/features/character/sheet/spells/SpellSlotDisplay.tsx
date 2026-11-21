import { Card, Badge } from '@/components/ui/core/display';
import { SectionHeader } from '@/components/ui/composite';
import './SpellSlotDisplay.css';

interface SpellSlotDisplayProps {
  spellSlots: Record<number, number>;
}

export default function SpellSlotDisplay({ spellSlots }: SpellSlotDisplayProps) {
  const hasSpellSlots = Object.keys(spellSlots).length > 0;

  if (!hasSpellSlots) {
    return null;
  }

  return (
    <section aria-labelledby="spell-slots-heading">
      <SectionHeader title="Spell Slots per Day" dotColor="purple" className="slots-head" />
      <Card variant="nested" size="compact" className="slots-card">
        <div className="slots-list">
          {Object.entries(spellSlots)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([level, slots]) => (
              <div key={level} className="slot">
                <div className="slot-badges">
                  <Badge variant="primary" size="sm">
                    Level {level}
                  </Badge>
                  <Badge variant="warning" size="sm">
                    {slots}
                  </Badge>
                </div>
                {/* Subtle glow effect on hover */}
                <div className="slot-glow" />
              </div>
            ))}
        </div>
      </Card>
    </section>
  );
}
