import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMockCharacter, createMockAbilityScores, createMockEquipment } from '@/test/helpers';
import Weight from './Weight';

// Average Strength: 60 lb light and 150 lb heavy; a mule adds 300 and 600 (Core Rules, pp. 42 and 63). Coins weigh 1/20 lb (Equipment Emporium p. 46).
describe('Weight', () => {
  it('shows gear, coins and the totals with a beast of burden', () => {
    const mule = createMockEquipment({ name: 'Mule', category: 'beasts-of-burden', weight: 0, amount: 1, lowCapacity: 300, capacity: 600 });
    const anvil = createMockEquipment({ name: 'Anvil', weight: 50, amount: 1 });
    const character = createMockCharacter({
      abilities: createMockAbilityScores({ strength: { value: 10, modifier: 0 } }),
      equipment: [anvil, mule],
      currency: { copper: 0, silver: 0, electrum: 0, gold: 200, platinum: 0 },
    });
    render(<Weight character={character} />);
    const row = (label: string) => screen.getByText(label).nextElementSibling?.textContent;
    expect(row('Equipment:')).toBe('50.0 lbs');
    expect(row('Coins:')).toBe('10.0 lbs');
    expect(row('Total:')).toBe('60.0 lbs');
    expect(row('Total Light Load:')).toBe('360 lbs');
    expect(row('Total Heavy Load:')).toBe('750 lbs');
  });
});
