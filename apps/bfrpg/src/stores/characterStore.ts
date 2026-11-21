import { createStore } from '@/lib/store';
import { createEmptyCharacter } from '@/utils/character';
import type { Character } from '@/types/character';

interface CharacterStore {
  // Draft character state (replaces useLocalStorage in CharGen)
  draftCharacter: Character;
  currentStep: number;

  // User preferences (consolidates multiple useLocalStorage calls)
  preferences: {
    includeSupplementalRace: boolean;
    includeSupplementalClass: boolean;
    useCombinationClass: boolean;
    customClassMagicToggle: boolean;
  };

  // Actions
  updateDraft: (character: Character) => void;
  clearDraft: () => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  updatePreferences: (prefs: Partial<CharacterStore['preferences']>) => void;
}

export const useCharacterStore = createStore<CharacterStore>(
  'character-creation-store',
  (set) => ({
    draftCharacter: createEmptyCharacter(),
    currentStep: 0,
    preferences: {
      includeSupplementalRace: false,
      includeSupplementalClass: false,
      useCombinationClass: false,
      customClassMagicToggle: false,
    },

    updateDraft: (character) => set({ draftCharacter: character }),

    clearDraft: () => set({ draftCharacter: createEmptyCharacter(), currentStep: 0 }),

    setStep: (step) => set({ currentStep: step }),

    nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),

    previousStep: () =>
      set((state) => ({
        currentStep: Math.max(0, state.currentStep - 1),
      })),

    updatePreferences: (prefs) =>
      set((state) => ({
        preferences: { ...state.preferences, ...prefs },
      })),
  }),
  (state) => ({
    draftCharacter: state.draftCharacter,
    currentStep: state.currentStep,
    preferences: state.preferences,
  }),
);
