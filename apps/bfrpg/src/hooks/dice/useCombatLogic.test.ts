import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { Game } from '@/types';
import { useCombatLogic } from './useCombatLogic';

vi.mock('../character', () => ({ usePlayerCharacters: () => ({ playerCharacters: [] }) }));
vi.mock('@dice-jar/browser', async (load) => ({ ...(await load<object>()), useToast: () => ({ addToast: vi.fn() }) }));

beforeEach(() => localStorage.clear());

const combat = (round: number) =>
  JSON.stringify({ combatState: { combatants: [], currentTurn: 0, round, isActive: true }, preCombatInitiatives: {} });

describe('useCombatLogic', () => {
  it("loads each game's own saved combat and does not write one game's over another's", () => {
    localStorage.setItem('combat:g1', combat(3));
    localStorage.setItem('combat:g2', combat(5));
    const { result, rerender } = renderHook(({ game }) => useCombatLogic(game), { initialProps: { game: { id: 'g1' } as Game } });
    expect(result.current.round).toBe(3);

    rerender({ game: { id: 'g2' } as Game });
    expect(result.current.round).toBe(5);
    expect(JSON.parse(localStorage.getItem('combat:g1')!).combatState.round).toBe(3);
  });

  it('starts empty when the saved combat is unreadable', () => {
    localStorage.setItem('combat:g1', '{broken');
    const { result } = renderHook(() => useCombatLogic({ id: 'g1' } as Game));
    expect(result.current.round).toBe(1);
    expect(result.current.isCombatActive).toBe(false);
  });
});
