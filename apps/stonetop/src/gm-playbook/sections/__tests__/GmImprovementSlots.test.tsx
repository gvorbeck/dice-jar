import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toastModuleMock } from '@/test/toastMock';

vi.mock('@/ui/Toast/ToastContext', () => toastModuleMock());

import { GmImprovementSlots } from '../GmImprovementSlots';
import { makeEmptyGmImprovement } from '../steadingImprovementsData';

describe('GmImprovementSlots', () => {
  it('saves the edited entry when a text field is typed into and blurred', async () => {
    const slot = { ...makeEmptyGmImprovement(), id: 's1', title: '' };
    const other = { ...makeEmptyGmImprovement(), id: 's2', title: 'Keep' };
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<GmImprovementSlots gmImprovements={[slot, other]} onSave={onSave} />);

    const [title] = screen.getAllByRole('textbox', { name: 'Improvement name' });
    await userEvent.type(title!, 'Granary');
    await userEvent.tab();

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const sent = onSave.mock.calls.at(-1)![0].gmImprovements;
    expect(sent).toEqual([expect.objectContaining({ id: 's1', title: 'Granary' })]);
  });

  it("does not resend another tab's edit that arrived while a field was focused", async () => {
    const a = { ...makeEmptyGmImprovement(), id: 'a', title: '' };
    const b = { ...makeEmptyGmImprovement(), id: 'b', title: 'Old' };
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(<GmImprovementSlots gmImprovements={[a, b]} onSave={onSave} />);

    const [title] = screen.getAllByRole('textbox', { name: 'Improvement name' });
    await userEvent.type(title!, 'Mill');
    rerender(<GmImprovementSlots gmImprovements={[a, { ...b, title: 'Theirs' }]} onSave={onSave} />);
    await userEvent.tab();

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls.at(-1)![0].gmImprovements).toEqual([expect.objectContaining({ id: 'a', title: 'Mill' })]);
  });

  it('resends a change after its save failed and was rolled back', async () => {
    const slot = { ...makeEmptyGmImprovement(), id: 'a', completed: false };
    const onSave = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
    render(<GmImprovementSlots gmImprovements={[slot]} onSave={onSave} />);

    const box = () => screen.getByRole('checkbox');
    await userEvent.click(box().closest('label') ?? box());
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(box()).not.toBeChecked());
    await userEvent.click(box().closest('label') ?? box());

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
    expect(onSave.mock.calls[1]![0].gmImprovements).toEqual([expect.objectContaining({ id: 'a', completed: true })]);
  });

  it('resends the entry when it is toggled again while the first save is unresolved', async () => {
    const slot = { ...makeEmptyGmImprovement(), id: 'a', completed: false };
    let release!: () => void;
    const onSave = vi
      .fn()
      .mockImplementationOnce(() => new Promise<void>((r) => (release = r)))
      .mockResolvedValue(undefined);
    render(<GmImprovementSlots gmImprovements={[slot]} onSave={onSave} />);

    const toggle = () => userEvent.click(screen.getByRole('checkbox').closest('label') ?? screen.getByRole('checkbox'));
    await toggle();
    await toggle();
    release();

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
    expect(onSave.mock.calls[1]![0].gmImprovements).toEqual([expect.objectContaining({ id: 'a', completed: false })]);
  });
});
