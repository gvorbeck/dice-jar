// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it } from 'vitest';
import { useSiteTitle } from './useSiteTitle';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const Probe = ({ title }: { title?: string }) => {
  useSiteTitle(title);
  return null;
};

it('adds the site name, or the default when there is no title', () => {
  const root = createRoot(document.createElement('div'));
  act(() => root.render(createElement(Probe, { title: 'Wren' })));
  expect(document.title).toBe('Wren · Glyph Quest');
  act(() => root.render(createElement(Probe, {})));
  expect(document.title).toBe('Glyph Quest · Character creator and party tracker');
  act(() => root.unmount());
});
