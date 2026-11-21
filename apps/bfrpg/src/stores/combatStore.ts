import { createStore } from '@/lib/store';
import type { CombatantWithInitiative } from '@/types';

// Combat state interface for persistence
interface CombatState {
  combatants: CombatantWithInitiative[];
  currentTurn: number;
  round: number;
  isActive: boolean;
}

interface GameCombatState {
  [gameId: string]: {
    combatState: CombatState;
    preCombatInitiatives: Record<string, number>;
  };
}

interface CombatStore {
  games: GameCombatState;

  // Actions
  setCombatState: (gameId: string, state: CombatState) => void;
  getCombatState: (gameId: string) => CombatState;
  setPreCombatInitiatives: (gameId: string, initiatives: Record<string, number>) => void;
  getPreCombatInitiatives: (gameId: string) => Record<string, number>;
  clearGameCombatData: (gameId: string) => void;
}

const defaultCombatState: CombatState = {
  combatants: [],
  currentTurn: 0,
  round: 1,
  isActive: false,
};

export const useCombatStore = createStore<CombatStore>(
  'combat-store',
  (set, get) => ({
    games: {},

    setCombatState: (gameId, state) =>
      set((store) => ({
        games: {
          ...store.games,
          [gameId]: {
            combatState: state,
            preCombatInitiatives: store.games[gameId]?.preCombatInitiatives || {},
          },
        },
      })),

    getCombatState: (gameId) => {
      const state = get().games[gameId]?.combatState;
      return state || defaultCombatState;
    },

    setPreCombatInitiatives: (gameId, initiatives) =>
      set((store) => ({
        games: {
          ...store.games,
          [gameId]: {
            combatState: store.games[gameId]?.combatState || defaultCombatState,
            preCombatInitiatives: initiatives,
          },
        },
      })),

    getPreCombatInitiatives: (gameId) => {
      return get().games[gameId]?.preCombatInitiatives || {};
    },

    clearGameCombatData: (gameId) =>
      set((store) => {
        const { [gameId]: _, ...remainingGames } = store.games;
        return { games: remainingGames };
      }),
  }),
  (state) => ({
    games: state.games,
  }),
);
