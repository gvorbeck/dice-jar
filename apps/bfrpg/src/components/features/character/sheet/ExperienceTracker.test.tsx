import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { allClasses } from '@/data';
import { createMockCharacter } from '@/test/helpers';
import ExperienceTracker from './ExperienceTracker';

vi.mock('@/components/modals/LazyModals', () => ({
  LevelUpModal: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div role="dialog">Level up</div> : null),
}));

// Thief: level 2 at 1,250 XP (Core Rules, p. 8).
const thief = (xp: number, level = 1) => createMockCharacter({ class: 'thief', level, xp });
const setup = (character = thief(1000), onChange = vi.fn()) => {
  render(<ExperienceTracker character={character} classes={allClasses} onChange={onChange} />);
  return { onChange, box: screen.getByLabelText('Experience Points') as HTMLInputElement };
};

describe('ExperienceTracker', () => {
  it('shows the XP and how many are still needed', () => {
    const { box } = setup();
    expect(box.value).toBe('1000');
    expect(screen.getByText('250 XP needed to reach level 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Level up character' })).toBeDisabled();
  });

  it('adds with +, takes away with -, and sets a plain number, on Enter', async () => {
    const user = userEvent.setup();
    const { box, onChange } = setup();
    await user.clear(box);
    await user.type(box, '+50{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(1050);
    await user.clear(box);
    await user.type(box, '-100{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(900);
    await user.clear(box);
    await user.type(box, '1500{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(1500);
  });

  it('never goes below 0, and keeps the XP when the text means nothing', async () => {
    const user = userEvent.setup();
    const { box, onChange } = setup();
    await user.clear(box);
    await user.type(box, '-5000{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(0);
    await user.clear(box);
    await user.type(box, 'lots{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(1000);
  });

  it('saves a change on leaving the box', async () => {
    const user = userEvent.setup();
    const { box, onChange } = setup();
    await user.clear(box);
    await user.type(box, '1100');
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith(1100);
  });

  it('opens the level up once the XP is there', async () => {
    const user = userEvent.setup();
    setup(thief(1250));
    expect(screen.getByText('Ready to level up to 2!')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Level up character' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows no count for a custom class', () => {
    setup(createMockCharacter({ class: 'witch', level: 1, xp: 10 }));
    expect(screen.queryByText(/XP needed/)).toBeNull();
  });
});
