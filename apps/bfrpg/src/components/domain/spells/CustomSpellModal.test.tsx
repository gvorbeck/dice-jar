import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomSpellModal from './CustomSpellModal';

vi.mock('@dice-jar/browser', async (orig) => ({ ...(await orig<object>()), useToast: () => ({ addToast: vi.fn() }) }));

describe('CustomSpellModal class choices', () => {
  it('are a labelled group of checkboxes that can be ticked', async () => {
    render(<CustomSpellModal isOpen onClose={() => {}} onSpellAdd={() => {}} />);
    const group = screen.getByRole('group', { name: /Available for Classes/ });
    const boxes = within(group).getAllByRole('checkbox');
    expect(boxes.length).toBeGreaterThan(1);
    await userEvent.click(boxes[0]!.closest('label')!); // react-aria hides the input under its label
    expect(boxes[0]).toBeChecked();
    expect(boxes[1]).not.toBeChecked();
  });
});
