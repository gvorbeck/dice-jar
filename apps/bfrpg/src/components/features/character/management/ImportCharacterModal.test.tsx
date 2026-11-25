import '@/utils'; // first: validation/rules and utils import each other, and this order is the one that loads
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImportCharacterModal from './ImportCharacterModal';

const saveCharacter = vi.fn();
const addToast = vi.fn();
vi.mock('@/hooks/mutations/useEnhancedMutations', () => ({ useCharacterMutations: () => ({ saveCharacter }) }));
vi.mock('@dice-jar/browser', async (importOriginal) => ({ ...(await importOriginal<object>()), useToast: () => ({ addToast }) }));

const good = {
  name: 'Thorin',
  race: 'dwarf',
  class: 'fighter',
  level: 1,
  xp: 0,
  abilities: {
    strength: { value: 16, modifier: 2 },
    dexterity: { value: 12, modifier: 0 },
    constitution: { value: 15, modifier: 1 },
    intelligence: { value: 10, modifier: 0 },
    wisdom: { value: 13, modifier: 1 },
    charisma: { value: 14, modifier: 1 },
  },
  hp: { current: 8, max: 8, die: '1d8' },
  currency: { gold: 100 },
  equipment: [],
  schemaVersion: 3,
};

const setup = async (content: string) => {
  const onClose = vi.fn();
  const user = userEvent.setup();
  render(<ImportCharacterModal isOpen onClose={onClose} userId="u1" />);
  await user.upload(screen.getByLabelText(/Select Character File/), new File([content], 'c.json', { type: 'application/json' }));
  await user.click(screen.getByRole('button', { name: /Import Character/ }));
  return { onClose };
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('ImportCharacterModal', () => {
  it('needs a file chosen first', () => {
    render(<ImportCharacterModal isOpen onClose={vi.fn()} userId="u1" />);
    expect(screen.getByRole('button', { name: /Import Character/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Example/ })).toBeInTheDocument();
  });

  it('saves a good character as a new one, says so, and closes', async () => {
    saveCharacter.mockResolvedValue('c1');
    const { onClose } = await setup(JSON.stringify(good));
    expect(saveCharacter).toHaveBeenCalledWith({ userId: 'u1', character: expect.objectContaining({ name: 'Thorin', race: 'dwarf' }) });
    expect(addToast).toHaveBeenCalledWith('Successfully imported Thorin', 'success');
    expect(onClose).toHaveBeenCalled();
  });

  it('refuses a file that is not JSON', async () => {
    const { onClose } = await setup('not json');
    expect(await screen.findByText('Invalid file format. Please upload a valid JSON file.')).toBeInTheDocument();
    expect(saveCharacter).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  // Ability scores run 3 to 18 (Core Rules p. 4) and levels 1 to 20.
  it('refuses a character outside the book ranges', async () => {
    await setup(JSON.stringify({ ...good, level: 25, abilities: { ...good.abilities, strength: { value: 30, modifier: 2 } } }));
    expect(await screen.findByText(/Character data validation failed/)).toBeInTheDocument();
    expect(saveCharacter).not.toHaveBeenCalled();
  });

  it('says so when the save fails', async () => {
    saveCharacter.mockResolvedValue(undefined);
    const { onClose } = await setup(JSON.stringify(good));
    expect(await screen.findByText('Failed to save character. Please try again.')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on Cancel', async () => {
    const onClose = vi.fn();
    render(<ImportCharacterModal isOpen onClose={onClose} userId="u1" />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
});
