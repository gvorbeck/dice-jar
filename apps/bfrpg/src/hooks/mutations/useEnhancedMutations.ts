import { useRef } from 'react';
import { useNotificationContext } from '@/hooks';
import { createMutationHandlers } from '@/lib/globalErrorHandler';
import type { Character, Game, EquipmentPack } from '@/types';
import {
  saveCharacter as saveCharacterService,
  deleteCharacter as deleteCharacterService,
  saveGame as saveGameService,
  deleteGame as deleteGameService,
} from '@/services';
import { applyEquipmentPackToCharacter } from '@/utils/equipment';
import { useAction } from './useAction';

const quiet = () => undefined;

/**
 * Character save / delete / equipment-pack actions with consistent error handling and user feedback.
 * The live listeners show the result, so nothing is updated by hand here.
 */
export function useCharacterMutations(options?: {
  onSaveSuccess?: (characterId: string) => void;
  onDeleteSuccess?: () => void;
  onPackApplied?: () => void;
}) {
  const { onError, onSuccess } = createMutationHandlers(useNotificationContext());
  const opts = useRef(options);
  opts.current = options;

  const save = useAction(
    (v: { userId: string; character: Character; characterId?: string }) => saveCharacterService(v.userId, v.character, v.characterId),
    (error, v) => onError(error, { operation: v.characterId ? 'Update' : 'Save', entityType: 'character', entityName: v.character.name }),
  );
  const remove = useAction(
    (v: { userId: string; characterId: string; characterName?: string }) => deleteCharacterService(v.userId, v.characterId),
    (error, v) => onError(error, { operation: 'Delete', entityType: 'character', entityName: v.characterName || 'Unknown character' }),
  );
  const pack = useAction(
    async (v: { character: Character; pack: EquipmentPack }) => {
      const { character, result } = applyEquipmentPackToCharacter(v.character, v.pack);
      if (!result.success) throw new Error(result.error || 'Failed to apply equipment pack');
      return { character, pack: v.pack };
    },
    (error, v) => onError(error, { operation: 'Apply', entityType: 'equipment pack', entityName: v.pack?.name || 'Unknown pack' }),
  );

  return {
    /** Resolves to the saved character's ID, or undefined if saving failed (already reported). */
    saveCharacter: async (v: { userId: string; character: Character; characterId?: string }) => {
      const id = await save.run(v).catch(quiet);
      if (id === undefined) return undefined;
      onSuccess({ operation: v.characterId ? 'Update' : 'Save', entityType: 'character', entityName: v.character.name });
      opts.current?.onSaveSuccess?.(id);
      return id;
    },
    deleteCharacter: async (v: { userId: string; characterId: string; characterName?: string }) => {
      const done = await remove.run(v).then(
        () => true,
        () => false,
      );
      if (!done) return;
      onSuccess({ operation: 'Delete', entityType: 'character', entityName: v.characterName || 'Unknown character' });
      opts.current?.onDeleteSuccess?.();
    },
    applyEquipmentPack: async (v: { character: Character; pack: EquipmentPack }) => {
      const applied = await pack.run(v);
      onSuccess({ operation: 'Apply', entityType: 'equipment pack', entityName: v.pack.name });
      opts.current?.onPackApplied?.();
      return applied;
    },
    isSaving: save.isPending,
    isDeleting: remove.isPending,
    isApplyingPack: pack.isPending,
    saveError: save.error,
    deleteError: remove.error,
    packError: pack.error,
  };
}

/**
 * Game save / delete actions with consistent error handling and user feedback.
 */
export function useGameMutations(options?: { onSaveSuccess?: () => void; onDeleteSuccess?: () => void }) {
  const { onError, onSuccess } = createMutationHandlers(useNotificationContext());
  const opts = useRef(options);
  opts.current = options;

  const save = useAction(
    (v: { userId: string; game: Game; gameId?: string }) => saveGameService(v.userId, v.game, v.gameId),
    (error, v) => onError(error, { operation: v.gameId ? 'Update' : 'Save', entityType: 'game', entityName: v.game.name }),
  );
  const remove = useAction(
    (v: { userId: string; gameId: string; gameName?: string }) => deleteGameService(v.userId, v.gameId),
    (error, v) => onError(error, { operation: 'Delete', entityType: 'game', entityName: v.gameName || 'Unknown game' }),
  );

  return {
    saveGame: async (v: { userId: string; game: Game; gameId?: string }) => {
      const id = await save.run(v).catch(quiet);
      if (id === undefined) return;
      onSuccess({ operation: v.gameId ? 'Update' : 'Save', entityType: 'game', entityName: v.game.name });
      opts.current?.onSaveSuccess?.();
    },
    deleteGame: async (v: { userId: string; gameId: string; gameName?: string }) => {
      const done = await remove.run(v).then(
        () => true,
        () => false,
      );
      if (!done) return;
      onSuccess({ operation: 'Delete', entityType: 'game', entityName: v.gameName || 'Unknown game' });
      opts.current?.onDeleteSuccess?.();
    },
    isSaving: save.isPending,
    isDeleting: remove.isPending,
    saveError: save.error,
    deleteError: remove.error,
  };
}
