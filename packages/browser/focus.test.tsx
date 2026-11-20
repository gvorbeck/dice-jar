// @vitest-environment jsdom
import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { expect, it, vi } from 'vitest';
import { SkipLink, useFocusMain } from './focus';

const main = () => {
  const el = document.createElement('main');
  el.id = 'main';
  el.tabIndex = -1;
  document.body.append(el);
  return el;
};

it('the skip link focuses <main> without changing the URL', () => {
  const el = main();
  render(<SkipLink className="skip" />);
  fireEvent.click(screen.getByRole('link', { name: 'Skip to content' }));
  expect(document.activeElement).toBe(el);
  expect(location.hash).toBe('');
  el.remove();
});

it('focuses <main> on every view but the first, even under StrictMode', () => {
  const el = main();
  vi.useFakeTimers();
  renderHook(useFocusMain, { wrapper: StrictMode }); // dev runs effects twice; that must not count as a second view
  expect(document.activeElement).not.toBe(el);
  vi.runAllTimers();
  vi.useRealTimers();
  renderHook(useFocusMain);
  expect(document.activeElement).toBe(el);
  el.remove();
});
