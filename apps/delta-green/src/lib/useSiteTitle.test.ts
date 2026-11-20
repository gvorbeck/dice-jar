import { renderHook } from '@testing-library/react';
import { expect, it } from 'vitest';
import { useSiteTitle } from './useSiteTitle';

it('adds the site suffix, or the intake default when there is no title', () => {
  const { rerender } = renderHook(({ t }: { t?: string }) => useSiteTitle(t), { initialProps: { t: 'Agent' } });
  expect(document.title).toBe('Agent // YOURCODENA.ME');
  rerender({ t: undefined });
  expect(document.title).toBe('YOURCODENA.ME // Agent Intake');
});
