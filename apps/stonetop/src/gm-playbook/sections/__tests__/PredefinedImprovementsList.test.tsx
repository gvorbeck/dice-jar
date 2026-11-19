import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { parseSteading } from '@/lib/gameParsing';
import { PredefinedImprovementsList } from '../PredefinedImprovementsList';

// Harnessing the Stream (Book 1, p. 157): "water flowing uphill" saved on its own must not read back as the reservoir too.
describe('Harnessing the Stream boxes', () => {
  it('a new game that ticks only the uphill box reads back with only that box ticked', async () => {
    const onToggleKey = vi.fn();
    render(<PredefinedImprovementsList improvements={{}} onToggleKey={onToggleKey} />);
    await userEvent.click(screen.getByLabelText('Some method of making water flow uphill'));
    const key = onToggleKey.mock.calls[0]![0] as string;
    expect(parseSteading({ improvements: { [key]: true } })?.improvements).toEqual({ [key]: true });
  });

  it('keeps the aqueduct box on the key it always had', async () => {
    const onToggleKey = vi.fn();
    render(<PredefinedImprovementsList improvements={{}} onToggleKey={onToggleKey} />);
    await userEvent.click(screen.getByLabelText("A series of aqueducts, from the Stream's source back to Stonetop"));
    expect(onToggleKey).toHaveBeenCalledWith('harnessing-the-stream__req__b1i1__0');
  });
});
