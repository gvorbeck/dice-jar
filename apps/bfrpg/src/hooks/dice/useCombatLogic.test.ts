import '@/utils'; // first: validation/rules and utils import each other, and this order is the one that loads
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { roll } from '@dice-jar/dice';
import { createMockCharacter, createMockAbilityScores } from '@/test/helpers';
import type { Game } from '@/types';
import { useCombatLogic } from './useCombatLogic';

const addToast = vi.fn();
const players = { list: [] as unknown[] };
vi.mock('@dice-jar/browser', async (importOriginal) => ({ ...(await importOriginal<object>()), useToast: () => ({ addToast }) }));
vi.mock('@/hooks/character', () => ({ usePlayerCharacters: () => ({ playerCharacters: players.list }) }));
vi.mock('@dice-jar/dice', () => ({ roll: vi.fn() }));

const brom = createMockCharacter({
  name: 'Brom',
  abilities: createMockAbilityScores({ dexterity: { value: 15, modifier: 1 } }),
  hp: { current: 8, max: 8, points: [], die: 'd8' } as never,
});
const ada = createMockCharacter({ name: 'Ada' });
let n = 0;
const makeGame = (
  combatants: unknown[] = [
    { name: 'Goblin', ac: 13 },
    { name: 'Brom', isPlayer: true, ac: 15 },
  ],
) => ({ id: `game-${n++}`, combatants }) as unknown as Game;
const setup = (game = makeGame(), onUpdateGame = vi.fn()) => {
  const { result } = renderHook(() => useCombatLogic(game, onUpdateGame));
  return { result, game, onUpdateGame };
};
const rolled = (total: number) => vi.mocked(roll).mockReturnValue({ total } as never);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  players.list = [brom, ada];
  rolled(3);
});

describe('who is in the fight', () => {
  it('takes a player from their character, and a monster from its stats', () => {
    const { result } = setup();
    const [goblin, player] = result.current.currentCombatants;
    expect(goblin).toMatchObject({ name: 'Goblin', ac: 13, dexModifier: 0, hp: { current: 10, max: 10 }, isPlayer: false });
    expect(player).toMatchObject({ name: 'Brom', isPlayer: true, dexModifier: 1 });
    expect(player!.hp).toMatchObject({ current: 8, max: 8 });
  });

  it('offers the players not yet in combat', () => {
    expect(setup().result.current.availablePlayers.map((p) => p.name)).toEqual(['Ada']);
  });

  it('shows nothing without a game', () => {
    const { result } = renderHook(() => useCombatLogic(undefined));
    expect(result.current.currentCombatants).toEqual([]);
    expect(result.current.availablePlayers).toEqual([]);
  });

  it('adds and removes a combatant through the game, with a toast', () => {
    const { result, onUpdateGame } = setup();
    act(() => result.current.addPlayerToCombat(result.current.availablePlayers[0]!));
    expect(onUpdateGame.mock.lastCall![0].combatants.map((c: { name: string }) => c.name)).toEqual(['Goblin', 'Brom', 'Ada']);
    expect(addToast).toHaveBeenLastCalledWith('Ada added to combat', 'success');
    act(() => result.current.removeCombatant(0));
    expect(onUpdateGame.mock.lastCall![0].combatants.map((c: { name: string }) => c.name)).toEqual(['Brom']);
    expect(addToast).toHaveBeenLastCalledWith('Goblin removed from combat', 'success');
  });
});

