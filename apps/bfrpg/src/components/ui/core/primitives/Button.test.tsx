import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button', () => {
  it('runs onClick and carries its variant and size as classes', async () => {
    const onClick = vi.fn();
    render(
      <Button variant="ghost" size="lg" onClick={onClick}>
        Roll
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Roll' });
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
    expect(button).toHaveClass('btn', 'btn-ghost', 'btn-lg');
  });

  it('does not click while disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('ignores clicks and announces its loading text while loading', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('data-pending');
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('keeps its title as a native tooltip', () => {
    render(<Button title="Settings" aria-label="Settings" />);
    expect(screen.getByRole('button', { name: 'Settings' })).toHaveAttribute('title', 'Settings');
  });
});
