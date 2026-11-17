import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTitle } from '../useTitle';

describe('useTitle', () => {
  it('sets the tab title, and the site default when given none', () => {
    const { rerender } = renderHook(({ t }: { t?: string }) => useTitle(t), {
      initialProps: { t: 'A game — Hearthfire' as string | undefined },
    });
    expect(document.title).toBe('A game — Hearthfire');
    rerender({ t: undefined });
    expect(document.title).toBe('Hearthfire — Stonetop Party Tracker');
  });
});
