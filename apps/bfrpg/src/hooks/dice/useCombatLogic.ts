import { useCallback, useMemo, useEffect, useState } from 'react';
import { usePlayerCharacters } from '../character';
import { useToast } from '@dice-jar/browser';
import { store } from '@dice-jar/browser';
import type { CombatantWithInitiative, Game, GameCombatant, CombatCharacterData } from '@/types';
import { calculateArmorClass, findById, normalizeCombatantHP, sortCombatantsByInitiative } from '@/utils';
import { allRaces } from '@/data';
import { readStored } from '@/lib/localState';
import { roll } from '@dice-jar/dice';

// Stable hash function for generating consistent sort IDs from names
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

/**
 * Generate a stable sort ID for a combatant.
 * Uses name + index to ensure unique IDs even for combatants with the same name.
 */
const getCombatantSortId = (name: string, index: number): number => hashString(`${name}-${index}`);

// 1d6 plus the Dexterity bonus (Core Rules, p. 51). shortcut: 0 means "not rolled yet" here, so a result below 1 counts as 1, and equal numbers act together anyway.
const rollInitiative = (dexModifier: number | undefined) => Math.max(1, roll('1d6').total + (dexModifier ?? 0));

// What a player adds to their Initiative roll: the Dexterity bonus, and a race's own bonus (a Halfling's +1, Core Rules p. 6).
const initiativeModifier = (character: CombatCharacterData): number => {
  const race = findById(String(character.race), allRaces);
  const racial = race?.specialAbilities?.find((a) => a.effects?.initiativeBonus)?.effects?.initiativeBonus?.value ?? 0;
  return (character.abilities?.dexterity?.modifier ?? 0) + racial;
};

interface CombatState {
  combatants: CombatantWithInitiative[];
  currentTurn: number;
  round: number;
  isActive: boolean;
}

interface SavedCombat {
  combatState: CombatState;
  preCombatInitiatives: Record<string, number>;
}

// shortcut: pre-combat initiatives are still keyed by name, so same-name monsters share one value; key them by id when that bites.
const EMPTY_COMBAT: SavedCombat = { combatState: { combatants: [], currentTurn: 0, round: 1, isActive: false }, preCombatInitiatives: {} };

// This game's combat as last left in this browser.
// A combat saved before combatants had an id gets one, so edits match one creature, not all of them.
const readCombat = (key: string): SavedCombat => {
  const c = readStored(key, EMPTY_COMBAT);
  const combatants = c.combatState.combatants.map((x, i) => ({ ...x, id: x.id ?? `${x.name}-${i}` }));
  return { ...c, combatState: { ...c.combatState, combatants } };
};

