import { useState, useMemo, useCallback } from 'react';
import { Card, Typography } from '@/components/ui/core/display';
import { Icon } from '@/components/ui';
import { InfoCardHeader, MarkdownText } from '@/components/ui/composite';
import { TextInput, Checkbox } from '@/components/ui/core/primitives';
import type { Character, Spell } from '@/types';
import './SpellChecklistSelector.css';

interface SpellChecklistSelectorProps {
  character: Character;
  availableSpells: Spell[];
  onSpellsChange: (spells: Spell[]) => void;
  title?: string;
  description?: string;
  isLoading?: boolean;
  headerTitle?: string;
}

export function SpellChecklistSelector({
  character,
  availableSpells,
  onSpellsChange,
  title = 'Available Spells',
  description = 'Select all spells your custom class should know. You can choose as many as appropriate for your class.',
  isLoading = false,
  headerTitle,
}: SpellChecklistSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Group spells by level for better organization
  const spellsByLevel = useMemo(() => {
    const filtered = availableSpells.filter((spell) => spell.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const grouped = filtered.reduce(
      (acc, spell) => {
        // Get the minimum level across all classes for this spell
        const levels = Object.values(spell.level).filter((level) => level !== null && level !== undefined);
        const minLevel = levels.length > 0 ? Math.min(...levels) : 1; // Default to level 1 if no valid levels

        if (!acc[minLevel]) {
          acc[minLevel] = [];
        }
        acc[minLevel].push(spell);
        return acc;
      },
      {} as Record<number, Spell[]>,
    );

    // Sort spells within each level alphabetically
    Object.keys(grouped).forEach((level) => {
      const levelSpells = grouped[parseInt(level)];
      if (levelSpells) {
        levelSpells.sort((a, b) => a.name.localeCompare(b.name));
      }
    });

    return grouped;
  }, [availableSpells, searchTerm]);

  const selectedSpellNames = useMemo(() => new Set(character.spells?.map((s) => s.name) || []), [character.spells]);

  const handleSpellToggle = useCallback(
    (spell: Spell, checked: boolean) => {
      const currentSpells = character.spells || [];

      if (checked) {
        // Add spell if not already present
        const isAlreadySelected = currentSpells.some((s) => s.name === spell.name);
        if (!isAlreadySelected) {
          onSpellsChange([...currentSpells, spell]);
        }
      } else {
        // Remove spell
        onSpellsChange(currentSpells.filter((s) => s.name !== spell.name));
      }
    },
    [character.spells, onSpellsChange],
  );

  if (isLoading) {
    return (
      <section className="step-block">
        <Typography variant="sectionHeading">{title}</Typography>
        <Card variant="standard">
          <div className="spell-checks-loading">
            <div>
              <Typography variant="body" color="muted">
                Loading spells...
              </Typography>
            </div>
          </div>
        </Card>
      </section>
    );
  }

  if (availableSpells.length === 0) {
    return null;
  }

  return (
    <section className="step-block">
      <Typography variant="sectionHeading">{title}</Typography>

      <Card variant="standard">
        <InfoCardHeader icon={<Icon name="star" />} title={headerTitle || title} iconSize="lg" badge={{ text: 'Custom' }} spacing="roomy" />

        <div className="spell-checks-about">
          <MarkdownText content={description} variant="description" />
        </div>

        {/* Search Filter */}
        <div className="spell-checks-search">
          <TextInput value={searchTerm} onChange={setSearchTerm} placeholder="Search spells..." aria-label="Search spells" />
        </div>

        {/* Selected Count */}
        <div className="spell-checks-count">
          <Typography variant="body">
            Selected: {selectedSpellNames.size} spell
            {selectedSpellNames.size !== 1 ? 's' : ''}
          </Typography>
        </div>

        {/* Spell Lists by Level */}
        <div className="spell-checks-levels">
          {Object.entries(spellsByLevel)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([level, spells]) => (
              <div key={level}>
                <Typography variant="subHeading">
                  <Icon name="lightning" size="sm" />
                  Level {level} Spells ({spells.length})
                </Typography>

                <div className="spell-checks-grid">
                  {spells.map((spell, spellIndex) => (
                    <Checkbox
                      key={`${spell.name}-${spell.level}-${spellIndex}`}
                      label={spell.name}
                      checked={selectedSpellNames.has(spell.name)}
                      onCheckedChange={(checked) => handleSpellToggle(spell, checked)}
                      size="sm"
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>

        {searchTerm && Object.keys(spellsByLevel).length === 0 && (
          <div className="spell-checks-none">
            <Typography variant="body" color="muted">
              No spells found matching "{searchTerm}"
            </Typography>
          </div>
        )}
      </Card>
    </section>
  );
}