// Each round 1d6 is rolled for Initiative for each character or monster, adjusted by the Dexterity bonus; high numbers act first (Core Rules p. 51).
describe('initiative', () => {
  it('rolls 1d6 plus the Dexterity bonus for a combatant', () => {
    const { result } = setup();
    act(() => result.current.initializeCombat());
    rolled(3);
    const index = result.current.combatants.findIndex((c) => c.name === 'Brom');
    act(() => result.current.rollInitiativeFor(index));
    expect(roll).toHaveBeenLastCalledWith('1d6');
    expect(result.current.combatants.find((c) => c.name === 'Brom')!.initiative).toBe(4);
  });

  // Halflings add +1 to Initiative die rolls (Core Rules p. 6).
  it("adds a Halfling's +1 to the Dexterity bonus", () => {
    players.list = [
      createMockCharacter({ name: 'Pip', race: 'halfling', abilities: createMockAbilityScores({ dexterity: { value: 15, modifier: 1 } }) }),
    ];
    const { result } = setup(makeGame([{ name: 'Pip', isPlayer: true }]));
    act(() => result.current.initializeCombat());
    rolled(3);
    act(() => result.current.rollInitiativeFor(0));
    expect(result.current.combatants[0]!.initiative).toBe(5);
  });

  it('starts combat using the initiatives already set, and rolling for the rest', () => {
    const { result } = setup();
    act(() => result.current.updatePreCombatInitiative(result.current.currentCombatants[0]!, 6));
    rolled(2);
    act(() => result.current.initializeCombat());
    expect(result.current.isCombatActive).toBe(true);
    expect(result.current.combatants.map((c) => [c.name, c.initiative])).toEqual([['Goblin', 6], ['Brom', 3]]); // prettier-ignore
    expect(addToast).toHaveBeenLastCalledWith('Combat initialized! 2 combatants ready.', 'success');
  });

  it('will not start with nobody to fight', () => {
    const { result } = setup(makeGame([]));
    act(() => result.current.initializeCombat());
    expect(result.current.isCombatActive).toBe(false);
    expect(addToast).toHaveBeenCalledWith('No combatants available to start combat', 'error');
  });

  it('knows when every combatant has an initiative before combat', () => {
    const { result } = setup();
    expect(result.current.allCombatantsHaveInitiative).toBe(false);
    act(() =>
      result.current.updateMultiplePreCombatInitiatives(
        result.current.currentCombatants.map((combatant) => ({ combatant, initiative: 4 })),
      ),
    );
    expect(result.current.allCombatantsHaveInitiative).toBe(true);
  });

  it('rolls again for the monsters only', () => {
    const { result } = setup();
    act(() => result.current.initializeCombat());
    rolled(5);
    act(() => result.current.rollInitiativeForMonsters());
    expect(result.current.combatants.find((c) => c.name === 'Goblin')!.initiative).toBe(5);
    expect(addToast).toHaveBeenLastCalledWith('Rolled initiative for 1 monsters', 'info', true);
  });

  it('sets one initiative by hand, and keeps the turn order sorted', () => {
    const { result } = setup();
    act(() => result.current.initializeCombat());
    act(() =>
      result.current.updateInitiative(
        result.current.combatants.find((c) => c.name === 'Brom')!,
        9,
      ),
    );
    expect(result.current.combatants.find((c) => c.name === 'Brom')!.initiative).toBe(9);
    expect(result.current.currentCombatant?.name).toBe('Brom');
  });
});

describe('the turn order', () => {
  it('moves to the next turn, then a new round with initiative cleared', () => {
    const { result } = setup();
    act(() => result.current.initializeCombat());
    act(() => result.current.nextTurn());
    expect(result.current.currentTurn).toBe(1);
    act(() => result.current.nextTurn());
    expect(result.current.round).toBe(2);
    expect(result.current.currentTurn).toBe(0);
    expect(result.current.combatants.every((c) => c.initiative === 0)).toBe(true);
    expect(addToast).toHaveBeenLastCalledWith('Round 2 begins! Roll initiative for all combatants.', 'info', true);
  });

  it('keeps hit points at zero or more, and can jump to a turn', () => {
    const { result } = setup();
    act(() => result.current.initializeCombat());
    act(() => result.current.updateCombatantHp(result.current.combatants[0]!, -4));
    expect(result.current.combatants[0]!.hp.current).toBe(0);
    act(() => result.current.setCurrentTurn(1));
    expect(result.current.currentTurn).toBe(1);
  });

  it('ends combat and clears everything', () => {
    const { result } = setup();
    act(() => result.current.initializeCombat());
    act(() => result.current.endCombat());
    expect(result.current).toMatchObject({ isCombatActive: false, combatants: [], round: 1 });
    expect(addToast).toHaveBeenLastCalledWith('Combat ended', 'success');
  });

  it('remembers the fight in this browser', () => {
    const game = makeGame();
    const first = renderHook(() => useCombatLogic(game, vi.fn()));
    act(() => first.result.current.initializeCombat());
    first.unmount();
    const again = renderHook(() => useCombatLogic(game, vi.fn()));
    expect(again.result.current.isCombatActive).toBe(true);
    expect(again.result.current.combatants).toHaveLength(2);
  });
});
