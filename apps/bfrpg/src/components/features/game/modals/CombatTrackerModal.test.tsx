import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import type { Game } from '@/types';
import '@/components'; // the barrel first: SectionWrapper imports it back, so loading the modal alone sees it half-built
import CombatTrackerModal from './CombatTrackerModal';

vi.mock('@/hooks/character', async (orig) => ({ ...(await orig<object>()), usePlayerCharacters: () => ({ playerCharacters: [] }) }));
vi.mock('@dice-jar/browser', async (orig) => ({ ...(await orig<object>()), useToast: () => ({ addToast: vi.fn() }) }));

const game = { id: 'g1', name: 'Test', combatants: [{ name: 'Goblin', ac: 13 }] } as Game;
const isActive = () => JSON.parse(localStorage.getItem('combat:g1')!).combatState.isActive;

beforeEach(() => {
  localStorage.setItem(
    'combat:g1',
    JSON.stringify({
      combatState: {
        combatants: [
          {
            id: 'Goblin-0',
            name: 'Goblin',
            ac: 13,
            initiative: 3,
            isPlayer: false,
            _sortId: 1,
            dexModifier: 0,
            hp: { current: 5, max: 5 },
          },
        ],
        currentTurn: 0,
        round: 1,
        isActive: true,
      },
      preCombatInitiatives: {},
    }),
  );
});

describe('CombatTrackerModal shortcuts', () => {
  it('E ends combat from the page, but not while typing in a field', () => {
    render(<CombatTrackerModal isOpen onClose={() => {}} game={game} />);
    const field = document.body.appendChild(document.createElement('input'));
    fireEvent.keyDown(field, { key: 'e' });
    expect(isActive()).toBe(true);

    fireEvent.keyDown(document.body, { key: 'e' });
    expect(isActive()).toBe(false);
  });
});
