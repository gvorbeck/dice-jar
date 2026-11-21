import { useCallback, useMemo, memo } from 'react';
import { TextInput } from '@/components/ui/core/primitives';
import { StepWrapper } from '@/components/ui/core/layout';
import { HorizontalRule } from '@/components/ui/composite';
import { Icon, Image, Card, Typography, Badge } from '@/components/ui/core/display';
import { StatGrid } from '@/components/ui/composite';
import { LanguageSelector } from '@/components/features/character/creation';
import { AvatarSelector } from '@/components/features/character/management';
import { useValidation } from '@/validation';
import { sanitizeCharacterName, getClassById, isCustomClass, isCustomRace, getRaceById, characterNameSchema } from '@/utils';
import type { BaseStepProps } from '@/types';
import './ReviewStep.css';

type ReviewStepProps = BaseStepProps;

function ReviewStepComponent({ character, onCharacterChange }: ReviewStepProps) {
  // Validate character name
  const nameValidation = useValidation(character.name, characterNameSchema);

  // Look up display names for race and classes
  const raceDisplayName = useMemo(() => {
    if (!character.race) return 'None selected';

    // Handle custom races using new helper
    if (isCustomRace(character.race)) {
      return character.race;
    }

    const race = getRaceById(character.race);
    return race?.name || character.race;
  }, [character.race]);

  const classDisplayNames = useMemo(() => {
    if (!character.class) return 'None selected';

    // Handle custom classes
    if (isCustomClass(character.class)) {
      return character.class || 'Custom Class';
    }

    const classData = getClassById(character.class);
    return classData?.name || character.class;
  }, [character.class]);

  const handleNameChange = useCallback(
    (name: string) => {
      // Sanitize the input to prevent potential XSS and ensure valid characters
      const sanitizedName = sanitizeCharacterName(name);
      onCharacterChange({
        ...character,
        name: sanitizedName,
      });
    },
    [character, onCharacterChange],
  );

  const getStatusMessage = () => {
    if (!character.name || character.name.trim() === '') {
      return 'Character name required';
    }
    if (!nameValidation.isValid) {
      return 'Please fix character name errors';
    }
    return `${character.name} - ${raceDisplayName} ${classDisplayNames}`;
  };

  return (
    <StepWrapper
      title="Review & Finalize"
      description="Name your character and review all details before completing character creation."
      statusMessage={getStatusMessage()}
    >
      {/* Character Name Section */}
      <section className="step-block">
        <Typography variant="sectionHeading">Character Name</Typography>

        <Card variant="standard" className="review-card">
          <TextInput
            value={character.name}
            onChange={handleNameChange}
            placeholder="Enter your character's name"
            maxLength={50}
            required
            aria-label="Character name"
            {...(nameValidation.errors.length > 0 && {
              'aria-describedby': 'name-error',
            })}
            aria-invalid={!nameValidation.isValid}
          />
          {nameValidation.errors.length > 0 && (
            <div id="name-error" role="alert" aria-live="assertive" className="review-name-error">
              {nameValidation.errors[0]}
            </div>
          )}
        </Card>
      </section>

      {/* Character Summary */}
      <section className="step-block">
        <Typography variant="sectionHeading">Character Summary</Typography>

        <Card variant="success" className="review-card">
          {/* Header with Avatar and Basic Info */}
          <div className="review-head">
            {/* Avatar */}
            {character.avatar && (
              <div className="review-avatar">
                <Image variant="avatar" size="lg" src={character.avatar} alt={`${character.name || 'Character'} avatar`} />
              </div>
            )}

            {/* Character Overview */}
            <div className="review-overview">
              <div className="review-name">
                <Icon name="user" size="lg" />
                <Typography variant="infoHeading" color="zinc">
                  {character.name || 'Unnamed Character'}
                </Typography>
              </div>

              <div className="review-facts">
                <Card variant="success" size="compact">
                  <Typography variant="subHeadingLime" color="lime">
                    <Icon name="eye" size="sm" />
                    Race
                  </Typography>
                  <Typography variant="body" weight="medium" color="lime">
                    {raceDisplayName}
                  </Typography>
                </Card>

                <Card variant="success" size="compact">
                  <Typography variant="subHeadingLime" color="lime">
                    <Icon name="briefcase" size="sm" />
                    Class
                  </Typography>
                  <Typography variant="body" weight="medium" color="lime">
                    {classDisplayNames}
                  </Typography>
                </Card>

                <Card variant="success" size="compact">
                  <Typography variant="subHeadingLime" color="lime">
                    <Icon name="heart" size="sm" />
                    Hit Points
                  </Typography>
                  <Typography variant="body" weight="bold" color="lime" className="review-hp">
                    {character.hp?.current || 0} / {character.hp?.max || 0} HP
                  </Typography>
                </Card>

                {character.currency.gold > 0 && (
                  <Card variant="success" size="compact">
                    <Typography variant="subHeadingLime" color="lime">
                      <Icon name="coin" size="sm" />
                      Gold
                    </Typography>
                    <Typography variant="body" weight="medium" color="lime">
                      {character.currency.gold} gp
                    </Typography>
                  </Card>
                )}
              </div>
            </div>
          </div>

          {/* Ability Scores */}
          <div className="review-block">
            <Typography variant="subHeading" color="lime">
              <Icon name="lightning" size="sm" />
              Ability Scores
            </Typography>
            <StatGrid
              stats={Object.entries(character.abilities).map(([ability, score]) => ({
                label: ability,
                value: score.value,
                modifier: score.modifier,
              }))}
              variant="ability"
            />
          </div>

          {/* Equipment Summary */}
          {character.equipment.length > 0 && (
            <div className="review-block">
              <Typography variant="subHeading" color="lime">
                <Icon name="clipboard" size="sm" />
                Equipment ({character.equipment.reduce((total, item) => total + item.amount, 0)} items)
              </Typography>

              <div className="review-totals">
                <Card variant="success" size="compact">
                  <div className="review-label">Total Weight</div>
                  <div className="review-value">
                    {character.equipment.reduce((total, item) => total + item.weight * item.amount, 0).toFixed(1)} lbs
                  </div>
                </Card>
                <Card variant="success" size="compact">
                  <div className="review-label">Equipment Value</div>
                  <div className="review-value">
                    {character.equipment
                      .reduce((total, item) => {
                        let itemValueInGold = item.costValue * item.amount;
                        if (item.costCurrency === 'sp') itemValueInGold /= 10;
                        else if (item.costCurrency === 'cp') itemValueInGold /= 100;
                        return total + itemValueInGold;
                      }, 0)
                      .toFixed(2)}{' '}
                    gp
                  </div>
                </Card>
              </div>

              <div className="review-gear">
                <div>
                  {character.equipment.map((item, index) => (
                    <div key={index} className="review-gear-item">
                      <span>{item.name}</span>
                      {item.amount > 1 && <span>× {item.amount}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Spells */}
          {character.spells && character.spells.length > 0 && (
            <div>
              <Typography variant="subHeading" color="lime">
                <Icon name="star" size="sm" />
                Spells
              </Typography>

              <Card variant="success" size="compact">
                <div className="review-spells">
                  {(() => {
                    // Check if class has Read Magic ability (magic-user types and combination classes)
                    const classData = getClassById(character.class);
                    const hasReadMagic = classData?.specialAbilities?.some((ability) => ability.name === 'Read Magic');
                    return (
                      hasReadMagic && (
                        <div className="review-spell">
                          <span className="review-auto">Auto</span>
                          <span className="review-spell-name">Read Magic</span>
                          <span className="review-spell-note">(automatically known)</span>
                        </div>
                      )
                    );
                  })()}
                  {character.spells.map((spell, index) => (
                    <div key={index} className="review-spell">
                      <Badge variant="status">L1</Badge>
                      <span className="review-spell-name">{spell.name}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </Card>
      </section>

      <HorizontalRule />

      {/* Languages */}
      <section className="step-block">
        <LanguageSelector character={character} onCharacterChange={onCharacterChange} />
      </section>

      <HorizontalRule />

      {/* Avatar */}
      <section className="step-block">
        <AvatarSelector character={character} onCharacterChange={onCharacterChange} />
      </section>
    </StepWrapper>
  );
}

export const ReviewStep = memo(ReviewStepComponent);
