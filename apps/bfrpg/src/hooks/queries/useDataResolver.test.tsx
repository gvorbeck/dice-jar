import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const { getCharacterById } = vi.hoisted(() => ({ getCharacterById: vi.fn() }));
vi.mock('@/services', () => ({ getCharacterById }));

import { useDataResolver } from './useDataResolver';

const requests = [{ userId: 'u', characterId: 'c' }];

describe('useDataResolver', () => {
  it('reports a failed lookup and shows the character by its id', async () => {
    getCharacterById.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useDataResolver(requests));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasError).toBe(true);
    expect(result.current.getResolvedData('u', 'c')).toEqual({ characterName: 'c' });
  });

  it('shows a missing character by its id without an error', async () => {
    getCharacterById.mockResolvedValue(null);
    const { result } = renderHook(() => useDataResolver(requests));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasError).toBe(false);
  });
});
