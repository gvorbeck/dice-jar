import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RollAffordance } from '../RollAffordance';
import { CharacterRollContext } from '../CharacterRollContext';
import type { CharacterData, RollBand } from '@/types';

const BANDS: RollBand[] = [
  { label: '10+', min: 10, max: null },
  { label: '7-9', min: 7, max: 9 },
  { label: '6-', min: 0, max: 6 },
];

// Force a fixed sequence of d6 values (Math.random returns [0,1); (v*6|0)+1 gives the face).
const seedDice = (faces: number[]) => {
  const values = faces.map((f) => (f - 1) / 6 + 0.001);
  let i = 0;
  vi.spyOn(Math, 'random').mockImplementation(() => values[i++ % values.length]!);
};

afterEach(() => vi.restoreAllMocks());

const renderRoll = (available: boolean, onRoll = vi.fn(), onBurn = vi.fn()) => {
  render(
    <CharacterRollContext.Provider value={{ data: {} as CharacterData, onRoll: vi.fn(), burn: { available, onBurn } }}>
      <RollAffordance stat="WIS" bands={BANDS} mod={0} debilityDisadvantage={false} onRoll={onRoll} />
    </CharacterRollContext.Provider>,
  );
  return { onRoll, onBurn };
};

// Book 1, pp. 74-75, 231: after a roll, spend 2 XP to add +1 (max +1 per roll).
describe('RollAffordance — Burn Brightly', () => {
  it('offers nothing when the character cannot burn', async () => {
    seedDice([3, 3]);
    renderRoll(false);
    await userEvent.click(screen.getByRole('button', { name: 'Roll +WIS' }));
    expect(screen.queryByRole('button', { name: /Burn Brightly/ })).not.toBeInTheDocument();
  });

  it('adds +1, spends the XP and logs the roll as burned', async () => {
    seedDice([3, 3]); // 6, a miss
    const { onRoll, onBurn } = renderRoll(true);
    await userEvent.click(screen.getByRole('button', { name: 'Roll +WIS' }));
    await screen.findByRole('button', { name: /Burn Brightly/ });
    await userEvent.click(screen.getByRole('button', { name: /Burn Brightly/ }));

    expect(onBurn).toHaveBeenCalledTimes(1);
    expect(screen.getByText('= 7')).toBeInTheDocument();
    const last = onRoll.mock.calls.at(-1)![0]!;
    expect(last).toMatchObject({ total: 7, mod: 1, band: '7-9', burned: true });
    expect(last.rollId).toBe(onRoll.mock.calls[0]![0]!.rollId); // the same log entry, updated in place
  });

  it('can be done only once per roll, and the next roll offers it again', async () => {
    seedDice([3, 3]);
    const { onBurn } = renderRoll(true);
    await userEvent.click(screen.getByRole('button', { name: 'Roll +WIS' }));
    await userEvent.click(await screen.findByRole('button', { name: /Burn Brightly/ }));
    expect(screen.queryByRole('button', { name: /Burn Brightly/ })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Re-roll' }));
    await userEvent.click(await screen.findByRole('button', { name: /Burn Brightly/ }));
    expect(onBurn).toHaveBeenCalledTimes(2);
  });

  it('does not mark the next roll as burned in the log, and a double click spends once', async () => {
    seedDice([3, 3, 4, 4]);
    const { onRoll, onBurn } = renderRoll(true);
    await userEvent.click(screen.getByRole('button', { name: 'Roll +WIS' }));
    const burnButton = await screen.findByRole('button', { name: /Burn Brightly/ });
    await userEvent.dblClick(burnButton);
    expect(onBurn).toHaveBeenCalledTimes(1);
    expect(onRoll.mock.calls.at(-1)![0]!).toMatchObject({ burned: true });

    await userEvent.click(screen.getByRole('button', { name: 'Re-roll' }));
    const reroll = onRoll.mock.calls.at(-1)![0]!;
    expect(reroll).not.toHaveProperty('burned');
    expect(reroll.rollId).not.toBe(onRoll.mock.calls[0]![0]!.rollId);
  });

  it('keeps the +1 when advantage is chosen afterwards', async () => {
    seedDice([3, 3, 6]);
    const { onRoll } = renderRoll(true);
    await userEvent.click(screen.getByRole('button', { name: 'Roll +WIS' }));
    await userEvent.click(await screen.findByRole('button', { name: /Burn Brightly/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Adv' }));
    expect(onRoll.mock.calls.at(-1)![0]!).toMatchObject({ mode: 'adv', total: 10 }); // 3+6, +1 burned
  });
});
