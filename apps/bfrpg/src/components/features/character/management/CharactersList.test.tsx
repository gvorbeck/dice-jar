import '@/utils'; // first: validation/rules and utils import each other, and this order is the one that loads
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CharactersList } from './CharactersList';

const deleteCharacter = vi.fn();
const state = { characters: [] as unknown[], isLoading: false, error: null as unknown, user: { uid: 'u1' } as { uid: string } | null };

vi.mock('@/hooks/queries/useEnhancedQueries', () => ({
  useEnhancedCharacters: () => ({ data: state.characters, isLoading: state.isLoading, error: state.error }),
}));
vi.mock('@/hooks/mutations/useEnhancedMutations', () => ({ useCharacterMutations: () => ({ deleteCharacter, isDeleting: false }) }));
vi.mock('@/hooks', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useAuth: () => ({ user: state.user }),
  useInitialLoadingState: (loading: boolean) => loading,
}));
vi.mock('./CharacterCard', () => ({
  CharacterCard: ({ character, onDelete }: { character: { id: string; name: string }; onDelete: (id: string, name: string) => void }) => (
    <button onClick={() => onDelete(character.id, character.name)}>{character.name}</button>
  ),
}));
vi.mock('./ImportCharacterModal', () => ({ default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>import open</div> : null) }));
vi.mock('./ExportCharacterModal', () => ({ default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>export open</div> : null) }));
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

const chars = [
  { id: 'a', name: 'Brom', level: 1, class: 'fighter', race: 'human' },
  { id: 'b', name: 'Ada', level: 5, class: 'thief', race: 'elf' },
];
const names = () => screen.getAllByRole('button', { name: /^(Brom|Ada)$/ }).map((b) => b.textContent);

beforeEach(() => {
  deleteCharacter.mockReset();
  Object.assign(state, { characters: chars, isLoading: false, error: null, user: { uid: 'u1' } });
});

describe('CharactersList', () => {
  it('lists characters by name, and says so when there are none', () => {
    render(<CharactersList />);
    expect(names()).toEqual(['Ada', 'Brom']);
    expect(screen.getByRole('button', { name: /Export/ })).toBeEnabled();
  });

  it('shows the empty state, with Export off', () => {
    state.characters = [];
    render(
      <MemoryRouter>
        <CharactersList />
      </MemoryRouter>,
    );
    expect(screen.getByText('No Characters Yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export/ })).toBeDisabled();
    expect(screen.queryByText('Sort by')).toBeNull();
  });

  it('opens the import and export dialogs', async () => {
    const user = userEvent.setup();
    render(<CharactersList />);
    await user.click(screen.getByRole('button', { name: /Import/ }));
    expect(screen.getByText('import open')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Export/ }));
    expect(screen.getByText('export open')).toBeInTheDocument();
  });

  it('asks before deleting, then deletes for the signed-in user', async () => {
    const user = userEvent.setup();
    render(<CharactersList />);
    await user.click(screen.getByRole('button', { name: 'Brom' }));
    expect(screen.getByText('delete Brom?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'confirm' }));
    expect(deleteCharacter).toHaveBeenCalledWith({ userId: 'u1', characterId: 'a', characterName: 'Brom' });
    expect(screen.queryByText('delete Brom?')).toBeNull();
  });

  it('closes the dialog without deleting on cancel', async () => {
    const user = userEvent.setup();
    render(<CharactersList />);
    await user.click(screen.getByRole('button', { name: 'Ada' }));
    await user.click(screen.getByRole('button', { name: 'cancel' }));
    expect(deleteCharacter).not.toHaveBeenCalled();
    expect(screen.queryByText('delete Ada?')).toBeNull();
  });

  it('does nothing about a delete when nobody is signed in', async () => {
    state.user = null;
    const user = userEvent.setup();
    render(<CharactersList />);
    await user.click(screen.getByRole('button', { name: 'Brom' }));
    expect(screen.queryByText('delete Brom?')).toBeNull();
  });
});
