import '@/utils'; // first: validation/rules and utils import each other, and this order is the one that loads
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getCharacterById } from '@/services';
import { createMockCharacter } from '@/test/helpers';
import ExportCharacterModal from './ExportCharacterModal';

const addToast = vi.fn();
const downloadJson = vi.fn();
const downloadText = vi.fn();
vi.mock('@dice-jar/browser', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useToast: () => ({ addToast }),
  downloadJson: (...a: unknown[]) => downloadJson(...a),
  downloadText: (...a: unknown[]) => downloadText(...a),
}));
vi.mock('@/services', () => ({ getCharacterById: vi.fn() }));

const characters = [
  { id: 'a', name: 'Brom', level: 3, class: 'fighter', race: 'human' },
  { id: 'b', name: 'Ada', level: 1, class: 'thief', race: 'elf' },
];
const setup = () => {
  const onClose = vi.fn();
  render(<ExportCharacterModal isOpen onClose={onClose} characters={characters} userId="u1" />);
  return { onClose, user: userEvent.setup() };
};
const exportButton = () => screen.getByRole('button', { name: /Export Character/ });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCharacterById).mockResolvedValue(createMockCharacter({ name: 'Sir Brom' }));
});

describe('ExportCharacterModal', () => {
  it('lists the characters with their level, class and race, and needs one picked', () => {
    setup();
    expect(screen.getByText('Level 3 fighter • human')).toBeInTheDocument();
    expect(exportButton()).toBeDisabled();
  });

  it('exports the picked character as JSON, named for them and the date', async () => {
    const { user, onClose } = setup();
    await user.click(screen.getByRole('button', { name: /Brom/ }));
    expect(screen.getByRole('button', { name: /Brom/ })).toHaveAttribute('aria-pressed', 'true');
    await user.click(exportButton());
    expect(getCharacterById).toHaveBeenCalledWith('u1', 'a');
    expect(downloadJson).toHaveBeenCalledWith(
      expect.stringMatching(/^sir-brom_\d{4}-\d{2}-\d{2}\.json$/),
      expect.objectContaining({ name: 'Sir Brom' }),
    );
    expect(addToast).toHaveBeenCalledWith('Exported Sir Brom as JSON', 'success');
    expect(onClose).toHaveBeenCalled();
  });

  it('says so when the character is gone', async () => {
    vi.mocked(getCharacterById).mockResolvedValue(null);
    const { user, onClose } = setup();
    await user.click(screen.getByRole('button', { name: /Ada/ }));
    await user.click(exportButton());
    expect(await screen.findByText(/Character not found/)).toBeInTheDocument();
    expect(downloadJson).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on Cancel', async () => {
    const { user, onClose } = setup();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
});
