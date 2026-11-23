import '@/utils'; // first: validation/rules and utils import each other, and this order is the one that loads
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { cantripData } from '@/data';
import { createMockCharacter } from '@/test/helpers';
import CantripSelector from './CantripSelector';

vi.mock('@/components/modals/LazyModals', () => ({
  CantripModal: ({
    isOpen,
    onAdd,
    onSelectionChange,
    cantripOptions,
  }: {
    isOpen: boolean;
    onAdd: () => void;
    onSelectionChange: (name: string) => void;
    cantripOptions: { value: string }[];
  }) =>
    isOpen ? (
      <div role="dialog">
        <button onClick={() => onSelectionChange(cantripOptions[0]!.value)}>pick first</button>
        <button onClick={onAdd}>add picked</button>
      </div>
    ) : null,
}));

const magicUserCantrips = cantripData.filter((c) => c.classes.includes('magic-user'));
const mage = (over = {}) => createMockCharacter({ class: 'magic-user', cantrips: [], ...over });
const setup = (character = mage(), mode: 'creation' | 'edit' = 'edit') => {
  const onCantripChange = vi.fn();
  render(<CantripSelector mode={mode} character={character} onCantripChange={onCantripChange} />);
  return { onCantripChange };
};

describe('CantripSelector', () => {
  it('shows nothing for a character who cannot cast spells', () => {
    const { container } = render(
      <CantripSelector mode="edit" character={createMockCharacter({ class: 'fighter' })} onCantripChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('says none are known yet, and offers to add one', () => {
    setup();
    expect(screen.getByText('No cantrips known yet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add or change cantrips/ })).toHaveTextContent('Add Cantrip');
  });

  it('explains a starting set that may be empty, in creation', () => {
    setup(mage(), 'creation');
    expect(screen.getByText(/No starting cantrips \(Intelligence modifier may be negative\)/)).toBeInTheDocument();
    expect(screen.getByText('Your Starting Cantrips')).toBeInTheDocument();
  });

  it('calls a Cleric spell an orison, on Wisdom', () => {
    setup(createMockCharacter({ class: 'cleric', cantrips: [] }));
    expect(screen.getByText('No orisons known yet.')).toBeInTheDocument();
  });

  it('adds the cantrip picked in the dialog to the ones known', async () => {
    const user = userEvent.setup();
    const { onCantripChange } = setup();
    await user.click(screen.getByRole('button', { name: /Add or change cantrips/ }));
    await user.click(screen.getByRole('button', { name: 'pick first' }));
    await user.click(screen.getByRole('button', { name: 'add picked' }));
    expect(onCantripChange).toHaveBeenCalledWith([expect.objectContaining({ name: magicUserCantrips[0]!.name })]);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('lists the cantrips known with a count, and removes one', async () => {
    const user = userEvent.setup();
    const known = magicUserCantrips.slice(0, 2);
    const { onCantripChange } = setup(mage({ cantrips: known }));
    expect(screen.getByRole('list', { name: 'Known cantrips' })).toBeInTheDocument();
    expect(screen.getByLabelText('2 cantrips known')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add or change cantrips/ })).toHaveTextContent('Change Selection');
    await user.click(screen.getAllByRole('button', { name: /remove/i })[0]!);
    expect(onCantripChange).toHaveBeenCalledWith([expect.objectContaining({ name: known[1]!.name })]);
  });

  it('adds nothing when no cantrip was picked', async () => {
    const user = userEvent.setup();
    const { onCantripChange } = setup();
    await user.click(screen.getByRole('button', { name: /Add or change cantrips/ }));
    await user.click(screen.getByRole('button', { name: 'add picked' }));
    expect(onCantripChange).not.toHaveBeenCalled();
  });
});
