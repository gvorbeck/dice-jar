import { describe, it, expect, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { PageMeta } from '../PageMeta';

afterEach(() => {
  document.head.querySelectorAll('[data-static]').forEach((el) => el.remove());
});

describe('PageMeta', () => {
  it('replaces the static index.html tags instead of duplicating them', () => {
    document.head.insertAdjacentHTML('beforeend', '<meta data-static name="description" content="static" />');
    render(<PageMeta title="Page" description="From the page" />);
    const tags = document.head.querySelectorAll('meta[name="description"]');
    expect(tags).toHaveLength(1);
    expect(tags[0]).toHaveAttribute('content', 'From the page');
    expect(document.title).toBe('Page');
  });

  // index.html ships the same title and description the home page renders; the cleanup must not eat React's copies.
  it('keeps the page title and description when the static tags match, and follows later title changes', () => {
    document.head.insertAdjacentHTML('beforeend', '<meta data-static name="description" content="Same" /><title data-static>Same</title>');
    const { rerender } = render(<PageMeta title="Same" description="Same" />);
    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(document.title).toBe('Same');
    rerender(<PageMeta title="Next" description="Same" />);
    expect(document.title).toBe('Next');
  });

  it('adds noindex only when asked', () => {
    const { rerender } = render(<PageMeta title="A" description="d" />);
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
    rerender(<PageMeta title="A" description="d" noindex />);
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  });
});
