import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderRoute } from '@/test/renderWithProviders';
import { Game } from '../Game';
import type { GameSession } from '@/model';

const store = vi.hoisted(() => {
  let current: unknown;
  const listeners = new Set<() => void>();
  return {
    get: () => current,
    set: (next: unknown) => {
      current = next;
      listeners.forEach((l) => l());
    },
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
});
const reorderCharacters = vi.hoisted(() => vi.fn<(next: unknown[]) => Promise<void>>());

vi.mock('@/lib/useGame', async () => {
  const { useSyncExternalStore } = await import('react');
  return {
    useGame: () => ({
      game: useSyncExternalStore(store.subscribe, store.get),
      loading: false,
      error: null,
      reorderCharacters,
      updateGameName: vi.fn(),
      addCharacter: vi.fn(),
      removeCharacter: vi.fn(),
      replaceGameData: vi.fn(),
      logRoll: vi.fn(),
    }),
  };
});

const session = (ids: string[]): GameSession => ({
  id: 'g1',
  name: 'Party',
  createdAt: 0,
  characters: ids.map((id) => ({ id, name: id, playbook: id === 'a' ? 'heavy' : 'fox', level: 1 })),
});

const order = () => screen.getAllByRole('link', { name: /Playbook/ }).map((l) => l.textContent ?? '');

beforeEach(() => {
  reorderCharacters.mockReset();
  store.set(session(['a', 'b']));
});

// Without this, a snapshot that still carries the old order snaps the list back under the player's hands.
describe('Game party order', () => {
  it('keeps a reorder on screen while its save is in flight, then follows the server', async () => {
    let finishSave: () => void = () => {};
    reorderCharacters.mockReturnValue(new Promise<void>((resolve) => (finishSave = resolve)));
    renderRoute(<Game />, '/game/g1', '/game/:id');
    expect(order()[0]).toContain('The Heavy');

    screen.getByRole('button', { name: /^Move a .* down$/ }).focus();
    await userEvent.keyboard('{Enter}');
    expect(order()[0]).toContain('The Fox');

    act(() => store.set(session(['a', 'b']))); // an older snapshot arrives mid-save
    expect(order()[0]).toContain('The Fox');

    act(() => store.set(session(['b', 'a']))); // the write echoes back
    await act(async () => finishSave());
    expect(order()[0]).toContain('The Fox');
  });

  it('falls back to the server order when the save fails', async () => {
    reorderCharacters.mockRejectedValue(new Error('offline'));
    renderRoute(<Game />, '/game/g1', '/game/:id');
    screen.getByRole('button', { name: /^Move a .* down$/ }).focus();
    await userEvent.keyboard('{Enter}');
    await act(async () => {});
    expect(order()[0]).toContain('The Heavy');
  });
});
