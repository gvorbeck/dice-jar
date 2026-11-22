import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TreasureGeneratorModal from './TreasureGeneratorModal';

vi.mock('@/utils', async (orig) => ({
  ...(await orig<object>()),
  generateTreasure: () => {
    throw new Error('boom');
  },
}));
vi.mock('@dice-jar/browser', async (orig) => ({ ...(await orig<object>()), useToast: () => ({ addToast: vi.fn() }) }));

describe('TreasureGeneratorModal', () => {
  it('links the Generate button to the visible error', async () => {
    render(<TreasureGeneratorModal isOpen onClose={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Generate treasure' }));
    const id = screen.getByRole('button', { name: 'Generate treasure' }).getAttribute('aria-describedby');
    expect(id).toBe('generation-error');
    expect(document.getElementById(id as string)).toHaveTextContent('boom');
  });
});
