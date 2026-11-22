import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Game } from '@/types';

const resolved = vi.hoisted(() => ({ value: { class: 'thief' } as Record<string, unknown> | undefined }));
vi.mock('@/hooks', () => ({ useDataResolver: () => ({ getResolvedData: () => resolved.value }) }));
vi.mock('./SpellsTab', () => ({ SpellsTab: () => <p>spells panel</p> }));
vi.mock('./BestiaryTab', () => ({ BestiaryTab: () => <p>bestiary panel</p> }));
vi.mock('./SkillsTab', () => ({ SkillsTab: () => <p>skills panel</p> }));
vi.mock('./TurnUndeadTab', () => ({ TurnUndeadTab: () => <p>turn undead panel</p> }));

import { GMBinder } from './GMBinder';

const game = { players: [{ user: 'u', character: 'c' }] } as unknown as Game;

describe('GMBinder', () => {
  it('falls back to Spells when the selected Skills tab goes away, and stays there if it returns', async () => {
    resolved.value = { class: 'thief' };
    const { rerender } = render(<GMBinder game={game} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Skills' }));
    expect(screen.getByText('skills panel')).toBeInTheDocument();

    resolved.value = undefined;
    rerender(<GMBinder game={{ ...game }} />);
    expect(screen.queryByRole('tab', { name: 'Skills' })).toBeNull();
    expect(screen.getByRole('tab', { name: 'Spells' })).toHaveAttribute('aria-selected', 'true');

    resolved.value = { class: 'thief' };
    rerender(<GMBinder game={{ ...game }} />);
    expect(screen.getByRole('tab', { name: 'Spells' })).toHaveAttribute('aria-selected', 'true');
  });
});
