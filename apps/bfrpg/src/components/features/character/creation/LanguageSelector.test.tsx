import '@/utils'; // first: validation/rules and utils import each other, and this order is the one that loads
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMockCharacter, createMockAbilityScores } from '@/test/helpers';
import LanguageSelector from './LanguageSelector';

const intelligence = (value: number, modifier: number) => createMockAbilityScores({ intelligence: { value, modifier } });
const setup = (overrides = {}) => {
  const onCharacterChange = vi.fn();
  const character = createMockCharacter({ race: 'human', abilities: intelligence(14, 1), languages: ['Common'], ...overrides });
  render(<LanguageSelector character={character} onCharacterChange={onCharacterChange} />);
  return { onCharacterChange };
};
const lastLanguages = (fn: ReturnType<typeof vi.fn>) => fn.mock.lastCall![0].languages;

describe('LanguageSelector', () => {
  it("lists the race's own languages as automatic", () => {
    setup();
    expect(screen.getByText('Common')).toBeInTheDocument();
    expect(screen.getByText('(automatic)')).toBeInTheDocument();
  });

  it('allows as many bonus languages as the Intelligence bonus', () => {
    setup({ abilities: intelligence(16, 2), languages: ['Common', 'Elvish'] });
    expect(screen.getByText('(1/2 used)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Language \(1 remaining\)/ })).toBeInTheDocument();
  });

  it('explains when Intelligence gives none, and still lets the GM allow some', () => {
    setup({ abilities: intelligence(10, 0) });
    expect(screen.getByText(/doesn't normally allow bonus languages/)).toBeInTheDocument();
    expect(screen.getByText(/GM discretion required/)).toBeInTheDocument();
  });

  it('adds an empty bonus language after the automatic ones', async () => {
    const { onCharacterChange } = setup();
    await userEvent.setup().click(screen.getByRole('button', { name: /Add Language/ }));
    expect(lastLanguages(onCharacterChange)).toEqual(['Common', '']);
  });

  it('changes and removes a bonus language', async () => {
    const { onCharacterChange } = setup({ languages: ['Common', 'Elvish'] });
    fireEvent.change(screen.getByLabelText('Bonus language 1'), { target: { value: 'Dwarvish' } });
    expect(lastLanguages(onCharacterChange)).toEqual(['Common', 'Dwarvish']);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Remove language 1' }));
    expect(lastLanguages(onCharacterChange)).toEqual(['Common']);
  });

  it('trims a language when the box is left, and drops an empty one', () => {
    const first = setup({ languages: ['Common', ' Elvish '] });
    fireEvent.blur(screen.getByLabelText('Bonus language 1'));
    expect(lastLanguages(first.onCharacterChange)).toEqual(['Common', 'Elvish']);
  });

  it('drops a blank language on leaving the box', () => {
    const { onCharacterChange } = setup({ languages: ['Common', '  '] });
    fireEvent.blur(screen.getByLabelText('Bonus language 1'));
    expect(lastLanguages(onCharacterChange)).toEqual(['Common']);
  });

  it('leaves a tidy language alone on blur', () => {
    const { onCharacterChange } = setup({ languages: ['Common', 'Elvish'] });
    fireEvent.blur(screen.getByLabelText('Bonus language 1'));
    expect(onCharacterChange).not.toHaveBeenCalled();
  });
});
