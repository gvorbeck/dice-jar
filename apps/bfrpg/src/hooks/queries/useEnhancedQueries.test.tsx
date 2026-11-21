import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const { watchCharacter, watchGame } = vi.hoisted(() => ({ watchCharacter: vi.fn(() => () => {}), watchGame: vi.fn(() => () => {}) }));
vi.mock('@/services', () => ({ watchCharacter, watchGame, watchUserCharacters: vi.fn(), watchUserGames: vi.fn() }));
vi.mock('@/hooks', () => ({ useAuth: () => ({ user: { uid: 'u' } }), useNotificationContext: () => ({}) }));
vi.mock('@/lib/globalErrorHandler', () => ({ createMutationHandlers: () => ({ queryError: vi.fn() }) }));

import { useEnhancedCharacterSheet, useEnhancedGame } from './useEnhancedQueries';

describe('useEnhanced* with a half-empty key', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ['u', ''],
    ['', 'c'],
    ['', ''],
  ])('does not subscribe to a character for (%j, %j)', (userId, id) => {
    renderHook(() => useEnhancedCharacterSheet(userId, id));
    expect(watchCharacter).not.toHaveBeenCalled();
  });

  it('does not subscribe to a game with a missing id', () => {
    renderHook(() => useEnhancedGame('u', ''));
    expect(watchGame).not.toHaveBeenCalled();
  });

  it('subscribes once both ids are there', () => {
    renderHook(() => useEnhancedCharacterSheet('u', 'c'));
    expect(watchCharacter).toHaveBeenCalledWith('u', 'c', expect.any(Function), expect.any(Function));
  });
});
