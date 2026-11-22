import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditableValue from './EditableValue';

const edit = (to: string) => {
  fireEvent.click(screen.getByRole('button', { name: 'HP (click to edit)' }));
  const input = screen.getByRole('spinbutton', { name: 'HP' });
  fireEvent.change(input, { target: { value: to } });
  fireEvent.blur(input);
};

describe('EditableValue', () => {
  it('saves a value typed again after another device changed it', async () => {
    const onChange = vi.fn();
    const ui = (value: number) => <EditableValue value={value} onChange={onChange} editable debounceMs={500} ariaLabel="HP" />;
    const { rerender } = render(ui(5));

    edit('10');
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(10));
    rerender(ui(10));
    rerender(ui(8)); // changed elsewhere
    onChange.mockClear();

    edit('10');
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(10));
  });
});
