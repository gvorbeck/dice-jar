import { forwardRef } from 'react';
import { SectionWrapper } from '@/components/ui/core/layout';
import { ExperienceTracker } from '@/components/features/character/sheet';
import { InfoTooltip } from '@/components/ui/core/feedback';
import type { Character, Class } from '@/types';
import './ExperiencePoints.css';

interface ExperiencePointsProps {
  character: Character & { id?: string };
  classes: Class[];
  editable?: boolean;
  onChange?: (xp: number) => void;
  onCharacterChange?: (character: Character) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ExperiencePoints = forwardRef<HTMLDivElement, ExperiencePointsProps>(
  ({ character, classes, editable = false, onChange, onCharacterChange, className = '', size = 'md' }, ref) => {
    const titleWithTooltip = (
      <div className="icon-heading">
        Experience Points
        <InfoTooltip content="Try: +100, -50, or enter a number directly" />
      </div>
    );

    return (
      <SectionWrapper ref={ref} title={titleWithTooltip} size={size} className={className}>
        {/* Content */}
        <div className="sheet-pad" data-size={size}>
          {editable ? (
            <ExperienceTracker
              character={character}
              classes={classes}
              {...(onChange && { onChange })}
              {...(onCharacterChange && { onCharacterChange })}
            />
          ) : (
            <div className="xp-readout">{character.xp}</div>
          )}
        </div>
      </SectionWrapper>
    );
  },
);

ExperiencePoints.displayName = 'ExperiencePoints';

export default ExperiencePoints;
