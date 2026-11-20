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

it('adds the site suffix, or the intake default when there is no title', () => {
  const root = createRoot(document.createElement('div'));
  act(() => root.render(createElement(Probe, { title: 'Agent' })));
  expect(document.title).toBe('Agent // YOURCODENA.ME');
  act(() => root.render(createElement(Probe, {})));
  expect(document.title).toBe('YOURCODENA.ME // Agent Intake');
  act(() => root.unmount());
});
