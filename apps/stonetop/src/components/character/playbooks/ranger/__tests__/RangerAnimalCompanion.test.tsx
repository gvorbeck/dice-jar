import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '@/test/renderWithProviders';
import { screen } from '@testing-library/react';
import { RangerAnimalCompanion } from '../RangerAnimalCompanion';
import type { CharacterData } from '@/types';

// Book 1, p. 143: the Animal Companion always has Loyal to the End.
describe('RangerAnimalCompanion', () => {
  it('shows the Loyal to the End move', () => {
    renderWithProviders(<RangerAnimalCompanion data={{} as CharacterData} onSave={vi.fn().mockResolvedValue(undefined)} />);
    expect(screen.getByText('Loyal to the End')).toBeInTheDocument();
    expect(screen.getByText(/at 0 HP/)).toBeInTheDocument();
  });
});
