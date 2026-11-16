import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toastModuleMock } from '@/test/toastMock';

vi.mock('@/components/app', () => toastModuleMock());

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
});
