import { useMemo } from 'react';
import { SectionWrapper } from '@/components/ui/core/layout';
import RollableButton from '@/components/domain/dice/RollableButton';
import { useDiceRoll } from '@/hooks/dice/useDiceRoll';
import { InfoTooltip } from '@/components/ui/core/feedback';
import { TextHeader } from '@/components/ui/composite/TextHeader';
import type { Character } from '@/types';
import { getSavingThrows } from '@/utils/combatCalculations';
import './SavingThrows.css';

// Saving throw help text for tooltips
const SAVING_THROW_HELP = {
  title: 'Rolling Saving Throws:',
  rules: [
    '• Roll 1d20 and meet or exceed the target number',
    '• Natural 20 always succeeds',
    '• Natural 1 always fails',
    '• Poison saves use CON modifier',
    '• Illusion spells use INT modifier',
    '• Charm spells use WIS modifier',
    '• Other saves use no ability modifier',
  ],
};

interface SavingThrowsProps {
  character: Character;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function SavingThrows({ character, className = '', size = 'md' }: SavingThrowsProps) {
  const { rollSavingThrow } = useDiceRoll();

  const savingThrows = useMemo(() => {
    const saves = getSavingThrows({ ...character, level: character.level || 1 });
    return {
      deathRayOrPoison: saves.deathRay,
      magicWands: saves.magicWands,
      paralysisOrPetrify: saves.paralysis,
      dragonBreath: saves.dragonBreath,
      spells: saves.spells,
    };
  }, [character]);

  const conModifier = character.abilities?.constitution?.modifier ?? 0;
  const wisModifier = character.abilities?.wisdom?.modifier ?? 0;

  const savingThrowItems = [
    {
      label: 'Death Ray or Poison',
      target: savingThrows.deathRayOrPoison,
      modifier: conModifier,
      usesModifier: true,
    },
    {
      label: 'Magic Wands',
      target: savingThrows.magicWands,
      modifier: 0,
      usesModifier: false,
    },
    {
      label: 'Paralysis or Petrify',
      target: savingThrows.paralysisOrPetrify,
      modifier: 0,
      usesModifier: false,
    },
    {
      label: 'Dragon Breath',
      target: savingThrows.dragonBreath,
      modifier: 0,
      usesModifier: false,
    },
    {
      label: 'Spells',
      target: savingThrows.spells,
      modifier: wisModifier,
      usesModifier: true,
    },
  ];

  const tooltipContent = (
    <div className="rules-tip">
      <TextHeader variant="h6" size="sm" underlined={false}>
        {SAVING_THROW_HELP.title}
      </TextHeader>
      <div className="rules-tip-list">
        {SAVING_THROW_HELP.rules.map((rule, index) => (
          <div key={index}>{rule}</div>
        ))}
      </div>
    </div>
  );

  return (
    <SectionWrapper
      title={
        <div className="icon-heading">
          <span>Saving Throws</span>
          <InfoTooltip content={tooltipContent} ariaLabel="Saving throw rules" />
        </div>
      }
      size={size}
      className={className}
    >
      <div className="sheet-pad" data-size={size}>
        <div className="roll-list">
          {savingThrowItems.map((item, index) => (
            <RollableButton
              key={index}
              label={item.label}
              value={`${item.target}+`}
              onClick={() => rollSavingThrow(item.label, item.target, item.usesModifier ? item.modifier : undefined)}
              tooltip={`Click to roll ${item.label.toLowerCase()} save (need ${item.target}+ on d20)${
                item.usesModifier ? ` with ${item.modifier >= 0 ? '+' : ''}${item.modifier} modifier` : ''
              }`}
              size={size}
            />
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
