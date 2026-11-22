import { useRef } from 'react';
import { useRun, useToast } from '@dice-jar/browser';
import type { Character, Game, EquipmentPack } from '@/types';
import {
  saveCharacter as saveCharacterService,
  deleteCharacter as deleteCharacterService,
  saveGame as saveGameService,
  deleteGame as deleteGameService,
} from '@/services';
import { applyEquipmentPackToCharacter } from '@/utils/equipment';
import { getErrorMessage } from '@/utils';

/**
 * Character save / delete / equipment-pack actions; each says how it went in a toast.
 * The live listeners show the result, so nothing is updated by hand here.
 */
export function useCharacterMutations(options?: {
  onSaveSuccess?: (characterId: string) => void;
  onDeleteSuccess?: () => void;
  onPackApplied?: () => void;
}) {
  const { addToast } = useToast();
  const opts = useRef(options);
  opts.current = options;
  const save = useRun('Failed to save character. Please try again.');
  const remove = useRun();
  const pack = useRun(getErrorMessage);

  return {
    /** Resolves to the saved character's ID, or undefined if saving failed (already reported). */
    saveCharacter: async (v: { userId: string; character: Character; characterId?: string }) => {
      const verb = v.characterId ? 'update' : 'save';
      let id: string | undefined;
      await save.run(async () => void (id = await saveCharacterService(v.userId, v.character, v.characterId)));
      if (id === undefined) {
        addToast(`Failed to ${verb} character "${v.character.name}".`, 'error');
        return undefined;
      }
      addToast(`Character "${v.character.name}" ${verb}d.`, 'success');
      opts.current?.onSaveSuccess?.(id);
      return id;
    },
    deleteCharacter: async (v: { userId: string; characterId: string; characterName?: string }) => {
      const name = v.characterName || 'Unknown character';
      if (!(await remove.run(() => deleteCharacterService(v.userId, v.characterId)))) {
        addToast(`Failed to delete character "${name}".`, 'error');
        return;
      }
      addToast(`Character "${name}" deleted.`, 'success');
      opts.current?.onDeleteSuccess?.();
    },
    /** Resolves to the character with the pack's gear, or undefined if it couldn't be applied (shown in packError). */
    applyEquipmentPack: async (v: { character: Character; pack: EquipmentPack }) => {
      let applied: Character | undefined;
      await pack.run(async () => {
        const { character, result } = applyEquipmentPackToCharacter(v.character, v.pack);
        if (!result.success) throw new Error(result.error || 'Failed to apply equipment pack');
        applied = character;
      });
      if (!applied) return undefined;
      addToast(`Equipment pack "${v.pack.name}" applied.`, 'success');
      opts.current?.onPackApplied?.();
      return applied;
    },
    isSaving: save.busy,
    isDeleting: remove.busy,
    isApplyingPack: pack.busy,
    saveError: save.err,
    packError: pack.err,
  };
}

/** Game save / delete actions; each says how it went in a toast. */
export function useGameMutations(options?: { onSaveSuccess?: () => void; onDeleteSuccess?: () => void }) {
  const { addToast } = useToast();
  const opts = useRef(options);
  opts.current = options;
  const save = useRun();
  const remove = useRun();

  return {
    saveGame: async (v: { userId: string; game: Game; gameId?: string }) => {
      const verb = v.gameId ? 'update' : 'save';
      if (!(await save.run(() => saveGameService(v.userId, v.game, v.gameId)))) {
        addToast(`Failed to ${verb} game "${v.game.name}".`, 'error');
        return;
      }
      addToast(`Game "${v.game.name}" ${verb}d.`, 'success');
      opts.current?.onSaveSuccess?.();
    },
    deleteGame: async (v: { userId: string; gameId: string; gameName?: string }) => {
      const name = v.gameName || 'Unknown game';
      if (!(await remove.run(() => deleteGameService(v.userId, v.gameId)))) {
        addToast(`Failed to delete game "${name}".`, 'error');
        return;
      }
      addToast(`Game "${name}" deleted.`, 'success');
      opts.current?.onDeleteSuccess?.();
    },
    isSaving: save.busy,
    isDeleting: remove.busy,
  };
}
