import { useMemo } from 'react';
import { useModal } from '@/hooks';
import { SectionWrapper } from '@/components/ui/core/layout';
import { Card, Typography } from '@/components/ui/core/display';
import { SkillDescriptionItem, List, ListItem } from '@/components/ui/composite';
import { TextHeader } from '@/components/ui/composite/TextHeader';
import { ALL_SKILLS, SKILL_DESCRIPTIONS, CLASSES_WITH_SKILLS, SKILL_CONSTANTS } from '@/constants';
import RollableButton from '@/components/domain/dice/RollableButton';
import Button from '@/components/ui/core/primitives/Button';
import { useDiceRoll } from '@/hooks/dice/useDiceRoll';
import { allClasses } from '@/data';
import type { Character, SkillKey, SkillClassKey } from '@/types';
import './ClassSkills.css';

interface ClassSkillsProps {
  character: Character;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  id?: string;
}

export default function ClassSkills({
  character,
  className = '',
  size = 'md',
  id = SKILL_CONSTANTS.COMPONENT_ID_PREFIX,
}: ClassSkillsProps) {
  const { isOpen: showDetails, toggle: toggleDetails } = useModal();
  const { rollPercentile } = useDiceRoll();

  // Check if character has a class with skills using optimized lookup
  const characterClassInfo = useMemo(() => {
    const skillClass = character.class as SkillClassKey;

    if (skillClass && skillClass in CLASSES_WITH_SKILLS) {
      const classInfo = CLASSES_WITH_SKILLS[skillClass];
      return {
        hasSkills: true,
        className: skillClass,
        displayName: classInfo.displayName,
        abilityType: classInfo.abilityType,
      };
    }

    return {
      hasSkills: false,
      className: null,
      displayName: null,
      abilityType: 'Skill' as const,
    };
  }, [character.class]);

  // Get class skills for current level
  const classSkills = useMemo(() => {
    if (!characterClassInfo.hasSkills || !characterClassInfo.className) {
      return null;
    }

    // Find the appropriate class data
    const classData = allClasses.find((cls) => cls.id === characterClassInfo.className);

    if (!classData?.skills) {
      console.warn(`Missing skills for class: ${characterClassInfo.className}`);
      return null;
    }

    // Get skills for current level (or closest lower level)
    // Ensure level is at least 1
    const level = Math.max(SKILL_CONSTANTS.DEFAULT_LEVEL, character.level || SKILL_CONSTANTS.DEFAULT_LEVEL);
    const skillsForLevel = classData.skills[level] || classData.skills[SKILL_CONSTANTS.DEFAULT_LEVEL];

    if (!skillsForLevel) {
      console.warn(`No skill data found for ${characterClassInfo.className} level ${level}`);
      return null;
    }

    return skillsForLevel;
  }, [character.level, characterClassInfo]);

  // Don't render if character doesn't have class skills
  if (!characterClassInfo.hasSkills || !classSkills) {
    return null;
  }

  const { className: skillClassName, abilityType } = characterClassInfo;
  const isRanger = skillClassName === 'ranger';
  const isScout = skillClassName === 'scout';

  const detailsContentId = `${id}-details`;

  const detailsContent = (
    <Card id={detailsContentId} className="skill-details" variant="nested" size="compact">
      <Typography variant="h4" weight="semibold">
        {abilityType} Descriptions:
      </Typography>
      <div className="skill-descriptions">
        {Object.entries(SKILL_DESCRIPTIONS)
          .filter(([key]) => key in classSkills) // Only show skills this class actually has
          .map(([key, description]) => (
            <SkillDescriptionItem key={key} title={ALL_SKILLS[key as SkillKey]} description={description} variant="simple" />
          ))}
      </div>
      <div className="skill-howto">
        <div>
          <TextHeader variant="h6" size="sm" underlined={false}>
            How Skills Work:
          </TextHeader>
          <List variant="disc" spacing="tight" size="sm">
            <ListItem>Skills improve automatically as you gain levels</ListItem>
            <ListItem>Success is based on rolling percentile dice (d100)</ListItem>
            <ListItem>Roll your skill percentage or lower to succeed</ListItem>
          </List>
        </div>
      </div>
    </Card>
  );

  return (
    <SectionWrapper title={characterClassInfo.displayName} size={size} className={className}>
      <div className="sheet-pad" data-size={size}>
        <div className="roll-list">
          {Object.entries(ALL_SKILLS).map(([skillKey, skillLabel]) => {
            const skillValue = classSkills[skillKey];
            if (!skillValue) return null;

            // Generate tooltip with class-specific modifiers
            const baseTooltip = `Roll ${skillLabel}: d100 vs ${skillValue}% (01-05 always succeed, 96-100 always fail)`;
            const trackingNote = (isRanger || isScout) && skillKey === 'tracking' ? ' (Wilderness only)' : '';
            const urbanPenalty =
              isRanger && (skillKey === 'moveSilently' || skillKey === 'hide')
                ? ` (-${SKILL_CONSTANTS.URBAN_PENALTY}% penalty in urban areas)`
                : '';
            const tooltip = `${baseTooltip}${trackingNote}${urbanPenalty}`;

            return (
              <RollableButton
                key={skillKey}
                label={skillLabel}
                value={`${skillValue}%`}
                onClick={() => rollPercentile(skillLabel, skillValue)}
                tooltip={tooltip}
                size={size}
              />
            );
          })}
        </div>

        <div className="skill-toggle">
          <Button variant="secondary" size="sm" onClick={toggleDetails} aria-expanded={showDetails} aria-controls={detailsContentId}>
            {showDetails ? 'Hide' : 'Show'} {abilityType} Details
          </Button>
        </div>

        {showDetails && detailsContent}
      </div>
    </SectionWrapper>
  );
}
