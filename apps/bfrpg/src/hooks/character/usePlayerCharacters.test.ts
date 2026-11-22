import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { Game } from '@/types';
import { usePlayerCharacters } from './usePlayerCharacters';

const equipment = [{ name: 'Chain Mail', wearing: true, AC: 5, amount: 1 }];
const abilities = { dexterity: { value: 16, modifier: 2 } };
vi.mock('../queries/useDataResolver', () => ({
  useDataResolver: () => ({
    getResolvedData: () => ({ characterName: 'Ana', avatar: 'a.png', hp: { current: 4, max: 9 }, equipment, abilities }),
    isLoading: false,
    hasError: false,
  }),
}));

describe('usePlayerCharacters', () => {
  it('keeps what combat needs: hit points, armor, abilities and avatar', () => {
    const game = { id: 'g', players: [{ user: 'u', character: 'c' }] } as unknown as Game;
    const { result } = renderHook(() => usePlayerCharacters(game));
    expect(result.current.playerCharacters[0]).toMatchObject({
      name: 'Ana',
      avatar: 'a.png',
      hp: { current: 4, max: 9 },
      equipment,
      abilities,
    });
  });
});
