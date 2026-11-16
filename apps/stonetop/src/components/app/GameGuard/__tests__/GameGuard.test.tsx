import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import { GameGuard } from '../GameGuard';

// AGENTS.md: every page has a unique title and a description, and a game's pages are noindex.
describe('GameGuard — pages with no game to show', () => {
  it('titles and noindexes the error page', async () => {
    renderWithProviders(
      <GameGuard loading={false} error="boom" game={null}>
        {() => null}
      </GameGuard>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Something went wrong — Hearthfire'));
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute('content');
  });

  it('titles and noindexes the game-not-found page', async () => {
    renderWithProviders(
      <GameGuard loading={false} error={null} game={null}>
        {() => null}
      </GameGuard>,
    );
    await waitFor(() => expect(document.title).toBe('Game not found — Hearthfire'));
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  });
});
