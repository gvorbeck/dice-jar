import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Card from './Card';

describe('Card', () => {
  it('defaults to the standard variant, default size and standard shadow', () => {
    render(<Card>body</Card>);
    expect(screen.getByText('body')).toHaveAttribute('data-variant', 'standard');
    expect(screen.getByText('body')).toHaveAttribute('data-size', 'default');
    expect(screen.getByText('body')).toHaveAttribute('data-shadow', 'standard');
  });

  it('marks hover cards and passes variant, size and className through', () => {
    render(
      <Card variant="success" size="compact" hover className="mb-6">
        body
      </Card>,
    );
    const card = screen.getByText('body');
    expect(card).toHaveAttribute('data-hover');
    expect(card).toHaveAttribute('data-variant', 'success');
    expect(card).toHaveClass('card', 'mb-6');
  });
});
