import { forwardRef, useState, useRef, useEffect } from 'react';
import type { Character } from '@/types';
import { SectionWrapper } from '@/components/ui/core/layout';
import { Icon } from '@/components/ui/core/display';
import { NumberInput } from '@/components/ui/core/primitives';
import { InfoTooltip, SkeletonStatBlock } from '@/components/ui/core/feedback';
import { Typography } from '@/components/ui/core/display';
import { formatModifier, getAbilityScoreCategory } from '@/utils';
import { useDiceRoll } from '@/hooks';
import '@/components/ui/composite/StatCard.css';
import './AbilityScores.css';

interface AbilityScoresProps {
  character?: Character;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
  loading?: boolean;
  onAbilityChange?: (abilityKey: string, value: number) => void;
}

interface AbilityScoreCardProps {
  label: string;
  fullName: string;
  value: number;
  modifier: number;
  rank: 'highest' | 'lowest' | 'middle';
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
  onChange?: (value: number) => void;
  onRoll: () => void;
}

const AbilityScoreCard = forwardRef<HTMLDivElement, AbilityScoreCardProps>(
  ({ label, fullName, value, modifier, rank, size = 'md', editable = false, onChange, onRoll }, ref) => {
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus and select when entering edit mode
    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [isEditing]);

    const handleClick = () => {
      onRoll();
    };

    const handleDoubleClick = () => {
      if (editable && onChange) {
        setIsEditing(true);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onRoll();
      }
    };

    const handleValueChange = (newValue: number | undefined) => {
      if (newValue !== undefined && onChange) {
        onChange(newValue);
      }
      setIsEditing(false);
    };

    const handleInputBlur = () => {
      setIsEditing(false);
    };

    const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' || event.key === 'Escape') {
        setIsEditing(false);
      }
    };

    return (
      <div
        ref={ref}
        className="stat-card ability-card"
        data-size={size}
        data-rank={rank}
        title={`${fullName} - Click to roll d20${modifier >= 0 ? '+' : ''}${modifier}${editable ? ' • Double-click to edit' : ''}`}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        role="button"
        tabIndex={0}
        aria-label={`${fullName} (${value}, modifier ${formatModifier(modifier)}) - Click to roll ability check`}
        onKeyDown={handleKeyDown}
      >
        {/* Content */}
        <div className="stat-card-body">
          {/* Label */}
          <Typography variant="bodySmall" color="amber" weight="medium" as="h3" className="stat-card-label">
            {label}
          </Typography>

          {/* Primary Value - with editing support */}
          {isEditing && onChange ? (
            <div className="ability-input">
              <NumberInput
                ref={inputRef}
                value={value}
                onChange={handleValueChange}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                minValue={3}
                maxValue={25}
                size={size}
                aria-label={`${fullName} value`}
              />
            </div>
          ) : (
            <div className="stat-card-value">
              {value}
              {editable && <Icon name="edit" size="xs" className="ability-edit" aria-hidden={true} />}
            </div>
          )}

          {/* Secondary Value (modifier) */}
          <div className="ability-mod">{formatModifier(modifier)}</div>
        </div>
      </div>
    );
  },
);

AbilityScoreCard.displayName = 'AbilityScoreCard';

const AbilityScores = forwardRef<HTMLDivElement, AbilityScoresProps>(
  ({ character, className = '', size = 'md', editable = false, loading = false, onAbilityChange }, ref) => {
    const { rollAbility } = useDiceRoll();

    // Show skeleton while loading
    if (loading || !character) {
      return (
        <SectionWrapper ref={ref} title="Ability Scores" size={size} className={className}>
          <SkeletonStatBlock stats={6} showTitle={false} label="Loading ability scores..." />
        </SectionWrapper>
      );
    }

    const abilities = [
      { key: 'strength', label: 'STR', fullName: 'Strength' },
      { key: 'dexterity', label: 'DEX', fullName: 'Dexterity' },
      { key: 'constitution', label: 'CON', fullName: 'Constitution' },
      { key: 'intelligence', label: 'INT', fullName: 'Intelligence' },
      { key: 'wisdom', label: 'WIS', fullName: 'Wisdom' },
      { key: 'charisma', label: 'CHA', fullName: 'Charisma' },
    ] as const;

    const allScores = abilities.map(({ key }) => character.abilities[key].value);

    const handleAbilityChange = (abilityKey: string) => (newValue: number) => {
      if (onAbilityChange) {
        onAbilityChange(abilityKey, newValue);
      }
    };

    const titleWithTooltip = (
      <div className="icon-heading">
        Ability Scores
        <InfoTooltip content="Single click to roll d20 + modifier • Double click to edit value" />
      </div>
    );

    return (
      <SectionWrapper ref={ref} title={titleWithTooltip} size={size} className={className}>
        {/* Ability Scores Grid */}
        <div className="sheet-pad" data-size={size}>
          <div className="ability-grid">
            {abilities.map(({ key, label, fullName }) => {
              const ability = character.abilities[key];
              const scoreCategory = getAbilityScoreCategory(ability.value, allScores);
              const rank = scoreCategory === 'highest' || scoreCategory === 'lowest' ? scoreCategory : 'middle';

              return (
                <AbilityScoreCard
                  key={key}
                  label={label}
                  fullName={fullName}
                  value={ability.value}
                  modifier={ability.modifier}
                  rank={rank}
                  size={size}
                  editable={editable}
                  {...(editable && { onChange: handleAbilityChange(key) })}
                  onRoll={() => rollAbility(fullName, ability.modifier)}
                />
              );
            })}
          </div>
        </div>
      </SectionWrapper>
    );
  },
);

AbilityScores.displayName = 'AbilityScores';

export default AbilityScores;
