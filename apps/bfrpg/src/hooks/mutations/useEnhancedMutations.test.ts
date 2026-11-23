import '@/utils'; // first: validation/rules and utils import each other, and this order is the one that loads
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { saveCharacter, deleteCharacter, saveGame, deleteGame } from '@/services';
import { createMockCharacter } from '@/test/helpers';
import type { EquipmentPack, Game } from '@/types';
import { useCharacterMutations, useGameMutations } from './useEnhancedMutations';

const addToast = vi.fn();
vi.mock('@dice-jar/browser', async (importOriginal) => ({ ...(await importOriginal<object>()), useToast: () => ({ addToast }) }));
vi.mock('@/services', () => ({
  saveCharacter: vi.fn(),
  deleteCharacter: vi.fn(),
  saveGame: vi.fn(),
  deleteGame: vi.fn(),
}));

const character = createMockCharacter({ name: 'Brom', currency: { gold: 100 }, equipment: [] });
const game = { name: 'Lost Mine' } as unknown as Game;
const pack = { id: 'p', name: 'Basic Pack', cost: 7, items: [{ equipmentId: 'dagger-138', quantity: 1 }] } as unknown as EquipmentPack;

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('useCharacterMutations', () => {
  it('saves a new character, says so, and gives back the id', async () => {
    vi.mocked(saveCharacter).mockResolvedValue('c1');
    const onSaveSuccess = vi.fn();
    const { result } = renderHook(() => useCharacterMutations({ onSaveSuccess }));
    let id: string | undefined;
    await act(async () => void (id = await result.current.saveCharacter({ userId: 'u1', character })));
    expect(saveCharacter).toHaveBeenCalledWith('u1', character, undefined);
    expect(id).toBe('c1');
    expect(addToast).toHaveBeenCalledWith('Character "Brom" saved.', 'success');
    expect(onSaveSuccess).toHaveBeenCalledWith('c1');
  });

  it('says "updated" when it saves over an existing character', async () => {
    vi.mocked(saveCharacter).mockResolvedValue('c1');
    const { result } = renderHook(() => useCharacterMutations());
    await act(async () => void (await result.current.saveCharacter({ userId: 'u1', character, characterId: 'c1' })));
    expect(addToast).toHaveBeenCalledWith('Character "Brom" updated.', 'success');
  });

  it('reports a failed save and returns nothing', async () => {
    vi.mocked(saveCharacter).mockRejectedValue(new Error('denied'));
    const onSaveSuccess = vi.fn();
    const { result } = renderHook(() => useCharacterMutations({ onSaveSuccess }));
    let id: string | undefined = 'x';
    await act(async () => void (id = await result.current.saveCharacter({ userId: 'u1', character })));
    expect(id).toBeUndefined();
    expect(addToast).toHaveBeenCalledWith('Failed to save character "Brom".', 'error');
    expect(onSaveSuccess).not.toHaveBeenCalled();
  });

  it('deletes a character and says so, or says it failed', async () => {
    vi.mocked(deleteCharacter).mockResolvedValueOnce(undefined);
    const onDeleteSuccess = vi.fn();
    const { result } = renderHook(() => useCharacterMutations({ onDeleteSuccess }));
    await act(async () => void (await result.current.deleteCharacter({ userId: 'u1', characterId: 'c1', characterName: 'Brom' })));
    expect(addToast).toHaveBeenCalledWith('Character "Brom" deleted.', 'success');
    expect(onDeleteSuccess).toHaveBeenCalled();
    vi.mocked(deleteCharacter).mockRejectedValueOnce(new Error('denied'));
    await act(async () => void (await result.current.deleteCharacter({ userId: 'u1', characterId: 'c1' })));
    expect(addToast).toHaveBeenLastCalledWith('Failed to delete character "Unknown character".', 'error');
  });

  it('applies an equipment pack and gives back the character with its gear', async () => {
    const onPackApplied = vi.fn();
    const { result } = renderHook(() => useCharacterMutations({ onPackApplied }));
    let applied: Awaited<ReturnType<typeof result.current.applyEquipmentPack>>;
    await act(async () => void (applied = await result.current.applyEquipmentPack({ character, pack })));
    expect(applied!.currency.gold).toBe(93);
    expect(applied!.equipment).toHaveLength(1);
    expect(addToast).toHaveBeenCalledWith('Equipment pack "Basic Pack" applied.', 'success');
    expect(onPackApplied).toHaveBeenCalled();
  });

  it('keeps the error when a pack cannot be applied', async () => {
    const { result } = renderHook(() => useCharacterMutations());
    let applied: unknown = 'x';
    await act(
      async () => void (applied = await result.current.applyEquipmentPack({ character: { ...character, currency: { gold: 1 } }, pack })),
    );
    expect(applied).toBeUndefined();
    expect(result.current.packError).toContain('Not enough gold');
    expect(addToast).not.toHaveBeenCalled();
  });
});

describe('useGameMutations', () => {
  it('saves a game, new or existing, and says so', async () => {
    vi.mocked(saveGame).mockResolvedValue('g1');
    const onSaveSuccess = vi.fn();
    const { result } = renderHook(() => useGameMutations({ onSaveSuccess }));
    await act(async () => void (await result.current.saveGame({ userId: 'u1', game })));
    expect(addToast).toHaveBeenLastCalledWith('Game "Lost Mine" saved.', 'success');
    await act(async () => void (await result.current.saveGame({ userId: 'u1', game, gameId: 'g1' })));
    expect(addToast).toHaveBeenLastCalledWith('Game "Lost Mine" updated.', 'success');
    expect(onSaveSuccess).toHaveBeenCalledTimes(2);
  });

  it('reports a failed save and a failed delete', async () => {
    vi.mocked(saveGame).mockRejectedValue(new Error('denied'));
    vi.mocked(deleteGame).mockRejectedValue(new Error('denied'));
    const { result } = renderHook(() => useGameMutations());
    await act(async () => void (await result.current.saveGame({ userId: 'u1', game })));
    expect(addToast).toHaveBeenLastCalledWith('Failed to save game "Lost Mine".', 'error');
    await act(async () => void (await result.current.deleteGame({ userId: 'u1', gameId: 'g1' })));
    expect(addToast).toHaveBeenLastCalledWith('Failed to delete game "Unknown game".', 'error');
  });

  it('deletes a game and says so', async () => {
    vi.mocked(deleteGame).mockResolvedValue(undefined);
    const onDeleteSuccess = vi.fn();
    const { result } = renderHook(() => useGameMutations({ onDeleteSuccess }));
    await act(async () => void (await result.current.deleteGame({ userId: 'u1', gameId: 'g1', gameName: 'Lost Mine' })));
    expect(addToast).toHaveBeenCalledWith('Game "Lost Mine" deleted.', 'success');
    expect(onDeleteSuccess).toHaveBeenCalled();
  });
});
