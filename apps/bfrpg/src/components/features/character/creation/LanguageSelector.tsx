import { useCallback, useMemo } from 'react';
import { TextInput } from '@/components/ui/core/primitives';
import { Button, Icon } from '@/components/ui';
import { Card, Typography, Badge } from '@/components/ui/core/display';
import { allRaces } from '@/data';
import { findById } from '@/utils';
import type { Character } from '@/types';
import './LanguageSelector.css';

interface LanguageSelectorProps {
  character: Character;
  onCharacterChange: (character: Character) => void;
}

interface LanguageInputProps {
  language: string;
  index: number;
  onChange: (index: number, value: string) => void;
  onBlur: (index: number, language: string) => void;
  onRemove: (index: number) => void;
  labelPrefix: string;
}

const LanguageInput = ({ language, index, onChange, onBlur, onRemove, labelPrefix }: LanguageInputProps) => (
  <div className="lang-row">
    <div>
      <TextInput
        value={language}
        onChange={(value) => onChange(index, value)}
        onBlur={() => onBlur(index, language)}
        placeholder="Enter language name"
        maxLength={30}
        aria-label={`${labelPrefix} language ${index + 1}`}
      />
    </div>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onRemove(index)}
      aria-label={`Remove language ${index + 1}`}
      className="lang-remove"
      icon="close"
    />
  </div>
);