export function useCombatLogic(game?: Game, onUpdateGame?: (updatedGame: Game) => void) {
  const { addToast } = useToast();
  const { playerCharacters } = usePlayerCharacters(game || ({} as Game));

  const gameId = game?.id || 'temp';
  const storageKey = `combat:${gameId}`;
  const [saved, setSaved] = useState(() => readCombat(storageKey));
  const [savedKey, setSavedKey] = useState(storageKey);
  if (savedKey !== storageKey) {
    setSavedKey(storageKey);
    setSaved(readCombat(storageKey));
  }
  useEffect(() => void store.set(storageKey, JSON.stringify(saved)), [storageKey, saved]);
  const { combatState, preCombatInitiatives } = saved;

  const updateCombatState = useCallback((newState: CombatState) => setSaved((s) => ({ ...s, combatState: newState })), []);
  const updatePreCombatInitiatives = useCallback(
    (initiatives: Record<string, number>) => setSaved((s) => ({ ...s, preCombatInitiatives: initiatives })),
    [],
  );

  const { combatants, currentTurn, round, isActive: isCombatActive } = combatState;

  // Get available players (not yet added to combat)
  const availablePlayers = useMemo(() => {
    if (!game) return [];

    const playersInCombat = new Set(
      (game.combatants || []).filter((combatant) => combatant['isPlayer']).map((combatant) => combatant.name),
    );

    return playerCharacters
      .filter((char) => !playersInCombat.has(char.name))
      .map((char, index) => {
        const combatChar = char as CombatCharacterData;

        return {
          id: `${char.name}-${index}`,
          name: char.name,
          ac: calculateArmorClass(combatChar),
          initiative: 0,
          isPlayer: true,
          _sortId: getCombatantSortId(char.name, index),
          dexModifier: initiativeModifier(combatChar),
          hp: normalizeCombatantHP(combatChar),
          avatar: combatChar.avatar,
        } as CombatantWithInitiative;
      });
  }, [playerCharacters, game]);

  // Get current combatants (monsters and players added to combat)
  const currentCombatants = useMemo(() => {
    if (!game) return [];

    return (game.combatants || []).map((combatant, index) => {
      // If this is a player, try to get their actual data from character data
      if (combatant['isPlayer']) {
        const playerChar = playerCharacters.find((char) => char.name === combatant.name);
        if (playerChar) {
          const combatChar = playerChar as CombatCharacterData;

          return {
            id: `${combatant.name}-${index}`,
            name: combatant.name,
            ac: calculateArmorClass(combatChar),
            initiative: 0,
            isPlayer: true,
            _sortId: getCombatantSortId(combatant.name, index),
            dexModifier: initiativeModifier(combatChar),
            hp: normalizeCombatantHP(combatChar),
            avatar: combatChar.avatar,
          } as CombatantWithInitiative;
        }
      }

      return {
        id: `${combatant.name}-${index}`,
        name: combatant.name,
        ac: combatant.ac || 11,
        initiative: 0,
        isPlayer: Boolean(combatant['isPlayer']),
        _sortId: getCombatantSortId(combatant.name, index),
        dexModifier: 0, // Default for monsters unless specified
        hp: { current: 10, max: 10 }, // Default HP for monsters
        avatar: combatant.avatar,
      } as CombatantWithInitiative;
    });
  }, [game, playerCharacters]);

  // Current combatants with stored pre-combat initiative values
  const currentCombatantsWithInitiative = useMemo(() => {
    return currentCombatants
      .map((combatant, index) => ({
        ...combatant,
        initiative: preCombatInitiatives[combatant.name] || 0,
        _sortId: getCombatantSortId(combatant.name, index),
      }))
      .sort((a, b) => {
        if (b.initiative === a.initiative) {
          return b._sortId - a._sortId;
        }
        return b.initiative - a.initiative;
      });
  }, [currentCombatants, preCombatInitiatives]);

  // Current combatant in turn order
  const currentCombatant = useMemo(() => {
    const sorted = sortCombatantsByInitiative(combatants);
    return sorted[currentTurn];
  }, [combatants, currentTurn]);

  // Check if all combatants have initiative values > 0
  const allCombatantsHaveInitiative = useMemo(() => {
    if (isCombatActive) {
      // During combat, check the active combatants
      return combatants.length > 0 && combatants.every((combatant) => combatant.initiative > 0);
    } else {
      // Before combat, check if all current combatants have pre-combat initiative set
      return (
        currentCombatants.length > 0 &&
        currentCombatants.every((combatant) => {
          const preCombatInitiative = preCombatInitiatives[combatant.name] || 0;
          return preCombatInitiative > 0;
        })
      );
    }
  }, [combatants, currentCombatants, preCombatInitiatives, isCombatActive]);

  // Add player to combat
  const addPlayerToCombat = useCallback(
    (player: CombatantWithInitiative) => {
      if (!game || !onUpdateGame) return;

      const newCombatant: GameCombatant = {
        name: player.name,
        ac: player.ac,
        initiative: 0,
        ...(player.avatar && { avatar: player.avatar }),
        isPlayer: true,
      };

      const updatedCombatants = [...(game.combatants || []), newCombatant];
      const updatedGame = {
        ...game,
        combatants: updatedCombatants,
      };

      onUpdateGame(updatedGame);
      addToast(`${player.name} added to combat`, 'success');
    },
    [game, onUpdateGame, addToast],
  );

  // Remove combatant from combat
  const removeCombatant = useCallback(
    (combatantIndex: number) => {
      if (!game || !onUpdateGame) return;

      const combatantToRemove = currentCombatants[combatantIndex];
      if (!combatantToRemove) return;

      const updatedCombatants = (game.combatants || []).filter((_, index) => index !== combatantIndex);
      const updatedGame = {
        ...game,
        combatants: updatedCombatants,
      };

      // Remove the combatant's initiative value from pre-combat storage
      const updatedPreCombatInitiatives = { ...preCombatInitiatives };
      delete updatedPreCombatInitiatives[combatantToRemove.name];
      updatePreCombatInitiatives(updatedPreCombatInitiatives);

      onUpdateGame(updatedGame);
      addToast(`${combatantToRemove.name} removed from combat`, 'success');
    },
    [game, onUpdateGame, currentCombatants, preCombatInitiatives, updatePreCombatInitiatives, addToast],
  );

  // Initialize combat with all combatants
  const initializeCombat = useCallback(() => {
    if (!game || currentCombatants.length === 0) {
      addToast('No combatants available to start combat', 'error');
      return;
    }

    // Use pre-combat initiative values if available, otherwise roll initiative
    const combatantsWithInitiative = currentCombatants.map((combatant, index) => {
      const preCombatInitiative = preCombatInitiatives[combatant.name] || 0;
      return {
        ...combatant,
        initiative: preCombatInitiative > 0 ? preCombatInitiative : rollInitiative(combatant.dexModifier),
        _sortId: getCombatantSortId(combatant.name, index),
      };
    });

    // Sort by initiative (descending)
    const sortedCombatants = sortCombatantsByInitiative(combatantsWithInitiative);

    updateCombatState({
      combatants: sortedCombatants,
      currentTurn: 0,
      round: 1,
      isActive: true,
    });

    addToast(`Combat initialized! ${sortedCombatants.length} combatants ready.`, 'success');
  }, [game, currentCombatants, preCombatInitiatives, addToast, updateCombatState]);

  // Roll initiative for a specific combatant
  const rollInitiativeFor = useCallback(
    (combatantIndex: number) => {
      const combatant = combatants[combatantIndex];
      if (!combatant) return;

      const newInitiative = rollInitiative(combatant.dexModifier);
      const updatedCombatants = [...combatants];
      updatedCombatants[combatantIndex] = {
        ...combatant,
        initiative: newInitiative,
        _sortId: getCombatantSortId(combatant.name, combatantIndex),
      };

      // Re-sort by initiative with stable sorting
      const sortedCombatants = sortCombatantsByInitiative(updatedCombatants);

      updateCombatState({
        ...combatState,
        combatants: sortedCombatants,
      });

      addToast(`${combatant.name} rolled ${newInitiative} for initiative`, 'info', true);
    },
    [combatants, combatState, addToast, updateCombatState],
  );

  // Update pre-combat initiative for a specific combatant
  const updatePreCombatInitiative = useCallback(
    (combatant: CombatantWithInitiative, newInitiative: number) => {
      updatePreCombatInitiatives({
        ...preCombatInitiatives,
        [combatant.name]: newInitiative,
      });
    },
    [preCombatInitiatives, updatePreCombatInitiatives],
  );

  // Update pre-combat initiative for multiple combatants at once
  const updateMultiplePreCombatInitiatives = useCallback(
    (updates: Array<{ combatant: CombatantWithInitiative; initiative: number }>) => {
      const newInitiatives = { ...preCombatInitiatives };
      updates.forEach(({ combatant, initiative }) => {
        newInitiatives[combatant.name] = initiative;
      });
      updatePreCombatInitiatives(newInitiatives);
    },
    [preCombatInitiatives, updatePreCombatInitiatives],
  );

  // Update initiative during combat
  const updateInitiative = useCallback(
    (targetCombatant: CombatantWithInitiative, newInitiative: number) => {
      const targetIndex = combatants.findIndex((c) => c.id === targetCombatant.id);

      if (targetIndex === -1) return;

      const foundCombatant = combatants[targetIndex];
      if (!foundCombatant) return;

      const updatedCombatant: CombatantWithInitiative = {
        ...foundCombatant,
        initiative: newInitiative,
        // Give new _sortId like the working monsters button does
        _sortId: getCombatantSortId(foundCombatant.name, targetIndex),
      };

      const updatedCombatants = [...combatants];
      updatedCombatants[targetIndex] = updatedCombatant;

      // For players during combat, also update pre-combat storage for persistence
      if (targetCombatant.isPlayer) {
        updatePreCombatInitiatives({
          ...preCombatInitiatives,
          [targetCombatant.name]: newInitiative,
        });
      }

      updateCombatState({
        ...combatState,
        combatants: updatedCombatants,
      });
    },
    [combatants, combatState, updateCombatState, preCombatInitiatives, updatePreCombatInitiatives],
  );

  // Roll initiative for all monsters during combat
  const rollInitiativeForMonsters = useCallback(() => {
    const monsters = combatants.filter((c) => !c.isPlayer);
    if (monsters.length === 0) return;

    const updatedCombatants = combatants.map((combatant, index) => {
      if (!combatant.isPlayer) {
        return {
          ...combatant,
          initiative: rollInitiative(combatant.dexModifier),
          _sortId: getCombatantSortId(combatant.name, index),
        };
      }
      return combatant;
    });

    updateCombatState({
      ...combatState,
      combatants: updatedCombatants,
    });

    addToast(`Rolled initiative for ${monsters.length} monsters`, 'info', true);
  }, [combatants, combatState, updateCombatState, addToast]);

  // Update HP for a specific combatant
  const updateCombatantHp = useCallback(
    (targetCombatant: CombatantWithInitiative, newHp: number) => {
      const updatedCombatants = combatants.map((combatant) => {
        if (combatant.id === targetCombatant.id) {
          return {
            ...combatant,
            hp: { ...combatant.hp, current: Math.max(0, newHp) },
          };
        }
        return combatant;
      });

      updateCombatState({
        ...combatState,
        combatants: updatedCombatants,
      });
    },
    [combatants, combatState, updateCombatState],
  );

  // Set current turn
  const setCurrentTurn = useCallback(
    (index: number) => {
      updateCombatState({
        ...combatState,
        currentTurn: index,
      });
    },
    [combatState, updateCombatState],
  );

  // Next turn
  const nextTurn = useCallback(() => {
    if (combatants.length === 0) return;

    const newTurn = currentTurn + 1;
    if (newTurn >= combatants.length) {
      // Clear all initiative values for the new round
      const combatantsWithClearedInitiative = combatants.map((combatant, index) => ({
        ...combatant,
        initiative: 0,
        _sortId: getCombatantSortId(combatant.name, index),
      }));

      updateCombatState({
        ...combatState,
        combatants: combatantsWithClearedInitiative,
        currentTurn: 0,
        round: round + 1,
      });
      addToast(`Round ${round + 1} begins! Roll initiative for all combatants.`, 'info', true);
    } else {
      updateCombatState({
        ...combatState,
        currentTurn: newTurn,
      });

      const currentCombatantInTurn = combatants[newTurn];
      addToast(`${currentCombatantInTurn?.name}'s turn`, 'info', true);
    }
  }, [combatants, combatState, currentTurn, round, addToast, updateCombatState]);

  // End combat
  const endCombat = useCallback(() => {
    updateCombatState({
      combatants: [],
      currentTurn: 0,
      round: 1,
      isActive: false,
    });
    addToast('Combat ended', 'success');
  }, [addToast, updateCombatState]);

  return {
    // State
    combatState,
    combatants,
    currentTurn,
    round,
    isCombatActive,
    currentCombatant,
    allCombatantsHaveInitiative,
    availablePlayers,
    currentCombatants,
    currentCombatantsWithInitiative,

    // Actions
    addPlayerToCombat,
    removeCombatant,
    initializeCombat,
    rollInitiativeFor,
    rollInitiativeForMonsters,
    updatePreCombatInitiative,
    updateMultiplePreCombatInitiatives,
    updateInitiative,
    updateCombatantHp,
    setCurrentTurn,
    nextTurn,
    endCombat,
  };
}
