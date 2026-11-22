import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Badge from './Badge';
import { Icon } from './Icon';
import Typography from './Typography';

describe('Typography', () => {
  it('picks the element and colour from the variant', () => {
    render(<Typography variant="subHeadingLime">Lime</Typography>);
    const el = screen.getByText('Lime');
    expect(el.tagName).toBe('H4');
    expect(el).toHaveAttribute('data-color', 'lime');
  });

  it('keeps an explicit colour, weight and caller class', () => {
    render(
      <Typography variant="caption" color="muted" weight="bold" className="extra">
        Note
      </Typography>,
    );
    const el = screen.getByText('Note');
    expect(el.tagName).toBe('SPAN');
    expect(el).toHaveAttribute('data-color', 'muted');
    expect(el).toHaveAttribute('data-weight', 'bold');
    expect(el).toHaveClass('typography', 'extra');
  });
});

describe('Badge', () => {
  it('defaults to the status variant at small size', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toHaveAttribute('data-variant', 'status');
    expect(screen.getByText('New')).toHaveAttribute('data-size', 'sm');
  });
});

describe('Icon', () => {
  it('is decorative unless labelled, and carries its size', () => {
    const { container } = render(<Icon name="close" size="lg" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('data-size', 'lg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});
