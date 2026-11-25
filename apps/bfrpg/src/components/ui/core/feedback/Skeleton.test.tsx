import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkeletonCard, SkeletonTableRow, SkeletonStatBlock, SkeletonList } from './Skeleton';

describe('Skeleton', () => {
  it('draws a card and a table row, each with a loading label', () => {
    render(
      <>
        <SkeletonCard label="Loading card" size="lg" />
        <SkeletonTableRow />
      </>,
    );
    expect(document.querySelector('[data-variant="card"]')).toHaveAttribute('data-size', 'lg');
    expect(document.querySelector('[data-variant="table-row"]')).toHaveAttribute('aria-label', 'Loading...');
  });

  it('draws a stat block with a title and six stats, or the number asked for', () => {
    const { rerender } = render(<SkeletonStatBlock />);
    expect(screen.getByRole('status', { name: 'Loading character stats...' })).toBeInTheDocument();
    expect(document.querySelectorAll('[data-variant="stat"]')).toHaveLength(6);
    expect(document.querySelector('[data-variant="text"][data-width="60"]')).not.toBeNull();
    rerender(<SkeletonStatBlock stats={2} showTitle={false} />);
    expect(document.querySelectorAll('[data-variant="stat"]')).toHaveLength(2);
    expect(document.querySelector('[data-variant="text"]')).toBeNull();
  });

  it('draws a list of rows, with an avatar circle when asked', () => {
    const { rerender } = render(<SkeletonList items={2} />);
    expect(document.querySelectorAll('.skeleton-row')).toHaveLength(2);
    expect(document.querySelector('[data-variant="circle"]')).toBeNull();
    rerender(<SkeletonList items={2} showAvatar label="Loading characters" />);
    expect(document.querySelectorAll('[data-variant="circle"]')).toHaveLength(2);
    expect(screen.getByRole('status', { name: 'Loading characters' })).toBeInTheDocument();
  });
});
