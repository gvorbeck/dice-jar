import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownText } from './MarkdownText';

describe('MarkdownText', () => {
  it('makes **bold** text strong and leaves the rest plain', () => {
    render(<MarkdownText content="A **bold** word and **another**." />);
    expect(screen.getAllByText(/bold|another/).map((e) => e.tagName)).toEqual(['STRONG', 'STRONG']);
    expect(screen.getByText(/A/, { selector: 'p, div' })).toHaveTextContent('A bold word and another.');
  });

  it('splits blank-line separated paragraphs', () => {
    const { container } = render(<MarkdownText content={'One\n\nTwo\n\n\nThree'} />);
    expect(container.querySelector('.md-text')?.children).toHaveLength(3);
  });

  it('renders a pipe table with its header, skipping the dashed separator', () => {
    render(<MarkdownText content={'| Level | XP |\n| --- | --- |\n| 1 | 0 |\n| 2 | **1,250** |'} />);
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Level', 'XP']);
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByText('1,250').tagName).toBe('STRONG');
  });

  it('does not take a paragraph with one stray pipe for a table', () => {
    render(<MarkdownText content={'Roll 1d6 | or 1d8\nsecond line'} />);
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('shows nothing for empty content and passes a class through', () => {
    const { container } = render(<MarkdownText content=" " className="extra" />);
    expect(container.querySelector('.md-text.extra')?.children).toHaveLength(0);
  });
});
