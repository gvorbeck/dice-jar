import '@/utils'; // first: validation/rules and utils import each other, and this order is the one that loads
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { GamesList } from './GamesList';

const deleteGame = vi.fn();
const state = {
  games: [] as unknown[],
  isLoading: false,
  error: null as { message: string } | null,
  user: { uid: 'u1' } as { uid: string } | null,
};

vi.mock('@/hooks/queries/useEnhancedQueries', () => ({
  useEnhancedGames: () => ({ data: state.games, isLoading: state.isLoading, error: state.error }),
}));
vi.mock('@/hooks/mutations/useEnhancedMutations', () => ({ useGameMutations: () => ({ deleteGame, isDeleting: false }) }));
vi.mock('@/hooks', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useAuth: () => ({ user: state.user }),
  useInitialLoadingState: (loading: boolean) => loading,
}));
vi.mock('./GameCard', () => ({
  GameCard: ({ game, onDelete }: { game: { id: string; name: string }; onDelete: (id: string, name: string) => void }) => (
    <button onClick={() => onDelete(game.id, game.name)}>{game.name}</button>
  ),
}));
vi.mock('@/components/modals/base/ConfirmationModal', () => ({
  DeletionModal: ({
    isOpen,
    entityName,
    onConfirm,
    onClose,
  }: {
    isOpen: boolean;
    entityName: string;
    onConfirm: () => void;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div>
        <span>delete {entityName}?</span>
        <button onClick={onConfirm}>confirm</button>
        <button onClick={onClose}>cancel</button>
      </div>
    ) : null,
}));

const renderList = () =>
  render(
    <MemoryRouter>
      <GamesList />
    </MemoryRouter>,
  );

beforeEach(() => {
  deleteGame.mockReset();
  Object.assign(state, {
    games: [
      { id: 'b', name: 'Zed Campaign' },
      { id: 'a', name: 'Alpha Campaign' },
    ],
    isLoading: false,
    error: null,
    user: { uid: 'u1' },
  });
});

describe('GamesList', () => {
  it('lists games by name, whatever order they arrive in', () => {
    renderList();
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['Alpha Campaign', 'Zed Campaign']);
  });

  it('shows the empty state with a way to make the first game', () => {
    state.games = [];
    renderList();
    expect(screen.getByText('No Games Yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create Your First Game' })).toHaveAttribute('href', '/new-game');
  });

  it('shows an error from loading', () => {
    state.games = [];
    state.error = { message: 'Could not load games' };
    renderList();
    expect(screen.getByText('Error loading your games: Could not load games')).toBeInTheDocument();
  });

  it('asks before deleting, then deletes for the signed-in user', async () => {
    const user = userEvent.setup();
    renderList();
    await user.click(screen.getByRole('button', { name: 'Zed Campaign' }));
    expect(screen.getByText('delete Zed Campaign?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'confirm' }));
    expect(deleteGame).toHaveBeenCalledWith({ userId: 'u1', gameId: 'b', gameName: 'Zed Campaign' });
    expect(screen.queryByText('delete Zed Campaign?')).toBeNull();
  });

  it('closes the dialog without deleting on cancel', async () => {
    const user = userEvent.setup();
    renderList();
    await user.click(screen.getByRole('button', { name: 'Alpha Campaign' }));
    await user.click(screen.getByRole('button', { name: 'cancel' }));
    expect(deleteGame).not.toHaveBeenCalled();
  });

  it('does nothing about a delete when nobody is signed in', async () => {
    state.user = null;
    const user = userEvent.setup();
    renderList();
    await user.click(screen.getByRole('button', { name: 'Alpha Campaign' }));
    expect(screen.queryByText(/delete Alpha/)).toBeNull();
  });
});