function LanguageSelector({ character, onCharacterChange }: LanguageSelectorProps) {
  // Calculate how many bonus languages the character can learn based on Intelligence modifier
  const maxBonusLanguages = useMemo(() => {
    return Math.max(0, character.abilities.intelligence.modifier);
  }, [character.abilities.intelligence.modifier]);

  // Get the character's race data to determine automatic languages
  const raceData = useMemo(() => {
    return findById(character.race, allRaces);
  }, [character.race]);

  const automaticLanguages = useMemo(() => {
    return raceData?.languages || ['Common'];
  }, [raceData?.languages]);

  // Get current bonus languages (languages beyond the automatic ones)
  const bonusLanguages = useMemo(() => {
    const currentLanguages = character.languages || [];
    return currentLanguages.filter((lang) => !automaticLanguages.includes(lang));
  }, [character.languages, automaticLanguages]);

  // Calculate how many more languages can be added
  const remainingSlots = useMemo(() => {
    return maxBonusLanguages - bonusLanguages.length;
  }, [maxBonusLanguages, bonusLanguages.length]);

  const handleLanguageChange = useCallback(
    (index: number, newLanguage: string) => {
      const updatedBonusLanguages = [...bonusLanguages];
      updatedBonusLanguages[index] = newLanguage;

      // Don't filter during typing - just update the array
      // Combine automatic and bonus languages
      const allLanguages = [...automaticLanguages, ...updatedBonusLanguages];

      onCharacterChange({
        ...character,
        languages: allLanguages,
      });
    },
    [character, onCharacterChange, automaticLanguages, bonusLanguages],
  );

  const handleLanguageBlur = useCallback(
    (index: number, language: string) => {
      // Clean up empty/whitespace-only languages when user moves away from field
      const trimmedLanguage = language.trim();
      if (trimmedLanguage === '') {
        // Remove empty language
        const updatedBonusLanguages = bonusLanguages.filter((_, i) => i !== index);
        const allLanguages = [...automaticLanguages, ...updatedBonusLanguages];
        onCharacterChange({
          ...character,
          languages: allLanguages,
        });
      } else if (trimmedLanguage !== language) {
        // Trim whitespace from language
        const updatedBonusLanguages = [...bonusLanguages];
        updatedBonusLanguages[index] = trimmedLanguage;
        const allLanguages = [...automaticLanguages, ...updatedBonusLanguages];
        onCharacterChange({
          ...character,
          languages: allLanguages,
        });
      }
    },
    [character, onCharacterChange, automaticLanguages, bonusLanguages],
  );

  const handleAddLanguage = useCallback(() => {
    const updatedBonusLanguages = [...bonusLanguages, ''];
    const allLanguages = [...automaticLanguages, ...updatedBonusLanguages];

    onCharacterChange({
      ...character,
      languages: allLanguages,
    });
  }, [character, onCharacterChange, automaticLanguages, bonusLanguages]);

  const handleRemoveLanguage = useCallback(
    (index: number) => {
      const updatedBonusLanguages = bonusLanguages.filter((_, i) => i !== index);
      const allLanguages = [...automaticLanguages, ...updatedBonusLanguages];

      onCharacterChange({
        ...character,
        languages: allLanguages,
      });
    },
    [character, onCharacterChange, automaticLanguages, bonusLanguages],
  );

  return (
    <div className="lang">
      <header>
        <Typography variant="sectionHeading" className="icon-heading">
          <Icon name="language" size="md" />
          Languages
        </Typography>
        <Card variant="info" size="compact">
          <Typography variant="descriptionCompact">
            All characters know their native language(s). Characters with Intelligence 13+ may learn additional languages equal to their
            Intelligence bonus (+1, +2, or +3).
          </Typography>
        </Card>
      </header>

      {/* Automatic Languages */}
      <Card variant="standard">
        <Typography variant="baseSectionHeading" className="icon-heading">
          <Icon name="check-circle" size="sm" />
          Automatic Languages
        </Typography>
        <div className="tag-list">
          {automaticLanguages.map((language, index) => (
            <Badge key={`auto-${index}`} variant="secondary" size="md" className="lang-tag">
              {language}
              <span>(automatic)</span>
            </Badge>
          ))}
        </div>
      </Card>

      {/* Bonus Languages */}
      {maxBonusLanguages > 0 && (
        <Card variant="standard">
          <Typography variant="baseSectionHeading" className="icon-heading" color="zinc">
            <Icon name="plus" size="sm" aria-hidden={true} />
            Bonus Languages
            {maxBonusLanguages > 0 && (
              <Typography variant="helper" className="lang-used">
                ({bonusLanguages.length}/{maxBonusLanguages} used)
              </Typography>
            )}
          </Typography>

          {bonusLanguages.length === 0 && maxBonusLanguages > 0 && (
            <Typography variant="body" color="secondary" className="lang-note">
              Your Intelligence bonus allows you to learn {maxBonusLanguages} additional language{maxBonusLanguages > 1 ? 's' : ''}.
            </Typography>
          )}

          <div className="lang-inputs">
            {bonusLanguages.map((language, index) => (
              <LanguageInput
                key={`bonus-${index}`}
                language={language}
                index={index}
                onChange={handleLanguageChange}
                onBlur={handleLanguageBlur}
                onRemove={handleRemoveLanguage}
                labelPrefix="Bonus"
              />
            ))}
          </div>

          <div className="lang-add">
            <Button variant="secondary" size="sm" onClick={handleAddLanguage} icon="plus">
              Add Language
              {remainingSlots > 0 ? ` (${remainingSlots} remaining)` : ''}
            </Button>
            {remainingSlots <= 0 && maxBonusLanguages > 0 && (
              <Typography variant="helper" color="amber">
                <Icon name="exclamation-triangle" size="xs" />
                Adding beyond Intelligence limit - GM discretion required
              </Typography>
            )}
          </div>
        </Card>
      )}

      {maxBonusLanguages === 0 && (
        <Card variant="standard">
          <Typography variant="baseSectionHeading" className="icon-heading" color="zinc">
            <Icon name="plus" size="sm" aria-hidden={true} />
            Additional Languages
            <Typography variant="helper" className="lang-used">
              ({bonusLanguages.length}/0 used)
            </Typography>
          </Typography>

          <Typography variant="body" color="secondary" className="lang-note">
            Your Intelligence score ({character.abilities.intelligence.value}) doesn't normally allow bonus languages, but your GM may
            permit additional languages.
          </Typography>

          <div className="lang-inputs">
            {bonusLanguages.map((language, index) => (
              <LanguageInput
                key={`bonus-${index}`}
                language={language}
                index={index}
                onChange={handleLanguageChange}
                onBlur={handleLanguageBlur}
                onRemove={handleRemoveLanguage}
                labelPrefix="Additional"
              />
            ))}
          </div>

          <div className="lang-add" data-inline>
            <Button variant="secondary" size="sm" onClick={handleAddLanguage} icon="plus">
              Add Language
            </Button>
            <Typography variant="helper" color="amber">
              <Icon name="exclamation-triangle" size="xs" />
              Beyond Intelligence limit - GM discretion required
            </Typography>
          </div>
        </Card>
      )}

      {/* Common bonus languages suggestion */}
      {maxBonusLanguages > 0 && (
        <Card variant="info">
          <Typography variant="baseSectionHeading" className="icon-heading info-tip-heading" color="amber">
            <Icon name="info" size="sm" />
            Common Languages to Consider
          </Typography>
          <Typography variant="helper" color="amber">
            Elvish, Dwarvish, Halfling, Gnomish, Orcish, Goblin, Kobold, Gnoll, Draconic, Giant, Alignment tongues (Lawful, Chaotic), or
            other regional languages as determined by your GM.
          </Typography>
        </Card>
      )}
    </div>
  );
}

export default LanguageSelector;
