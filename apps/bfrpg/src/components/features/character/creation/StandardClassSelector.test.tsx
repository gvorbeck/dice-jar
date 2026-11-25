import '@/utils'; // first: validation/rules and utils import each other, and this order is the one that loads
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { allClasses } from '@/data';
import { createMockCharacter } from '@/test/helpers';
import { StandardClassSelector } from './StandardClassSelector';

const setup = (overrides = {}, magic = false) => {
  const props = {
    onClassChange: vi.fn(),
    onCharacterChange: vi.fn(),
    onCustomClassMagicToggle: vi.fn(),
  };
  const character = createMockCharacter({ class: '', ...overrides });
  render(
    <StandardClassSelector
      character={character}
      availableClasses={allClasses.filter((c) => !c.supplementalContent)}
      customClassMagicToggle={magic}
      {...props}
    />,
  );
  return { ...props, user: userEvent.setup() };
};

describe('StandardClassSelector', () => {
  // The Fighter rolls 1d8 for hit points and its Prime Requisite is Strength (Core Rules p. 6).
  it('describes the standard class chosen', () => {
    setup({ class: 'fighter' });
    expect(screen.getByText('1d8')).toBeInTheDocument();
    expect(screen.getByText('strength')).toBeInTheDocument();
    expect(screen.getByText('Primary Attribute')).toBeInTheDocument();
  });

  it('picks a class from the list', async () => {
    const { onClassChange, user } = setup({ class: 'fighter' });
    await user.selectOptions(screen.getByLabelText(/Select Class/), 'cleric');
    expect(onClassChange).toHaveBeenCalledWith('cleric');
  });

  it('clears the class when Custom Class is picked, so a name can be typed', async () => {
    const { onClassChange, user } = setup({ class: 'fighter' });
    await user.selectOptions(screen.getByLabelText(/Select Class/), 'custom');
    expect(onClassChange).toHaveBeenCalledWith('');
  });

  describe('a custom class', () => {
    const witch = { class: 'Witch', hp: { current: 4, max: 4, points: [], die: '1d6' } };

    it('shows its name field, hit die and spellcasting', () => {
      setup(witch, true);
      expect(screen.getByRole('heading', { name: 'Custom Class' })).toBeInTheDocument();
      expect(screen.getByDisplayValue('Witch')).toBeInTheDocument();
      expect(screen.getByText('Custom')).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument();
    });

    it('says no spellcasting when the toggle is off', () => {
      setup(witch, false);
      expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('passes on a new name', () => {
      const { onClassChange } = setup(witch);
      fireEvent.change(screen.getByDisplayValue('Witch'), { target: { value: 'Warlock' } });
      expect(onClassChange).toHaveBeenCalledWith('Warlock');
    });

    it('flips the spellcasting toggle', async () => {
      const { onCustomClassMagicToggle, user } = setup(witch, false);
      await user.click(screen.getByRole('switch'));
      expect(onCustomClassMagicToggle).toHaveBeenCalledWith(true);
    });

    it('changes the hit die on the character', async () => {
      const { onCharacterChange, user } = setup(witch);
      await user.selectOptions(screen.getByLabelText(/^Hit Die/), '1d10');
      expect(onCharacterChange.mock.lastCall![0].hp.die).toBe('1d10');
    });
  });
});
