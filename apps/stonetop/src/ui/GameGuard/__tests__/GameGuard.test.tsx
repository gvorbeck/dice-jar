import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import { GameGuard } from '../GameGuard';

// AGENTS.md: every page has a unique title. The description is static in index.html; noindex is the /game/** header in firebase.json.
describe('GameGuard — pages with no game to show', () => {
  it('titles the error page', async () => {
    renderWithProviders(
      <GameGuard loading={false} error="boom" game={null}>
        {() => null}
      </GameGuard>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Something went wrong — Hearthfire'));
  });

  it('titles the game-not-found page', async () => {
    renderWithProviders(
      <GameGuard loading={false} error={null} game={null}>
        {() => null}
      </GameGuard>,
    );
    await waitFor(() => expect(document.title).toBe('Game not found — Hearthfire'));
  });
});
