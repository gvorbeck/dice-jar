import { useState, useCallback } from 'react';
import { useToast } from '@dice-jar/browser';
import { getRandomTableResult, rollForEncounter, delay, createCombatantFromEncounter } from '@/utils';
import type { GameCombatant } from '@/types';
import { ENCOUNTER_CONSTANTS } from '@/constants';

interface UseEncounterGenerationProps {
  currentTable: readonly string[];
  onAddToCombat: ((combatant: GameCombatant) => void) | undefined;
  onOpenCombatTracker: (() => void) | undefined;
}

export function useEncounterGeneration({ currentTable, onAddToCombat, onOpenCombatTracker }: UseEncounterGenerationProps) {
  const [currentEncounter, setCurrentEncounter] = useState<string | null>(null);
  const [encounterOccurs, setEncounterOccurs] = useState<boolean | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { addToast } = useToast();

  // Function to add encounter to combat tracker
  const handleAddToCombatTracker = useCallback(() => {
    if (!currentEncounter || !onAddToCombat) return;

    const combatant = createCombatantFromEncounter(currentEncounter);
    onAddToCombat(combatant);

    addToast(`${combatant.name} added to Combat Tracker`, 'success');

    // Optionally open the combat tracker
    if (onOpenCombatTracker) {
      setTimeout(() => {
        onOpenCombatTracker();
      }, 500); // Small delay to let the user see the success notification
    }
  }, [currentEncounter, onAddToCombat, onOpenCombatTracker, addToast]);

  const generateEncounter = useCallback(async () => {
    if (!currentTable.length) {
      addToast('No encounter table available for the selected type.', 'error');
      return;
    }

    setIsGenerating(true);
    setCurrentEncounter(null);
    setEncounterOccurs(null);

    try {
      // Simulate rolling for encounter occurrence
      await delay(ENCOUNTER_CONSTANTS.GENERATION_DELAY);

      // Roll 1d6 for encounter check (1 = encounter occurs)
      const encounterHappens = rollForEncounter();

      setEncounterOccurs(encounterHappens);

      if (encounterHappens) {
        // Get a random encounter from the table
        const encounter = getRandomTableResult(currentTable);

        // Add a small delay for UX
        await delay(ENCOUNTER_CONSTANTS.RESULT_DELAY);
        if (encounter) {
          setCurrentEncounter(encounter);
          addToast(`Encounter generated: ${encounter}`, 'success');
        } else {
          addToast('Failed to select encounter from table.', 'error');
        }
      } else {
        addToast('No encounter occurs this time.', 'info');
      }
    } catch (error) {
      console.error('Error generating encounter:', error);
      addToast(error instanceof Error ? error.message : 'An unknown error occurred while generating the encounter.', 'error');
      // Reset states on error
      setEncounterOccurs(null);
      setCurrentEncounter(null);
    } finally {
      setIsGenerating(false);
    }
  }, [currentTable, addToast]);

  const resetEncounter = useCallback(() => {
    setCurrentEncounter(null);
    setEncounterOccurs(null);
  }, []);

  return {
    currentEncounter,
    encounterOccurs,
    isGenerating,
    generateEncounter,
    handleAddToCombatTracker,
    resetEncounter,
  };
}
