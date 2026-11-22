import { useEffect, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { store, useTitle } from '@dice-jar/browser';
import Stepper from '@/components/ui/composite/Stepper';
import { Breadcrumb } from '@/components/ui/composite';
import { PageWrapper } from '@/components/ui/core/layout';
import { Typography } from '@/components/ui/core/display';
import Callout from '@/components/ui/core/feedback/Callout';
import AbilityScoreStep from '@/components/features/character/creation/AbilityScoreStep';
import RaceStep from '@/components/features/character/creation/RaceStep';
import { ClassStep } from '@/components/features/character/creation/ClassStep';
import HitPointsStep from '@/components/features/character/creation/HitPointsStep';
import EquipmentStep from '@/components/features/character/creation/EquipmentStep';
import { ReviewStep } from '@/components/features/character/creation/ReviewStep';
import { useAuth, useStepNavigation } from '@/hooks';
import { useCharacterMutations } from '@/hooks/mutations/useEnhancedMutations';
import { useCascadeValidation, createCharacterValidationPipeline } from '@/validation';
import { allRaces, allClasses } from '@/data';
import { createEmptyCharacter, getRaceById } from '@/utils';
import { COMBINATION_CLASS_IDS, STORAGE_KEYS } from '@/constants';
import type { Character } from '@/types';
import { readStored } from '@/lib/localState';
import './CharGen.css';

interface Draft {
  character: Character;
  step: number;
  includeSupplementalRace: boolean;
  includeSupplementalClass: boolean;
  useCombinationClass: boolean;
}

const newDraft = (): Draft => ({
  character: createEmptyCharacter(),
  step: 0,
  includeSupplementalRace: false,
  includeSupplementalClass: false,
  useCombinationClass: false,
});

// The character being made, as last left in this browser.
const readDraft = () => readStored(STORAGE_KEYS.CHARACTER_DRAFT, newDraft());

function CharGen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useTitle('New character | Codex.Quest');

  const [draft, setDraft] = useState(readDraft);
  useEffect(() => void store.set(STORAGE_KEYS.CHARACTER_DRAFT, JSON.stringify(draft)), [draft]);
  const { character, step, includeSupplementalRace, includeSupplementalClass, useCombinationClass } = draft;
  const update = useCallback((patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch })), []);
  const setCharacter = useCallback((c: Character) => update({ character: c }), [update]);
  const setStep = useCallback((n: number) => update({ step: n }), [update]);
  const nextStep = useCallback(() => setDraft((d) => ({ ...d, step: d.step + 1 })), []);
  const clearDraft = useCallback(() => setDraft(newDraft()), []);

  // Check for new character creation via URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('new') === 'true') {
      clearDraft();
      // Clean up the URL parameter
      urlParams.delete('new');
      const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [clearDraft]);

  // Replace manual save logic with mutation
  const { saveCharacter, isSaving, saveError } = useCharacterMutations({
    onSaveSuccess: (characterId) => navigate(`/u/${user?.uid}/c/${characterId}`),
  });

  // Ensure the character always has the complete structure by merging with empty character
  const emptyCharacter = createEmptyCharacter();
  const completeCharacter = useMemo(
    () => ({
      ...emptyCharacter,
      ...character,
      hp: character.hp || emptyCharacter.hp,
    }),
    [character, emptyCharacter],
  );

  const setIncludeSupplementalRace = useCallback((value: boolean) => update({ includeSupplementalRace: value }), [update]);
  const setIncludeSupplementalClass = useCallback((value: boolean) => update({ includeSupplementalClass: value }), [update]);
  const setUseCombinationClass = useCallback((value: boolean) => update({ useCombinationClass: value }), [update]);

  // Memoize filtered data to prevent recreation of validation service
  const filteredRaces = useMemo(
    () => allRaces.filter((race) => includeSupplementalRace || !race.supplementalContent),
    [includeSupplementalRace],
  );

  const filteredClasses = useMemo(
    () => allClasses.filter((cls) => includeSupplementalClass || !cls.supplementalContent),
    [includeSupplementalClass],
  );

  // Create validation pipeline - now memoized properly
  const validationPipeline = useMemo(() => {
    return createCharacterValidationPipeline(filteredRaces, filteredClasses);
  }, [filteredRaces, filteredClasses]);

  // Initialize cascade validation hook with memoized data
  useCascadeValidation({
    character: completeCharacter,
    onCharacterChange: setCharacter,
    includeSupplementalRace,
    includeSupplementalClass,
    filteredRaces,
    filteredClasses,
  });

  // Reset combination class checkbox when race changes to one that doesn't support it
  useEffect(() => {
    if (useCombinationClass && character.race) {
      const selectedRace = getRaceById(character.race);
      const canUseCombinationClasses = selectedRace?.allowedClasses.some((cls) => COMBINATION_CLASS_IDS.includes(cls));

      if (!canUseCombinationClasses) {
        update({ useCombinationClass: false });
      }
    }
  }, [character.race, useCombinationClass, update]);

  // Use step navigation hook for centralized step management
  const { isLastStep, isNextDisabled, validationMessage } = useStepNavigation({
    step,
    character: completeCharacter,
    user,
    validationPipeline,
  });

  // Handle completion of character creation
  const handleNext = useCallback(() => {
    if (isLastStep) {
      // This is the completion step
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      if (!completeCharacter.name?.trim()) {
        console.error('Character name is required');
        return;
      }

      // Use TanStack Query mutation - handles optimistic updates and error handling
      // The mutation's onSuccess callback will clear the draft and navigate
      saveCharacter({
        userId: user.uid,
        character: completeCharacter,
      });
    } else {
      // Regular next step
      nextStep();
    }
  }, [user, completeCharacter, saveCharacter, nextStep, isLastStep]);

  // Helper function to create step components
  const createStepComponents = useCallback(
    () => [
      {
        title: 'Abilities',
        content: <AbilityScoreStep character={completeCharacter} onCharacterChange={setCharacter} />,
      },
      {
        title: 'Race',
        content: (
          <RaceStep
            character={completeCharacter}
            onCharacterChange={setCharacter}
            includeSupplemental={includeSupplementalRace}
            onIncludeSupplementalChange={setIncludeSupplementalRace}
          />
        ),
      },
      {
        title: 'Class',
        content: (
          <ClassStep
            character={completeCharacter}
            onCharacterChange={setCharacter}
            includeSupplementalClass={includeSupplementalClass}
            onIncludeSupplementalClassChange={setIncludeSupplementalClass}
            useCombinationClass={useCombinationClass}
            onUseCombinationClassChange={setUseCombinationClass}
          />
        ),
      },
      {
        title: 'Hit Points',
        content: <HitPointsStep character={completeCharacter} onCharacterChange={setCharacter} />,
      },
      {
        title: 'Equipment',
        content: <EquipmentStep character={completeCharacter} onCharacterChange={setCharacter} />,
      },
      {
        title: 'Review',
        content: <ReviewStep character={completeCharacter} onCharacterChange={setCharacter} />,
      },
    ],
    [
      completeCharacter,
      setCharacter,
      includeSupplementalRace,
      setIncludeSupplementalRace,
      includeSupplementalClass,
      setIncludeSupplementalClass,
      useCombinationClass,
      setUseCombinationClass,
    ],
  );

  const stepItems = createStepComponents();

  const breadcrumbItems = useMemo(
    () => [
      { label: 'Home', href: '/' },
      { label: 'Character Creation', current: true },
    ],
    [],
  );

  return (
    <PageWrapper>
      <article>
        <header className="new-char-head">
          <Breadcrumb items={breadcrumbItems} />
          <Typography variant="h2" as="h2">
            Character Creation
          </Typography>
        </header>

        <section aria-label="Character creation wizard">
          <Stepper
            stepItems={stepItems}
            step={step}
            setStep={setStep}
            nextDisabled={isNextDisabled || isSaving}
            onNext={handleNext}
            validationMessage={validationMessage || ''}
          />
        </section>

        {/* Show save error if it occurs */}
        {saveError && (
          <div className="new-char-error">
            <Callout variant="error" title="Save Failed">
              {saveError}
            </Callout>
          </div>
        )}
      </article>
    </PageWrapper>
  );
}

export default CharGen;
