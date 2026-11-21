import type { Character, Spell } from '@/types';
import type { SelectOption } from '@/components/ui/core/primitives/Select';
import { Typography, Badge } from '@/components/ui/core/display';
import { Button, Select, FormField } from '@/components/ui/core/primitives';
import { Accordion } from '@/components/ui/core/layout';
import { SkeletonList } from '@/components/ui/core/feedback';
import { SectionHeader } from '@/components/ui/composite';
import SpellDetails from '@/components/domain/spells/SpellDetails';
import './PreparedSpellsSection.css';

interface PreparedSpellsSectionProps {
  character: Character;
  spellSlots: Record<number, number>;
  availableSpells: Record<number, Spell[]>;
  loadingSpells: boolean;
  canEdit: boolean;
  preparedSpells: Spell[];
  onSpellPreparation: (level: number, index: number, spellName: string) => void;
  onClearPreparation: (level: number, index: number) => void;
  getPreparedSpellForSlot: (level: number, index: number) => Spell | null;
}

export default function PreparedSpellsSection({
  spellSlots,
  availableSpells,
  loadingSpells,
  canEdit,
  preparedSpells,
  onSpellPreparation,
  onClearPreparation,
  getPreparedSpellForSlot,
}: PreparedSpellsSectionProps) {
  const hasSpellSlots = Object.keys(spellSlots).length > 0;

  if (!hasSpellSlots) {
    return null;
  }

  return (
    <section className="prepared" aria-labelledby="prepared-spells-heading">
      <SectionHeader
        title="Daily Spell Preparation"
        extra={
          preparedSpells.length > 0 && (
            <Badge variant="primary" size="sm">
              {preparedSpells.length}
            </Badge>
          )
        }
      />

      <Typography variant="caption" className="prepared-note">
        You can prepare any spell of a level for which you have slots. Choose wisely - these are your spells for the day.
      </Typography>

      {loadingSpells ? (
        <SkeletonList items={3} showAvatar={false} label="Loading available spells..." />
      ) : (
        <div className="prepared-levels">
          {Object.entries(spellSlots)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([levelStr, slotCount]) => {
              const level = parseInt(levelStr);
              const availableForLevel = availableSpells[level] || [];

              return (
                <div key={level} className="prep-level-block">
                  <Typography variant="subHeading" className="prep-level">
                    <Badge variant="primary" size="sm">
                      {level}
                    </Badge>
                    Level {level} Spells ({slotCount} slot
                    {slotCount !== 1 ? 's' : ''})
                  </Typography>

                  <div className="prep-slots">
                    {Array.from({ length: slotCount }, (_, index) => {
                      const preparedSpell = getPreparedSpellForSlot(level, index);
                      const selectOptions: SelectOption[] = [
                        { value: '', label: 'Select a spell' },
                        ...availableForLevel.map((spell) => ({
                          value: spell.name,
                          label: spell.name,
                        })),
                      ];

                      return (
                        <div key={`${level}-${index}`} className="prep-slot">
                          <div className="prep-slot-row">
                            <div>
                              {canEdit ? (
                                <Select
                                  label={`Slot ${index + 1}`}
                                  options={selectOptions}
                                  value={preparedSpell?.name || ''}
                                  placeholder="Select a spell"
                                  onValueChange={(spellName) => {
                                    if (spellName) {
                                      onSpellPreparation(level, index, spellName);
                                    } else {
                                      onClearPreparation(level, index);
                                    }
                                  }}
                                  disabled={availableForLevel.length === 0}
                                />
                              ) : (
                                <FormField label={`Slot ${index + 1}`}>
                                  <div className="prep-readonly">
                                    <Typography variant="body">{preparedSpell?.name || 'No spell prepared'}</Typography>
                                  </div>
                                </FormField>
                              )}
                            </div>

                            {canEdit && preparedSpell && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onClearPreparation(level, index)}
                                icon="close"
                                iconSize="sm"
                                className="prep-clear"
                              >
                                Clear
                              </Button>
                            )}
                          </div>

                          {preparedSpell && (
                            <Accordion
                              items={[
                                {
                                  ...preparedSpell,
                                  uniqueKey: `prepared-${level}-${index}`,
                                },
                              ]}
                              sortBy="name"
                              labelProperty="name"
                              renderItem={(spell) => <SpellDetails spell={spell} />}
                              showSearch={false}
                              showCounts={false}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </section>
  );
}
