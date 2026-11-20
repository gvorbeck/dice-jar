// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { expect, it } from 'vitest';
import { useTitle } from './useTitle';

it('sets the tab title and follows changes', () => {
  const { rerender } = renderHook(({ t }) => useTitle(t), { initialProps: { t: 'One' } });
  expect(document.title).toBe('One');
  rerender({ t: 'Two' });
  expect(document.title).toBe('Two');
});
